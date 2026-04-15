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
    <div className="min-h-screen bg-[#fdfdfc]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col px-3 py-3">
        <Nav settings={settings ?? undefined} />

        <main className="pt-16 pb-20 md:pt-24 md:pb-28">
          <RequestHero />
          <div className="mt-16 md:mt-24">
            <RequestForm />
          </div>
        </main>

        <Footer settings={settings ?? undefined} />
      </div>
    </div>
  );
}
