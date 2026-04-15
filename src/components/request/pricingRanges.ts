export type PriceRange = {
  min: number;
  max: number;
  note?: string;
};

/**
 * Brazilian market reference ranges (BRL). These are estimates based on
 * 2024–2026 studio/freelance averages for each category — not final
 * quotes. They are shown to the client as orientation and to the
 * internal team as a signal for negotiation.
 */

export const WEB_RANGES: Record<string, PriceRange> = {
  auditoria: { min: 3000, max: 15000, note: "por escopo de auditoria" },
  landingpage: { min: 3500, max: 35000, note: "landing page institucional ou campanha" },
  paginasite: { min: 6000, max: 60000, note: "site institucional multi-página" },
  recursos: { min: 1500, max: 12000, note: "pacote de assets e componentes" },
  produto: { min: 15000, max: 150000, note: "produto digital (UI/UX / app / dashboard)" },
  abteste: { min: 2500, max: 10000, note: "por teste, inclui variante e hipótese" },
};

export const CATEGORY_RANGES: Record<string, PriceRange> = {
  webdesign: { min: 3500, max: 150000, note: "varia conforme o escopo selecionado" },
  branding: { min: 12000, max: 80000, note: "identidade completa com manual e aplicações" },
  embalagem: { min: 2500, max: 60000, note: "varia por SKU e complexidade de dieline" },
  apresentacoes: { min: 1800, max: 25000, note: "template até deck de investidor pronto" },
  ilustracoes: { min: 500, max: 18000, note: "unitário até coleção" },
  mockups3d: { min: 1500, max: 60000, note: "still render até animação curta" },
  impressao: { min: 800, max: 40000, note: "cartão até catálogo / revista" },
  estampas: { min: 600, max: 15000, note: "peça única até coleção completa" },
  ebooks: { min: 1200, max: 25000, note: "one-pager até whitepaper premium" },
  email: { min: 1500, max: 15000, note: "template único até sistema modular" },
  ads: { min: 1500, max: 30000, note: "pack avulso até campanha sazonal" },
  outro: { min: 1500, max: 30000, note: "estimativa inicial — ajustamos no retorno" },
};

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function getRange(
  requestType: string,
  webArea?: string,
): PriceRange | null {
  if (requestType === "webdesign" && webArea && WEB_RANGES[webArea]) {
    return WEB_RANGES[webArea];
  }
  return CATEGORY_RANGES[requestType] ?? null;
}
