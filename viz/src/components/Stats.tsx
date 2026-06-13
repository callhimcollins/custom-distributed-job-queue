import type { QueueState } from "../useQueue";
interface Props { state: QueueState; }
const cards: { key: keyof QueueState; label: string; cls: string; extract: (s: QueueState) => number }[] = [
  { key:"queue", label:"Enqueued", cls:"blue", extract:(s)=>s.queue.length },
  { key:"active", label:"Processing", cls:"orange", extract:(s)=>s.active?1:0 },
  { key:"done", label:"Completed", cls:"lime", extract:(s)=>s.done },
  { key:"failed", label:"Failed", cls:"pink", extract:(s)=>s.failed },
  { key:"dlq", label:"Dead Letter", cls:"orange", extract:(s)=>s.dlq.length },
  { key:"total", label:"Total Produced", cls:"", extract:(s)=>s.total },
];
export function Stats({ state }: Props) {
  return (<div className="stats">{cards.map(c=>(
    <div className="stat" key={c.key}>
      <div className="stat-label">{c.label}</div>
      <div className={`stat-value ${c.cls}`}>{c.extract(state)}</div>
    </div>
  ))}</div>);
}
