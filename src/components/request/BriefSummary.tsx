import type { ReactNode } from "react";

type SummarySection = {
  title: string;
  rows: { label: string; value: ReactNode }[];
};

export type BriefSummaryData = {
  title?: string;
  contactName?: string;
  contactEmail?: string;
  company?: string;
  companySize?: string;
  companyAge?: string;
  companyRevenue?: string;
  workFor?: "" | "own" | "other";
  brand?: string;
  requestType?: string;
  requestSubtype?: string;
  description?: string;
  creativeLevel?: string;
  deadline?: string;
  observacoes?: string;
  clientBudget?: string;
  estimatedRange?: string;
  referenceLinks?: string[];
  fileNames?: string[];
  referenceNames?: string[];
  categoryAnswers?: Record<string, string | string[]>;
  webAnswers?: Record<string, string | string[]>;
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

const CREATIVE_LABELS: Record<string, string> = {
  minimo: "Mínimo",
  moderado: "Moderado",
  "world-class": "World-class",
};

function formatValue(value: ReactNode): ReactNode {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return (
      <span className="flex flex-wrap gap-x-1 gap-y-0">
        {value.map((v, i) => (
          <span key={i}>
            {String(v)}
            {i < value.length - 1 && <span className="text-black/35">, </span>}
          </span>
        ))}
      </span>
    );
  }
  return value;
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

function labelize(id: string): string {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default function BriefSummary({ data }: { data: BriefSummaryData }) {
  const sections: SummarySection[] = [
    {
      title: "Contato",
      rows: [
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
      ],
    },
    {
      title: "Perfil da empresa",
      rows: [
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
          label: "Faturamento anual",
          value: formatValue(
            data.companyRevenue
              ? COMPANY_REVENUE_LABELS[data.companyRevenue] ?? data.companyRevenue
              : undefined,
          ),
        },
      ],
    },
    {
      title: "Projeto",
      rows: [
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
      ],
    },
  ];

  const webAnswers = data.webAnswers;
  if (webAnswers && Object.keys(webAnswers).length > 0) {
    sections.push({
      title: "Detalhes — Webdesign",
      rows: Object.entries(webAnswers).map(([k, v]) => ({
        label: labelize(k),
        value: formatValue(v),
      })),
    });
  }

  const catAnswers = data.categoryAnswers;
  if (catAnswers && Object.keys(catAnswers).length > 0) {
    sections.push({
      title: "Detalhes da categoria",
      rows: Object.entries(catAnswers).map(([k, v]) => ({
        label: labelize(k),
        value: formatValue(v),
      })),
    });
  }

  sections.push({
    title: "Descrição & observações",
    rows: [
      { label: "Descrição geral", value: formatValue(data.description) },
      { label: "Observações", value: formatValue(data.observacoes) },
    ],
  });

  if (data.clientBudget || data.estimatedRange) {
    const rows = [];
    if (data.clientBudget) {
      rows.push({
        label: "Orçamento do cliente",
        value: formatValue(
          CLIENT_BUDGET_LABELS[data.clientBudget] ?? data.clientBudget,
        ),
      });
    }
    if (data.estimatedRange) {
      rows.push({
        label: "Range de referência",
        value: formatValue(data.estimatedRange),
      });
    }
    sections.push({ title: "Investimento", rows });
  }

  if (
    (data.fileNames && data.fileNames.length > 0) ||
    (data.referenceNames && data.referenceNames.length > 0) ||
    (data.referenceLinks && data.referenceLinks.length > 0)
  ) {
    sections.push({
      title: "Arquivos & referências",
      rows: [
        {
          label: "Arquivos",
          value: formatValue(data.fileNames ?? []),
        },
        {
          label: "Refs (arquivos)",
          value: formatValue(data.referenceNames ?? []),
        },
        {
          label: "Refs (links / nomes)",
          value: formatValue(data.referenceLinks ?? []),
        },
      ],
    });
  }

  return (
    <div className="brief-summary-printable border-t border-black/15">
      {sections.map((section) => (
        <section
          key={section.title}
          className="grid gap-4 border-b border-black/10 py-6 md:grid-cols-[200px_1fr]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
            {section.title}
          </p>
          <dl className="space-y-3">
            {section.rows.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 md:grid-cols-[180px_1fr] md:gap-6"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[-0.3px] text-black/40">
                  {row.label}
                </dt>
                <dd className="text-[13px] font-medium leading-[1.45] tracking-[-0.2px] text-black">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
