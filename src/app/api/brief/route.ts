import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

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
    .slice(0, MAX_FILES_PER_FIELD);

  const refs: AssetRef[] = [];
  for (const file of entries) {
    if (file.size > MAX_FILE_BYTES) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload("file", buffer, {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });
    refs.push({
      _type: "file",
      _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16),
      asset: { _type: "reference", _ref: asset._id },
    });
  }
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
    return NextResponse.json({ ok: true, id: created._id });
  } catch (error) {
    console.error("[brief] failed to create", error);
    return NextResponse.json(
      { error: "Failed to save brief" },
      { status: 500 },
    );
  }
}
