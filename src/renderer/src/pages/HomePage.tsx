import { useQueue } from "@renderer/hooks/useQueue";
import { Button, DatePicker, notification, Select, Table, Typography } from "antd";
import dayjs from "dayjs";
import { Schedule, Station, YYYYMMDD } from "korail-ts";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";

export function HomePage() {
  const session = useSession();
  const { tasks, addTask } = useQueue();

  const [from, setFrom] = useState<string | null>("서울");
  const [to, setTo] = useState<string | null>("부산");
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());

  const [schedules, setSchedules] = useState<Array<Schedule>>([]);

  const fetch = useCallback(() => {
    const txtGoHour = schedules.length === 0 ? undefined : schedules[schedules.length - 1].h_dpt_tm;

    session
      .scheduleView({
        dep: from!,
        arr: to!,
        txtGoAbrdDt: date.format("YYYYMMDD") as YYYYMMDD,
        txtGoHour
      })
      .then((response) => {
        const newSchedules = _.uniqBy(
          [...schedules, ...response.data.trn_infos.trn_info],
          (s) => s.h_trn_no
        );

        if (schedules.length !== newSchedules.length) {
          setSchedules(newSchedules);
        } else {
          notification.open({
            message: "더 이상 열차가 없어요."
          });
        }
      });
  }, [schedules]);

  const [stations, setStations] = useState<Array<Station>>([]);

  useEffect(() => {
    session.stationdata().then((response) => {
      setStations(response);
    });
  }, []);

  useEffect(() => {
    if (schedules.length === 0) fetch();
  }, [fetch]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "8px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text>출발</Typography.Text>
          <Select
            style={{ width: 120 }}
            value={from || undefined}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            onSelect={(value) => {
              setFrom(value);
              setSchedules([]);
            }}
            options={stations.map((st) => ({ label: st.stn_nm, value: st.stn_nm }))}
            showSearch
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text>도착</Typography.Text>
          <Select
            style={{ width: 120 }}
            value={to || undefined}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            onSelect={(value) => {
              setTo(value);
              setSchedules([]);
            }}
            options={stations.map((st) => ({ label: st.stn_nm, value: st.stn_nm }))}
            showSearch
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text>날짜</Typography.Text>
          <DatePicker
            value={date}
            onChange={(d) => {
              setDate(d);
              setSchedules([]);
            }}
            allowClear={false}
            minDate={dayjs()}
          />
        </div>
      </div>
      <Table
        style={{ width: "100%", flex: 1, overflow: "auto" }}
        size="small"
        dataSource={schedules}
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
            dataIndex: "h_dpt_tm_qb",
            key: "h_dpt_tm_qb",
            align: "center"
          },
          {
            title: "도착",
            dataIndex: "h_arv_tm_qb",
            key: "h_arv_tm_qb",
            align: "center"
          },
          {
            title: "예매가능",
            dataIndex: "h_rsv_psb_flg",
            key: "h_rsv_psb_flg",
            align: "center"
          },
          {
            title: "가격",
            dataIndex: "h_rsv_psb_nm",
            key: "h_rsv_psb_nm",
            align: "center"
          },
          {
            title: "버튼",
            key: "button",
            render: (text, record: Schedule) =>
              tasks.find((task) => task.id === record.h_trn_no) ? (
                <Button loading>예매중</Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    addTask(record);
                  }}
                >
                  예매 시작
                </Button>
              )
          }
        ]}
        footer={() => (
          <Button
            onClick={() => {
              fetch();
            }}
          >
            더보기
          </Button>
        )}
      />
    </div>
  );
}
