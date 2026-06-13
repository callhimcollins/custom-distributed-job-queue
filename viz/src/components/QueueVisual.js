import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function QueueVisual({ queue }) {
    const maxShow = Math.min(queue.length, 12);
    const label = queue.length > 0 ? `${queue.length} queued` : "empty";
    return (_jsxs("div", { className: "queue-visual", children: [_jsxs("h3", { children: [_jsx("span", { children: "Q" }), " QUEUE CONTENTS ", _jsx("span", { style: { background: queue.length > 0 ? "#0055ff" : "#e0e0e0", color: queue.length > 0 ? "white" : "#666", fontSize: 11, padding: "1px 6px" }, children: label })] }), _jsx("div", { className: "queue-slots", children: queue.length === 0 ? (_jsx("span", { style: { color: "#aaa", fontWeight: 700, fontSize: 13, width: "100%", textAlign: "center" }, children: "\u2014 no jobs, queue is idle \u2014" })) : (_jsxs(_Fragment, { children: [queue.slice(0, maxShow).map(job => _jsx(Slot, { job: job }, job.id)), queue.length > 12 && _jsxs("div", { className: "queue-slot dim", children: ["+", queue.length - 12] })] })) })] }));
}
function Slot({ job }) {
    const retried = job.attempts > 0;
    return (_jsxs("div", { className: `queue-slot ${job.color}`, title: `#${job.id} ${job.type}${retried ? ` | retry #${job.attempts}` : ""}`, style: { boxShadow: retried ? "inset 0 0 0 3px #1a1a1a" : "none",
            animation: retried && job.promoted ? "promoGlow 0.6s ease-out" : "none" }, children: [job.id, retried && _jsxs("span", { className: "retry-badge", children: ["\u21BB", job.attempts] })] }));
}
