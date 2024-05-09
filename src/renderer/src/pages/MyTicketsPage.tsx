import { usePromise } from "../hooks/usePromise";
import { useSession } from "../hooks/useSession";

export function MyTicketsPage() {
  const session = useSession();
  const [{ data }] = usePromise(session.myTicketList, { variables: [] });

  console.log(data);

  return <div>MyTicketsPage</div>;
}
