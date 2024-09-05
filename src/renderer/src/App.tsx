import { CalendarOutlined, LogoutOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Button, Menu, Typography } from "antd";
import axios from "axios";
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
import { useLocalStorage } from "usehooks-ts";
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
  kakao: {
    canSendMessage: boolean;
    sendMessage: (text: string) => void;
  };
}>(undefined as any);

function App(): JSX.Element {
  const [session] = useState(new KorailSession());
  const [me, setMe] = useState<LoginSuccessResponse | null>(null);
  const [tasks, setTasks] = useState<Array<Task>>([]);

  const [authResponse, setAuthResponse] = useLocalStorage<KakaoAuthResponse | undefined>(
    "kakao-auth",
    undefined
  );

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

  console.log(authResponse);

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

            sendMessage("예매가 완료되었습니다. 15분 내로 결제 진행해 주세요.");

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
  }, [tasks, sendMessage]);

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
                      <Menu.Item disabled>
                        <Typography.Text>
                          {window.electron.process.env.npm_package_name}:
                          {window.electron.process.env.npm_package_version}
                        </Typography.Text>
                      </Menu.Item>
                      <Menu.Item>
                        <Button
                          onClick={() => {
                            // window.Kakao.Auth.authorize({
                            //   redirectUri: "http://localhost:8888",
                            //   prompt: "login",
                            //   scope: "talk_message"
                            // });

                            window.open(
                              "https://accounts.kakao.com/login/?login_type=normal&continue=https%3A%2F%2Fkauth.kakao.com%2Foauth%2Fauthorize%3Fis_popup%3Dfalse%26ka%3Dsdk%252F2.7.2%2520os%252Fjavascript%2520sdk_type%252Fjavascript%2520lang%252Fko%2520device%252FMacIntel%2520origin%252Fhttp%25253A%25252F%25252Flocalhost%25253A5173%26scope%3Dtalk_message%26auth_tran_id%3DpxIwiQQmJkwchDO4.QlJnytF3DOxoQOd5qVBdueEhwaSTmKdHT~iQ3Q4_u~G%26response_type%3Dcode%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A8888%26through_account%3Dtrue%26client_id%3D8aa1c2976d9ae39d730c75ba97629117&talk_login=hidden#login"
                            );
                          }}
                        >
                          카카오 로그인 테스트
                        </Button>
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
        },
        kakao: {
          canSendMessage: !!authResponse,
          sendMessage
        }
      }}
    >
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
}

export default App;
