import { CalendarOutlined, LogoutOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Menu, Typography } from "antd";
import { KorailSession, LoginSuccessResponse, Schedule } from "korail-ts";
import _ from "lodash";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Link,
  Outlet,
  Route,
  RouterProvider
} from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { TaskPage } from "./pages/TaskPage";

export const AppContext = createContext<{
  session: KorailSession;
  me: LoginSuccessResponse | null;
  tasks: Task[];
  addTask: (schedule: Schedule) => void;
  removeTask: (task: Task) => void;
}>(undefined as any);

function App(): JSX.Element {
  const [session] = useState(new KorailSession());
  const [me, setMe] = useState<LoginSuccessResponse | null>(null);
  const [tasks, setTasks] = useState<Array<Task>>([]);

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
    if (me && tasks.length > 0) {
      const interval = setInterval(() => {
        runTasks();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }

    return;
  }, [me, tasks, runTasks]);

  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          !me ? (
            <Route path="*" element={<LoginPage />}></Route>
          ) : (
            <Route
              path="*"
              element={
                <div style={{ display: "flex" }}>
                  <Menu style={{ width: 256, height: "100vh", overflow: "scroll" }} mode="inline">
                    <Menu.ItemGroup title="예매">
                      <Menu.Item key="/" icon={<CalendarOutlined />}>
                        <Link to="/">열차 목록</Link>
                      </Menu.Item>
                      <Menu.Item key="/macros" icon={<ShoppingOutlined />}>
                        <Link to="/macros">매크로 내역</Link>
                      </Menu.Item>
                      <Menu.Item key="/tickets" icon={<ShoppingOutlined />}>
                        <Link to="/tickets">나의 티켓</Link>
                      </Menu.Item>
                    </Menu.ItemGroup>
                    <Menu.Divider />
                    <Menu.ItemGroup title="인증정보">
                      <Menu.Item disabled>
                        <Typography.Text>You are: {me.strCustNm}</Typography.Text>
                      </Menu.Item>
                      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={session.logout}>
                        로그아웃
                      </Menu.Item>
                    </Menu.ItemGroup>
                  </Menu>
                  <div style={{ flex: 1, height: "100vh", overflow: "scroll" }}>
                    <Outlet />
                  </div>
                </div>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="macros" element={<TaskPage />} />
              <Route path="tickets" element={<MyTicketsPage />} />
            </Route>
          )
        )
      ),
    [me]
  );

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
            _.uniqBy(
              [
                ...tasks,
                {
                  id: schedule.h_trn_no,
                  schedule,
                  retries: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ],
              ({ id }) => id
            )
          );
        },
        removeTask: ({ id }) => {
          setTasks(tasks.filter((task) => task.id !== id));
        }
      }}
    >
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
}

export default App;
