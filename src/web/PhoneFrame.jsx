import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import homeIndicator from '../assets/figma/home-indicator.svg';

// One generic modern phone. The app inside renders at exactly this size;
// the whole device is scaled to fit the browser window.
const SCREEN_W = 390;
const SCREEN_H = 844;
const INSET_TOP = 50; // status bar
const INSET_BOTTOM = 16;
const MARGIN = 48; // breathing room around the device
const MAX_SCALE = 1.15;
const MIN_SCALE = 0.5;

function useFitScale() {
  const fit = () =>
    Math.max(
      MIN_SCALE,
      Math.min(
        MAX_SCALE,
        (window.innerHeight - MARGIN * 2) / SCREEN_H,
        (window.innerWidth - MARGIN * 2) / SCREEN_W,
      ),
    );
  const [scale, setScale] = useState(fit);
  useLayoutEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

// iOS-style clock: "h:mm" with no AM/PM, following the visitor's 12/24h locale.
function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
    .formatToParts(date)
    .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'literal')
    .map((p) => p.value)
    .join('')
    .trim();
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const schedule = () => {
      const d = new Date();
      // Tick right on the minute boundary.
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50);
    };
    schedule();
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}

function StatusBar() {
  const now = useClock();
  return (
    <div className="device__status" aria-hidden="true">
      <span className="device__time">{formatTime(now)}</span>
      <span className="device__island" />
      <span className="device__icons">
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11">
          <path d="M7.5 2.2c2.2 0 4.2.8 5.7 2.2l1.1-1.1A9.6 9.6 0 0 0 7.5.6 9.6 9.6 0 0 0 .7 3.3l1.1 1.1a8 8 0 0 1 5.7-2.2Z" />
          <path d="M7.5 5.3c1.4 0 2.6.5 3.5 1.3l1.1-1.1a6.6 6.6 0 0 0-9.2 0L4 6.6a5 5 0 0 1 3.5-1.3Z" />
          <path d="M7.5 8.3c.6 0 1.1.2 1.4.6L7.5 10.4 6.1 8.9c.3-.4.8-.6 1.4-.6Z" />
        </svg>
        <span className="device__battery" />
      </span>
    </div>
  );
}

export default function PhoneFrame() {
  const scale = useFitScale();
  const iframeRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  params.set('inset', `${INSET_TOP},${INSET_BOTTOM}`);
  const src = `app.html?${params}`;

  // Keep keyboard input (space, arrows, Esc) going to the app.
  useEffect(() => {
    const refocus = () => iframeRef.current?.contentWindow?.focus();
    window.addEventListener('pointerdown', refocus);
    window.addEventListener('keydown', refocus);
    return () => {
      window.removeEventListener('pointerdown', refocus);
      window.removeEventListener('keydown', refocus);
    };
  }, []);

  return (
    <main className="stage-frame">
      <div className="device-slot" style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}>
        <div
          className="device"
          style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})` }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title="Confession Mode"
            allow="microphone; screen-wake-lock"
            onLoad={(e) => e.currentTarget.contentWindow?.focus()}
          />
          <StatusBar />
          <img className="device__home" src={homeIndicator} width="134" height="5" alt="" />
        </div>
      </div>
    </main>
  );
}
