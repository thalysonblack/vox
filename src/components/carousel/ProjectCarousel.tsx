"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  /** Fired once the strip has laid out with Sanity data present. */
  onCarouselReady?: () => void;
  /** When false, cards render hidden so the intro can stagger them in. */
  introDone?: boolean;
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
  onCarouselReady,
  introDone = true,
}: ProjectCarouselProps) {
  const router = useRouter();

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
  const selectedProjectIdRef = useRef<string | null>(null);
  selectedProjectIdRef.current = selectedProject?.id ?? null;

  // --- Animation state ---
  const isAnimatingRef = useRef(false);
  const isPhysicsPausedRef = useRef(false);
  const animTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const modeRef = useRef<"horizontal" | "vertical">("horizontal");
  const cleanupRef = useRef<((targetScrollLeft?: number) => void) | null>(null);
  const nonCanonicalElsRef = useRef<HTMLElement[]>([]);
  const wheelAccumRef = useRef(0);
  const vStateRef = useRef<VerticalState | null>(null);
  const isMobileRef = useRef(false);

  // -----------------------------------------------------------------------
  // Signal carousel ready (one frame after strip mounts with projects)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!onCarouselReady) return;
    if (projects.length === 0) return;
    const strip = stripRef.current;
    if (!strip) return;
    // One frame for layout, then signal ready.
    const id = requestAnimationFrame(() => onCarouselReady());
    return () => cancelAnimationFrame(id);
  }, [onCarouselReady, projects.length]);

  // -----------------------------------------------------------------------
  // Open detail panel
  // -----------------------------------------------------------------------

  // Animate pos so the given project's card lands at the vertical center.
  // Used by both click-to-navigate and scroll-past-end to next project.
  const centerProjectInCarousel = useCallback((projectId: string) => {
    if (modeRef.current !== "vertical") return;
    const v = vStateRef.current;
    if (!v) return;
    const tapped = v.cards.find((c) => c.el.dataset.projectId === projectId);
    if (!tapped) return;

    // Kill any running tween + momentum, then align target/current so the
    // smoothLag of the tick has nothing left to chase (prevents a 1-frame jerk).
    gsap.killTweensOf(posRef.current);
    impulseRef.current = 0;
    posRef.current.target = posRef.current.current;

    const n = v.cards.length;
    const currentSlots = posRef.current.current / v.stepY;
    let currentSlotOff = tapped.baseOffset + currentSlots;
    currentSlotOff = ((currentSlotOff % n) + n) % n;
    if (currentSlotOff >= n / 2) currentSlotOff -= n;
    const targetScroll = posRef.current.current - currentSlotOff * v.stepY;

    // Already at center → no animation needed.
    if (Math.abs(currentSlotOff) < 0.01) return;

    // Use a proxy object so gsap owns a single interpolated value that we
    // mirror onto both pos.target and pos.current in onUpdate. Eliminates
    // any desync between the two fields during the tween.
    isPhysicsPausedRef.current = true;
    const proxy = { v: posRef.current.current };
    // Long + smooth: feels like a gradual scroll rather than a snap jump.
    // sine.inOut has a gentle start and end — closest to a natural scroll
    // momentum curve. Duration is long enough to perceive the motion.
    gsap.to(proxy, {
      v: targetScroll,
      duration: 0.65,
      ease: "sine.inOut",
      onUpdate: () => {
        posRef.current.current = proxy.v;
        posRef.current.target = proxy.v;
      },
      onComplete: () => {
        isPhysicsPausedRef.current = false;
      },
    });
  }, []);

  // Tiny in-memory cache of already-fetched full projects. Prevents re-fetch
  // on scroll-past-end auto-navigation and makes transitions feel instant.
  const projectCacheRef = useRef<Map<string, Project>>(new Map());

  const prefetchProjectById = useCallback((id: string) => {
    if (!id || projectCacheRef.current.has(id)) return;
    fetch(`/api/project/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((full: Project | null) => {
        if (full) projectCacheRef.current.set(id, full);
      })
      .catch(() => {});
  }, []);

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

      // Use cached full data if already prefetched.
      const cached = projectCacheRef.current.get(listItem.id);
      setSelectedProject(cached ?? skeleton);
      requestAnimationFrame(() => setPanelVisible(true));
      onDetailOpen?.();
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", `/project/${listItem.id}`);
      }

      if (!cached) {
        fetch(`/api/project/${listItem.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((full: Project | null) => {
            if (full) {
              projectCacheRef.current.set(listItem.id, full);
              setSelectedProject(full);
            }
          })
          .catch(() => {});
      }

      // Pre-warm the next project so scroll-past-end feels instant:
      //  - data via API (in-memory cache)
      //  - route via router.prefetch (Next.js page cache, survives hard reload)
      const list = projectsRef.current;
      const idx = list.findIndex((p) => p.id === listItem.id);
      if (idx !== -1) {
        const nextId = list[(idx + 1) % list.length]?.id;
        if (nextId) {
          prefetchProjectById(nextId);
          router.prefetch(`/project/${nextId}`);
        }
      }
    },
    [onDetailOpen, prefetchProjectById, router],
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

      // Fire onDetailOpen at the START of the choreography so the nav
      // lift (driven by HomeLayout's detailOpen → compact prop) kicks off
      // in the same frame as the card transformation — not at 85% of the
      // timeline when openDetailForProject runs.
      onDetailOpen?.();

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
    [openDetailForProject, onDetailOpen],
  );

  // -----------------------------------------------------------------------
  // Handle tap (horizontal → choreography, vertical → scroll to card)
  // -----------------------------------------------------------------------

  const handleTapRef = useRef<(project: ProjectListItem, el: HTMLElement) => void>(() => {});
  handleTapRef.current = (project: ProjectListItem, el: HTMLElement) => {
    // Hard guard: ignore ALL taps while a timeline is running. Prevents
    // forward/reverse race conditions — without this, a fast double-tap
    // or a tap during the horizontal→vertical transform lets two
    // animations fight over the same card state refs, leaving the
    // carousel in a wedged half-transformed state.
    if (isAnimatingRef.current) return;
    if (modeRef.current === "vertical") {
      centerProjectInCarousel(project.id);
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

    // Fire onDetailClose at the START of the close sequence (not on
    // timeline completion) so the nav lift kicks off in the same frame
    // as the click — mirrors how onDetailOpen fires at the start of
    // runChoreography.
    onDetailClose?.();

    // If the forward choreography is still running (user clicked a card
    // then immediately closed before the horizontal→vertical transform
    // finished), fast-forward it to completion so its onComplete
    // side-effect fires and registers cleanupRef. Without this, the
    // reverse runs with cleanupRef still null, the DOM/scroll is left
    // half-transformed, and the next click sees modeRef stuck at
    // "vertical" — requiring a second click to unstick the state.
    if (isAnimatingRef.current && animTimelineRef.current) {
      animTimelineRef.current.progress(1);
    }

    // Mobile: stay in vertical mode, don't reverse to horizontal.
    if (isMobileRef.current) {
      setTimeout(() => setSelectedProject(null), 950);
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
        },
      });
    } else {
      setTimeout(() => setSelectedProject(null), 500);
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
      // Measure the exact distance between the FIRST CARD of set1 and the
      // FIRST CARD of set2 — this is the true wrap distance that guarantees
      // a seamless loop regardless of padding, box-sizing, or subpixel math.
      const set2 = set1.nextElementSibling as HTMLElement | null;
      const card1 = set1.querySelector<HTMLElement>("[data-project-id]");
      const card2 = set2?.querySelector<HTMLElement>("[data-project-id]") ?? null;
      if (card1 && card2) {
        const r1 = card1.getBoundingClientRect();
        const r2 = card2.getBoundingClientRect();
        setWidthRef.current = r2.left - r1.left;
      } else if (set2) {
        setWidthRef.current = set1.offsetWidth + config.gap;
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

    // Initial peek offset — shift the horizontal strip right by ~35% of a
    // card so the leftmost visible card is cropped, signaling "there's more
    // content off to the left" (and mirrored on the right by the overflow).
    // Only applies if we're in horizontal mode (desktop) on mount.
    if (!isMobile) {
      const firstCard = set1.querySelector<HTMLElement>("[data-project-id]");
      if (firstCard) {
        const cardW = firstCard.getBoundingClientRect().width;
        if (cardW > 0) {
          const peek = cardW * 0.35;
          posRef.current.target = peek;
          posRef.current.current = peek;
        }
      }
    }

    // Responsive: on viewport resize, rebuild vertical state (if in vertical mode)
    // so the column X + card scales adapt to the new viewport without a page reload.
    // Also handles mobile ↔ desktop breakpoint crossings.
    let resizeRebuildRaf = 0;
    const handleResizeRebuild = () => {
      if (resizeRebuildRaf) return;
      resizeRebuildRaf = requestAnimationFrame(() => {
        resizeRebuildRaf = 0;
        const nowMobile = window.innerWidth < 768;
        const wasMobile = isMobileRef.current;
        isMobileRef.current = nowMobile;

        // Crossing the breakpoint: mobile → desktop (close any open mobile vertical).
        if (wasMobile && !nowMobile && modeRef.current === "vertical") {
          // Reset to horizontal: clear transforms on all cards, reset strip overflow.
          const allCards = Array.from(
            strip.querySelectorAll<HTMLElement>("[data-project-id]"),
          );
          gsap.set(allCards, { clearProps: "transform,opacity,zIndex" });
          const innerDivs = Array.from(strip.children) as HTMLElement[];
          gsap.set(innerDivs, { clearProps: "transform" });
          strip.style.overflow = "";
          vStateRef.current = null;
          modeRef.current = "horizontal";
          posRef.current.target = 0;
          posRef.current.current = 0;
          impulseRef.current = 0;
          return;
        }

        // Crossing the breakpoint: desktop → mobile (auto-enter vertical).
        if (!wasMobile && nowMobile && modeRef.current === "horizontal") {
          const { visible, nonCanonicalEls } = resolveCanonicalCards(
            strip,
            projectsRef.current,
          );
          if (visible.length === 0) return;
          const cardW = visible[0].r.width;
          const cardH = visible[0].r.height;
          if (!cardW || !cardH) return;
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
          enterVerticalDirectly({ strip, visible, nonCanonicalEls, vState, cardW, cardH });
          posRef.current.target = 0;
          posRef.current.current = 0;
          impulseRef.current = 0;
          return;
        }

        // Already in vertical mode and no breakpoint cross → rebuild for new viewport size.
        if (modeRef.current === "vertical" && vStateRef.current) {
          const { visible, nonCanonicalEls } = resolveCanonicalCards(
            strip,
            projectsRef.current,
          );
          if (visible.length === 0) return;
          const cardW = visible[0].r.width;
          const cardH = visible[0].r.height;
          if (!cardW || !cardH) return;
          const vpRect = strip.getBoundingClientRect();
          const vState = buildVerticalState({
            strip,
            visible,
            vpRect,
            safeClickedIdx: vStateRef.current.safeClickedIdx,
            cardW,
            cardH,
          });
          vStateRef.current = vState;
          nonCanonicalElsRef.current = nonCanonicalEls;
          enterVerticalDirectly({ strip, visible, nonCanonicalEls, vState, cardW, cardH });
          posRef.current.target = 0;
          posRef.current.current = 0;
          impulseRef.current = 0;
        }
      });
    };
    window.addEventListener("resize", handleResizeRebuild);


    // Physics tick.
    const onTick = createTickHandler({
      getPos: () => posRef.current,
      getImpulse: () => impulseRef.current,
      setImpulse: (v) => { impulseRef.current = v; },
      getIsAnimating: () => isAnimatingRef.current,
      getIsPhysicsPaused: () => isPhysicsPausedRef.current,
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
      onCenterChange: (projectId: string) => {
        // After a wheel/drag snap, if the new center card is a different
        // project than the one currently open, update the detail panel.
        // Only runs if a project is already open (doesn't auto-open).
        const currentId = selectedProjectIdRef.current;
        if (!currentId) return;
        if (currentId === projectId) return;
        const project = projectsRef.current.find((p) => p.id === projectId);
        if (project) openDetailForProject(project);
      },
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
      if (resizeRebuildRaf) cancelAnimationFrame(resizeRebuildRaf);
      window.removeEventListener("resize", handleResizeRebuild);
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
  // Intro curtain hand-off: stagger cards in when introDone flips true
  // -----------------------------------------------------------------------

  const didStaggerInRef = useRef(false);
  useEffect(() => {
    if (!introDone) return;
    if (didStaggerInRef.current) return;
    const strip = stripRef.current;
    if (!strip) return;

    // Mobile: cards are already in vertical mode; skip the stagger
    // because it would clobber their positions. Still mark as done
    // so a subsequent introDone re-flip doesn't retry.
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      didStaggerInRef.current = true;
      return;
    }

    const set1 = set1Ref.current;
    if (!set1) return;
    didStaggerInRef.current = true;

    // Cards all have data-project-id on their root div.
    // Query from set1 to avoid animating the duplicate set2 used for infinite scroll.
    const cards = Array.from(
      set1.querySelectorAll<HTMLElement>("[data-project-id]"),
    );
    if (cards.length === 0) return;

    const isVertical = modeRef.current === "vertical";
    let ordered: HTMLElement[];
    if (isVertical) {
      // Center-out: middle card first, then zip outward alternating sides.
      const mid = Math.floor(cards.length / 2);
      ordered = [cards[mid]];
      for (let d = 1; d <= Math.max(mid, cards.length - 1 - mid); d++) {
        if (mid - d >= 0) ordered.push(cards[mid - d]);
        if (mid + d < cards.length) ordered.push(cards[mid + d]);
      }
    } else {
      // Horizontal: left-to-right (DOM order).
      ordered = cards;
    }

    // Clear the strip's opacity/transform but KEEP pointer-events: none
    // until the stagger finishes — prevents clicks landing on cards
    // that haven't fully formed yet.
    gsap.set(strip, { clearProps: "opacity,transform" });
    strip.style.pointerEvents = "none";
    const staggerTotalSec =
      0.7 + Math.max(0, ordered.length - 1) * 0.04;
    gsap.fromTo(
      ordered,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.04,
        clearProps: "opacity,transform",
        onComplete: () => {
          strip.style.pointerEvents = "";
        },
      },
    );
    // Safety net: if the tween's onComplete somehow doesn't fire (kill,
    // unmount), still release pointer-events via a timer.
    const releaseTimer = window.setTimeout(
      () => {
        strip.style.pointerEvents = "";
      },
      Math.ceil(staggerTotalSec * 1000) + 100,
    );
    return () => window.clearTimeout(releaseTimer);
  }, [introDone]);

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
            ...(introDone
              ? null
              : {
                  opacity: 0,
                  transform: "translateY(40px)",
                  pointerEvents: "none" as const,
                }),
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
          onScrollPastEnd={() => {
            const list = projectsRef.current;
            const idx = list.findIndex((p) => p.id === selectedProject.id);
            if (idx === -1) return;
            const next = list[(idx + 1) % list.length];
            if (!next) return;
            centerProjectInCarousel(next.id);
            openDetailForProject(next);
          }}
        />
      )}
    </>
  );
}
