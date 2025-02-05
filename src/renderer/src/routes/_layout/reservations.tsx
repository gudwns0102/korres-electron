import _ from "lodash";
import { useSession } from "@renderer/hooks/useSession";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Table } from "antd";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";

const formatTime = (str: string) => {
  if (str.length !== 6) return null; // Ensure the input is 6 characters long
  const parts = _.chunk(str.split(""), 2).map((pair) => pair.join(""));
  return `${parts[0]}:${parts[1]}`;
};

export const Route = createFileRoute("/_layout/reservations")({
  component: Page
});

function Page() {
  const session = useSession();

  const { data, refetch } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data } = await session.reservationView();
      return data.jrny_infos.jrny_info.map((info) => info.train_infos.train_info).flat();
    }
  });

  console.log(data);

  return (
    <Table
      style={{ width: "100%", flex: 1, overflow: "auto" }}
      size="small"
      dataSource={data}
      pagination={false}
      columns={[
        {
          title: "열차",
          dataIndex: "h_trn_clsf_nm",
          key: "h_trn_clsf_nm",
          align: "center"
        },
        {
          title: "출발",
          dataIndex: "h_dpt_tm",
          key: "h_dpt_tm",
          align: "center",
          render: (value, train) =>
            dayjs(train.h_run_dt).format("YYYY년 MM월 DD일") + " " + formatTime(value)
        },
        {
          title: "도착",
          dataIndex: "h_arv_tm",
          key: "h_arv_tm",
          align: "center",
          render: formatTime
        },
        {
          title: "좌석수",
          dataIndex: "h_tot_seat_cnt",
          key: "h_tot_seat_cnt",
          align: "center",
          render: Number
        },
        {
          title: "예약 취소",
          key: "h_dpt_tm",
          render: (__, record) => (
            <Button
              onClick={async () => {
                await session.cancelReserve(record);
                refetch();
              }}
            >
              예약 취소
            </Button>
          )
        }
      ]}
    ></Table>
  );
}
