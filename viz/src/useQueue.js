import { useCallback, useRef, useState } from "react";
const TYPES = ["send-email", "process-payment", "generate-report", "resize-image", "sync-data"];
const COLORS = ["blue", "pink", "yellow", "lime", "orange"];
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
let idSeq = 0;
function uid() { return (++idSeq).toString(16).padStart(4, "0"); }
function log(text, cls = "") { return { text, cls }; }
export function useQueue() {
    const [state, setState] = useState({
        queue: [], delayed: [], dlq: [], active: null, done: 0, failed: 0, total: 0,
        logs: [{ text: "// system ready — click ADD JOB to start", cls: "dim" }],
    });
    const timers = useRef([]);
    const addJob = useCallback(() => {
        const job = { id: uid(), type: pick(TYPES), color: pick(COLORS), attempts: 0, maxAttempts: 3, status: "queued" };
        setState(p => ({ ...p, queue: [...p.queue, job], total: p.total + 1, logs: [...p.logs.slice(-49), log(`+ job [${job.id}] ${job.type} → enqueued`, "cy")] }));
    }, []);
    const processJob = useCallback(() => {
        setState(p => {
            if (p.queue.length === 0 || p.active)
                return p;
            const job = { ...p.queue[0], status: "active" };
            const timer = setTimeout(() => { setState(p2 => p2.active?.id === job.id ? { ...p2, active: null, done: p2.done + 1, logs: [...p2.logs.slice(-49), log(`✔ job [${job.id}] ${job.type} completed`, "gr")] } : p2); }, 800 + Math.random() * 600);
            timers.current.push(timer);
            return { ...p, queue: p.queue.slice(1), active: job, logs: [...p.logs.slice(-49), log(`▶ job [${job.id}] ${job.type} → processing…`, "am")] };
        });
    }, []);
    const failJob = useCallback(() => {
        setState(p => {
            let job = null, queue = p.queue, active = p.active, logs = [...p.logs];
            if (active) {
                job = { ...active };
                active = null;
            }
            else if (queue.length > 0) {
                job = { ...queue[0] };
                queue = queue.slice(1);
            }
            if (!job)
                return p;
            job.attempts++;
            logs.push(log(`✕ job [${job.id}] ${job.type} failed (${job.attempts}/${job.maxAttempts})`, "rd"));
            const base = { ...p, queue, active, failed: p.failed + 1, logs };
            if (job.attempts >= job.maxAttempts) {
                job.status = "dlq";
                logs.push(log(`  ☠ job [${job.id}] → DLQ (retries exhausted)`, "rd"));
                return { ...base, dlq: [...base.dlq, job], logs };
            }
            const delay = (1500 + Math.random() * 2000) | 0;
            job.status = "delayed";
            job.scheduledAt = Date.now() + delay;
            logs.push(log(`  ⏳ job [${job.id}] delayed ${delay}ms`, "am"));
            const timer = setTimeout(() => { setState(p2 => { const idx = p2.delayed.findIndex(j => j.id === job.id); if (idx === -1)
                return p2; const promoted = { ...p2.delayed[idx], status: "queued", promoted: true }; const d = [...p2.delayed]; d.splice(idx, 1); return { ...p2, delayed: d, queue: [...p2.queue, promoted], logs: [...p2.logs.slice(-49), log(`  ⟐ job [${job.id}] promoted: delayed → queued`, "cy")] }; }); }, delay);
            timers.current.push(timer);
            return { ...base, delayed: [...base.delayed, job], logs };
        });
    }, []);
    const retryFromDlq = useCallback((jobId) => {
        setState(p => {
            const job = p.dlq.find(j => j.id === jobId);
            if (!job)
                return p;
            const revived = { ...job, attempts: 0, status: "queued", promoted: true };
            return {
                ...p,
                dlq: p.dlq.filter(j => j.id !== jobId),
                queue: [...p.queue, revived],
                logs: [...p.logs.slice(-49), log(`  ↻ job [${jobId}] retried from DLQ → queued`, "cy")],
            };
        });
    }, []);
    const pushToDlq = useCallback((id, type) => {
        const job = { id, type, color: "pink", attempts: 3, maxAttempts: 3, status: "dlq" };
        setState(p => ({ ...p, dlq: [...p.dlq, job], logs: [...p.logs.slice(-49), log(`  ☠ job [${id}] ${type} → DLQ`, "rd")] }));
    }, []);
    const resetAll = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        idSeq = 0;
        setState({ queue: [], delayed: [], dlq: [], active: null, done: 0, failed: 0, total: 0, logs: [{ text: "// system reset", cls: "dim" }] });
    }, []);
    return { state, addJob, processJob, failJob, retryFromDlq, pushToDlq, resetAll };
}
