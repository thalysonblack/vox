/**
 * Fires only the CLIENT confirmation email (not the team one) to test
 * the WhatsApp CTA + Goodtaste layout seen by the submitter.
 */

import { Resend } from "resend";
import {
  buildClientConfirmationHTML,
  buildClientConfirmationSubject,
  buildClientConfirmationText,
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
  contactEmail: TO,
  company: "Goodtaste® Studio",
  requestType: "branding",
  deadline: "2026-06-30",
};

async function send(from: string) {
  return resend.emails.send({
    from,
    to: [TO],
    subject: buildClientConfirmationSubject(data),
    html: buildClientConfirmationHTML(data),
    text: buildClientConfirmationText(data),
  });
}

async function main() {
  console.log(`Sending CLIENT confirmation to ${TO}`);
  const first = await send(PRIMARY_FROM);
  if (first.error) {
    console.log(`Primary failed: ${JSON.stringify(first.error)}. Falling back.`);
    const second = await send(FALLBACK_FROM);
    if (second.error) {
      console.error("❌ Fallback failed:", second.error);
      process.exit(1);
    }
    console.log(`✅ Sent via fallback: id=${second.data?.id}`);
    return;
  }
  console.log(`✅ Sent via primary: id=${first.data?.id}`);
}

void main();
