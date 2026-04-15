import Nav from "@/components/nav/Nav";
import Footer from "@/components/footer/Footer";
import RequestHero from "@/components/request/RequestHero";
import RequestForm from "@/components/request/RequestForm";
import { siteSettingsQuery } from "@/lib/queries";
import { client } from "@/lib/sanity";
import type { SiteSettings } from "@/types/project";

export const metadata = {
  title: "Request — Goodtaste®",
  description:
    "Comece um briefing com a Goodtaste. Conte o contexto do projeto e recebemos no nosso board.",
};

export const revalidate = 60;

export default async function RequestPage() {
  const settings = await client
    .fetch<SiteSettings | null>(siteSettingsQuery)
    .catch(() => null);

  return (
    <div className="relative min-h-[100dvh] bg-[#fdfdfc]">
      {/* Nav — full-bleed, same padding as home so the logo sits in the
          same spot regardless of page. */}
      <div className="px-3 pt-3">
        <Nav settings={settings ?? undefined} />
      </div>

      {/* Form content — inner max-width for comfortable reading line
          length, not tied to the nav container width. */}
      <main className="px-3 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px]">
          <RequestHero />
          <div className="mt-16 md:mt-24">
            <RequestForm />
          </div>
        </div>
      </main>

      <div className="px-3 pb-3">
        <Footer settings={settings ?? undefined} />
      </div>
    </div>
  );
}
