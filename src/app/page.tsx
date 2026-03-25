import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectCarousel from "@/components/ProjectCarousel";
import { client } from "@/lib/sanity";
import { projectsQuery } from "@/lib/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

export default async function Home() {
  const projects = await client.fetch<Project[]>(projectsQuery);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fdfdfc]">
      <div className="shrink-0 px-3 pt-3 pb-3">
        <Nav />
      </div>

      <ProjectCarousel projects={projects} />

      <div className="shrink-0 px-3 pb-3">
        <Footer />
      </div>
    </div>
  );
}
