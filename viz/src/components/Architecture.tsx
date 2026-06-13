export function Architecture() {
  return (
    <div className="arch-wrap">
      <h2><span>01</span> ARCHITECTURE</h2>
      <svg className="arch" viewBox="0 0 880 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0L10,5L0,10Z" fill="#1a1a1a" />
          </marker>
        </defs>
        <rect x="20" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
        <text x="90" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">PRODUCER</text>
        <text x="90" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">queue.add(job)</text>
        <line x1="160" y1="70" x2="280" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
        <text x="220" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">RPUSH</text>
        <rect x="280" y="20" width="140" height="100" rx="0" fill="#0055ff" stroke="#1a1a1a" strokeWidth="4" />
        <text x="350" y="62" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">MAIN</text>
        <text x="350" y="82" textAnchor="middle" fontFamily="Bebas Neue" fontSize="18" fill="white">QUEUE</text>
        <text x="350" y="103" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="white" opacity=".8">Redis LIST</text>
        <line x1="420" y1="70" x2="540" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
        <text x="480" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">BLPOP</text>
        <rect x="540" y="30" width="140" height="80" rx="0" fill="white" stroke="#1a1a1a" strokeWidth="4" />
        <text x="610" y="72" textAnchor="middle" fontFamily="Bebas Neue" fontSize="22" fill="#1a1a1a">WORKER</text>
        <text x="610" y="92" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="#a0a0a0" fontWeight="700">handler(job)</text>
        <line x1="680" y1="70" x2="780" y2="70" stroke="#1a1a1a" strokeWidth="4" markerEnd="url(#ar)" />
        <text x="730" y="55" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#a0a0a0" fontWeight="700">HSET</text>
        <rect x="780" y="30" width="80" height="80" rx="0" fill="#06d6a0" stroke="#1a1a1a" strokeWidth="4" />
        <text x="820" y="66" textAnchor="middle" fontFamily="Bebas Neue" fontSize="14" fill="#1a1a1a">RESULTS</text>
        <text x="820" y="85" textAnchor="middle" fontFamily="DM Sans" fontSize="9" fill="#1a1a1a" fontWeight="700">Redis HASH</text>

        { /* Worker → Delayed (retries remain) */ }
        <path d="M610,110 L610,140 L530,140" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar)" />
        { /* Worker → DLQ (retries exhausted) */ }
        <path d="M610,110 L610,155 L780,155" fill="none" stroke="#ff006e" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#ar)" />
        { /* Delayed → Main Queue (promotion) */ }
        <path d="M430,140 L380,140 L350,120" fill="none" stroke="#ffbe0b" strokeWidth="4" markerEnd="url(#ar)" />
        <rect x="430" y="128" width="100" height="24" fill="#ffbe0b" stroke="#1a1a1a" strokeWidth="2" />
        <text x="480" y="144" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="#1a1a1a" fontWeight="700">DELAYED</text>
        <rect x="740" y="140" width="80" height="20" fill="#ff006e" stroke="#1a1a1a" strokeWidth="2" />
        <text x="780" y="154" textAnchor="middle" fontFamily="DM Sans" fontSize="10" fill="white" fontWeight="700">DLQ</text>
      </svg>
    </div>
  );
}
