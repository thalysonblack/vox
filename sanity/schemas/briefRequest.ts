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
      name: "companySize",
      title: "Company size (employees)",
      type: "string",
      options: {
        list: [
          { title: "Only me", value: "1" },
          { title: "2 to 5", value: "2-5" },
          { title: "6 to 20", value: "6-20" },
          { title: "21 to 50", value: "21-50" },
          { title: "51 to 200", value: "51-200" },
          { title: "200+", value: "200+" },
        ],
      },
    }),
    defineField({
      name: "companyAge",
      title: "Company age",
      type: "string",
      options: {
        list: [
          { title: "Under 1 year", value: "<1" },
          { title: "1 to 3 years", value: "1-3" },
          { title: "3 to 7 years", value: "3-7" },
          { title: "7 to 15 years", value: "7-15" },
          { title: "15+ years", value: "15+" },
        ],
      },
    }),
    defineField({
      name: "companyRevenue",
      title: "Annual revenue (BRL)",
      description: "Self-reported — shapes pricing tier signal.",
      type: "string",
      options: {
        list: [
          { title: "R$ 200k – 500k", value: "200k-500k" },
          { title: "R$ 500k – 2M", value: "500k-2M" },
          { title: "R$ 2M – 10M", value: "2M-10M" },
          { title: "R$ 10M – 50M", value: "10M-50M" },
        ],
      },
    }),
    defineField({
      name: "estimatedRange",
      title: "Estimated range (BRL)",
      description: "Snapshot of the price range shown to the client at submit time.",
      type: "string",
      readOnly: true,
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
