import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { BriefSummaryData } from "./BriefSummary";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  webdesign: "Design de sites",
  branding: "Identidade Visual (CI)",
  embalagem: "Embalagem",
  apresentacoes: "Apresentações",
  ilustracoes: "Ilustrações",
  mockups3d: "Maquetes & 3D",
  impressao: "Desenhos de impressão",
  estampas: "Estampas",
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

const CREATIVE_LABELS: Record<string, string> = {
  minimo: "Mínimo",
  moderado: "Moderado",
  "world-class": "World-class",
};

function labelize(id: string): string {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => String(v)).join(", ");
  }
  return String(value);
}

// Layout mirrors the email template: white card on neutral, PNG logo
// at the top, eyebrow + title + meta strip, then data rows grouped by
// section with a subtle separator.
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f5f5f4",
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    color: "#111111",
    fontSize: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    margin: 24,
    padding: 32,
  },
  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
    paddingBottom: 22,
    marginBottom: 24,
  },
  logo: {
    width: 140,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 1.12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.6,
    color: "#111111",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 11,
    color: "#666666",
    lineHeight: 1.5,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#111111",
  },
  row: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  rowLabel: {
    width: 140,
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  rowValue: {
    flex: 1,
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.5,
  },
  footer: {
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    padding: 16,
    fontSize: 8,
    color: "#888888",
    marginTop: 16,
  },
  footerBrand: {
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    fontSize: 9,
  },
  pageFooter: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 8,
    textAlign: "right",
    fontSize: 8,
    color: "#999999",
  },
});

function Section({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.rowLabel}>{r.label}</Text>
          <Text style={styles.rowValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BriefPDF({
  data,
  logoUrl,
}: {
  data: BriefSummaryData;
  logoUrl?: string;
}) {
  const contactRows = [
    { label: "Nome", value: formatValue(data.contactName) },
    { label: "Email", value: formatValue(data.contactEmail) },
    { label: "Empresa", value: formatValue(data.company) },
    {
      label: "Trabalho para",
      value:
        data.workFor === "other"
          ? `Outra marca / cliente${data.brand ? ` · ${data.brand}` : ""}`
          : data.workFor === "own"
            ? "A própria empresa"
            : "—",
    },
  ];

  const companyRows = [
    {
      label: "Funcionários",
      value: formatValue(
        data.companySize
          ? COMPANY_SIZE_LABELS[data.companySize] ?? data.companySize
          : undefined,
      ),
    },
    {
      label: "Tempo de vida",
      value: formatValue(
        data.companyAge
          ? COMPANY_AGE_LABELS[data.companyAge] ?? data.companyAge
          : undefined,
      ),
    },
    {
      label: "Faturamento",
      value: formatValue(
        data.companyRevenue
          ? COMPANY_REVENUE_LABELS[data.companyRevenue] ?? data.companyRevenue
          : undefined,
      ),
    },
  ];

  const projectRows = [
    { label: "Título", value: formatValue(data.title) },
    {
      label: "Tipo",
      value: formatValue(
        data.requestType
          ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
          : undefined,
      ),
    },
    ...(data.requestSubtype
      ? [{ label: "Subcategoria", value: formatValue(data.requestSubtype) }]
      : []),
    {
      label: "Nível criativo",
      value: formatValue(
        data.creativeLevel
          ? CREATIVE_LABELS[data.creativeLevel] ?? data.creativeLevel
          : undefined,
      ),
    },
    { label: "Prazo", value: formatDate(data.deadline) },
    {
      label: "Orçamento previsto",
      value: formatValue(
        data.clientBudget
          ? CLIENT_BUDGET_LABELS[data.clientBudget] ?? data.clientBudget
          : undefined,
      ),
    },
  ];

  const webRows = data.webAnswers
    ? Object.entries(data.webAnswers).map(([k, v]) => ({
        label: labelize(k),
        value: formatValue(v),
      }))
    : [];

  const categoryRows = data.categoryAnswers
    ? Object.entries(data.categoryAnswers).map(([k, v]) => ({
        label: labelize(k),
        value: formatValue(v),
      }))
    : [];

  const descriptionRows = [
    { label: "Descrição geral", value: formatValue(data.description) },
    { label: "Observações", value: formatValue(data.observacoes) },
  ];

  const filesRows = [
    ...(data.fileNames && data.fileNames.length > 0
      ? [{ label: "Arquivos", value: data.fileNames.join(", ") }]
      : []),
    ...(data.referenceNames && data.referenceNames.length > 0
      ? [{ label: "Refs (arquivos)", value: data.referenceNames.join(", ") }]
      : []),
    ...(data.referenceLinks && data.referenceLinks.length > 0
      ? [{ label: "Refs (links)", value: data.referenceLinks.join(", ") }]
      : []),
  ];

  const requestTypeLabel = data.requestType
    ? REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType
    : undefined;

  const resolvedLogo = logoUrl ?? "https://voxteller.com/assets/vox-logo.png";

  return (
    <Document
      title={`Briefing — ${data.title ?? "Goodtaste"}`}
      author="Goodtaste"
      creator="Goodtaste"
      producer="Goodtaste"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.headerBlock}>
            <Image src={resolvedLogo} style={styles.logo} />
            <Text style={styles.eyebrow}>Briefing recebido</Text>
            <Text style={styles.title}>{data.title ?? "Sem título"}</Text>
            {(requestTypeLabel || data.company) && (
              <Text style={styles.subtitle}>
                {requestTypeLabel ?? ""}
                {requestTypeLabel && data.company ? " · " : ""}
                {data.company ?? ""}
              </Text>
            )}
          </View>

          <Section title="Contato" rows={contactRows} />
          <Section title="Perfil da empresa" rows={companyRows} />
          <Section title="Projeto" rows={projectRows} />
          {webRows.length > 0 && (
            <Section title="Detalhes — Webdesign" rows={webRows} />
          )}
          {categoryRows.length > 0 && (
            <Section title="Detalhes da categoria" rows={categoryRows} />
          )}
          <Section title="Descrição & observações" rows={descriptionRows} />
          {filesRows.length > 0 && (
            <Section title="Arquivos & referências" rows={filesRows} />
          )}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Goodtaste®</Text>
            <Text style={{ marginTop: 4 }}>
              Strategy, design, and communication. · voxteller.com
            </Text>
          </View>
        </View>

        <Text
          style={styles.pageFooter}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
