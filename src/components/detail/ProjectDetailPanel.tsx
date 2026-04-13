"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ContentBlockRenderer from "./ContentBlock";
import type { Project, ContentBlock } from "@/types/project";

gsap.registerPlugin(ScrollTrigger);

interface ProjectDetailPanelProps {
  project: Project;
  visible: boolean;
  onClose: () => void;
  /** Called when the user scrolls past the bottom of the panel — used to
   *  auto-advance to the next project. */
  onScrollPastEnd?: () => void;
}

const metaLabelClass =
  "text-[11px] font-semibold uppercase tracking-[-0.04em] text-black/38";
const metaValueClass =
  "text-[15px] font-semibold leading-[1.4] tracking-[-0.03em] text-[#2d2f2f]";

// Mock fallback data — used when Sanity fields are empty.
const MOCK_DESCRIPTION =
  "Lorem ipsum dolor sit amet consectetur. Quam sapien et augue sit ornare amet ut suspendisse senectus. Congue ut eu ac ultricies morbi metus auctor. Orci amet venenatis scelerisque feugiat. Porttitor egestas purus donec eu vulputate dui volutpat. Sociis massa nisl condimentum est urna suspendisse aliquet. Quam vel tellus tristique sit morbi fusce in.";
const MOCK_TYPE = "UI Design";
const MOCK_CREDITS = [{ _key: "mock-1", name: "Cadu", role: "Development" }];
const MOCK_CONTENT: ContentBlock[] = [
  { _type: "imageBlock", _key: "m-hero", url: "", orientation: "horizontal" },
  { _type: "imagePair", _key: "m-pair-1", leftUrl: "", rightUrl: "" },
  { _type: "imagePair", _key: "m-pair-2", leftUrl: "", rightUrl: "" },
  { _type: "imageBlock", _key: "m-full-1", url: "", orientation: "vertical" },
  { _type: "imageBlock", _key: "m-full-2", url: "", orientation: "vertical" },
];

export default function ProjectDetailPanel({
  project,
  visible,
  onClose,
  onScrollPastEnd,
}: ProjectDetailPanelProps) {
  const { detail } = project;
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const nextIndicatorRef = useRef<HTMLDivElement>(null);
  const nextIndicatorFillRef = useRef<HTMLDivElement>(null);

  const description = detail.description || MOCK_DESCRIPTION;
  const typeValue = detail.discipline || detail.category || MOCK_TYPE;
  const credits =
    detail.credits && detail.credits.length > 0
      ? detail.credits
      : MOCK_CREDITS;
  const liveUrl =
    detail.liveUrl || detail.externalUrl || "https://example.com";
  const content =
    detail.content && detail.content.length > 0
      ? detail.content
      : MOCK_CONTENT;

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock scroll momentum after a project change so the user sees the top
  // of the new project instead of being rushed down by residual scroll.
  const scrollLockRef = useRef(false);

  // When the project changes (via scroll-past-end or direct navigation),
  // reset the panel scroll position to the top, briefly fade the content
  // for a soft swap, AND lock scroll until everything settles.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    // Smoothly reset scroll and fade content out/in around the swap.
    scroller.style.transition = "opacity 250ms ease-out";
    scroller.style.opacity = "0";
    const fadeBack = window.setTimeout(() => {
      scroller.scrollTop = 0;
      scroller.style.opacity = "1";
    }, 260);

    scrollLockRef.current = true;
    const release = window.setTimeout(() => {
      scrollLockRef.current = false;
      scroller.style.transition = "";
    }, 1100);

    return () => {
      window.clearTimeout(fadeBack);
      window.clearTimeout(release);
    };
  }, [project.id]);

  // Enforce the scroll lock on wheel/touch events and keep scrollTop at 0.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onWheelBlock = (e: WheelEvent) => {
      if (scrollLockRef.current && e.deltaY > 0) {
        e.preventDefault();
        scroller.scrollTop = 0;
      }
    };
    const onTouchBlock = (e: TouchEvent) => {
      if (scrollLockRef.current) {
        scroller.scrollTop = 0;
        // Don't preventDefault on touch — iOS needs natural gestures;
        // snapping to 0 is enough to keep the top in view.
      }
    };
    scroller.addEventListener("wheel", onWheelBlock, { passive: false });
    scroller.addEventListener("touchmove", onTouchBlock, { passive: true });
    return () => {
      scroller.removeEventListener("wheel", onWheelBlock);
      scroller.removeEventListener("touchmove", onTouchBlock);
    };
  }, []);

  // Scroll-past-end: after reaching the bottom, accumulate extra wheel/touch
  // delta. When the threshold is hit, call onScrollPastEnd (auto-navigate).
  // A progress indicator fades in as the user gets closer to triggering.
  //
  // Anti-accident rules:
  //   - Each wheel event is capped (fast/jerky scrolls don't count as much)
  //   - Minimum sustained time before triggering
  useEffect(() => {
    if (!visible || !scrollRef.current || !onScrollPastEnd) return;
    const scroller = scrollRef.current;
    const indicator = nextIndicatorRef.current;
    const fill = nextIndicatorFillRef.current;
    // Long, deliberate pull required.
    const THRESHOLD = 900;
    // Hard cap per wheel tick — prevents a single sharp scroll (e.g. a
    // trackpad flick with deltaY=500) from jumping 80% of the threshold at once.
    const PER_EVENT_CAP = 45;
    // User must be actively scrolling for at least this long before nav fires.
    const MIN_DURATION_MS = 900;

    let accum = 0;
    let triggered = false;
    let touchStartY = 0;
    let activationStart = 0;
    let idleTimer: number | null = null;

    const isAtBottom = () =>
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;

    const setProgress = (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      if (fill) fill.style.transform = `scaleX(${clamped})`;
      if (indicator) {
        indicator.style.opacity = clamped > 0 ? "1" : "0";
        indicator.style.transform = `translateY(${clamped > 0 ? 0 : 20}px)`;
      }
    };

    const scheduleIdleReset = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        accum = 0;
        activationStart = 0;
        setProgress(0);
      }, 500);
    };

    const addProgress = (rawDelta: number) => {
      const capped = Math.min(rawDelta, PER_EVENT_CAP);
      if (activationStart === 0) activationStart = performance.now();
      accum += capped;
      // Visual progress accounts for BOTH accum AND elapsed time, so a fast
      // scroller sees the bar fill slower than their input suggests.
      const accumProgress = accum / THRESHOLD;
      const timeProgress =
        (performance.now() - activationStart) / MIN_DURATION_MS;
      const progress = Math.min(accumProgress, timeProgress);
      setProgress(progress);
      scheduleIdleReset();

      // Both conditions must hold: accum over THRESHOLD AND min duration elapsed.
      if (
        accum >= THRESHOLD &&
        performance.now() - activationStart >= MIN_DURATION_MS
      ) {
        triggered = true;
        setProgress(1);
        if (idleTimer !== null) window.clearTimeout(idleTimer);
        onScrollPastEnd();
        window.setTimeout(() => setProgress(0), 600);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (triggered || e.deltaY <= 0) return;
      if (scrollLockRef.current) return;
      if (!isAtBottom()) {
        accum = 0;
        activationStart = 0;
        setProgress(0);
        return;
      }
      addProgress(e.deltaY);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (triggered) return;
      if (scrollLockRef.current) return;
      if (!isAtBottom()) {
        setProgress(0);
        return;
      }
      const nowY = e.touches[0].clientY;
      const frameDelta = touchStartY - nowY;
      touchStartY = nowY;
      if (frameDelta > 0) addProgress(frameDelta);
    };
    const onTouchEnd = () => {
      if (!triggered) {
        accum = 0;
        activationStart = 0;
        setProgress(0);
      }
    };

    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      setProgress(0);
    };
  }, [visible, onScrollPastEnd, project.id]);

  // Scroll reveal animations
  useEffect(() => {
    if (!visible || !scrollRef.current) return;
    const scroller = scrollRef.current;

    // Hide elements IMMEDIATELY (same frame as mount) to prevent flash.
    gsap.set(scroller.querySelectorAll("[data-reveal='header']"), {
      y: 30,
      opacity: 0,
    });
    gsap.set(scroller.querySelectorAll("[data-reveal='meta']"), {
      y: 20,
      opacity: 0,
    });
    gsap.set(scroller.querySelectorAll("[data-reveal='block']"), {
      y: 40,
      opacity: 0,
      scale: 0.97,
    });
    gsap.set(scroller.querySelectorAll("[data-reveal='footer']"), {
      y: 20,
      opacity: 0,
    });

    // Small delay to let the panel slide-in transition start.
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;

      gsapCtxRef.current = gsap.context(() => {
        // Title + description entrance
        gsap.to("[data-reveal='header']", {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
        });

        // Meta fields stagger
        gsap.to("[data-reveal='meta']", {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "power3.out",
          stagger: 0.08,
        });

        // Content blocks reveal on scroll
        gsap.utils
          .toArray<HTMLElement>("[data-reveal='block']")
          .forEach((el) => {
            gsap.to(el, {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                scroller,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            });
          });

        // Parallax on images — subtle translateY slower than scroll
        gsap.utils
          .toArray<HTMLElement>("[data-parallax-img]")
          .forEach((img) => {
            gsap.fromTo(
              img,
              { y: -20 },
              {
                y: 20,
                ease: "none",
                scrollTrigger: {
                  trigger: img.parentElement!,
                  scroller,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          });

        // Footer reveal
        gsap.to("[data-reveal='footer']", {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-reveal='footer']",
            scroller,
            start: "top 95%",
            toggleActions: "play none none none",
          },
        });

        // Let ScrollTrigger re-measure once all images/layout settle.
        // Critical after the panel transitions in or the project changes.
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, scrollRef);
    }, 200);

    return () => {
      clearTimeout(timer);
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, [visible, project.id]);

  return (
    <div
      ref={panelRef}
      className={`fixed top-0 right-0 bottom-0 left-0 z-[201] bg-[#f7f6f3] md:left-[22vw] xl:left-[min(22vw,440px)] ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        // Transform slides the panel in/out (800ms with ease-out-expo curve).
        // Opacity fades in fast on open, and fades out at the TAIL of the slide
        // so the panel is already invisible before React unmounts — no flash.
        opacity: visible ? 1 : 0,
        transitionProperty: "transform, opacity",
        transitionDuration: visible ? "800ms, 200ms" : "800ms, 300ms",
        transitionDelay: visible ? "0ms, 0ms" : "0ms, 550ms",
        transitionTimingFunction:
          "cubic-bezier(0.22, 1, 0.36, 1), ease-out",
      }}
    >
      {/* Close button — min 44px touch target */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar detalhes do projeto"
        className="absolute top-[4px] z-[35] flex h-[22px] w-[22px] items-center justify-center rounded-[3px] bg-[#e3e3e3] text-[#2d2f2f] transition-colors hover:bg-[#d4d4d4] right-[8px] md:right-auto md:left-[-8px] md:-translate-x-full"
      >
        <svg width={5} height={7} viewBox="0 0 5 7" fill="currentColor">
          <path d="M0.3 0.3L4.2 3.5L0.3 6.7V0.3Z" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        data-scrollable-panel
        className="scrollbar-hide flex h-full touch-pan-y flex-col overflow-y-auto"
      >
        {/* Top section: Title (left) + meta column (right) — 2-cols on all screens */}
        <div className="flex shrink-0 flex-row items-start justify-between gap-4 px-[12px] pt-[12px] pb-[32px] md:gap-8 md:pb-[48px]">
          <h2
            data-reveal="header"
            className="w-[25%] shrink-0 text-[18px] font-semibold leading-[1.09] tracking-[-0.54px] text-[#2d2f2f] md:w-auto md:text-[30px] md:tracking-[-0.91px]"
          >
            {project.name}
          </h2>

          <div className="flex flex-1 shrink-0 flex-col md:w-[50%] md:max-w-[720px] md:flex-none">
            <p
              data-reveal="header"
              className="text-[14px] font-semibold leading-[1.4] tracking-[-0.42px] text-[#2d2f2f] md:text-[15px] md:tracking-[-0.455px]"
            >
              {description}
            </p>

            <div className="mt-[18px] h-px w-full bg-black/[0.08]" />

            <div className="mt-[16px] flex flex-wrap items-start gap-6 md:gap-10">
              <div data-reveal="meta" className="flex flex-col gap-[9px]">
                <span className={metaLabelClass}>Type</span>
                <span className={metaValueClass}>{typeValue}</span>
              </div>
              <div data-reveal="meta" className="flex flex-col gap-[9px]">
                <span className={metaLabelClass}>Credits</span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {credits.map((credit) => (
                    <span
                      key={credit._key}
                      className="text-[14px] font-semibold leading-[1.4] tracking-[-0.42px] md:text-[15px] md:tracking-[-0.455px]"
                    >
                      <span className="text-[#2d2f2f]">{credit.name}</span>{" "}
                      <span className="text-[#959595]">{credit.role}</span>
                    </span>
                  ))}
                </div>
              </div>
              {liveUrl && (
                <a
                  data-reveal="meta"
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[16px] inline-flex w-full shrink-0 items-center justify-between gap-[12px] bg-[#efefef] px-[9px] py-[6px] transition-colors hover:bg-black/[0.08] md:mt-[22px] md:ml-auto md:w-auto md:py-[3px]"
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
                  <span className="text-[14px] font-semibold leading-[1.4] tracking-[-0.42px] text-[#2d2f2f] md:text-[15px] md:tracking-[-0.455px]">
                    Live Site
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        <section className="shrink-0 px-[12px] pb-[48px]">
          <div className="flex flex-col gap-[12px]">
            {content.map((block) => (
              <div key={block._key} data-reveal="block">
                <ContentBlockRenderer block={block} />
              </div>
            ))}
          </div>
        </section>

        <div
          data-reveal="footer"
          className="mt-auto shrink-0 px-[12px] pb-[18px]"
        >
          <div className="border-t border-black/[0.08] pt-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:gap-8">
              <span className="text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.05em] text-black/42">
                © 2026
              </span>
              <span className="max-w-[30rem] text-right text-[14px] font-semibold uppercase leading-[1.25] tracking-[-0.05em] text-black/42">
                We bring ideas to life, and life to ideas, through strategy,
                design, and communication.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-past-end progress indicator */}
      <div
        ref={nextIndicatorRef}
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-[40] flex flex-col items-center gap-[8px] px-[16px] pb-[16px]"
        style={{
          opacity: 0,
          transform: "translateY(20px)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[-0.04em] text-black/50">
          Continue scrolling to next project
        </span>
        <div className="h-[2px] w-[120px] overflow-hidden rounded-full bg-black/10">
          <div
            ref={nextIndicatorFillRef}
            className="h-full w-full origin-left bg-[#2d2f2f]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
