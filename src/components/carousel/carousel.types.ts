import type { gsap } from "gsap";

export interface DragState {
  active: boolean;
  startX: number;
  lastX: number;
  lastDx: number;
  startTarget: EventTarget | null;
}

export interface CardState {
  el: HTMLElement;
  curCy: number;
  baseOffset: number;
  setY: (n: number) => void;
  setScale: (n: number) => void;
}

export interface VerticalState {
  cards: CardState[];
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
  /** Dynamically computed column X (card left edge) — centered between logo and panel */
  columnX: number;
}

export interface ScrollPosition {
  target: number;
  current: number;
}

/** Refs bundle passed to extracted functions to avoid prop drilling */
export interface CarouselRefs {
  strip: HTMLDivElement | null;
  set1: HTMLDivElement | null;
  setWidth: number;
  pos: ScrollPosition;
  impulse: number;
  drag: DragState;
  pointer: number;
  isAnimating: boolean;
  mode: "horizontal" | "vertical";
  vState: VerticalState | null;
  wheelAccum: number;
  animTimeline: gsap.core.Timeline | null;
  nonCanonicalEls: HTMLElement[];
  cleanup: ((targetScrollLeft?: number) => void) | null;
  verticalIdx: number;
}
