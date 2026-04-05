import Link from "next/link";

export default function ResourcesHero() {
  return (
    <section className="grid gap-6 border-b border-black/10 pb-8 md:grid-cols-[1.5fr_1fr] md:items-end">
      <div className="space-y-4">
        <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
          Resource hub
        </p>
        <h1 className="max-w-[820px] text-[36px] font-semibold leading-[1.05] tracking-[-1.6px] text-black md:text-[52px]">
          Everything you need to move faster.
        </h1>
        <p className="max-w-[640px] text-[15px] font-medium leading-[1.45] tracking-[-0.24px] text-black/70">
          Explore our central library of links, tools, templates, and practical guides.
          Curated for quick access with the same clear structure used across Vox.
        </p>
      </div>

      <div className="rounded-[8px] border border-black/10 bg-black/[0.03] p-4">
        <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
          Featured action
        </p>
        <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.56px] text-black">
          Submit or update a resource
        </h2>
        <p className="mt-2 text-[14px] font-medium leading-[1.4] tracking-[-0.2px] text-black/65">
          Keep your team shortcuts and references organized in a single place.
        </p>
        <Link
          href="/studio"
          className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black"
        >
          Open Studio
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
