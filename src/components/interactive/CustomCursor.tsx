"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Custom cursor with lerp follow, expand on interactive elements,
 * and blend mode on images. Disabled on touch devices.
 * Renders nothing on server to avoid hydration mismatch.
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Mount only on client, skip on touch devices.
  useEffect(() => {
    const hasTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!hasTouch) setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Wait one frame for refs to be populated.
    const rafId = requestAnimationFrame(() => {
      const cursor = cursorRef.current;
      const dot = dotRef.current;
      const label = labelRef.current;
      if (!cursor || !dot || !label) return;

      let mouseX = 0;
      let mouseY = 0;
      let cursorX = 0;
      let cursorY = 0;

      const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };
      window.addEventListener("mousemove", onMouseMove);

      // Lerp follow via GSAP ticker
      const onTick = () => {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        gsap.set(cursor, { x: cursorX, y: cursorY });
        gsap.set(dot, { x: mouseX, y: mouseY });
      };
      gsap.ticker.add(onTick);

      // Hover expansion on interactive elements
      const handleEnter = (e: Event) => {
        const target = e.target as HTMLElement;

        // Cards — expand + show "View" label
        if (target.closest("[data-project-id]")) {
          gsap.to(cursor, {
            width: 80,
            height: 80,
            backgroundColor: "rgba(45, 47, 47, 0.85)",
            duration: 0.3,
            ease: "power2.out",
          });
          label.style.opacity = "1";
          return;
        }

        // Links and buttons — subtle expand
        if (
          target.closest("a") ||
          target.closest("button") ||
          target.closest("[role='button']")
        ) {
          gsap.to(cursor, {
            width: 48,
            height: 48,
            duration: 0.25,
            ease: "power2.out",
          });
          return;
        }
      };

      const handleLeave = () => {
        gsap.to(cursor, {
          width: 16,
          height: 16,
          backgroundColor: "transparent",
          duration: 0.3,
          ease: "power2.out",
        });
        label.style.opacity = "0";
      };

      document.addEventListener("mouseover", handleEnter);
      document.addEventListener("mouseout", handleLeave);

      // Inject cursor-hide stylesheet via DOM (no styled-jsx).
      const style = document.createElement("style");
      style.textContent = "* { cursor: none !important; }";
      document.head.appendChild(style);
      styleRef.current = style;

      // Store cleanup refs in a closure-local variable.
      const cleanupFns = () => {
        gsap.ticker.remove(onTick);
        window.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseover", handleEnter);
        document.removeEventListener("mouseout", handleLeave);
        if (styleRef.current) {
          styleRef.current.remove();
          styleRef.current = null;
        }
      };

      // Attach cleanup to ref so the outer effect can call it.
      (cursor as unknown as { _cleanup?: () => void })._cleanup = cleanupFns;
    });

    return () => {
      cancelAnimationFrame(rafId);
      const cursor = cursorRef.current;
      if (cursor) {
        const c = cursor as unknown as { _cleanup?: () => void };
        c._cleanup?.();
      }
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [mounted]);

  // Render nothing on server or touch devices.
  if (!mounted) return null;

  return (
    <>
      {/* Outer circle — lerp delayed follow */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] flex h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#2d2f2f]/30 mix-blend-difference"
        style={{ willChange: "transform, width, height", backgroundColor: "transparent" }}
      >
        <span
          ref={labelRef}
          className="text-[10px] font-semibold uppercase tracking-[0.04em] text-white"
          style={{ opacity: 0, transition: "opacity 200ms" }}
        >
          View
        </span>
      </div>
      {/* Inner dot — follows mouse exactly */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2d2f2f]"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
