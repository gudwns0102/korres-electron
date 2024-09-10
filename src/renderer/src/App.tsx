import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axios from "axios";
import { produce } from "immer";
import { KorailSession, LoginSuccessResponse, Schedule } from "korail-ts";
import _ from "lodash";
import { createContext, useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { routeTree } from "./routeTree.gen";

export const AppContext = createContext<{
  session: KorailSession;
  me: LoginSuccessResponse | null;
  tasks: Task[];
  addTask: (schedule: Schedule) => void;
  removeTask: (task: Task) => void;
  kakao: {
    canSendMessage: boolean;
    sendMessage: (text: string) => void;
  };
  mail: {
    email: string | null;
    setEmail: (email: string) => void;
    removeEmail: () => void;
  };
}>(undefined as any);

const memoryHistory = createMemoryHistory({
  initialEntries: ["/"] // Pass your initial url
});

const router = createRouter({
  routeTree,
  history: memoryHistory
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App(): JSX.Element {
  const [session] = useState(new KorailSession());
  const [me, setMe] = useState<LoginSuccessResponse | null>(null);
  const [tasks, setTasks] = useLocalStorage<Array<Task>>("tasks", []);
  const [latestResults, setLatestResult] = useState<
    Array<{ strResult: "SUCC" | "FAIL"; h_msg_cd: string; h_msg_txt: string }>
  >([]);

  const [authResponse, setAuthResponse] = useLocalStorage<KakaoAuthResponse | undefined>(
    "kakao-auth",
    undefined
  );

  const [email, setEmail] = useLocalStorage("email", null as string | null);

  /**
   * For dynamic link
   */
  useEffect(() => {
    window.electron.ipcRenderer.on("kakao-login-done", (__, args: KakaoAuthResponse) => {
      setAuthResponse(args);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners("kakao-login-done");
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!authResponse) return;

      axios.post(
        "https://kapi.kakao.com/v2/api/talk/memo/default/send",
        `template_object={
        "object_type": "text",
        "text": "${text}",
        "link": {
            "web_url": "https://developers.kakao.com",
            "mobile_web_url": "https://developers.kakao.com"
        },
        "button_title": "바로 확인"
    }`,
        {
          headers: {
            Authorization: `Bearer ${authResponse.access_token}`,
            "Content-type": "application/x-www-form-urlencoded",
            Charset: "UTF-8"
          }
        }
      );
    },
    [authResponse]
  );

  useEffect(() => {
    session.addEventListener("login", (response) => {
      setMe(response);
      window.localStorage.setItem("me", JSON.stringify(response));
    });

    session.addEventListener("logout", () => {
      setMe(null);
      window.localStorage.removeItem("me");
    });

    session.myTicketList().then((response) => {
      if (response.data.strResult === "SUCC") {
        const meStr = window.localStorage.getItem("me");

        if (meStr) {
          setMe(JSON.parse(meStr));
        }
      }
    });
  }, []);

  /**
   * run runTasks each 5 seconds
   * do not reset timer even when tasks are changed
   */
  useEffect(() => {
    if (me && tasks.length > 0) {
      const intervals = tasks.map((task, index) =>
        setInterval(async () => {
          const response = await session.reserve(task.schedule);

          if (response.data.strResult === "SUCC") {
            window.electron.ipcRenderer.send(
              "show-notification",
              "예매가 완료되었습니다.",
              `${task.schedule.h_trn_clsf_nm} ${task.schedule.h_dpt_tm_qb} - ${task.schedule.h_arv_tm_qb}`
            );

            if (email) {
              console.log(
                `http://localhost:8888/notify?email=${email}&subject=${encodeURI(`${task.schedule.h_dpt_rs_stn_nm} ${task.schedule.h_dpt_tm_qb} ~ ${task.schedule.h_arv_rs_stn_nm} ${task.schedule.h_arv_tm_qb}`)}&content=${encodeURI("예매 확인 후 결제해 주세요")}`
              );
              axios.post(
                `http://localhost:8888/notify?email=${email}&subject=${encodeURI(`${task.schedule.h_dpt_rs_stn_nm} ${task.schedule.h_dpt_tm_qb} ~ ${task.schedule.h_arv_rs_stn_nm} ${task.schedule.h_arv_tm_qb}`)}&content=${encodeURI("예매 확인 후 결제해 주세요")}`
              );
            }

            sendMessage("예매가 완료되었습니다. 15분 내로 결제 진행해 주세요.");
          }

          setLatestResult(
            produce((draft) => {
              draft[index] = response.data;
            })
          );

          setTasks(
            produce((draft) => {
              draft[index].retries += 1;
            })
          );

          return task;
        }, task.interval)
      );

      return () => {
        intervals.forEach((interval) => clearInterval(interval));
      };
    }

    return;
  }, [me, tasks, sendMessage]);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider
        value={{
          session,
          me,
          tasks: tasks.map((task, index) => ({ ...task, latest_result: latestResults[index] })),
          addTask: (schedule) => {
            if (_.find(tasks, ({ schedule: s }) => _.isEqual(s, schedule))) {
              window.alert("이미 추가된 스케줄입니다.");
              return;
            }

            setTasks([
              ...tasks,
              {
                id: schedule.h_trn_no,
                schedule,
                retries: 0,
                interval: 5000,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          },
          removeTask: (task) => {
            setTasks(tasks.filter((t) => !_.isEqual(task.schedule, t.schedule)));
          },
          kakao: {
            canSendMessage: !!authResponse,
            sendMessage
          },
          mail: {
            email,
            setEmail,
            removeEmail: () => setEmail(null)
          }
        }}
      >
        <RouterProvider router={router} />
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
