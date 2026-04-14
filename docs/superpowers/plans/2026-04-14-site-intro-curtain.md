# Site Intro Curtain Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a brand-moment intro sequence on full page load: black curtain with centered logo, lifts and hands off to the existing carousel choreography. Desktop + mobile. Loading-aware (min 1s, max 2.5s). Reduced-motion friendly.

**Architecture:** New `IntroCurtain` client component mounted at the top of `HomeLayout` whenever `introDone === false`. Owns a GSAP timeline for curtain lift + logo travel to nav slot. Existing `Nav`, `ProjectCarousel`, `Footer` start with inline `opacity: 0` and fade/stagger in when `introDone` flips true. Module-level `hasPlayedIntroRef` prevents replay on client-side nav. Deep links to `/project/[slug]` skip the intro entirely.

**Tech Stack:** Next.js 16 App Router, React 19, GSAP, Playwright (E2E), Tailwind. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-14-site-intro-curtain-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/components/intro/intro.constants.ts` | Timing/easing constants, large logo size |
| `src/components/intro/intro.animations.ts` | `createIntroTimeline(ctx)` — GSAP timeline builder |
| `src/components/intro/IntroCurtain.tsx` | The component: state machine, gate, handoff |
| `src/components/intro/intro.animations.test.ts` | Unit tests for timing math + gate release rule |
| `tests/intro/intro.spec.ts` | Playwright E2E: happy path + reduced motion |

### Modified files

| Path | What changes |
|---|---|
| `src/components/HomeLayout.tsx` | Own `introDone` state, mount `IntroCurtain`, skip logic for `initialSlug` |
| `src/components/nav/Nav.tsx` | Accept `introDone`, apply inline `opacity:0` until true |
| `src/components/carousel/ProjectCarousel.tsx` | Accept `introDone` + `onCarouselReady`, stagger-in cards when flipped |
| `src/components/footer/Footer.tsx` | Accept `introDone`, fade in when true |

### Why this split

- `intro.constants.ts` — data only, mirrors the project's existing pattern (`carousel.constants.ts`).
- `intro.animations.ts` — pure function building a GSAP timeline, easy to unit test and reuse.
- `IntroCurtain.tsx` — all the React/DOM side (mount, refs, lifecycle, handoff). Small and focused.
- Unit tests live next to the module they test.
- Playwright E2E lives in `tests/` where the existing Playwright config can pick it up.

---

## Chunk 1: Constants, Animations Helper, and Component Skeleton

### Task 1: Create intro constants

**Files:**
- Create: `src/components/intro/intro.constants.ts`

- [ ] **Step 1: Write the file**

```ts
/**
 * Intro curtain timing + easing constants. Values mirror the rhythm of
 * the carousel choreography (expo.out, ~0.7-0.9s phases).
 */
export const INTRO_TIMING = {
  // Loading gate
  minHoldMs: 1000,
  maxHoldMs: 2500,

  // Phase durations (seconds, for GSAP)
  logoFadeInDur: 0.4,
  logoFadeInDelay: 0.1,
  curtainLiftDur: 0.8,
  logoTravelDur: 0.7,
  logoTravelDelay: 0.10, // after curtain lift starts
  cardStaggerDur: 0.7,
  cardStaggerGap: 0.04,
  cardStaggerDelayFromLift: 0.55,
  handoffAtFromLift: 0.80,
  footerFadeDur: 0.3,

  // Reduced motion collapse (milliseconds — no GSAP, pure CSS)
  reducedMotionTotalMs: 600,
  reducedMotionCurtainFadeMs: 300,
  reducedMotionContentFadeMs: 200,
} as const;

export const INTRO_EASE = {
  logoFade: "power2.out",
  curtainLift: "expo.out",
  logoTravel: "power3.inOut",
  cardEntry: "expo.out",
} as const;

export const INTRO_LOGO_LARGE = {
  // Desktop + mobile share the same centered size. 420x64 reads
  // comfortably on a 375px-wide viewport (~90% width editorial feel)
  // and keeps the travel-tween target uniform across viewports.
  widthPx: 420,
  heightPx: 64,
} as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors about the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/intro/intro.constants.ts
git commit -m "feat(intro): add timing and sizing constants"
```

---

### Task 2: Create animations helper + unit tests

**Files:**
- Create: `src/components/intro/intro.animations.ts`
- Create: `src/components/intro/intro.animations.test.ts`

**Background:** `createIntroTimeline` is a pure function that returns a configured `gsap.core.Timeline`. It takes refs/elements and target positions as input. Unit tests verify the timing math (when does each tween start? what's the total duration?) without needing a real DOM.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/intro/intro.animations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { gsap } from "gsap";
import { computeGateRelease, IntroTimelineSummary } from "./intro.animations";
import { INTRO_TIMING } from "./intro.constants";

describe("computeGateRelease", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("resolves at minHoldMs when ready fires immediately", async () => {
    const readyPromise = Promise.resolve();
    const promise = computeGateRelease(readyPromise);
    vi.advanceTimersByTime(INTRO_TIMING.minHoldMs);
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves when ready fires after minHoldMs", async () => {
    let resolveReady: () => void;
    const readyPromise = new Promise<void>((r) => { resolveReady = r; });
    const promise = computeGateRelease(readyPromise);
    vi.advanceTimersByTime(INTRO_TIMING.minHoldMs);
    await vi.advanceTimersByTimeAsync(0);
    // Still pending — ready hasn't fired
    let resolved = false;
    promise.then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(10);
    expect(resolved).toBe(false);
    resolveReady!();
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(true);
  });

  it("force-releases at maxHoldMs even if ready never fires", async () => {
    const readyPromise = new Promise<void>(() => {}); // never resolves
    const promise = computeGateRelease(readyPromise);
    vi.advanceTimersByTime(INTRO_TIMING.maxHoldMs);
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/intro/intro.animations.test.ts`
Expected: FAIL with "Cannot find module './intro.animations'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/intro/intro.animations.ts
import { gsap } from "gsap";
import { INTRO_TIMING, INTRO_EASE } from "./intro.constants";

/**
 * Resolves according to the hybrid loading gate:
 *   whichever = first(readyPromise, maxTimer)
 *   release   = last(whichever, minTimer)
 * In plain words: release when BOTH (minHold elapsed) AND (ready OR maxHold).
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

export function createIntroTimeline(ctx: IntroTimelineCtx): {
  timeline: gsap.core.Timeline;
  summary: IntroTimelineSummary;
} {
  const tl = gsap.timeline({ onComplete: ctx.onComplete });

  // Phase 1: curtain lifts off-screen
  tl.to(
    ctx.curtainEl,
    {
      y: "-100%",
      duration: INTRO_TIMING.curtainLiftDur,
      ease: INTRO_EASE.curtainLift,
    },
    0,
  );

  // Phase 2: logo travels from centered position to nav slot (absolute coords)
  const dx = ctx.navLogoRect.x - ctx.introLogoStartRect.x;
  const dy = ctx.navLogoRect.y - ctx.introLogoStartRect.y;
  const scaleX = ctx.navLogoRect.width / ctx.introLogoStartRect.width;
  const scaleY = ctx.navLogoRect.height / ctx.introLogoStartRect.height;
  tl.to(
    ctx.introLogoEl,
    {
      x: dx,
      y: dy,
      scaleX,
      scaleY,
      transformOrigin: "top left",
      duration: INTRO_TIMING.logoTravelDur,
      ease: INTRO_EASE.logoTravel,
    },
    INTRO_TIMING.logoTravelDelay,
  );

  // Handoff callback fires mid-timeline, at handoffAtFromLift seconds
  tl.call(ctx.onHandoff, [], INTRO_TIMING.handoffAtFromLift);

  const summary: IntroTimelineSummary = {
    curtainLiftEnd: INTRO_TIMING.curtainLiftDur,
    logoTravelEnd: INTRO_TIMING.logoTravelDelay + INTRO_TIMING.logoTravelDur,
    handoffAt: INTRO_TIMING.handoffAtFromLift,
    totalDuration: Math.max(
      INTRO_TIMING.curtainLiftDur,
      INTRO_TIMING.logoTravelDelay + INTRO_TIMING.logoTravelDur,
    ),
  };

  return { timeline: tl, summary };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/intro/intro.animations.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Add a test for `createIntroTimeline` summary math**

Append to the test file:

```ts
describe("createIntroTimeline", () => {
  it("returns a summary with correct phase boundaries", () => {
    // jsdom env, fake DOM elements are fine — we only inspect the summary.
    const div = document.createElement("div");
    const logo = document.createElement("div");
    const { timeline, summary } = createIntroTimeline({
      curtainEl: div,
      introLogoEl: logo,
      navLogoRect: { x: 12, y: 12, width: 180, height: 27 },
      introLogoStartRect: { x: 100, y: 100, width: 420, height: 64 },
      onHandoff: () => {},
      onComplete: () => {},
    });
    expect(summary.curtainLiftEnd).toBeCloseTo(INTRO_TIMING.curtainLiftDur);
    expect(summary.logoTravelEnd).toBeCloseTo(
      INTRO_TIMING.logoTravelDelay + INTRO_TIMING.logoTravelDur,
    );
    expect(summary.handoffAt).toBeCloseTo(INTRO_TIMING.handoffAtFromLift);
    timeline.kill();
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/components/intro/intro.animations.test.ts`
Expected: 4 passing.

- [ ] **Step 7: Commit**

```bash
git add src/components/intro/intro.animations.ts src/components/intro/intro.animations.test.ts
git commit -m "feat(intro): add GSAP timeline builder and gate release logic"
```

---

### Task 3: Create IntroCurtain component skeleton

**Files:**
- Create: `src/components/intro/IntroCurtain.tsx`

**Background:** Start with the component structure. No real gate logic yet — just renders a black overlay with a centered logo. `phase` state machine. Implements the reduced-motion branch with pure CSS so it works even before GSAP wiring.

- [ ] **Step 1: Write the component**

```tsx
// src/components/intro/IntroCurtain.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  INTRO_TIMING,
  INTRO_EASE,
  INTRO_LOGO_LARGE,
} from "./intro.constants";
import {
  computeGateRelease,
  createIntroTimeline,
} from "./intro.animations";

type Phase = "displaying" | "lifting" | "done";

interface IntroCurtainProps {
  /** Resolves when fonts, critical images, and the carousel have mounted. */
  readyPromise: Promise<unknown>;
  /** Fired the moment the nav logo should take over (handoffAt). */
  onHandoff: () => void;
  /** Fired when the component is ready to unmount (= same frame as onHandoff). */
  onComplete: () => void;
}

export default function IntroCurtain({
  readyPromise,
  onHandoff,
  onComplete,
}: IntroCurtainProps) {
  const [phase, setPhase] = useState<Phase>("displaying");
  const curtainRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  // Detect reduced motion once.
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  // Kick off the gate. When released, flip phase to "lifting".
  useEffect(() => {
    let cancelled = false;
    computeGateRelease(readyPromise).then(() => {
      if (!cancelled) setPhase("lifting");
    });
    return () => {
      cancelled = true;
    };
  }, [readyPromise]);

  // Run the animation once phase === "lifting".
  useLayoutEffect(() => {
    if (phase !== "lifting") return;
    if (prefersReducedMotion) {
      // Reduced motion: collapse to a pure fade.
      const curtain = curtainRef.current;
      if (!curtain) return;
      curtain.style.transition = `opacity ${INTRO_TIMING.reducedMotionCurtainFadeMs}ms ease-out`;
      curtain.style.opacity = "0";
      onHandoff();
      const t = window.setTimeout(() => {
        setPhase("done");
        onComplete();
      }, INTRO_TIMING.reducedMotionTotalMs);
      return () => window.clearTimeout(t);
    }

    // Full motion: build the GSAP timeline.
    const curtain = curtainRef.current;
    const logo = logoRef.current;
    if (!curtain || !logo) return;
    const navLogoEl =
      document.querySelector<HTMLElement>("[data-vox-logo] img") ??
      document.querySelector<HTMLElement>("[data-vox-logo]");
    if (!navLogoEl) {
      // No nav logo found — bail to fade.
      curtain.style.opacity = "0";
      onHandoff();
      setPhase("done");
      onComplete();
      return;
    }
    const navRect = navLogoEl.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    const { timeline } = createIntroTimeline({
      curtainEl: curtain,
      introLogoEl: logo,
      navLogoRect: {
        x: navRect.x,
        y: navRect.y,
        width: navRect.width,
        height: navRect.height,
      },
      introLogoStartRect: {
        x: logoRect.x,
        y: logoRect.y,
        width: logoRect.width,
        height: logoRect.height,
      },
      onHandoff: () => {
        // Do BOTH the handoff and the completion-side-effect here,
        // not from timeline.onComplete. The component unmounts on
        // setPhase("done") and the cleanup kills the timeline, so its
        // onComplete may not fire. Treating handoff and complete as
        // the same moment matches the spec (both at T+0.80).
        onHandoff();
        onComplete();
        setPhase("done");
      },
      onComplete: () => {
        // Intentionally a no-op — see onHandoff comment.
      },
    });

    return () => {
      timeline.kill();
    };
  }, [phase, onHandoff, onComplete, prefersReducedMotion]);

  if (phase === "done") return null;

  return (
    <div
      ref={curtainRef}
      data-vox-intro-curtain
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]"
      style={{
        pointerEvents: phase === "lifting" ? "none" : "auto",
        willChange: "transform, opacity",
      }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/assets/vox-logo.svg"
        alt=""
        width={INTRO_LOGO_LARGE.widthPx}
        height={INTRO_LOGO_LARGE.heightPx}
        style={{
          display: "block",
          filter: "invert(1)",
          opacity: 0,
          animation: `intro-logo-fade-in ${INTRO_TIMING.logoFadeInDur}s ${INTRO_TIMING.logoFadeInDelay}s ${INTRO_EASE.logoFade} forwards`,
        }}
      />
      <style>{`
        @keyframes intro-logo-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/intro/IntroCurtain.tsx
git commit -m "feat(intro): IntroCurtain component with gate and handoff"
```

---

## Chunk 2: Wire the intro into the site

### Task 4: Add `hasPlayedIntroRef` module state

**Files:**
- Create: `src/components/intro/introState.ts`

- [ ] **Step 1: Write the file**

```ts
/**
 * Module-level flag tracking whether the intro has played during the
 * current JS module lifetime. Survives client-side nav (same module
 * instance), resets on hard reload (new module instance). Exactly the
 * "every page load" semantics we want.
 */
export const introState = {
  hasPlayed: false,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/intro/introState.ts
git commit -m "feat(intro): module-level hasPlayed flag"
```

---

### Task 5: Add `introDone` prop to Nav

**Files:**
- Modify: `src/components/nav/Nav.tsx`

**Background:** Nav's logo and CONNECT button start hidden until the intro hands off. Use inline styles so SSR matches client's first render and hydration doesn't mismatch.

- [ ] **Step 1: Add prop to interface**

In `src/components/nav/Nav.tsx`, update the props interface:

```ts
interface NavProps {
  compact?: boolean;
  onLogoClick?: () => void;
  /** When false, the logo and CONNECT button are hidden via inline
   *  opacity:0 so the IntroCurtain can place the nav logo via handoff. */
  introDone?: boolean;
}
```

- [ ] **Step 2: Destructure the prop**

```ts
export default function Nav({
  compact = false,
  onLogoClick,
  introDone = true,
}: NavProps) {
```

- [ ] **Step 3: Apply inline opacity on the logo button**

Find the logo `<button>` element (around line 142). Add inline style to the existing `style={{ ... }}` object:

```ts
        style={{
          filter: logoDark ? "invert(1)" : "none",
          transition: "filter 200ms ease-out",
          opacity: introDone ? undefined : 0,
          pointerEvents: introDone ? undefined : "none",
        }}
```

- [ ] **Step 4: Apply inline opacity on the CONNECT button wrapper**

Find the wrapper `<div>` with class `flex flex-1 items-start justify-end ...`. Add inline style:

```ts
      <div
        className={`flex flex-1 items-start justify-end gap-0 transition-opacity duration-300 ease-out md:justify-between ${
          compact ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={introDone ? undefined : { opacity: 0, pointerEvents: "none" }}
      >
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/nav/Nav.tsx
git commit -m "feat(nav): accept introDone prop to hide logo/CONNECT pre-intro"
```

---

### Task 6: Add `introDone` prop + card stagger to ProjectCarousel

**Files:**
- Modify: `src/components/carousel/ProjectCarousel.tsx`

**Background:** The carousel has many card DOM nodes. While `introDone === false`, each card renders with inline `opacity: 0; transform: translateY(40px)`. When flipped to `true`, a one-shot GSAP stagger-in runs and clears the styles. Also expose `onCarouselReady` callback for the intro gate.

- [ ] **Step 1: Add props to interface**

In `src/components/carousel/ProjectCarousel.tsx`, update interface (around line 30):

```ts
interface ProjectCarouselProps {
  projects: ProjectListItem[];
  initialSlug?: string;
  onDetailOpen?: () => void;
  onDetailClose?: () => void;
  onRegisterCloseHandler?: (handler: () => void) => void;
  /** Fired once the strip has laid out with Sanity data present. */
  onCarouselReady?: () => void;
  /** When false, cards render hidden so the intro can stagger them in. */
  introDone?: boolean;
}
```

- [ ] **Step 2: Destructure the props**

```ts
export default function ProjectCarousel({
  projects,
  initialSlug,
  onDetailOpen,
  onDetailClose,
  onRegisterCloseHandler,
  onCarouselReady,
  introDone = true,
}: ProjectCarouselProps) {
```

- [ ] **Step 3: Fire `onCarouselReady` once the strip is mounted with data**

Add a new `useEffect` near the top of the component body:

```ts
  useEffect(() => {
    if (!onCarouselReady) return;
    if (projects.length === 0) return;
    const strip = stripRef.current;
    if (!strip) return;
    // One frame for layout, then signal ready.
    const id = requestAnimationFrame(() => onCarouselReady());
    return () => cancelAnimationFrame(id);
  }, [onCarouselReady, projects.length]);
```

- [ ] **Step 4: Apply initial hidden styles to the strip**

Find the strip `<div ref={stripRef} ...>`. Add an inline style that applies only when `!introDone`:

```tsx
      <div
        ref={stripRef}
        /* ... existing props ... */
        style={
          introDone
            ? undefined
            : {
                opacity: 0,
                transform: "translateY(40px)",
                pointerEvents: "none",
              }
        }
      >
```

- [ ] **Step 5: Trigger stagger-in when `introDone` flips to true**

Add an effect that watches `introDone`. The stagger order depends on the
current mode: horizontal uses a simple left-to-right stagger, vertical
uses a center-out stagger (active center card first, then adjacents,
then outer slots) to match the spec's mobile variant.

```ts
  const didStaggerInRef = useRef(false);
  useEffect(() => {
    if (!introDone) return;
    if (didStaggerInRef.current) return;
    const strip = stripRef.current;
    if (!strip) return;
    didStaggerInRef.current = true;

    // ProjectCard renders with `data-project-id` on its root div —
    // verified in src/components/card/ProjectCard.tsx.
    const cards = Array.from(
      strip.querySelectorAll<HTMLElement>("[data-project-id]"),
    );
    if (cards.length === 0) return;

    // Pick the stagger order.
    const isVertical = modeRef.current === "vertical";
    let ordered: HTMLElement[];
    if (isVertical) {
      // Center-out: assume the middle card is index Math.floor(n/2),
      // then zip outward alternating sides.
      const mid = Math.floor(cards.length / 2);
      ordered = [cards[mid]];
      for (let d = 1; d <= Math.max(mid, cards.length - 1 - mid); d++) {
        if (mid - d >= 0) ordered.push(cards[mid - d]);
        if (mid + d < cards.length) ordered.push(cards[mid + d]);
      }
    } else {
      // Horizontal: left-to-right (DOM order).
      ordered = cards;
    }

    gsap.set(strip, { clearProps: "opacity,transform,pointerEvents" });
    gsap.fromTo(
      ordered,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.04,
        clearProps: "opacity,transform",
      },
    );
  }, [introDone]);
```

> Before wiring this, verify with grep that `ProjectCard.tsx` still emits
> `data-project-id`. The stagger depends on this selector — if the attr
> is renamed, the stagger silently no-ops.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/carousel/ProjectCarousel.tsx
git commit -m "feat(carousel): introDone prop, card stagger-in, onCarouselReady"
```

---

### Task 7: Add `introDone` prop to Footer

**Files:**
- Modify: `src/components/footer/Footer.tsx`

- [ ] **Step 1: Update signature and render**

Replace the file contents:

```tsx
interface FooterProps {
  introDone?: boolean;
}

export default function Footer({ introDone = true }: FooterProps) {
  return (
    <footer
      className="pt-4"
      style={
        introDone
          ? { transition: "opacity 300ms ease-out", opacity: 1 }
          : { opacity: 0 }
      }
    >
      <hr className="mb-6 border-t border-black/[0.08]" />

      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-0">
        <p className="text-[11px] font-semibold uppercase leading-[1.25] tracking-[-0.4px] text-black/45 md:text-[14px] md:tracking-[-0.64px]">
          © 2026
        </p>
        <p className="max-w-[345px] text-left text-[11px] font-sans font-semibold uppercase leading-[1.25] tracking-[-0.4px] text-black/45 md:text-[14px] md:tracking-[-0.64px]">
          We bring ideas to life, and life to ideas, through strategy, design,
          and communication.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/footer/Footer.tsx
git commit -m "feat(footer): introDone prop drives fade-in"
```

---

### Task 8: Integrate IntroCurtain into HomeLayout

**Files:**
- Modify: `src/components/HomeLayout.tsx`

**Background:** The terminal wiring. `HomeLayout` owns `introDone`, builds the `readyPromise` from `document.fonts.ready` + critical image decodes + `onCarouselReady`, mounts `IntroCurtain`, and propagates `introDone` down. Skips the intro when `initialSlug` is set or `introState.hasPlayed` is true.

- [ ] **Step 0: Confirm the Sanity image field path**

Open `src/types/project.ts` and `src/lib/queries.ts`. Find the field on `ProjectListItem` that holds the card image URL — it may be `coverImage?.asset?.url`, `image?.url`, `cover?.url`, or something else. **Use the real path in Step 3 below**. This prevents the gate from silently waiting on undefined URLs and always hitting `maxHoldMs`.

- [ ] **Step 1: Update imports**

Add at the top of `src/components/HomeLayout.tsx`:

```ts
import IntroCurtain from "@/components/intro/IntroCurtain";
import { introState } from "@/components/intro/introState";
```

- [ ] **Step 2: Initialize `introDone` state**

Replace the existing `detailOpen` state area with:

```ts
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Deep link to /project/[slug] or already-played → skip intro.
  const shouldSkipIntro = Boolean(initialSlug) || introState.hasPlayed;
  const [introDone, setIntroDone] = useState(shouldSkipIntro);
  const carouselReadyResolverRef = useRef<(() => void) | null>(null);
  const closeHandlerRef = useRef<() => void>(() => {});
```

- [ ] **Step 3: Build `readyPromise` once**

Add a memoized ref that constructs the promise:

```ts
  const readyPromiseRef = useRef<Promise<unknown> | null>(null);
  if (readyPromiseRef.current === null && !shouldSkipIntro) {
    const carouselReady = new Promise<void>((resolve) => {
      carouselReadyResolverRef.current = resolve;
    });
    const fontsReady =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready.then(() => undefined)
        : Promise.resolve();
    // Preload the first 5 card images (best-effort).
    // Replace `.imageUrl` with the ACTUAL field path you confirmed in
    // Step 0 (likely `.coverImage?.asset?.url` or similar).
    const criticalImages = projects
      .slice(0, 5)
      .map((p) => (p as { imageUrl?: string }).imageUrl)
      .filter((u): u is string => Boolean(u))
      .map((url) => {
        const img = new Image();
        img.src = url;
        return img.decode().catch(() => null);
      });
    readyPromiseRef.current = Promise.all([
      fontsReady,
      carouselReady,
      ...criticalImages,
    ]);
  }
```

> Note: `projects[i].coverImage?.asset?.url` should match the actual field path in the Sanity list query. If it differs (e.g. `image.url`), adjust accordingly. Check `src/types/project.ts` and `src/lib/queries.ts` if unsure.

- [ ] **Step 4: Wire callbacks**

```ts
  const handleCarouselReady = useCallback(() => {
    carouselReadyResolverRef.current?.();
    carouselReadyResolverRef.current = null;
  }, []);

  const handleIntroHandoff = useCallback(() => {
    setIntroDone(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    introState.hasPlayed = true;
  }, []);
```

- [ ] **Step 5: Render `IntroCurtain` when needed**

Add inside the root `<div>`, above the existing nav wrapper:

```tsx
      {!introDone && readyPromiseRef.current && (
        <IntroCurtain
          readyPromise={readyPromiseRef.current}
          onHandoff={handleIntroHandoff}
          onComplete={handleIntroComplete}
        />
      )}
```

- [ ] **Step 6: Pass `introDone` to children**

Update the existing JSX:

```tsx
        <Nav
          compact={detailOpen && !isMobile}
          onLogoClick={goHome}
          introDone={introDone}
        />
```

```tsx
        <ProjectCarousel
          projects={projects}
          initialSlug={initialSlug}
          introDone={introDone}
          onCarouselReady={handleCarouselReady}
          onDetailOpen={() => setDetailOpen(true)}
          onDetailClose={() => setDetailOpen(false)}
          onRegisterCloseHandler={(fn) => {
            closeHandlerRef.current = fn;
          }}
        />
```

```tsx
          <Footer introDone={introDone} />
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Start the dev server and smoke-test**

Run: `pnpm dev` (or `npm run dev`) in one terminal.

Open `http://localhost:3000` in a browser.
Expected:
- Black curtain appears immediately on load.
- Logo fades in centered within ~0.5s.
- After min 1s (more if slow), curtain lifts off-screen (0.8s).
- Logo travels to top-left and ends on the nav slot.
- Cards stagger in from below.
- Footer fades in.
- Site is fully interactive after ~2-3s total.

Also manually test:
- Click a card → project opens normally (intro does not replay).
- Close project → home visible, intro does not replay.
- Navigate to `/resources` then back to `/` → no intro replay.
- Hard reload `/` → intro plays again.
- Navigate directly to `/project/<any-slug>` → intro does NOT play, project opens immediately.

- [ ] **Step 9: Commit**

```bash
git add src/components/HomeLayout.tsx
git commit -m "feat(home): wire IntroCurtain, readyPromise, hasPlayed skip"
```

---

## Chunk 3: Tests and Polish

### Task 9: Playwright E2E tests

**Files:**
- Create: `tests/intro/intro.spec.ts`

**Background:** The main validation for this feature. Two tests: happy path and reduced motion. Keep assertions coarse (timing bands, element presence) — don't assert exact pixel positions.

- [ ] **Step 1: Write the test file**

```ts
// tests/intro/intro.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Site intro curtain", () => {
  test("plays the full sequence on first load", async ({ page }) => {
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Curtain is present immediately (stable selector via data attribute).
    const curtain = page.locator("[data-vox-intro-curtain]");
    await expect(curtain).toBeVisible({ timeout: 500 });

    // Wait for the nav logo to become visible (handoff complete).
    const navLogo = page.locator("[data-vox-logo] img");
    await expect(navLogo).toBeVisible();
    await expect(navLogo).toHaveCSS("opacity", "1", { timeout: 5000 });

    const elapsed = Date.now() - t0;
    // Total should fall within the hybrid gate window.
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThanOrEqual(5000);

    // Curtain should have detached after handoff.
    await expect(curtain).toHaveCount(0, { timeout: 2000 });

    // Cards are visible and clickable.
    const firstCard = page.locator("[data-project-id]").first();
    await expect(firstCard).toBeVisible();
  });

  test("does not play on deep link to a project", async ({ page }) => {
    await page.goto("/project/any-slug-here", { waitUntil: "domcontentloaded" });
    // Wait a bit to be certain the curtain NEVER mounts (not just
    // "not yet").
    await page.waitForTimeout(500);
    const curtain = page.locator("[data-vox-intro-curtain]");
    await expect(curtain).toHaveCount(0);
  });

  test("respects prefers-reduced-motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const navLogo = page.locator("[data-vox-logo] img");
    await expect(navLogo).toHaveCSS("opacity", "1", { timeout: 3000 });

    const elapsed = Date.now() - t0;
    // Reduced motion collapses the full sequence to ≤ ~1s (plus network).
    // Generous ceiling to avoid flakes on cold CI:
    expect(elapsed).toBeLessThanOrEqual(3500);

    await context.close();
  });
});
```

- [ ] **Step 2: Run the test suite**

Run: `npx playwright test tests/intro/intro.spec.ts`
Expected: 3 passing (may require the dev server — check existing Playwright config for how it's launched).

If the deep-link test fails because `any-slug-here` doesn't exist, swap the slug for a real project ID from your Sanity data, or assert that the curtain just never mounts regardless of 404.

- [ ] **Step 3: Commit**

```bash
git add tests/intro/intro.spec.ts
git commit -m "test(intro): Playwright coverage for happy path, deep link, reduced motion"
```

---

### Task 10: Polish pass and manual QA

**Files:** All intro-related files.

**Background:** Catch rough edges before calling the feature done.

- [ ] **Step 1: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Verify the build succeeds**

Run: `pnpm build` (or `npm run build`)
Expected: successful production build.

- [ ] **Step 3: Throttle network in DevTools and reload `/`**

Use Chrome DevTools → Network tab → set throttling to "Slow 3G".
Reload `/`.
Expected: intro stays up until `maxHoldMs` (~2.5s), then releases cleanly. Cards may still be loading when the curtain lifts, which is acceptable.

Also test the opposite end: set throttling to "No throttling" with "Disable cache" off, then reload. Expected: intro holds until `minHoldMs` (1s) even though assets return instantly — the gate never releases before 1s.

- [ ] **Step 4: Enable "Emulate CSS prefers-reduced-motion: reduce"**

In Chrome DevTools → Rendering panel → Emulate CSS media feature.
Reload `/`.
Expected: curtain fades instead of lifting, total sequence ≤ 600ms. No GSAP tween visible.

- [ ] **Step 5: Test on a real mobile device via local network**

From the dev server, note the LAN URL. Open it on a real phone.
Expected: curtain behavior identical to desktop. Cards staggered from center of the vertical column (if the project already has that ordering — if not, this is acceptable MVP behavior, follow up later).

- [ ] **Step 6: Final commit if any polish changes were made**

```bash
git add -A
git commit -m "polish(intro): manual QA fixes"
```

---

### Task 11: Deploy preview and validate

- [ ] **Step 1: Push to main** (per the project's established flow)

```bash
git push
```

Vercel will deploy automatically via the GitHub integration. Note the deployment URL from the Vercel dashboard.

- [ ] **Step 2: Verify on preview/production**

Open the deployed URL in a fresh incognito window. Run through the same manual checks from Task 8 Step 8.

Expected: parity with local dev, within reason for network variance.

- [ ] **Step 3: Done**

Mark the feature complete. Iterate on timings/values based on user feedback — the constants file is the single source of truth.

---

## Rollback plan

If the intro needs to be disabled in a hurry:

1. Edit `src/components/HomeLayout.tsx` line with `const shouldSkipIntro = ...`
2. Change to: `const shouldSkipIntro = true;`
3. Commit and push.

The rest of the site continues working normally without the intro.

---

## Notes for the engineer

- The spec lives at `docs/superpowers/specs/2026-04-14-site-intro-curtain-design.md` — read it if anything in this plan is unclear.
- GSAP is already installed and used by `carousel.animations.ts` — follow the same import patterns.
- The project uses pnpm; commands above work with npm too.
- The dev server supports HMR — use it during Tasks 3–8 to iterate quickly.
- If `document.fonts.ready` hangs (rare), check whether a custom font is failing to load via DevTools → Network → Fonts.
