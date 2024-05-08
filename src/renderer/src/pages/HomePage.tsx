import { css } from "@emotion/css";
import { useQueue } from "@renderer/hooks/useQueue";
import { Button, DatePicker, Select, Table } from "antd";
import dayjs from "dayjs";
import { hhmmss, Schedule, Station, YYYYMMDD } from "korail-ts";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";
export function HomePage() {
  const session = useSession();
  const { tasks, addTask, removeTask } = useQueue();

  const [stations, setStations] = useState<Array<Station>>([]);
  const [schedules, setSchedules] = useState<Array<Schedule>>([]);

  const [from, setFrom] = useState<string | null>("서울");
  const [to, setTo] = useState<string | null>("부산");
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());

  const fetchAll = useCallback(async () => {
    if (from && to && date) {
      let schedules: Array<Schedule> = [];
      let trial = 0;

      while (trial < 5) {
        trial = trial + 1;

        const txtGoHour =
          schedules.length === 0
            ? "000000"
            : ((Number(schedules[schedules.length - 1].h_dpt_tm_qb) + 1).toString() as hhmmss);

        const response = await session.scheduleView({
          dep: from,
          arr: to,
          txtGoAbrdDt: date.format("YYYYMMDD") as YYYYMMDD,
          txtGoHour
        });

        if (response.data.strResult === "FAIL") {
          break;
        }

        const trn_info = response.data.trn_infos.trn_info;

        if (trn_info.length === 0) {
          break;
        }

        schedules.concat(trn_info);
      }

      setSchedules(schedules);
    }
  }, [from, to, date, session, setSchedules]);

  useEffect(() => {
    session.stationdata().then((response) => {
      setStations(response);
    });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div
      className={css`
        display: flex;
        gap: 16px;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
        `}
      >
        <div
          className={css`
            flex: 1;
          `}
        >
          <span>출발</span>
          <Select
            style={{ width: 120 }}
            value={from || undefined}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            onSelect={(value) => {
              setFrom(value);
            }}
            options={stations.map((st) => ({ label: st.stn_nm, value: st.stn_nm }))}
            showSearch
          />
        </div>
        <div>
          <span>도착</span>
          <Select
            style={{ width: 120 }}
            value={to || undefined}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            onSelect={(value) => {
              setTo(value);
            }}
            options={stations.map((st) => ({ label: st.stn_nm, value: st.stn_nm }))}
            showSearch
          />
        </div>
        <div>
          <span>날짜</span>
          <DatePicker value={date} onChange={setDate} allowClear={false} minDate={dayjs()} />
        </div>
        <Table
          size="small"
          dataSource={schedules}
          columns={[
            {
              title: "열차",
              dataIndex: "h_trn_clsf_nm",
              key: "h_trn_clsf_nm",
              width: 80,
              align: "center"
            },
            {
              title: "출발",
              dataIndex: "h_dpt_tm_qb",
              key: "h_dpt_tm_qb",
              width: 80,
              align: "center"
            },
            {
              title: "도착",
              dataIndex: "h_arv_tm_qb",
              key: "h_arv_tm_qb",
              width: 80,
              align: "center"
            },
            {
              title: "예매가능",
              dataIndex: "h_rsv_psb_flg",
              key: "h_rsv_psb_flg",
              width: 80,
              align: "center"
            },
            {
              title: "가격",
              dataIndex: "h_rsv_psb_nm",
              key: "h_rsv_psb_nm",
              width: 200,
              align: "center"
            },
            {
              title: "버튼",
              key: "button",
              width: 80,
              render: (text, record: Schedule) =>
                tasks.find((task) => task.schedule.h_trn_no === record.h_trn_no) ? (
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
        />
      </div>
      <div
        id="tasks"
        className={css`
          display: flex;
          flex-direction: column;
          flex: 1;
        `}
      >
        {tasks.map(({ schedule: s, retries }) => (
          <div
            key={s.h_trn_no}
            className={css`
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <div>
              {s.h_trn_no}({retries})
            </div>
            <button
              onClick={() => {
                removeTask(s.h_trn_no);
              }}
            >
              제거
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
