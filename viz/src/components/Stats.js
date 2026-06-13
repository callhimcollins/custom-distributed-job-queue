import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const cards = [
    { key: "queue", label: "Enqueued", cls: "blue", extract: (s) => s.queue.length },
    { key: "active", label: "Processing", cls: "orange", extract: (s) => s.active ? 1 : 0 },
    { key: "done", label: "Completed", cls: "lime", extract: (s) => s.done },
    { key: "failed", label: "Failed", cls: "pink", extract: (s) => s.failed },
    { key: "dlq", label: "Dead Letter", cls: "orange", extract: (s) => s.dlq.length },
    { key: "total", label: "Total Produced", cls: "", extract: (s) => s.total },
];
export function Stats({ state }) {
    return (_jsx("div", { className: "stats", children: cards.map(c => (_jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-label", children: c.label }), _jsx("div", { className: `stat-value ${c.cls}`, children: c.extract(state) })] }, c.key))) }));
}
