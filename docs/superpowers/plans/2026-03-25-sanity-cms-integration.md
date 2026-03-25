# Sanity CMS Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `projects.ts` with Sanity as a headless CMS, deploy on Vercel, point Hostinger domain via CNAME.

**Architecture:** Next.js `page.tsx` becomes a Server Component that fetches projects from Sanity via GROQ and passes them as props to a new `ProjectCarousel` Client Component that owns all GSAP logic. Sanity Studio is embedded at `/studio`. ISR revalidates every 60s with an on-demand webhook for instant updates.

**Tech Stack:** Next.js 16 (App Router), Sanity, next-sanity, TypeScript, Vercel, Hostinger DNS

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/types/project.ts` | Create | `Project` and `ProjectDetail` TypeScript interfaces (images as `string`) |
| `src/lib/sanity.ts` | Create | Sanity client configured for server-side fetching |
| `src/lib/queries.ts` | Create | GROQ query that fetches and shapes project data |
| `sanity/schemas/project.ts` | Create | Sanity document schema (flat fields) |
| `sanity.config.ts` | Create | Studio configuration used by the embedded `/studio` route |
| `src/app/studio/[[...tool]]/page.tsx` | Create | Embedded Sanity Studio route |
| `src/app/api/revalidate/route.ts` | Create | Webhook handler: validates secret, calls `revalidatePath('/')` |
| `src/components/ProjectCarousel.tsx` | Create | Client Component with all GSAP carousel + panel logic (extracted from `page.tsx`) |
| `src/app/page.tsx` | Rewrite | Server Component: fetches projects, renders layout + `<ProjectCarousel>` |
| `src/components/ProjectDetailPanel.tsx` | Rewrite | Read-only panel (removes all edit/draft/save UI and `onSave` prop) |
| `src/components/ProjectCard.tsx` | Modify | Update import path from `@/lib/projects` → `@/types/project` |
| `next.config.ts` | Modify | Add `cdn.sanity.io` to `images.remotePatterns` |
| `src/lib/projects.ts` | Delete | After all imports are migrated |
| `.env.local` | Create | Sanity env vars (never commit this file) |

---

## Chunk 1: Sanity Setup

### Task 1: Create a Sanity project and get credentials

- [ ] **Step 1: Create Sanity project**

  Go to [sanity.io](https://sanity.io), sign in, and create a new project:
  - Project name: `Vox`
  - Dataset: `production` (public read)

  After creation, note down your **Project ID** (visible in the project dashboard URL and settings).

- [ ] **Step 2: Create an API token**

  In your Sanity project dashboard → API → Tokens → Add API token:
  - Name: `vox-next`
  - Permissions: `Editor`

  Copy the token value — you won't be able to see it again.

- [ ] **Step 3: Create `.env.local`**

  Create `/.env.local` at the repo root (already in `.gitignore`):

  ```
  NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
  NEXT_PUBLIC_SANITY_DATASET=production
  SANITY_API_TOKEN=your_token_here
  SANITY_WEBHOOK_SECRET=your_random_secret_here
  ```

  For `SANITY_WEBHOOK_SECRET`, generate any random string (e.g. `openssl rand -hex 32` in terminal).

---

### Task 2: Install packages

- [ ] **Step 1: Install next-sanity, sanity, and styled-components**

  ```bash
  cd /Users/thalysonblack/Documents/Cursor/Vox
  npm install next-sanity sanity styled-components
  ```

  `styled-components` is a required peer dependency of Sanity Studio — without it the Studio UI will fail to render.

  Expected: packages added to `node_modules` and `package.json` dependencies updated.

- [ ] **Step 2: Verify install**

  ```bash
  node -e "import('next-sanity').then(()=>console.log('ok'))"
  ```

  Expected: prints `ok`. (next-sanity is ESM-only; `require()` would fail.)

---

### Task 3: Create TypeScript types

- [ ] **Step 1: Create `src/types/` directory**

  ```bash
  mkdir -p /Users/thalysonblack/Documents/Cursor/Vox/src/types
  ```

- [ ] **Step 2: Create `src/types/project.ts`**

  > Note: `src/lib/projects.ts` still exists at this point and still exports the same interfaces. This new file will replace it. Consumer components (`ProjectCard`, `ProjectDetailPanel`, `page.tsx`) will be updated to import from here in Tasks 11–12, and `projects.ts` will be deleted in Task 12. Do not delete `projects.ts` yet.

  ```ts
  export interface ProjectDetail {
    description: string;
    year: string;
    category: string;
    client?: string;
    tags: string[];
    role: string[];
    gallery: string[];
    externalUrl?: string;
  }

  export interface Project {
    id: string;
    name: string;
    image: string;
    detail: ProjectDetail;
  }
  ```

  Note: `image` and `gallery` items are plain CDN URL strings after GROQ projection — no Sanity image reference objects here.

- [ ] **Step 2: Verify the file compiles**

  ```bash
  npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
  ```

  Expected: no errors from this file (there may be errors elsewhere — that's OK at this stage).

---

### Task 4: Create Sanity client

- [ ] **Step 1: Create `src/lib/sanity.ts`**

  ```ts
  import { createClient } from "next-sanity";

  export const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2024-01-01",
    useCdn: process.env.NODE_ENV === "production",
  });
  ```

  `useCdn: true` in development causes stale cache issues immediately after publishing. This condition enables the CDN only in production.

---

### Task 5: Create GROQ queries

- [ ] **Step 1: Create `src/lib/queries.ts`**

  ```ts
  export const projectsQuery = `*[_type == "project"] | order(order asc) {
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
  }`;
  ```

  This query:
  - Sorts by the `order` field ascending
  - Projects `slug.current` to `"id"` (flat string) — required by carousel `data-project-id` logic
  - Projects all image refs to plain CDN URL strings via `asset->url`
  - Shapes the result into the `detail` object structure expected by existing components

---

### Task 6: Create Sanity schema

- [ ] **Step 1: Create `sanity/schemas/` directory**

  ```bash
  mkdir -p /Users/thalysonblack/Documents/Cursor/Vox/sanity/schemas
  ```

- [ ] **Step 2: Create `sanity/schemas/project.ts`**

  ```ts
  import { defineField, defineType } from "sanity";

  export const projectSchema = defineType({
    name: "project",
    title: "Project",
    type: "document",
    fields: [
      defineField({
        name: "name",
        title: "Name",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "slug",
        title: "Slug",
        type: "slug",
        options: { source: "name" },
        validation: (r) => r.required(),
      }),
      defineField({
        name: "order",
        title: "Order",
        type: "number",
        description: "Controls display position in carousel (ascending). Use 10, 20, 30... to leave room.",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "image",
        title: "Cover Image",
        type: "image",
        options: { hotspot: true },
        validation: (r) => r.required(),
      }),
      defineField({
        name: "description",
        title: "Description",
        type: "text",
      }),
      defineField({
        name: "year",
        title: "Year",
        type: "string",
      }),
      defineField({
        name: "category",
        title: "Category",
        type: "string",
      }),
      defineField({
        name: "client",
        title: "Client",
        type: "string",
      }),
      defineField({
        name: "tags",
        title: "Tags",
        type: "array",
        of: [{ type: "string" }],
      }),
      defineField({
        name: "role",
        title: "Role",
        type: "array",
        of: [{ type: "string" }],
      }),
      defineField({
        name: "gallery",
        title: "Gallery",
        type: "array",
        of: [{ type: "image", options: { hotspot: true } }],
      }),
      defineField({
        name: "externalUrl",
        title: "External URL",
        type: "url",
      }),
    ],
    preview: {
      select: { title: "name", media: "image", subtitle: "category" },
    },
  });
  ```

---

### Task 7: Create Studio config and route

- [ ] **Step 1: Create `sanity.config.ts` at repo root**

  ```ts
  import { defineConfig } from "sanity";
  import { structureTool } from "sanity/structure";
  import { projectSchema } from "./sanity/schemas/project";

  export default defineConfig({
    name: "vox-studio",
    title: "Vox Studio",
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    plugins: [structureTool()],
    schema: {
      types: [projectSchema],
    },
  });
  ```

- [ ] **Step 2: Create Studio route directory**

  ```bash
  mkdir -p /Users/thalysonblack/Documents/Cursor/Vox/src/app/studio/\[\[...tool\]\]
  ```

- [ ] **Step 3: Create `src/app/studio/[[...tool]]/page.tsx`**

  ```tsx
  import { NextStudio } from "next-sanity/studio";
  import config from "../../../../sanity.config";

  export { metadata, viewport } from "next-sanity/studio";
  export const dynamic = "force-dynamic";

  export default function StudioPage() {
    return <NextStudio config={config} />;
  }
  ```

- [ ] **Step 4: Start dev server and verify Studio loads**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000/studio` in the browser. Expected: Sanity Studio loads and asks you to log in (or shows the project editor if already logged in). The main site at `http://localhost:3000` still works (may be broken until Task 10 — that's OK).

- [ ] **Step 5: Commit**

  ```bash
  git init
  ```

  > **Important:** Do NOT commit `.env.local`. Add it to `.gitignore` first (it may already be there — check):

  ```bash
  echo ".env.local" >> .gitignore
  git add .gitignore
  git add sanity.config.ts
  git add sanity/schemas/project.ts
  git add src/lib/sanity.ts
  git add src/lib/queries.ts
  git add src/types/project.ts
  git add "src/app/studio/[[...tool]]/page.tsx"
  git add package.json package-lock.json
  git commit -m "feat: add Sanity foundation — schema, client, queries, Studio route"
  ```

---

## Chunk 2: Data Layer + next.config

### Task 8: Update next.config.ts + add Studio compiler opt-out

Add `cdn.sanity.io` to image domains. The React Compiler config stays as `reactCompiler: true` — the Studio route will opt itself out via the `"use no memo"` directive (added in Task 7 Step 3 below). The `ReactCompilerOptions` type in this project's Next.js 16.1.6 does not expose a `sources` filter; using a directive is the correct per-file opt-out mechanism.

- [ ] **Step 1: Add `"use no memo"` to the Studio page**

  Open `src/app/studio/[[...tool]]/page.tsx` and add the directive as the very first line:

  ```tsx
  "use no memo";

  import { NextStudio } from "next-sanity/studio";
  import config from "../../../../sanity.config";

  export { metadata, viewport } from "next-sanity/studio";
  export const dynamic = "force-dynamic";

  export default function StudioPage() {
    return <NextStudio config={config} />;
  }
  ```

  The React Compiler skips any file that starts with `"use no memo"`. This prevents compiler mis-optimization of Sanity Studio's internal class-based patterns without requiring any Next.js config change.

- [ ] **Step 2: Update `next.config.ts` — add `cdn.sanity.io` only**

  ```ts
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    reactCompiler: true,
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
        { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
      ],
    },
  };

  export default nextConfig;
  ```

- [ ] **Step 3: Verify build compiles**

  ```bash
  npx tsc --noEmit 2>&1 | head -30
  ```

---

### Task 9: Create revalidation webhook route

- [ ] **Step 1: Create directory**

  ```bash
  mkdir -p /Users/thalysonblack/Documents/Cursor/Vox/src/app/api/revalidate
  ```

- [ ] **Step 2: Create `src/app/api/revalidate/route.ts`**

  ```ts
  import { revalidatePath } from "next/cache";
  import { NextRequest, NextResponse } from "next/server";

  export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-webhook-secret");

    if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    revalidatePath("/");
    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  }
  ```

- [ ] **Step 2: Test the route locally**

  In a second terminal, with `npm run dev` running:

  ```bash
  # Should return 401
  curl -X POST http://localhost:3000/api/revalidate \
    -H "x-webhook-secret: wrong-secret" \
    -w "\nHTTP status: %{http_code}\n"

  # Should return 200 (replace 'your_secret' with the value from .env.local)
  curl -X POST http://localhost:3000/api/revalidate \
    -H "x-webhook-secret: your_secret" \
    -w "\nHTTP status: %{http_code}\n"
  ```

  Expected: first call returns `HTTP status: 401`, second returns `HTTP status: 200` with `{"revalidated":true,...}`.

- [ ] **Step 3: Commit**

  ```bash
  git add next.config.ts src/app/api/
  git add "src/app/studio/[[...tool]]/page.tsx"
  git commit -m "feat: add Sanity CDN image domain, Studio compiler opt-out, revalidation webhook route"
  ```

---

## Chunk 3: Component Refactor

### Task 10: Create ProjectCarousel Client Component

This is the largest extraction. All GSAP, pointer, wheel, and panel logic moves from `page.tsx` into this new component.

- [ ] **Step 1: Create `src/components/ProjectCarousel.tsx`**

  ```tsx
  "use client";

  import { useRef, useEffect, useState, useCallback } from "react";
  import { gsap } from "gsap";
  import ProjectCard from "@/components/ProjectCard";
  import ProjectDetailPanel from "@/components/ProjectDetailPanel";
  import { carouselConfig as config } from "@/lib/carouselConfig";
  import type { Project } from "@/types/project";

  interface ProjectCarouselProps {
    projects: Project[];
  }

  export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
    const stripRef = useRef<HTMLDivElement>(null);
    const set1Ref = useRef<HTMLDivElement>(null);
    const setWidthRef = useRef(0);
    const posRef = useRef({ target: 0, current: 0 });
    const impulseRef = useRef(0);

    const dragRef = useRef({
      active: false,
      startX: 0,
      lastX: 0,
      lastDx: 0,
      startTarget: null as EventTarget | null,
    });
    const pointerRef = useRef(0);
    const projectsRef = useRef(projects);
    projectsRef.current = projects;

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [panelVisible, setPanelVisible] = useState(false);

    const handleTapRef = useRef<(project: Project) => void>(() => {});
    handleTapRef.current = (project: Project) => {
      setSelectedProject(project);
      requestAnimationFrame(() => setPanelVisible(true));
    };

    const closePanel = useCallback(() => {
      setPanelVisible(false);
      setTimeout(() => setSelectedProject(null), 500);
    }, []);

    useEffect(() => {
      const strip = stripRef.current;
      const set1 = set1Ref.current;
      if (!strip || !set1) return;

      const gap = config.gap;
      const pos = posRef.current;

      const updateSetWidth = () => {
        setWidthRef.current = set1.offsetWidth + gap;
      };
      updateSetWidth();
      const ro = new ResizeObserver(updateSetWidth);
      ro.observe(set1);

      const wrap = (v: number, sw: number) => ((v % sw) + sw) % sw;

      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        impulseRef.current -= e.deltaY * config.wheel;
      };
      strip.addEventListener("wheel", handleWheel, { passive: false });

      const onPointerDown = (e: PointerEvent) => {
        if (!config.drag) return;
        pointerRef.current = e.pointerId;
        strip.setPointerCapture?.(e.pointerId);
        impulseRef.current = 0;
        dragRef.current = {
          active: true,
          startX: e.clientX,
          lastX: e.clientX,
          lastDx: 0,
          startTarget: e.target,
        };
      };
      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== pointerRef.current || !dragRef.current.active) return;
        const dx = (e.clientX - dragRef.current.lastX) * config.dragSensitivity;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastDx = dx;
        impulseRef.current = -dx;
      };
      const onPointerUp = (e: PointerEvent) => {
        if (e.pointerId !== pointerRef.current) return;
        strip.releasePointerCapture?.(e.pointerId);
        const d = dragRef.current;
        if (!d.active) return;
        d.active = false;
        const totalDrag = Math.abs(e.clientX - d.startX);
        if (totalDrag <= config.tapThreshold) {
          const el = d.startTarget as Element | null;
          const cardEl = el?.closest<HTMLElement>("[data-project-id]");
          if (cardEl) {
            const projectId = cardEl.dataset.projectId;
            const project = projectsRef.current.find((p) => p.id === projectId);
            if (project) handleTapRef.current(project);
          }
          return;
        }
        impulseRef.current = -d.lastDx * (config.fling / 100);
      };

      strip.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);

      const onTick = () => {
        const sw = setWidthRef.current;
        if (sw <= 0) return;

        const dt = gsap.ticker.deltaRatio(60);
        const friction = Math.pow(0.98, dt);
        impulseRef.current *= friction;
        if (Math.abs(impulseRef.current) < 0.01) impulseRef.current = 0;

        pos.target += impulseRef.current * dt;

        const ease = 1 - Math.pow(config.smooth, dt);
        const diff = pos.target - pos.current;
        if (Math.abs(diff) < 0.3) {
          pos.current = pos.target;
        } else {
          pos.current += diff * ease;
        }

        strip.scrollLeft = wrap(pos.current, sw);
      };

      gsap.ticker.add(onTick);

      return () => {
        ro.disconnect();
        gsap.ticker.remove(onTick);
        strip.removeEventListener("wheel", handleWheel);
        strip.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
    }, []);

    const vAlignClass =
      config.vAlign === "Center"
        ? "items-center"
        : config.vAlign === "Top"
          ? "items-start"
          : "items-end";

    if (projects.length === 0) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-[14px] font-semibold tracking-[-0.56px] text-black/30">
            No projects yet.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={`flex min-h-0 flex-1 justify-center ${vAlignClass}`}>
          <section
            ref={stripRef}
            className="scrollbar-hide flex w-full touch-none cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
            style={{
              gap: config.gap,
              ["--card-width" as string]: `${config.cardWidth}px`,
              ["--card-height" as string]: `${config.cardHeight}px`,
              ["--carousel-gap" as string]: `${config.gap}px`,
              ["--carousel-radius" as string]: `${config.radius}px`,
            }}
          >
            <div
              ref={set1Ref}
              className="flex shrink-0 items-center"
              style={{ gap: config.gap, paddingLeft: 12 }}
            >
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <div
              className="flex shrink-0 items-center"
              style={{ gap: config.gap }}
            >
              {projects.map((project) => (
                <ProjectCard key={`dup-${project.id}`} project={project} />
              ))}
            </div>
          </section>
        </div>

        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject}
            visible={panelVisible}
            onClose={closePanel}
          />
        )}
      </>
    );
  }
  ```

---

### Task 11: Rewrite ProjectDetailPanel (read-only) + update ProjectCard import

> **Atomic step:** Tasks 11 and 12 remove `onSave` from both the interface and the call site simultaneously. Do both before running `tsc`.

- [ ] **Step 1: Rewrite `src/components/ProjectDetailPanel.tsx`**

  Replace the entire file content:

  ```tsx
  "use client";

  import { useEffect } from "react";
  import Image from "next/image";
  import { X } from "lucide-react";
  import type { Project } from "@/types/project";

  interface ProjectDetailPanelProps {
    project: Project;
    visible: boolean;
    onClose: () => void;
  }

  const labelClass =
    "text-[12px] font-semibold uppercase tracking-[-0.48px] text-black/40";
  const valueClass = "text-[12px] font-semibold tracking-[-0.48px] text-black";

  export default function ProjectDetailPanel({
    project,
    visible,
    onClose,
  }: ProjectDetailPanelProps) {
    const { detail } = project;

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[200] bg-black/10 backdrop-blur-[2px] transition-opacity duration-500 ease-out ${
            visible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Panel */}
        <div
          className={`fixed top-0 right-0 bottom-0 z-[201] w-[80vw] bg-[#fdfdfc] shadow-[-1px_0_0_0_rgba(0,0,0,0.06)] transition-transform duration-500 ease-out ${
            visible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="scrollbar-hide flex h-full flex-col overflow-y-auto p-3">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="text-[14px] font-semibold uppercase tracking-[-0.56px] text-black">
                {project.name}
              </h2>
              <button
                onClick={onClose}
                className="flex cursor-pointer items-center justify-center rounded-[4px] p-1 transition-colors hover:bg-black/[0.06]"
              >
                <X size={16} strokeWidth={2} className="text-black" />
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 h-px w-full bg-black/10" />

            {/* Hero Image */}
            <div
              className="relative shrink-0 w-full overflow-hidden rounded-[4px]"
              style={{ aspectRatio: "16/10" }}
            >
              <Image
                src={project.image}
                alt={project.name}
                fill
                className="object-cover"
                sizes="70vw"
              />
            </div>

            {/* Meta */}
            <div className="mt-8 flex shrink-0 gap-12">
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Year</span>
                <span className={valueClass}>{detail.year}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Category</span>
                <span className={valueClass}>{detail.category}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Client</span>
                <span className={valueClass}>{detail.client || "—"}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <span className={`mb-2 block ${labelClass}`}>Description</span>
              <p className="max-w-[560px] text-[14px] font-semibold leading-[1.5] tracking-[-0.56px] text-black/70">
                {detail.description}
              </p>
            </div>

            {/* Role */}
            <div className="mt-8 flex shrink-0 flex-col gap-2">
              <span className={labelClass}>Role</span>
              <div className="flex flex-wrap gap-2">
                {detail.role.map((r) => (
                  <span
                    key={r}
                    className="rounded-[4px] bg-black/[0.04] px-3 py-1.5 text-[12px] font-semibold tracking-[-0.48px] text-black"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 flex shrink-0 flex-col gap-2">
              <span className={labelClass}>Tags</span>
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[12px] font-semibold tracking-[-0.48px] text-black/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div className="mt-8 flex shrink-0 flex-col gap-4">
              <span className={labelClass}>Gallery</span>
              {detail.gallery.map((src, i) => (
                <div
                  key={i}
                  className="relative w-full overflow-hidden rounded-[4px]"
                  style={{ aspectRatio: "16/10" }}
                >
                  <Image
                    src={src}
                    alt={`${project.name} — ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="70vw"
                  />
                </div>
              ))}
            </div>

            {/* External URL */}
            <div className="mt-8 flex shrink-0 flex-col gap-2">
              <span className={labelClass}>External URL</span>
              {detail.externalUrl ? (
                <a
                  href={detail.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[-0.48px] text-black transition-colors hover:text-black/60"
                >
                  Visit Project
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 10L10 2M10 2H4M10 2V8"
                      stroke="currentColor"
                      strokeLinecap="square"
                    />
                  </svg>
                </a>
              ) : (
                <span className="text-[12px] font-semibold tracking-[-0.48px] text-black/20">
                  —
                </span>
              )}
            </div>

            {/* Bottom spacer */}
            <div className="mt-8 shrink-0" />
          </div>
        </div>
      </>
    );
  }
  ```

- [ ] **Step 2: Update import in `src/components/ProjectCard.tsx`**

  Change line 4 from:
  ```ts
  import type { Project } from "@/lib/projects";
  ```
  To:
  ```ts
  import type { Project } from "@/types/project";
  ```

---

### Task 12: Rewrite page.tsx as Server Component

> **Atomic with Task 11** — do not run `tsc` until both are done.

- [ ] **Step 1: Replace entire content of `src/app/page.tsx`**

  ```tsx
  import Nav from "@/components/Nav";
  import Footer from "@/components/Footer";
  import ProjectCarousel from "@/components/ProjectCarousel";
  import { client } from "@/lib/sanity";
  import { projectsQuery } from "@/lib/queries";
  import type { Project } from "@/types/project";

  export const revalidate = 60;

  export default async function Home() {
    const projects = await client.fetch<Project[]>(projectsQuery);

    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#fdfdfc]">
        <div className="shrink-0 px-3 pt-3 pb-3">
          <Nav />
        </div>

        <ProjectCarousel projects={projects} />

        <div className="shrink-0 px-3 pb-3">
          <Footer />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Delete `src/lib/projects.ts`**

  > **Wait:** Do this AFTER verifying the build passes. `projects.ts` is no longer imported by anything at this point (all imports were updated in Step 1), so the build will succeed with or without it. Deleting now confirms no hidden imports remain.

  ```bash
  rm /Users/thalysonblack/Documents/Cursor/Vox/src/lib/projects.ts
  ```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  ```bash
  npx tsc --noEmit 2>&1
  ```

  Expected: no errors. If there are errors, they must be fixed before proceeding.

- [ ] **Step 4: Run dev server and verify the app works**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000`. Expected: the carousel renders (may be empty if Sanity has no projects yet — shows "No projects yet." message). Open `http://localhost:3000/studio` — Studio should still work.

- [ ] **Step 5: Run Next.js build to verify production build**

  ```bash
  npm run build
  ```

  Expected: build completes successfully with no errors. You'll see pages listed including `/` and `/studio/[[...tool]]`.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/ProjectCarousel.tsx
  git add src/components/ProjectDetailPanel.tsx
  git add src/components/ProjectCard.tsx
  git add src/app/page.tsx
  git add src/types/project.ts
  git commit -m "feat: extract carousel to Client Component, convert page to Server Component, connect Sanity data layer"
  ```

  Note: `src/lib/projects.ts` is NOT committed as a deletion yet — wait until after content is live in Sanity (Task 13) to ensure the carousel works before removing it.

---

## Chunk 4: Content Migration + Deployment

### Task 13: Add project content in Sanity Studio

- [ ] **Step 1: Open Sanity Studio**

  With `npm run dev` running, go to `http://localhost:3000/studio`.

- [ ] **Step 2: Add all 11 projects**

  For each project, create a new `Project` document with:
  - **Name**: as listed below
  - **Slug**: click "Generate" (auto-derives from name)
  - **Order**: use 10, 20, 30, 40, ... (multiples of 10 — leaves room to reorder later)
  - **Cover Image**: upload the corresponding file from `/public/assets/`
  - Fill in description, year, category, client, tags, role, gallery, externalUrl

  Projects to migrate:

  | Order | Name | Image file | Category |
  |-------|------|------------|----------|
  | 10 | SPA & WELLNESS | project-spa.png | Branding |
  | 20 | GSAP MASTERY | project-gsap.png | Web Design |
  | 30 | SR. R | project-srr.png | Branding |
  | 40 | VSZN | project-vszn.png | Branding |
  | 50 | ROCKET ALIVE | project-rocket.png | Branding |
  | 60 | 3D CROWN | project-3dcrown.png | 3D Design |
  | 70 | MOVE | project-move.png | Branding |
  | 80 | THETHINKHOUSE | project-thinkhouse.png | Branding |
  | 90 | QHL | project-qhl.png | Branding |
  | 100 | LOCATELLI STUDIO | project-locatelli.png | Branding |
  | 110 | DR. ROBERTO DE MELO | project-doctor.png | Branding |

- [ ] **Step 3: Verify carousel shows projects**

  Reload `http://localhost:3000`. Expected: all projects appear in the carousel with images loaded from `cdn.sanity.io`.

---

### Task 14: Deploy to Vercel + configure domain

- [ ] **Step 1: Create GitHub repository**

  ```bash
  # In /Users/thalysonblack/Documents/Cursor/Vox
  git remote add origin https://github.com/<your-username>/vox.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **Step 2: Import project into Vercel**

  1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
  2. Select the `vox` repository
  3. Framework preset: Next.js (auto-detected)
  4. Add environment variables (from your `.env.local`):
     - `NEXT_PUBLIC_SANITY_PROJECT_ID`
     - `NEXT_PUBLIC_SANITY_DATASET` = `production`
     - `SANITY_API_TOKEN`
     - `SANITY_WEBHOOK_SECRET`
  5. Click Deploy

  Expected: build completes and Vercel provides a `*.vercel.app` URL.

- [ ] **Step 3: Configure Sanity CORS**

  In Sanity dashboard → API → CORS origins → Add origin:
  - `https://your-project.vercel.app` (allow credentials: no)
  - `https://your-custom-domain.com` (allow credentials: no)

- [ ] **Step 4: Configure Sanity webhook**

  In Sanity dashboard → API → Webhooks → Create webhook:
  - Name: `Vox Vercel Revalidate`
  - URL: `https://your-project.vercel.app/api/revalidate`
  - Dataset: `production`
  - Trigger on: Create, Update, Delete
  - HTTP method: POST
  - HTTP Headers: `x-webhook-secret: <your SANITY_WEBHOOK_SECRET value>`

- [ ] **Step 5: Test webhook**

  Edit any project in Studio and publish. Check Vercel logs (Functions tab) — you should see a POST to `/api/revalidate` returning 200.

- [ ] **Step 6: Add custom domain in Vercel**

  Vercel dashboard → Project → Settings → Domains → Add your Hostinger domain.

  Vercel will show you the required DNS record.

- [ ] **Step 7: Configure DNS in Hostinger**

  In Hostinger DNS Zone Editor. **Apex domains (`@`) cannot use CNAME records** per DNS spec (they need SOA/NS records). Use one of these two options:

  **Option A — Apex domain (e.g. `yourdomain.com`):**
  - Add A record: Name `@`, Value `76.76.21.21`, TTL 3600
  - Add A record: Name `@`, Value `76.76.21.22`, TTL 3600

  **Option B — www subdomain (e.g. `www.yourdomain.com`):**
  - Add CNAME record: Name `www`, Value `cname.vercel-dns.com`, TTL 3600
  - Set up a redirect from apex → www in Vercel or Hostinger

  Vercel's dashboard will show the exact records required for your specific domain after you add it in Step 6. Follow those instructions — they take precedence over the values above.

  Wait for DNS propagation (up to 24h, usually minutes).

- [ ] **Step 8: Clean up local project images**

  After confirming all project images are live via Sanity CDN on the production URL:

  ```bash
  # Only delete project-*.png files — other assets are still used by the UI
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-spa.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-gsap.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-srr.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-vszn.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-rocket.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-3dcrown.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-move.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-thinkhouse.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-qhl.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-locatelli.png
  rm /Users/thalysonblack/Documents/Cursor/Vox/public/assets/project-doctor.png

  git add public/assets/
  git commit -m "chore: remove local project images now served via Sanity CDN"
  git push
  ```

---

## Success Verification Checklist

- [ ] `https://your-domain.com` loads with all projects from Sanity
- [ ] Clicking a project opens the detail panel with correct data and images
- [ ] Editing a project in Sanity Studio updates the live site within 60 seconds
- [ ] `https://your-domain.com/studio` is accessible and shows the editor
- [ ] No `project-*.png` files remain in `/public/assets/`
- [ ] `npm run build` passes with zero errors locally
