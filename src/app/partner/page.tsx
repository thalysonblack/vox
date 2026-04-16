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
  title: "Studio Partner Program \u2014 Goodtaste\u00ae",
  description:
    "UI/UX e desenvolvimento nos bastidores do seu projeto. Com o seu nome na frente.",
};

export const revalidate = 60;

export default async function PartnerPage() {
  const settings = await client
    .fetch<SiteSettings | null>(siteSettingsQuery)
    .catch(() => null);

  return (
    <div className="relative min-h-[100dvh] bg-[#111]">
      {/* Nav — full bleed on dark bg */}
      <div className="px-3 pt-3">
        <Nav settings={settings ?? undefined} />
      </div>

      {/* Hero — dark */}
      <PartnerHero />

      {/* ============================================================ */}
      {/*  WHITE CARD: O que e / Para quem / Como funciona / Prazos    */}
      {/* ============================================================ */}
      <div className="bg-[#fdfdfc]">
        <main className="mx-auto max-w-[1400px] px-6 md:px-12 lg:px-20">
          {/* O que e isso? */}
          <section className="border-b border-black/10 py-20 md:py-28">
            <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              <span>01 Sobre o programa</span>
              <span>goodtaste.cc/partner</span>
            </div>
            <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[1fr_1fr] md:gap-20">
              <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-1.2px] text-black md:text-[36px] md:tracking-[-1.6px]">
                O resultado &eacute; seu.
                <br />
                O cr&eacute;dito &eacute; seu.
                <br />
                O padr&atilde;o &eacute; nosso.
              </h2>
              <div className="space-y-6">
                <p className="text-[15px] font-medium leading-[1.65] tracking-[-0.2px] text-black/55">
                  A Good Taste trabalha como extens&atilde;o invis&iacute;vel do
                  seu est&uacute;dio, ag&ecirc;ncia ou opera&ccedil;&atilde;o
                  freelance. Entregamos UI/UX e desenvolvimento completo — com o
                  seu nome na frente.
                </p>
                <p className="text-[15px] font-medium leading-[1.65] tracking-[-0.2px] text-black/55">
                  Voc&ecirc; mant&eacute;m o relacionamento com o cliente.
                  A gente cuida da execu&ccedil;&atilde;o nos bastidores.
                  White-label do briefing ao deploy.
                </p>
              </div>
            </div>
          </section>

          {/* Para quem e? */}
          <section className="border-b border-black/10 py-20 md:py-28">
            <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              <span>02 Para quem &eacute;</span>
            </div>
            <h2 className="mt-12 max-w-[900px] text-[32px] font-semibold leading-[1.05] tracking-[-1.4px] text-black md:mt-16 md:text-[48px] md:tracking-[-2.2px]">
              Tr&ecirc;s perfis. Um padr&atilde;o.
            </h2>
            <div className="mt-12 grid gap-px bg-black/10 sm:grid-cols-3">
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
                <div key={card.title} className="bg-[#fdfdfc] p-8">
                  <h3 className="text-[16px] font-semibold tracking-[-0.4px] text-black">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-black/50">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Como funciona? */}
          <section
            id="como-funciona"
            className="scroll-mt-20 border-b border-black/10 py-20 md:py-28"
          >
            <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              <span>03 Processo</span>
            </div>
            <h2 className="mt-12 max-w-[900px] text-[32px] font-semibold leading-[1.05] tracking-[-1.4px] text-black md:mt-16 md:text-[48px] md:tracking-[-2.2px]">
              Tr&ecirc;s etapas. Sem reuni&atilde;o.
            </h2>
            <div className="mt-12 grid gap-px bg-black/10 sm:grid-cols-3">
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
                <div key={s.step} className="bg-[#fdfdfc] p-8">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-black/25">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.4px] text-black">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-black/50">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 border-l-2 border-black py-1 pl-6">
              <p className="text-[14px] font-medium leading-[2] tracking-[-0.2px] text-black/55">
                N&atilde;o aparecemos em reuni&otilde;es.
                <br />
                N&atilde;o falamos com o cliente.
                <br />
                N&atilde;o assumimos frente de projeto.
                <br />
                N&atilde;o entramos sem briefing e copy prontos.
              </p>
            </div>
          </section>

          {/* Quanto tempo? */}
          <section className="py-20 md:py-28">
            <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              <span>04 Prazos</span>
            </div>
            <h2 className="mt-12 max-w-[900px] text-[32px] font-semibold leading-[1.05] tracking-[-1.4px] text-black md:mt-16 md:text-[48px] md:tracking-[-2.2px]">
              Quanto tempo leva?
            </h2>
            <div className="mt-12 grid gap-px bg-black/10 sm:grid-cols-3">
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
                <div key={t.period} className="bg-[#fdfdfc] p-8">
                  <h3 className="text-[20px] font-semibold tracking-[-0.6px] text-black">
                    {t.period}
                  </h3>
                  <p className="mt-3 text-[14px] font-medium leading-[1.6] tracking-[-0.2px] text-black/50">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* ============================================================ */}
      {/*  DARK: Calculator                                            */}
      {/* ============================================================ */}
      <section className="bg-[#111] px-6 py-20 md:px-12 md:py-28 lg:px-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            <span>05 Investimento</span>
          </div>
          <h2 className="mt-12 max-w-[800px] text-[32px] font-semibold leading-[1.05] tracking-[-1.4px] text-white md:mt-16 md:text-[48px] md:tracking-[-2.2px]">
            Quanto custa?
          </h2>
          <div className="mt-12">
            <PartnerCalculator />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WHITE: FAQ                                                  */}
      {/* ============================================================ */}
      <section className="bg-[#111] px-6 py-20 md:px-12 md:py-28 lg:px-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 md:grid-cols-[280px_1fr] md:gap-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
                D&uacute;vidas
              </p>
              <h2 className="mt-6 text-[28px] font-semibold leading-[1.1] tracking-[-1.2px] text-white md:text-[36px] md:tracking-[-1.6px]">
                Perguntas frequentes
              </h2>
            </div>
            <PartnerFAQ />
          </div>
        </div>
      </section>

      {/* CTA — dark */}
      <PartnerCTA />

      {/* Footer rules */}
      <div className="bg-[#111] px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1400px] border-t border-white/10 py-10">
          <p className="max-w-[640px] text-[11px] font-medium leading-[1.7] tracking-[-0.15px] text-white/25">
            Dispon&iacute;vel apenas para parceiros confirmados. Verifique
            disponibilidade antes de comprometer prazos com seu cliente.
            Confirma&ccedil;&atilde;o via pagamento de entrada. Cronograma
            come&ccedil;a com entrada paga.
          </p>
        </div>
      </div>

      {/* Footer — on dark bg */}
      <div className="bg-[#111] px-3 pb-3">
        <Footer settings={settings ?? undefined} />
      </div>
    </div>
  );
}
