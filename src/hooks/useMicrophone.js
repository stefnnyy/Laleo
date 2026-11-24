import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Opens the microphone and exposes an AnalyserNode so the waveform reflects
 * real input. Tracks are fully released on stop so the OS mic indicator
 * turns off whenever the app isn't listening.
 */
export function useMicrophone() {
  const [analyser, setAnalyser] = useState(null);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setAnalyser(null);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error('getUserMedia unsupported');
      err.name = 'NotSupportedError';
      throw err;
    }
    stop();

    // Create the context inside the user gesture (Safari requirement).
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = AC ? new AC() : null;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      ctx?.close().catch(() => {});
      throw err;
    }

    streamRef.current = stream;
    if (ctx) {
      ctxRef.current = ctx;
      await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 1024;
      node.smoothingTimeConstant = 0.6;
      source.connect(node);
      setAnalyser(node);
    }
    return stream;
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { start, stop, analyser };
}
