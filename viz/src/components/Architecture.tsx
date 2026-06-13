import type { Job } from "../types";

interface Props { highlight?: string; dlq?: Job[]; onRetryDlq?: (jobId: string) => void; }

export function Architecture({ highlight = "", dlq = [], onRetryDlq }: Props) {
  const g = (name: string) => highlight === name ? "hl" : "";
  const hasDlq = dlq.length > 0;

  return (
    <div className="arch-wrap">
      <h2><span>01</span> ARCHITECTURE</h2>

      <div className="arch-dlq-container">
        <svg className="arch" viewBox="0 0 880 160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0L10,5L0,10Z" fill="#1a1a1a" />
            </marker>
            <marker id="ar-hl" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0L10,5L0,10Z" fill="#0055ff" />
            </marker>
            <marker id="ar-am" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0L10,5L0,10Z" fill="#ffbe0b" />
            </marker>
          </defs>

          {/* PRODUCER */}
          <g className={g("producer")}>
            <rect x="20" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
            <text x="90" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">PRODUCER</text>
            <text x="90" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">queue.add(job)</text>
          </g>

          {/* Producer → Queue arrow */}
          <g className={g("producer")}>
            <line x1="160" y1="70" x2="280" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
            <text x="220" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">RPUSH</text>
          </g>

          {/* MAIN QUEUE */}
          <g className={g("queue")}>
            <rect x="280" y="20" width="140" height="100" rx="0" fill="#0055ff" stroke="#1a1a1a" strokeWidth="4" />
            <text x="350" y="62" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">MAIN</text>
            <text x="350" y="82" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">QUEUE</text>
            <text x="350" y="103" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="white" opacity=".8">Redis LIST</text>
          </g>

          {/* Queue → Worker arrow */}
          <g className={g("worker")}>
            <line x1="420" y1="70" x2="540" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
            <text x="480" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">BLPOP</text>
          </g>

          {/* WORKER */}
          <g className={g("worker")}>
            <rect x="540" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
            <text x="610" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">WORKER</text>
            <text x="610" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">handler(job)</text>
          </g>

          {/* Worker → Results arrow */}
          <line x1="680" y1="70" x2="780" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
          <text x="730" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">HSET</text>

          {/* RESULTS */}
          <rect x="780" y="30" width="80" height="80" rx="0" fill="#06d6a0" stroke="#1a1a1a" strokeWidth="4" />
          <text x="820" y="66" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" fill="#1a1a1a">RESULTS</text>
          <text x="820" y="85" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#1a1a1a" fontWeight="700">Redis HASH</text>

          {/* RETRY PATH */}
          <g className={g("retry")}>
            <path d="M610,110 L610,140 L530,140" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar-am)" />
            <rect x="430" y="128" width="100" height="24" fill="#ffbe0b" stroke="#1a1a1a" strokeWidth="2" />
            <text x="480" y="144" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="#1a1a1a" fontWeight="700">DELAYED</text>
          </g>

          {/* PROMOTE path */}
          <g className={g("retry")}>
            <path d="M430,140 L380,140 L350,120" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar-am)" />
          </g>

          {/* DLQ PATH */}
          <g className={g("dlq")}>
            <path d="M610,110 L610,155 L780,155" fill="none" stroke="#ff006e" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#ar)" />
          </g>
        </svg>

        {/* DLQ hover panel — sits below the SVG but inside the container */}
        <div className={`arch-dlq-hover-area ${hasDlq ? "has-jobs" : ""}`}>
          <div className="arch-dlq-box" style={{background:"#ff006e",border:"3px solid #1a1a1a",padding:"3px 12px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"DM Sans",fontSize:10,fontWeight:700,color:"white",textTransform:"uppercase",letterSpacing:1}}>DLQ</span>
            <span style={{fontFamily:"Bebas Neue",fontSize:18,color:"white"}}>{dlq.length}</span>
            {hasDlq && <span style={{fontSize:10,color:"rgba(255,255,255,.6)",marginLeft:"auto"}}>hover to review →</span>}
          </div>

          <div className="arch-dlq-drawer">
            <div className="arch-dlq-inner">
              {!hasDlq ? (
                <div className="arch-dlq-empty">No dead letters.</div>
              ) : (
                dlq.map(job => (
                  <div key={job.id} className="arch-dlq-row">
                    <span className="arch-dlq-id">{job.id}</span>
                    <span className="arch-dlq-type">{job.type}</span>
                    <span className="arch-dlq-attempts">{job.attempts}/{job.maxAttempts}</span>
                    <button className="arch-dlq-btn" onClick={() => onRetryDlq?.(job.id)}>↻ Retry</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
