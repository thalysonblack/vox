"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import ProjectCard from "@/components/ProjectCard";
import ProjectDetailPanel from "@/components/ProjectDetailPanel";
import { carouselConfig as config } from "@/lib/carouselConfig";
import type { Project } from "@/types/project";

interface ProjectCarouselProps {
  projects: Project[];
}

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const set1Ref = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const posRef = useRef({ target: 0, current: 0 });
  const impulseRef = useRef(0);

  const dragRef = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastDx: 0,
    startTarget: null as EventTarget | null,
  });
  const pointerRef = useRef(0);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const handleTapRef = useRef<(project: Project) => void>(() => {});
  handleTapRef.current = (project: Project) => {
    setSelectedProject(project);
    requestAnimationFrame(() => setPanelVisible(true));
  };

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    setTimeout(() => setSelectedProject(null), 500);
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    const set1 = set1Ref.current;
    if (!strip || !set1) return;

    const gap = config.gap;
    const pos = posRef.current;

    const updateSetWidth = () => {
      setWidthRef.current = set1.offsetWidth + gap;
    };
    updateSetWidth();
    const ro = new ResizeObserver(updateSetWidth);
    ro.observe(set1);

    const wrap = (v: number, sw: number) => ((v % sw) + sw) % sw;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      impulseRef.current -= e.deltaY * config.wheel;
    };
    strip.addEventListener("wheel", handleWheel, { passive: false });

    const onPointerDown = (e: PointerEvent) => {
      if (!config.drag) return;
      pointerRef.current = e.pointerId;
      strip.setPointerCapture?.(e.pointerId);
      impulseRef.current = 0;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        lastX: e.clientX,
        lastDx: 0,
        startTarget: e.target,
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current || !dragRef.current.active) return;
      const dx = (e.clientX - dragRef.current.lastX) * config.dragSensitivity;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastDx = dx;
      impulseRef.current = -dx;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      strip.releasePointerCapture?.(e.pointerId);
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      const totalDrag = Math.abs(e.clientX - d.startX);
      if (totalDrag <= config.tapThreshold) {
        const el = d.startTarget as Element | null;
        const cardEl = el?.closest<HTMLElement>("[data-project-id]");
        if (cardEl) {
          const projectId = cardEl.dataset.projectId;
          const project = projectsRef.current.find((p) => p.id === projectId);
          if (project) handleTapRef.current(project);
        }
        return;
      }
      impulseRef.current = -d.lastDx * (config.fling / 100);
    };

    strip.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const onTick = () => {
      const sw = setWidthRef.current;
      if (sw <= 0) return;

      const dt = gsap.ticker.deltaRatio(60);
      const friction = Math.pow(0.98, dt);
      impulseRef.current *= friction;
      if (Math.abs(impulseRef.current) < 0.01) impulseRef.current = 0;

      pos.target += impulseRef.current * dt;

      const ease = 1 - Math.pow(config.smooth, dt);
      const diff = pos.target - pos.current;
      if (Math.abs(diff) < 0.3) {
        pos.current = pos.target;
      } else {
        pos.current += diff * ease;
      }

      strip.scrollLeft = wrap(pos.current, sw);
    };

    gsap.ticker.add(onTick);

    return () => {
      ro.disconnect();
      gsap.ticker.remove(onTick);
      strip.removeEventListener("wheel", handleWheel);
      strip.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const vAlignClass =
    config.vAlign === "Center"
      ? "items-center"
      : config.vAlign === "Top"
        ? "items-start"
        : "items-end";

  if (projects.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-[14px] font-semibold tracking-[-0.56px] text-black/30">
          No projects yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex min-h-0 flex-1 justify-center ${vAlignClass}`}>
        <section
          ref={stripRef}
          className="scrollbar-hide flex w-full touch-none cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
          style={{
            gap: config.gap,
            ["--card-width" as string]: `${config.cardWidth}px`,
            ["--card-height" as string]: `${config.cardHeight}px`,
            ["--carousel-gap" as string]: `${config.gap}px`,
            ["--carousel-radius" as string]: `${config.radius}px`,
          }}
        >
          <div
            ref={set1Ref}
            className="flex shrink-0 items-center"
            style={{ gap: config.gap, paddingLeft: 12 }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div
            className="flex shrink-0 items-center"
            style={{ gap: config.gap }}
          >
            {projects.map((project) => (
              <ProjectCard key={`dup-${project.id}`} project={project} />
            ))}
          </div>
        </section>
      </div>

      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          visible={panelVisible}
          onClose={closePanel}
        />
      )}
    </>
  );
}
