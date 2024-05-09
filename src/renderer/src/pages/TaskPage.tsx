import { LoadingOutlined } from "@ant-design/icons";
import { useQueue } from "@renderer/hooks/useQueue";
import { Button, Spin, Table, Typography } from "antd";

export function TaskPage() {
  const { tasks, removeTask } = useQueue();

  return (
    <Table
      size="small"
      dataSource={tasks}
      columns={[
        { key: "id", title: "열차 번호", dataIndex: "id" },
        {
          key: "schedule",
          title: "일정",
          render: (__, record) => {
            return (
              <div>
                <Typography.Text>
                  {record.schedule.h_dpt_rs_stn_nm}: {record.schedule.h_dpt_tm_qb}
                </Typography.Text>
                <Typography.Text>{" -> "}</Typography.Text>
                <Typography.Text>
                  {record.schedule.h_arv_rs_stn_nm}: {record.schedule.h_arv_tm_qb}
                </Typography.Text>
              </div>
            );
          }
        },
        {
          key: "created_at",
          title: "예약 시간",
          dataIndex: "created_at",
          render: (text) => new Date(text).toLocaleString()
        },
        {
          key: "retries",
          title: "재시도 횟수",
          dataIndex: "retries",
          render: (text) => (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {text}
              <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
            </div>
          )
        },
        {
          key: "cancel",
          title: "예약 취소",
          render: (__, record) => {
            return <Button onClick={() => removeTask(record)}>예약 취소</Button>;
          }
        }
      ]}
    />
  );
}
