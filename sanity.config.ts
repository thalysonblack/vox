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
            S.divider(),
            // Brief Requests — grouped CRM view. Default goes straight to
            // "New" so inbound leads are the first thing the team sees.
            S.listItem()
              .title("Brief Requests")
              .icon(() => "📥")
              .child(
                S.list()
                  .title("Brief Requests")
                  .items([
                    S.listItem()
                      .title("New")
                      .child(
                        S.documentList()
                          .title("New briefs")
                          .filter('_type == "briefRequest" && status == "new"')
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Reviewing")
                      .child(
                        S.documentList()
                          .title("Reviewing")
                          .filter(
                            '_type == "briefRequest" && status == "reviewing"',
                          )
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Contacted")
                      .child(
                        S.documentList()
                          .title("Contacted")
                          .filter(
                            '_type == "briefRequest" && status == "contacted"',
                          )
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Won")
                      .child(
                        S.documentList()
                          .title("Won")
                          .filter('_type == "briefRequest" && status == "won"')
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Lost")
                      .child(
                        S.documentList()
                          .title("Lost")
                          .filter('_type == "briefRequest" && status == "lost"')
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Archived")
                      .child(
                        S.documentList()
                          .title("Archived")
                          .filter(
                            '_type == "briefRequest" && status == "archived"',
                          )
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                    S.divider(),
                    S.listItem()
                      .title("All briefs")
                      .child(
                        S.documentList()
                          .title("All briefs")
                          .filter('_type == "briefRequest"')
                          .defaultOrdering([
                            { field: "submittedAt", direction: "desc" },
                          ]),
                      ),
                  ]),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
