type Task = {
  id: string;
  schedule: import("korail-ts").Schedule;
  retries: number;
  created_at: string;
  updated_at: string;
};
