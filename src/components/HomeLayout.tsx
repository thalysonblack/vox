"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/nav/Nav";
import ProjectCarousel from "@/components/carousel/ProjectCarousel";
import type { ProjectListItem } from "@/types/project";

interface HomeLayoutProps {
  projects: ProjectListItem[];
  initialSlug?: string;
}

export default function HomeLayout({ projects, initialSlug }: HomeLayoutProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const closeHandlerRef = useRef<() => void>(() => {});

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

  return (
    <div className="relative h-[100dvh] touch-none overflow-hidden bg-[#fdfdfc]">
      {/* Nav sits ABOVE the detail panel (z > panel's 201) on mobile so the
          logo + CONNECT stay visible when a project is open.
          Wrapper is pointer-events-none — only the logo/CONNECT buttons
          inside Nav have pointer-events-auto so clicks on the middle area
          (e.g. the close button) pass through. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[210] px-3 pt-3 pb-3">
        <Nav compact={detailOpen && !isMobile} onLogoClick={goHome} />
      </div>

      <div className="absolute inset-0 flex flex-col">
        <ProjectCarousel
          projects={projects}
          initialSlug={initialSlug}
          onDetailOpen={() => setDetailOpen(true)}
          onDetailClose={() => setDetailOpen(false)}
          onRegisterCloseHandler={(fn) => {
            closeHandlerRef.current = fn;
          }}
        />
      </div>

    </div>
  );
}
