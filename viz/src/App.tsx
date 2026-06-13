import { useQueue } from "./useQueue";
import { Architecture } from "./components/Architecture";
import { Controls } from "./components/Controls";
import { Stats } from "./components/Stats";
import { QueueVisual } from "./components/QueueVisual";
import { Lifecycle } from "./components/Lifecycle";
import { EventLog } from "./components/EventLog";

export default function App() {
  const { state, addJob, processJob, failJob, resetAll } = useQueue();
  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>JOB QUEUE</h1>
          <div className="header-sub">Redis-Backed · Distributed Architecture</div>
        </div>
        <div className="tag">React + TS</div>
      </header>
      <Architecture />
      <Controls onAdd={addJob} onProcess={processJob} onFail={failJob} onReset={resetAll} />
      <Stats state={state} />
      <QueueVisual queue={state.queue} />
      <Lifecycle state={state} />
      <EventLog logs={state.logs} />
    </div>
  );
}
