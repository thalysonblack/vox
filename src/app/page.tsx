import HomeLayout from "@/components/HomeLayout";
import { client } from "@/lib/sanity";
import { projectsListQuery } from "@/lib/queries";
import { getSiteSettings, resolveScrollPhysics } from "@/lib/siteSettings";
import type { ProjectListItem } from "@/types/project";

export const revalidate = 60;

export default async function Home() {
  const [projects, settings] = await Promise.all([
    client
      .fetch<ProjectListItem[]>(projectsListQuery)
      .catch(() => [] as ProjectListItem[]),
    getSiteSettings(),
  ]);
  const scrollPhysics = resolveScrollPhysics(settings);

  return <HomeLayout projects={projects} scrollPhysics={scrollPhysics} />;
}
