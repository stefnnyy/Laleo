// Safe-area insets supplied by the desktop phone frame (?inset=top,bottom).
// On a real phone these stay unset and env(safe-area-inset-*) is used.
export function applyInsets() {
  const inset = new URLSearchParams(window.location.search).get('inset');
  if (!inset) return;
  const [top, bottom] = inset.split(',').map(Number);
  const root = document.documentElement.style;
  if (Number.isFinite(top)) root.setProperty('--sat', `${top}px`);
  if (Number.isFinite(bottom)) root.setProperty('--sab', `${bottom}px`);
}
