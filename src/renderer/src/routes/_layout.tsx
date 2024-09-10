import { CalendarOutlined, LogoutOutlined, ShoppingOutlined } from "@ant-design/icons";
import { AppContext } from "@renderer/App";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Input, Menu, Typography } from "antd";
import { useContext } from "react";

export const Route = createFileRoute("/_layout")({
  component: () => {
    const { me, session, tasks, mail } = useContext(AppContext);

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
              <Input
                placeholder="알림이메일 주소를 입력하세요"
                value={mail.email || ""}
                onChange={(e) => mail.setEmail(e.target.value)}
              />
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
