import {
  Document,
  Page,
  Text,
  View,
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
  unsure: "Ainda não sei",
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

// @react-pdf bundles Helvetica natively — no font loading dance, stays
// crisp at any zoom level since everything is vector.
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    color: "#111111",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 16,
    marginBottom: 32,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 8,
    color: "#888888",
    textAlign: "right",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  titleBlock: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 1.1,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 11,
    color: "#555555",
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionBar: {
    width: 14,
    height: 2,
    backgroundColor: "#111111",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    width: 130,
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  rowValue: {
    flex: 1,
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.5,
  },
  rangeBlock: {
    marginTop: 4,
    marginBottom: 22,
    padding: 20,
    backgroundColor: "#f5f5f4",
    flexDirection: "column",
  },
  rangeLabel: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  rangeValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.6,
  },
  rangeNote: {
    marginTop: 6,
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#111111",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#eeeeee",
    paddingTop: 12,
    fontSize: 8,
    color: "#999999",
  },
  footerText: {
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

function RowsList({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <View>
      {rows.map((row, idx) => (
        <View
          key={row.label}
          style={[
            styles.row,
            idx === rows.length - 1 ? styles.rowLast : {},
          ]}
        >
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <RowsList rows={rows} />
    </View>
  );
}

export default function BriefPDF({ data }: { data: BriefSummaryData }) {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
      ? [
          {
            label: "Subcategoria",
            value: formatValue(data.requestSubtype),
          },
        ]
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

  const filesRows = [
    ...(data.fileNames && data.fileNames.length > 0
      ? [{ label: "Arquivos", value: data.fileNames.join(", ") }]
      : []),
    ...(data.referenceNames && data.referenceNames.length > 0
      ? [
          {
            label: "Refs (arquivos)",
            value: data.referenceNames.join(", "),
          },
        ]
      : []),
    ...(data.referenceLinks && data.referenceLinks.length > 0
      ? [
          {
            label: "Refs (links)",
            value: data.referenceLinks.join(", "),
          },
        ]
      : []),
  ];

  return (
    <Document
      title={`Briefing — ${data.title ?? "Goodtaste"}`}
      author="Goodtaste"
      creator="Goodtaste"
      producer="Goodtaste"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Goodtaste®</Text>
          <Text style={styles.meta}>Briefing · {today}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Solicitação</Text>
          <Text style={styles.title}>{data.title ?? "Briefing sem título"}</Text>
          {data.requestType && (
            <Text style={styles.subtitle}>
              {REQUEST_TYPE_LABELS[data.requestType] ?? data.requestType}
              {data.company ? ` · ${data.company}` : ""}
            </Text>
          )}
        </View>

        {data.clientBudget && (
          <View style={styles.rangeBlock} wrap={false}>
            <Text style={styles.rangeLabel}>Orçamento previsto</Text>
            <Text style={styles.rangeValue}>
              {CLIENT_BUDGET_LABELS[data.clientBudget] ?? data.clientBudget}
            </Text>
            <Text style={styles.rangeNote}>
              Valor indicado pelo cliente. A proposta final é definida após
              entendermos o escopo completo do projeto.
            </Text>
          </View>
        )}

        <Section title="Contato" rows={contactRows} />
        <Section title="Perfil da empresa" rows={companyRows} />
        <Section title="Projeto" rows={projectRows} />
        {webRows.length > 0 && (
          <Section title="Detalhes — Webdesign" rows={webRows} />
        )}
        {categoryRows.length > 0 && (
          <Section title="Detalhes da categoria" rows={categoryRows} />
        )}

        {(data.description || data.observacoes) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>Descrição & observações</Text>
            </View>
            {data.description && (
              <Text style={styles.description}>{data.description}</Text>
            )}
            {data.observacoes && (
              <Text style={[styles.description, { marginTop: 10 }]}>
                {data.observacoes}
              </Text>
            )}
          </View>
        )}

        {filesRows.length > 0 && (
          <Section title="Arquivos & referências" rows={filesRows} />
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Goodtaste® · Briefing</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
