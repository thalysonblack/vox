import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ResourcesGrid from "@/components/resources/ResourcesGrid";
import ResourcesHero from "@/components/resources/ResourcesHero";
import { resourcesQuery } from "@/lib/queries";
import { client } from "@/lib/sanity";
import type { ResourceItem } from "@/types/resource";

export const revalidate = 60;

export default async function ResourcesPage() {
  const resources = await client
    .fetch<ResourceItem[]>(resourcesQuery)
    .catch(() => [] as ResourceItem[]);

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col px-3 py-3">
        <Nav />

        <main className="space-y-8 pt-8 pb-10">
          <ResourcesHero />
          <ResourcesGrid resources={resources} />
        </main>

        <Footer />
      </div>
    </div>
  );
}
