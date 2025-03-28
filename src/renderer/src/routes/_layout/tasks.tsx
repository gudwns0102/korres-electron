import { LoadingOutlined } from "@ant-design/icons";
import { AppContext } from "@renderer/App";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Spin, Table, Typography } from "antd";
import dayjs from "dayjs";
import { useContext } from "react";
import styles from "./tasks.module.css";

export const Route = createFileRoute("/_layout/tasks")({
  component: Page
});

function Page() {
  const { tasks, removeTask } = useContext(AppContext);

  return (
    <Table
      size="small"
      dataSource={tasks}
      pagination={false}
      columns={[
        {
          key: "schedule",
          title: "일정",
          render: (__, record) => {
            return (
              <div>
                <Typography.Text style={{ fontSize: "smaller" }}>
                  {dayjs(record.schedule.h_dpt_dt).format("YYYY년 MM월 DD일 (ddd)")}
                </Typography.Text>
                <div>
                  <Typography.Text>
                    {record.schedule.h_dpt_rs_stn_nm} {record.schedule.h_dpt_tm_qb}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: "smaller" }}>{" → "}</Typography.Text>
                  <Typography.Text>
                    {record.schedule.h_arv_rs_stn_nm} {record.schedule.h_arv_tm_qb}
                  </Typography.Text>
                </div>
              </div>
            );
          }
        },
        {
          key: "seat_count",
          title: "좌석수",
          dataIndex: "seat_count"
        },
        {
          key: "latest_result",
          title: "최근 결과",
          dataIndex: "latest_result",
          render: (value: Task["latest_result"], task) => {
            return (
              <Typography.Text key={task.retries} className={styles.container}>
                {value?.h_msg_txt}
              </Typography.Text>
            );
          }
        },
        {
          key: "retries",
          title: "재시도 횟수",
          dataIndex: "retries",
          width: 100,
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
          width: 100,
          render: (__, record) => {
            return <Button onClick={() => removeTask(record)}>예약 취소</Button>;
          }
        }
      ]}
    />
  );
}
