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
  const { state, addJob, processJob, failJob, retryFromDlq, resetAll } = useQueue();
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
      await wait(500);
    }
    await wait(1500);
    setStepLabel("All 10 jobs are now in the queue, waiting to be picked up by a worker.");
    setHighlight("queue");
    await wait(2000);

    // ── Step 2: Queue → Worker (process 3) ──
    setStepLabel("Worker calls BLPOP to pull a job from the queue and processes it...");
    setHighlight("worker");
    for (let i = 0; i < 3; i++) {
      processJob();
      await wait(2500);
    }
    await wait(1500);

    // ── Step 3: Fail jobs to show retry + DLQ ──
    setStepLabel("A handler throws an error! The job is moved to the Delayed set for retry...");
    setHighlight("retry");
    processJob();
    await wait(600);
    failJob(); // 1/3 → delayed
    await wait(600);
    processJob();
    await wait(600);
    failJob(); // 1/3 → delayed
    await wait(600);
    processJob();
    await wait(600);
    failJob(); // 1/3 → delayed
    await wait(2000);

    setStepLabel("Delayed jobs are promoted back to the main queue after their backoff timer expires.");
    setHighlight("queue");
    await wait(3000);

    setStepLabel("The retried job is processed again but fails a second time — back to Delayed...");
    setHighlight("retry");
    processJob();
    await wait(600);
    failJob(); // 2/3 → delayed
    await wait(2500);

    setStepLabel("Third attempt — this job keeps failing. One more failure and it's dead lettered.");
    processJob();
    await wait(600);
    failJob(); // 3/3 → DLQ
    await wait(1500);
    setStepLabel("Retries exhausted! The job lands in the Dead Letter Queue for manual inspection.");
    setHighlight("dlq");
    await wait(2500);

    // ── Step 4: Finish remaining jobs ──
    setStepLabel("Worker continues processing the remaining jobs...");
    setHighlight("worker");
    for (let i = 0; i < 4; i++) {
      processJob();
      await wait(2500);
    }
    await wait(1500);

    setStepLabel("Learn complete! Hover over DLQ to review dead letters and send them back to the queue — DLQ is meant for manual inspection.");
    await wait(2000);
    setHighlight("");
    setStepLabel("");
    setLearning(false);
  }, [learning, resetAll, addJob, processJob, failJob]);

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
      <Architecture highlight={highlight} dlq={state.dlq} onRetryDlq={retryFromDlq} />
      <Controls onAdd={addJob} onProcess={processJob} onFail={failJob} onReset={resetAll} onLearn={startLearn} learning={learning} />
      <Stats state={state} />
      <QueueVisual queue={state.queue} />
      <Lifecycle state={state} />
      <EventLog logs={state.logs} />
    </div>
  );
}
