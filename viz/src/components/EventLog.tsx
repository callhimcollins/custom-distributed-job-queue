import { useEffect, useRef } from "react";
import type { LogEntry } from "../useQueue";
interface Props { logs: LogEntry[]; }
export function EventLog({ logs }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (<div className="log"><h3>EVENT LOG</h3><div className="log-box" ref={ref}>{logs.map((e,i)=><span key={i} className={e.cls}>{e.text}</span>)}</div></div>);
}
