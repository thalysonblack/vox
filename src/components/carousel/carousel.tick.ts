/**
 * Apple-clock-picker style "tick" — short synthesized click via WebAudio.
 * Lazy-initialized on first call (always inside a user gesture: wheel/drag/click).
 */

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Call from a real user gesture (pointerdown/click) to unlock audio. */
export function unlockTick() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  const now = ac.currentTime;
  const buffer = ac.createBuffer(1, 1, 22050);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(ac.destination);
  src.start(now);
}

let lastTickAt = 0;

export function playTick() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});

  const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (nowMs - lastTickAt < 120) return;
  lastTickAt = nowMs;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lp = ac.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

  lp.type = "lowpass";
  lp.frequency.setValueAtTime(480, now);
  lp.Q.value = 0.4;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(lp).connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.1);

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(4);
    } catch {}
  }
}
