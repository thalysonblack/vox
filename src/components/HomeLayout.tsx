"use client";

import { useCallback, useRef, useState } from "react";
import Nav from "@/components/nav/Nav";
import ProjectCarousel from "@/components/carousel/ProjectCarousel";
import type { ProjectListItem } from "@/types/project";

interface HomeLayoutProps {
  projects: ProjectListItem[];
  initialSlug?: string;
}

export default function HomeLayout({ projects, initialSlug }: HomeLayoutProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const closeHandlerRef = useRef<() => void>(() => {});

  const goHome = useCallback(() => {
    closeHandlerRef.current();
    setDetailOpen(false);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
  }, []);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#fdfdfc]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] px-3 pt-3 pb-3">
        <div className="pointer-events-auto">
          <Nav compact={detailOpen} onLogoClick={goHome} />
        </div>
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
