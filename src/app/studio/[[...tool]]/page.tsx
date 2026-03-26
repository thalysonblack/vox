"use no memo";

export { metadata, viewport } from "next-sanity/studio";
export const dynamic = "force-dynamic";

import StudioClient from "@/components/StudioClient";

export default function StudioPage() {
  return <StudioClient />;
}
