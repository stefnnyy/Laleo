import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenize } from '../lib/match.js';

const SR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export const speechSupported = Boolean(SR);

// Errors that mean recognition cannot continue in this session.
const FATAL = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
  'language-not-supported',
  'bad-grammar',
]);

/**
 * Thin wrapper around the Web Speech API.
 * - onWords(words): every recognised word in the current recognition session
 *   (finals + interim), re-sent on each result event.
 * - onSessionEnd(): the browser ended a recognition session (we restart it).
 * - onFatalError(code): recognition can't continue.
 */
export function useSpeechRecognition({ onWords, onSessionEnd, onFatalError, lang = 'en-US' }) {
  const handlers = useRef({});
  handlers.current = { onWords, onSessionEnd, onFatalError };

  const recRef = useRef(null);
  const wantRef = useRef(false);
  const restartTimer = useRef();
  const restarts = useRef([]);
  const [active, setActive] = useState(false);

  const stop = useCallback(() => {
    wantRef.current = false;
    clearTimeout(restartTimer.current);
    const rec = recRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (!SR) throw new Error('Speech recognition unsupported');
    wantRef.current = true;
    restarts.current = [];

    let rec = recRef.current;
    if (!rec) {
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      rec.onstart = () => setActive(true);
      rec.onaudiostart = () => setActive(true);

      rec.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += ' ' + event.results[i][0].transcript;
        }
        handlers.current.onWords?.(tokenize(text));
      };

      rec.onerror = (event) => {
        if (FATAL.has(event.error)) {
          wantRef.current = false;
          setActive(false);
          handlers.current.onFatalError?.(event.error);
        }
        // 'no-speech' and 'aborted' are routine; onend will restart if wanted.
      };

      rec.onend = () => {
        setActive(false);
        handlers.current.onSessionEnd?.();
        if (!wantRef.current) return;

        // Browsers end continuous sessions after silence; restart, but bail
        // out if the engine keeps dying immediately.
        const now = Date.now();
        restarts.current = restarts.current.filter((t) => now - t < 5000);
        restarts.current.push(now);
        if (restarts.current.length > 6) {
          wantRef.current = false;
          handlers.current.onFatalError?.('unstable');
          return;
        }
        restartTimer.current = setTimeout(() => {
          if (!wantRef.current) return;
          try {
            rec.start();
          } catch {
            /* will retry on next end */
          }
        }, 150);
      };

      recRef.current = rec;
    }

    try {
      rec.start();
    } catch (err) {
      // Still shutting down from a previous stop: onend will restart it.
      if (err?.name !== 'InvalidStateError') throw err;
    }
  }, [lang]);

  useEffect(
    () => () => {
      wantRef.current = false;
      clearTimeout(restartTimer.current);
      const rec = recRef.current;
      if (rec) {
        rec.onresult = rec.onerror = rec.onend = rec.onstart = rec.onaudiostart = null;
        try {
          rec.abort();
        } catch {
          /* noop */
        }
      }
    },
    [],
  );

  return { start, stop, active, supported: speechSupported };
}
