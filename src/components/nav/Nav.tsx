"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface NavProps {
  compact?: boolean;
  onLogoClick?: () => void;
}

// Parse any CSS color string into an [r, g, b] tuple via the browser's
// own color parser. Returns null for transparent / unparseable.
function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b, a] = parts;
  if (a !== undefined && a < 0.1) return null; // effectively transparent
  return [r, g, b];
}

// Walk up from an element until we find a non-transparent bg; return its
// relative luminance (0 = black, 1 = white).
function bgLuminance(el: Element | null): number {
  let cur: Element | null = el;
  while (cur) {
    const bg = parseRgb(getComputedStyle(cur).backgroundColor);
    if (bg) {
      const [r, g, b] = bg;
      // Relative luminance (ITU-R BT.601 approximation — fast and close enough).
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
    cur = cur.parentElement;
  }
  return 1; // assume white
}

export default function Nav({ compact = false, onLogoClick }: NavProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [panelTextColor, setPanelTextColor] = useState<"black" | "white">(
    "black",
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // When the CONNECT panel opens, probe what's behind it and pick a
  // text color for max contrast. Only the dropdown panel uses this
  // runtime detection — the logo + CONNECT button use mix-blend-difference.
  useEffect(() => {
    if (!contactOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const prev = panel.style.visibility;
    panel.style.visibility = "hidden";
    const underneath = document.elementFromPoint(cx, cy);
    panel.style.visibility = prev;
    const lum = bgLuminance(underneath);
    setPanelTextColor(lum > 0.55 ? "black" : "white");
  }, [contactOpen]);

  return (
    <nav
      className="relative z-[100] flex shrink-0 items-start gap-6"
      aria-label="Menu principal"
    >
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="Voltar para home"
        data-vox-logo
        className="pointer-events-auto shrink-0 origin-top-left cursor-pointer transition-transform duration-500 ease-out mix-blend-difference invert md:mix-blend-normal md:invert-0"
        style={{ transform: compact ? "scale(0.72)" : "scale(1)" }}
      >
        <Image
          src="/assets/vox-logo.svg"
          alt="VOX"
          width={69}
          height={16}
          priority
        />
      </button>

      <div className="w-[346px] shrink-0 max-xl:hidden" />

      <div
        className={`flex flex-1 items-start justify-end gap-0 transition-opacity duration-300 ease-out md:justify-between ${
          compact ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="hidden space-y-3 md:block">
          <p className="max-w-[193px] text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.56px] text-black">
            Design partner for founders and investors.
          </p>
        </div>

        <div
          className="pointer-events-auto relative"
          onMouseLeave={() => setContactOpen(false)}
        >
          {/* CONNECT button — always in same position */}
          <button
            onClick={() => setContactOpen(!contactOpen)}
            className="relative z-[102] flex cursor-pointer items-center gap-2 mix-blend-difference invert md:mix-blend-normal md:invert-0"
          >
            <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] text-black">
              CONNECT
            </span>
            <svg
              width={12}
              height={12}
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-300 ease-out ${contactOpen ? "rotate-45" : ""}`}
            >
              <path
                d="M1 6H11"
                stroke="black"
                strokeLinecap="square"
                strokeLinejoin="round"
              />
              <path
                d="M6 1V11"
                stroke="black"
                strokeLinecap="square"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Panel — appears behind the button */}
          <div
            ref={panelRef}
            className={`absolute -right-2 -top-2 z-[101] flex h-[165px] w-[240px] flex-col justify-end rounded-[4px] bg-black/[0.06] p-2 text-transparent backdrop-blur-[60px] transition-all duration-300 ease-out origin-top-right ${
              contactOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-90 opacity-0"
            }`}
            style={{
              backgroundClip: "unset",
              WebkitBackgroundClip: "unset",
              color: panelTextColor,
            }}
          >
            <div
              className="flex w-full flex-col gap-6 p-[4px]"
              style={{ color: panelTextColor, opacity: 1 }}
            >
              <div className="flex items-start justify-between gap-0">
                <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                  Whatsapp
                </span>
                <a
                  href="https://wa.me/5545999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] opacity-40 transition-opacity hover:opacity-70"
                >
                  +55 45 9999-9999
                </a>
              </div>
              <div className="flex items-start justify-between gap-0">
                <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                  Email
                </span>
                <a
                  href="mailto:hello@voxteller.com"
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] opacity-40 transition-opacity hover:opacity-70"
                >
                  hello@voxteller.com
                </a>
              </div>
              <div className="flex items-start justify-between gap-0 text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                <span>Social</span>
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-40 transition-opacity hover:opacity-70"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-40 transition-opacity hover:opacity-70"
                  >
                    Linkedin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
