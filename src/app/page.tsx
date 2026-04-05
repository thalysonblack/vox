import HomeLayout from "@/components/HomeLayout";
import { client } from "@/lib/sanity";
import { projectsListQuery } from "@/lib/queries";
import type { ProjectListItem } from "@/types/project";

export const revalidate = 60;

export default async function Home() {
  const projects = await client
    .fetch<ProjectListItem[]>(projectsListQuery)
    .catch(() => [] as ProjectListItem[]);

  return <HomeLayout projects={projects} />;
}
