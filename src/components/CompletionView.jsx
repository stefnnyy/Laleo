import { useEffect, useRef } from 'react';
import closeIcon from '../assets/figma/close.svg';
import flame from '../assets/figma/streak-flame.svg';
import check from '../assets/figma/check.svg';

// Copy from the Figma design. Varies by streak day once that flow is designed.
const MESSAGE = [
  'You have spoken a confession for today.',
  'A streak has been started to help you turn this to a habit.',
];

export default function CompletionView({ streak, onHome }) {
  const homeRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => homeRef.current?.focus({ preventScroll: true }), 600);
    return () => clearTimeout(t);
  }, []);

  const { day, week } = streak;
  const [line1, line2] = MESSAGE;

  return (
    <div className="streak-page" role="dialog" aria-labelledby="streak-title">
      <div className="streak-page__top">
        <button type="button" className="icon-btn" onClick={onHome} aria-label="Close">
          <img src={closeIcon} width="24" height="24" alt="" />
        </button>
      </div>

      <div className="streak-page__body">
        <img className="streak-flame" src={flame} width="200" height="200" alt="" />

        <div className="streak-page__texts">
          <h2 id="streak-title" className="streak-page__title">
            Day {day} Completed!
          </h2>
          <p className="streak-page__msg">
            {line1}
            <br />
            {line2}
          </p>
        </div>

        <ol className="streak-week" aria-label="This week">
          {week.map((d) => (
            <li key={d.key} className="streak-day">
              <span className="streak-day__letter" aria-hidden="true">
                {d.letter}
              </span>
              <span
                className={`streak-day__check${d.done ? ' is-done' : ''}${d.today ? ' is-today' : ''}`}
                aria-label={`${d.label}: ${d.done ? 'confessed' : 'not yet'}`}
                role="img"
              >
                {d.done && <img src={check} width="16" height="16" alt="" />}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="streak-page__actions">
        <button ref={homeRef} type="button" className="btn-secondary" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}
