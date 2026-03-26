"use no memo";

import dynamic from "next/dynamic";
import config from "../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";
export const dynamic = "force-dynamic";

const NextStudio = dynamic(
  () => import("next-sanity/studio").then((mod) => ({ default: mod.NextStudio })),
  { ssr: false }
);

export default function StudioPage() {
  return <NextStudio config={config} />;
}
