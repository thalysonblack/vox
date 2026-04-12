/**
 * Animation constants for the carousel choreography.
 * Extracted from ProjectCarousel to eliminate magic numbers.
 */

// --- Phase A: Horizontal row (shrink to vertical scales) ---
export const PHASE_A = {
  clickedScale: 0.54,
  otherScale: 0.36,
  gapMultiplier: 2.2,
  minGap: 96,
} as const;

// --- Phase B: Vertical selector (3-tier progressive scale) ---
// Scales chosen so 5 cards fit vertically without overlap (center + 2 adj
// + 2 other slightly cropped at viewport edges) — see buildVerticalState.
export const PHASE_B = {
  centerScale: 0.48,
  adjacentScale: 0.3,
  otherScale: 0.18,
  gap: 32,
  columnX: 40,
} as const;

// --- Animation timing ---
export const TIMING = {
  /** Phase B vertical slide duration */
  verticalDur: 0.9,
  /** Phase B horizontal slide duration */
  horizontalDur: 0.95,
  /** Horizontal slide start offset (overlaps with vertical) */
  horizontalStart: 0.35,
  /** When to open detail panel during choreography */
  detailOpenAt: 0.85,
  /** Reverse animation duration */
  reverseDur: 0.85,
  /** Vertical snap scroll duration */
  verticalSnapDur: 0.25,
  /** Vertical tap-scroll duration */
  verticalTapScrollDur: 0.35,
  /** Duplicate fade-out duration */
  dupFadeOutDur: 0.4,
  /** Duplicate fade-out delay */
  dupFadeOutDelay: 0.9,
  /** Duplicate fade-in duration (reverse) */
  dupFadeInDur: 0.55,
  /** Duplicate fade-in delay (reverse) */
  dupFadeInDelay: 0.25,
} as const;

// --- Vertical mode title style overrides ---
export const VERTICAL_TITLE = {
  fontSize: "22px",
  letterSpacing: "-0.88px",
} as const;

// --- Vertical mode active card style ---
export const ACTIVE_CARD_STYLE = {
  translateY: "-8px",
  bgColor: "rgba(31,43,57,0.03)",
  paddingX: "8px",
} as const;

// --- Wheel / drag thresholds ---
export const INTERACTION = {
  /** Wheel accumulation threshold for vertical snap */
  wheelThreshold: 40,
  /** Drag distance threshold for vertical tap vs drag */
  dragStepPx: 60,
  /** Active card slot threshold (|slotOff| < this = active) */
  activeSlotThreshold: 0.5,
} as const;

// --- Easing curves (GSAP names) ---
export const EASE = {
  /** Entry / expansion from center (dramatic decay) */
  enter: "expo.out",
  /** Snap to slot after scroll stops (crisp, brief) */
  snap: "power2.out",
  /** Reverse / close animation (Lenis-style tail) */
  reverse: "expo.out",
} as const;

// --- Mobile vertical physics (momentum + free-scroll snap) ---
export const MOBILE_PHYSICS = {
  /** Friction coefficient per frame (higher = longer glide) */
  friction: 0.998,
  /** Lag factor for pos.current chasing pos.target (higher = smoother) */
  smoothLag: 0.985,
  /** Multiplier applied to wheel deltaY to produce impulse */
  wheelImpulse: 0.125,
  /** Fling multiplier applied to last drag velocity */
  flingMultiplier: 1,
  /** Idle time before snap animation kicks in (ms) */
  snapDelay: 2500,
  /** Final snap tween duration */
  snapDuration: 1,
  /** Mobile-specific scale boost over desktop PHASE_B tiers */
  scaleBoost: 1.3,
} as const;

// --- Desktop horizontal physics ---
export const DESKTOP_PHYSICS = {
  /** Friction coefficient per frame */
  friction: 0.98,
} as const;
