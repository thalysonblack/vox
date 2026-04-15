import { defineField, defineType } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const projectSchema = defineType({
  name: "project",
  title: "Project",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "project" }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "clickBehavior",
      title: "Click behavior",
      type: "string",
      description:
        "What happens when someone clicks this project card.",
      options: {
        list: [
          { title: "Open project detail page", value: "detail" },
          { title: "Open live site (external URL)", value: "live" },
          { title: "Disabled / locked (no click)", value: "locked" },
        ],
        layout: "radio",
      },
      initialValue: "detail",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "liveUrl",
      title: "Live site URL",
      description:
        'Only used when Click behavior is "Open live site". Full URL (https://...).',
      type: "url",
      hidden: ({ parent }) => parent?.clickBehavior !== "live",
    }),
    defineField({
      name: "image",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
      options: {
        list: [
          { title: "Branding", value: "Branding" },
          { title: "Website", value: "Website" },
          { title: "UI Design", value: "UI Design" },
          { title: "Motion", value: "Motion" },
          { title: "Print", value: "Print" },
          { title: "3D", value: "3D" },
        ],
      },
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        {
          type: "object",
          name: "imageBlock",
          title: "Image",
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "orientation",
              title: "Orientation",
              type: "string",
              options: {
                list: [
                  { title: "Horizontal (16:9)", value: "horizontal" },
                  { title: "Vertical (4:5)", value: "vertical" },
                ],
                layout: "radio",
              },
              initialValue: "horizontal",
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
          preview: {
            select: { media: "image", title: "caption", subtitle: "orientation" },
          },
        },
        {
          type: "object",
          name: "imagePair",
          title: "Image Pair (side by side)",
          fields: [
            defineField({
              name: "imageLeft",
              title: "Left Image",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "imageRight",
              title: "Right Image",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
          preview: {
            select: { media: "imageLeft", title: "caption" },
            prepare: ({ title }: { title?: string }) => ({
              title: title || "Image Pair",
              subtitle: "Side by side",
            }),
          },
        },
        {
          type: "object",
          name: "videoBlock",
          title: "Video",
          fields: [
            defineField({
              name: "video",
              title: "Video File",
              type: "file",
              options: { accept: "video/*" },
              validation: (r) => r.required(),
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
          preview: {
            select: { title: "caption" },
            prepare: ({ title }: { title?: string }) => ({
              title: title || "Video",
              subtitle: "Video block",
            }),
          },
        },
        {
          type: "object",
          name: "gifBlock",
          title: "GIF",
          fields: [
            defineField({
              name: "gif",
              title: "GIF File",
              type: "file",
              options: { accept: "image/gif" },
              validation: (r) => r.required(),
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
          preview: {
            select: { title: "caption" },
            prepare: ({ title }: { title?: string }) => ({
              title: title || "GIF",
              subtitle: "GIF block",
            }),
          },
        },
        {
          type: "object",
          name: "textBlock",
          title: "Text",
          fields: [
            defineField({
              name: "text",
              title: "Text",
              type: "text",
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: "text" },
            prepare: ({ title }: { title?: string }) => ({
              title: title?.slice(0, 60) || "Text block",
              subtitle: "Text",
            }),
          },
        },
      ],
    }),
    defineField({
      name: "credits",
      title: "Credits",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "role",
              title: "Role",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "role", subtitle: "name" } },
        },
      ],
    }),
    defineField({
      name: "relatedProjects",
      title: "Related Projects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "project" }] }],
      validation: (r) => r.max(4),
    }),
    defineField({
      name: "externalUrl",
      title: "External URL",
      description:
        "Shown inside the project detail page (Behance, Dribbble, etc.). Not the same as the live-site URL used for click behavior.",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "name", media: "image", subtitle: "discipline" },
  },
});
