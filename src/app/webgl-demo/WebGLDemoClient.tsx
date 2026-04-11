"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { ProjectListItem } from "@/types/project";

const WebGLCarouselLayer = dynamic(
  () => import("@/components/WebGLCarouselLayer"),
  { ssr: false },
);

interface Props {
  projects: ProjectListItem[];
}

export default function WebGLDemoClient({ projects }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ target: 0, current: 0 });
  const impulseRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const modeRef = useRef<"horizontal" | "vertical">("horizontal");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadedTextures, setLoadedTextures] = useState<Set<string>>(new Set());

  // Simple scroll physics
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      impulseRef.current -= e.deltaY * 0.038;
    };
    strip.addEventListener("wheel", handleWheel, { passive: false });

    let raf: number;
    const tick = () => {
      const friction = 0.96;
      impulseRef.current *= friction;
      if (Math.abs(impulseRef.current) < 0.01) impulseRef.current = 0;
      posRef.current.target += impulseRef.current;
      const diff = posRef.current.target - posRef.current.current;
      posRef.current.current += diff * 0.1;

      if (strip.scrollWidth > strip.clientWidth) {
        const max = strip.scrollWidth / 2;
        const wrapped = ((posRef.current.current % max) + max) % max;
        strip.scrollLeft = wrapped;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      strip.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#fdfdfc]">
      <div className="shrink-0 px-6 py-4">
        <h1 className="text-[18px] font-semibold tracking-[-0.72px]">
          WebGL Wave Demo
        </h1>
        <p className="text-[13px] text-black/40">
          Scroll no carousel para ver a distorção wave. Hover nos cards intensifica o efeito.
        </p>
      </div>

      <div ref={containerRef} className="relative flex min-h-0 flex-1 items-center">
        <WebGLCarouselLayer
          projects={projects}
          containerRef={containerRef}
          stripRef={stripRef}
          posRef={posRef}
          impulseRef={impulseRef}
          isAnimatingRef={isAnimatingRef}
          modeRef={modeRef}
          hoveredId={hoveredId}
          onTextureLoaded={(id) => {
            setLoadedTextures((prev) => {
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }}
        />

        <div
          ref={stripRef}
          className="scrollbar-hide relative z-[2] flex w-full touch-none cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
          style={{ gap: 12 }}
        >
          <div className="flex shrink-0 items-center" style={{ gap: 12, paddingLeft: 12 }}>
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex shrink-0 cursor-pointer select-none flex-col pt-[8px]"
                style={{ width: 446, minWidth: 446, height: 601 }}
                onPointerEnter={() => setHoveredId(project.id)}
                onPointerLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center justify-between px-0 py-[8px]">
                  <span className="text-[14px] font-semibold tracking-[-0.56px] text-black">
                    {project.name}
                  </span>
                </div>
                <div className="relative w-full min-h-0 flex-1 overflow-hidden rounded-[4px]">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    className="pointer-events-none object-cover transition-opacity duration-300"
                    style={{ opacity: loadedTextures.has(project.id) ? 0 : 1 }}
                    sizes="30vw"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center" style={{ gap: 12 }}>
            {projects.map((project) => (
              <div
                key={`dup-${project.id}`}
                className="group flex shrink-0 cursor-pointer select-none flex-col pt-[8px]"
                style={{ width: 446, minWidth: 446, height: 601 }}
                onPointerEnter={() => setHoveredId(project.id)}
                onPointerLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center justify-between px-0 py-[8px]">
                  <span className="text-[14px] font-semibold tracking-[-0.56px] text-black">
                    {project.name}
                  </span>
                </div>
                <div className="relative w-full min-h-0 flex-1 overflow-hidden rounded-[4px]">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    className="pointer-events-none object-cover transition-opacity duration-300"
                    style={{ opacity: loadedTextures.has(project.id) ? 0 : 1 }}
                    sizes="30vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
