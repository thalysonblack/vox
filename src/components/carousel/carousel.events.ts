/**
 * Carousel event handlers — wheel, pointer (drag), click.
 * Factory functions that return handlers + cleanup.
 */
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import { EASE, INTERACTION, TIMING } from "./carousel.constants";
import { unlockTick } from "./carousel.tick";
import type { DragState, ScrollPosition, VerticalState } from "./carousel.types";
import type { ProjectListItem } from "@/types/project";
import type { ResolvedScrollPhysics } from "@/types/settings";

// ---------------------------------------------------------------------------
// Vertical card advance (shared by wheel + drag)
// ---------------------------------------------------------------------------

export function advanceVerticalCard(
  dir: number,
  pos: ScrollPosition,
  vState: VerticalState,
  setImpulse: (v: number) => void,
) {
  const targetScroll = pos.target - dir * vState.stepY;
  gsap.killTweensOf(pos);
  setImpulse(0);
  gsap.to(pos, {
    target: targetScroll,
    current: targetScroll,
    duration: TIMING.verticalSnapDur,
    ease: "expo.out",
  });
}

// ---------------------------------------------------------------------------
// Event context (shared refs from the component)
// ---------------------------------------------------------------------------

export interface EventContext {
  strip: HTMLElement;
  getMode: () => "horizontal" | "vertical";
  getPos: () => ScrollPosition;
  getVState: () => VerticalState | null;
  getDrag: () => DragState;
  setDrag: (d: DragState) => void;
  getPointer: () => number;
  setPointer: (id: number) => void;
  getImpulse: () => number;
  setImpulse: (v: number) => void;
  getWheelAccum: () => number;
  setWheelAccum: (v: number) => void;
  getProjects: () => ProjectListItem[];
  getPhysics: () => ResolvedScrollPhysics;
  onTap: (project: ProjectListItem, el: HTMLElement) => void;
}

// ---------------------------------------------------------------------------
// Wheel handler
// ---------------------------------------------------------------------------

export function createWheelHandler(ctx: EventContext) {
  let snapTimer: number | null = null;

  const scheduleSnap = (delay: number) => {
    if (snapTimer !== null) window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      snapTimer = null;
      const vState = ctx.getVState();
      if (!vState) return;
      const pos = ctx.getPos();
      ctx.setImpulse(0);
      const nearest = Math.round(pos.target / vState.stepY) * vState.stepY;
      gsap.killTweensOf(pos);
      gsap.to(pos, {
        target: nearest,
        current: nearest,
        duration: ctx.getPhysics().snapDuration,
        ease: EASE.snap,
      });
    }, delay);
  };

  return (e: WheelEvent) => {
    if (e.deltaY === 0) return;
    const target = e.target as Element | null;
    if (target?.closest("[data-scrollable-panel]")) return;
    e.preventDefault();

    if (ctx.getMode() === "vertical") {
      // Inject impulse — tick applies it to pos.target with friction decay,
      // so the carousel visibly "runs" before slowing to a stop.
      const physics = ctx.getPhysics();
      gsap.killTweensOf(ctx.getPos());
      ctx.setImpulse(ctx.getImpulse() - e.deltaY * physics.wheelImpulse);
      scheduleSnap(physics.snapDelay);
      return;
    }
    ctx.setImpulse(ctx.getImpulse() - e.deltaY * config.wheel);
  };
}

// ---------------------------------------------------------------------------
// Pointer handlers (drag)
// ---------------------------------------------------------------------------

export function createPointerHandlers(ctx: EventContext) {
  const onPointerDown = (e: PointerEvent) => {
    unlockTick();
    if (!config.drag) return;
    ctx.setPointer(e.pointerId);
    ctx.strip.setPointerCapture?.(e.pointerId);
    ctx.setImpulse(0);
    const pos = ctx.getPos();
    gsap.killTweensOf(pos);
    ctx.setDrag({
      active: true,
      startX: ctx.getMode() === "vertical" ? e.clientY : e.clientX,
      lastX: ctx.getMode() === "vertical" ? e.clientY : e.clientX,
      lastDx: 0,
      startTarget: e.target,
      startTargetPos: pos.target,
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== ctx.getPointer()) return;
    const d = ctx.getDrag();
    if (!d.active) return;
    const axis = ctx.getMode() === "vertical" ? e.clientY : e.clientX;
    const dx = (axis - d.lastX) * config.dragSensitivity;
    ctx.setDrag({ ...d, lastX: axis, lastDx: dx });
    if (ctx.getMode() === "vertical") {
      // Free-move: cards follow the finger continuously.
      const pos = ctx.getPos();
      const delta = axis - d.startX;
      pos.target = d.startTargetPos + delta;
      pos.current = pos.target;
      return;
    }
    ctx.setImpulse(-dx);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== ctx.getPointer()) return;
    ctx.strip.releasePointerCapture?.(e.pointerId);
    const d = ctx.getDrag();
    if (!d.active) return;
    ctx.setDrag({ ...d, active: false });

    const axisUp = ctx.getMode() === "vertical" ? e.clientY : e.clientX;
    const totalDrag = Math.abs(axisUp - d.startX);

    if (ctx.getMode() === "vertical") {
      if (totalDrag < INTERACTION.dragStepPx) {
        // Tap
        const el = d.startTarget as Element | null;
        const cardEl = el?.closest<HTMLElement>("[data-project-id]");
        if (cardEl) {
          const projectId = cardEl.dataset.projectId;
          const project = ctx.getProjects().find((p) => p.id === projectId);
          if (project) ctx.onTap(project, cardEl);
        }
        // Snap back on tiny drag (below threshold).
        const vState = ctx.getVState();
        if (vState) {
          const pos = ctx.getPos();
          const nearest =
            Math.round(pos.target / vState.stepY) * vState.stepY;
          gsap.to(pos, {
            target: nearest,
            current: nearest,
            duration: 0.25,
            ease: EASE.snap,
          });
        }
      } else {
        // Fling: apply momentum impulse from last drag velocity, let it decay,
        // then snap to nearest slot after idle.
        const physics = ctx.getPhysics();
        const flingImpulse = d.lastDx * physics.flingMultiplier;
        ctx.setImpulse(flingImpulse);

        const vState = ctx.getVState();
        if (vState) {
          window.setTimeout(() => {
            const pos = ctx.getPos();
            ctx.setImpulse(0);
            const nearest =
              Math.round(pos.target / vState.stepY) * vState.stepY;
            gsap.killTweensOf(pos);
            gsap.to(pos, {
              target: nearest,
              current: nearest,
              duration: physics.snapDuration,
              ease: EASE.snap,
            });
          }, physics.snapDelay);
        }
      }
      return;
    }

    if (totalDrag <= config.tapThreshold) {
      const el = d.startTarget as Element | null;
      const cardEl = el?.closest<HTMLElement>("[data-project-id]");
      if (cardEl) {
        const projectId = cardEl.dataset.projectId;
        const project = ctx.getProjects().find((p) => p.id === projectId);
        if (project) ctx.onTap(project, cardEl);
      }
      return;
    }
    ctx.setImpulse(-d.lastDx * (config.fling / 100));
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ---------------------------------------------------------------------------
// Click delegate (vertical mode)
// ---------------------------------------------------------------------------

export function createClickDelegate(ctx: EventContext) {
  return (e: MouseEvent) => {
    unlockTick();
    if (ctx.getMode() !== "vertical") return;
    const target = e.target as Element | null;
    const cardEl = target?.closest<HTMLElement>("[data-project-id]");
    if (!cardEl) return;
    if (cardEl.style.pointerEvents === "none") return;
    if (cardEl.style.opacity === "0") return;
    const projectId = cardEl.dataset.projectId;
    const project = ctx.getProjects().find((p) => p.id === projectId);
    if (!project) return;
    ctx.onTap(project, cardEl);
  };
}
