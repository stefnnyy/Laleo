import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBar from './TopBar.jsx';
import Teleprompter from './Teleprompter.jsx';
import VoicePanel from './VoicePanel.jsx';
import CompletionView from './CompletionView.jsx';
import { useSpeechRecognition, speechSupported } from '../hooks/useSpeechRecognition.js';
import { useMicrophone } from '../hooks/useMicrophone.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { tokenize, matchLine, isLineComplete } from '../lib/match.js';
import { recordCompletion } from '../lib/streak.js';

const ADVANCE_MS = 700; // "moving to next line" state duration
const FINAL_HOLD_MS = 900; // beat on the last line before completion
const CARRY_LIMIT = 40;

/**
 * phase: 'ready' | 'active' | 'paused' | 'complete'
 * mode:  'voice' (speech recognition drives progression) | 'manual'
 * issue: null | 'unsupported' | 'denied' | 'nomic' | 'unavailable'
 */
export default function ConfessionMode({ confession, onExit }) {
  const { lines, theme } = confession;
  const title = confession.title ?? theme;
  const tokens = useMemo(() => lines.map((l) => tokenize(l.text)), [lines]);
  const lastIndex = lines.length - 1;

  const [index, setIndex] = useState(0);
  const [phase, setPhaseState] = useState('ready');
  const [mode, setMode] = useState(speechSupported ? 'voice' : 'manual');
  const [issue, setIssue] = useState(speechSupported ? null : 'unsupported');
  const [starting, setStarting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [matched, setMatched] = useState([]);
  const [streak, setStreak] = useState(null);

  const indexRef = useRef(0);
  const phaseRef = useRef('ready');
  const completingRef = useRef(false);
  const mountedRef = useRef(true);
  const timers = useRef({});
  const rootRef = useRef(null);
  // What's been heard for the current line, across recognition sessions.
  const heard = useRef({ carry: [], offset: 0, last: [] });

  const setPhase = (p) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  const resetLineHearing = () => {
    const h = heard.current;
    h.carry = [];
    h.offset = h.last.length;
  };

  // ---- speech + mic -------------------------------------------------------

  const mic = useMicrophone();
  const speech = useSpeechRecognition({
    onWords: (words) => handleWords(words),
    onSessionEnd: () => {
      const h = heard.current;
      h.carry = h.carry.concat(h.last.slice(h.offset)).slice(-CARRY_LIMIT);
      h.offset = 0;
      h.last = [];
    },
    onFatalError: (code) => {
      stopVoice();
      setIssue(code === 'not-allowed' ? 'denied' : code === 'audio-capture' ? 'nomic' : 'unavailable');
      setMode('manual');
      if (phaseRef.current === 'paused') setPhase('active');
    },
  });

  function stopVoice() {
    speech.stop();
    mic.stop();
  }

  async function startVoice() {
    setStarting(true);
    try {
      await mic.start();
    } catch (err) {
      if (!mountedRef.current) return;
      setStarting(false);
      mic.stop();
      const name = err?.name;
      setIssue(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'nomic'
            : 'unavailable',
      );
      setMode('manual');
      setPhase('active');
      return;
    }

    if (!mountedRef.current || phaseRef.current === 'complete') {
      mic.stop();
      return;
    }

    heard.current = { carry: [], offset: 0, last: [] };
    try {
      speech.start();
    } catch {
      mic.stop();
      setStarting(false);
      setIssue('unavailable');
      setMode('manual');
      setPhase('active');
      return;
    }
    setStarting(false);
    setIssue(null);
    setMode('voice');
    setPhase('active');
  }

  // ---- progression --------------------------------------------------------

  function complete() {
    if (!mountedRef.current) return;
    stopVoice();
    setStreak(recordCompletion());
    setMatched([]);
    setAdvancing(false);
    setPhase('complete');
  }

  function goTo(next) {
    if (phaseRef.current === 'complete' || completingRef.current) return;
    if (next < 0) return;
    if (next > lastIndex) {
      complete();
      return;
    }
    if (next === indexRef.current) return;
    indexRef.current = next;
    setIndex(next);
    setMatched([]);
    resetLineHearing();
    setAdvancing(true);
    clearTimeout(timers.current.advance);
    timers.current.advance = setTimeout(() => setAdvancing(false), ADVANCE_MS);
  }

  function handleWords(words) {
    const h = heard.current;
    h.last = words;
    if (h.offset > words.length) h.offset = words.length;
    if (phaseRef.current !== 'active' || completingRef.current) return;

    const i = indexRef.current;
    const target = tokens[i];
    const lineHeard = h.carry.concat(words.slice(h.offset));
    const m = matchLine(target, lineHeard);
    setMatched((prev) => (prev.length === m.length && prev.every((v, k) => v === m[k]) ? prev : m));

    if (!isLineComplete(m, target.length)) return;
    if (i === lastIndex) {
      completingRef.current = true;
      setMatched(target.map((_, k) => k));
      timers.current.final = setTimeout(complete, FINAL_HOLD_MS);
    } else {
      goTo(i + 1);
    }
  }

  // ---- user actions -------------------------------------------------------

  function handleMain() {
    if (starting) return;
    if (phase === 'ready') {
      if (issue === 'unsupported') setPhase('active');
      else startVoice();
    } else if (phase === 'active') {
      if (mode === 'voice') {
        stopVoice();
        setPhase('paused');
      } else if (issue !== 'unsupported') {
        startVoice(); // retry voice after denial / failure
      }
    } else if (phase === 'paused') {
      if (mode === 'voice') startVoice();
      else setPhase('active');
    }
  }

  function handleNext() {
    if (phase === 'ready' && mode === 'manual') setPhase('active');
    goTo(indexRef.current + 1);
  }

  function handlePrev() {
    goTo(indexRef.current - 1);
  }

  function restart() {
    stopVoice();
    setStarting(false);
    Object.values(timers.current).forEach(clearTimeout);
    completingRef.current = false;
    indexRef.current = 0;
    heard.current = { carry: [], offset: 0, last: [] };
    setIndex(0);
    setMatched([]);
    setAdvancing(false);
    setPhase('ready');
    if (speechSupported && issue !== 'denied') {
      setIssue(null);
      setMode('voice');
    }
  }

  function exit() {
    stopVoice();
    onExit?.();
  }

  // ---- effects ------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    const t = timers.current;
    return () => {
      mountedRef.current = false;
      Object.values(t).forEach(clearTimeout);
    };
  }, []);

  useWakeLock(phase === 'active');

  // Keyboard: ←/→ move, Space pauses (or advances in manual mode), Esc exits.
  const keyActions = useRef();
  keyActions.current = { handleMain, handleNext, handlePrev, exit, phase, mode };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      const a = keyActions.current;
      if (a.phase === 'complete') {
        if (e.key === 'Escape') a.exit();
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          a.handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          a.handlePrev();
          break;
        case ' ':
          e.preventDefault();
          if (a.phase === 'active' && a.mode === 'manual') a.handleNext();
          else a.handleMain();
          break;
        case 'Escape':
          a.exit();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onLevel = useCallback((level) => {
    rootRef.current?.style.setProperty('--level', level.toFixed(3));
  }, []);

  const listening = phase === 'active' && mode === 'voice' && speech.active;
  const isComplete = phase === 'complete';
  // Fills line by line, and within a line as each word is spoken.
  const lineShare = tokens[index]?.length ? matched.length / tokens[index].length : 0;
  const progress = isComplete ? 1 : phase === 'ready' ? 0 : (index + lineShare) / lines.length;

  return (
    <main
      ref={rootRef}
      className={`confession phase-${phase}${listening ? ' is-listening' : ''}`}
      aria-label={`${theme} confession`}
    >
      <TopBar
        title={title}
        index={index}
        total={lines.length}
        progress={progress}
        onExit={exit}
        onRestart={restart}
      />

      <section className="confession__stage">
        <Teleprompter
          lines={lines}
          index={index}
          matched={matched}
          phase={phase}
          hidden={isComplete}
          onTap={mode === 'manual' && !isComplete ? handleNext : undefined}
        />
        {isComplete && streak && <CompletionView streak={streak} onHome={exit} />}
      </section>

      <VoicePanel
        hidden={isComplete}
        phase={phase}
        mode={mode}
        issue={issue}
        listening={listening}
        starting={starting}
        advancing={advancing}
        analyser={listening ? mic.analyser : null}
        onLevel={onLevel}
        onMain={handleMain}
        onNext={handleNext}
        isLast={index === lastIndex}
      />
    </main>
  );
}
