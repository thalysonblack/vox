"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface NavProps {
  compact?: boolean;
  onLogoClick?: () => void;
}

export default function Nav({ compact = false, onLogoClick }: NavProps) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <nav
      className="relative z-[100] flex shrink-0 items-start gap-6"
      aria-label="Menu principal"
    >
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="Voltar para home"
        className="shrink-0 origin-top-left cursor-pointer transition-transform duration-500 ease-out"
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
        className={`flex flex-1 items-start justify-between gap-0 transition-opacity duration-300 ease-out ${
          compact ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="space-y-3">
          <p className="max-w-[193px] text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.56px] text-black">
            Design partner for founders and investors.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[-0.36px] text-black/60">
            <Link href="/" className="transition-colors hover:text-black">
              Home
            </Link>
            <Link href="/resources" className="transition-colors hover:text-black">
              Resources
            </Link>
          </div>
        </div>

        <div className="relative">
          {/* CONNECT button — always in same position */}
          <button
            onClick={() => setContactOpen(!contactOpen)}
            className="relative z-[102] flex cursor-pointer items-center gap-2"
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
            className={`absolute -right-2 -top-2 z-[101] flex h-[165px] w-[240px] flex-col justify-end rounded-[4px] bg-black/[0.06] p-2 text-transparent backdrop-blur-[60px] transition-all duration-300 ease-out origin-top-right ${
              contactOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-90 opacity-0"
            }`}
            style={{
              backgroundClip: "unset",
              WebkitBackgroundClip: "unset",
            }}
          >
            <div className="flex w-full flex-col gap-6 p-[4px]">
              <div className="flex items-start justify-between gap-0">
                <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] text-black">
                  Whatsapp
                </span>
                <a
                  href="https://wa.me/5545999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] text-black/40 transition-colors hover:text-black/70"
                >
                  +55 45 9999-9999
                </a>
              </div>
              <div className="flex items-start justify-between gap-0">
                <span className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] text-black">
                  Email
                </span>
                <a
                  href="mailto:hello@voxteller.com"
                  className="text-[12px] font-semibold leading-[1.15] tracking-[-0.48px] text-black/40 transition-colors hover:text-black/70"
                >
                  hello@voxteller.com
                </a>
              </div>
              <div className="flex items-start justify-between gap-0 text-[12px] font-semibold leading-[1.15] tracking-[-0.48px]">
                <span className="text-black">Social</span>
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black/40 transition-colors hover:text-black/70"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black/40 transition-colors hover:text-black/70"
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
