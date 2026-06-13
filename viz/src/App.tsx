import { useCallback, useState } from "react";
import { useQueue } from "./useQueue";
import { Architecture } from "./components/Architecture";
import { Controls } from "./components/Controls";
import { Stats } from "./components/Stats";
import { QueueVisual } from "./components/QueueVisual";
import { Lifecycle } from "./components/Lifecycle";
import { EventLog } from "./components/EventLog";

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function App() {
  const { state, addJob, processJob, failJob, retryFromDlq, pushToDlq, resetAll } = useQueue();
  const [highlight, setHighlight] = useState("");
  const [learning, setLearning] = useState(false);
  const [stepLabel, setStepLabel] = useState("");

  const startLearn = useCallback(async () => {
    if (learning) return;
    setLearning(true);
    resetAll();
    await wait(400);

    // ── Step 1: Producer → Queue (add 10 jobs) ──
    setStepLabel("Producer is creating 10 jobs and pushing them into the main queue via RPUSH...");
    setHighlight("producer");
    for (let i = 0; i < 10; i++) {
      addJob();
      await wait(1000);
    }
    await wait(3000);
    setStepLabel("All 10 jobs are now in the queue, waiting to be picked up by a worker.");
    setHighlight("queue");
    await wait(4000);

    // ── Step 2: Queue → Worker (process 3) ──
    setStepLabel("Worker calls BLPOP to pull a job from the queue and processes it...");
    setHighlight("worker");
    for (let i = 0; i < 3; i++) {
      processJob();
      await wait(5000);
    }
    await wait(3000);

    // ── Step 3: Show retry → DLQ ──
    setStepLabel("Job fails! It goes to Delayed for retry...");
    setHighlight("retry");
    processJob();
    await wait(1000);
    failJob(); // 1/3 → delayed
    await wait(1500);
    processJob(); await wait(3500);
    processJob(); await wait(3500);
    processJob(); await wait(3500);

    setStepLabel("Job promoted back to queue after backoff timer. Let's retry...");
    setHighlight("queue");
    await wait(5000);

    setStepLabel("Fails again! One more retry attempt...");
    setHighlight("retry");
    processJob();
    await wait(1000);
    failJob(); // 2/3 → delayed
    await wait(1500);
    processJob(); await wait(3500);
    processJob(); await wait(3500);
    setHighlight("queue");
    await wait(5000);

    setStepLabel("Retries exhausted! Sending to Dead Letter Queue.");
    setHighlight("dlq");
    pushToDlq("a1b2", "send-email");
    pushToDlq("c3d4", "process-payment");
    await wait(4000);
    setHighlight("");
    setStepLabel("");
    setLearning(false);
  }, [learning, resetAll, addJob, processJob, failJob, pushToDlq]);

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>JOB QUEUE</h1>
          <div className="header-sub">Redis-Backed · Distributed Architecture</div>
        </div>
        <div className="tag">React + TS</div>
      </header>
      {learning && (
        <div className="learn-notice">
          <span className="learn-icon">✦</span>
          <div className="learn-body">
            <div className="learn-text">Learning mode — steps are slowed down so you can follow the flow.</div>
            <div className="learn-step">{stepLabel || "Starting..."}</div>
          </div>
        </div>
      )}
      <Architecture highlight={highlight} dlq={state.dlq} onRetryDlq={retryFromDlq} doneCount={state.done} />
      <Controls onAdd={addJob} onProcess={processJob} onFail={failJob} onReset={resetAll} onLearn={startLearn} learning={learning} />
      <Stats state={state} />
      <QueueVisual queue={state.queue} />
      <Lifecycle state={state} />
      <EventLog logs={state.logs} />
    </div>
  );
}
