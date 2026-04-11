# WebGL Wave Carousel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Three.js canvas layer behind the carousel that renders card images with a wave distortion shader, triggered by scroll velocity and hover.

**Architecture:** Raw Three.js canvas (pointer-events: none) positioned behind DOM cards. Orthographic camera (1 unit = 1 pixel). One ShaderMaterial per card with wave fragment shader. Synced to carousel position via gsap.ticker.

**Tech Stack:** Three.js (already installed), GSAP (already installed), TypeScript, Next.js

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/WebGLCarouselLayer.tsx` | Create | Three.js scene, renderer, planes, shader, position sync, hover uniforms |
| `src/components/ProjectCarousel.tsx` | Modify | Integrate WebGLCarouselLayer, expose refs/state, hover callbacks |
| `src/components/ProjectCard.tsx` | Modify | Accept `webglReady` + `onHover` props, hide image when texture loaded |

---

## Chunk 1: WebGL Layer Component

### Task 1: Create WebGLCarouselLayer

**Files:**
- Create: `src/components/WebGLCarouselLayer.tsx`

- [ ] **Step 1: Create the component with Three.js setup**

The component:
- Receives props: `projects`, `containerRef`, `posRef`, `impulseRef`, `isAnimatingRef`, `modeRef`, `vStateRef`, `hoveredId`, `onTexturesLoaded`
- Creates canvas, WebGLRenderer (alpha: true), OrthographicCamera (1px = 1 unit)
- Creates one PlaneGeometry (shared) + one ShaderMaterial per unique project image
- Loads textures from raw Sanity CDN URLs with `?w=512&fit=max&auto=format`
- Registers a `gsap.ticker` callback for sync + render
- Handles resize, context loss, cleanup

Shader uniforms per plane:
- `uTime` (float) — elapsed time
- `uScrollSpeed` (float) — clamped 0-1
- `uHover` (float) — 0-1 tweened via GSAP
- `uVertical` (float) — 0 or 1
- `uTexture` (sampler2D) — card image

Position sync:
- Horizontal mode: math-based from `posRef.current`, card index, cardWidth, gap
- Vertical/animating: read `getBoundingClientRect()` from DOM cards
- Planes sized to match card image area (excluding title row)

- [ ] **Step 2: Commit**

```bash
git add src/components/WebGLCarouselLayer.tsx
git commit -m "feat: add WebGLCarouselLayer with wave shader"
```

---

## Chunk 2: Integration

### Task 2: Modify ProjectCard to support WebGL overlay

**Files:**
- Modify: `src/components/ProjectCard.tsx`

- [ ] **Step 1: Add props for webgl state and hover callbacks**

Add optional props:
- `hideImage?: boolean` — when true, image gets `opacity: 0` (WebGL showing instead)
- `onPointerEnter?: () => void`
- `onPointerLeave?: () => void`

Apply `hideImage` as inline opacity on the Image wrapper div.
Wire pointer events on the outer card div.

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "feat: ProjectCard accepts hideImage and hover props"
```

### Task 3: Integrate WebGLCarouselLayer into ProjectCarousel

**Files:**
- Modify: `src/components/ProjectCarousel.tsx`

- [ ] **Step 1: Add state and render WebGLCarouselLayer**

Changes:
- Add `hoveredIdRef` (useRef<string | null>) — updated by card hover callbacks
- Add `texturesLoadedRef` (useRef<Set<string>>) — tracks which project images are GPU-ready
- Add `[webglReady, setWebglReady]` state — flips true when all textures loaded
- Render `<WebGLCarouselLayer>` as sibling before the strip section
- Pass all required refs: `stripRef`, `posRef`, `impulseRef`, `isAnimatingRef`, `modeRef`, `vStateRef`
- Pass `hoveredId` and `onTexturesLoaded` callback
- In ProjectCard render: pass `hideImage={texturesLoadedRef.current.has(project.id)}`, `onPointerEnter`, `onPointerLeave`

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCarousel.tsx
git commit -m "feat: integrate WebGL wave layer into carousel"
```

---

## Chunk 3: Polish & Mobile

### Task 4: Mobile fallback and final polish

**Files:**
- Modify: `src/components/WebGLCarouselLayer.tsx`

- [ ] **Step 1: Verify mobile detection**

Component early-returns `null` if `window.innerWidth <= 768`. Canvas gets CSS class `webgl-carousel-canvas` with media query `display: none` at 768px as safety net.

- [ ] **Step 2: Test all scenarios from spec checklist**

Manual testing:
- Horizontal scroll: wave distortion proportional to speed
- Hover: wave intensifies on enter, fades on leave
- Stop scroll: wave decays to zero
- Click card: choreography runs, planes follow
- Vertical scroll: wave on Y axis
- Close panel: planes follow back
- Mobile: no canvas
- Resize: canvas repositions
- Rapid hover: no glitch

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: WebGL wave carousel — complete implementation"
```
