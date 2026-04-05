"use client";

import Image from "next/image";
import type { Project, ProjectListItem } from "@/types/project";
import { carouselConfig } from "@/lib/carouselConfig";

interface ProjectCardProps {
  project: Project | ProjectListItem;
}

const { radius } = carouselConfig;

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div
      data-project-id={project.id}
      className="group flex shrink-0 cursor-pointer select-none flex-col pt-[8px] w-[140px] min-w-[140px] max-w-[140px] h-[190px] min-h-[190px] max-h-[190px] md:w-[260px] md:min-w-[260px] md:max-w-[260px] md:h-[350px] md:min-h-[350px] md:max-h-[350px] xl:w-[446px] xl:min-w-[446px] xl:max-w-[446px] xl:h-[601px] xl:min-h-[601px] xl:max-h-[601px]"
    >
      <div className="flex items-center justify-between rounded-[4px] px-0 py-[8px] transition-all duration-200 group-hover:-translate-y-[8px] group-hover:bg-[rgba(31,43,57,0.03)] group-hover:px-[8px]">
        <span
          className="text-[14px] font-semibold tracking-[-0.56px] text-black"
          style={{ transition: "font-size 450ms ease-out, letter-spacing 450ms ease-out" }}
        >
          {project.name}
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-[-0.48px] text-black/[0.19]">
          View
        </span>
      </div>

      <div
        className="relative w-full min-h-0 flex-1 overflow-hidden"
        style={{
          borderRadius: radius,
        }}
      >
        <Image
          src={project.image}
          alt={project.name}
          fill
          className="pointer-events-none object-cover"
          sizes="(max-width: 768px) 80vw, 30vw"
        />
      </div>
    </div>
  );
}
