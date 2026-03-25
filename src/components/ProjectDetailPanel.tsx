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
