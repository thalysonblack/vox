import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { Resend } from "resend";
import {
  buildBriefEmailHTML,
  buildBriefEmailSubject,
  buildBriefEmailText,
} from "./briefEmail";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
const MAX_FILES_PER_FIELD = 10;

type AssetRef = {
  _type: "file";
  _key: string;
  asset: { _type: "reference"; _ref: string };
};

function str(value: FormDataEntryValue | null, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

async function uploadFiles(
  formData: FormData,
  field: string,
): Promise<AssetRef[]> {
  const entries = formData
    .getAll(field)
    .filter((e): e is File => e instanceof File && e.size > 0)
    .filter((f) => f.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES_PER_FIELD);

  // Parallelise uploads — previous sequential loop turned a 3-file
  // submission into 3x the round-trip latency to Sanity's asset API.
  const refs = await Promise.all(
    entries.map(async (file, idx) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await writeClient.assets.upload("file", buffer, {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      return {
        _type: "file" as const,
        _key: `${asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}${idx}`,
        asset: { _type: "reference" as const, _ref: asset._id },
      };
    }),
  );
  return refs;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const title = str(formData.get("title"), 240);
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const answersRaw = str(formData.get("answers"), 20000) ?? "{}";

  try {
    const [files, references] = await Promise.all([
      uploadFiles(formData, "files"),
      uploadFiles(formData, "references"),
    ]);

    const referenceLinks = formData
      .getAll("referenceLinks")
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0)
      .slice(0, 20);

    const doc = {
      _type: "briefRequest",
      status: "new",
      title,
      contactName: str(formData.get("contactName"), 160),
      contactEmail: str(formData.get("contactEmail"), 240),
      company: str(formData.get("company"), 160),
      companySize: str(formData.get("companySize"), 20),
      companyAge: str(formData.get("companyAge"), 20),
      companyRevenue: str(formData.get("companyRevenue"), 20),
      estimatedRange: str(formData.get("estimatedRange"), 60),
      workFor: str(formData.get("workFor"), 20),
      brand: str(formData.get("brand"), 160),
      requestType: str(formData.get("requestType"), 80),
      requestSubtype: str(formData.get("requestSubtype"), 120),
      creativeLevel: str(formData.get("creativeLevel"), 80),
      deadline: str(formData.get("deadline"), 40),
      description: str(formData.get("description"), 8000),
      payload: answersRaw,
      files,
      references,
      referenceLinks,
      source: req.headers.get("referer") ?? "request-page",
      submittedAt: new Date().toISOString(),
    };

    const created = await writeClient.create(doc);

    // Fire off the notification email via Resend. Failure here must
    // NOT block the submission response — the brief is already saved
    // in Sanity and the user deserves a confirmation either way.
    if (resend) {
      const from =
        process.env.RESEND_FROM_EMAIL ?? "Goodtaste <onboarding@resend.dev>";
      const to = (
        process.env.RESEND_TO_EMAIL ?? "hello@voxteller.com"
      )
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      let answers: Record<string, unknown> = {};
      try {
        answers = JSON.parse(answersRaw) as Record<string, unknown>;
      } catch {
        answers = {};
      }

      const emailData = {
        title: doc.title,
        contactName: doc.contactName,
        contactEmail: doc.contactEmail,
        company: doc.company,
        companySize: doc.companySize,
        companyAge: doc.companyAge,
        companyRevenue: doc.companyRevenue,
        workFor: doc.workFor,
        brand: doc.brand,
        requestType: doc.requestType,
        requestSubtype: doc.requestSubtype,
        creativeLevel: doc.creativeLevel,
        deadline: doc.deadline,
        description: doc.description,
        estimatedRange: doc.estimatedRange,
        referenceLinks,
        fileNames: files
          .map((_, idx) => {
            const entry = formData.getAll("files")[idx];
            return entry instanceof File ? entry.name : "";
          })
          .filter(Boolean),
        referenceFileNames: references
          .map((_, idx) => {
            const entry = formData.getAll("references")[idx];
            return entry instanceof File ? entry.name : "";
          })
          .filter(Boolean),
        answers,
        sanityId: created._id,
        studioBaseUrl:
          process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/studio`
            : undefined,
      };

      const replyTo =
        typeof doc.contactEmail === "string" && doc.contactEmail.includes("@")
          ? doc.contactEmail
          : undefined;

      try {
        await resend.emails.send({
          from,
          to,
          subject: buildBriefEmailSubject(emailData),
          html: buildBriefEmailHTML(emailData),
          text: buildBriefEmailText(emailData),
          replyTo,
        });
      } catch (emailErr) {
        console.error("[brief] resend send failed", emailErr);
      }
    }

    return NextResponse.json({ ok: true, id: created._id });
  } catch (error) {
    console.error("[brief] failed to create", error);
    return NextResponse.json(
      { error: "Failed to save brief" },
      { status: 500 },
    );
  }
}
