# Site Intro Curtain — Design Spec

**Date:** 2026-04-14
**Status:** Draft — awaiting user review
**Related:** Good Taste rebrand (commit `5db2c3d`), nav lift choreography (commit `a95ea68`)

---

## Goal

Give Good Taste a first-impression moment on page load: a short brand sequence that acts simultaneously as

1. a brand assertion (logo owns the full screen before the site does),
2. a functional bridge that hides real loading of fonts, Sanity data, and carousel imagery, and
3. a cinematic reveal that hands off to the existing horizontal/vertical carousel choreography.

The sequence must feel intentional on desktop **and** mobile, degrade gracefully if assets are slow, and never leave the user staring at a static curtain for more than ~2.5s.

---

## Scope

### In scope

- A client-side intro component shown on every visit to `/` (including deep links that redirect to `/` — out of scope for now, see Open Questions).
- Loading gate: min 1.0s / max 2.5s, released by a readiness signal (fonts + first 5 card images + carousel mount).
- Curtain lift + logo travel from center → nav slot (top-left), synchronized with a stagger-in of the carousel cards.
- Mobile variant that reuses the same component but targets the vertical carousel layout.
- Zero-flash handoff between the intro logo and the nav logo.

### Out of scope

- First-visit-only / session-persistence logic (picked "every visit" — we iterate later).
- Intro variants on `/project/[slug]` deep links (entry from an external link straight to a project page).
- Sound, video, or WebGL shaders (considered and rejected — this intro is pure typography + motion).
- Page transitions between routes (e.g. `/` → `/resources`).

---

## Architecture

### Component

- `src/components/intro/IntroCurtain.tsx` — a client component (`"use client"`) mounted once at the top of `HomeLayout.tsx`.
- Fixed position, `inset-0`, `z-[9999]`, `pointer-events-none` once lifting begins so clicks fall through.
- Local state machine: `phase: "idle" | "displaying" | "lifting" | "done"`. When `done`, the component returns `null` and unmounts.

### Coordination with the rest of the site

The rest of the site (`HomeLayout`, `Nav`, `ProjectCarousel`, `Footer`) is mounted from the first frame. The intro doesn't gate rendering — it gates **visibility**:

- `Nav` logo starts at `opacity: 0` (first render) and is raised to `1` only when the intro's handoff completes.
- `ProjectCarousel` cards start at `opacity: 0, y: +40` (first render). The intro triggers the stagger-in via a prop flag.
- `Footer` starts at `opacity: 0` and fades in with the cards.

This keeps Sanity data fetching, font loading, and image decoding running in parallel behind the curtain — the intro doesn't create artificial delay on top of real work.

### State plumbing

`HomeLayout` owns a single `introDone: boolean` state, passed down to `Nav`, `ProjectCarousel`, and `Footer`. When `IntroCurtain` finishes its timeline it calls `onComplete`, `HomeLayout` flips `introDone = true`, and the children react via `useEffect` / conditional styles.

No context, no global store — just two props down from `HomeLayout`.

### Loading gate

Readiness is computed inside `IntroCurtain` via three signals:

1. **Fonts**: `document.fonts.ready` (browser native).
2. **Carousel imagery**: `HomeLayout` builds the list of "critical images" at the first render. On desktop these are the 5 cards that are visible in the initial horizontal row (indices `[0..4]` from the Sanity query order). On mobile they are the 5 cards that populate the vertical 3-tier column (indices `[0..4]` — same set, different layout). The intro calls `Image.decode()` on each with `.catch(() => null)` so a single decode failure does not stall the gate; the `Promise.all` always resolves.
3. **Carousel mount**: a `useEffect` inside `ProjectCarousel` calls `onCarouselReady` (passed as a prop) on the first layout pass after Sanity data is present. `HomeLayout` forwards this signal into the intro.

Combined with `Promise.all` → a single `readyPromise`. Separately, two timers:

- `INTRO_TIMING.minHoldMs = 1000` — the gate cannot release before this.
- `INTRO_TIMING.maxHoldMs = 2500` — the gate releases no matter what at this point.

Release rule (pseudo): `whichever = Promise.race([readyPromise, maxTimer]); gateReleaseAt = max(whichever, minTimer)`. In words: release the later of (`readyPromise` OR `maxHold`) and `minHold`.

---

## Visual Sequence (desktop)

All times in seconds, starting at component mount (`t=0`).

| t (s)       | Event                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 0.00        | Black curtain covers viewport. Large centered logo at opacity 0.                                                               |
| 0.10        | Logo fades in at center (0.4s, `power2.out`).                                                                                  |
| 0.50 → T    | Logo holds at center. Assets load in background.                                                                               |
| **T (≥1.0, ≤2.5)** | Release gate fires. `phase = "lifting"`. Curtain begins `y: -100%` tween (0.8s, `expo.out`).                                  |
| T + 0.10    | Logo starts traveling: center → top-left of nav. Simultaneously shrinks to the nav's desktop base size (353×54). 0.7s, `power3.inOut`. |
| T + 0.55    | Cards fade-up from `y: +40, opacity: 0` → `y: 0, opacity: 1`. Stagger 0.04s per card, `expo.out` 0.7s each.                    |
| T + 0.80    | Curtain has fully left the viewport. Nav takes over the logo (intro logo → `opacity: 0`, nav logo → `opacity: 1`, same frame). **`onComplete` fires. `introDone = true`. `IntroCurtain` unmounts.** |
| T + 0.85    | Card stagger-in and footer fade-in begin (owned by their own components, driven by `introDone`).                               |
| T + 1.30    | All cards in place. Footer at full opacity. Site fully interactive.                                                            |

Total wall-clock: min ~2.30s, max ~3.80s (when gate hits `maxHold`). Typical path with cached fonts + warm CDN: ~2.30–2.60s.

### The handoff is the critical bit

The intro's `<img>` tag and the nav's `<img>` tag render the same SVG file. At `T + 0.80`, both must occupy the **exact same bounding box**. If they drift by even 1–2 px, the eye catches the swap.

To guarantee this, the intro reads `document.querySelector('[data-vox-logo]')`'s `getBoundingClientRect()` **at the gate release moment `T`** — not at mount. Reading at mount risks a stale rect if the font hasn't loaded and the nav's layout shifts. At `T`, `document.fonts.ready` has resolved (it is part of `readyPromise`), so the nav's bounding box is final. The intro then builds the travel tween with the real target values and the handoff `tl.call()` at `T + 0.80` flips both opacities in the same frame.

### Lifecycle: `onComplete` fires at handoff, not at cards-done

The intro calls `props.onComplete()` at `T + 0.80` — the same frame the nav logo takes over. Flipping `introDone = true` at this moment is what **drives** the card stagger-in and footer fade (both react to the prop change independently). The `IntroCurtain` component itself unmounts as soon as the curtain is off-screen (`T + 0.80`), not at `T + 1.30`. The cards and footer animate after unmount because they own their own tweens.

This removes the race: the intro is responsible for curtain + logo handoff only, the carousel is responsible for card entry, and the footer is responsible for its own fade. `introDone` is the single shared signal.

---

## Mobile variant

Same component, same curtain motion, same logo fade-in — but the stagger target changes:

| Property             | Desktop                               | Mobile                                                                                                   |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Final logo size      | 353×54 (top-left)                     | 180×27 (top-left) — matches the new mobile base from the Good Taste rebrand                              |
| Card stagger target  | Horizontal row (5 cards, L→R)         | Vertical column (5 cards, 3-tier scale)                                                                   |
| Card stagger order   | Left-to-right                         | Center-out (active center card first, then the two adjacents, then the two outer slots)                    |
| CONNECT button       | Fades in with footer at T+1.30        | Fades in with logo at T+0.80 (no footer on mobile)                                                        |

The component detects viewport via `window.matchMedia("(min-width: 768px)")` at mount and picks the stagger pattern. The curtain + logo travel are identical.

---

## Files

### New

- `src/components/intro/IntroCurtain.tsx` — main component.
- `src/components/intro/intro.constants.ts` — `INTRO_TIMING`, `INTRO_EASE`, curtain / logo sizing.
- `src/components/intro/intro.animations.ts` — `createIntroTimeline(ctx)` helper that returns a GSAP timeline, mirroring the pattern in `src/components/carousel/carousel.animations.ts`.

### Modified

- `src/components/HomeLayout.tsx`
  - Mount `<IntroCurtain onComplete={...}/>` above everything **when the intro should play** (see SSR section below).
  - Own `introDone` state, pass to children.
  - Forward `onCarouselReady` callback from carousel up to intro.
- `src/components/nav/Nav.tsx`
  - Accept `introDone` prop.
  - When `introDone === false`, the logo `<img>` renders with **inline** `style={{ opacity: 0, pointerEvents: "none" }}` (SSR-safe — no GSAP `.set()`, no flash).
  - When `introDone` flips to `true`, inline styles are removed and the logo is visible where the intro's handoff placed it.
- `src/components/carousel/ProjectCarousel.tsx`
  - Accept `introDone` prop and `onCarouselReady` callback.
  - Each card wrapper renders with **inline** `style={{ opacity: 0, transform: "translateY(40px)" }}` while `introDone === false` (SSR-safe — guarantees no flash before hydration).
  - When `introDone` flips to `true`, a `useEffect` fires a single GSAP stagger-in tween over the cards and then strips the inline styles.
- `src/components/footer/Footer.tsx` (desktop only)
  - Accept `introDone` prop, render with inline `opacity: 0` while false, fade in at `introDone = true`.

### Not touched

- Route handlers, Sanity queries, SEO metadata, project open/close choreography, detail panel, `webgl-demo` route.

---

## Error handling & edge cases

- **Slow network**: `maxHold = 2.5s` is the hard ceiling. Cards may fade in still-loading — that's acceptable because the browser will show them as soon as bytes arrive, and the stagger-in gives visual cover.

- **Reduced motion** (`prefers-reduced-motion: reduce`): `IntroCurtain` mounts normally but runs a collapsed sequence. Curtain fades out over 300ms instead of lifting. Logo snaps directly to nav position (no travel tween). Cards appear without stagger — all fade in at once over 200ms. Footer fade 200ms. Gate timings are bypassed: total sequence ≤ 600ms regardless of `minHold`/`maxHold`. `onComplete` still fires; `introDone` still flips.

- **JS disabled**: The server-rendered markup is the source of truth. HTML is rendered with `introDone = true` semantics (nav logo visible, cards visible, footer visible — no inline `opacity: 0`). On the client, React hydrates and `HomeLayout` immediately initializes `introDone = false` in a `useLayoutEffect`, applies the intro styles before paint, and mounts `IntroCurtain`. This avoids both FOUC and hydration mismatch (SSR HTML matches the default client render; `useLayoutEffect` runs **synchronously after DOM mutations but before the browser paints**, so even though there is technically one commit where the DOM matches SSR, the user never sees that frame — the intro takes over seamlessly). JS-disabled users see the full site immediately with no intro — correct and non-broken.

- **Route change back to `/` (client-side nav)**: intro does **not** replay. Tracked via a module-level `hasPlayedIntroRef` flag set to `true` at first `onComplete`. When `HomeLayout` mounts again (e.g. from `/resources` → `/`), it initializes `introDone = hasPlayedIntroRef.current || false`. If already played, cards/nav/footer render immediately. **Module-level state survives client-side nav but resets on hard reload** (new JS module instance) — which is the intended "every visit = every page load" behavior from the scope section.

- **Tab backgrounded during intro**: `requestAnimationFrame` throttles, GSAP keeps timing. When the tab returns, the timeline catches up. No jank.

- **Deep link direct to `/project/slug`**: `HomeLayout` with `initialSlug` prop already auto-opens the panel. In this case the intro **does not mount**. `HomeLayout` checks `initialSlug` and skips `IntroCurtain` entirely, initializing `introDone = true`. This applies both to full page loads (SSR'd with `/project/slug`) and to any future client-side nav that arrives with `initialSlug` set.

---

## Testing

Existing project has Playwright (`playwright-report/` in `.gitignore`). Two new tests in `tests/intro/`:

1. **Happy path**: load `/`, assert curtain is visible, wait for nav logo `opacity === 1`, assert carousel cards are visible, assert curtain is removed. Measure end-to-end wall-clock — should land in 2.0–3.8s.
2. **Reduced motion**: set `prefers-reduced-motion: reduce`, load `/`, assert total intro duration < 600ms and no transform tweens fire.

Skip visual-regression snapshots for the intro — it animates, snapshots would be flaky. Rely on functional assertions.

---

## Constants

All intro timings, easings, and sizes live in `src/components/intro/intro.constants.ts`:

```ts
export const INTRO_TIMING = {
  // Loading gate
  minHoldMs: 1000,
  maxHoldMs: 2500,

  // Phase durations (seconds, for GSAP)
  logoFadeInDur: 0.4,
  curtainLiftDur: 0.8,
  logoTravelDur: 0.7,
  logoTravelDelay: 0.10, // after curtain lift starts
  cardStaggerDur: 0.7,
  cardStaggerGap: 0.04,
  cardStaggerDelay: 0.55, // after curtain lift starts
  handoffAt: 0.80,        // after curtain lift starts
  footerFadeDur: 0.3,

  // Reduced motion collapse
  reducedMotionTotalMs: 600,
} as const;

export const INTRO_EASE = {
  logoFade: "power2.out",
  curtainLift: "expo.out",
  logoTravel: "power3.inOut",
  cardEntry: "expo.out",
} as const;

export const INTRO_LOGO_LARGE = {
  // Desktop + mobile share the same centered size. The wordmark already
  // reads comfortably at 420x64 on a 375px-wide viewport (it crops at
  // roughly 90% of screen width, which is the intended editorial feel),
  // and keeping it uniform means there is a single travel tween target
  // to compute per viewport.
  widthPx: 420,
  heightPx: 64,
} as const;
```

## Logo centered during `displaying`

MVP uses the same `/assets/vox-logo.svg` file, rendered at `INTRO_LOGO_LARGE` dimensions. The `<img>` is natively vector-crisp at any size (we fixed the pixelization earlier in the rebrand). A per-letter stagger via inline SVG is **explicitly out of scope** for this spec — it can be a follow-up without changing any other piece of the design.

## Open questions

*None blocking.* All design questions are resolved in the sections above (deep link, reduced motion, client-side nav, centered logo typography).

---

## Success criteria

- Page load on `/` shows a black curtain within the first paint, logo fades in within 500ms.
- On typical network (fonts cached, CDN warm), total intro duration is 2.0–2.5s.
- On slow network, intro does not exceed 3.8s.
- Logo handoff from intro to nav is visually seamless — no pixel jump, no flash.
- Cards enter with a staggered motion that feels continuous with the existing carousel choreography language (`expo.out`, staggered tweens).
- Mobile sequence feels the same as desktop, adapted to the vertical layout.
- Deep-linked project pages and client-side nav don't replay the intro.
- `prefers-reduced-motion` users get a ≤600ms fade version.
