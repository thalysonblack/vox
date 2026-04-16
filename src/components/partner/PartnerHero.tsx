export default function PartnerHero() {
  return (
    <section className="bg-[#111] px-6 py-24 text-white md:px-12 md:py-32 lg:px-20 lg:py-40">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-baseline gap-3 text-[12px] font-semibold uppercase tracking-[-0.42px] text-white/55">
          <span>Partner /</span>
          <span className="text-white/40">studio.2026</span>
        </div>

        <h1 className="mt-10 max-w-[900px] text-[36px] font-semibold leading-[1.05] tracking-[-1.6px] text-white md:text-[56px] md:tracking-[-2.8px] lg:text-[64px] lg:tracking-[-3.2px]">
          Qualquer um entrega. Nem todos entregam o n&iacute;vel que o cliente
          mostra pra todo mundo.
        </h1>

        <p className="mt-8 max-w-[560px] text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-white/60">
          UI/UX e desenvolvimento nos bastidores do seu projeto. Com o seu nome
          na frente.
        </p>

        <a
          href="#como-funciona"
          className="mt-10 inline-flex cursor-pointer items-center gap-4 border border-white bg-white px-8 py-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black transition-colors hover:bg-transparent hover:text-white"
        >
          Ver como funciona
          <span aria-hidden className="text-[14px]">
            &#8595;
          </span>
        </a>
      </div>
    </section>
  );
}
