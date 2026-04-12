/**
 * Carousel tick loop — impulse physics, friction, smooth easing.
 * Handles both horizontal (infinite scroll) and vertical (snap) modes.
 */
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import {
  ACTIVE_CARD_STYLE,
  DESKTOP_PHYSICS,
  INTERACTION,
  MOBILE_PHYSICS,
} from "./carousel.constants";
import { computeSlotY, computeSlotScale } from "./carousel.animations";
import type { ScrollPosition, VerticalState } from "./carousel.types";

const wrap = (v: number, sw: number) => ((v % sw) + sw) % sw;

export interface TickContext {
  getPos: () => ScrollPosition;
  getImpulse: () => number;
  setImpulse: (v: number) => void;
  getIsAnimating: () => boolean;
  /** If true, the physics step (impulse + smoothLag) is skipped but cards
   *  are still positioned from pos.current. Used during click-to-center
   *  animations where an external gsap tween owns pos. */
  getIsPhysicsPaused: () => boolean;
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
    const isVertical = ctx.getMode() === "vertical";
    const physicsPaused = ctx.getIsPhysicsPaused();

    // Physics step: skipped during click-to-center tweens so external gsap
    // has exclusive ownership of pos.target / pos.current.
    if (!physicsPaused) {
      const frictionBase = isVertical
        ? MOBILE_PHYSICS.friction
        : DESKTOP_PHYSICS.friction;
      const friction = Math.pow(frictionBase, dt);
      let impulse = ctx.getImpulse() * friction;
      if (Math.abs(impulse) < 0.01) impulse = 0;
      ctx.setImpulse(impulse);

      pos.target += impulse * dt;
      const smoothBase = isVertical ? MOBILE_PHYSICS.smoothLag : config.smooth;
      const ease = 1 - Math.pow(smoothBase, dt);
      const diff = pos.target - pos.current;
      if (Math.abs(diff) < 0.3) {
        pos.current = pos.target;
      } else {
        pos.current += diff * ease;
      }
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
        const scale = computeSlotScale(
          absOff,
          v.centerScale,
          v.adjacentScale,
          v.otherScale,
        );

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
