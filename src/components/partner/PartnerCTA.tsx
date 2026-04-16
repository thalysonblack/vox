export default function PartnerCTA() {
  return (
    <section className="bg-[#111] px-6 py-28 md:px-12 md:py-40 lg:px-20">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-[1100px] text-[32px] font-semibold leading-[1] tracking-[-1.6px] text-white md:text-[56px] md:tracking-[-3px] lg:text-[76px] lg:tracking-[-4px]">
          Enquanto voc&ecirc; fecha o pr&oacute;ximo
          <span className="text-white/30"> &mdash; </span>
          a gente garante que o atual vire refer&ecirc;ncia.
        </h2>

        <div className="mt-14 flex flex-col gap-6 md:mt-20 md:flex-row md:items-center md:gap-10">
          <a
            href="https://wa.me/5564984175364"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-3 bg-white px-8 py-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-black transition-opacity hover:opacity-80"
          >
            Iniciar conversa
            <span aria-hidden>&rarr;</span>
          </a>
          <span className="text-[12px] font-medium tracking-[-0.2px] text-white/30">
            Respondemos em at&eacute; 24h
          </span>
        </div>
      </div>
    </section>
  );
}
