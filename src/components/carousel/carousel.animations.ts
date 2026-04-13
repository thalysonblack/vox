/**
 * Carousel animation logic — choreography (horizontal→vertical) and reverse.
 * Decoupled from the React component. Pure GSAP timeline factories.
 */
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import {
  MOBILE_PHYSICS,
  PHASE_B,
  TIMING,
  VERTICAL_TITLE,
} from "./carousel.constants";
import type { CardState, VerticalState, ScrollPosition } from "./carousel.types";
import type { ProjectListItem } from "@/types/project";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick one canonical DOM element per project (closest to viewport center). */
export function resolveCanonicalCards(
  strip: HTMLElement,
  projects: ProjectListItem[],
) {
  const vpRect = strip.getBoundingClientRect();
  const vpCenterX = vpRect.left + vpRect.width / 2;
  const allCards = Array.from(
    strip.querySelectorAll<HTMLElement>("[data-project-id]"),
  );

  const instances = new Map<string, HTMLElement[]>();
  for (const el of allCards) {
    const pid = el.dataset.projectId;
    if (!pid) continue;
    if (!instances.has(pid)) instances.set(pid, []);
    instances.get(pid)!.push(el);
  }

  const visible: { el: HTMLElement; r: DOMRect }[] = [];
  const nonCanonicalEls: HTMLElement[] = [];

  for (const project of projects) {
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

  return { visible, nonCanonicalEls, vpRect };
}

/** Compute the 3-tier Y offset for a given slot distance from center. */
export function computeSlotY(
  absSlot: number,
  slotSign: number,
  step01: number,
  step12: number,
  stepOther: number,
): number {
  if (absSlot <= 1) return slotSign * absSlot * step01;
  if (absSlot <= 2) return slotSign * (step01 + (absSlot - 1) * step12);
  return slotSign * (step01 + step12 + (absSlot - 2) * stepOther);
}

/** Compute the 3-tier progressive scale for a given slot distance. */
export function computeSlotScale(
  absSlot: number,
  centerScale: number = PHASE_B.centerScale,
  adjacentScale: number = PHASE_B.adjacentScale,
  otherScale: number = PHASE_B.otherScale,
): number {
  if (absSlot <= 1) {
    return centerScale - (centerScale - adjacentScale) * absSlot;
  }
  if (absSlot <= 2) {
    return adjacentScale - (adjacentScale - otherScale) * (absSlot - 1);
  }
  return otherScale;
}

// ---------------------------------------------------------------------------
// Mobile: enter vertical mode directly (no horizontal → vertical transition)
// ---------------------------------------------------------------------------

export interface EnterVerticalDirectlyArgs {
  strip: HTMLElement;
  visible: { el: HTMLElement; r: DOMRect }[];
  nonCanonicalEls: HTMLElement[];
  vState: VerticalState;
  cardW: number;
  cardH: number;
}

export function enterVerticalDirectly(args: EnterVerticalDirectlyArgs) {
  const { strip, visible, nonCanonicalEls, vState, cardW, cardH } = args;
  const n = visible.length;

  // Prepare strip — free card movement.
  const savedScrollLeft = strip.scrollLeft;
  const innerDivs = Array.from(strip.children) as HTMLElement[];
  gsap.set(innerDivs, { x: -savedScrollLeft });
  strip.scrollLeft = 0;
  strip.style.overflow = "visible";

  // Non-canonicals: hide.
  gsap.set(nonCanonicalEls, { opacity: 0, pointerEvents: "none" });

  // Apply vertical title font.
  visible.forEach(({ el }) => {
    const titleSpan = el.querySelector<HTMLElement>("div > span:first-child");
    if (titleSpan) {
      titleSpan.style.fontSize = VERTICAL_TITLE.fontSize;
      titleSpan.style.letterSpacing = VERTICAL_TITLE.letterSpacing;
    }
  });

  // Make cards clickable.
  vState.cards.forEach((c) => {
    c.el.style.cursor = "pointer";
    c.el.style.pointerEvents = "auto";
  });

  // Position every canonical card at its vertical slot (no animation).
  const p4X = vState.columnX + (cardW * vState.centerScale) / 2;
  visible.forEach(({ el, r }, i) => {
    const curCx = r.left - strip.getBoundingClientRect().left + cardW / 2;
    const curCy = r.top - strip.getBoundingClientRect().top + cardH / 2;

    const halfN = n / 2;
    let slotOffset = i - vState.safeClickedIdx;
    slotOffset = ((slotOffset % n) + n) % n;
    if (slotOffset >= halfN) slotOffset -= n;

    const absSlot = Math.abs(slotOffset);
    const slotSign = Math.sign(slotOffset);
    const yOffset = computeSlotY(
      absSlot,
      slotSign,
      vState.step01,
      vState.step12,
      vState.stepOther,
    );
    const scale = computeSlotScale(
      absSlot,
      vState.centerScale,
      vState.adjacentScale,
      vState.otherScale,
    );
    const targetY = vState.clickedCy + yOffset;

    gsap.set(el, {
      x: p4X - curCx,
      y: targetY - curCy,
      scale,
      zIndex: i === vState.safeClickedIdx ? 100 : 80 - absSlot,
      transformOrigin: "50% 50%",
    });
  });
}

// ---------------------------------------------------------------------------
// Build vertical state
// ---------------------------------------------------------------------------

export interface ChoreographyContext {
  strip: HTMLElement;
  visible: { el: HTMLElement; r: DOMRect }[];
  vpRect: DOMRect;
  safeClickedIdx: number;
  cardW: number;
  cardH: number;
}

export function buildVerticalState(ctx: ChoreographyContext): VerticalState {
  const { visible, vpRect, safeClickedIdx, cardW, cardH } = ctx;
  const n = visible.length;
  const vpH = vpRect.height;
  const fullWinH = window.innerHeight;
  const fullWinW = window.innerWidth;
  const effectiveVpH = Math.max(vpH, fullWinH - vpRect.top - 24);

  // Mobile gets its own tuned scales — smaller than desktop×1.3 so 6-7
  // slots can fit with the outermost pair slightly cropped at viewport edges.
  const isSmall = fullWinW < 768;
  let centerScale: number;
  let adjacentScale: number;
  let otherScale: number;
  let gap: number;
  if (isSmall) {
    // +10% again — 5 slots fully visible, ±3 barely peek at edges.
    centerScale = 0.545;
    adjacentScale = 0.387;
    otherScale = 0.242;
    gap = 28;
  } else {
    centerScale = PHASE_B.centerScale;
    adjacentScale = PHASE_B.adjacentScale;
    otherScale = PHASE_B.otherScale;
    gap = PHASE_B.gap;
  }

  // --- Compute dynamic columnX: center card between VOX logo and close button ---
  const PADDING = 24;
  const logoEl = document.querySelector<HTMLElement>("[data-vox-logo]");
  const logoRight = logoEl
    ? logoEl.getBoundingClientRect().right - vpRect.left
    : 80;
  // Close button sits just outside the detail panel's left edge; panel is at 22vw on md+.
  const panelLeft = fullWinW >= 768 ? fullWinW * 0.22 : fullWinW;
  const closeButtonWidth = 22 + 8; // button + offset
  const rightBoundary = panelLeft - closeButtonWidth - vpRect.left;

  const pBCenterCw = cardW * centerScale;
  const isMobile = isSmall;
  let dynamicColumnX: number;
  if (isMobile) {
    // Mobile: center card horizontally (full-screen, no panel).
    dynamicColumnX = (fullWinW - pBCenterCw) / 2;
  } else {
    const safeLeft = logoRight + PADDING;
    const safeRight = rightBoundary - PADDING;
    const maxColumnX = Math.max(PADDING, safeRight - pBCenterCw);
    dynamicColumnX = Math.max(PADDING, Math.min(safeLeft, maxColumnX));
  }

  const pBCenterCh = cardH * centerScale;
  const pBAdjCh = cardH * adjacentScale;
  const pBOtherCh = cardH * otherScale;

  // Card-size-based spacing guarantees a `gap` between every slot — no
  // overlaps. Scales (see PHASE_B) are tuned so 5 cards still fit in the
  // viewport with slot ±2 slightly cropped at the edges.
  const step01 = pBCenterCh / 2 + gap + pBAdjCh / 2;
  const step12 = pBAdjCh / 2 + gap + pBOtherCh / 2;
  const stepOther = pBOtherCh + gap;
  const minStepY = step01;
  const bufferY = pBCenterCh;
  const stepY = Math.max(minStepY, (effectiveVpH + 2 * bufferY) / n);
  const clickedCy = fullWinH / 2 - vpRect.top;

  const cards: CardState[] = visible.map(({ el, r }, i) => ({
    el,
    curCy: r.top - vpRect.top + cardH / 2,
    baseOffset: i - safeClickedIdx,
    setY: gsap.quickSetter(el, "y", "px") as (n: number) => void,
    setScale: gsap.quickSetter(el, "scale") as (n: number) => void,
  }));

  return {
    cards,
    stepY,
    step01,
    step12,
    stepOther,
    clickedCy,
    centerScale,
    adjacentScale,
    otherScale,
    savedScrollLeft: ctx.strip.scrollLeft,
    safeClickedIdx,
    horizontalStride: cardW + config.gap,
    columnX: dynamicColumnX,
  };
}

// ---------------------------------------------------------------------------
// Forward choreography timeline
// ---------------------------------------------------------------------------

export interface ChoreographyCallbacks {
  onOpenDetail: (projectId: string) => void;
  onComplete: (cleanup: (targetScrollLeft?: number) => void) => void;
}

export function createChoreographyTimeline(
  ctx: ChoreographyContext,
  vState: VerticalState,
  nonCanonicalEls: HTMLElement[],
  pos: ScrollPosition,
  callbacks: ChoreographyCallbacks,
): gsap.core.Timeline {
  const { strip, visible, vpRect, safeClickedIdx, cardW, cardH } = ctx;
  const n = visible.length;

  // Prepare strip for free card movement.
  const prevOverflow = strip.style.overflow;
  const savedScrollLeft = strip.scrollLeft;
  const innerDivs = Array.from(strip.children) as HTMLElement[];
  gsap.set(innerDivs, { x: -savedScrollLeft });
  strip.scrollLeft = 0;
  strip.style.overflow = "visible";

  // Fade out duplicate cards.
  gsap.set(nonCanonicalEls, { pointerEvents: "none" });
  gsap.to(nonCanonicalEls, {
    opacity: 0,
    duration: TIMING.dupFadeOutDur,
    delay: TIMING.dupFadeOutDelay,
    ease: "power2.out",
  });

  // Apply vertical title font-size immediately.
  visible.forEach(({ el }) => {
    const titleSpan = el.querySelector<HTMLElement>("div > span:first-child");
    if (titleSpan) {
      titleSpan.style.fontSize = VERTICAL_TITLE.fontSize;
      titleSpan.style.letterSpacing = VERTICAL_TITLE.letterSpacing;
    }
  });

  // Make cards clickable.
  vState.cards.forEach((c) => {
    c.el.style.cursor = "pointer";
    c.el.style.pointerEvents = "auto";
  });

  // Compute column X position.
  const pBCenterCw = cardW * vState.centerScale;
  const p4X = vState.columnX + pBCenterCw / 2;
  const pBClickedCy = vState.clickedCy;

  const tl = gsap.timeline({
    defaults: { ease: "expo.out" },
    onComplete: () => {
      // Reset scroll physics.
      pos.target = 0;
      pos.current = 0;

      // Build cleanup closure for reverse.
      const cleanup = (targetScrollLeft?: number) => {
        vState.cards.forEach((c) => {
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
          gsap.set(c.el, { x: 0, y: 0, scale: 1, rotation: 0 });
        });
        gsap.set(nonCanonicalEls, { opacity: 1, pointerEvents: "auto" });
        strip.style.overflow = prevOverflow;
        gsap.set(innerDivs, { x: 0 });

        const sw = (cardW + config.gap) * n;
        const scrollValue =
          targetScrollLeft !== undefined ? targetScrollLeft : savedScrollLeft;
        strip.scrollLeft = ((scrollValue % sw) + sw) % sw;
      };
      callbacks.onComplete(cleanup);
    },
  });

  // Open detail panel partway through.
  const clickedPid = visible[safeClickedIdx]?.el.dataset.projectId;
  if (clickedPid) {
    tl.call(() => callbacks.onOpenDetail(clickedPid), [], TIMING.detailOpenAt);
  }

  // Animate each card to its vertical slot.
  visible.forEach(({ el, r }, i) => {
    const curCx = r.left - vpRect.left + cardW / 2;
    const curCy = r.top - vpRect.top + cardH / 2;

    gsap.set(el, {
      zIndex: i === safeClickedIdx ? 100 : 80 - Math.abs(i - safeClickedIdx),
      transformOrigin: "50% 50%",
    });

    // Compute vertical slot position.
    const halfN = n / 2;
    let slotOffset = i - safeClickedIdx;
    slotOffset = ((slotOffset % n) + n) % n;
    if (slotOffset >= halfN) slotOffset -= n;

    const absSlot = Math.abs(slotOffset);
    const slotSign = Math.sign(slotOffset);
    const pBYOffset = computeSlotY(
      absSlot,
      slotSign,
      vState.step01,
      vState.step12,
      vState.stepOther,
    );
    const pBCy = pBClickedCy + pBYOffset;
    const pBScaleI = computeSlotScale(Math.abs(slotOffset));

    // Y + scale
    tl.to(el, { y: pBCy - curCy, scale: pBScaleI, rotation: 0, duration: TIMING.verticalDur }, 0);
    // X slides left
    tl.to(el, { x: p4X - curCx, duration: TIMING.horizontalDur }, TIMING.horizontalStart);
  });

  return tl;
}

// ---------------------------------------------------------------------------
// Reverse animation (vertical → horizontal)
// ---------------------------------------------------------------------------

export interface ReverseContext {
  vState: VerticalState;
  pos: ScrollPosition;
  strip: HTMLElement;
  nonCanonicalEls: HTMLElement[];
  onComplete: (rawNewScrollLeft: number) => void;
}

export function createReverseTimeline(ctx: ReverseContext): gsap.core.Timeline {
  const { vState: v, pos, strip, nonCanonicalEls } = ctx;

  // Reset title styles immediately.
  v.cards.forEach((c) => {
    const titleSpan = c.el.querySelector<HTMLElement>("div > span:first-child");
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

  // Compute target scroll that centers the active card.
  const n = v.cards.length;
  const curScrollSlots = pos.current / v.stepY;
  const activeIdx =
    (v.safeClickedIdx - Math.round(curScrollSlots) + n * 1000) % n;
  const stripW = strip.getBoundingClientRect().width;
  const cardCenterX =
    12 + activeIdx * v.horizontalStride + (v.horizontalStride - config.gap) / 2;
  const rawNewScrollLeft = cardCenterX - stripW / 2;
  const targetXDelta = v.savedScrollLeft - rawNewScrollLeft;

  // Fade duplicates back in.
  if (nonCanonicalEls.length > 0) {
    gsap.killTweensOf(nonCanonicalEls);
    gsap.to(nonCanonicalEls, {
      opacity: 1,
      duration: TIMING.dupFadeInDur,
      delay: TIMING.dupFadeInDelay,
      ease: "power2.out",
    });
  }

  gsap.killTweensOf(pos);

  const tl = gsap.timeline({
    onComplete: () => ctx.onComplete(rawNewScrollLeft),
  });

  v.cards.forEach((c) => {
    tl.to(
      c.el,
      {
        x: targetXDelta,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: TIMING.reverseDur,
        ease: "expo.out",
      },
      0,
    );
  });

  return tl;
}
