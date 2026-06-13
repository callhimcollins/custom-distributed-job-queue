interface Props { onAdd: () => void; onProcess: () => void; onFail: () => void; onReset: () => void; }
export function Controls({ onAdd, onProcess, onFail, onReset }: Props) {
  return (<div className="controls">
    <button className="btn btn-add" onClick={onAdd}>+ ADD JOB</button>
    <button className="btn btn-process" onClick={onProcess}>▶ PROCESS</button>
    <button className="btn btn-fail" onClick={onFail}>✕ FAIL</button>
    <button className="btn btn-reset" onClick={onReset}>⟳ RESET</button>
  </div>);
}
