import { createFileRoute } from "@tanstack/react-router";
import { Button } from "antd";

export const Route = createFileRoute("/_layout/tickets")({
  component: () => (
    <div>
      <Button onClick={() => {}}>전송</Button>
    </div>
  )
});
