"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  /** Fired the moment the nav logo should take over (handoff frame). */
  onHandoff: () => void;
  /** Fired the same frame as onHandoff — curtain unmount signal. */
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

  // Detect reduced motion once via lazy useState (SSR-safe, linter-happy).
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

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
      onComplete();
      const t = window.setTimeout(() => {
        setPhase("done");
      }, INTRO_TIMING.reducedMotionTotalMs);
      return () => window.clearTimeout(t);
    }

    // Full motion: build the GSAP timeline.
    const curtain = curtainRef.current;
    const logo = logoRef.current;
    if (!curtain || !logo) return;

    // Find the real nav logo — prefer the inner <img>, fall back to the
    // button wrapper if the <img> isn't mounted yet.
    const navLogoEl =
      document.querySelector<HTMLElement>("[data-vox-logo] img") ??
      document.querySelector<HTMLElement>("[data-vox-logo]");
    if (!navLogoEl) {
      // Nav logo not found — bail out gracefully to a fade. Defer the
      // phase flip to the next microtask so we don't set state
      // synchronously inside the layout effect body.
      curtain.style.opacity = "0";
      onHandoff();
      onComplete();
      queueMicrotask(() => setPhase("done"));
      return;
    }

    // Read the REAL bounding boxes now — fonts.ready has resolved
    // inside the readyPromise before we got here, so layout is final.
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
        // Fire BOTH handoff and complete here, not via timeline.onComplete.
        // The component unmounts on setPhase("done") and the cleanup
        // kills the timeline, so its onComplete may not fire. Treating
        // handoff and complete as the same moment matches the spec
        // (both at T + 0.80).
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
        className="intro-logo"
        style={{
          display: "block",
          opacity: 0,
          animation: `intro-logo-fade-in ${INTRO_TIMING.logoFadeInDur}s ${INTRO_TIMING.logoFadeInDelay}s ${INTRO_EASE.logoFade} forwards`,
        }}
      />
      <style>{`
        .intro-logo {
          /* The Good Taste SVG is solid black — brightness(0) forces all
             pixels to pure black, then invert(1) flips them to pure white.
             More robust than invert(1) alone, which can be affected by
             pre-existing non-black pixels or antialiasing. */
          filter: brightness(0) invert(1);
        }
        @keyframes intro-logo-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
