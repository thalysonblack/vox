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
2. **Carousel imagery**: the 5 cards nearest the initial center have their `src` passed up as a list. The intro calls `Image.decode()` on each and waits for all to resolve.
3. **Carousel mount**: a `useEffect` inside `ProjectCarousel` pings the intro via a ref callback when the strip has its first layout pass (meaning Sanity returned and the strip rendered).

Combined with `Promise.all` → a single "ready" promise. Separately, two timers:

- `minHoldMs = 1000` — the gate cannot release before this.
- `maxHoldMs = 2500` — the gate releases no matter what at this point.

Release rule: `max(readyPromise, minHold)` — whichever resolves **later**, capped by `maxHold`.

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
| T + 0.80    | Curtain has fully left the viewport. Nav takes over the logo (intro logo → `opacity: 0`, nav logo → `opacity: 1`, same frame). |
| T + 1.30    | All cards in place. Footer fades in. `IntroCurtain` calls `onComplete` and unmounts.                                           |

Total wall-clock: min ~2.30s, max ~3.80s (when gate hits `maxHold`). Typical path with cached fonts + warm CDN: ~2.30–2.60s.

### The handoff is the critical bit

The intro's `<img>` tag and the nav's `<img>` tag render the same SVG file. At `T + 0.80`, both must occupy the **exact same bounding box**. If they drift by even 1–2 px, the eye catches the swap.

To guarantee this, the intro computes its final position and size by reading `document.querySelector('[data-vox-logo]')`'s `getBoundingClientRect()` at mount — not from hard-coded constants. GSAP tweens to those real values. The hand-off is triggered from a `tl.call()` at `T + 0.80` which flips both opacities in the same frame.

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
  - Mount `<IntroCurtain onComplete={...}/>` above everything.
  - Own `introDone` state, pass to children.
- `src/components/nav/Nav.tsx`
  - Accept `introDone` prop.
  - When `introDone === false`, the logo `<img>` renders with `opacity: 0` and `pointer-events: none` (no lift animation on mount).
  - When `introDone` flips to true, the logo is already visible (the intro's handoff placed it exactly there).
- `src/components/carousel/ProjectCarousel.tsx`
  - Accept `introDone` prop.
  - While `introDone === false`, cards render with inline `opacity: 0; transform: translateY(40px)`.
  - When flipped to true, a GSAP stagger-in runs once.
- `src/components/footer/Footer.tsx` (desktop only)
  - Accept `introDone` prop, fade in at `introDone = true`.

### Not touched

- Route handlers, Sanity queries, SEO metadata, project open/close choreography, detail panel, `webgl-demo` route.

---

## Error handling & edge cases

- **Slow network**: `maxHold = 2.5s` is the hard ceiling. Cards may fade in still-loading — that's acceptable because the browser will show them as soon as bytes arrive, and the stagger-in gives visual cover.
- **Reduced motion** (`prefers-reduced-motion: reduce`): curtain fades (no lift), logo snaps to nav position, cards fade in without stagger. Sequence collapses to ~0.4s total.
- **JS disabled**: no intro at all. The site renders directly (`introDone` defaults to `true` when `IntroCurtain` never mounts). This requires the server-rendered markup to assume `introDone = true` — see Open Questions.
- **Route change back to `/`**: intro does **not** replay. `HomeLayout`'s initial state is hydrated once per mount, but client-side nav (e.g. returning from `/project/[slug]`) reuses the same tree without remounting the intro. This matches "every visit" in the scope — "visit" meaning full page load, not SPA nav.
- **Tab backgrounded during intro**: `requestAnimationFrame` throttles, GSAP keeps timing. When the tab returns, the timeline catches up. No jank.
- **Deep link direct to `/project/slug`**: `HomeLayout` with `initialSlug` prop already auto-opens the panel. In this case the intro should **skip** — the user's intent is "see this project", not "meet the brand". Handled by an `initialSlug` check in `HomeLayout`: when present, `introDone` is initialized to `true` and `IntroCurtain` never mounts.

---

## Testing

Existing project has Playwright (`playwright-report/` in `.gitignore`). Two new tests in `tests/intro/`:

1. **Happy path**: load `/`, assert curtain is visible, wait for nav logo `opacity === 1`, assert carousel cards are visible, assert curtain is removed. Measure end-to-end wall-clock — should land in 2.0–3.8s.
2. **Reduced motion**: set `prefers-reduced-motion: reduce`, load `/`, assert total intro duration < 600ms and no transform tweens fire.

Skip visual-regression snapshots for the intro — it animates, snapshots would be flaky. Rely on functional assertions.

---

## Open questions

1. **Deep link to `/project/[slug]`** — current thinking is "skip intro". Confirm with user.
2. **Reduced motion behavior** — acceptable to fully collapse the sequence to a fade, or should the curtain still show (just without the lift)?
3. **Intro on client-side nav back to `/`** — currently specced as "don't replay". Confirm.
4. **Typography used in the centered logo during `displaying`** — same SVG wordmark at a larger size (simplest), or inline SVG with per-letter stagger fade (more production value)? Leaning toward same SVG for MVP; per-letter can be a follow-up.

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
