export default function PartnerHero() {
  return (
    <section className="relative bg-[#111] px-6 pb-32 pt-20 md:px-12 md:pb-48 md:pt-32 lg:px-20">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
          <span>Studio Partner Program</span>
          <span>2026</span>
        </div>

        <h1 className="mt-16 max-w-[1200px] text-[44px] font-semibold leading-[0.95] tracking-[-2px] text-white md:mt-24 md:text-[76px] md:tracking-[-4px] lg:text-[104px] lg:tracking-[-5px]">
          Qualquer um entrega{" "}
          <span className="text-white/30">&mdash;</span>
          <br className="hidden md:block" />
          nem todos entregam o n&iacute;vel que o cliente mostra pra todo mundo.
        </h1>

        <div className="mt-16 flex flex-col gap-8 md:mt-24 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[480px] text-[15px] font-medium leading-[1.6] tracking-[-0.2px] text-white/50">
            UI/UX e desenvolvimento nos bastidores do seu projeto.
            <br />
            Com o seu nome na frente.
          </p>
          <a
            href="#como-funciona"
            className="inline-flex cursor-pointer items-center gap-3 border border-white/25 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Ver como funciona
            <span aria-hidden className="text-white/40">
              &darr;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
