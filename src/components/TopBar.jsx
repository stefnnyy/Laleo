import closeIcon from '../assets/figma/close.svg';
import refreshIcon from '../assets/figma/refresh.svg';

export default function TopBar({ title, index, total, progress, onExit, onRestart }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <header className="topbar">
      <div className="topbar__row">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="Close confession">
          <img src={closeIcon} width="24" height="24" alt="" />
        </button>

        <h1 className="topbar__title">{title}</h1>

        <button type="button" className="icon-btn" onClick={onRestart} aria-label="Restart from the beginning">
          <img src={refreshIcon} width="24" height="24" alt="" />
        </button>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`Line ${Math.min(index + 1, total)} of ${total}`}
        aria-label="Confession progress"
      >
        <span className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </header>
  );
}
