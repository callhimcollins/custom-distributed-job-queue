import type { LogEntry } from "../useQueue";
interface Props { logs: LogEntry[]; }
export function EventLog({ logs }: Props) {
  return (<div className="log"><h3>EVENT LOG</h3><div className="log-box">{logs.map((e,i)=><span key={i} className={e.cls}>{e.text}</span>)}</div></div>);
}
