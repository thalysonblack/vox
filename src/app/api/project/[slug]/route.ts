import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { projectBySlugQuery } from "@/lib/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const project = await client.fetch<Project | null>(projectBySlugQuery, {
      slug,
    });
    if (!project) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
