export default function PartnerCTA() {
  return (
    <section className="bg-[#111] px-6 py-24 text-white md:px-12 md:py-32 lg:px-20 lg:py-40">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="max-w-[800px] text-[32px] font-semibold leading-[1.05] tracking-[-1.4px] text-white md:text-[48px] md:tracking-[-2.4px]">
          Enquanto voc&ecirc; fecha o pr&oacute;ximo, a gente garante que o
          atual vire refer&ecirc;ncia.
        </h2>

        <a
          href="https://wa.me/5564984175364"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex cursor-pointer items-center gap-4 border border-white bg-white px-8 py-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black transition-colors hover:bg-transparent hover:text-white"
        >
          Iniciar conversa
          <span aria-hidden className="text-[14px]">
            &#8599;
          </span>
        </a>
      </div>
    </section>
  );
}
