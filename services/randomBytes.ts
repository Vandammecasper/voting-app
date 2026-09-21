let fallbackCounter = 0;

function performanceNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now() % 1_000_000;
}

function fillWithFallbackRng(target: Uint8Array): void {
  fallbackCounter += 1;
  let state =
    (Date.now() ^ Math.floor(performanceNow() * 1000) ^ (fallbackCounter * 0x9e3779b9)) >>> 0;

  for (let i = 0; i < target.length; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const extra = Math.floor(Math.random() * 256);
    target[i] = (state + extra) & 0xff;
  }
}

/** Fill `target` with random bytes. Prefers Web Crypto; falls back on Hermes/RN. */
export function fillRandomBytes(target: Uint8Array): void {
  const cryptoObj = globalThis.crypto;
  if (typeof cryptoObj?.getRandomValues === 'function') {
    cryptoObj.getRandomValues(target);
    return;
  }

  fillWithFallbackRng(target);
}
