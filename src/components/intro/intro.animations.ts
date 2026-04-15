import { gsap } from "gsap";
import { INTRO_TIMING, INTRO_EASE } from "./intro.constants";

/**
 * Resolves according to the hybrid loading gate:
 *   whichever = first(readyPromise, maxTimer)
 *   release   = last(whichever, minTimer)
 * In plain words: release when BOTH (minHold elapsed) AND (ready OR maxHold).
 * Covered by Playwright E2E in tests/intro/intro.spec.ts (Task 9 of the plan).
 */
export function computeGateRelease(readyPromise: Promise<unknown>): Promise<void> {
  const min = new Promise<void>((r) => setTimeout(r, INTRO_TIMING.minHoldMs));
  const max = new Promise<void>((r) => setTimeout(r, INTRO_TIMING.maxHoldMs));
  const ready = readyPromise.then(() => undefined).catch(() => undefined);
  const whichever = Promise.race([ready, max]);
  return Promise.all([whichever, min]).then(() => undefined);
}

export interface IntroTimelineCtx {
  curtainEl: HTMLElement;
  introLogoEl: HTMLElement;
  /** Computed at gate release, after document.fonts.ready. */
  navLogoRect: { x: number; y: number; width: number; height: number };
  /** Center rect of the intro logo at the start of the travel phase. */
  introLogoStartRect: { x: number; y: number; width: number; height: number };
  onHandoff: () => void;
  onComplete: () => void;
}

export interface IntroTimelineSummary {
  curtainLiftEnd: number;
  logoTravelEnd: number;
  handoffAt: number;
  totalDuration: number;
}

/**
 * Builds the GSAP timeline for the intro curtain: curtain lifts off-screen
 * while the centered intro logo travels to the nav logo's bounding box.
 * A mid-timeline `tl.call` fires the handoff at `handoffAtFromLift`.
 *
 * Returns both the timeline (for cleanup) and a summary of computed phase
 * boundaries (useful for testing and for callers that need to know when
 * the timeline is "effectively" done).
 */
export function createIntroTimeline(ctx: IntroTimelineCtx): {
  timeline: gsap.core.Timeline;
  summary: IntroTimelineSummary;
} {
  const tl = gsap.timeline({ onComplete: ctx.onComplete });

  // Phase 1: curtain rises off the top of the viewport with a physical
  // "weight + gravity" feel.
  //   - Explicit pixel value (not -100%) because percentage transforms
  //     on fixed-position elements misbehave in some production bundles
  //     and the user reported the lift looked instantaneous.
  //   - `power3.in` easing: starts slow (fabric tension + weight
  //     resistance), accelerates as gravity inverts, finishes fast —
  //     reads as a real curtain being pulled up by a motor/rope.
  //   - Overshoot by 60px so the edge of the curtain clears the
  //     viewport even on devices where visual viewport != layout
  //     viewport (mobile browser chrome).
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 900;
  tl.to(
    ctx.curtainEl,
    {
      y: -(viewportH + 60),
      duration: INTRO_TIMING.curtainLiftDur,
      ease: INTRO_EASE.curtainLift,
    },
    0,
  );

  // Logo stays inside the curtain and rides up with it — no travel
  // tween. When the curtain is mostly off-screen, onHandoff fires and
  // the nav takes over. Simpler, less fragile, and avoids the
  // pixel-matching dance with getBoundingClientRect.
  tl.call(ctx.onHandoff, [], INTRO_TIMING.handoffAtFromLift);

  const summary: IntroTimelineSummary = {
    curtainLiftEnd: INTRO_TIMING.curtainLiftDur,
    logoTravelEnd: INTRO_TIMING.curtainLiftDur,
    handoffAt: INTRO_TIMING.handoffAtFromLift,
    totalDuration: INTRO_TIMING.curtainLiftDur,
  };

  return { timeline: tl, summary };
}
