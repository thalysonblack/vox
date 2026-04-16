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
    <div className="relative min-h-[100dvh] bg-black text-white">
      {/* Nav */}
      <div className="px-5 pt-4 md:px-10 lg:px-16">
        <Nav settings={settings ?? undefined} />
      </div>

      {/* Hero */}
      <PartnerHero />

      {/* ─── O que &eacute; ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            O programa
          </p>
          <h2 className="mt-10 max-w-[900px] text-[8vw] font-medium leading-[0.94] tracking-[-0.04em] text-white md:text-[5.5vw] lg:text-[72px]">
            O resultado &eacute; seu. O cr&eacute;dito &eacute; seu. O
            padr&atilde;o &eacute; nosso.
          </h2>
          <p className="mt-12 max-w-[520px] text-[16px] font-normal leading-[1.65] text-white/40">
            Trabalhamos nos bastidores como extens&atilde;o invis&iacute;vel.
            Voc&ecirc; mant&eacute;m o relacionamento e o cr&eacute;dito. A
            gente cuida da execu&ccedil;&atilde;o. White-label do briefing ao
            deploy.
          </p>
        </div>
      </section>

      {/* ─── Para quem ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            Para quem &eacute;
          </p>
          <p className="mt-10 max-w-[640px] text-[16px] font-normal leading-[1.65] text-white/40">
            Criado para quem j&aacute; tem o cliente e s&oacute; precisa de um
            time de execu&ccedil;&atilde;o que n&atilde;o vai complicar o
            processo.
          </p>

          <div className="mt-16 grid border-t border-white/[0.06] sm:grid-cols-3">
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
            ].map((card, i) => (
              <div
                key={card.title}
                className={`border-b border-white/[0.06] py-10 ${
                  i > 0 ? "sm:border-l sm:pl-10" : ""
                } ${i < 2 ? "sm:pr-10" : ""}`}
              >
                <h3 className="text-[18px] font-medium tracking-[-0.02em] text-white">
                  {card.title}
                </h3>
                <p className="mt-4 text-[14px] font-normal leading-[1.7] text-white/30">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Capabilities / Como funciona ─── */}
      <section
        id="como-funciona"
        className="scroll-mt-20 border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16"
      >
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            Capabilities
          </p>
          <h2 className="mt-10 max-w-[900px] text-[8vw] font-medium leading-[0.94] tracking-[-0.04em] text-white md:text-[5.5vw] lg:text-[72px]">
            Design, Dev, Handoff.
          </h2>
          <p className="mt-12 max-w-[520px] text-[16px] font-normal leading-[1.65] text-white/40">
            Tr&ecirc;s etapas, sem reuni&atilde;o. Voc&ecirc; envia o briefing,
            a gente devolve o projeto pronto.
          </p>

          <div className="mt-16 grid border-t border-white/[0.06] sm:grid-cols-3">
            {[
              {
                title: "Design",
                services: [
                  "UI/UX Design",
                  "Responsive Layout",
                  "Design System",
                  "Prototipagem",
                ],
              },
              {
                title: "Dev",
                services: [
                  "Frontend Development",
                  "CMS Integration",
                  "Performance Optimization",
                  "Responsividade",
                ],
              },
              {
                title: "Handoff",
                services: [
                  "Deploy & Configura\u00e7\u00e3o",
                  "Documenta\u00e7\u00e3o",
                  "QA & Testes",
                  "Suporte p\u00f3s-entrega",
                ],
              },
            ].map((cap, i) => (
              <div
                key={cap.title}
                className={`border-b border-white/[0.06] py-10 ${
                  i > 0 ? "sm:border-l sm:pl-10" : ""
                } ${i < 2 ? "sm:pr-10" : ""}`}
              >
                <h3 className="text-[18px] font-medium tracking-[-0.02em] text-white">
                  {cap.title}
                </h3>
                <ul className="mt-5 space-y-2">
                  {cap.services.map((s) => (
                    <li
                      key={s}
                      className="text-[14px] font-normal text-white/30"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-[560px] border-l border-white/[0.06] pl-8">
            <p className="text-[15px] font-normal leading-[2] text-white/25">
              N&atilde;o aparecemos em reuni&otilde;es.
              <br />
              N&atilde;o falamos com o cliente.
              <br />
              N&atilde;o assumimos frente de projeto.
              <br />
              N&atilde;o entramos sem briefing e copy prontos.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Prazos ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            Prazos
          </p>

          <div className="mt-16 grid border-t border-white/[0.06] sm:grid-cols-3">
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
            ].map((t, i) => (
              <div
                key={t.period}
                className={`border-b border-white/[0.06] py-10 ${
                  i > 0 ? "sm:border-l sm:pl-10" : ""
                } ${i < 2 ? "sm:pr-10" : ""}`}
              >
                <h3 className="text-[22px] font-medium tracking-[-0.03em] text-white">
                  {t.period}
                </h3>
                <p className="mt-3 text-[14px] font-normal leading-[1.7] text-white/30">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Calculator ─── */}
      <section
        id="calculator"
        className="scroll-mt-20 border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16"
      >
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            Investimento
          </p>
          <h2 className="mt-10 max-w-[900px] text-[8vw] font-medium leading-[0.94] tracking-[-0.04em] text-white md:text-[5.5vw] lg:text-[72px]">
            Quanto custa.
          </h2>
          <div className="mt-20">
            <PartnerCalculator />
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-16 md:grid-cols-[340px_1fr] md:gap-24">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
                FAQ
              </p>
              <h2 className="mt-10 text-[28px] font-medium leading-[1.1] tracking-[-0.03em] text-white md:text-[36px]">
                Perguntas frequentes
              </h2>
            </div>
            <PartnerFAQ />
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="border-t border-white/[0.06]">
        <PartnerCTA />
      </div>

      {/* Footer rules */}
      <div className="border-t border-white/[0.06] bg-black px-5 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1440px] py-10">
          <p className="max-w-[560px] text-[12px] font-normal leading-[1.8] text-white/15">
            Dispon&iacute;vel apenas para parceiros confirmados. Verifique
            disponibilidade antes de comprometer prazos com seu cliente.
            Confirma&ccedil;&atilde;o via pagamento de entrada. Cronograma
            come&ccedil;a com entrada paga.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black px-5 pb-5 md:px-10 lg:px-16">
        <Footer settings={settings ?? undefined} />
      </div>
    </div>
  );
}
