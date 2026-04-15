import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { schemaTypes } from "./sanity/schemas";

export default defineConfig({
  name: "default",
  title: "Good Taste Studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title("Content")
          .items([
            // Site settings as a singleton (one editable document)
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
            S.divider(),
            // Projects with drag-to-reorder via the orderable list
            orderableDocumentListDeskItem({
              type: "project",
              title: "Projects",
              S,
              context,
            }),
            // Resources (default list)
            S.documentTypeListItem("resourceItem").title("Resources"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
