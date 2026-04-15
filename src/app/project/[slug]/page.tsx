import { notFound } from "next/navigation";
import { client } from "@/lib/sanity";
import { projectsListQuery, siteSettingsQuery } from "@/lib/queries";
import type { ProjectListItem, SiteSettings } from "@/types/project";
import ProjectPageClient from "./ProjectPageClient";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [projects, settings] = await Promise.all([
    client
      .fetch<ProjectListItem[]>(projectsListQuery)
      .catch(() => [] as ProjectListItem[]),
    client
      .fetch<SiteSettings | null>(siteSettingsQuery)
      .catch(() => null),
  ]);

  const exists = projects.some((p) => p.id === slug);
  if (!exists) notFound();

  return (
    <ProjectPageClient
      projects={projects}
      settings={settings ?? {}}
      initialSlug={slug}
    />
  );
}
