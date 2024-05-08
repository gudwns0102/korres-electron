import { KorailSession, LoginSuccessResponse, Schedule } from "korail-ts";
import _ from "lodash";
import { createContext, useCallback, useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

type Task = {
  schedule: Schedule;
  retries: number;
};

export const AppContext = createContext<{
  session: KorailSession;
  me: LoginSuccessResponse | null;
  tasks: Task[];
  addTask: (schedule: Schedule) => void;
  removeTask: (h_trn_no: string) => void;
}>(undefined as any);

function App(): JSX.Element {
  const [session] = useState(new KorailSession());
  const [me, setMe] = useState<LoginSuccessResponse | null>(null);
  const [tasks, setTasks] = useState<Array<Task>>([]);

  useEffect(() => {
    session.addEventListener("login", (response) => {
      setMe(response);
    });

    session.addEventListener("logout", () => {
      setMe(null);
    });
  }, []);

  const runTasks = useCallback(async () => {
    const results = await Promise.allSettled(
      tasks.map(({ schedule: s }) => {
        return new Promise<string>((resolve, reject) => {
          session.reserve(s).then((response) => {
            if (response.data.strResult === "FAIL") {
              return reject();
            }

            window.electron.ipcRenderer.send(
              "show-notification",
              "예매가 완료되었습니다.",
              `${s.h_trn_clsf_nm} ${s.h_dpt_tm_qb} - ${s.h_arv_tm_qb}`
            );

            resolve(s.h_trn_no);
          });
        });
      })
    );

    const h_trn_nos = results.map((r) => (r.status === "fulfilled" ? r.value : null));

    setTasks(
      tasks
        .map((t) => ({ ...t, retries: t.retries + 1 }))
        .filter(({ schedule }) => {
          return !h_trn_nos.includes(schedule.h_trn_no);
        })
    );
  }, [tasks]);

  /**
   * run runTasks each 5 seconds
   * do not reset timer even when tasks are changed
   */
  useEffect(() => {
    if (me) {
      const interval = setInterval(() => {
        runTasks();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }

    return;
  }, [me, tasks, runTasks]);

  return (
    <AppContext.Provider
      value={{
        session,
        me,
        tasks,
        addTask: (schedule) => {
          if (_.find(tasks, ({ schedule: s }) => s.h_trn_no === schedule.h_trn_no)) {
            window.alert("이미 추가된 스케줄입니다.");
            return;
          }

          setTasks(
            _.uniqBy([...tasks, { schedule, retries: 0 }], ({ schedule }) => schedule.h_trn_no)
          );
        },
        removeTask: (h_trn_no) => {
          setTasks(tasks.filter(({ schedule: s }) => s.h_trn_no !== h_trn_no));
        }
      }}
    >
      <div>{!me ? <LoginPage /> : <HomePage />}</div>
    </AppContext.Provider>
  );
}

export default App;
