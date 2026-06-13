import type { Job } from "../types";
interface Props { queue: Job[]; }
export function QueueVisual({ queue }: Props) {
  const maxShow = Math.min(queue.length, 12);
  const label = queue.length > 0 ? `${queue.length} queued` : "empty";
  return (<div className="queue-visual"><h3><span>Q</span> QUEUE CONTENTS <span style={{background:queue.length>0?"#0055ff":"#e0e0e0",color:queue.length>0?"white":"#666",fontSize:11,padding:"1px 6px"}}>{label}</span></h3>
    <div className="queue-slots">
      {queue.length === 0 ? (
        <span style={{color:"#aaa",fontWeight:700,fontSize:13,width:"100%",textAlign:"center"}}>— no jobs, queue is idle —</span>
      ) : (<>{queue.slice(0,maxShow).map(job=><Slot key={job.id} job={job} />)}{queue.length>12&&<div className="queue-slot dim">+{queue.length-12}</div>}</>)}
    </div></div>);
}
function Slot({ job }: { job: Job }) {
  const retried = job.attempts > 0;
  return (<div className={`queue-slot ${job.color}`} title={`#${job.id} ${job.type}${retried?` | retry #${job.attempts}`:""}`}
    style={{boxShadow:retried?"inset 0 0 0 3px #1a1a1a":"none",
    animation:retried&&job.promoted?"promoGlow 0.6s ease-out":"none"}}>
    {job.id}{retried&&<span className="retry-badge">↻{job.attempts}</span>}
  </div>);
}
