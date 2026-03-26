import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { projectSchema } from "./sanity/schemas/project";

export default defineConfig({
  name: "vox-studio",
  title: "Vox Studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [structureTool()],
  schema: {
    types: [projectSchema],
  },
});
