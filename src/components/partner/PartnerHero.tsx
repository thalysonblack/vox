export default function PartnerHero() {
  return (
    <section className="relative bg-black px-5 pb-40 pt-24 md:px-10 md:pb-56 md:pt-36 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-[11vw] font-semibold uppercase leading-[0.88] tracking-[-0.04em] text-white md:text-[8.5vw] lg:text-[120px]">
          Qualquer um
          <br />
          entrega <span className="text-white/20">/</span>
          <br />
          nem todos
          <br />
          entregam o n&iacute;vel
        </h1>

        <div className="mt-20 flex flex-col justify-between gap-10 md:mt-32 md:flex-row md:items-end">
          <p className="max-w-[440px] text-[15px] font-normal leading-[1.65] text-white/45">
            UI/UX e desenvolvimento nos bastidores do seu projeto. Com o seu
            nome na frente. O resultado &eacute; seu. O cr&eacute;dito &eacute;
            seu. O padr&atilde;o &eacute; nosso.
          </p>

          <a
            href="#calculator"
            className="group inline-flex cursor-pointer items-center gap-4 border border-white/20 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
          >
            Ver como funciona
            <span className="transition-transform duration-300 group-hover:translate-y-0.5">
              &darr;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
