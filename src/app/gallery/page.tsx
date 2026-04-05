import { client } from "@/lib/sanity";
import { projectsQuery } from "@/lib/queries";
import type { Project } from "@/types/project";
import GalleryClient from "./GalleryClient";

export const revalidate = 60;

export default async function GalleryPage() {
  const projects = await client
    .fetch<Project[]>(projectsQuery)
    .catch(() => [] as Project[]);

  return <GalleryClient projects={projects} />;
}
