import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AppContext } from "@renderer/App";
import { Button, Form, FormProps, Input, Typography } from "antd";
import { useContext } from "react";
import { useSession } from "../hooks/useSession";

type FieldType = {
  id?: string;
  password?: string;
};

export const Route = createRootRoute({
  component: () => {
    const { me } = useContext(AppContext);

    if (!me) return <LoginPage />;

    return <Outlet />;
  }
});

function LoginPage() {
  const session = useSession();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (values.id && values.password) {
      try {
        await session.login(values.id, values.password);
      } catch (error) {
        window.alert(error);
      }
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div
      style={{
        margin: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh"
      }}
    >
      <Form
        style={{ width: "100%", maxWidth: 300 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Typography.Title level={3}>Korres</Typography.Title>
        <Form.Item<FieldType>
          name="id"
          rules={[{ required: true, message: "코레일 회원번호를 입력해 주세요" }]}
        >
          <Input autoFocus placeholder="코레일 회원번호" defaultValue={""} />
        </Form.Item>
        <Form.Item<FieldType>
          name="password"
          rules={[{ required: true, message: "코레일 회원번호를 입력해 주세요" }]}
        >
          <Input type="password" placeholder="비밀번호" defaultValue={""} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
