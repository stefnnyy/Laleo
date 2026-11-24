import { useEffect, useRef } from 'react';
import waveformIdle from '../assets/figma/waveform.svg';

// Same rhythm as the design's dotted line: a 2px dot every 6px.
const PITCH = 6;
const DOT = 2;

/**
 * At rest this is the design's static dotted line. While the microphone is
 * live, a canvas draws the same dots stretched by the real input level,
 * scrolling right to left. It never moves unless real audio is coming in.
 * When paused (`frozen`), the last frame stays on screen, still, until
 * listening resumes and carries on from it.
 */
export default function Waveform({ analyser, frozen = false, onLevel }) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) {
      // Paused: leave the canvas pixels as they were. Otherwise forget them.
      if (!frozen) historyRef.current = [];
      onLevelRef.current?.(0);
      return undefined;
    }
    const ctx = canvas.getContext('2d');
    const styles = getComputedStyle(canvas);
    const idle = styles.getPropertyValue('--wave-idle').trim() || '#9d9d9d';
    const live = styles.getPropertyValue('--wave-live').trim() || '#d63524';

    let bars = 0;
    let history = historyRef.current;
    let raf = 0;
    let lastPush = 0;
    let smoothed = 0;
    const buf = new Float32Array(analyser.fftSize);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const next = Math.max(8, Math.floor((canvas.clientWidth - 4) / PITCH) + 1);
      history = next > history.length
        ? new Array(next - history.length).fill(0).concat(history)
        : history.slice(history.length - next);
      bars = next;
      historyRef.current = history;
    };

    const paint = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const span = (bars - 1) * PITCH;
      const x0 = (w - span) / 2;
      const mid = h / 2;
      ctx.lineCap = 'round';
      ctx.lineWidth = DOT;
      for (let i = 0; i < bars; i++) {
        const v = history[i];
        const len = Math.max(1, v * (h - DOT * 2));
        const x = x0 + i * PITCH;
        ctx.strokeStyle = v > 0.06 ? live : idle;
        ctx.beginPath();
        ctx.moveTo(x, mid - len / 2);
        ctx.lineTo(x, mid + len / 2);
        ctx.stroke();
      }
    };

    const tick = (t) => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      const level = Math.min(1, Math.pow(rms * 7, 0.8));
      smoothed = smoothed * 0.6 + level * 0.4;
      if (t - lastPush > 42) {
        history.push(smoothed);
        history.shift();
        historyRef.current = history;
        lastPush = t;
      }
      onLevelRef.current?.(smoothed);
      paint();
      raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      paint();
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      onLevelRef.current?.(0);
    };
  }, [analyser, frozen]);

  const showLive = Boolean(analyser) || (frozen && historyRef.current.length > 0);

  return (
    <div className={`waveform${showLive ? ' is-live' : ''}`} aria-hidden="true">
      <img className="waveform__idle" src={waveformIdle} width="402" height="56" alt="" />
      <canvas ref={canvasRef} className="waveform__live" />
    </div>
  );
}
