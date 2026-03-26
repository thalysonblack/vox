"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Project, ContentBlock } from "@/types/project";

interface ProjectDetailPanelProps {
  project: Project;
  visible: boolean;
  onClose: () => void;
}

const labelClass =
  "text-[12px] font-semibold uppercase tracking-[-0.48px] text-black/40";
const valueClass = "text-[12px] font-semibold tracking-[-0.48px] text-black";
const captionClass = "text-[11px] tracking-[-0.44px] text-black/30";

function renderBlock(block: ContentBlock) {
  if (block._type === "imageBlock") {
    const ratio = block.orientation === "vertical" ? "4/5" : "16/9";
    return (
      <div key={block._key} className="flex shrink-0 flex-col gap-2">
        <div
          className="relative w-full overflow-hidden rounded-[4px]"
          style={{ aspectRatio: ratio }}
        >
          <Image
            src={block.url}
            alt={block.caption || ""}
            fill
            className="object-cover"
            sizes="70vw"
          />
        </div>
        {block.caption && <span className={captionClass}>{block.caption}</span>}
      </div>
    );
  }

  if (block._type === "imagePair") {
    return (
      <div key={block._key} className="flex shrink-0 flex-col gap-2">
        <div className="flex gap-2">
          <div
            className="relative flex-1 overflow-hidden rounded-[4px]"
            style={{ aspectRatio: "1/1" }}
          >
            <Image
              src={block.leftUrl}
              alt="Left"
              fill
              className="object-cover"
              sizes="35vw"
            />
          </div>
          <div
            className="relative flex-1 overflow-hidden rounded-[4px]"
            style={{ aspectRatio: "1/1" }}
          >
            <Image
              src={block.rightUrl}
              alt="Right"
              fill
              className="object-cover"
              sizes="35vw"
            />
          </div>
        </div>
        {block.caption && <span className={captionClass}>{block.caption}</span>}
      </div>
    );
  }

  if (block._type === "videoBlock") {
    return (
      <div key={block._key} className="flex shrink-0 flex-col gap-2">
        <video
          src={block.url}
          controls
          playsInline
          className="w-full rounded-[4px]"
        />
        {block.caption && <span className={captionClass}>{block.caption}</span>}
      </div>
    );
  }

  if (block._type === "gifBlock") {
    return (
      <div key={block._key} className="flex shrink-0 flex-col gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.url}
          alt={block.caption || ""}
          className="w-full rounded-[4px]"
        />
        {block.caption && <span className={captionClass}>{block.caption}</span>}
      </div>
    );
  }

  if (block._type === "textBlock") {
    return (
      <p
        key={block._key}
        className="max-w-[560px] text-[14px] font-semibold leading-[1.5] tracking-[-0.56px] text-black/50"
      >
        {block.text}
      </p>
    );
  }

  return null;
}

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
          <div className="mt-8 flex shrink-0 flex-wrap gap-x-12 gap-y-4">
            {detail.year && (
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Year</span>
                <span className={valueClass}>{detail.year}</span>
              </div>
            )}
            {detail.discipline && (
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Discipline</span>
                <span className={valueClass}>{detail.discipline}</span>
              </div>
            )}
            {detail.category && (
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Category</span>
                <span className={valueClass}>{detail.category}</span>
              </div>
            )}
            {detail.client && (
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Client</span>
                <span className={valueClass}>{detail.client}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {detail.description && (
            <div className="mt-8">
              <span className={`mb-2 block ${labelClass}`}>Description</span>
              <p className="max-w-[560px] text-[14px] font-semibold leading-[1.5] tracking-[-0.56px] text-black/70">
                {detail.description}
              </p>
            </div>
          )}

          {/* Role */}
          {detail.role?.length > 0 && (
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
          )}

          {/* Tags */}
          {detail.tags?.length > 0 && (
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
          )}

          {/* Content Blocks */}
          {detail.content?.length > 0 && (
            <div className="mt-8 flex shrink-0 flex-col gap-4">
              {detail.content.map((block) => renderBlock(block))}
            </div>
          )}

          {/* Credits */}
          {detail.credits?.length > 0 && (
            <div className="mt-8 flex shrink-0 flex-col gap-3">
              <span className={labelClass}>Credits</span>
              <div className="flex flex-col gap-1.5">
                {detail.credits.map((c) => (
                  <div key={c._key} className="flex items-baseline gap-3">
                    <span className="w-[120px] shrink-0 text-[11px] font-semibold uppercase tracking-[-0.44px] text-black/30">
                      {c.role}
                    </span>
                    <span className={valueClass}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Website */}
          {detail.liveUrl && (
            <div className="mt-8 flex shrink-0 flex-col gap-2">
              <span className={labelClass}>Live Website</span>
              <a
                href={detail.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[-0.48px] text-black transition-colors hover:text-black/60"
              >
                Visit Live Site
                <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 10L10 2M10 2H4M10 2V8"
                    stroke="currentColor"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* External URL */}
          {detail.externalUrl && (
            <div className="mt-8 flex shrink-0 flex-col gap-2">
              <span className={labelClass}>External URL</span>
              <a
                href={detail.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[-0.48px] text-black transition-colors hover:text-black/60"
              >
                View Project
                <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 10L10 2M10 2H4M10 2V8"
                    stroke="currentColor"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Related Projects */}
          {detail.relatedProjects?.length > 0 && (
            <div className="mt-8 flex shrink-0 flex-col gap-3">
              <span className={labelClass}>Related Projects</span>
              <div className="flex gap-2">
                {detail.relatedProjects.map((rp) => (
                  <div
                    key={rp.id}
                    className="group flex flex-1 cursor-pointer flex-col gap-1.5"
                  >
                    <div
                      className="relative w-full overflow-hidden rounded-[4px]"
                      style={{ aspectRatio: "16/10" }}
                    >
                      <Image
                        src={rp.image}
                        alt={rp.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="20vw"
                      />
                    </div>
                    <span className="text-[11px] font-semibold tracking-[-0.44px] text-black">
                      {rp.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[-0.4px] text-black/30">
                      {rp.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom spacer */}
          <div className="mt-8 shrink-0" />
        </div>
      </div>
    </>
  );
}
