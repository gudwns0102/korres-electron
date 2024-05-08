import { Button, Form, FormProps, Input } from "antd";
import { useSession } from "../hooks/useSession";

type FieldType = {
  id?: string;
  password?: string;
};

export function LoginPage() {
  const session = useSession();

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    if (values.id && values.password) session.login(values.id, values.password);
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form onFinish={onFinish} onFinishFailed={onFinishFailed}>
      <Form.Item<FieldType>
        name="id"
        rules={[{ required: true, message: "코레일 회원번호를 입력해 주세요" }]}
      >
        <Input autoFocus placeholder="코레일 회원번호" />
      </Form.Item>
      <Form.Item<FieldType>
        name="password"
        rules={[{ required: true, message: "코레일 회원번호를 입력해 주세요" }]}
      >
        <Input type="password" placeholder="비밀번호" autoFocus />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
