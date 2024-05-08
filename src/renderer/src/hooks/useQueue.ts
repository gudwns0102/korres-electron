import { AppContext } from "@renderer/App";
import { useContext } from "react";

export function useQueue() {
  const { tasks, addTask, removeTask } = useContext(AppContext);

  return {
    tasks,
    addTask,
    removeTask
  };
}
