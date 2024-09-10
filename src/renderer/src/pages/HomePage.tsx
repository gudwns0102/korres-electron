import { SwapOutlined } from "@ant-design/icons";
import { useQueue } from "@renderer/hooks/useQueue";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, DatePicker, Select, Table, Typography } from "antd";
import dayjs from "dayjs";
import { hhmmss, Schedule, Station, YYYYMMDD } from "korail-ts";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useSession } from "../hooks/useSession";

export function HomePage() {
  const session = useSession();
  const { tasks, addTask, removeTask } = useQueue();

  const [from, setFrom] = useLocalStorage("from", "서울");
  const [to, setTo] = useLocalStorage("to", "부산");
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const YYYYMMDD = useMemo(() => date.format("YYYYMMDD") as YYYYMMDD, [date]);

  const [stations, setStations] = useState<Array<Station>>([]);

  useEffect(() => {
    session.stationdata().then((response) => {
      setStations(response);
    });
  }, []);

  const { data, hasNextPage, isFetching, fetchNextPage } = useInfiniteQuery({
    enabled: Boolean(from && to),
    queryKey: ["schedules", from, to, YYYYMMDD] as const,
    staleTime: Infinity,
    queryFn: async ({ queryKey: [__, from, to, date], pageParam }) => {
      const { data } = await session.scheduleView({
        dep: from!,
        arr: to!,
        txtGoAbrdDt: date,
        txtGoHour: pageParam
      });

      return data.trn_infos.trn_info;
    },
    initialPageParam: undefined as hhmmss | undefined,
    getNextPageParam: (lastPage) => {
      const lastSchedule = lastPage?.[lastPage.length - 1];

      if (!lastSchedule) return null;

      return dayjs(lastSchedule.h_dpt_dt + lastSchedule.h_dpt_tm)
        .add(1, "second")
        .format("HHmmss") as hhmmss;
    }
  });

  const schedules = useMemo(() => data?.pages.flat() ?? [], [data]);

  const fetchAll = useCallback(async () => {
    while ((await fetchNextPage()).hasNextPage) {}
  }, [fetchNextPage]);

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
            }}
            options={stations.map((st) => ({ label: st.stn_nm, value: st.stn_nm }))}
            showSearch
          />
        </div>
        <Button
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <SwapOutlined />
        </Button>
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
            align: "center",
            filters: _.uniq(schedules.map((s) => s.h_trn_clsf_nm)).map((value) => ({
              text: value,
              value
            })),
            onFilter: (value, record) => record.h_trn_clsf_nm === value
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
            align: "center",
            filters: _.uniq(schedules.map((s) => s.h_rsv_psb_nm)).map((value) => ({
              text: value,
              value
            })),
            onFilter: (value, record) => record.h_rsv_psb_nm === value
          },
          {
            title: "버튼",
            key: "button",
            render: (__, record: Schedule) => {
              const task = tasks.find((task) => _.isEqual(task.schedule, record));

              return task ? (
                <Button color="secondary" onClick={() => removeTask(task)}>
                  예매 취소
                </Button>
              ) : (
                <Button type="primary" onClick={() => addTask(record)}>
                  예매 시작
                </Button>
              );
            }
          }
        ]}
        footer={() => (
          <Button disabled={!hasNextPage} loading={isFetching} onClick={fetchAll}>
            더보기
          </Button>
        )}
      />
    </div>
  );
}
