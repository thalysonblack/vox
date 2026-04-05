import Image from "next/image";

export default function Footer() {
  return (
    <footer className="pt-4">
      {/* Divider */}
      <div className="mb-6 h-px w-full">
        <Image
          src="/assets/divider-line.svg"
          alt=""
          width={1872}
          height={1}
          className="h-px w-full"
        />
      </div>

      {/* Footer content */}
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-0">
        <p className="text-[11px] font-semibold uppercase leading-[1.25] tracking-[-0.4px] text-black/45 md:text-[14px] md:tracking-[-0.64px]">
          © 2026
        </p>
        <p className="max-w-[345px] text-left text-[11px] font-sans font-semibold uppercase leading-[1.25] tracking-[-0.4px] text-black/45 md:text-[14px] md:tracking-[-0.64px]">
          We bring ideas to life, and life to ideas, through strategy, design,
          and communication.
        </p>
      </div>
    </footer>
  );
}
