import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Controls({ onAdd, onProcess, onFail, onReset, onLearn, learning }) {
    return (_jsxs("div", { className: "controls", children: [_jsx("button", { className: "btn btn-add", onClick: onAdd, children: "+ ADD JOB" }), _jsx("button", { className: "btn btn-process", onClick: onProcess, children: "\u25B6 PROCESS" }), _jsx("button", { className: "btn btn-fail", onClick: onFail, children: "\u2715 FAIL" }), _jsx("button", { className: "btn btn-reset", onClick: onReset, children: "\u27F3 RESET" }), _jsx("button", { className: "btn", style: { background: "#1a1a1a", color: "white", minWidth: 140 }, onClick: onLearn, disabled: learning, children: learning ? "⟳ LEARNING…" : "✦ LEARN" })] }));
}
