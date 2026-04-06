# Vox -- Complete Project Specification

> Generated 2026-04-04. Covers every file, component, animation, schema, and config in the codebase.

---

## 1. Project Overview

**Vox** is a portfolio/agency website for a design studio ("Vox Studio"). It showcases creative projects through an infinite horizontal carousel on the homepage, an experimental WebGL gallery page, and a resources hub for curated links and tools. Content is managed via Sanity CMS with an embedded studio at `/studio`.

The site is primarily in English with some Portuguese-language UI strings (footer, accessibility labels, resource toolbar). The locale is set to `pt-BR` on the `<html>` tag.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| React | React 19 | 19.2.3 |
| Language | TypeScript (strict) | ^5 |
| CSS | Tailwind CSS v4 | ^4 |
| Animations | GSAP | ^3.14.2 |
| 3D / WebGL | Three.js + React Three Fiber + Drei | 0.183 / 9.5 / 10.7 |
| CMS | Sanity v5 via next-sanity | ^5.18 / ^12.1 |
| UI Primitives | Radix UI | ^1.4.3 |
| Icons | Lucide React | ^0.574 |
| CSS Utilities | clsx, tailwind-merge, class-variance-authority | -- |
| Styled Components | styled-components (Sanity Studio dependency) | ^6.3 |
| Testing | Playwright | ^1.58 |
| Linting | ESLint (flat config) + Prettier | -- |
| Build | PostCSS (@tailwindcss/postcss) | -- |
| Compiler | React Compiler (babel-plugin-react-compiler) | 1.0.0 |

### Key Next.js Config (`next.config.ts`)

```ts
reactCompiler: true,
serverExternalPackages: ["styled-components", "@sanity/ui", "sanity"],
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "cdn.sanity.io" },
  ],
},
```

- React Compiler is enabled for automatic memoization.
- Sanity packages are excluded from server bundling (they rely on browser APIs / styled-components).
- Remote images allowed from Unsplash and Sanity CDN.

---

## 3. Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public (client + server) | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Public (client + server) | Sanity dataset name (e.g. `production`) |
| `SANITY_API_TOKEN` | Server only | API token for authenticated Sanity requests |
| `SANITY_WEBHOOK_SECRET` | Server only | Shared secret for Sanity webhook revalidation |

These live in `.env.local` (git-ignored).

---

## 4. File Structure

```
Vox/
  .env.local                     # Environment variables
  eslint.config.mjs              # ESLint flat config (next + prettier)
  next.config.ts                 # Next.js configuration
  package.json                   # Dependencies and scripts
  playwright.config.ts           # E2E test config
  postcss.config.mjs             # PostCSS with @tailwindcss/postcss
  sanity.config.ts               # Sanity Studio configuration
  tsconfig.json                  # TypeScript config (strict, bundler resolution)

  public/assets/                 # Static images (logos, SVGs, project covers)

  sanity/
    schemas/
      index.ts                   # Schema barrel export
      project.ts                 # Project document schema
      resourceItem.ts            # ResourceItem document schema
    seeds/
      resource-items.ndjson      # Seed data for resources

  src/
    app/
      globals.css                # Tailwind import, CSS variables, base styles
      layout.tsx                 # Root layout (fonts, metadata)
      page.tsx                   # Home page (SSR, fetches projects)

      gallery/
        page.tsx                 # Gallery page (SSR, fetches projects)
        GalleryClient.tsx        # Client: WebGL gallery + selection overlay

      project/[slug]/
        page.tsx                 # Project detail page (SSR, validates slug)
        ProjectPageClient.tsx    # Client: renders HomeLayout with initialSlug

      resources/
        page.tsx                 # Resources page (SSR, fetches resources)

      studio/[[...tool]]/
        page.tsx                 # Sanity Studio (catch-all route, force-dynamic)

      api/
        project/[slug]/route.ts  # GET single project (full detail)
        revalidate/route.ts      # POST webhook for ISR revalidation

    components/
      Nav.tsx                    # Navigation bar with contact panel
      Footer.tsx                 # Footer with divider and tagline
      HomeLayout.tsx             # Home shell: Nav + Carousel + Footer
      ProjectCard.tsx            # Single project card (image + title)
      ProjectCarousel.tsx        # Infinite carousel + vertical mode + detail panel
      ProjectDetailPanel.tsx     # Slide-in project detail panel
      WebGLGallery.tsx           # Fullscreen WebGL shader gallery
      StudioClient.tsx           # Client wrapper for Sanity Studio

      resources/
        ResourceCard.tsx         # Single resource card
        ResourcesGrid.tsx        # Filterable resource grid
        ResourcesHero.tsx        # Resources page hero section
        ResourcesToolbar.tsx     # Search + filter controls

    lib/
      sanity.ts                  # Sanity client factory
      queries.ts                 # GROQ queries
      carouselConfig.ts          # Carousel physics/dimensions config
      utils.ts                   # cn() utility (clsx + twMerge)

    types/
      project.ts                 # Project, ProjectListItem, ContentBlock, etc.
      resource.ts                # ResourceItem, ResourceType, ResourceStatus
```

---

## 5. Routing

| Route | Type | Description |
|---|---|---|
| `/` | SSR (ISR 60s) | Homepage with infinite project carousel |
| `/project/[slug]` | SSR (ISR 60s) | Project detail -- same UI as home but opens carousel in vertical mode with detail panel |
| `/gallery` | SSR (ISR 60s) | WebGL shader-based infinite gallery |
| `/resources` | SSR (ISR 60s) | Resource hub with search/filter |
| `/studio` | Dynamic (no cache) | Embedded Sanity Studio |
| `/api/project/[slug]` | API Route (ISR 60s) | Returns full project JSON for lazy-loading detail content |
| `/api/revalidate` | API Route | POST endpoint for Sanity webhook to trigger on-demand ISR |

### ISR Strategy

All content pages use `export const revalidate = 60` for 60-second incremental static regeneration. The `/api/revalidate` endpoint allows Sanity webhooks to trigger immediate revalidation of `/` when content changes (protected by `SANITY_WEBHOOK_SECRET`).

---

## 6. Data Model

### 6.1 Sanity Schemas

#### `project` Document

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Project title |
| `slug` | slug | Yes | URL-safe identifier, sourced from `name` |
| `order` | number | Yes | Display order in carousel (ascending, use 10/20/30 spacing) |
| `image` | image (hotspot) | Yes | Cover image |
| `description` | text | No | Project description |
| `year` | string | No | Year of completion |
| `category` | string | No | Free-text category |
| `discipline` | string (list) | No | One of: Branding, Website, UI Design, Motion, Print, 3D |
| `client` | string | No | Client name |
| `tags` | array of string | No | Tags |
| `role` | array of string | No | Roles performed |
| `content` | array of blocks | No | Rich content (see Content Blocks below) |
| `credits` | array of {role, name} | No | Credits list |
| `relatedProjects` | array of references | No | Max 4 related project references |
| `liveUrl` | url | No | Live website URL |
| `externalUrl` | url | No | External portfolio link (Behance, Dribbble, etc.) |

**Content Block Types:**

| Block Type | Fields |
|---|---|
| `imageBlock` | `image` (required, hotspot), `orientation` (horizontal/vertical, default horizontal), `caption` |
| `imagePair` | `imageLeft` (required, hotspot), `imageRight` (required, hotspot), `caption` |
| `videoBlock` | `video` (required, file, video/*), `caption` |
| `gifBlock` | `gif` (required, file, image/gif), `caption` |
| `textBlock` | `text` (required, text) |

#### `resourceItem` Document

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | 2-90 chars |
| `slug` | slug | Yes | From title |
| `description` | text (3 rows) | No | Max 200 chars |
| `url` | url | Yes | http/https only |
| `category` | string | Yes | Free-text (e.g. Docs, Ferramentas, Templates, Guias) |
| `type` | string (radio) | Yes | quick_link / guide / tool / template / support (default: quick_link) |
| `featured` | boolean | No | Default false |
| `tags` | array of string (tags layout) | No | |
| `icon` | image (hotspot) | No | |
| `order` | number | Yes | Integer >= 0, ascending |
| `status` | string (radio) | Yes | active / draft (default: active) |

### 6.2 TypeScript Types

**`src/types/project.ts`:**

```ts
type ContentBlock =
  | { _type: "imageBlock"; _key: string; url: string; orientation: "horizontal" | "vertical"; caption?: string }
  | { _type: "imagePair"; _key: string; leftUrl: string; rightUrl: string; caption?: string }
  | { _type: "videoBlock"; _key: string; url: string; caption?: string }
  | { _type: "gifBlock"; _key: string; url: string; caption?: string }
  | { _type: "textBlock"; _key: string; text: string };

interface CreditItem { _key: string; role: string; name: string; }
interface RelatedProject { id: string; name: string; image: string; category: string; }

interface ProjectDetail {
  description: string; year: string; category: string;
  discipline?: string; client?: string; tags: string[];
  role: string[]; content: ContentBlock[]; credits: CreditItem[];
  relatedProjects: RelatedProject[];
  liveUrl?: string; externalUrl?: string;
}

interface Project { id: string; name: string; image: string; detail: ProjectDetail; }

// Lightweight version for carousel (no content blocks):
interface ProjectListItem {
  id: string; name: string; image: string;
  detail: { category?: string; discipline?: string; };
}
```

**`src/types/resource.ts`:**

```ts
type ResourceType = "quick_link" | "guide" | "tool" | "template" | "support";
type ResourceStatus = "active" | "draft";

interface ResourceItem {
  id: string; title: string; slug: string; description?: string;
  url: string; category: string; type: ResourceType; featured: boolean;
  tags: string[]; icon?: string; order: number; status: ResourceStatus;
}
```

### 6.3 GROQ Queries

| Export | Purpose |
|---|---|
| `projectsListQuery` | Light query for carousel cards -- only `id`, `name`, `image`, `detail.category`, `detail.discipline`. Ordered by `order asc`. |
| `projectBySlugQuery` | Full single-project query with all content blocks, credits, related projects. Takes `$slug` parameter. |
| `projectsQuery` | Legacy full query for all projects (used by gallery page). |
| `resourcesQuery` | All active resources ordered by `order asc`. |

---

## 7. Sanity Client (`src/lib/sanity.ts`)

```ts
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",  // CDN in prod, API in dev
});
```

---

## 8. Components

### 8.1 Root Layout (`src/app/layout.tsx`)

- Loads **Geist** and **Geist Mono** fonts from Google Fonts.
- Sets CSS variables `--font-geist-sans` and `--font-geist-mono`.
- Applies `antialiased` class.
- Language: `pt-BR`.
- Metadata: `{ title: "Vox", description: "Vox" }`.

### 8.2 Nav (`src/components/Nav.tsx`)

**Client component.**

| Prop | Type | Default | Description |
|---|---|---|---|
| `compact` | boolean | `false` | When true, logo scales to 72% and tagline/connect button fade out |
| `onLogoClick` | () => void | undefined | Callback when logo is clicked |

**State:**
- `contactOpen: boolean` -- toggles the contact dropdown panel.

**Behavior:**
- Logo is `/assets/vox-logo.svg` (69x16), scales via CSS transform (duration 500ms, ease-out).
- Contact panel appears below the CONNECT button (240x165px, rounded, backdrop-blur 60px, bg black/6%).
- Panel opens on click, closes on `onMouseLeave` of the container.
- The `+` icon rotates 45 degrees to become an `x` when open.
- Contact info: WhatsApp, Email (hello@voxteller.com), Instagram, LinkedIn.
- Tagline visible only on `md+`: "Design partner for founders and investors."

### 8.3 Footer (`src/components/Footer.tsx`)

**Server component.**

- Divider: SVG image (`/assets/divider-line.svg`) spanning full width.
- Two text blocks: copyright "2026" and agency tagline.
- Responsive: stacks vertically on mobile, horizontal row on `md+`.

### 8.4 HomeLayout (`src/components/HomeLayout.tsx`)

**Client component.** The main shell for `/` and `/project/[slug]`.

| Prop | Type | Description |
|---|---|---|
| `projects` | ProjectListItem[] | List of projects for carousel |
| `initialSlug` | string? | If present, auto-opens that project's detail panel on mount |

**State:**
- `detailOpen: boolean` -- tracks whether the detail panel is visible.
- `closeHandlerRef: Ref<() => void>` -- stores the close function registered by ProjectCarousel.

**Behavior:**
- Full viewport height (`h-screen`), flex column, overflow hidden.
- Nav receives `compact={detailOpen}` to shrink when panel is open.
- Footer fades out (`opacity-0`, `pointer-events-none`) when detail panel is open.
- `goHome()` callback: calls carousel close handler, sets `detailOpen = false`, pushes `/` to history.

### 8.5 ProjectCard (`src/components/ProjectCard.tsx`)

**Client component.**

| Prop | Type | Description |
|---|---|---|
| `project` | Project or ProjectListItem | Project data |

**Behavior:**
- Fixed dimensions via CSS variables: `var(--pc-w)` width, `var(--pc-h)` height.
- Attribute `data-project-id={project.id}` used for DOM queries by the carousel.
- Hover effect: title row translates up 8px, gains subtle background and padding.
- Title font-size transition: 450ms ease-out (animated externally by carousel when entering vertical mode).
- Image fills the card via `object-cover`, border-radius from `carouselConfig.radius` (4px).

### 8.6 ProjectCarousel (`src/components/ProjectCarousel.tsx`)

**Client component.** The core interactive element of the site.

| Prop | Type | Description |
|---|---|---|
| `projects` | ProjectListItem[] | Projects to display |
| `initialSlug` | string? | Auto-open this project on mount |
| `onDetailOpen` | () => void | Called when detail panel opens |
| `onDetailClose` | () => void | Called when detail panel closes |
| `onRegisterCloseHandler` | (handler) => void | Registers the close function with parent |

**State:**
- `selectedProject: Project | null` -- the project currently shown in detail panel.
- `panelVisible: boolean` -- controls panel slide-in animation.

**Refs (physics engine):**
- `posRef: { target, current }` -- scroll position (smoothed).
- `impulseRef` -- accumulated velocity from wheel/drag.
- `dragRef` -- pointer drag tracking state.
- `modeRef: "horizontal" | "vertical"` -- current carousel mode.
- `vStateRef` -- vertical mode layout state (card positions, scales, step sizes).
- `wheelAccumRef` -- wheel delta accumulator for discrete vertical snapping.

**Two Modes:**

#### Horizontal Mode (Default)
- Infinite loop: DOM contains two identical sets of cards side by side.
- Scroll position wraps via modulo: `strip.scrollLeft = ((pos.current % setWidth) + setWidth) % setWidth`.
- Physics: 60fps GSAP ticker, impulse-based with exponential friction (0.98^dt per frame).
- Smooth interpolation: `pos.current += (pos.target - pos.current) * ease` where `ease = 1 - smooth^dt`.
- Wheel input: `impulseRef -= deltaY * 0.038`.
- Drag: pointer capture, sensitivity 0.5, fling momentum 280.
- Tap threshold: 6px -- below this, click opens the project instead of dragging.

#### Vertical Mode (After Card Click)
- Triggered by `runChoreography(clickedEl)`.
- All N projects arranged in a vertical column on the left side of the viewport.
- Three-tier scale system: center (0.48), adjacent +/-1 (0.38), others (0.26).
- Three-tier Y-spacing for uniform 32px gaps between scaled cards.
- Infinite vertical loop: slot offsets wrap via modulo.
- Wheel accumulation threshold: 40px triggers discrete snap to next/prev card.
- Active card (center, `|slotOff| < 0.5`) gets hover-active styling.
- Clicking a card in vertical mode scrolls it to center and opens its detail.

**Lazy Detail Loading:**
When a project is selected:
1. A skeleton `Project` object is created immediately (with empty detail).
2. `setPanelVisible(true)` triggers the slide-in animation.
3. `fetch(/api/project/{id})` loads the full content in the background.
4. `setSelectedProject(fullProject)` updates the panel once data arrives.

### 8.7 Animation System (GSAP)

The `runChoreography` function orchestrates the horizontal-to-vertical transition:

#### Forward Animation (Open)

| Phase | Start | Duration | Ease | Description |
|---|---|---|---|---|
| Y + scale | 0s | 0.9s | `expo.out` | Cards move vertically to their column slot positions and scale down |
| X slide | 0.35s | 0.95s | `expo.out` | Cards slide horizontally left to the column (x = 96 + centerCardWidth/2) |
| Detail panel open | 0.85s | -- | -- | `openDetailForProject()` called via `tl.call()` |
| Duplicate fade | 0.9s (delay) | 0.4s | `power2.out` | Non-canonical duplicate cards fade to opacity 0 |

**Preparation steps (instant):**
- Title font-size set to 22px immediately (CSS transition runs in parallel at 450ms).
- Strip overflow set to `visible` (allows cards to move outside scroll container).
- ScrollLeft baked into inner divs as `translateX(-scrollLeft)`.
- Each card gets `zIndex` (clicked = 100, others = 80 - distance).

**Vertical Layout Math:**
- Column X position: `96 + centerCardWidth / 2` (left-aligned column).
- Center Y: `window.innerHeight / 2 - stripRect.top` (viewport-centered).
- Step sizes (three-tier):
  - `step01 = centerHeight/2 + 32 + adjacentHeight/2` (center to +/-1)
  - `step12 = adjacentHeight/2 + 32 + otherHeight/2` (+/-1 to +/-2)
  - `stepOther = otherHeight + 32` (+/-2 to +/-3, etc.)

#### Reverse Animation (Close)

| Phase | Start | Duration | Ease | Description |
|---|---|---|---|---|
| Cards return | 0s | 0.85s | `expo.out` | All cards animate to `{x: targetXDelta, y: 0, scale: 1}` |
| Duplicates fade in | 0.25s (delay) | 0.55s | `power2.out` | Non-canonical cards return to opacity 1 |

**Cleanup (after reverse completes):**
- Clear all GSAP transforms.
- Restore strip overflow.
- Reset inner div translations.
- Compute new `scrollLeft` that centers the last-active card.
- Switch mode back to horizontal.

### 8.8 ProjectDetailPanel (`src/components/ProjectDetailPanel.tsx`)

**Client component.**

| Prop | Type | Description |
|---|---|---|
| `project` | Project | Full project data |
| `visible` | boolean | Controls slide-in/out |
| `onClose` | () => void | Close callback |

**Behavior:**
- Fixed position, covers right portion of viewport.
- Left offset: `22vw` on `md`, capped at `440px` on `xl`.
- Slide transition: `translate-x-full` (hidden) to `translate-x-0` (visible), 500ms ease-out.
- Close button: positioned outside panel on desktop (left of panel edge), inside on mobile.
- Escape key closes the panel.
- Scrollable content area with `data-scrollable-panel` attribute (prevents wheel events from bubbling to carousel).

**Content Sections:**
1. **Header**: Project name (24-30px) + description + metadata (Type, Credits, Live Site button).
2. **Content blocks**: Renders `ContentBlock[]` via `renderBlock()`:
   - `imageBlock` horizontal: aspect 1420/770
   - `imageBlock` vertical: aspect 720/1020
   - `imagePair`: 2-column grid, aspect 700/400 each
   - `videoBlock`: aspect 1420/799, native controls
   - `gifBlock`: raw `<img>` tag
   - `textBlock`: paragraph, max-width 44rem
3. **Footer**: Copyright + tagline (duplicated from main footer).

**Mock Fallbacks:** When Sanity data is missing, the panel shows placeholder text and empty gray content blocks.

### 8.9 WebGLGallery (`src/components/WebGLGallery.tsx`)

**Client component.** A fullscreen WebGL shader gallery.

| Prop | Type | Description |
|---|---|---|
| `projects` | Project[] | Projects with images |
| `onSelect` | (project) => void | Called when a card is clicked |

**Architecture:**
- All rendering happens in a single GLSL fragment shader on a fullscreen quad (no 3D geometry).
- Project images are packed into a **texture atlas** (CPU-side canvas, 512px cells).
- Atlas layout: `ceil(sqrt(N))` columns, `ceil(N/cols)` rows.

**Shader Features:**
- **Infinite tiling**: world-space X coordinates tile infinitely via `floor(worldX / stride)`.
- **Feistel cipher permutation**: maps sequential cell indices to shuffled atlas indices for uniform image distribution.
- **Barrel distortion**: horizontal-heavy distortion that ramps with drag/scroll velocity (max 0.3).
- **Vignette**: subtle edge darkening inside each card.
- **Background**: `#fafaf8` (near-white warm tone).

**Interaction:**
- Horizontal drag (pointer capture) and wheel scroll.
- Velocity decay: 0.92 per frame.
- Barrel distortion smoothly interpolates toward `min(speed/120, 0.3)` at rate 0.2.
- Click detection: replicates the shader's Feistel cipher in JavaScript to determine which project was clicked.
- Canvas runs in `demand` frame loop (only renders when invalidated).

**Card Dimensions (fixed in shader):** 446x601px, 12px gap.

### 8.10 GalleryClient (`src/app/gallery/GalleryClient.tsx`)

**Client component.** Wraps WebGLGallery with a top bar and selection overlay.

**State:**
- `selected: Project | null` -- the project shown in the overlay.

**Overlay:**
- Centered modal on dark backdrop (black/60%, backdrop-blur).
- Grid layout: image (3fr) + info (2fr).
- Shows: name, description, discipline/category, live site link.
- Click outside or X button to dismiss.

### 8.11 StudioClient (`src/components/StudioClient.tsx`)

**Client component.** Simply renders `<NextStudio config={config} />`.

### 8.12 Resource Components

#### ResourcesHero (`src/components/resources/ResourcesHero.tsx`)

**Server component.** Hero section with:
- Title: "Everything you need to move faster."
- Description paragraph.
- Featured action card linking to `/studio`.

#### ResourcesToolbar (`src/components/resources/ResourcesToolbar.tsx`)

**Client component.**

| Prop | Type | Description |
|---|---|---|
| `search` | string | Current search text |
| `selectedCategory` | string | "all" or specific category |
| `selectedType` | string | "all" or specific type |
| `categories` | string[] | Available categories |
| `types` | ResourceType[] | Available types |
| `onSearchChange` | (string) => void | Search input handler |
| `onCategoryChange` | (string) => void | Category select handler |
| `onTypeChange` | (string) => void | Type select handler |

3-column grid on `md+`: search input, category dropdown, type dropdown.

#### ResourcesGrid (`src/components/resources/ResourcesGrid.tsx`)

**Client component.**

| Prop | Type | Description |
|---|---|---|
| `resources` | ResourceItem[] | All active resources |

**State:**
- `search`, `selectedCategory`, `selectedType` -- filter state.

**Filtering:**
- Derives unique categories and types from data via `useMemo`.
- Filters by category, type, and full-text search (title + description + category + type + tags).
- Empty state shows Portuguese message with context-aware hint.

**Grid:** responsive -- 1 col default, 2 on `sm`, 3 on `xl`.

#### ResourceCard (`src/components/resources/ResourceCard.tsx`)

**Server component.**

| Prop | Type | Description |
|---|---|---|
| `resource` | ResourceItem | Resource data |

**Layout:**
- Category label + featured badge ("Destaque").
- Title (20px, semibold).
- Description.
- Bottom bar: icon + type label | "Abrir ->" link.
- Border card with hover effect (border darkens).

---

## 9. API Routes

### `GET /api/project/[slug]`

Returns the full `Project` object for a given slug. Uses `projectBySlugQuery` with the slug parameter. Returns 404 if not found, 500 on error. ISR: 60s.

### `POST /api/revalidate`

Sanity webhook endpoint. Validates `x-webhook-secret` header against `SANITY_WEBHOOK_SECRET`. On success, calls `revalidatePath("/")` and returns `{ revalidated: true, timestamp }`.

---

## 10. Carousel Configuration (`src/lib/carouselConfig.ts`)

```ts
const carouselConfig = {
  wheel: 0.038,           // Wheel sensitivity multiplier
  smooth: 0.025,          // Smoothing factor (lower = smoother/laggier)
  autoSpeed: 30,          // Auto-scroll speed in px/s (currently unused)
  drag: true,             // Enable pointer drag
  dragSensitivity: 0.5,   // Drag multiplier
  fling: 280,             // Momentum multiplier after drag release
  tapThreshold: 6,        // Max px movement to count as tap (not drag)
  cardWidth: 446,         // Card width in px
  cardHeight: 601,        // Card height in px (~3:4 ratio, exactly 446:601)
  gap: 12,                // Gap between cards in px
  radius: 4,              // Card image border-radius in px
  falloff: 2.5,           // Scale/opacity falloff for distant cards (unused)
  vAlign: "Center",       // Vertical alignment: "Center" | "Top" | "Bottom"
};
```

---

## 11. CSS System

### 11.1 Globals (`src/app/globals.css`)

**Tailwind v4 syntax** with `@theme inline` directive:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### 11.2 CSS Variables

| Variable | Default (>=1280px) | 1024-1279px | 768-1023px | 480-767px | <480px |
|---|---|---|---|---|---|
| `--background` | `#fdfdfc` | -- | -- | -- | -- |
| `--foreground` | `#000000` | -- | -- | -- | -- |
| `--pc-w` | `446px` | `330px` | `330px` | `260px` | `220px` |
| `--pc-h` | `601px` | `445px` | `445px` | `350px` | `296px` |

The `--pc-w` / `--pc-h` variables maintain the **446:601 aspect ratio** across all breakpoints.

### 11.3 Responsive Breakpoints

Breakpoints follow Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Custom media queries for card sizing:
- `max-width: 1279px` -- medium cards (330x445)
- `max-width: 767px` -- small cards (260x350)
- `max-width: 479px` -- extra-small cards (220x296)

### 11.4 Custom Utilities

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

### 11.5 Color Palette (from component analysis)

| Token | Value | Usage |
|---|---|---|
| Page background | `#fdfdfc` | Main background |
| Panel background | `#f7f6f3` | Detail panel, gallery overlay |
| Gallery background | `#fafaf8` | WebGL gallery canvas bg |
| Text primary | `#2d2f2f` | Panel headings, metadata values |
| Text secondary | `black/60`, `black/45` | Descriptions, footer, labels |
| Meta labels | `black/38` | Uppercase metadata labels |
| Media placeholder | `#2d2d2d` | Empty content block backgrounds |
| Active card bg | `rgba(31,43,57,0.03)` | Card title row hover/active state |
| Button bg | `#efefef` | Close button, Live Site button |

---

## 12. Fonts

| Font | Variable | Usage |
|---|---|---|
| Geist (Google Fonts) | `--font-geist-sans` | Primary sans-serif |
| Geist Mono (Google Fonts) | `--font-geist-mono` | Monospace (available but unused in UI) |

---

## 13. Data Flow

### Homepage Flow

```
1. Server: page.tsx fetches ProjectListItem[] via projectsListQuery
2. Server: renders HomeLayout (client component) with projects
3. Client: HomeLayout renders Nav + ProjectCarousel + Footer
4. Client: ProjectCarousel renders infinite horizontal strip with ProjectCard components
5. Client: GSAP ticker drives 60fps physics loop for smooth scrolling
6. User clicks card:
   a. runChoreography() animates cards from horizontal to vertical column
   b. Skeleton Project created immediately, panel slides in
   c. fetch(/api/project/{slug}) loads full content in background
   d. Panel updates with full content when API responds
7. User clicks close or Escape:
   a. Panel slides out
   b. Reverse animation returns cards to horizontal positions
   c. Duplicate card set restored, scroll position recalculated
```

### Gallery Flow

```
1. Server: page.tsx fetches full Project[] via projectsQuery
2. Client: GalleryClient builds texture atlas from all project images
3. Client: WebGL shader renders infinite tiled gallery on fullscreen quad
4. User clicks: Feistel cipher maps screen position to project index
5. Selection overlay appears with project info
```

### Resources Flow

```
1. Server: page.tsx fetches ResourceItem[] via resourcesQuery
2. Server: renders Nav + ResourcesHero + ResourcesGrid + Footer
3. Client: ResourcesGrid manages filter state (search, category, type)
4. Client: Filtering runs in useMemo on every state change
```

---

## 14. URL/History Management

The carousel uses `window.history.pushState` (not Next.js router) for URL updates:
- Opening a project: pushes `/project/{id}`.
- Closing a project: pushes `/`.

This means browser back/forward buttons work, and direct URL access to `/project/[slug]` is supported (the server-rendered page validates the slug and passes `initialSlug` to trigger auto-open).

---

## 15. Deployment

### Scripts

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` |
| `format:check` | `prettier --check "src/**/*.{ts,tsx,css}"` |

### Requirements

- Node.js (compatible with Next.js 16)
- The four environment variables listed in Section 3
- Sanity project with `project` and `resourceItem` schemas deployed
- Sanity webhook configured to POST to `/api/revalidate` with the webhook secret

### Static Assets

All static assets live in `public/assets/`:
- `vox-logo.svg` -- main logo
- `divider-line.svg` -- footer divider
- Various project cover images (used as fallbacks/placeholders)
- SVG vector elements for decorative use

### Image Optimization

Next.js `<Image>` is used throughout with:
- `fill` layout for cover images
- `sizes` prop specified for responsive loading
- Remote patterns configured for `cdn.sanity.io` and `images.unsplash.com`
- `priority` flag on the logo image

---

## 16. Testing

Playwright is configured for E2E testing (`playwright.config.ts`). A basic example test exists at `tests/example.spec.ts`.

---

## 17. Sanity Studio

Embedded at `/studio` via a catch-all route `[[...tool]]`. Configuration:

- Workspace name: `default`
- Title: `Vox Studio`
- Base path: `/studio`
- Plugin: `structureTool` (default document structure)
- Schemas: `project`, `resourceItem`

The studio page uses `"use no memo"` directive (disables React Compiler for Sanity Studio compatibility) and `force-dynamic` rendering.

---

## 18. Performance Considerations

1. **React Compiler** enabled globally for automatic memoization.
2. **ISR (60s)** on all content pages reduces server load.
3. **Lazy detail loading**: carousel cards use lightweight `ProjectListItem` (no content blocks); full data loaded on demand via API route.
4. **WebGL gallery** uses `demand` frame loop (no continuous rendering when idle).
5. **Texture atlas**: single draw call for all project images in gallery.
6. **GSAP quickSetter**: used for high-frequency updates in vertical mode tick loop (avoids object allocation).
7. **Infinite scroll via DOM duplication**: two identical card sets avoid expensive DOM manipulation.
