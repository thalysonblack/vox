"use client";

import { useState } from "react";
import Image from "next/image";
import WebGLGallery from "@/components/WebGLGallery";
import type { Project } from "@/types/project";

interface GalleryClientProps {
  projects: Project[];
}

export default function GalleryClient({ projects }: GalleryClientProps) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Top bar */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="pointer-events-auto">
          <a
            href="/"
            className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80 hover:text-white"
          >
            ← VOX
          </a>
        </div>
        <div className="pointer-events-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            drag / scroll to explore · click to open
          </span>
        </div>
      </div>

      <WebGLGallery projects={projects} onSelect={setSelected} />

      {/* Selection overlay */}
      {selected && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-[#f7f6f3]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fechar"
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black transition-colors hover:bg-black/20"
            >
              <svg
                width={12}
                height={12}
                viewBox="0 0 12 12"
                stroke="currentColor"
                strokeWidth={1.5}
                fill="none"
              >
                <path d="M2 2L10 10M10 2L2 10" />
              </svg>
            </button>

            <div className="grid gap-6 p-6 md:grid-cols-[3fr_2fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-black/10">
                <Image
                  src={selected.image}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.8px] text-[#2d2f2f]">
                  {selected.name}
                </h2>
                {selected.detail.description && (
                  <p className="text-[14px] leading-[1.5] text-black/60">
                    {selected.detail.description}
                  </p>
                )}
                {(selected.detail.discipline || selected.detail.category) && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-black/40">
                      Type
                    </span>
                    <span className="text-[14px] font-semibold text-black">
                      {selected.detail.discipline || selected.detail.category}
                    </span>
                  </div>
                )}
                {selected.detail.liveUrl && (
                  <a
                    href={selected.detail.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white hover:bg-black/80"
                  >
                    <svg
                      width={7}
                      height={9}
                      viewBox="0 0 7 9"
                      fill="currentColor"
                    >
                      <path d="M0.5 0.5L6 4.5L0.5 8.5V0.5Z" />
                    </svg>
                    Live Site
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
