import Waveform from './Waveform.jsx';
import micIcon from '../assets/figma/mic.svg';
import { ChevronDown, PauseIcon } from './Icons.jsx';

const ISSUE_COPY = {
  unsupported: 'Voice follow isn’t available in this browser. Tap the button to move line by line.',
  denied: 'Microphone access was denied. Tap the text to move on, or tap the mic to try again.',
  nomic: 'No microphone found. Tap the text to move on, or connect one and tap the mic.',
  unavailable: 'Speech recognition stopped. Tap the text to move on, or tap the mic to try again.',
};

function getHint({ phase, mode, issue, listening, starting, advancing, isLast }) {
  if (starting) return 'Waiting for microphone access…';
  if (phase === 'ready') {
    if (issue === 'unsupported') return ISSUE_COPY.unsupported;
    if (issue) return ISSUE_COPY[issue];
    return 'Tap the mic to speak and the words will follow along';
  }
  if (phase === 'paused') return 'Paused. Tap the mic to carry on.';
  if (mode === 'manual') return ISSUE_COPY[issue ?? 'unavailable'];
  if (advancing) return 'Next line';
  if (listening) return isLast ? 'Listening. Speak the final line.' : 'Listening. Read each line aloud.';
  return 'Starting…';
}

export default function VoicePanel(props) {
  const { hidden, phase, mode, issue, listening, starting, analyser, onLevel, onMain, onNext, isLast } = props;
  const hint = getHint(props);

  // The main button: mic to start/resume/retry, pause while listening,
  // and "next line" when the browser can't do speech at all.
  const unsupported = issue === 'unsupported';
  let label;
  let icon;
  let onClick = onMain;
  if (unsupported) {
    label = isLast ? 'Finish confession' : phase === 'ready' ? 'Begin' : 'Next line';
    icon = <ChevronDown width={26} height={26} />;
    onClick = onNext;
  } else if (phase === 'active' && mode === 'voice') {
    label = 'Pause';
    icon = <PauseIcon width={24} height={24} />;
  } else {
    label = phase === 'paused' ? 'Resume listening' : mode === 'manual' && phase === 'active' ? 'Try microphone again' : 'Start speaking';
    icon = <img src={micIcon} width="24" height="24" alt="" />;
  }

  return (
    <footer className={`voice${hidden ? ' is-hidden' : ''}`} aria-hidden={hidden || undefined}>
      <p className="voice__hint" role="status" aria-live="polite">
        {hint}
      </p>

      <Waveform analyser={analyser} frozen={mode === 'voice' && (phase === 'paused' || (phase === 'active' && !listening))} onLevel={onLevel} />

      <button
        type="button"
        className={`mic-btn${listening ? ' is-live' : ''}${starting ? ' is-starting' : ''}`}
        onClick={onClick}
        disabled={starting}
        aria-label={label}
        title={label}
      >
        {icon}
      </button>
    </footer>
  );
}
