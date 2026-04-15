"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { EASE, TIMING } from "@/components/carousel/carousel.constants";
import type { SiteSettings, MenuItem } from "@/types/project";

interface NavProps {
  compact?: boolean;
  onLogoClick?: () => void;
  introDone?: boolean;
  settings?: SiteSettings;
}

// Fallbacks used when the siteSettings CMS doc doesn't exist yet, so
// the nav never goes blank on a fresh install.
const DEFAULT_MENU_ITEMS: MenuItem[] = [];
const DEFAULT_NAV_TAGLINE = "Design partner for founders and investors.";
const DEFAULT_WHATSAPP = "+55 45 9999-9999";
const DEFAULT_WHATSAPP_HREF = "https://wa.me/5545999999999";
const DEFAULT_EMAIL = "hello@voxteller.com";
const DEFAULT_INSTAGRAM = "https://instagram.com";
const DEFAULT_LINKEDIN = "https://linkedin.com";

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

export default function Nav({
  compact = false,
  onLogoClick,
  introDone = true,
  settings,
}: NavProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [panelTextColor, setPanelTextColor] = useState<"black" | "white">(
    "black",
  );
  const [logoDark, setLogoDark] = useState(false);
  const [connectDark, setConnectDark] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);
  const logoImgWrapRef = useRef<HTMLSpanElement>(null);
  const connectBtnRef = useRef<HTMLButtonElement>(null);
  const prevCompactRef = useRef(compact);
  const [renderedCompact, setRenderedCompact] = useState(compact);

  // When the CONNECT panel is OPEN, continuously probe what's behind
  // it and pick a text color for max contrast. Re-probing on an
  // interval tracks dynamic background changes (e.g. scrolling the
  // vertical carousel underneath or the project panel gradient).
  useEffect(() => {
    if (!contactOpen) return;
    const probe = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      if (rect.width === 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const prev = panel.style.visibility;
      panel.style.visibility = "hidden";
      const underneath = document.elementFromPoint(cx, cy);
      panel.style.visibility = prev;
      const lum = bgLuminance(underneath);
      setPanelTextColor(lum > 0.55 ? "black" : "white");
    };
    probe();
    const id = window.setInterval(probe, 160);
    return () => window.clearInterval(id);
  }, [contactOpen]);

  // Logo + CONNECT button: probe what's behind them on mobile (where the
  // nav sits over the vertical carousel cards) and flip colors for contrast.
  // mix-blend-difference doesn't work across z-indexed stacking contexts,
  // so we detect luminance at runtime instead. Runs only on mobile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Nav lift: the whole nav slides UP, swaps the logo size while hidden
  // above the viewport, then drops back DOWN at the new size. Timing
  // mirrors the carousel transformation — forward (project open) uses
  // TIMING.verticalDur, reverse (project close) uses TIMING.reverseDur
  // + EASE.reverse so the nav lands in sync with the cards flowing
  // back into the horizontal row.
  useLayoutEffect(() => {
    if (prevCompactRef.current === compact) {
      setRenderedCompact(compact);
      return;
    }
    prevCompactRef.current = compact;
    const nav = navRef.current;
    if (!nav) {
      setRenderedCompact(compact);
      return;
    }
    gsap.killTweensOf(nav);
    // Both directions now use the same staggered carousel choreography
    // (horizontalStart + verticalDur), so the nav lift mirrors it.
    const totalDur = TIMING.horizontalStart + TIMING.verticalDur;
    const upDur = totalDur * 0.35;
    const downDur = totalDur * 0.55;
    const tl = gsap.timeline();
    tl.to(nav, {
      y: -120,
      duration: upDur,
      ease: "power2.inOut",
    });
    // Swap the rendered logo size while hidden above the viewport.
    tl.call(() => setRenderedCompact(compact));
    tl.to(nav, {
      y: 0,
      duration: downDur,
      ease: compact ? "power2.out" : EASE.reverse,
    });
  }, [compact]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    const sampleEl = (el: HTMLElement | null) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return null;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const prev = el.style.visibility;
      el.style.visibility = "hidden";
      const under = document.elementFromPoint(cx, cy);
      el.style.visibility = prev;
      return bgLuminance(under);
    };
    const probe = () => {
      const lumLogo = sampleEl(logoRef.current);
      if (lumLogo !== null) setLogoDark(lumLogo < 0.5);
      const lumConn = sampleEl(connectBtnRef.current);
      if (lumConn !== null) setConnectDark(lumConn < 0.5);
    };
    probe();
    const id = window.setInterval(probe, 140);
    return () => window.clearInterval(id);
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative z-[100] flex shrink-0 items-start gap-6 will-change-transform"
      aria-label="Menu principal"
    >
      <button
        ref={logoRef}
        type="button"
        onClick={onLogoClick}
        aria-label="Voltar para home"
        data-vox-logo
        className="pointer-events-auto shrink-0 origin-top-left cursor-pointer"
        style={{
          filter: logoDark ? "invert(1)" : "none",
          transition: "filter 200ms ease-out",
          ...(introDone ? {} : { opacity: 0, pointerEvents: "none" as const }),
        }}
      >
        <span ref={logoImgWrapRef} className="block will-change-transform">
          {/* Size the SVG via width so the browser re-rasterizes at the
              target resolution — transform:scale would rasterize once and
              then blow up the bitmap, which is what was pixelating the
              wordmark. Vector crisp at any size. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/vox-logo.svg"
            alt="Good Taste"
            width={renderedCompact ? 76 : isDesktop ? 353 : 117}
            height={renderedCompact ? 11 : isDesktop ? 54 : 18}
            draggable={false}
            style={{ display: "block" }}
          />
        </span>
      </button>

      <div className="w-[346px] shrink-0 max-xl:hidden" />

      <div
        className={`flex flex-1 items-start justify-end gap-0 transition-opacity duration-300 ease-out md:justify-between ${
          compact ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={introDone ? undefined : { opacity: 0, pointerEvents: "none" }}
      >
        <div className="hidden space-y-3 md:block">
          <p className="max-w-[193px] text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.56px] text-black">
            {settings?.navTagline || DEFAULT_NAV_TAGLINE}
          </p>
          {(() => {
            const items =
              settings?.menuItems && settings.menuItems.length > 0
                ? settings.menuItems
                : DEFAULT_MENU_ITEMS;
            if (items.length === 0) return null;
            return (
              <ul className="flex flex-col gap-2">
                {items.map((item, idx) => (
                  <li key={`${item.href}-${idx}`}>
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="text-[12px] font-semibold uppercase leading-[1.15] tracking-[-0.48px] text-black/60 transition-opacity hover:text-black"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        <div
          className="pointer-events-auto relative"
          onMouseLeave={() => setContactOpen(false)}
        >
          {/* CONNECT button — on mobile uses mix-blend-mode: difference
              against a forced-white color so it inverts against whatever
              is behind. On desktop (≥768) falls back to the luminance
              probe flipping between black/white. */}
          <button
            ref={connectBtnRef}
            onClick={() => setContactOpen(!contactOpen)}
            className="relative z-[102] flex cursor-pointer items-center gap-2"
            style={{
              color: isDesktop ? (connectDark ? "white" : "black") : "#ffffff",
              mixBlendMode: isDesktop ? "normal" : "difference",
              transition: "color 200ms ease-out",
            }}
          >
            <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
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
                stroke="currentColor"
                strokeLinecap="square"
                strokeLinejoin="round"
              />
              <path
                d="M6 1V11"
                stroke="currentColor"
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
                  href={settings?.connectWhatsappHref || DEFAULT_WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] opacity-40 transition-opacity hover:opacity-70"
                >
                  {settings?.connectWhatsapp || DEFAULT_WHATSAPP}
                </a>
              </div>
              <div className="flex items-start justify-between gap-0">
                <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                  Email
                </span>
                <a
                  href={`mailto:${settings?.connectEmail || DEFAULT_EMAIL}`}
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] opacity-40 transition-opacity hover:opacity-70"
                >
                  {settings?.connectEmail || DEFAULT_EMAIL}
                </a>
              </div>
              <div className="flex items-start justify-between gap-0 text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                <span>Social</span>
                <div className="flex gap-3">
                  <a
                    href={settings?.connectInstagram || DEFAULT_INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-40 transition-opacity hover:opacity-70"
                  >
                    Instagram
                  </a>
                  <a
                    href={settings?.connectLinkedin || DEFAULT_LINKEDIN}
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
