"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Nav from "@/components/nav/Nav";
import Footer from "@/components/footer/Footer";
import ProjectCarousel from "@/components/carousel/ProjectCarousel";
import IntroCurtain from "@/components/intro/IntroCurtain";
import { introState } from "@/components/intro/introState";
import type { ProjectListItem } from "@/types/project";

interface HomeLayoutProps {
  projects: ProjectListItem[];
  initialSlug?: string;
}

export default function HomeLayout({ projects, initialSlug }: HomeLayoutProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Deep link to /project/[slug] or already-played → skip intro.
  const shouldSkipIntro = Boolean(initialSlug) || introState.hasPlayed;
  const [introDone, setIntroDone] = useState(shouldSkipIntro);
  const carouselReadyResolverRef = useRef<(() => void) | null>(null);
  const closeHandlerRef = useRef<() => void>(() => {});

  // Build the readyPromise after mount (client only) so SSR has no
  // Image global and the server's HTML matches the client's first render
  // (no curtain mounted until the layout effect has run).
  const readyPromiseRef = useRef<Promise<unknown> | null>(null);
  const [introReady, setIntroReady] = useState(false);
  useLayoutEffect(() => {
    if (shouldSkipIntro) return;
    if (readyPromiseRef.current !== null) return;
    const carouselReady = new Promise<void>((resolve) => {
      carouselReadyResolverRef.current = resolve;
    });
    const fontsReady =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready.then(() => undefined)
        : Promise.resolve();
    const criticalImages = projects
      .slice(0, 5)
      .map((p) => p.image)
      .filter((url): url is string => Boolean(url))
      .map((url) => {
        const img = new window.Image();
        img.src = url;
        return img.decode().catch(() => null);
      });
    readyPromiseRef.current = Promise.all([
      fontsReady,
      carouselReady,
      ...criticalImages,
    ]);
    setIntroReady(true);
  }, [shouldSkipIntro, projects]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const goHome = useCallback(() => {
    closeHandlerRef.current();
    setDetailOpen(false);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
  }, []);

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

  return (
    <div className="relative h-[100dvh] touch-none overflow-hidden bg-[#fdfdfc]">
      {!introDone && introReady && readyPromiseRef.current && (
        <IntroCurtain
          readyPromise={readyPromiseRef.current}
          onHandoff={handleIntroHandoff}
          onComplete={handleIntroComplete}
        />
      )}
      {/* Nav sits ABOVE the detail panel (z > panel's 201) on mobile so the
          logo + CONNECT stay visible when a project is open.
          Wrapper is pointer-events-none — only the logo/CONNECT buttons
          inside Nav have pointer-events-auto so clicks on the middle area
          (e.g. the close button) pass through.
          Mobile uses mix-blend-difference so the nav inverts over any
          content behind it (always legible regardless of card color). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[210] px-3 pt-3 pb-3">
        <Nav
          compact={detailOpen && !isMobile}
          onLogoClick={goHome}
          introDone={introDone}
        />
      </div>

      <div className="absolute inset-0 flex flex-col">
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
      </div>

      {/* Desktop-only footer — hidden on mobile (project list is full-screen) */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[100] hidden px-3 pb-3 transition-opacity duration-300 md:block ${
          detailOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-auto">
          <Footer introDone={introDone} />
        </div>
      </div>
    </div>
  );
}
