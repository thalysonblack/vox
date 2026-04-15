"use client";

import HomeLayout from "@/components/HomeLayout";
import type { ProjectListItem, SiteSettings } from "@/types/project";

interface ProjectPageClientProps {
  projects: ProjectListItem[];
  settings: SiteSettings;
  initialSlug: string;
}

export default function ProjectPageClient({
  projects,
  settings,
  initialSlug,
}: ProjectPageClientProps) {
  return (
    <HomeLayout
      projects={projects}
      settings={settings}
      initialSlug={initialSlug}
    />
  );
}
