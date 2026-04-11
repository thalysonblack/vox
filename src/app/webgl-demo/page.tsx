import { client } from "@/lib/sanity";
import { projectsListQuery } from "@/lib/queries";
import type { ProjectListItem } from "@/types/project";
import WebGLDemoClient from "./WebGLDemoClient";

export const revalidate = 60;

export default async function WebGLDemoPage() {
  const projects: ProjectListItem[] = await client
    .fetch(projectsListQuery)
    .catch(() => []);

  return <WebGLDemoClient projects={projects} />;
}
