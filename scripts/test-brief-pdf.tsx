/**
 * End-to-end test: builds a realistic brief payload, hits the local
 * /api/brief route (which creates the Sanity doc + fires the Resend
 * email when configured), and renders the PDF via @react-pdf/renderer
 * in Node to an output file.
 *
 * Run: npx tsx scripts/test-brief-pdf.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as React from "react";
import { pdf } from "@react-pdf/renderer";
import BriefPDF from "../src/components/request/BriefPDF";
import type { BriefSummaryData } from "../src/components/request/BriefSummary";

const BASE_URL = process.env.BRIEF_TEST_BASE_URL ?? "http://localhost:3000";

const summary: BriefSummaryData = {
  title: "Rebrand + landing page — 2026 launch",
  contactName: "Thalyson Black",
  contactEmail: "test@thegoodtaste.cc",
  company: "Goodtaste® Studio",
  companySize: "6-20",
  companyAge: "3-7",
  companyRevenue: "500k-2M",
  workFor: "own",
  brand: "",
  requestType: "branding",
  requestSubtype: "branding",
  creativeLevel: "world-class",
  deadline: "2026-06-30",
  description:
    "Somos um estúdio de design no Brasil que precisa refinar o sistema visual completo antes de lançar uma nova página em Junho. Queremos um rebrand que mantenha o equity atual mas expanda a linguagem — ainda não é uma troca de nome, é evolução. O tom deve ser editorial, premium, técnico.",
  observacoes:
    "Temos um manual atual de 32 páginas que pode servir de ponto de partida. Preferimos referências fora do segmento de design para evitar enviesamento.",
  clientBudget: "40k-100k",
  estimatedRange: "R$ 12.000 – R$ 80.000",
  referenceLinks: [
    "https://area17.com",
    "https://mschf.com",
    "Pentagram New York",
  ],
  fileNames: ["brand-manual-current.pdf", "research-notes.pdf"],
  referenceNames: ["editorial-inspiration.jpg", "color-moodboard.png"],
  categoryAnswers: {
    projectType: "Rebrand completo",
    deliverables: [
      "Logo / marca principal",
      "Sistema de cores",
      "Sistema tipográfico",
      "Manual completo (brand book)",
      "Aplicações digitais",
    ],
    personality: "Precisa, editorial, técnica, com tom premium sem ser frio.",
    audience:
      "Fundadores de empresas de tecnologia e design que buscam alto padrão de execução.",
    competitors:
      "Área 17, Pentagram, Koto — admiramos mas queremos algo com mais peso brasileiro e editorial.",
    assets: "Sim, quero preservar alguns elementos",
    naming: "Nenhum",
  },
};

async function submitToAPI() {
  console.log(`\n[1/2] POST ${BASE_URL}/api/brief`);
  const fd = new FormData();
  fd.append("title", summary.title!);
  fd.append("contactName", summary.contactName!);
  fd.append("contactEmail", summary.contactEmail!);
  fd.append("company", summary.company!);
  fd.append("companySize", summary.companySize!);
  fd.append("companyAge", summary.companyAge!);
  fd.append("companyRevenue", summary.companyRevenue!);
  fd.append("clientBudget", summary.clientBudget!);
  fd.append("workFor", summary.workFor!);
  fd.append("requestType", summary.requestType!);
  fd.append("requestSubtype", summary.requestSubtype!);
  fd.append("creativeLevel", summary.creativeLevel!);
  fd.append("deadline", summary.deadline!);
  fd.append("description", summary.description!);
  fd.append("estimatedRange", summary.estimatedRange!);
  fd.append(
    "answers",
    JSON.stringify({
      ...summary.categoryAnswers,
      observacoes: summary.observacoes,
    }),
  );
  summary.referenceLinks?.forEach((l) => fd.append("referenceLinks", l));

  const res = await fetch(`${BASE_URL}/api/brief`, {
    method: "POST",
    body: fd,
  });
  const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
  if (!res.ok || !json.ok) {
    throw new Error(`API failed: ${JSON.stringify(json)}`);
  }
  console.log(`    ✓ Sanity doc created: ${json.id}`);
  return json.id;
}

async function renderPDF(outPath: string) {
  console.log(`\n[2/2] Rendering PDF via @react-pdf/renderer …`);
  const localLogo = resolve(process.cwd(), "public/assets/vox-logo.png");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(BriefPDF as any, {
    data: summary,
    logoUrl: localLogo,
  }) as unknown as Parameters<typeof pdf>[0];
  // pdf() returns a PdfInstance with toBuffer()/toBlob(). In Node we
  // prefer toBuffer() to avoid needing Blob globals.
  const instance = pdf(element);
  const buffer = await instance.toBuffer();
  // toBuffer() may actually return a Readable stream in Node; collect.
  if (Buffer.isBuffer(buffer)) {
    writeFileSync(outPath, buffer);
  } else {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolveStream, rejectStream) => {
      buffer.on("data", (chunk: Buffer) => chunks.push(chunk));
      buffer.on("end", () => resolveStream());
      buffer.on("error", rejectStream);
    });
    writeFileSync(outPath, Buffer.concat(chunks));
  }
  console.log(`    ✓ PDF written to ${outPath}`);
}

async function main() {
  const outPath = resolve(process.cwd(), "test-brief.pdf");
  try {
    const id = await submitToAPI();
    await renderPDF(outPath);
    console.log(
      `\n✅ Done.\n    Sanity doc: ${id}\n    PDF: ${outPath}`,
    );
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  }
}

void main();
