import type { Job } from "../types";

interface Props { highlight?: string; dlq?: Job[]; onRetryDlq?: (jobId: string) => void; doneCount?: number; }

export function Architecture({ highlight = "", dlq = [], onRetryDlq, doneCount = 0 }: Props) {
  const g = (name: string) => highlight === name ? "hl" : "";
  const hasDlq = dlq.length > 0;

  return (
    <div className="arch-wrap">
      <h2><span>01</span> ARCHITECTURE</h2>

      <svg className="arch" viewBox="0 0 880 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0L10,5L0,10Z" fill="#1a1a1a" />
          </marker>
          <marker id="ar-am" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0L10,5L0,10Z" fill="#ffbe0b" />
          </marker>
        </defs>

        <g className={g("producer")}>
          <rect x="20" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
          <text x="90" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">PRODUCER</text>
          <text x="90" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">queue.add(job)</text>
          <line x1="160" y1="70" x2="280" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
          <text x="220" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">RPUSH</text>
        </g>

        <g className={g("queue")}>
          <rect x="280" y="20" width="140" height="100" rx="0" fill="#0055ff" stroke="#1a1a1a" strokeWidth="4" />
          <text x="350" y="62" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">MAIN</text>
          <text x="350" y="82" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">QUEUE</text>
          <text x="350" y="103" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="white" opacity=".8">Redis LIST</text>
        </g>

        <g className={g("worker")}>
          <line x1="540" y1="70" x2="420" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
          <text x="480" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">BLPOP</text>
          <rect x="540" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
          <text x="610" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">WORKER</text>
          <text x="610" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">handler(job)</text>
        </g>

        <line x1="680" y1="70" x2="750" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
        <text x="715" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">HSET</text>

        <rect x="750" y="30" width="80" height="80" rx="0" fill="#06d6a0" stroke="#1a1a1a" strokeWidth="4" />
        <text x="790" y="66" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" fill="#1a1a1a">RESULTS</text>
        <text x="790" y="85" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#1a1a1a" fontWeight="700">Redis HASH</text>

        {/* Completed check indicator */}
        <g className={g("done")}>
          <rect x="835" y="28" width="28" height="24" rx="0" fill="#06d6a0" stroke="#1a1a1a" strokeWidth="3" />
          <text x="849" y="46" textAnchor="middle" fontFamily="Bebas Neue" fontSize="16" fill="#1a1a1a" className={`done-badge ${doneCount > 0 ? "pulse" : ""}`}>{doneCount}</text>
        </g>

        <g className={g("retry")}>
          <path d="M610,110 L610,140 L530,140" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar-am)" />
          <rect x="430" y="128" width="100" height="24" fill="#ffbe0b" stroke="#1a1a1a" strokeWidth="2" />
          <text x="480" y="144" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="#1a1a1a" fontWeight="700">DELAYED</text>
          <path d="M430,140 L380,140 L350,120" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar-am)" />
        </g>

        <g className={g("dlq")}>
          <path d="M610,110 L610,145 L730,145" fill="none" stroke="#ff006e" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#ar)" />
          <rect x="730" y="130" width="70" height="24" rx="0" fill="#ff006e" stroke="#1a1a1a" strokeWidth="3" />
          <text x="765" y="147" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="white" fontWeight="700">DLQ</text>
          {dlq.length > 0 && <><rect x="804" y="128" width="22" height="20" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="3" /><text x="815" y="143" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" fill="#ff006e">{dlq.length}</text></>}
        </g>
      </svg>

      {/* DLQ hover bar — sits below the SVG */}
      <div className={`arch-dlq-bar ${hasDlq ? "has-jobs" : ""}`}>
        <div className="arch-dlq-bar-label">
          <span className="arch-dlq-bar-icon">☠</span>
          <span className="arch-dlq-bar-title">DEAD LETTER QUEUE</span>
          <span className="arch-dlq-bar-count">{dlq.length}</span>
          {hasDlq && <span className="arch-dlq-bar-hint">hover to review →</span>}
        </div>

        <div className="arch-dlq-panel">
          <div className="arch-dlq-panel-inner">
            {!hasDlq ? (
              <div className="arch-dlq-panel-empty">No dead letters.</div>
            ) : (
              dlq.map(job => (
                <div key={job.id} className="arch-dlq-job">
                  <span className="arch-dlq-job-id">{job.id}</span>
                  <span className="arch-dlq-job-type">{job.type}</span>
                  <span className="arch-dlq-job-attempts">{job.attempts}/{job.maxAttempts}</span>
                  <button className="arch-dlq-job-btn" onClick={() => onRetryDlq?.(job.id)}>↻ Retry</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
