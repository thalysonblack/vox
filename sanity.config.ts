import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { schemaTypes } from "./sanity/schemas";
import BriefKanban from "./sanity/components/BriefKanban";

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
            S.divider(),
            // Brief Requests — custom kanban board (drag to change status).
            // A secondary "All briefs" flat list sits alongside for search
            // and bulk operations.
            S.listItem()
              .title("Brief Requests")
              .icon(() => "📥")
              .child(
                S.component(BriefKanban)
                  .title("Brief Requests — Kanban")
                  .id("brief-kanban"),
              ),
            S.listItem()
              .title("All briefs (list)")
              .child(
                S.documentList()
                  .title("All briefs")
                  .filter('_type == "briefRequest"')
                  .defaultOrdering([
                    { field: "submittedAt", direction: "desc" },
                  ]),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
