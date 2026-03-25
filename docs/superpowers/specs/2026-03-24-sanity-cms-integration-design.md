
# Sanity CMS Integration — Design Spec

**Date:** 2026-03-24
**Project:** Vox (Next.js portfolio)
**Status:** Approved

---

## Overview

Replace the hardcoded `projects.ts` data source with Sanity as a headless CMS. Projects and images will be managed via Sanity Studio (embedded in the Next.js app via `next-sanity`). The Next.js app fetches data from Sanity's API using GROQ queries. Hosting via Vercel (free tier) with the Hostinger domain pointed via CNAME.

---

## Architecture

```
Sanity Studio (/studio route in Next.js)
      ↓  on publish → webhook (with secret)
   /api/revalidate route (validates secret, calls revalidatePath)
      ↓  ISR cache cleared (fallback: 60s revalidate if webhook unavailable)
Next.js Server Component fetches via GROQ
      ↓  passes projects as props
GSAP Carousel (Client Component)
      ↓
   User sees updated content
```

**Services:**
- **Sanity** — content store, image CDN, embedded Studio at `/studio`
- **Vercel** — Next.js hosting with ISR, env var management
- **Hostinger** — domain only, CNAME → Vercel

---

## Sanity Schema

Schema name: `project`. All fields are **flat** on the document root — there is no nested `detail` object in the schema.

| Field        | Type            | Notes                                          |
|--------------|-----------------|------------------------------------------------|
| name         | string          | Display name (e.g. "SPA & WELLNESS")           |
| slug         | slug            | Unique identifier (e.g. `spa`)                 |
| image        | image           | Cover image (Sanity CDN)                       |
| description  | text            |                                                |
| year         | string          | e.g. "2024"                                    |
| category     | string          | e.g. "Branding"                                |
| client       | string          | Optional                                       |
| tags         | array of string |                                                |
| role         | array of string |                                                |
| gallery      | array of image  | Additional project images                      |
| externalUrl  | url             | Optional external link                         |
| order        | number          | Controls display order in carousel (ascending) |

---

## Component Architecture Change

`page.tsx` is currently a Client Component (`"use client"`) and must remain partially client-side because it owns all GSAP carousel logic. The following split is required:

**`app/page.tsx`** — becomes a **Server Component**. Fetches projects from Sanity, exports `revalidate = 60` (60s ISR as fallback when webhook is unavailable). Passes projects as props to `<ProjectCarousel>`.

**`components/ProjectCarousel.tsx`** — **new Client Component** (`"use client"`). Contains all GSAP logic from the current `page.tsx`: `useRef`, `useEffect`, `gsap.ticker`, `ResizeObserver`, pointer/wheel event handlers. Receives `projects: Project[]` as props.

```
page.tsx (Server Component)
  └── <ProjectCarousel projects={projects} />  ← Client Component
        └── <ProjectCard />
        └── <ProjectDetailPanel />
```

**Empty state:** If Sanity returns zero projects (e.g. on first deploy before content is added), `ProjectCarousel` renders a centered fallback message: "No projects yet."

---

## Inline Edit Feature — Intentional Removal

The current `ProjectDetailPanel` contains an inline edit mode with draft state, field-level inputs, Save/Cancel buttons, and `localStorage` persistence (`saveProject` callback in `page.tsx`). **This feature is intentionally removed in its entirety.** Sanity Studio is the sole editing interface going forward. The following are deleted:

- `saveProject` callback and `projectList` state in `page.tsx`
- `localStorage` read in `useState` initializer
- `onSave` prop on `ProjectDetailPanel`
- All edit/draft/save state and UI inside `ProjectDetailPanel`

---

## GROQ Query

All fields are flat in the schema. The GROQ query manually projects them into the nested `detail` shape expected by existing components, preserving the current `Project` TypeScript interface:

```groq
*[_type == "project"] | order(order asc) {
  "id": slug.current,
  name,
  "image": image.asset->url,
  "detail": {
    "description": description,
    "year": year,
    "category": category,
    "client": client,
    "tags": tags,
    "role": role,
    "gallery": gallery[].asset->url,
    "externalUrl": externalUrl
  }
}
```

- `slug.current` is projected as `"id"` (flat string) to match the existing `data-project-id` and `projectsRef` usage in carousel logic.
- All image fields are projected to plain CDN URL strings via `asset->url`, so `ProjectCard` and `ProjectDetailPanel` can use `<Image src={url} />` directly with no additional transformation library.

---

## Code Changes

### Install packages
```bash
npm install next-sanity
```

(`@sanity/image-url` is **not** needed — images are resolved to plain URL strings via GROQ projection.)

### Remove
- `src/lib/projects.ts` — hardcoded data and `Project` interface

### Add
- `src/lib/sanity.ts` — Sanity client config via `createClient` from `next-sanity`, with `apiVersion: '2024-01-01'`, `projectId`, `dataset: 'production'`, `useCdn: true`
- `src/lib/queries.ts` — GROQ queries (see above)
- `src/types/project.ts` — TypeScript `Project` type with all image fields as `string` (post-projection)
- `src/components/ProjectCarousel.tsx` — Client Component, all carousel logic extracted from `page.tsx`
- `sanity.config.ts` — Sanity Studio config (root-level, used by embedded Studio)
- `sanity/schemas/project.ts` — flat schema definition
- `src/app/studio/[[...tool]]/page.tsx` — Studio route (inside `src/app/` to match the existing App Router root)
- `src/app/api/revalidate/route.ts` — revalidation webhook handler

### Modify
- `src/app/page.tsx` — remove `"use client"`, remove all carousel/localStorage/saveProject logic, fetch projects from Sanity, export `revalidate = 60`, render `<ProjectCarousel projects={projects} />`. **Must happen in the same pass as the `onSave` removal from `ProjectDetailPanel`** to avoid a TypeScript build error (`onSave={saveProject}` call on line 233 and the prop in the interface must be removed together).
- `src/components/ProjectDetailPanel.tsx` — remove `onSave` prop from interface (line 12), remove all edit/draft/save state and UI; **update import from `@/lib/projects` → `@/types/project`**. Note: `ProjectDetail` is also imported by name and must be exported from the new types file.
- `src/components/ProjectCard.tsx` — **update import from `@/lib/projects` → `@/types/project`**. Must be done before or at the same time as `projects.ts` is deleted.
- `next.config.ts` — add `cdn.sanity.io` to `images.remotePatterns`

> **Important:** `src/types/project.ts` must export both `Project` and `ProjectDetail` since both are currently imported by name from `@/lib/projects` in existing components. Delete `src/lib/projects.ts` only after all import paths are updated.

### Environment variables (`.env.local`)
```
NEXT_PUBLIC_SANITY_PROJECT_ID=   # safe to expose — used by Studio in the browser
NEXT_PUBLIC_SANITY_DATASET=production   # safe to expose — not sensitive
SANITY_API_TOKEN=                # server-only — never use NEXT_PUBLIC_ prefix
SANITY_WEBHOOK_SECRET=           # server-only — never use NEXT_PUBLIC_ prefix
```

`NEXT_PUBLIC_` prefix on project ID and dataset is intentional and correct. These values are needed by the embedded Studio which runs in the browser. Security is enforced via Sanity CORS settings and token permissions, not by hiding the project ID.

---

## Revalidation Webhook (`/api/revalidate`)

```
POST /api/revalidate
Header: x-webhook-secret: <SANITY_WEBHOOK_SECRET>
→ 200 OK + revalidatePath('/')
→ 401 if secret mismatch
```

`SANITY_WEBHOOK_SECRET` is a random string configured in both Vercel env vars and the Sanity webhook dashboard. The `revalidate = 60` export on `page.tsx` acts as an automatic fallback — if the webhook fails, the page self-heals within 60 seconds.

---

## Deployment Steps

1. `npm install next-sanity`
2. `npx sanity@latest init` in repo root — select dataset `production`
3. Define schema, then add all 11 existing projects via Studio, uploading images from `/public/assets/project-*.png`
4. Create GitHub repository and push code
5. Import repo into Vercel; set all four environment variables
6. In Sanity dashboard → API → CORS origins: add the Vercel deployment URL and custom domain
7. In Sanity dashboard → API → Webhooks: point to `https://<vercel-domain>/api/revalidate`, set secret matching `SANITY_WEBHOOK_SECRET`
8. Verify: edit a project in Studio, confirm the live site updates within 60s
9. In Hostinger DNS: add CNAME record pointing domain → `cname.vercel-dns.com`
10. After confirming all project images are live via Sanity CDN, delete only `project-*.png` files from `/public/assets/` (other assets in that folder are used by the UI and must be kept)

---

## What Is NOT Changing

- Visual design, carousel behavior, GSAP animations
- `ProjectCard` and `ProjectDetailPanel` read-only UI
- All existing styles, layout, and components not listed above

---

## Success Criteria

- Editing a project in Sanity Studio updates the live site within 60 seconds (or instantly via webhook)
- Images served via Sanity CDN; `project-*.png` files removed from `/public/assets/`
- No hardcoded project data in the codebase
- Project display order controllable via `order` field in Sanity Studio
- Empty state renders gracefully if no projects are published
- Site accessible via custom Hostinger domain on Vercel
