interface Props { onAdd: () => void; onProcess: () => void; onFail: () => void; onReset: () => void; onLearn: () => void; learning: boolean; }
export function Controls({ onAdd, onProcess, onFail, onReset, onLearn, learning }: Props) {
  return (<div className="controls">
    <button className="btn btn-add" onClick={onAdd}>+ ADD JOB</button>
    <button className="btn btn-process" onClick={onProcess}>▶ PROCESS</button>
    <button className="btn btn-fail" onClick={onFail}>✕ FAIL</button>
    <button className="btn btn-reset" onClick={onReset}>⟳ RESET</button>
    <button className="btn" style={{background:"#1a1a1a",color:"white",minWidth:140}} onClick={onLearn} disabled={learning}>{learning?"⟳ LEARNING…":"✦ LEARN"}</button>
  </div>);
}
