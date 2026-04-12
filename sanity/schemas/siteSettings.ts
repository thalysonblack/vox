import { defineField, defineType } from "sanity";

export const siteSettingsSchema = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  // Singleton: só um documento desse tipo existe.
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Site Settings",
      readOnly: true,
      hidden: true,
    }),

    // ------------------------------------------------------------
    // Vertical carousel scroll physics
    // ------------------------------------------------------------
    defineField({
      name: "scrollFriction",
      title: "Scroll Friction",
      description:
        "How fast the momentum decays per frame. Higher = longer glide. " +
        "0.980 is snappy, 0.998 is almost never stops.",
      type: "number",
      validation: (Rule) => Rule.min(0.95).max(0.999).precision(4),
      initialValue: 0.993,
    }),

    defineField({
      name: "scrollSmoothLag",
      title: "Scroll Smooth Lag",
      description:
        "How much the carousel lags behind your scroll input. " +
        "Higher = smoother/laggier (Lenis-style). 0.85 is responsive, 0.98 is very slow chase.",
      type: "number",
      validation: (Rule) => Rule.min(0.7).max(0.99).precision(3),
      initialValue: 0.96,
    }),

    defineField({
      name: "scrollWheelImpulse",
      title: "Wheel Impulse",
      description:
        "How much velocity each wheel notch injects. " +
        "Higher = more aggressive. 0.3 is slow, 2.5 is snappy.",
      type: "number",
      validation: (Rule) => Rule.min(0.1).max(4).precision(2),
      initialValue: 0.9,
    }),

    defineField({
      name: "scrollFlingMultiplier",
      title: "Drag Fling Multiplier",
      description:
        "How much momentum is given to cards after releasing a drag. " +
        "Higher = longer fling. 1 is gentle, 10 is strong.",
      type: "number",
      validation: (Rule) => Rule.min(0.5).max(15).precision(1),
      initialValue: 5,
    }),

    defineField({
      name: "scrollSnapDelay",
      title: "Snap Delay (ms)",
      description:
        "How long (ms) to wait after scroll stops before snapping to the nearest slot. " +
        "Lower = snaps fast, higher = cards keep gliding freely.",
      type: "number",
      validation: (Rule) => Rule.min(100).max(5000).integer(),
      initialValue: 1600,
    }),

    defineField({
      name: "scrollSnapDuration",
      title: "Snap Duration (seconds)",
      description:
        "How long the final snap tween takes. Higher = softer landing.",
      type: "number",
      validation: (Rule) => Rule.min(0.1).max(2).precision(2),
      initialValue: 0.6,
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
});
