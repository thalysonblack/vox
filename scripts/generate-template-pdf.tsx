/**
 * Generate the blank Website Briefing template PDF for clients to
 * fill out offline. Writes to template-briefing-website.pdf at repo
 * root.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as React from "react";
import { pdf } from "@react-pdf/renderer";
import BriefTemplatePDF from "../src/components/request/BriefTemplatePDF";

async function main() {
  const outPath = resolve(process.cwd(), "goodtaste-briefing-website.pdf");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(BriefTemplatePDF as any, {});
  const instance = pdf(element);
  const buffer = await instance.toBuffer();
  if (Buffer.isBuffer(buffer)) {
    writeFileSync(outPath, buffer);
  } else {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolveStream, rejectStream) => {
      buffer.on("data", (c: Buffer) => chunks.push(c));
      buffer.on("end", () => resolveStream());
      buffer.on("error", rejectStream);
    });
    writeFileSync(outPath, Buffer.concat(chunks));
  }
  console.log(`✅ Template written to ${outPath}`);
}

void main();
