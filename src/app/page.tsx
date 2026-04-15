import HomeLayout from "@/components/HomeLayout";
import { client } from "@/lib/sanity";
import { projectsListQuery, siteSettingsQuery } from "@/lib/queries";
import type { ProjectListItem, SiteSettings } from "@/types/project";

export const revalidate = 60;

export default async function Home() {
  const [projects, settings] = await Promise.all([
    client
      .fetch<ProjectListItem[]>(projectsListQuery)
      .catch(() => [] as ProjectListItem[]),
    client
      .fetch<SiteSettings | null>(siteSettingsQuery)
      .catch(() => null),
  ]);

  return <HomeLayout projects={projects} settings={settings ?? {}} />;
}
