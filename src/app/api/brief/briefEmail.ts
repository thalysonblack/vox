type EmailPayload = {
  title?: string;
  contactName?: string;
  contactEmail?: string;
  company?: string;
  companySize?: string;
  companyAge?: string;
  companyRevenue?: string;
  workFor?: string;
  brand?: string;
  requestType?: string;
  requestSubtype?: string;
  creativeLevel?: string;
  deadline?: string;
  description?: string;
  observacoes?: string;
  clientBudget?: string;
  estimatedRange?: string;
  referenceLinks?: string[];
  fileNames?: string[];
  referenceFileNames?: string[];
  answers?: Record<string, unknown>;
  sanityId?: string;
  studioBaseUrl?: string;
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  webdesign: "Design de sites",
  branding: "Identidade Visual (CI)",
  embalagem: "Embalagem",
  apresentacoes: "Apresentações",
  ilustracoes: "Ilustrações",
  mockups3d: "Maquetes & 3D",
  impressao: "Desenhos de impressão",
  estampas: "Estampas (produto & apparel)",
  ebooks: "E-books / One-pager",
  email: "Email templates",
  ads: "Ads / Social",
  outro: "Outro",
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  "1": "Só eu",
  "2-5": "2 a 5 pessoas",
  "6-20": "6 a 20 pessoas",
  "21-50": "21 a 50 pessoas",
  "51-200": "51 a 200 pessoas",
  "200+": "200+ pessoas",
};

const COMPANY_AGE_LABELS: Record<string, string> = {
  "<1": "Menos de 1 ano",
  "1-3": "1 a 3 anos",
  "3-7": "3 a 7 anos",
  "7-15": "7 a 15 anos",
  "15+": "15+ anos",
};

const COMPANY_REVENUE_LABELS: Record<string, string> = {
  "200k-500k": "R$ 200k – 500k",
  "500k-2M": "R$ 500k – 2M",
  "2M-10M": "R$ 2M – 10M",
  "10M-50M": "R$ 10M – 50M",
};

const CLIENT_BUDGET_LABELS: Record<string, string> = {
  "<5k": "Até R$ 5.000",
  "5k-15k": "R$ 5.000 – 15.000",
  "15k-40k": "R$ 15.000 – 40.000",
  "40k-100k": "R$ 40.000 – 100.000",
  "100k+": "R$ 100.000+",
};

function esc(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function labelize(id: string): string {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function row(label: string, value: unknown): string {
  return `
    <tr>
      <td style="padding:10px 16px 10px 0;vertical-align:top;border-bottom:1px solid #f0f0f0;width:160px;">
        <span style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#888;">${esc(
          label,
        )}</span>
      </td>
      <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:13px;font-weight:500;color:#111;line-height:1.5;">${
          Array.isArray(value)
            ? value.length === 0
              ? "—"
              : value.map(esc).join(", ")
            : esc(value)
        }</span>
      </td>
    </tr>
  `;
}

function section(title: string, rows: string): string {
  return `
    <tr>
      <td style="padding:24px 0 8px 0;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#111;">${esc(
          title,
        )}</p>
      </td>
    </tr>
    <tr>
      <td>
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
      </td>
    </tr>
  `;
}

export function buildBriefEmailHTML(data: EmailPayload): string {
  const requestTypeLabel = data.requestType
    ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
    : undefined;

  const contactRows = [
    row("Nome", data.contactName),
    row("Email", data.contactEmail),
    row("Empresa", data.company),
    row(
      "Trabalho para",
      data.workFor === "other"
        ? `Outra marca / cliente${data.brand ? ` · ${data.brand}` : ""}`
        : data.workFor === "own"
          ? "A própria empresa"
          : undefined,
    ),
  ].join("");

  const companyRows = [
    row(
      "Funcionários",
      data.companySize
        ? COMPANY_SIZE_LABELS[data.companySize] ?? data.companySize
        : undefined,
    ),
    row(
      "Tempo de vida",
      data.companyAge
        ? COMPANY_AGE_LABELS[data.companyAge] ?? data.companyAge
        : undefined,
    ),
    row(
      "Faturamento anual",
      data.companyRevenue
        ? COMPANY_REVENUE_LABELS[data.companyRevenue] ?? data.companyRevenue
        : undefined,
    ),
  ].join("");

  const projectRows = [
    row("Título", data.title),
    row("Tipo", requestTypeLabel),
    row("Subcategoria", data.requestSubtype),
    row("Nível criativo", data.creativeLevel),
    row("Prazo", data.deadline),
    row(
      "Orçamento do cliente",
      data.clientBudget
        ? CLIENT_BUDGET_LABELS[data.clientBudget] ?? data.clientBudget
        : undefined,
    ),
    row("Range estimado (interno)", data.estimatedRange),
  ].join("");

  const details = data.answers ?? {};
  const detailRows = Object.entries(details)
    .filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0),
    )
    .map(([k, v]) => row(labelize(k), v as string | string[]))
    .join("");

  const descriptionRows = [
    row("Descrição geral", data.description),
    row("Observações", data.observacoes),
  ].join("");

  const filesRows = [
    row("Arquivos", data.fileNames ?? []),
    row("Refs (arquivos)", data.referenceFileNames ?? []),
    row("Refs (links / nomes)", data.referenceLinks ?? []),
  ].join("");

  const logoUrl = `${(
    data.studioBaseUrl
      ? data.studioBaseUrl.replace(/\/studio\/?$/, "").replace(/\/$/, "")
      : "https://voxteller.com"
  )}/assets/vox-logo.png`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Novo briefing — ${esc(data.title ?? "sem título")}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #ececec;">
              <img src="${logoUrl}" alt="Goodtaste" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:20px;" />
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;">
                Novo briefing recebido
              </p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.15;color:#111;">
                ${esc(data.title ?? "Sem título")}
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:#666;line-height:1.5;">
                ${esc(requestTypeLabel ?? "Sem categoria")}${
                  data.company ? ` · <strong style="color:#111;">${esc(data.company)}</strong>` : ""
                }
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${section("Contato", contactRows)}
                ${section("Perfil da empresa", companyRows)}
                ${section("Projeto", projectRows)}
                ${detailRows ? section("Detalhes", detailRows) : ""}
                ${section("Descrição", descriptionRows)}
                ${section("Arquivos & referências", filesRows)}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #ececec;">
              <p style="margin:0;font-size:11px;color:#888;line-height:1.5;">
                Este email é uma notificação automática do form /request.
                O briefing completo está salvo no Sanity como um card de CRM.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildBriefEmailSubject(data: EmailPayload): string {
  const parts = [
    "Novo briefing",
    data.title,
    data.company,
  ].filter(Boolean);
  return parts.join(" · ").slice(0, 160);
}

export function buildClientConfirmationHTML(data: EmailPayload): string {
  const requestTypeLabel = data.requestType
    ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
    : undefined;
  const logoUrl = `${(
    data.studioBaseUrl
      ? data.studioBaseUrl.replace(/\/studio\/?$/, "").replace(/\/$/, "")
      : "https://voxteller.com"
  )}/assets/vox-logo.png`;

  const contactRows = [
    row("Nome", data.contactName),
    row("Email", data.contactEmail),
    row("Empresa", data.company),
  ].join("");

  const projectRows = [
    row("Título", data.title),
    row("Tipo", requestTypeLabel),
    row("Subcategoria", data.requestSubtype),
    row("Nível criativo", data.creativeLevel),
    row("Prazo", data.deadline),
    row(
      "Orçamento previsto",
      data.clientBudget
        ? CLIENT_BUDGET_LABELS[data.clientBudget] ?? data.clientBudget
        : undefined,
    ),
  ].join("");

  const descriptionRows = [
    row("Descrição geral", data.description),
    row("Observações", data.observacoes),
  ].join("");

  const whatsappHref = `https://wa.me/5564984175364?text=${encodeURIComponent(
    `Oi! Acabei de enviar um briefing${data.title ? ` — ${data.title}` : ""} pela Goodtaste.`,
  )}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recebemos seu briefing — ${esc(data.title ?? "")}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #ececec;">
              <img src="${logoUrl}" alt="Goodtaste" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:20px;" />
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;">
                Briefing recebido
              </p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.15;color:#111;">
                ${esc(data.title ?? "Sem título")}
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:#666;line-height:1.5;">
                ${esc(requestTypeLabel ?? "")}${
                  data.company ? ` · <strong style="color:#111;">${esc(data.company)}</strong>` : ""
                }
              </p>
              <p style="margin:16px 0 0;">
                <a href="${whatsappHref}" target="_blank" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
                  Chamar no WhatsApp
                  <span style="margin-left:10px;color:#9ae79a;">(64) 98417-5364</span>
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">
                Obrigado por compartilhar o contexto do seu projeto${
                  data.company ? ` da <strong>${esc(data.company)}</strong>` : ""
                }. A partir de agora ele está no nosso board e vai ser revisado
                por nosso time. Em até <strong>48 horas úteis</strong> a gente
                retorna aqui com escopo, prazo, direção criativa e um orçamento
                que faça sentido pro momento.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${section("Resumo do contato", contactRows)}
                ${section("Seu projeto", projectRows)}
                ${
                  data.description || data.observacoes
                    ? section("O que você nos contou", descriptionRows)
                    : ""
                }
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #ececec;">
              <p style="margin:0;font-size:11px;color:#888;line-height:1.5;">
                Se esquecer de algo importante ou quiser adicionar uma
                referência, é só responder esse email direto — cai com a
                gente.<br><br>
                <strong style="color:#111;">Goodtaste®</strong> · Strategy, design, and communication.<br>
                <a href="https://voxteller.com" style="color:#888;text-decoration:underline;">voxteller.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildClientConfirmationText(data: EmailPayload): string {
  const firstName = (data.contactName ?? "").split(" ")[0];
  const greeting = firstName ? `Oi, ${firstName} —` : "Oi —";
  const requestTypeLabel = data.requestType
    ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
    : "";

  return [
    `GOODTASTE®`,
    `================`,
    ``,
    greeting,
    ``,
    `Recebemos seu briefing.`,
    ``,
    `Obrigado por compartilhar o contexto do seu projeto${
      data.company ? ` da ${data.company}` : ""
    }. A partir de agora ele está no nosso board e vai ser revisado por nosso time.`,
    ``,
    `Em até 48 horas úteis a gente retorna por aqui com uma devolutiva: escopo, prazo sugerido, direção criativa e um orçamento que faça sentido pro momento.`,
    ``,
    `— RESUMO —`,
    `Título: ${data.title ?? "—"}`,
    requestTypeLabel ? `Tipo: ${requestTypeLabel}` : "",
    data.deadline ? `Prazo: ${data.deadline}` : "",
    ``,
    `Se preferir adiantar, chama no WhatsApp:`,
    `https://wa.me/5564984175364  ·  (64) 98417-5364`,
    ``,
    `Se esquecer de algo ou quiser adicionar uma referência, é só responder esse email direto.`,
    ``,
    `Abraço,`,
    `Goodtaste®`,
    ``,
    `voxteller.com`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildClientConfirmationSubject(data: EmailPayload): string {
  const base = data.title
    ? `Recebemos seu briefing — ${data.title}`
    : "Recebemos seu briefing";
  return base.slice(0, 160);
}

export function buildBriefEmailText(data: EmailPayload): string {
  const lines: string[] = [];
  lines.push(`GOODTASTE — NOVO BRIEFING`);
  lines.push(`=============================\n`);
  lines.push(`Título: ${data.title ?? "—"}`);
  lines.push(
    `Tipo: ${
      data.requestType
        ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
        : "—"
    }`,
  );
  if (data.requestSubtype) lines.push(`Subcategoria: ${data.requestSubtype}`);
  lines.push("");
  lines.push(`— CONTATO —`);
  lines.push(`Nome: ${data.contactName ?? "—"}`);
  lines.push(`Email: ${data.contactEmail ?? "—"}`);
  lines.push(`Empresa: ${data.company ?? "—"}`);
  if (data.workFor === "other" && data.brand)
    lines.push(`Marca cliente: ${data.brand}`);
  lines.push("");
  lines.push(`— PERFIL —`);
  lines.push(`Funcionários: ${data.companySize ?? "—"}`);
  lines.push(`Tempo: ${data.companyAge ?? "—"}`);
  lines.push(`Faturamento: ${data.companyRevenue ?? "—"}`);
  lines.push("");
  if (data.estimatedRange)
    lines.push(`Range estimado: ${data.estimatedRange}`);
  if (data.deadline) lines.push(`Prazo: ${data.deadline}`);
  lines.push("");
  if (data.description) {
    lines.push(`— DESCRIÇÃO —`);
    lines.push(data.description);
    lines.push("");
  }
  if (data.observacoes) {
    lines.push(`— OBSERVAÇÕES —`);
    lines.push(data.observacoes);
    lines.push("");
  }
  const refs = [
    ...(data.fileNames ?? []),
    ...(data.referenceFileNames ?? []),
    ...(data.referenceLinks ?? []),
  ];
  if (refs.length > 0) {
    lines.push(`— ARQUIVOS & REFS —`);
    refs.forEach((r) => lines.push(`• ${r}`));
  }
  return lines.join("\n");
}
