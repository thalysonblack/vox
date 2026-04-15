export default function RequestHero() {
  return (
    <section className="border-b border-black/10 pb-10">
      <div className="flex items-baseline gap-3 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
        <span>Request /</span>
        <span className="text-black/40">briefing.2026</span>
      </div>

      <h1 className="mt-10 max-w-[1100px] text-[64px] font-semibold leading-[0.95] tracking-[-3px] text-black md:text-[120px] md:tracking-[-5px]">
        Start a brief
      </h1>
      <p className="mt-6 max-w-[560px] text-[14px] font-medium leading-[1.5] tracking-[-0.2px] text-black/60">
        Preencha com o máximo de contexto que puder — quanto mais claro o
        pedido, mais rápido a gente devolve uma proposta com escopo, prazo e
        direção criativa.
      </p>
    </section>
  );
}
