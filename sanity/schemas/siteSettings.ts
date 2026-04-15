import { defineField, defineType } from "sanity";

/**
 * Singleton document holding site-wide settings that the client should
 * be able to edit without touching code — menu items, footer copy, and
 * the CONNECT panel contacts.
 */
export const siteSettingsSchema = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  // Only one document of this type should exist. The studio structure
  // enforces this (see sanity.config.ts).
  fields: [
    defineField({
      name: "menuItems",
      title: "Menu items",
      description:
        "Links shown in the navigation. Order is drag-sortable. External links open in a new tab.",
      type: "array",
      of: [
        {
          type: "object",
          name: "menuItem",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "href",
              title: "Link",
              type: "string",
              description: "Internal path (e.g. /resources) or full URL (e.g. https://...)",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "external",
              title: "Opens in new tab",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "href" },
          },
        },
      ],
    }),
    defineField({
      name: "footerTagline",
      title: "Footer tagline",
      description: "The one-liner shown in the desktop footer.",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "footerCopyright",
      title: "Footer copyright",
      type: "string",
      description: "e.g. © 2026",
    }),
    defineField({
      name: "navTagline",
      title: "Nav tagline",
      description: 'Shown under the logo on desktop. e.g. "Design partner for founders and investors."',
      type: "string",
    }),
    defineField({
      name: "connectWhatsapp",
      title: "CONNECT — Whatsapp",
      type: "string",
      description: 'Phone number with country code, e.g. +55 45 9999-9999',
    }),
    defineField({
      name: "connectWhatsappHref",
      title: "CONNECT — Whatsapp link",
      type: "url",
      description: "wa.me link",
    }),
    defineField({
      name: "connectEmail",
      title: "CONNECT — Email",
      type: "string",
    }),
    defineField({
      name: "connectInstagram",
      title: "CONNECT — Instagram URL",
      type: "url",
    }),
    defineField({
      name: "connectLinkedin",
      title: "CONNECT — LinkedIn URL",
      type: "url",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
});
