"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import ProjectCard from "@/components/ProjectCard";
import ProjectDetailPanel from "@/components/ProjectDetailPanel";
import { carouselConfig as config } from "@/lib/carouselConfig";
import type { Project, ProjectListItem } from "@/types/project";

interface ProjectCarouselProps {
  projects: ProjectListItem[];
  initialSlug?: string;
  onDetailOpen?: () => void;
  onDetailClose?: () => void;
  onRegisterCloseHandler?: (handler: () => void) => void;
}

export default function ProjectCarousel({
  projects,
  initialSlug,
  onDetailOpen,
  onDetailClose,
  onRegisterCloseHandler,
}: ProjectCarouselProps) {
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

  const isAnimatingRef = useRef(false);
  const animTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const modeRef = useRef<"horizontal" | "vertical">("horizontal");
  const cleanupRef = useRef<((targetScrollLeft?: number) => void) | null>(
    null,
  );
  const nonCanonicalElsRef = useRef<HTMLElement[]>([]);
  const verticalIdxRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const vStateRef = useRef<{
    cards: Array<{
      el: HTMLElement;
      curCy: number;
      baseOffset: number;
      setY: (n: number) => void;
      setScale: (n: number) => void;
    }>;
    stepY: number;
    step01: number;
    step12: number;
    stepOther: number;
    clickedCy: number;
    centerScale: number;
    adjacentScale: number;
    otherScale: number;
    savedScrollLeft: number;
    safeClickedIdx: number;
    horizontalStride: number;
  } | null>(null);

  const runChoreography = useCallback((clickedEl: HTMLElement) => {
    const strip = stripRef.current;
    if (!strip || isAnimatingRef.current) return;

    const vpRect = strip.getBoundingClientRect();
    const allCards = Array.from(strip.querySelectorAll<HTMLElement>("[data-project-id]"));

    // Carousel is infinite-loop with duplicated DOM (set1 + set2). Pick ONE
    // canonical instance per project (the one closest to viewport center)
    // so every project participates, not only the ~4 currently visible.
    const vpCenterX = vpRect.left + vpRect.width / 2;
    const instances = new Map<string, HTMLElement[]>();
    for (const el of allCards) {
      const pid = el.dataset.projectId;
      if (!pid) continue;
      if (!instances.has(pid)) instances.set(pid, []);
      instances.get(pid)!.push(el);
    }

    const projectsList = projectsRef.current;
    const visible: { el: HTMLElement; r: DOMRect }[] = [];
    const nonCanonicalEls: HTMLElement[] = [];
    for (const project of projectsList) {
      const els = instances.get(project.id);
      if (!els || els.length === 0) continue;
      let best = els[0];
      let bestDist = Infinity;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const d = Math.abs(cx - vpCenterX);
        if (d < bestDist) {
          bestDist = d;
          best = el;
        }
      }
      visible.push({ el: best, r: best.getBoundingClientRect() });
      for (const el of els) if (el !== best) nonCanonicalEls.push(el);
    }

    if (visible.length === 0) return;

    // Map clicked DOM element to its canonical instance by project id.
    const clickedPid = clickedEl.dataset.projectId;
    const clickedIndex = clickedPid
      ? visible.findIndex((v) => v.el.dataset.projectId === clickedPid)
      : -1;
    const safeClickedIdx = clickedIndex >= 0 ? clickedIndex : 0;

    // Keep duplicates visible during the transition — infinite carousel
    // stays intact visually. Fade them out as cards settle into the column.
    gsap.set(nonCanonicalEls, { pointerEvents: "none" });
    gsap.to(nonCanonicalEls, {
      opacity: 0,
      duration: 0.4,
      delay: 0.9,
      ease: "power2.out",
    });
    nonCanonicalElsRef.current = nonCanonicalEls;

    // Apply the vertical title font-size IMMEDIATELY so the CSS transition
    // runs in parallel with the card animation (not at the end).
    visible.forEach(({ el }) => {
      const titleSpan = el.querySelector<HTMLElement>(
        "div > span:first-child",
      );
      if (titleSpan) {
        titleSpan.style.fontSize = "22px";
        titleSpan.style.letterSpacing = "-0.88px";
      }
    });

    isAnimatingRef.current = true;
    impulseRef.current = 0;
    posRef.current.target = posRef.current.current;

    // Allow cards to move freely outside the strip during motion.
    // Switching to overflow:visible makes the strip stop being a scroll
    // container, so scrollLeft loses its visual effect and cards would snap.
    // Compensate by baking scrollLeft into the inner sets as a translateX.
    const prevOverflow = strip.style.overflow;
    const savedScrollLeft = strip.scrollLeft;
    const innerDivs = Array.from(strip.children) as HTMLElement[];
    gsap.set(innerDivs, { x: -savedScrollLeft });
    strip.scrollLeft = 0;
    strip.style.overflow = "visible";

    const n = visible.length;
    const vpW = vpRect.width;
    const vpH = vpRect.height;
    // Use the first visible card's dimensions as the baseline (all cards share size).
    const cardW = visible[0].r.width;
    const cardH = visible[0].r.height;

    // --- Phase A: Horizontal row — shrink directly to vertical scales ---
    // Use Phase B's final scales so cards don't need to re-adjust during B.
    const pAClickedScale = 0.54; // matches pBCenterScale
    const pAOtherScale = 0.36; // matches pBOtherScale
    const pAGap = Math.max(config.gap * 2.2, 96);
    const pAClickedCw = cardW * pAClickedScale;
    const pAOtherCw = cardW * pAOtherScale;
    const pAScaleForIdx = (i: number) => (i === safeClickedIdx ? pAClickedScale : pAOtherScale);
    const pACxForIdx = (i: number) => {
      const offset = i - safeClickedIdx;
      if (offset === 0) return vpW / 2;
      const sign = Math.sign(offset);
      const absOff = Math.abs(offset);
      const dist = pAClickedCw / 2 + pAGap + (absOff - 1) * (pAOtherCw + pAGap) + pAOtherCw / 2;
      return vpW / 2 + sign * dist;
    };
    const pACenterY = vpH / 2;

    // --- Phase B: Vertical selector — active (center) bigger, others smaller ---
    const fullWinH = window.innerHeight;
    const effectiveVpH = Math.max(vpH, fullWinH - vpRect.top - 24);
    const pBCenterScale = 0.48; // active card at center
    const pBAdjacentScale = 0.38; // slot ±1 cards (progressive bridge)
    const pBOtherScale = 0.26; // slot ±2+ cards (uniform)
    const pBCenterCh = cardH * pBCenterScale;
    const pBAdjCh = cardH * pBAdjacentScale;
    const pBOtherCh = cardH * pBOtherScale;
    const pBCenterCw = cardW * pBCenterScale;
    const pBGap = 32;
    // Three step values for uniform 32px gaps between every adjacent pair:
    const step01 = pBCenterCh / 2 + pBGap + pBAdjCh / 2; // center ↔ ±1
    const step12 = pBAdjCh / 2 + pBGap + pBOtherCh / 2; // ±1 ↔ ±2
    const stepOther = pBOtherCh + pBGap; // ±k ↔ ±(k+1), k≥2
    const minStepY = step01;
    const bufferY = pBCenterCh;
    const pBStepY = Math.max(minStepY, (effectiveVpH + 2 * bufferY) / n);
    const pBClickedCy = fullWinH / 2 - vpRect.top;
    const p4X = 96 + pBCenterCw / 2;

    // Build vertical state EARLY so closePanel can trigger reverse animation
    // even if user clicks close mid-forward-animation.
    const cards = visible.map(({ el, r }, i) => {
      const curCy = r.top - vpRect.top + cardH / 2;
      return {
        el,
        curCy,
        baseOffset: i - safeClickedIdx,
        setY: gsap.quickSetter(el, "y", "px") as (n: number) => void,
        setScale: gsap.quickSetter(el, "scale") as (n: number) => void,
      };
    });
    vStateRef.current = {
      cards,
      stepY: pBStepY,
      step01,
      step12,
      stepOther,
      clickedCy: pBClickedCy,
      centerScale: pBCenterScale,
      adjacentScale: pBAdjacentScale,
      otherScale: pBOtherScale,
      savedScrollLeft,
      safeClickedIdx,
      horizontalStride: cardW + config.gap,
    };
    modeRef.current = "vertical";
    verticalIdxRef.current = safeClickedIdx;
    // Make cards clearly clickable.
    cards.forEach((c) => {
      c.el.style.cursor = "pointer";
      c.el.style.pointerEvents = "auto";
    });

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => {
        // Reset scroll physics for the vertical axis.
        posRef.current.target = 0;
        posRef.current.current = 0;
        impulseRef.current = 0;
        wheelAccumRef.current = 0;
        isAnimatingRef.current = false;

        // Store cleanup closure — called after reverse animation completes.
        cleanupRef.current = (targetScrollLeft?: number) => {
          cards.forEach((c) => {
            c.el.style.cursor = "";
            c.el.style.pointerEvents = "";
            const titleSpan = c.el.querySelector<HTMLElement>(
              "div > span:first-child",
            );
            if (titleSpan) {
              titleSpan.style.fontSize = "";
              titleSpan.style.letterSpacing = "";
            }
            const titleRow = c.el.firstElementChild as HTMLElement | null;
            if (titleRow) {
              titleRow.style.transform = "";
              titleRow.style.backgroundColor = "";
              titleRow.style.paddingLeft = "";
              titleRow.style.paddingRight = "";
            }
            // Clear gsap transforms — cards ended at (targetXDelta, 0, 1).
            gsap.set(c.el, { x: 0, y: 0, scale: 1, rotation: 0 });
          });
          // Restore duplicate cards
          gsap.set(nonCanonicalEls, { opacity: 1, pointerEvents: "auto" });
          // Restore strip overflow + reset innerDivs translation
          strip.style.overflow = prevOverflow;
          gsap.set(innerDivs, { x: 0 });

          // Apply the target scrollLeft (compensates for gsap.x clear above).
          const sw = setWidthRef.current || (cardW + config.gap) * n;
          const scrollValue =
            targetScrollLeft !== undefined ? targetScrollLeft : savedScrollLeft;
          strip.scrollLeft = ((scrollValue % sw) + sw) % sw;
          // Reset carousel state
          modeRef.current = "horizontal";
          vStateRef.current = null;
          posRef.current.target = strip.scrollLeft;
          posRef.current.current = strip.scrollLeft;
          impulseRef.current = 0;
        };

      },
    });
    animTimelineRef.current?.kill();
    animTimelineRef.current = tl;

    // Open the detail panel near the end of the cascade.
    tl.call(
      () => {
        const clickedPid = clickedEl.dataset.projectId;
        const clickedProject = projectsRef.current.find(
          (p) => p.id === clickedPid,
        );
        if (clickedProject) {
          openDetailForProject(clickedProject);
        }
      },
      [],
      0.85,
    );

    // Two overlapping movements: cascade in, then slide to the left stack.
    const PA_START = 0;
    const PA_DUR = 0.95;
    const PB_START = 0.6;
    const PB_DUR = 1.05;

    visible.forEach(({ el, r }, i) => {
      const curCx = r.left - vpRect.left + cardW / 2;
      const curCy = r.top - vpRect.top + cardH / 2;

      gsap.set(el, {
        zIndex: i === safeClickedIdx ? 100 : 80 - Math.abs(i - safeClickedIdx),
        transformOrigin: "50% 50%",
      });

      // Phase A target: horizontal row, clicked card focused at viewport center
      const pACx = pACxForIdx(i);
      const pACy = pACenterY;
      const pAScaleI = pAScaleForIdx(i);

      // Phase B target — matches tick exactly (wrap + 3-tier stepping).
      const halfN = n / 2;
      let slotOffset = i - safeClickedIdx;
      slotOffset = ((slotOffset % n) + n) % n;
      if (slotOffset >= halfN) slotOffset -= n;
      const pBCx = p4X;
      const absSlot = Math.abs(slotOffset);
      const slotSign = Math.sign(slotOffset);
      let pBYOffset: number;
      if (absSlot <= 1) {
        pBYOffset = slotSign * absSlot * step01;
      } else if (absSlot <= 2) {
        pBYOffset = slotSign * (step01 + (absSlot - 1) * step12);
      } else {
        pBYOffset =
          slotSign * (step01 + step12 + (absSlot - 2) * stepOther);
      }
      const pBCy = pBClickedCy + pBYOffset;

      // Scale matches tick — 3-tier progressive.
      const progressiveScale = (() => {
        const abs = Math.abs(slotOffset);
        if (abs <= 1) {
          return pBCenterScale - (pBCenterScale - pBAdjacentScale) * abs;
        } else if (abs <= 2) {
          return pBAdjacentScale - (pBAdjacentScale - pBOtherScale) * (abs - 1);
        } else {
          return pBOtherScale;
        }
      })();

      // Unused in new flow but referenced to avoid lint warnings.
      void pACx;
      void pACy;
      void pAScaleI;

      // Single continuous animation: each card goes from its horizontal
      // position DIRECTLY to its vertical column slot. Infinite carousel
      // remains visible (via duplicates) throughout the transition.
      const PB1_DUR = 0.9;
      const PB2_DUR = 0.95;
      const pBScaleI = progressiveScale;

      // Y + scale first (card rises/falls toward its vertical slot).
      tl.to(
        el,
        {
          y: pBCy - curCy,
          scale: pBScaleI,
          rotation: 0,
          duration: PB1_DUR,
        },
        0,
      );

      const b2Start = 0.35;
      // X slides left to the column column, overlapping with Y.
      tl.to(
        el,
        {
          x: pBCx - curCx,
          duration: PB2_DUR,
        },
        b2Start
      );
    });

    // Store cleanup closure on the timeline so we can restore overflow if needed
    (tl as unknown as { _restore?: () => void })._restore = () => {
      strip.style.overflow = prevOverflow;
    };
  }, []);

  const handleTapRef = useRef<(project: ProjectListItem, el: HTMLElement) => void>(() => {});
  handleTapRef.current = (project: ProjectListItem, el: HTMLElement) => {
    if (modeRef.current === "vertical") {
      const v = vStateRef.current;
      if (v) {
        const tappedPid = el.dataset.projectId;
        const tapped = v.cards.find((c) => c.el.dataset.projectId === tappedPid);
        if (tapped) {
          // Shortest-path scroll around the infinite loop.
          const n = v.cards.length;
          const currentSlots = posRef.current.target / v.stepY;
          // Card's current visual slotOff (wrapped).
          let currentSlotOff = tapped.baseOffset + currentSlots;
          currentSlotOff = ((currentSlotOff % n) + n) % n;
          if (currentSlotOff >= n / 2) currentSlotOff -= n;
          // Adjust scroll by -currentSlotOff to bring card to center.
          const targetScroll = posRef.current.target - currentSlotOff * v.stepY;
          gsap.killTweensOf(posRef.current);
          impulseRef.current = 0;
          gsap.to(posRef.current, {
            target: targetScroll,
            current: targetScroll,
            duration: 0.55,
            ease: "expo.out",
          });
        }
      }
      openDetailForProject(project);
      return;
    }
    runChoreography(el);
  };

  const closePanel = useCallback(() => {
    // Panel slides out immediately.
    setPanelVisible(false);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }

    // If we're in vertical mode, reverse-animate cards back to horizontal.
    if (modeRef.current === "vertical" && vStateRef.current) {
      const v = vStateRef.current;
      // Reset title font-size IMMEDIATELY so CSS transition runs in parallel.
      v.cards.forEach((c) => {
        const titleSpan = c.el.querySelector<HTMLElement>(
          "div > span:first-child",
        );
        if (titleSpan) {
          titleSpan.style.fontSize = "";
          titleSpan.style.letterSpacing = "";
        }
        const titleRow = c.el.firstElementChild as HTMLElement | null;
        if (titleRow) {
          titleRow.style.transform = "";
          titleRow.style.backgroundColor = "";
          titleRow.style.paddingLeft = "";
          titleRow.style.paddingRight = "";
        }
      });

      // Compute new scrollLeft that centers the CURRENTLY active card.
      const n = v.cards.length;
      const curScrollSlots = posRef.current.current / v.stepY;
      const activeIdx =
        (v.safeClickedIdx - Math.round(curScrollSlots) + n * 1000) % n;
      const stripEl = stripRef.current;
      const stripW = stripEl ? stripEl.getBoundingClientRect().width : 0;
      const cardCenterX =
        12 + activeIdx * v.horizontalStride + (v.horizontalStride - config.gap) / 2;
      const rawNewScrollLeft = cardCenterX - stripW / 2;
      // Animate cards to the position that corresponds to this new scroll.
      const targetXDelta = v.savedScrollLeft - rawNewScrollLeft;

      // Fade duplicates BACK IN gradually, parallel to the reverse animation.
      if (nonCanonicalElsRef.current.length > 0) {
        gsap.killTweensOf(nonCanonicalElsRef.current);
        gsap.to(nonCanonicalElsRef.current, {
          opacity: 1,
          duration: 0.55,
          delay: 0.25,
          ease: "power2.out",
        });
      }

      isAnimatingRef.current = true;
      gsap.killTweensOf(posRef.current);
      const reverseTl = gsap.timeline({
        onComplete: () => {
          // Apply the new scroll state BEFORE clearing gsap transforms.
          cleanupRef.current?.(rawNewScrollLeft);
          cleanupRef.current = null;
          isAnimatingRef.current = false;
          setSelectedProject(null);
          onDetailClose?.();
        },
      });
      v.cards.forEach((c) => {
        reverseTl.to(
          c.el,
          {
            x: targetXDelta,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.85,
            ease: "expo.out",
          },
          0,
        );
      });
    } else {
      setTimeout(() => setSelectedProject(null), 500);
      onDetailClose?.();
    }
  }, [onDetailClose]);

  const openDetailForProject = useCallback(
    (listItem: ProjectListItem | Project) => {
      // Build a skeleton Project so the panel can render immediately.
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
      // Fetch full project content in background.
      fetch(`/api/project/${listItem.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((full: Project | null) => {
          if (full) setSelectedProject(full);
        })
        .catch(() => {});
    },
    [onDetailOpen],
  );

  // Expose closePanel to parent so logo click can trigger it.
  useEffect(() => {
    onRegisterCloseHandler?.(() => closePanel());
  }, [onRegisterCloseHandler, closePanel]);

  // Auto-open choreography when mounted with initialSlug (direct URL access).
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

    const advanceVerticalCard = (dir: number) => {
      const v = vStateRef.current;
      if (!v) return;
      // Infinite loop — no clamping.
      const targetScroll = pos.target - dir * v.stepY;
      gsap.killTweensOf(pos);
      impulseRef.current = 0;
      gsap.to(pos, {
        target: targetScroll,
        current: targetScroll,
        duration: 0.45,
        ease: "expo.out",
      });
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      // Skip if scroll originated inside a scrollable element (detail panel).
      const target = e.target as Element | null;
      if (target?.closest("[data-scrollable-panel]")) return;
      e.preventDefault();
      if (modeRef.current === "vertical") {
        // Discrete snap per wheel accumulation — no continuous physics.
        wheelAccumRef.current += e.deltaY;
        const threshold = 40;
        if (Math.abs(wheelAccumRef.current) >= threshold) {
          const dir = Math.sign(wheelAccumRef.current);
          wheelAccumRef.current = 0;
          advanceVerticalCard(dir);
        }
        return;
      }
      impulseRef.current -= e.deltaY * config.wheel;
    };
    // Attach to window so wheel works anywhere on the page.
    window.addEventListener("wheel", handleWheel, { passive: false });

    const onPointerDown = (e: PointerEvent) => {
      if (!config.drag) return;
      pointerRef.current = e.pointerId;
      strip.setPointerCapture?.(e.pointerId);
      impulseRef.current = 0;
      dragRef.current = {
        active: true,
        startX: modeRef.current === "vertical" ? e.clientY : e.clientX,
        lastX: modeRef.current === "vertical" ? e.clientY : e.clientX,
        lastDx: 0,
        startTarget: e.target,
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current || !dragRef.current.active) return;
      const axis = modeRef.current === "vertical" ? e.clientY : e.clientX;
      const dx = (axis - dragRef.current.lastX) * config.dragSensitivity;
      dragRef.current.lastX = axis;
      dragRef.current.lastDx = dx;
      if (modeRef.current === "vertical") return; // no continuous drag in snap mode
      impulseRef.current = -dx;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      strip.releasePointerCapture?.(e.pointerId);
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      const axisUp = modeRef.current === "vertical" ? e.clientY : e.clientX;
      const totalDrag = Math.abs(axisUp - d.startX);

      // Vertical mode: any movement < DRAG_STEP counts as a tap.
      if (modeRef.current === "vertical") {
        const DRAG_STEP = 60;
        if (totalDrag < DRAG_STEP) {
          const el = d.startTarget as Element | null;
          const cardEl = el?.closest<HTMLElement>("[data-project-id]");
          if (cardEl) {
            const projectId = cardEl.dataset.projectId;
            const project = projectsRef.current.find((p) => p.id === projectId);
            if (project) handleTapRef.current(project, cardEl);
          }
        } else {
          const delta = axisUp - d.startX;
          const steps = Math.round(totalDrag / DRAG_STEP);
          const dir = delta < 0 ? 1 : -1;
          for (let i = 0; i < steps; i++) advanceVerticalCard(dir);
        }
        return;
      }

      if (totalDrag <= config.tapThreshold) {
        const el = d.startTarget as Element | null;
        const cardEl = el?.closest<HTMLElement>("[data-project-id]");
        if (cardEl) {
          const projectId = cardEl.dataset.projectId;
          const project = projectsRef.current.find((p) => p.id === projectId);
          if (project) handleTapRef.current(project, cardEl);
        }
        return;
      }
      impulseRef.current = -d.lastDx * (config.fling / 100);
    };

    strip.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Reliable click detection for vertical mode — document-level delegate.
    const onDocClick = (e: MouseEvent) => {
      if (modeRef.current !== "vertical") return;
      const target = e.target as Element | null;
      const cardEl = target?.closest<HTMLElement>("[data-project-id]");
      if (!cardEl) return;
      if (cardEl.style.pointerEvents === "none") return;
      if (cardEl.style.opacity === "0") return;
      const projectId = cardEl.dataset.projectId;
      const project = projectsRef.current.find((p) => p.id === projectId);
      if (!project) return;
      handleTapRef.current(project, cardEl);
    };
    document.addEventListener("click", onDocClick);

    const onTick = () => {
      if (isAnimatingRef.current) return;

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

      if (modeRef.current === "vertical") {
        const v = vStateRef.current;
        if (!v) return;
        const scrollSlots = pos.current / v.stepY;
        const n = v.cards.length;
        const halfN = n / 2;
        for (const c of v.cards) {
          // Infinite loop: wrap slot offset into [-n/2, n/2).
          let slotOff = c.baseOffset + scrollSlots;
          slotOff = ((slotOff % n) + n) % n;
          if (slotOff >= halfN) slotOff -= n;
          const absOff = Math.abs(slotOff);
          const sign = Math.sign(slotOff);
          // Three-tier stepping for uniform 32px gaps:
          //   zone 0-1: center ↔ ±1  (step01)
          //   zone 1-2: ±1 ↔ ±2      (step12)
          //   zone 2+:  ±k ↔ ±(k+1)  (stepOther)
          let yOffset: number;
          if (absOff <= 1) {
            yOffset = sign * absOff * v.step01;
          } else if (absOff <= 2) {
            yOffset = sign * (v.step01 + (absOff - 1) * v.step12);
          } else {
            yOffset =
              sign *
              (v.step01 + v.step12 + (absOff - 2) * v.stepOther);
          }
          const y = v.clickedCy + yOffset;
          // Three-tier scale interpolation.
          let scale: number;
          if (absOff <= 1) {
            scale =
              v.centerScale -
              (v.centerScale - v.adjacentScale) * absOff;
          } else if (absOff <= 2) {
            scale =
              v.adjacentScale -
              (v.adjacentScale - v.otherScale) * (absOff - 1);
          } else {
            scale = v.otherScale;
          }
          // Apply hover-active state to centered card (|slotOff| < 0.5).
          const titleRow = c.el.firstElementChild as HTMLElement | null;
          if (titleRow) {
            const isActive = absOff < 0.5;
            titleRow.style.transform = isActive ? "translateY(-8px)" : "";
            titleRow.style.backgroundColor = isActive
              ? "rgba(31,43,57,0.03)"
              : "";
            titleRow.style.paddingLeft = isActive ? "8px" : "";
            titleRow.style.paddingRight = isActive ? "8px" : "";
          }
          gsap.set(c.el, { y: y - c.curCy, scale });
        }
        return;
      }

      const sw = setWidthRef.current;
      if (sw <= 0) return;
      strip.scrollLeft = wrap(pos.current, sw);
    };

    gsap.ticker.add(onTick);

    return () => {
      ro.disconnect();
      gsap.ticker.remove(onTick);
      window.removeEventListener("wheel", handleWheel);
      strip.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("click", onDocClick);
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
          <div className="flex shrink-0 items-center" style={{ gap: config.gap }}>
            {projects.map((project) => (
              <ProjectCard key={`dup-${project.id}`} project={project} />
            ))}
          </div>
        </section>
      </div>

      {selectedProject && (
        <ProjectDetailPanel project={selectedProject} visible={panelVisible} onClose={closePanel} />
      )}
    </>
  );
}
