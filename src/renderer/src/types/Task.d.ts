type Task = {
  id: string;
  schedule: import("korail-ts").Schedule;
  seat_count: number;
  interval: number;
  retries: number;
  created_at: string;
  updated_at: string;
  latest_result?: { strResult: "SUCC" | "FAIL"; h_msg_cd: string; h_msg_txt: string };
};
