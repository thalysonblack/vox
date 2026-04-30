export default function RequestHero() {
  return (
    <section className="border-b border-black/10 pb-7 md:pb-10">
      <div className="flex items-baseline gap-3 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
        <span>Request /</span>
        <span className="text-black/40">briefing.2026</span>
      </div>

      <h1 className="mt-5 max-w-[1100px] text-[44px] font-semibold leading-[0.95] tracking-[-2px] text-black md:mt-10 md:text-[96px] md:tracking-[-4px]">
        Start a brief
      </h1>
      <p className="mt-4 max-w-[560px] text-[14px] font-medium leading-[1.5] tracking-[-0.2px] text-black/60 md:mt-6">
        Preencha com o máximo de contexto que puder — quanto mais claro o
        pedido, mais rápido a gente devolve uma proposta com escopo, prazo e
        direção criativa.
      </p>
    </section>
  );
}
