export default function PartnerCTA() {
  return (
    <section className="bg-black px-5 py-36 md:px-10 md:py-52 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
          Pr&oacute;ximo passo
        </p>

        <h2 className="mt-10 text-[9vw] font-semibold uppercase leading-[0.88] tracking-[-0.04em] text-white md:text-[7vw] lg:text-[96px]">
          Enquanto voc&ecirc;
          <br />
          fecha o pr&oacute;ximo
          <span className="text-white/20"> /</span>
          <br />
          a gente garante
          <br />
          que o atual vire
          <br />
          refer&ecirc;ncia
        </h2>

        <div className="mt-16 flex flex-col gap-6 md:mt-24 md:flex-row md:items-center md:gap-10">
          <a
            href="https://wa.me/5564984175364"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex cursor-pointer items-center gap-4 border border-white/20 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
          >
            Iniciar conversa
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
          <span className="text-[11px] font-normal tracking-[0.04em] text-white/20">
            Respondemos em at&eacute; 24h
          </span>
        </div>
      </div>
    </section>
  );
}
