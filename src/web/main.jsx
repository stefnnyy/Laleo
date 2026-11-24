import { StrictMode, useLayoutEffect, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.jsx';
import PhoneFrame from './PhoneFrame.jsx';
import '../styles.css';
import './frame.css';

// Conventional breakpoint: below 768px is a phone, so show the app itself.
const query = window.matchMedia('(min-width: 768px)');
const subscribe = (cb) => {
  query.addEventListener('change', cb);
  return () => query.removeEventListener('change', cb);
};

function Root() {
  const desktop = useSyncExternalStore(subscribe, () => query.matches);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('is-framed', desktop);
  }, [desktop]);
  return desktop ? <PhoneFrame /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
