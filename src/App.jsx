import { useState } from 'react';
import ConfessionMode from './components/ConfessionMode.jsx';
import { getConfession } from './data/confessions.js';

// Standalone harness for Confession Mode. Pick sample content with
// ?theme=new-week | faith | peace | healing
export default function App() {
  const theme = new URLSearchParams(window.location.search).get('theme') ?? 'new-week';
  const confession = getConfession(theme);
  const [session, setSession] = useState(1);
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div className="closed">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setSession((s) => s + 1);
            setOpen(true);
          }}
        >
          Open Confession
        </button>
      </div>
    );
  }

  return <ConfessionMode key={session} confession={confession} onExit={() => setOpen(false)} />;
}
