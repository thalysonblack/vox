"use client";

import Image from "next/image";
import type { Project, ProjectListItem } from "@/types/project";
import { carouselConfig } from "@/lib/carouselConfig";
import { playTick } from "@/components/carousel/carousel.tick";

interface ProjectCardProps {
  project: Project | ProjectListItem;
  /** Mark the first visible card for LCP priority loading */
  isFirst?: boolean;
}

const { radius } = carouselConfig;

export default function ProjectCard({ project, isFirst = false }: ProjectCardProps) {
  return (
    <div
      data-project-id={project.id}
      onMouseEnter={playTick}
      className="group flex shrink-0 cursor-pointer select-none flex-col pt-[8px]"
      style={{
        width: "var(--pc-w, 446px)",
        minWidth: "var(--pc-w, 446px)",
        maxWidth: "var(--pc-w, 446px)",
        height: "var(--pc-h, 601px)",
        minHeight: "var(--pc-h, 601px)",
        maxHeight: "var(--pc-h, 601px)",
      }}
    >
      <div
        className="project-card-title-row flex items-center justify-between rounded-[4px] px-0 py-[8px] group-hover:bg-[rgba(31,43,57,0.03)] group-hover:px-[8px]"
        style={{
          transition:
            "transform 200ms ease-out, background-color 200ms ease-out, padding 200ms ease-out",
          willChange: "transform",
        }}
      >
        <span
          className="text-[14px] font-semibold tracking-[-0.56px] text-black"
          style={{
            transition:
              "font-size 450ms ease-out, letter-spacing 450ms ease-out",
          }}
        >
          {project.name}
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-[-0.48px] text-black/[0.19]">
          View
        </span>
      </div>

      <div
        className="relative min-h-0 w-full flex-1 overflow-hidden"
        style={{ borderRadius: radius }}
      >
        <Image
          src={project.image}
          alt={project.name}
          fill
          className="pointer-events-none object-cover"
          sizes="(max-width: 768px) 80vw, 30vw"
          priority={isFirst}
        />
      </div>
    </div>
  );
}
