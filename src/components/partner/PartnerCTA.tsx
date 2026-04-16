export default function PartnerCTA() {
  return (
    <section className="bg-black px-5 py-36 md:px-10 md:py-52 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
          Contato
        </p>

        <h2 className="mt-10 max-w-[1100px] text-[10vw] font-medium leading-[0.92] tracking-[-0.045em] text-white md:text-[7vw] lg:text-[96px]">
          Enquanto voc&ecirc; fecha o pr&oacute;ximo, a gente garante que o
          atual vire refer&ecirc;ncia.
        </h2>

        <p className="mt-12 text-[16px] font-normal text-white/40">
          Vamos conversar.
        </p>

        <a
          href="https://wa.me/5564984175364"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[16px] font-medium text-white underline decoration-white/25 underline-offset-4 transition-colors duration-200 hover:decoration-white"
        >
          hello@thegoodtaste.cc
        </a>

        <div className="mt-14">
          <a
            href="https://wa.me/5564984175364"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex cursor-pointer items-center gap-4 border border-white/15 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
          >
            Iniciar conversa
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
