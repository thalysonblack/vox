import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

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
    marginBottom: 24,
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
  eyebrow: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 1.05,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -1,
    marginBottom: 14,
  },
  intro: {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#555555",
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 18,
    marginBottom: 12,
  },
  sectionBar: {
    width: 14,
    height: 2,
    backgroundColor: "#111111",
    marginRight: 10,
  },
  sectionIndex: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#888888",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#111111",
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  fieldHint: {
    fontSize: 8,
    color: "#888888",
    lineHeight: 1.45,
    marginBottom: 8,
  },
  writeLineShort: {
    borderBottomWidth: 0.7,
    borderBottomColor: "#cccccc",
    height: 18,
  },
  writeBoxShort: {
    borderWidth: 0.7,
    borderColor: "#cccccc",
    height: 36,
  },
  writeBoxMedium: {
    borderWidth: 0.7,
    borderColor: "#cccccc",
    height: 66,
  },
  writeBoxLarge: {
    borderWidth: 0.7,
    borderColor: "#cccccc",
    height: 110,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  optionPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.7,
    borderColor: "#cccccc",
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    marginRight: 6,
    marginBottom: 6,
  },
  optionBox: {
    width: 8,
    height: 8,
    borderWidth: 0.7,
    borderColor: "#888888",
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 9,
    color: "#111111",
  },
  sectionColumns: {
    flexDirection: "row",
    gap: 14,
  },
  columnHalf: {
    flex: 1,
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

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <View style={styles.sectionHeader} wrap={false}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionIndex}>{index}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({
  label,
  hint,
  size = "line",
}: {
  label: string;
  hint?: string;
  size?: "line" | "short" | "medium" | "large";
}) {
  const boxStyle =
    size === "line"
      ? styles.writeLineShort
      : size === "short"
        ? styles.writeBoxShort
        : size === "medium"
          ? styles.writeBoxMedium
          : styles.writeBoxLarge;
  return (
    <View style={styles.field} wrap={false}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <View style={boxStyle} />
    </View>
  );
}

function Options({
  label,
  options,
  hint,
}: {
  label: string;
  options: string[];
  hint?: string;
}) {
  return (
    <View style={styles.field} wrap={false}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <View key={opt} style={styles.optionPill}>
            <View style={styles.optionBox} />
            <Text style={styles.optionLabel}>{opt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function BriefTemplatePDF() {
  return (
    <Document
      title="Goodtaste — Briefing Website (Template)"
      author="Goodtaste"
      creator="Goodtaste"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Goodtaste®</Text>
          <Text style={styles.meta}>Briefing · Website · Template</Text>
        </View>

        <Text style={styles.eyebrow}>Solicitação · Website</Text>
        <Text style={styles.title}>Briefing de website.</Text>
        <Text style={styles.intro}>
          Preencha com o máximo de contexto que puder. Quanto mais claro o
          pedido, mais rápido conseguimos devolver uma proposta com escopo,
          prazo e direção criativa. Se preferir, use a versão digital em
          voxteller.com/request — é a mesma lista, com uploads diretos.
        </Text>

        <SectionHeader index="01" title="Contato" />
        <View style={styles.sectionColumns}>
          <View style={styles.columnHalf}>
            <Field label="Seu nome" />
            <Field label="Empresa" />
          </View>
          <View style={styles.columnHalf}>
            <Field label="Email" />
            <Field label="Marca / cliente final (se aplicável)" />
          </View>
        </View>
        <Options
          label="Para quem é esse trabalho?"
          options={["Para a minha empresa", "Para outra marca / cliente"]}
        />
        <Options
          label="Número de funcionários"
          options={["Só eu", "2 a 5", "6 a 20", "21 a 50", "51 a 200", "200+"]}
        />
        <Options
          label="Há quanto tempo a empresa existe?"
          options={[
            "Menos de 1 ano",
            "1 a 3 anos",
            "3 a 7 anos",
            "7 a 15 anos",
            "15+ anos",
          ]}
        />
        <Options
          label="Média de faturamento anual"
          options={[
            "R$ 200k – 500k",
            "R$ 500k – 2M",
            "R$ 2M – 10M",
            "R$ 10M – 50M",
          ]}
        />

        <SectionHeader index="02" title="Título da solicitação" />
        <Field label="Dê um nome curto para este briefing" size="line" />

        <SectionHeader index="03" title="Área do website" />
        <Options
          label="Em que vamos trabalhar?"
          options={[
            "Auditoria UI/UX",
            "Landing page(s)",
            "Página(s) do site",
            "Assets & elementos",
            "Design de produto",
            "Teste A/B",
          ]}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Goodtaste®</Text>
          <Text style={styles.meta}>Briefing · Website · Template</Text>
        </View>

        <SectionHeader index="04" title="Detalhes do projeto" />
        <Options
          label="Tipo de entrega"
          options={[
            "Novos designs",
            "Redesenhar / otimizar um design existente",
          ]}
        />
        <Options
          label="Objetivos principais (marque todos que se aplicam)"
          options={[
            "Anunciar ou promover produto/serviço",
            "Facilitar cadastros ou downloads",
            "Engajamento",
            "Gerar leads",
            "Coletar feedback / pesquisa",
            "Outro",
          ]}
        />
        <Options
          label="Como você descreveria essa página?"
          options={[
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
          ]}
        />
        <Field
          label="Jornada do cliente"
          hint="Como chega tráfego? O que vem antes dessa página na experiência?"
          size="medium"
        />
        <Field
          label="Público-alvo"
          hint="Quem são, dores, interesses específicos, requisitos."
          size="medium"
        />
        <Field
          label="Conte mais sobre a solicitação"
          hint="Propostas principais, wireframes, contexto, desafios, referências."
          size="large"
        />
        <Options
          label="Você já tem o conteúdo/redação pronto?"
          options={["Sim", "Não — pode usar Lorem Ipsum"]}
        />

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Goodtaste® · voxteller.com</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Goodtaste®</Text>
          <Text style={styles.meta}>Briefing · Website · Template</Text>
        </View>

        <SectionHeader index="05" title="Exploração criativa & prazo" />
        <Options
          label="Nível de exploração criativa"
          options={[
            "Mínimo — seguir estritamente as diretrizes",
            "Moderado — explorar novos estilos respeitando a marca",
            "World-class — ir além dos conceitos atuais",
          ]}
        />
        <Field
          label="Prazo sugerido (DD / MM / AAAA)"
          size="line"
        />
        <Options
          label="Orçamento previsto para o projeto"
          options={[
            "Até R$ 5.000",
            "R$ 5.000 – 15.000",
            "R$ 15.000 – 40.000",
            "R$ 40.000 – 100.000",
            "R$ 100.000+",
          ]}
        />

        <SectionHeader index="06" title="Referências" />
        <Field
          label="Arquivos necessários"
          hint="Wireframes, briefings anteriores, logos, assets. Liste os nomes aqui e anexe em separado se for enviar por email."
          size="medium"
        />
        <Field
          label="Referências para inspiração (URLs ou nomes)"
          hint="Referências não precisam ser do mesmo segmento."
          size="medium"
        />

        <SectionHeader index="07" title="Observações finais" />
        <Field
          label="Ideias adicionais, contexto extra, o que não cabe nos campos acima."
          size="large"
        />

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Goodtaste® · voxteller.com</Text>
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
