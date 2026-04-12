"use client";

import HomeLayout from "@/components/HomeLayout";
import type { ProjectListItem } from "@/types/project";

interface ProjectPageClientProps {
  projects: ProjectListItem[];
  initialSlug: string;
}

export default function ProjectPageClient({
  projects,
  initialSlug,
}: ProjectPageClientProps) {
  return <HomeLayout projects={projects} initialSlug={initialSlug} />;
}
