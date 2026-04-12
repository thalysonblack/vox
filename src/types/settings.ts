/**
 * Runtime site settings from Sanity. Any missing field falls back to
 * MOBILE_PHYSICS defaults (see `resolveSiteSettings`).
 */
export interface SiteSettings {
  scrollFriction?: number;
  scrollSmoothLag?: number;
  scrollWheelImpulse?: number;
  scrollFlingMultiplier?: number;
  scrollSnapDelay?: number;
  scrollSnapDuration?: number;
}

/**
 * Fully-resolved physics config used by the carousel. No optional fields —
 * every value is guaranteed via fallback to MOBILE_PHYSICS defaults.
 */
export interface ResolvedScrollPhysics {
  friction: number;
  smoothLag: number;
  wheelImpulse: number;
  flingMultiplier: number;
  snapDelay: number;
  snapDuration: number;
}
