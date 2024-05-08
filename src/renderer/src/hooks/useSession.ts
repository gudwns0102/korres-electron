import { AppContext } from "@renderer/App";
import { useContext } from "react";

export function useSession() {
  return useContext(AppContext).session;
}
