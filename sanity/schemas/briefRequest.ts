import { defineField, defineType } from "sanity";

export const briefRequestSchema = defineType({
  name: "briefRequest",
  title: "Brief Request",
  type: "document",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Reviewing", value: "reviewing" },
          { title: "Contacted", value: "contacted" },
          { title: "Won", value: "won" },
          { title: "Lost", value: "lost" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "contactName",
      title: "Contact name",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
    }),
    defineField({
      name: "company",
      title: "Company",
      type: "string",
    }),
    defineField({
      name: "workFor",
      title: "Work for",
      description: "Own company or another brand (agency/representative).",
      type: "string",
      options: {
        list: [
          { title: "Own company", value: "own" },
          { title: "Another brand / client", value: "other" },
        ],
      },
    }),
    defineField({
      name: "brand",
      title: "Brand",
      description: "Only when work is for another brand (agency flow).",
      type: "string",
    }),
    defineField({
      name: "referenceLinks",
      title: "Reference links",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "requestType",
      title: "Request type",
      type: "string",
      options: {
        list: [
          { title: "Web design", value: "webdesign" },
          { title: "Brand identity (CI)", value: "branding" },
          { title: "Packaging", value: "embalagem" },
          { title: "Presentations", value: "apresentacoes" },
          { title: "Illustrations", value: "ilustracoes" },
          { title: "3D mockups & models", value: "mockups3d" },
          { title: "Print design", value: "impressao" },
          { title: "Product & apparel prints", value: "estampas" },
          { title: "E-books & one-pagers", value: "ebooks" },
          { title: "Email templates", value: "email" },
          { title: "Ads / social media", value: "ads" },
          { title: "Other", value: "outro" },
        ],
      },
    }),
    defineField({
      name: "requestSubtype",
      title: "Request subtype",
      type: "string",
    }),
    defineField({
      name: "creativeLevel",
      title: "Creative level",
      type: "string",
      options: {
        list: [
          { title: "Minimal", value: "minimo" },
          { title: "Moderate", value: "moderado" },
          { title: "World-class", value: "world-class" },
        ],
      },
    }),
    defineField({
      name: "deadline",
      title: "Deadline",
      type: "date",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "notes",
      title: "Internal notes",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "payload",
      title: "Raw payload",
      description: "Full form answers as submitted.",
      type: "text",
      rows: 10,
      readOnly: true,
    }),
    defineField({
      name: "files",
      title: "Uploaded files",
      type: "array",
      of: [{ type: "file" }],
    }),
    defineField({
      name: "references",
      title: "References / inspiration",
      type: "array",
      of: [{ type: "file" }],
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      company: "company",
      status: "status",
      type: "requestType",
    },
    prepare: ({ title, company, status, type }) => ({
      title: title || "Untitled brief",
      subtitle: [company, type, status].filter(Boolean).join(" · "),
    }),
  },
  orderings: [
    {
      title: "Newest",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
});
