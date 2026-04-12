"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import ProjectCard from "@/components/card/ProjectCard";
import ProjectDetailPanel from "@/components/detail/ProjectDetailPanel";
import { carouselConfig as config } from "@/lib/carouselConfig";
import { TIMING } from "./carousel.constants";
import type { Project, ProjectListItem } from "@/types/project";
import type { DragState, ScrollPosition, VerticalState } from "./carousel.types";
import {
  resolveCanonicalCards,
  buildVerticalState,
  createChoreographyTimeline,
  createReverseTimeline,
  enterVerticalDirectly,
} from "./carousel.animations";
import { createTickHandler } from "./carousel.physics";
import {
  createWheelHandler,
  createPointerHandlers,
  createClickDelegate,
} from "./carousel.events";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProjectCarouselProps {
  projects: ProjectListItem[];
  initialSlug?: string;
  onDetailOpen?: () => void;
  onDetailClose?: () => void;
  onRegisterCloseHandler?: (handler: () => void) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectCarousel({
  projects,
  initialSlug,
  onDetailOpen,
  onDetailClose,
  onRegisterCloseHandler,
}: ProjectCarouselProps) {
  // --- DOM refs ---
  const stripRef = useRef<HTMLDivElement>(null);
  const set1Ref = useRef<HTMLDivElement>(null);

  // --- Repeat projects inside each set so set width always >= viewport ---
  const [repeats, setRepeats] = useState(1);

  // --- Scroll physics state (mutable refs, not React state) ---
  const setWidthRef = useRef(0);
  const posRef = useRef<ScrollPosition>({ target: 0, current: 0 });
  const impulseRef = useRef(0);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    lastX: 0,
    lastDx: 0,
    startTarget: null,
    startTargetPos: 0,
  });
  const pointerRef = useRef(0);

  // --- Projects ref (keeps current without re-running effects) ---
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // --- Detail panel state ---
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  // --- Animation state ---
  const isAnimatingRef = useRef(false);
  const animTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const modeRef = useRef<"horizontal" | "vertical">("horizontal");
  const cleanupRef = useRef<((targetScrollLeft?: number) => void) | null>(null);
  const nonCanonicalElsRef = useRef<HTMLElement[]>([]);
  const wheelAccumRef = useRef(0);
  const vStateRef = useRef<VerticalState | null>(null);
  const isMobileRef = useRef(false);

  // -----------------------------------------------------------------------
  // Open detail panel
  // -----------------------------------------------------------------------

  const openDetailForProject = useCallback(
    (listItem: ProjectListItem | Project) => {
      const skeleton: Project = {
        id: listItem.id,
        name: listItem.name,
        image: listItem.image,
        detail: {
          description: "",
          year: "",
          category: listItem.detail.category || "",
          discipline: listItem.detail.discipline,
          tags: [],
          role: [],
          content: [],
          credits: [],
          relatedProjects: [],
        },
      };
      setSelectedProject(skeleton);
      requestAnimationFrame(() => setPanelVisible(true));
      onDetailOpen?.();
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", `/project/${listItem.id}`);
      }
      fetch(`/api/project/${listItem.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((full: Project | null) => {
          if (full) setSelectedProject(full);
        })
        .catch(() => {});
    },
    [onDetailOpen],
  );

  // -----------------------------------------------------------------------
  // Choreography (horizontal → vertical)
  // -----------------------------------------------------------------------

  const runChoreography = useCallback(
    (clickedEl: HTMLElement) => {
      const strip = stripRef.current;
      if (!strip || isAnimatingRef.current) return;

      const { visible, nonCanonicalEls, vpRect } = resolveCanonicalCards(
        strip,
        projectsRef.current,
      );
      if (visible.length === 0) return;

      const clickedPid = clickedEl.dataset.projectId;
      const clickedIndex = clickedPid
        ? visible.findIndex((v) => v.el.dataset.projectId === clickedPid)
        : -1;
      const safeClickedIdx = clickedIndex >= 0 ? clickedIndex : 0;

      const cardW = visible[0].r.width;
      const cardH = visible[0].r.height;

      nonCanonicalElsRef.current = nonCanonicalEls;
      isAnimatingRef.current = true;
      impulseRef.current = 0;
      posRef.current.target = posRef.current.current;

      const ctx = { strip, visible, vpRect, safeClickedIdx, cardW, cardH };
      const vState = buildVerticalState(ctx);
      vStateRef.current = vState;
      modeRef.current = "vertical";

      animTimelineRef.current?.kill();
      animTimelineRef.current = createChoreographyTimeline(
        ctx,
        vState,
        nonCanonicalEls,
        posRef.current,
        {
          onOpenDetail: (projectId) => {
            const project = projectsRef.current.find((p) => p.id === projectId);
            if (project) openDetailForProject(project);
          },
          onComplete: (cleanup) => {
            posRef.current.target = 0;
            posRef.current.current = 0;
            impulseRef.current = 0;
            wheelAccumRef.current = 0;
            isAnimatingRef.current = false;
            cleanupRef.current = (targetScrollLeft?: number) => {
              cleanup(targetScrollLeft);
              modeRef.current = "horizontal";
              vStateRef.current = null;
              posRef.current.target = strip.scrollLeft;
              posRef.current.current = strip.scrollLeft;
              impulseRef.current = 0;
            };
          },
        },
      );
    },
    [openDetailForProject],
  );

  // -----------------------------------------------------------------------
  // Handle tap (horizontal → choreography, vertical → scroll to card)
  // -----------------------------------------------------------------------

  const handleTapRef = useRef<(project: ProjectListItem, el: HTMLElement) => void>(() => {});
  handleTapRef.current = (project: ProjectListItem, el: HTMLElement) => {
    if (modeRef.current === "vertical") {
      const v = vStateRef.current;
      if (v) {
        const tappedPid = el.dataset.projectId;
        const tapped = v.cards.find((c) => c.el.dataset.projectId === tappedPid);
        if (tapped) {
          const n = v.cards.length;
          const currentSlots = posRef.current.target / v.stepY;
          let currentSlotOff = tapped.baseOffset + currentSlots;
          currentSlotOff = ((currentSlotOff % n) + n) % n;
          if (currentSlotOff >= n / 2) currentSlotOff -= n;
          const targetScroll = posRef.current.target - currentSlotOff * v.stepY;
          gsap.killTweensOf(posRef.current);
          impulseRef.current = 0;
          gsap.to(posRef.current, {
            target: targetScroll,
            current: targetScroll,
            duration: TIMING.verticalTapScrollDur,
            ease: "expo.out",
          });
        }
      }
      openDetailForProject(project);
      return;
    }
    runChoreography(el);
  };

  // -----------------------------------------------------------------------
  // Close panel (reverse animation)
  // -----------------------------------------------------------------------

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }

    // Mobile: stay in vertical mode, don't reverse to horizontal.
    if (isMobileRef.current) {
      setTimeout(() => setSelectedProject(null), 500);
      onDetailClose?.();
      return;
    }

    if (modeRef.current === "vertical" && vStateRef.current && stripRef.current) {
      isAnimatingRef.current = true;
      gsap.killTweensOf(posRef.current);

      createReverseTimeline({
        vState: vStateRef.current,
        pos: posRef.current,
        strip: stripRef.current,
        nonCanonicalEls: nonCanonicalElsRef.current,
        onComplete: (rawNewScrollLeft) => {
          cleanupRef.current?.(rawNewScrollLeft);
          cleanupRef.current = null;
          isAnimatingRef.current = false;
          setSelectedProject(null);
          onDetailClose?.();
        },
      });
    } else {
      setTimeout(() => setSelectedProject(null), 500);
      onDetailClose?.();
    }
  }, [onDetailClose]);

  // -----------------------------------------------------------------------
  // Register close handler for parent
  // -----------------------------------------------------------------------

  useEffect(() => {
    onRegisterCloseHandler?.(() => closePanel());
  }, [onRegisterCloseHandler, closePanel]);

  // -----------------------------------------------------------------------
  // Auto-open when mounted with initialSlug
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!initialSlug) return;
    let tries = 0;
    const kick = () => {
      tries++;
      const strip = stripRef.current;
      if (!strip) {
        if (tries < 30) requestAnimationFrame(kick);
        return;
      }
      const el = strip.querySelector<HTMLElement>(
        `[data-project-id="${initialSlug}"]`,
      );
      if (!el) {
        if (tries < 30) requestAnimationFrame(kick);
        return;
      }
      runChoreography(el);
    };
    requestAnimationFrame(kick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  // -----------------------------------------------------------------------
  // Cinematic entrance — stagger cards on first mount (home only)
  // -----------------------------------------------------------------------

  const hasEnteredRef = useRef(false);

  useEffect(() => {
    if (initialSlug || hasEnteredRef.current) return;
    // Skip on mobile — we're in vertical mode already, this would clobber positions.
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const set1 = set1Ref.current;
    if (!set1) return;
    hasEnteredRef.current = true;

    const cards = Array.from(
      set1.querySelectorAll<HTMLElement>("[data-project-id]"),
    );
    if (cards.length === 0) return;

    gsap.from(cards, {
      x: 60,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
      delay: 0.15,
    });
  }, [initialSlug]);

  // -----------------------------------------------------------------------
  // Mobile: enter vertical mode BEFORE paint to avoid horizontal flash
  // -----------------------------------------------------------------------

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const strip = stripRef.current;
    if (!strip) return;

    if (window.innerWidth >= 768) {
      strip.dataset.mobileReady = "true";
      return;
    }

    isMobileRef.current = true;

    const runEnter = () => {
      if (modeRef.current === "vertical") return;
      const { visible, nonCanonicalEls } = resolveCanonicalCards(
        strip,
        projectsRef.current,
      );
      if (visible.length === 0) return false;
      const cardW = visible[0].r.width;
      const cardH = visible[0].r.height;
      if (cardW === 0 || cardH === 0) return false;
      const vpRect = strip.getBoundingClientRect();
      const vState = buildVerticalState({
        strip,
        visible,
        vpRect,
        safeClickedIdx: 0,
        cardW,
        cardH,
      });
      vStateRef.current = vState;
      nonCanonicalElsRef.current = nonCanonicalEls;
      modeRef.current = "vertical";
      enterVerticalDirectly({
        strip,
        visible,
        nonCanonicalEls,
        vState,
        cardW,
        cardH,
      });
      posRef.current.target = 0;
      posRef.current.current = 0;
      impulseRef.current = 0;
      strip.dataset.mobileReady = "true";
      return true;
    };

    if (!runEnter()) {
      // Cards not measured yet — retry on next frame.
      const rafId = requestAnimationFrame(() => {
        runEnter();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Main effect: physics tick + event listeners
  // -----------------------------------------------------------------------

  useEffect(() => {
    const strip = stripRef.current;
    const set1 = set1Ref.current;
    if (!strip || !set1) return;

    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;

    // Track set width for infinite-loop wrapping + auto-repeat projects.
    // Skip repeats recomputation on mobile (we use vertical mode, no loop).
    const doUpdateSetWidth = () => {
      // Measure the actual distance from set1's left edge to set2's left edge
      // — this is the true wrap distance regardless of padding / gap config.
      const set2 = set1.nextElementSibling as HTMLElement | null;
      if (set2) {
        const set1Rect = set1.getBoundingClientRect();
        const set2Rect = set2.getBoundingClientRect();
        setWidthRef.current = set2Rect.left - set1Rect.left;
      } else {
        setWidthRef.current = set1.offsetWidth + config.gap;
      }
      if (isMobileRef.current) return;
      const viewportW = window.innerWidth;
      const naturalSetW = set1.offsetWidth;
      if (naturalSetW > 0) {
        const needed = Math.max(1, Math.ceil((viewportW * 1.2) / (naturalSetW / repeats)));
        if (needed !== repeats) setRepeats(needed);
      }
    };
    // Debounce via rAF — coalesce rapid ResizeObserver/resize callbacks to a single update per frame.
    let updateRaf = 0;
    const updateSetWidth = () => {
      if (updateRaf) return;
      updateRaf = requestAnimationFrame(() => {
        updateRaf = 0;
        doUpdateSetWidth();
      });
    };
    doUpdateSetWidth();
    const ro = new ResizeObserver(updateSetWidth);
    ro.observe(set1);
    window.addEventListener("resize", updateSetWidth);


    // Physics tick.
    const onTick = createTickHandler({
      getPos: () => posRef.current,
      getImpulse: () => impulseRef.current,
      setImpulse: (v) => { impulseRef.current = v; },
      getIsAnimating: () => isAnimatingRef.current,
      getMode: () => modeRef.current,
      getVState: () => vStateRef.current,
      getSetWidth: () => setWidthRef.current,
      strip,
    });
    gsap.ticker.add(onTick);

    // Event handlers.
    const eventCtx = {
      strip,
      getMode: () => modeRef.current,
      getPos: () => posRef.current,
      getVState: () => vStateRef.current,
      getDrag: () => dragRef.current,
      setDrag: (d: DragState) => { dragRef.current = d; },
      getPointer: () => pointerRef.current,
      setPointer: (id: number) => { pointerRef.current = id; },
      getImpulse: () => impulseRef.current,
      setImpulse: (v: number) => { impulseRef.current = v; },
      getWheelAccum: () => wheelAccumRef.current,
      setWheelAccum: (v: number) => { wheelAccumRef.current = v; },
      getProjects: () => projectsRef.current,
      onTap: (project: ProjectListItem, el: HTMLElement) =>
        handleTapRef.current(project, el),
    };

    const handleWheel = createWheelHandler(eventCtx);
    const { onPointerDown, onPointerMove, onPointerUp } = createPointerHandlers(eventCtx);
    const onDocClick = createClickDelegate(eventCtx);

    window.addEventListener("wheel", handleWheel, { passive: false });
    strip.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    document.addEventListener("click", onDocClick);

    return () => {
      if (updateRaf) cancelAnimationFrame(updateRaf);
      ro.disconnect();
      window.removeEventListener("resize", updateSetWidth);
      gsap.ticker.remove(onTick);
      window.removeEventListener("wheel", handleWheel);
      strip.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("click", onDocClick);
    };
  }, [repeats]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

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
          data-carousel-strip=""
          className="scrollbar-hide flex w-full touch-none cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
          aria-label="Carousel de projetos"
          role="region"
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
            style={{ gap: config.gap }}
          >
            {Array.from({ length: repeats }).flatMap((_, r) =>
              projects.map((project, i) => (
                <ProjectCard
                  key={`s1-${r}-${project.id}`}
                  project={project}
                  // First 3 cards of the first set — all likely LCP candidates on wide viewports.
                  isFirst={r === 0 && i < 3}
                />
              )),
            )}
          </div>
          <div className="flex shrink-0 items-center" style={{ gap: config.gap }}>
            {Array.from({ length: repeats }).flatMap((_, r) =>
              projects.map((project) => (
                <ProjectCard key={`s2-${r}-${project.id}`} project={project} />
              )),
            )}
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
