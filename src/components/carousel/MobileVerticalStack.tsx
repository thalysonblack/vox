"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { carouselConfig } from "@/lib/carouselConfig";
import type { ProjectListItem } from "@/types/project";
import { PHASE_B, ACTIVE_CARD_STYLE } from "./carousel.constants";

interface MobileVerticalStackProps {
  projects: ProjectListItem[];
  onTapProject: (project: ProjectListItem) => void;
}

/**
 * Mobile-only vertical snap carousel that mirrors the desktop vertical mode:
 * - CSS scroll-snap for native touch smoothness
 * - 3-tier scale (center / adjacent / other)
 * - Active card highlight (title row bg + translate + padding)
 * - Tap opens the detail panel
 */
export default function MobileVerticalStack({
  projects,
  onTapProject,
}: MobileVerticalStackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLButtonElement[]>([]);

  // Apply per-frame scale/active state based on each card's distance from viewport center.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const sRect = scroller.getBoundingClientRect();
      const viewportCenter = sRect.top + sRect.height / 2;

      cardRefs.current.forEach((btn) => {
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const cardCenter = r.top + r.height / 2;
        const distPx = Math.abs(cardCenter - viewportCenter);
        const slot = distPx / r.height;

        let scale: number;
        if (slot < 0.5) scale = PHASE_B.centerScale / 0.48;
        else if (slot < 1.3) scale = PHASE_B.adjacentScale / 0.48;
        else scale = PHASE_B.otherScale / 0.48;

        btn.style.transform = `scale(${scale})`;
        btn.style.opacity = slot < 2.5 ? "1" : "0.4";

        // Active card visual (center): lift the title row, add bg + padding.
        const titleRow = btn.querySelector<HTMLElement>("[data-title-row]");
        if (titleRow) {
          const isActive = slot < 0.5;
          titleRow.style.transform = isActive
            ? `translateY(${ACTIVE_CARD_STYLE.translateY})`
            : "";
          titleRow.style.backgroundColor = isActive
            ? ACTIVE_CARD_STYLE.bgColor
            : "";
          titleRow.style.paddingLeft = isActive
            ? ACTIVE_CARD_STYLE.paddingX
            : "";
          titleRow.style.paddingRight = isActive
            ? ACTIVE_CARD_STYLE.paddingX
            : "";
        }
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  // Center the first card on mount so scale tiers look correct.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const first = cardRefs.current[0];
    if (!scroller || !first) return;
    const offset = first.offsetTop - scroller.clientHeight / 2 + first.offsetHeight / 2;
    scroller.scrollTop = Math.max(0, offset);
  }, [projects.length]);

  return (
    <div
      ref={scrollerRef}
      className="flex min-h-0 flex-1 snap-y snap-mandatory flex-col items-center overflow-y-auto overflow-x-hidden md:hidden"
      style={{ scrollPaddingBlock: "50%" }}
    >
      {/* top spacer so first card can center */}
      <div className="h-[40dvh] shrink-0" aria-hidden />

      {projects.map((project, i) => (
        <button
          key={`mob-${project.id}`}
          ref={(el) => {
            if (el) cardRefs.current[i] = el;
          }}
          type="button"
          onClick={() => onTapProject(project)}
          className="group mb-[32px] flex shrink-0 cursor-pointer select-none snap-center flex-col text-left will-change-transform"
          style={{
            width: "var(--pc-w)",
            transformOrigin: "50% 50%",
            transition: "transform 200ms ease-out, opacity 200ms ease-out",
          }}
        >
          <div
            data-title-row
            className="flex items-center justify-between rounded-[4px] py-[8px] transition-all duration-200"
          >
            <span className="text-[14px] font-semibold tracking-[-0.56px] text-black">
              {project.name}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[-0.48px] text-black/[0.19]">
              View
            </span>
          </div>
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "446 / 601",
              borderRadius: carouselConfig.radius,
            }}
          >
            <Image
              src={project.image}
              alt={project.name}
              fill
              className="pointer-events-none object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        </button>
      ))}

      {/* bottom spacer so last card can center */}
      <div className="h-[40dvh] shrink-0" aria-hidden />
    </div>
  );
}
