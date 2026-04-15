/**
 * Intro curtain timing + easing constants. Values mirror the rhythm of
 * the carousel choreography (expo.out, ~0.7-0.9s phases).
 */
export const INTRO_TIMING = {
  // Loading gate
  minHoldMs: 1000,
  maxHoldMs: 2500,

  // Phase durations (seconds, for GSAP)
  logoFadeInDur: 0.4,
  logoFadeInDelay: 0.1,
  curtainLiftDur: 0.8,
  logoTravelDur: 0.7,
  logoTravelDelay: 0.10, // after curtain lift starts
  cardStaggerDur: 0.7,
  cardStaggerGap: 0.04,
  cardStaggerDelayFromLift: 0.55,
  handoffAtFromLift: 0.80,
  footerFadeDur: 0.3,

  // Reduced motion collapse (milliseconds — no GSAP, pure CSS)
  reducedMotionTotalMs: 600,
  reducedMotionCurtainFadeMs: 300,
  reducedMotionContentFadeMs: 200,
} as const;

export const INTRO_EASE = {
  logoFade: "power2.out",
  curtainLift: "expo.out",
  logoTravel: "power3.inOut",
  cardEntry: "expo.out",
} as const;

export const INTRO_LOGO_LARGE = {
  // Desktop + mobile share the same centered size. 420x64 reads
  // comfortably on a 375px-wide viewport (~90% width editorial feel)
  // and keeps the travel-tween target uniform across viewports.
  widthPx: 420,
  heightPx: 64,
} as const;
