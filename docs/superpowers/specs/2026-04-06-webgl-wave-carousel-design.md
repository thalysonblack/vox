# WebGL Wave Carousel — Design Spec

## Summary

Add a WebGL layer to the home carousel that renders card images as Three.js planes with a wave distortion fragment shader. The DOM layer (text, click targets, accessibility) remains untouched on top. The effect triggers on hover and scroll with moderate intensity.

## Goals

- Premium visual effect on card images (wave/ondulacao)
- Hover + scroll as triggers, moderate intensity
- Zero impact on existing DOM interactions (click, drag, tap)
- Mobile fallback: WebGL disabled, pure DOM (< 768px)
- Backup via git branch (`feature/webgl-carousel`, `main` untouched)

## Non-Goals

- No 3D transforms or rotation effects
- No particle systems
- No changes to the detail panel, choreography logic, or data flow
- No changes to the `/gallery` WebGL page

## Architecture

### Why Raw Three.js (Not React Three Fiber)

The `/gallery` route uses React Three Fiber (R3F) with `<Canvas>`. The carousel WebGL layer uses raw Three.js instead because:
- It must sync with `gsap.ticker` (imperative, per-frame control outside React render cycle)
- It runs alongside GSAP transforms on DOM elements — R3F's declarative model would fight this
- The canvas is a passive visual layer, not an interactive 3D scene

This means the project has two Three.js patterns: R3F for `/gallery`, raw Three.js for carousel. This is intentional and acceptable — they serve different purposes.

### Layer Stack

```
┌─────────────────────────────────────────────────┐
│  DOM Layer (pointer-events: auto, z-index: 2)   │
│  - ProjectCard text (visible)                   │
│  - ProjectCard img (opacity: 0)                 │
│  - Click/drag/hover handlers                    │
├─────────────────────────────────────────────────┤
│  WebGL Layer (pointer-events: none, z-index: 1) │
│  - Three.js canvas (position: absolute)         │
│  - One plane per card with wave shader           │
│  - Synced to DOM card positions                  │
└─────────────────────────────────────────────────┘
```

### Shader Design

Fragment shader with 3 dynamic uniforms:

| Uniform | Source | Effect |
|---------|--------|--------|
| `uTime` | Elapsed time | Base wave oscillation |
| `uScrollSpeed` | Scroll velocity (normalized) | Distortion intensity proportional to drag speed |
| `uHover` | 0.0 → 1.0 (GSAP tween) | Intensifies wave on mouse enter, fades on leave |

**`uScrollSpeed` range:** The raw value comes from `impulseRef` which ranges ~0 to ~2.8 (based on `config.fling / 100`). Clamp to `[0, 1]` before passing to the shader: `Math.min(Math.abs(impulseRef.current) / 3.0, 1.0)`.

Core GLSL logic:
```glsl
uniform float uTime;
uniform float uScrollSpeed;  // clamped 0.0 - 1.0
uniform float uHover;        // 0.0 - 1.0
uniform float uVertical;     // 0.0 horizontal, 1.0 vertical
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float frequency = 8.0;
    float amplitude = 0.015;
    float scrollMult = 3.0;
    float hoverMult = 2.0;

    float intensity = uScrollSpeed * scrollMult + uHover * hoverMult;
    float wave = sin(uv.y * frequency + uTime * 2.0) * amplitude * intensity;

    // In vertical mode, wave distorts along Y axis instead of X
    uv.x += wave * (1.0 - uVertical);
    uv.y += wave * uVertical;

    gl_FragColor = texture2D(uTexture, uv);
}
```

Vertex shader: standard passthrough (position + UV).

### Camera & Coordinate Mapping

Orthographic camera configured so 1 world unit = 1 pixel:

```
camera = new THREE.OrthographicCamera(0, canvasWidth, canvasHeight, 0, -1, 1)
```

Plane positions use pixel coordinates directly. On resize, update camera `right`/`top` and call `updateProjectionMatrix()`.

### Synchronization

Runs inside the existing `gsap.ticker` callback in `ProjectCarousel.tsx`:

1. Read `posRef.current` each frame
2. Compute `scrollSpeed` as `Math.min(Math.abs(impulseRef.current) / 3.0, 1.0)`
3. **Horizontal mode**: compute plane positions mathematically from `posRef.current`, `cardWidth`, `gap`, and card index — same math the carousel already uses for `scrollLeft`. NO `getBoundingClientRect()` per frame.
4. **Vertical mode / choreography**: during GSAP animations that apply transforms, read `getBoundingClientRect()` from DOM (GSAP transforms are reflected in rects). This only runs during transitions, not steady-state.
5. **Initialization & resize**: read DOM rects once to calibrate, then use math for steady-state.
6. Update shader uniforms: `uTime`, `uScrollSpeed`, `uHover`, `uVertical`
7. Set dirty flag when: `impulseRef !== 0`, any `uHover > 0`, or `isAnimatingRef === true`. Skip `renderer.render()` when not dirty.

### Hover Detection

- `pointerenter`/`pointerleave` on each ProjectCard DOM element
- Sets `hoveredCardId` state
- WebGLCarouselLayer tweens `uHover` uniform: `gsap.to(uniform, { value: 1, duration: 0.4 })` on enter, reverse on leave

### Mode Transitions (Horizontal ↔ Vertical)

- During choreography animation: WebGL planes follow their corresponding DOM cards via position sync each frame
- In vertical mode: planes reposition as column, wave still functional on vertical scroll
- On close (reverse animation): planes follow cards back to horizontal positions
- `mode` prop tells the layer which positioning logic to use

## File Changes

### New File

**`src/components/WebGLCarouselLayer.tsx`**
- Three.js scene with orthographic camera
- `WebGLRenderer` with `alpha: true` (transparency over DOM), no `antialias` needed for textured planes
- One `PlaneGeometry` (shared) + one `ShaderMaterial` per card
- Texture loading from card image URLs
- Position sync logic (math-based in steady-state, rects during transitions)
- Hover uniform management
- Conditional render (skip if no changes)
- Per-card opacity: calls back to parent when texture loaded, parent hides corresponding DOM image
- `webglcontextlost` event listener: falls back to visible DOM images
- Cleanup on unmount (dispose textures, geometry, renderer)

### Modified Files

**`src/components/ProjectCarousel.tsx`**
- Import and render `<WebGLCarouselLayer>` inside the carousel wrapper
- Pass props: `projects` (image URLs from array directly, not from DOM attributes), `stripRef`, `scrollSpeed`, `mode`, `hoveredCardId`
- Expose scroll velocity from ticker (already computed as `impulseRef`)

**`src/components/ProjectCard.tsx`**
- Image element gets `opacity: 0` class when WebGL is active (via CSS media query or prop)
- Expose `onPointerEnter`/`onPointerLeave` for hover detection

### Texture Loading

- Image URLs come from the `projects` prop (raw Sanity CDN URLs), NOT from `next/image` optimized URLs
- Use `THREE.TextureLoader` with the raw Sanity CDN URL, appending `?w=512&fit=max&auto=format` for optimized GPU texture size
- Sanity CDN serves images with permissive CORS headers — no cross-origin issues
- DOM image stays `opacity: 1` until the corresponding WebGL texture fires `onLoad`, then fades to `opacity: 0`
- This prevents flash of no-image during texture loading

### initialSlug Auto-Open

When `ProjectCarousel` mounts with `initialSlug`, choreography fires within a few frames. The WebGL layer must handle this gracefully:
- Initialize canvas and camera immediately on mount
- Start loading textures in parallel
- During choreography (before all textures loaded): DOM images remain visible (`opacity: 1`), planes are invisible
- As each texture loads, the corresponding plane becomes visible and DOM image fades out
- No blocking — choreography runs independently of texture loading state

## Mobile Strategy

```css
@media (max-width: 768px) {
  .webgl-carousel-canvas { display: none; }
  .card-image { opacity: 1 !important; }
}
```

- Canvas not rendered on mobile (saves GPU/battery)
- DOM images visible as current behavior
- No JS overhead — component early-returns on mobile

## Performance Considerations

- **Textures**: Load once per unique image, reuse for duplicated cards (set1/set2 share textures)
- **Geometry**: Single `PlaneGeometry` instance for all planes
- **Render on demand**: Only call `renderer.render()` when scroll active, hover active, or animating
- **Pixel ratio**: Cap at `Math.min(devicePixelRatio, 2)` to avoid 3x Retina overhead
- **Dispose**: Full cleanup in useEffect return (textures, materials, geometry, renderer)

## Risks

| Risk | Mitigation |
|------|-----------|
| Position sync drift (canvas vs DOM) | Math-based positioning in steady-state; `getBoundingClientRect()` only during choreography transitions |
| Texture loading delay (flash of no-image) | Keep DOM image visible until texture `onLoad`, then fade to WebGL |
| Choreography animation sync | Planes read DOM rects during transitions (GSAP transforms reflected in rects) |
| Browser WebGL support | Fallback: if `WebGLRenderer` fails to init, keep DOM images visible |

## Testing Checklist

- [ ] Horizontal scroll: wave distortion proportional to speed
- [ ] Hover: wave intensifies smoothly on enter, fades on leave
- [ ] Stop scroll: wave decays to zero smoothly
- [ ] Click card: choreography runs, planes follow cards to vertical
- [ ] Vertical scroll: wave works on vertical axis
- [ ] Close panel: planes follow cards back to horizontal
- [ ] Mobile (< 768px): no canvas, DOM images visible
- [ ] Direct URL access (/project/[slug]): WebGL initializes correctly
- [ ] Window resize: canvas and planes reposition correctly
- [ ] Multiple hover in/out rapidly: no glitch or stuck state
