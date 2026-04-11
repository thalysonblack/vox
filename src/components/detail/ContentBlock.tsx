import Image from "next/image";
import type { ContentBlock } from "@/types/project";

const mediaFrameClass =
  "relative w-full overflow-hidden rounded-[4px] bg-[#2d2d2d]";

export default function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  if (block._type === "imageBlock") {
    const isVertical = block.orientation === "vertical";
    const aspect = isVertical ? "720 / 1020" : "1420 / 770";

    return (
      <div className="w-full">
        <div className={mediaFrameClass} style={{ aspectRatio: aspect }}>
          {block.url && (
            <Image
              src={block.url}
              alt={block.caption || ""}
              fill
              className="object-cover will-change-transform"
              data-parallax-img
              sizes="72vw"
            />
          )}
        </div>
      </div>
    );
  }

  if (block._type === "imagePair") {
    return (
      <div className="grid w-full grid-cols-2 gap-[12px]">
        <div className={mediaFrameClass} style={{ aspectRatio: "700 / 400" }}>
          {block.leftUrl && (
            <Image
              src={block.leftUrl}
              alt=""
              fill
              className="object-cover will-change-transform"
              data-parallax-img
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
              className="object-cover will-change-transform"
              data-parallax-img
              sizes="36vw"
            />
          )}
        </div>
      </div>
    );
  }

  if (block._type === "videoBlock") {
    return (
      <div className={mediaFrameClass} style={{ aspectRatio: "1420 / 799" }}>
        <video src={block.url} controls playsInline className="h-full w-full object-cover" />
      </div>
    );
  }

  if (block._type === "gifBlock") {
    return (
      <div className={mediaFrameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (block._type === "textBlock") {
    return (
      <p className="max-w-[44rem] text-[15px] font-semibold leading-[1.45] tracking-[-0.03em] text-[#2d2f2f]">
        {block.text}
      </p>
    );
  }

  return null;
}
