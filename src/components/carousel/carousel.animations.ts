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

    // curCx is computed from r.left (captured post-scroll, in viewport
    // coords). The innerDivs shift above just preserves the card's visual
    // position while moving from native scroll to gsap transform — so the
    // card's VISUAL position is unchanged. X transform = p4X - curCx
    // positions the visual center at p4X exactly (no savedScrollLeft term).
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

  // --- Compute dynamic columnX: the vertical carousel lives between the
  //     Good Taste logo (left) and the close button (right), centered in that
  //     whitespace on ANY device.
  // Logo goes compact (scale 0.72) when the panel opens, so its right
  // edge is at 12 + 105*0.72 ≈ 88. Add a tiny gap.
  const logoRight = 12 + 105 * 0.72 + 4; // ≈ 92
  const rawPanelLeft =
    fullWinW >= 1280 ? Math.min(fullWinW * 0.22, 440) : fullWinW * 0.22;
  const panelLeft = fullWinW >= 768 ? rawPanelLeft : fullWinW;
  const closeBtnLeft = panelLeft - 30;

  // Cards fill ~95% of the whitespace — tight, leaving just a thin
  // visual margin on both sides.
  if (!isSmall) {
    const availWidth = Math.max(0, closeBtnLeft - logoRight);
    const targetVisibleCenterW = availWidth * 0.95;
    const naturalCenterW = cardW * centerScale;
    if (naturalCenterW > targetVisibleCenterW && naturalCenterW > 0) {
      const shrink = targetVisibleCenterW / naturalCenterW;
      centerScale *= shrink;
      adjacentScale *= shrink;
      otherScale *= shrink;
    }
  }

  const pBCenterCw = cardW * centerScale;
  const isMobile = isSmall;
  let dynamicColumnX: number;
  if (isMobile) {
    // Mobile: center card horizontally (full-screen, no panel).
    dynamicColumnX = (fullWinW - pBCenterCw) / 2;
  } else {
    // Desktop: card center lives at the midpoint between the logo and
    // the close button — the true center of the visible whitespace.
    const availMid = (logoRight + closeBtnLeft) / 2;
    dynamicColumnX = availMid - pBCenterCw / 2;
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
      // The `targetScrollLeft` argument from reverse is ignored — we
      // ALWAYS restore to the exact savedScrollLeft captured at forward
      // start. This fixes two visible bugs:
      //   1. "Doesn't return to where it came from" — reverse used to
      //      pass rawNewScrollLeft (card-centered) which shifted the
      //      strip to a different position than pre-open.
      //   2. "Flickers to readjust" — the mismatch between the visual
      //      end-state of the reverse tween and the cleanup scroll
      //      position caused a one-frame jump.
      const cleanup = (_targetScrollLeft?: number) => {
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
          gsap.set(c.el, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            zIndex: "",
          });
        });
        // Non-canonicals (duplicate card instances from the infinite
        // scroll setup) MUST be fully opaque and pointer-interactive
        // before we set scrollLeft — otherwise cards can appear missing
        // or cause blank spaces right after the reverse lands.
        gsap.set(nonCanonicalEls, { opacity: 1, pointerEvents: "auto" });
        strip.style.overflow = prevOverflow;

        // Order matters: set scrollLeft FIRST so the strip is at the
        // target position, then clear innerDivs (which removes the
        // visual compensation offset). Doing them in the other order
        // causes a one-frame flash where cards are visually off from
        // where they should be.
        const sw = (cardW + config.gap) * n;
        strip.scrollLeft = ((savedScrollLeft % sw) + sw) % sw;
        gsap.set(innerDivs, { x: 0 });
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
    // Pass vState's (possibly shrunk) scales so the choreography ends at
    // EXACTLY the same sizes the physics tick will use afterwards — no jump.
    const pBScaleI = computeSlotScale(
      absSlot,
      vState.centerScale,
      vState.adjacentScale,
      vState.otherScale,
    );

    // Y + scale
    tl.to(el, { y: pBCy - curCy, scale: pBScaleI, rotation: 0, duration: TIMING.verticalDur }, 0);
    // X slides left. The innerDivs shift above preserved the card's visual
    // position, so X = p4X - curCx positions the visual center at p4X.
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
    defaults: { ease: "expo.out" },
    // The cleanup closure (stored on cleanupRef) ignores the
    // targetScrollLeft argument and always restores savedScrollLeft,
    // so we pass 0 here. Keeping the parameter for API compatibility.
    onComplete: () => ctx.onComplete(0),
  });

  // Mirror the forward choreography but with the axes in reverse order:
  // forward runs Y+scale first (at 0) and then X (at horizontalStart),
  // so the reverse runs X first (at 0) and Y+scale second (at
  // horizontalStart) — cards slide horizontally back into their row
  // positions first, then expand/rotate back to their resting size.
  v.cards.forEach((c) => {
    // Horizontal slide back to the row position — target x: 0 so the
    // card ends at its natural layout position. Combined with cleanup
    // restoring savedScrollLeft, the visual during and after the
    // tween matches the pre-open state.
    tl.to(
      c.el,
      {
        x: 0,
        duration: TIMING.horizontalDur,
      },
      0,
    );
    // Y + scale + rotation back to resting; slightly offset so both
    // axes overlap the way they do in the forward choreography.
    tl.to(
      c.el,
      {
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: TIMING.verticalDur,
      },
      TIMING.horizontalStart,
    );
  });

  return tl;
}
