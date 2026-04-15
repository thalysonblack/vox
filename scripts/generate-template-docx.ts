/**
 * Generate a Goodtaste® Website Briefing template as a .docx file —
 * not for the site, a personal working doc for the team.
 *
 * Run: npx tsx scripts/generate-template-docx.ts
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
  LineRuleType,
} from "docx";

const CHECK = "☐";

function brand(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: "GOODTASTE®",
        bold: true,
        size: 20,
        characterSpacing: 30,
      }),
    ],
  });
}

function eyebrow(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 16,
        color: "888888",
        characterSpacing: 60,
      }),
    ],
  });
}

function title(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 56,
      }),
    ],
  });
}

function intro(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 360, line: 320, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text,
        size: 22,
        color: "555555",
      }),
    ],
  });
}

function sectionHeader(index: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 360, after: 180 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 12, color: "111111" },
    },
    children: [
      new TextRun({
        text: `${index}  ·  ${text.toUpperCase()}`,
        bold: true,
        size: 20,
        characterSpacing: 40,
      }),
    ],
  });
}

function fieldLabel(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 40 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 16,
        characterSpacing: 20,
      }),
    ],
  });
}

function fieldHint(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80, line: 280, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 16,
        color: "888888",
      }),
    ],
  });
}

// Creates N blank lines with a bottom border so the user has visible
// write-space. Word respects the border under empty paragraphs when
// they have a tab that stretches across the page.
function writeLines(count: number): Paragraph[] {
  const lines: Paragraph[] = [];
  for (let i = 0; i < count; i++) {
    lines.push(
      new Paragraph({
        spacing: { before: 40, after: 80, line: 320, lineRule: LineRuleType.AUTO },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "cccccc",
          },
        },
        children: [new TextRun({ text: "\t", size: 22 })],
      }),
    );
  }
  return lines;
}

function option(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text: `${CHECK}  ${label}`,
        size: 20,
      }),
    ],
  });
}

function optionsGroup(label: string, options: string[], hint?: string): Paragraph[] {
  const nodes: Paragraph[] = [fieldLabel(label)];
  if (hint) nodes.push(fieldHint(hint));
  options.forEach((opt) => nodes.push(option(opt)));
  return nodes;
}

function textField(label: string, hint: string | undefined, lines: number): Paragraph[] {
  const nodes: Paragraph[] = [fieldLabel(label)];
  if (hint) nodes.push(fieldHint(hint));
  nodes.push(...writeLines(lines));
  return nodes;
}

const doc = new Document({
  creator: "Goodtaste®",
  title: "Goodtaste · Briefing Website",
  description: "Template de briefing de website para preencher.",
  styles: {
    default: {
      document: {
        run: {
          font: "Helvetica",
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1200,
            right: 1200,
            bottom: 1200,
            left: 1200,
          },
        },
      },
      children: [
        brand(),
        eyebrow("Briefing · Website · Template"),
        title("Briefing de website."),
        intro(
          "Preencha com o máximo de contexto que puder. Quanto mais claro o pedido, mais rápido conseguimos devolver uma proposta com escopo, prazo e direção criativa. Marque as opções com X no lugar do ☐.",
        ),

        // ─── 01 Contato ──────────────────────────────────────────
        sectionHeader("01", "Contato"),
        ...textField("Seu nome", undefined, 1),
        ...textField("Email", undefined, 1),
        ...textField("Empresa", "Quem nos contrata.", 1),
        ...textField(
          "Marca / cliente final",
          "Preencha só se esse trabalho é para outra marca (fluxo agência → cliente).",
          1,
        ),
        ...optionsGroup("Para quem é esse trabalho?", [
          "Para a minha empresa",
          "Para outra marca / cliente",
        ]),
        ...optionsGroup("Número de funcionários", [
          "Só eu",
          "2 a 5 pessoas",
          "6 a 20 pessoas",
          "21 a 50 pessoas",
          "51 a 200 pessoas",
          "200+ pessoas",
        ]),
        ...optionsGroup("Há quanto tempo a empresa existe?", [
          "Menos de 1 ano",
          "1 a 3 anos",
          "3 a 7 anos",
          "7 a 15 anos",
          "15+ anos",
        ]),
        ...optionsGroup("Média de faturamento anual", [
          "R$ 200k – 500k",
          "R$ 500k – 2M",
          "R$ 2M – 10M",
          "R$ 10M – 50M",
        ]),

        // ─── 02 Título ───────────────────────────────────────────
        sectionHeader("02", "Título da solicitação"),
        ...textField(
          "Dê um nome curto para este briefing",
          undefined,
          1,
        ),

        // ─── 03 Área ─────────────────────────────────────────────
        sectionHeader("03", "Área do website"),
        ...optionsGroup("Em que vamos trabalhar?", [
          "Auditoria UI/UX",
          "Landing page(s)",
          "Página(s) do site",
          "Assets & elementos",
          "Design de produto",
          "Teste A/B",
        ]),

        // ─── 04 Detalhes ─────────────────────────────────────────
        sectionHeader("04", "Detalhes do projeto"),
        ...optionsGroup("Tipo de entrega", [
          "Novos designs",
          "Redesenhar / otimizar um design existente",
        ]),
        ...optionsGroup(
          "Objetivos principais",
          [
            "Anunciar ou promover produto/serviço",
            "Facilitar cadastros ou downloads",
            "Engajamento",
            "Gerar leads",
            "Coletar feedback / pesquisa",
            "Outro",
          ],
          "Marque todas as opções que se aplicam.",
        ),
        ...optionsGroup("Como você descreveria essa página?", [
          "Página inicial",
          "Sobre",
          "Contato",
          "Checkout",
          "Blog",
          "Produto / serviço",
          "Portfólio",
          "Cases",
          "Depoimentos",
          "Carreiras",
          "Preços",
          "Outro",
        ]),
        ...textField(
          "Jornada do cliente",
          "Como chega tráfego? O que vem antes dessa página na experiência?",
          4,
        ),
        ...textField(
          "Público-alvo",
          "Quem são, dores, interesses específicos, requisitos.",
          4,
        ),
        ...textField(
          "Conte mais sobre a solicitação",
          "Propostas principais, wireframes, contexto, desafios, referências.",
          8,
        ),
        ...optionsGroup("Você já tem o conteúdo/redação pronto?", [
          "Sim",
          "Não — pode usar Lorem Ipsum",
        ]),

        // ─── 05 Criativo & prazo ─────────────────────────────────
        sectionHeader("05", "Exploração criativa & prazo"),
        ...optionsGroup("Nível de exploração criativa", [
          "Mínimo — seguir estritamente as diretrizes",
          "Moderado — explorar novos estilos respeitando a marca",
          "World-class — ir além dos conceitos atuais",
        ]),
        ...textField("Prazo sugerido (DD / MM / AAAA)", undefined, 1),
        ...optionsGroup("Orçamento previsto para o projeto", [
          "Até R$ 5.000",
          "R$ 5.000 – 15.000",
          "R$ 15.000 – 40.000",
          "R$ 40.000 – 100.000",
          "R$ 100.000+",
        ]),

        // ─── 06 Referências ──────────────────────────────────────
        sectionHeader("06", "Referências"),
        ...textField(
          "Arquivos necessários",
          "Liste os nomes aqui e anexe separadamente se for enviar por email.",
          4,
        ),
        ...textField(
          "Referências para inspiração (URLs ou nomes)",
          "Não precisam ser do mesmo segmento.",
          4,
        ),

        // ─── 07 Observações ──────────────────────────────────────
        sectionHeader("07", "Observações finais"),
        ...textField(
          "Ideias adicionais, contexto extra, o que não cabe nos campos acima",
          undefined,
          8,
        ),

        new Paragraph({
          spacing: { before: 600 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" },
          },
          children: [
            new TextRun({
              text: "Goodtaste®  ·  voxteller.com",
              size: 14,
              color: "888888",
              bold: true,
              characterSpacing: 30,
            }),
          ],
        }),
      ],
    },
  ],
});

async function main() {
  const outPath = resolve(process.cwd(), "goodtaste-briefing-website.docx");
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outPath, buffer);
  console.log(`✅ Template DOCX written to ${outPath}`);
}

void main();
