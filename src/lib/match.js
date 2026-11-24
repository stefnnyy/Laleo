// Utilities for comparing recognised speech against a confession line.

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

// Tolerant word comparison: recognisers often return near-misses
// ("strengthen" for "strengthens", "conquerer" for "conqueror").
function wordsMatch(target, heard) {
  if (target === heard) return true;
  const len = Math.max(target.length, heard.length);
  if (len <= 3) return false;
  if (target.length >= 5 && heard.length >= 5 && target.slice(0, 5) === heard.slice(0, 5)) return true;
  return editDistance(target, heard) <= (len >= 7 ? 2 : 1);
}

const LOOKAHEAD = 6;

/**
 * Greedy in-order alignment of the target words against what was heard.
 * Returns the indexes of target words that were spoken.
 */
export function matchLine(target, heard) {
  const matched = [];
  let j = 0;
  for (let i = 0; i < target.length; i++) {
    // Until we've anchored on a first word, search everything heard so far.
    const end = matched.length === 0 ? heard.length : Math.min(heard.length, j + LOOKAHEAD);
    for (let k = j; k < end; k++) {
      if (wordsMatch(target[i], heard[k])) {
        matched.push(i);
        j = k + 1;
        break;
      }
    }
  }
  return matched;
}

/** Has enough of the line been spoken to move on? */
export function isLineComplete(matched, n) {
  if (n === 0) return true;
  const count = matched.length;
  const tailHit = matched.includes(n - 1) || (n > 4 && matched.includes(n - 2));
  if (n <= 2) return count === n;
  if (n <= 4) return count >= n - 1 && tailHit;
  const ratio = count / n;
  return (ratio >= 0.7 && tailHit) || ratio >= 0.9;
}
