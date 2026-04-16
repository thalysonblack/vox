import Nav from "@/components/nav/Nav";
import Footer from "@/components/footer/Footer";
import PartnerHero from "@/components/partner/PartnerHero";
import PartnerCalculator from "@/components/partner/PartnerCalculator";
import PartnerFAQ from "@/components/partner/PartnerFAQ";
import PartnerCTA from "@/components/partner/PartnerCTA";
import { siteSettingsQuery } from "@/lib/queries";
import { client } from "@/lib/sanity";
import type { SiteSettings } from "@/types/project";

export const metadata = {
  title: "Studio Partner Program — Goodtaste\u00ae",
  description:
    "UI/UX e desenvolvimento nos bastidores do seu projeto. Com o seu nome na frente.",
};

export const revalidate = 60;

export default async function PartnerPage() {
  const settings = await client
    .fetch<SiteSettings | null>(siteSettingsQuery)
    .catch(() => null);

  return (
    <div className="relative min-h-[100dvh] bg-[#fdfdfc]">
      {/* Nav */}
      <div className="px-3 pt-3">
        <Nav settings={settings ?? undefined} />
      </div>

      {/* Hero — full bleed dark */}
      <div className="mt-6">
        <PartnerHero />
      </div>

      {/* Content sections */}
      <main className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1200px]">
          {/* -------------------------------------------------------- */}
          {/* O que e isso?                                            */}
          {/* -------------------------------------------------------- */}
          <section className="border-b border-black/10 py-20 md:py-24">
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                O que &eacute; isso?
              </p>
              <div>
                <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-1.2px] text-black md:text-[36px] md:tracking-[-1.6px]">
                  O que &eacute; o Studio Partner Program?
                </h2>
                <p className="mt-6 max-w-[640px] text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-black/60">
                  A Good Taste trabalha como extens&atilde;o invis&iacute;vel do
                  seu est&uacute;dio, ag&ecirc;ncia ou opera&ccedil;&atilde;o
                  freelance. Entregamos UI/UX e desenvolvimento completo — com o
                  seu nome na frente. O resultado &eacute; seu. O cr&eacute;dito
                  &eacute; seu. O padr&atilde;o &eacute; nosso.
                </p>
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Para quem e?                                             */}
          {/* -------------------------------------------------------- */}
          <section className="border-b border-black/10 py-20 md:py-24">
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                Para quem &eacute;?
              </p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    title: "Est\u00fadios",
                    body: "Demanda maior que a equipe. A gente absorve o excesso sem contratar.",
                  },
                  {
                    title: "Ag\u00eancias",
                    body: "Precisam de execu\u00e7\u00e3o de alto n\u00edvel sem montar time interno de design/dev.",
                  },
                  {
                    title: "Freelancers",
                    body: "Querem entregar sites completos sem terceirizar pra quem n\u00e3o entendem.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="border border-black/10 p-6"
                  >
                    <h3 className="text-[15px] font-semibold tracking-[-0.3px] text-black">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-black/55">
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Como funciona?                                           */}
          {/* -------------------------------------------------------- */}
          <section
            id="como-funciona"
            className="scroll-mt-20 border-b border-black/10 py-20 md:py-24"
          >
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                Como funciona?
              </p>
              <div>
                {/* Steps */}
                <div className="grid gap-6 sm:grid-cols-3">
                  {[
                    {
                      step: "01",
                      title: "Design",
                      body: "Recebemos briefing e copy. Entregamos UI pronta pra aprovar.",
                    },
                    {
                      step: "02",
                      title: "Dev",
                      body: "C\u00f3digo limpo, responsivo, otimizado. Pronto pra publicar.",
                    },
                    {
                      step: "03",
                      title: "Handoff",
                      body: "Deploy no seu dom\u00ednio, com o seu nome. Ningu\u00e9m sabe que a gente existe.",
                    },
                  ].map((s) => (
                    <div key={s.step}>
                      <span className="text-[11px] font-semibold tracking-[-0.35px] text-black/30">
                        {s.step}
                      </span>
                      <h3 className="mt-2 text-[15px] font-semibold tracking-[-0.3px] text-black">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-black/55">
                        {s.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Negation block */}
                <div className="mt-10 border-l-2 border-black pl-6">
                  <p className="text-[14px] font-medium leading-[1.8] tracking-[-0.2px] text-black/60">
                    N&atilde;o aparecemos em reuni&otilde;es. N&atilde;o falamos
                    com o cliente. N&atilde;o assumimos frente de projeto.
                    N&atilde;o entramos sem briefing e copy prontos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Quanto tempo leva?                                       */}
          {/* -------------------------------------------------------- */}
          <section className="border-b border-black/10 py-20 md:py-24">
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                Quanto tempo leva?
              </p>
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    period: "1\u20132 semanas",
                    body: "Landing pages e pe\u00e7as isoladas.",
                  },
                  {
                    period: "2\u20134 semanas",
                    body: "Sites institucionais at\u00e9 5 p\u00e1ginas.",
                  },
                  {
                    period: "4+ semanas",
                    body: "E-commerce, plataformas, projetos sob medida.",
                  },
                ].map((t) => (
                  <div key={t.period}>
                    <h3 className="text-[15px] font-semibold tracking-[-0.3px] text-black">
                      {t.period}
                    </h3>
                    <p className="mt-2 text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-black/55">
                      {t.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* Quanto custa? (Calculator)                               */}
          {/* -------------------------------------------------------- */}
          <section className="border-b border-black/10 py-20 md:py-24">
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                Quanto custa?
              </p>
              <PartnerCalculator />
            </div>
          </section>

          {/* -------------------------------------------------------- */}
          {/* FAQ                                                      */}
          {/* -------------------------------------------------------- */}
          <section className="border-b border-black/10 py-20 md:py-24">
            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
              <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
                D&uacute;vidas
              </p>
              <PartnerFAQ />
            </div>
          </section>
        </div>
      </main>

      {/* CTA — full bleed dark */}
      <PartnerCTA />

      {/* Footer rules */}
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1200px] py-10">
          <p className="max-w-[640px] text-[11px] font-medium leading-[1.7] tracking-[-0.2px] text-black/35">
            Dispon&iacute;vel apenas para parceiros confirmados. Verifique
            disponibilidade antes de comprometer prazos com seu cliente.
            Confirma&ccedil;&atilde;o via pagamento de entrada. Cronograma
            come&ccedil;a com entrada paga.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3">
        <Footer settings={settings ?? undefined} />
      </div>
    </div>
  );
}
