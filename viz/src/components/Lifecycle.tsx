import type { QueueState } from "../useQueue";

interface Props { state: QueueState; }

export function Lifecycle({ state }: Props) {
  return (
    <div className="lifecycle">
      <h3>LIFECYCLE</h3>
      <div className="lc-grid">
        <div className="lc-node queued"><span className="lc-label">Queued</span><span className="lc-count">{state.queue.length}</span></div>
        <span className="lc-arrow">→</span>
        <div className="lc-node active"><span className="lc-label">Active</span><span className="lc-count">{state.active?1:0}</span></div>
        <span className="lc-arrow">→</span>
        <div className="lc-node done"><span className="lc-label">Completed</span><span className="lc-count">{state.done}</span></div>
        <span className="lc-arrow" style={{color:"#ffbe0b"}}>↻</span><span className="lc-retry">RETRY</span>
        <div className="lc-node delayed"><span className="lc-label">Delayed</span><span className="lc-count">{state.delayed.length}</span></div>
        <span className="lc-arrow">→</span>
        <div className="lc-node dead"><span className="lc-label">DLQ</span><span className="lc-count">{state.dlq.length}</span></div>
      </div>
    </div>
  );
}
