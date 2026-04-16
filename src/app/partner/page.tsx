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
      <div className="px-5 pt-3 md:px-10 lg:px-16">
        <Nav settings={settings ?? undefined} />
      </div>

      {/* Hero */}
      <PartnerHero />

      {/* ─── Marquee divider ─── */}
      <div className="overflow-hidden border-y border-white/[0.06] bg-black py-5">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="mx-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/15"
            >
              White-label &middot; UI/UX &middot; Development &middot; Branding
              &middot; Handoff
            </span>
          ))}
        </div>
      </div>

      {/* ─── O que &eacute; ─── */}
      <section className="bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-16 md:grid-cols-2 md:gap-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
                O programa
              </p>
              <h2 className="mt-8 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white md:text-[44px]">
                O resultado &eacute; seu.
                <br />
                O cr&eacute;dito &eacute; seu.
                <br />
                O padr&atilde;o &eacute; nosso.
              </h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="max-w-[480px] text-[15px] font-normal leading-[1.7] text-white/40">
                A Good Taste trabalha como extens&atilde;o invis&iacute;vel do
                seu est&uacute;dio, ag&ecirc;ncia ou opera&ccedil;&atilde;o
                freelance. Entregamos UI/UX e desenvolvimento completo — com o
                seu nome na frente. Voc&ecirc; mant&eacute;m o relacionamento.
                A gente cuida da execu&ccedil;&atilde;o.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Para quem ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
            Para quem &eacute;
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
                className={`border-b border-white/[0.06] py-10 pr-8 ${
                  i > 0 ? "sm:border-l sm:pl-8" : ""
                }`}
              >
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">
                  {card.title}
                </h3>
                <p className="mt-4 text-[14px] font-normal leading-[1.7] text-white/35">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como funciona ─── */}
      <section
        id="como-funciona"
        className="scroll-mt-20 border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16"
      >
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
            Processo
          </p>
          <h2 className="mt-8 text-[9vw] font-semibold uppercase leading-[0.88] tracking-[-0.04em] text-white md:text-[7vw] lg:text-[88px]">
            Design <span className="text-white/20">/</span> Dev{" "}
            <span className="text-white/20">/</span> Handoff
          </h2>

          <div className="mt-20 grid border-t border-white/[0.06] sm:grid-cols-3">
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
            ].map((s, i) => (
              <div
                key={s.step}
                className={`border-b border-white/[0.06] py-10 pr-8 ${
                  i > 0 ? "sm:border-l sm:pl-8" : ""
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/20">
                  {s.step}
                </span>
                <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-white">
                  {s.title}
                </h3>
                <p className="mt-3 text-[14px] font-normal leading-[1.7] text-white/35">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 border-l border-white/[0.08] pl-8">
            <p className="text-[14px] font-normal leading-[2.2] text-white/30">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
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
                className={`border-b border-white/[0.06] py-10 pr-8 ${
                  i > 0 ? "sm:border-l sm:pl-8" : ""
                }`}
              >
                <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-white">
                  {t.period}
                </h3>
                <p className="mt-3 text-[14px] font-normal leading-[1.7] text-white/35">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
            Investimento
          </p>
          <h2 className="mt-8 text-[9vw] font-semibold uppercase leading-[0.88] tracking-[-0.04em] text-white md:text-[7vw] lg:text-[88px]">
            Quanto custa
          </h2>
          <div className="mt-20">
            <PartnerCalculator />
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-white/[0.06] bg-black px-5 py-32 md:px-10 md:py-44 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-16 md:grid-cols-[320px_1fr] md:gap-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
                FAQ
              </p>
              <h2 className="mt-8 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-[36px]">
                Perguntas
                <br />
                frequentes
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
          <p className="max-w-[560px] text-[11px] font-normal leading-[1.8] text-white/15">
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
