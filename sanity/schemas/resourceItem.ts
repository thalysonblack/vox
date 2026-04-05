import { defineField, defineType } from "sanity";

export const resourceItemSchema = defineType({
  name: "resourceItem",
  title: "Resource Item",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().min(2).max(90),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Ex.: Docs, Ferramentas, Templates, Guias",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      initialValue: "quick_link",
      options: {
        list: [
          { title: "Quick Link", value: "quick_link" },
          { title: "Guide", value: "guide" },
          { title: "Tool", value: "tool" },
          { title: "Template", value: "template" },
          { title: "Support", value: "support" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Controls visual order (ascending). Use 10, 20, 30...",
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "active",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Draft", value: "draft" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "icon",
    },
    prepare(selection: { title?: string; subtitle?: string }) {
      return {
        title: selection.title ?? "Untitled resource",
        subtitle: selection.subtitle ? `${selection.subtitle}` : "No category",
      };
    },
  },
});
