"use client";

import { useCallback, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectCarousel from "@/components/ProjectCarousel";
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#fdfdfc]">
      <div className="shrink-0 px-3 pt-3 pb-3">
        <Nav compact={detailOpen} onLogoClick={goHome} />
      </div>

      <ProjectCarousel
        projects={projects}
        initialSlug={initialSlug}
        onDetailOpen={() => setDetailOpen(true)}
        onDetailClose={() => setDetailOpen(false)}
        onRegisterCloseHandler={(fn) => {
          closeHandlerRef.current = fn;
        }}
      />

      <div
        className={`shrink-0 px-3 pb-3 transition-opacity duration-300 ${
          detailOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Footer />
      </div>
    </div>
  );
}
