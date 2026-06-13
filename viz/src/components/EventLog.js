import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function EventLog({ logs }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current)
            ref.current.scrollTop = ref.current.scrollHeight;
    }, [logs]);
    return (_jsxs("div", { className: "log", children: [_jsx("h3", { children: "EVENT LOG" }), _jsx("div", { className: "log-box", ref: ref, children: logs.map((e, i) => _jsx("span", { className: e.cls, children: e.text }, i)) })] }));
}
