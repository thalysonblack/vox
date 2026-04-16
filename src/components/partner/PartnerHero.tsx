export default function PartnerHero() {
  return (
    <section className="bg-black px-5 pb-36 pt-20 md:px-10 md:pb-52 md:pt-32 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="max-w-[1300px] text-[12vw] font-medium leading-[0.92] tracking-[-0.045em] text-white md:text-[8vw] lg:text-[112px]">
          Qualquer um entrega. Nem todos entregam o n&iacute;vel que o cliente
          mostra pra todo mundo.
        </h1>

        <div className="mt-20 grid gap-10 md:mt-32 md:grid-cols-2 md:gap-20">
          <p className="max-w-[480px] text-[16px] font-normal leading-[1.65] text-white/40">
            Trabalhamos como extens&atilde;o invis&iacute;vel do seu
            est&uacute;dio, ag&ecirc;ncia ou opera&ccedil;&atilde;o freelance.
            UI/UX e desenvolvimento completo nos bastidores — com o seu nome na
            frente.
          </p>

          <div className="flex items-end justify-start md:justify-end">
            <a
              href="#calculator"
              className="group inline-flex cursor-pointer items-center gap-4 border border-white/15 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
            >
              Ver como funciona
              <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                &darr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
