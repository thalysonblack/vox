"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Project, ContentBlock } from "@/types/project";

interface ProjectDetailPanelProps {
  project: Project;
  visible: boolean;
  onClose: () => void;
}

const mediaFrameClass =
  "relative w-full overflow-hidden rounded-[4px] bg-[#2d2d2d]";
const metaLabelClass = "text-[11px] font-semibold uppercase tracking-[-0.04em] text-black/38";
const metaValueClass = "text-[15px] font-semibold leading-[1.4] tracking-[-0.03em] text-[#2d2f2f]";

function TriangleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="7"
      height="9"
      viewBox="0 0 7 9"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M0.75 0.75L6 4.5L0.75 8.25V0.75Z" fill="currentColor" />
    </svg>
  );
}

function renderBlock(block: ContentBlock) {
  if (block._type === "imageBlock") {
    const isVertical = block.orientation === "vertical";
    const aspect = isVertical ? "720 / 1020" : "1420 / 770";

    return (
      <div key={block._key} className="w-full">
        <div className={mediaFrameClass} style={{ aspectRatio: aspect }}>
          {block.url && (
            <Image
              src={block.url}
              alt={block.caption || ""}
              fill
              className="object-cover"
              sizes="72vw"
            />
          )}
        </div>
      </div>
    );
  }

  if (block._type === "imagePair") {
    return (
      <div key={block._key} className="grid w-full grid-cols-2 gap-[18px]">
        <div className={mediaFrameClass} style={{ aspectRatio: "700 / 400" }}>
          {block.leftUrl && (
            <Image
              src={block.leftUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36vw"
            />
          )}
        </div>
        <div className={mediaFrameClass} style={{ aspectRatio: "700 / 400" }}>
          {block.rightUrl && (
            <Image
              src={block.rightUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36vw"
            />
          )}
        </div>
      </div>
    );
  }

  if (block._type === "videoBlock") {
    return (
      <div key={block._key} className={mediaFrameClass} style={{ aspectRatio: "1420 / 799" }}>
        <video src={block.url} controls playsInline className="h-full w-full object-cover" />
      </div>
    );
  }

  if (block._type === "gifBlock") {
    return (
      <div key={block._key} className={mediaFrameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (block._type === "textBlock") {
    return (
      <p
        key={block._key}
        className="max-w-[44rem] text-[15px] font-semibold leading-[1.45] tracking-[-0.03em] text-[#2d2f2f]"
      >
        {block.text}
      </p>
    );
  }

  return null;
}

// Mock fallback data — used when Sanity fields are empty.
const MOCK_DESCRIPTION =
  "Lorem ipsum dolor sit amet consectetur. Quam sapien et augue sit ornare amet ut suspendisse senectus. Congue ut eu ac ultricies morbi metus auctor. Orci amet venenatis scelerisque feugiat. Porttitor egestas purus donec eu vulputate dui volutpat. Sociis massa nisl condimentum est urna suspendisse aliquet. Quam vel tellus tristique sit morbi fusce in.";
const MOCK_TYPE = "UI Design";
const MOCK_CREDITS = [{ _key: "mock-1", name: "Cadu", role: "Development" }];

// Mock content blocks — dark gray placeholders matching the reference layout.
const MOCK_CONTENT: ContentBlock[] = [
  { _type: "imageBlock", _key: "m-hero", url: "", orientation: "horizontal" },
  { _type: "imagePair", _key: "m-pair-1", leftUrl: "", rightUrl: "" },
  { _type: "imagePair", _key: "m-pair-2", leftUrl: "", rightUrl: "" },
  { _type: "imageBlock", _key: "m-full-1", url: "", orientation: "vertical" },
  { _type: "imageBlock", _key: "m-full-2", url: "", orientation: "vertical" },
];

export default function ProjectDetailPanel({ project, visible, onClose }: ProjectDetailPanelProps) {
  const { detail } = project;

  // Apply mocks where Sanity data is missing.
  const description = detail.description || MOCK_DESCRIPTION;
  const typeValue = detail.discipline || detail.category || MOCK_TYPE;
  const credits = detail.credits && detail.credits.length > 0 ? detail.credits : MOCK_CREDITS;
  const liveUrl = detail.liveUrl || detail.externalUrl || "https://example.com";
  const content =
    detail.content && detail.content.length > 0 ? detail.content : MOCK_CONTENT;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 left-0 z-[201] bg-[#f7f6f3] transition-transform duration-500 ease-out md:left-[22vw] xl:left-[min(22vw,440px)] ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Close button — outside panel, aligned with the title */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar detalhes do projeto"
        className="absolute top-[8px] z-[35] flex h-[22px] w-[22px] items-center justify-center bg-[#efefef] px-0 text-[#2d2f2f] transition-colors hover:bg-[#e3e3e3] right-[12px] rounded-[3px] md:right-auto md:left-[-8px] md:-translate-x-full md:rounded-l-[3px] md:rounded-r-none"
      >
        <svg
          width={5}
          height={7}
          viewBox="0 0 5 7"
          fill="currentColor"
        >
          <path d="M0.3 0.3L4.2 3.5L0.3 6.7V0.3Z" />
        </svg>
      </button>

      <div
        data-scrollable-panel
        className="scrollbar-hide flex h-full flex-col overflow-y-auto"
      >
        {/* Top section: Title (left) + meta column (right 50%) */}
        <div className="flex shrink-0 flex-col items-start gap-6 px-[12px] pt-[12px] pb-[32px] md:flex-row md:justify-between md:gap-8 md:pb-[48px]">
          <h2 className="shrink-0 text-[24px] font-semibold leading-[1.09] tracking-[-0.72px] text-[#2d2f2f] md:text-[30px] md:tracking-[-0.91px]">
            {project.name}
          </h2>

          <div className="flex w-full shrink-0 flex-col md:w-[50%] md:max-w-[720px]">
            <p className="text-[15px] font-semibold leading-[1.4] tracking-[-0.455px] text-[#2d2f2f]">
              {description}
            </p>

            <div className="mt-[18px] h-px w-full bg-black/[0.08]" />

            <div className="mt-[16px] flex flex-wrap items-start gap-6 md:gap-10">
              <div className="flex flex-col gap-[9px]">
                <span className={metaLabelClass}>Type</span>
                <span className={metaValueClass}>{typeValue}</span>
              </div>
              <div className="flex flex-col gap-[9px]">
                <span className={metaLabelClass}>Credits</span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {credits.map((credit) => (
                    <span
                      key={credit._key}
                      className="text-[15px] font-semibold leading-[1.4] tracking-[-0.455px]"
                    >
                      <span className="text-[#2d2f2f]">{credit.name}</span>{" "}
                      <span className="text-[#959595]">{credit.role}</span>
                    </span>
                  ))}
                </div>
              </div>
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[22px] ml-auto inline-flex shrink-0 items-center justify-between gap-[12px] bg-[#efefef] px-[9px] py-[3px] transition-colors hover:bg-black/[0.08]"
                  style={{ minWidth: "122px" }}
                >
                  <svg
                    width={6}
                    height={8}
                    viewBox="0 0 6 8"
                    fill="#2d2f2f"
                    className="shrink-0"
                  >
                    <path d="M0 0L6 4L0 8V0Z" />
                  </svg>
                  <span className="text-[15px] font-semibold leading-[1.4] tracking-[-0.455px] text-[#2d2f2f]">
                    Live Site
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        <section className="shrink-0 px-[12px] pb-[48px]">
          <div className="flex flex-col gap-[18px]">
            {content.map((block) => renderBlock(block))}
          </div>
        </section>

        <div className="mt-auto shrink-0 px-[12px] pb-[18px]">
          <div className="border-t border-black/[0.08] pt-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:gap-8">
              <span className="text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.05em] text-black/42">
                © 2026
              </span>

              <span className="max-w-[30rem] text-right text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.05em] text-black/42">
                We bring ideas to life, and life to ideas, through strategy, design, and
                communication.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
