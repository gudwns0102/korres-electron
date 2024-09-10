import { CalendarOutlined, LogoutOutlined, ShoppingOutlined } from "@ant-design/icons";
import { AppContext } from "@renderer/App";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Button, Menu, Typography } from "antd";
import { useContext } from "react";

export const Route = createFileRoute("/_layout")({
  component: () => {
    const { me, session, tasks } = useContext(AppContext);

    return (
      <div style={{ display: "flex" }}>
        <Menu style={{ width: 256, height: "100vh", overflow: "scroll" }} mode="inline">
          <Menu.ItemGroup title="예매">
            <Menu.Item icon={<CalendarOutlined />}>
              <Link to="/">열차 목록</Link>
            </Menu.Item>
            <Menu.Item icon={<ShoppingOutlined />}>
              <Link to="/tasks">매크로 내역</Link>
              {tasks.length > 0 && (
                <Typography.Text type="secondary"> ({tasks.length})</Typography.Text>
              )}
            </Menu.Item>
            <Menu.Item icon={<ShoppingOutlined />}>
              <Link to="/tickets">나의 티켓</Link>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title="인증정보">
            <Menu.Item disabled>
              <Typography.Text>You are: {me?.strCustNm}</Typography.Text>
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={session?.logout}>
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
    );
  }
});
