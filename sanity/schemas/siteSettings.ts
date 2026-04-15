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
      // Pre-fill with the labels the site used before the CMS panel
      // landed, so the first editor to open Site Settings doesn't lose
      // the existing nav structure.
      initialValue: [
        { _key: "i1", label: "RESOURCES", href: "/resources", external: false },
        { _key: "i2", label: "GALLERY", href: "/gallery", external: false },
      ],
    }),
    defineField({
      name: "footerTagline",
      title: "Footer tagline",
      description: "The one-liner shown in the desktop footer.",
      type: "text",
      rows: 2,
      initialValue:
        "We bring ideas to life, and life to ideas, through strategy, design, and communication.",
    }),
    defineField({
      name: "footerCopyright",
      title: "Footer copyright",
      type: "string",
      description: "e.g. © 2026",
      initialValue: "© 2026",
    }),
    defineField({
      name: "navTagline",
      title: "Nav tagline",
      description: 'Shown under the logo on desktop. e.g. "Design partner for founders and investors."',
      type: "string",
      initialValue: "Design partner for founders and investors.",
    }),
    defineField({
      name: "connectWhatsapp",
      title: "CONNECT — Whatsapp",
      type: "string",
      description: 'Phone number with country code, e.g. +55 45 9999-9999',
      initialValue: "+55 45 9999-9999",
    }),
    defineField({
      name: "connectWhatsappHref",
      title: "CONNECT — Whatsapp link",
      type: "url",
      description: "wa.me link",
      initialValue: "https://wa.me/5545999999999",
    }),
    defineField({
      name: "connectEmail",
      title: "CONNECT — Email",
      type: "string",
      initialValue: "hello@voxteller.com",
    }),
    defineField({
      name: "connectInstagram",
      title: "CONNECT — Instagram URL",
      type: "url",
      initialValue: "https://instagram.com",
    }),
    defineField({
      name: "connectLinkedin",
      title: "CONNECT — LinkedIn URL",
      type: "url",
      initialValue: "https://linkedin.com",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
});
