import { Fragment, useEffect, useMemo, useRef } from 'react';
import { tokenize } from '../lib/match.js';

/** The current line, split into words so spoken words darken as you go. */
function ActiveLine({ text, matched }) {
  const words = useMemo(() => {
    let t = 0;
    return text.split(/\s+/).map((word) => {
      const n = tokenize(word).length;
      const range = [t, t + n];
      t += n;
      return { word, range };
    });
  }, [text]);
  const spoken = useMemo(() => new Set(matched), [matched]);

  return words.map(({ word, range }, k) => {
    let hit = false;
    for (let i = range[0]; i < range[1]; i++) if (spoken.has(i)) hit = true;
    return (
      <Fragment key={k}>
        <span className={`w${hit ? ' is-spoken' : ''}`}>{word}</span>
        {k < words.length - 1 ? ' ' : ''}
      </Fragment>
    );
  });
}

// How much of the previous line stays visible above the current one.
const LEAD = 44;

export default function Teleprompter({ lines, index, matched, phase, hidden, onTap }) {
  const cardRef = useRef(null);
  const lineRefs = useRef([]);
  const first = useRef(true);

  // Keep the current line near the top of the card.
  useEffect(() => {
    const card = cardRef.current;
    const el = lineRefs.current[index];
    if (!card || !el) return;
    const top = index === 0 ? 0 : Math.max(0, el.offsetTop - LEAD);
    card.scrollTo({ top, behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [index]);

  const started = phase !== 'ready';

  return (
    <div
      ref={cardRef}
      className={`card${hidden ? ' is-hidden' : ''}${onTap ? ' is-tappable' : ''}`}
      aria-hidden={hidden || undefined}
      onClick={onTap}
    >
      <ol className="card__lines">
        {lines.map((line, i) => {
          const done = started && i < index;
          const active = started && i === index;
          return (
            <li
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={`line${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              {active ? <ActiveLine text={line.text} matched={matched} /> : line.text}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {hidden ? '' : `Line ${index + 1}: ${lines[index]?.text}`}
      </p>
    </div>
  );
}
