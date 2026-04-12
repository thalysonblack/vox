"use client";

import HomeLayout from "@/components/HomeLayout";
import type { ProjectListItem } from "@/types/project";
import type { ResolvedScrollPhysics } from "@/types/settings";

interface ProjectPageClientProps {
  projects: ProjectListItem[];
  initialSlug: string;
  scrollPhysics?: ResolvedScrollPhysics;
}

export default function ProjectPageClient({
  projects,
  initialSlug,
  scrollPhysics,
}: ProjectPageClientProps) {
  return (
    <HomeLayout
      projects={projects}
      initialSlug={initialSlug}
      scrollPhysics={scrollPhysics}
    />
  );
}
