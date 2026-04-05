import Image from "next/image";
import type { ResourceItem } from "@/types/resource";

interface ResourceCardProps {
  resource: ResourceItem;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[8px] border border-black/10 bg-white p-4 transition-colors hover:border-black/25">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[-0.4px] text-black/50">
            {resource.category}
          </p>
          {resource.featured ? (
            <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[-0.32px] text-white">
              Destaque
            </span>
          ) : null}
        </div>

        <h3 className="text-[20px] font-semibold leading-[1.15] tracking-[-0.72px] text-black">
          {resource.title}
        </h3>

        {resource.description ? (
          <p className="text-[14px] leading-[1.45] tracking-[-0.2px] text-black/65">
            {resource.description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/10 pt-3">
        <div className="flex items-center gap-2">
          {resource.icon ? (
            <Image
              src={resource.icon}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] rounded-[4px] object-cover"
            />
          ) : null}
          <span className="text-[11px] font-semibold uppercase tracking-[-0.4px] text-black/50">
            {resource.type.replace("_", " ")}
          </span>
        </div>

        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold uppercase tracking-[-0.4px] text-black"
        >
          Abrir →
        </a>
      </div>
    </article>
  );
}
