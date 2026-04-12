import { client } from "@/lib/sanity";
import { siteSettingsQuery } from "@/lib/queries";
import { MOBILE_PHYSICS } from "@/components/carousel/carousel.constants";
import type {
  ResolvedScrollPhysics,
  SiteSettings,
} from "@/types/settings";

/**
 * Merge Sanity-provided settings with compile-time defaults.
 * Any missing / invalid value falls back to MOBILE_PHYSICS.
 */
export function resolveScrollPhysics(
  settings: SiteSettings | null,
): ResolvedScrollPhysics {
  return {
    friction: settings?.scrollFriction ?? MOBILE_PHYSICS.friction,
    smoothLag: settings?.scrollSmoothLag ?? MOBILE_PHYSICS.smoothLag,
    wheelImpulse: settings?.scrollWheelImpulse ?? MOBILE_PHYSICS.wheelImpulse,
    flingMultiplier:
      settings?.scrollFlingMultiplier ?? MOBILE_PHYSICS.flingMultiplier,
    snapDelay: settings?.scrollSnapDelay ?? MOBILE_PHYSICS.snapDelay,
    snapDuration: settings?.scrollSnapDuration ?? MOBILE_PHYSICS.snapDuration,
  };
}

/**
 * Fetch site settings from Sanity. Returns null if the document doesn't
 * exist yet (Studio hasn't been touched) — caller should pass to
 * resolveScrollPhysics() which handles the null case.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const data = await client.fetch<SiteSettings | null>(siteSettingsQuery);
    return data ?? null;
  } catch {
    return null;
  }
}
