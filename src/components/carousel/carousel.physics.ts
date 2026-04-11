/**
 * Carousel tick loop — impulse physics, friction, smooth easing.
 * Handles both horizontal (infinite scroll) and vertical (snap) modes.
 */
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import { ACTIVE_CARD_STYLE, INTERACTION } from "./carousel.constants";
import { computeSlotY, computeSlotScale } from "./carousel.animations";
import type { ScrollPosition, VerticalState } from "./carousel.types";

const wrap = (v: number, sw: number) => ((v % sw) + sw) % sw;

export interface TickContext {
  getPos: () => ScrollPosition;
  getImpulse: () => number;
  setImpulse: (v: number) => void;
  getIsAnimating: () => boolean;
  getMode: () => "horizontal" | "vertical";
  getVState: () => VerticalState | null;
  getSetWidth: () => number;
  strip: HTMLElement;
}

/**
 * Creates the GSAP ticker callback. Returns the function reference
 * so the caller can remove it on cleanup.
 */
export function createTickHandler(ctx: TickContext): () => void {
  return () => {
    if (ctx.getIsAnimating()) return;

    const pos = ctx.getPos();
    const dt = gsap.ticker.deltaRatio(60);

    // Apply friction to impulse.
    const friction = Math.pow(0.98, dt);
    let impulse = ctx.getImpulse() * friction;
    if (Math.abs(impulse) < 0.01) impulse = 0;
    ctx.setImpulse(impulse);

    // Advance target and ease current toward it.
    pos.target += impulse * dt;
    const ease = 1 - Math.pow(config.smooth, dt);
    const diff = pos.target - pos.current;
    if (Math.abs(diff) < 0.3) {
      pos.current = pos.target;
    } else {
      pos.current += diff * ease;
    }

    // --- Vertical mode: position cards in column ---
    if (ctx.getMode() === "vertical") {
      const v = ctx.getVState();
      if (!v) return;
      const scrollSlots = pos.current / v.stepY;
      const n = v.cards.length;
      const halfN = n / 2;

      for (const c of v.cards) {
        let slotOff = c.baseOffset + scrollSlots;
        slotOff = ((slotOff % n) + n) % n;
        if (slotOff >= halfN) slotOff -= n;

        const absOff = Math.abs(slotOff);
        const sign = Math.sign(slotOff);
        const yOffset = computeSlotY(absOff, sign, v.step01, v.step12, v.stepOther);
        const y = v.clickedCy + yOffset;
        const scale = computeSlotScale(absOff);

        // Active card visual state.
        const titleRow = c.el.firstElementChild as HTMLElement | null;
        if (titleRow) {
          const isActive = absOff < INTERACTION.activeSlotThreshold;
          titleRow.style.transform = isActive ? `translateY(${ACTIVE_CARD_STYLE.translateY})` : "";
          titleRow.style.backgroundColor = isActive ? ACTIVE_CARD_STYLE.bgColor : "";
          titleRow.style.paddingLeft = isActive ? ACTIVE_CARD_STYLE.paddingX : "";
          titleRow.style.paddingRight = isActive ? ACTIVE_CARD_STYLE.paddingX : "";
        }
        gsap.set(c.el, { y: y - c.curCy, scale });
      }
      return;
    }

    // --- Horizontal mode: infinite scroll ---
    const sw = ctx.getSetWidth();
    if (sw <= 0) return;
    ctx.strip.scrollLeft = wrap(pos.current, sw);
  };
}
