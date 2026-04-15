/**
 * One-shot test: sends the brief notification email to a specific
 * recipient via Resend, using the production template.
 *
 * Run: npx tsx scripts/send-test-email.ts
 */

import { Resend } from "resend";
import {
  buildBriefEmailHTML,
  buildBriefEmailSubject,
  buildBriefEmailText,
} from "../src/app/api/brief/briefEmail";

const TO = process.env.TO_EMAIL ?? "thalysonrs@gmail.com";
const PRIMARY_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Goodtaste <hello@thegoodtaste.cc>";
const FALLBACK_FROM = "Goodtaste <onboarding@resend.dev>";

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("❌ RESEND_API_KEY not set");
  process.exit(1);
}
const resend = new Resend(key);

const data = {
  title: "Rebrand + landing page — 2026 launch",
  contactName: "Thalyson Black",
  contactEmail: "thalysonrs@gmail.com",
  company: "Goodtaste® Studio",
  companySize: "6-20",
  companyAge: "3-7",
  companyRevenue: "500k-2M",
  workFor: "own",
  requestType: "branding",
  requestSubtype: "branding",
  creativeLevel: "world-class",
  deadline: "2026-06-30",
  description:
    "Somos um estúdio de design no Brasil que precisa refinar o sistema visual completo antes de lançar uma nova página em Junho. Queremos um rebrand que mantenha o equity atual mas expanda a linguagem — tom editorial, premium, técnico.",
  observacoes:
    "Temos um manual atual de 32 páginas que pode servir de ponto de partida.",
  clientBudget: "40k-100k",
  estimatedRange: "R$ 12.000 – R$ 80.000",
  referenceLinks: [
    "https://area17.com",
    "https://mschf.com",
    "Pentagram New York",
  ],
  fileNames: ["brand-manual-current.pdf", "research-notes.pdf"],
  referenceFileNames: ["editorial-inspiration.jpg", "color-moodboard.png"],
  answers: {
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
  sanityId: "test-send-" + Date.now(),
  studioBaseUrl: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/studio`
    : undefined,
};

async function send(from: string) {
  return resend.emails.send({
    from,
    to: [TO],
    subject: buildBriefEmailSubject(data),
    html: buildBriefEmailHTML(data),
    text: buildBriefEmailText(data),
    replyTo: data.contactEmail,
  });
}

async function main() {
  console.log(`Sending to ${TO}`);
  console.log(`Trying primary from: ${PRIMARY_FROM}`);

  const first = await send(PRIMARY_FROM);
  if (first.error) {
    console.log(`❌ Primary failed: ${JSON.stringify(first.error)}`);
    console.log(`Retrying with fallback: ${FALLBACK_FROM}`);
    const second = await send(FALLBACK_FROM);
    if (second.error) {
      console.error(`❌ Fallback failed:`, second.error);
      process.exit(1);
    }
    console.log(`✅ Sent via fallback: id=${second.data?.id}`);
    return;
  }
  console.log(`✅ Sent via primary: id=${first.data?.id}`);
}

void main();
