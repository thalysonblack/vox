export type CategoryField =
  | {
      id: string;
      kind: "radio";
      label: string;
      options: string[];
      hint?: string;
    }
  | {
      id: string;
      kind: "checkbox";
      label: string;
      options: string[];
      hint?: string;
    }
  | {
      id: string;
      kind: "textarea";
      label: string;
      hint?: string;
      rows?: number;
    };

export type CategorySchema = {
  title: string;
  fields: CategoryField[];
};

export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
  branding: {
    title: "Identidade Visual / Branding",
    fields: [
      {
        id: "projectType",
        kind: "radio",
        label: "Qual o momento da marca?",
        options: [
          "Marca nova, começando do zero",
          "Rebrand completo",
          "Refresh / atualização",
          "Extensão (novo produto / vertical)",
        ],
      },
      {
        id: "deliverables",
        kind: "checkbox",
        label: "O que entra no escopo?",
        options: [
          "Logo / marca principal",
          "Símbolo / monograma",
          "Sistema de cores",
          "Sistema tipográfico",
          "Grafismos & padrões",
          "Ícones",
          "Guia rápido (mini brand book)",
          "Manual completo (brand book)",
          "Aplicações digitais",
          "Aplicações impressas",
          "Papelaria",
        ],
      },
      {
        id: "personality",
        kind: "textarea",
        label: "Personalidade da marca",
        hint: "3 a 5 adjetivos que descrevem o tom (ex: precisa, acolhedora, rebelde). Se tiver, cite valores.",
      },
      {
        id: "audience",
        kind: "textarea",
        label: "Público-alvo",
        hint: "Quem é, o que consome, o que valoriza. Quanto mais específico, melhor.",
      },
      {
        id: "competitors",
        kind: "textarea",
        label: "Concorrentes & referências",
        hint: "Marcas do mesmo mercado + marcas fora do mercado que te inspiram. Diga o que você gosta e o que quer evitar.",
      },
      {
        id: "assets",
        kind: "radio",
        label: "Existem assets atuais da marca?",
        options: [
          "Não, marca nova",
          "Sim, mas posso descartar tudo",
          "Sim, quero preservar alguns elementos",
          "Sim, rebrand total mantendo o nome",
        ],
      },
      {
        id: "naming",
        kind: "radio",
        label: "Precisa de naming ou tagline?",
        options: ["Só naming", "Só tagline", "Os dois", "Nenhum"],
      },
    ],
  },
  embalagem: {
    title: "Embalagem / Packaging",
    fields: [
      {
        id: "productCategory",
        kind: "radio",
        label: "Categoria do produto",
        options: [
          "Alimento & bebida",
          "Cosmético / beleza",
          "Saúde / farma",
          "Moda / apparel",
          "Tecnologia",
          "Doméstico",
          "Pet",
          "Outro",
        ],
      },
      {
        id: "format",
        kind: "checkbox",
        label: "Formato da embalagem",
        options: [
          "Caixa",
          "Garrafa",
          "Lata",
          "Pouch / sachê",
          "Tubo",
          "Sleeve / rótulo",
          "Blister",
          "Saco / bag",
          "Hangtag",
          "A definir",
        ],
      },
      {
        id: "skuCount",
        kind: "radio",
        label: "Quantas variações (SKUs)?",
        options: ["1", "2 a 3", "4 a 6", "7+", "Linha sazonal"],
      },
      {
        id: "dieline",
        kind: "radio",
        label: "Dieline / faca",
        options: [
          "Já tenho a faca pronta",
          "Tenho a medida mas preciso da faca",
          "Preciso criar do zero",
        ],
      },
      {
        id: "regulatory",
        kind: "checkbox",
        label: "Informações obrigatórias",
        options: [
          "Tabela nutricional",
          "Lista de ingredientes",
          "Alergênicos",
          "Código de barras",
          "Registro (Anvisa, MAPA, INPI)",
          "Bilíngue / multi-idioma",
          "Símbolos de reciclagem",
          "Nenhum / não sei",
        ],
      },
      {
        id: "context",
        kind: "textarea",
        label: "Contexto & histórico do produto",
        hint: "Concorrentes na gôndola, preço, ponto de venda (DTC, varejo, premium, popular), quem é o consumidor.",
      },
    ],
  },
  apresentacoes: {
    title: "Apresentações",
    fields: [
      {
        id: "deckType",
        kind: "radio",
        label: "Tipo de deck",
        options: [
          "Pitch de investimento",
          "Sales / comercial",
          "Apresentação institucional",
          "Keynote de evento",
          "Relatório / resultado",
          "Onboarding interno",
          "Outro",
        ],
      },
      {
        id: "platform",
        kind: "radio",
        label: "Onde vai editar depois?",
        options: [
          "PowerPoint / .pptx",
          "Google Slides",
          "Keynote",
          "Figma",
          "PDF final, sem edição",
        ],
      },
      {
        id: "slides",
        kind: "radio",
        label: "Estimativa de slides",
        options: ["Até 10", "11 a 20", "21 a 40", "41+", "Não sei ainda"],
      },
      {
        id: "scope",
        kind: "radio",
        label: "Escopo",
        options: [
          "Template + masters (você preenche depois)",
          "Template + até 5 slides prontos",
          "Deck inteiro montado",
          "Retrabalho de um deck existente",
        ],
      },
      {
        id: "content",
        kind: "radio",
        label: "Conteúdo",
        options: [
          "Copy, dados e imagens prontos",
          "Copy parcial, precisa de ajuda",
          "Só tenho bullets / draft",
        ],
      },
      {
        id: "audience",
        kind: "textarea",
        label: "Quem vai assistir?",
        hint: "Investidores, clientes, equipe, evento público. Tom esperado.",
      },
    ],
  },
  ilustracoes: {
    title: "Ilustrações",
    fields: [
      {
        id: "style",
        kind: "checkbox",
        label: "Estilo desejado",
        options: [
          "Flat / vetorial",
          "Line art",
          "Editorial",
          "Isométrico",
          "3D",
          "Texturizado / mão livre",
          "Personagem",
          "Ícone",
          "Pattern / padronagem",
          "Abstrato",
          "A definir",
        ],
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Quantidade",
        options: ["1", "2 a 5", "6 a 10", "11 a 20", "20+"],
      },
      {
        id: "usage",
        kind: "checkbox",
        label: "Onde vai ser usado?",
        options: [
          "Web / landing page",
          "Blog / editorial",
          "Mídia social",
          "Impressão",
          "Produto / merchandise",
          "Apresentação",
          "E-book",
          "Embalagem",
        ],
      },
      {
        id: "format",
        kind: "checkbox",
        label: "Formatos de entrega",
        options: ["SVG", "PNG transparente", "AI / source", "PDF", "JPG alta"],
      },
      {
        id: "palette",
        kind: "radio",
        label: "Paleta",
        options: [
          "Seguir a paleta da marca",
          "Paleta livre",
          "Monocromático",
          "Preto e branco",
        ],
      },
      {
        id: "concept",
        kind: "textarea",
        label: "Conceito & cenas",
        hint: "Descreva o que cada ilustração precisa representar, contexto narrativo, personagens, objetos. Referências ajudam muito.",
        rows: 5,
      },
    ],
  },
  mockups3d: {
    title: "3D / Maquetes",
    fields: [
      {
        id: "type",
        kind: "radio",
        label: "Tipo de entrega",
        options: [
          "Mockup de embalagem (produto real)",
          "Render de produto industrial",
          "Cena / ambiente",
          "Personagem",
          "Arquitetônico",
          "Loop / animação curta",
          "Modelo glTF para web",
        ],
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Quantas visualizações?",
        options: ["1 ângulo", "2 a 3 ângulos", "4 a 6 ângulos", "7+", "Animação"],
      },
      {
        id: "source",
        kind: "radio",
        label: "Modelo base",
        options: [
          "Tenho CAD / modelo pronto",
          "Tenho referências + dimensões",
          "Preciso criar do zero",
        ],
      },
      {
        id: "finish",
        kind: "checkbox",
        label: "Acabamento & materiais",
        options: [
          "Fosco",
          "Brilhante / verniz",
          "Metalizado",
          "Transparente",
          "Texturizado",
          "Hot stamping / foil",
          "Soft touch",
        ],
      },
      {
        id: "use",
        kind: "checkbox",
        label: "Uso final",
        options: [
          "E-commerce",
          "Campanha / ads",
          "Pitch deck",
          "Impressão alta resolução",
          "Redes sociais",
          "Web (3D interativo)",
          "AR / VR",
        ],
      },
      {
        id: "context",
        kind: "textarea",
        label: "Direção de arte",
        hint: "Mood, iluminação (estúdio, natural, dramática), cenário, referências visuais.",
      },
    ],
  },
  impressao: {
    title: "Design para impressão",
    fields: [
      {
        id: "format",
        kind: "radio",
        label: "Formato",
        options: [
          "Cartão de visita",
          "Flyer / panfleto",
          "Pôster",
          "Folder / brochure",
          "Catálogo",
          "Revista / livro",
          "Banner / lona grande",
          "Convite",
          "Adesivo",
          "Outro",
        ],
      },
      {
        id: "size",
        kind: "textarea",
        label: "Dimensões & páginas",
        hint: "Ex: A4, 10x15, 90x50mm. Se for múltiplas páginas, diga quantas.",
        rows: 2,
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Tiragem",
        options: [
          "Até 100",
          "100 a 1.000",
          "1.000 a 10.000",
          "10.000+",
          "Uso digital apenas",
        ],
      },
      {
        id: "paper",
        kind: "checkbox",
        label: "Papel / acabamento",
        options: [
          "Couché fosco",
          "Couché brilho",
          "Offset / reciclato",
          "Cartão supremo",
          "Laminação fosca",
          "Verniz localizado",
          "Hot stamping",
          "Relevo",
          "A gráfica decide",
        ],
      },
      {
        id: "content",
        kind: "radio",
        label: "Conteúdo",
        options: [
          "Texto e imagens prontos",
          "Texto pronto, precisa de imagens",
          "Só tenho briefing, precisa criar tudo",
        ],
      },
      {
        id: "delivery",
        kind: "radio",
        label: "Entrega final",
        options: [
          "PDF fechado para gráfica",
          "Pacote editável (InDesign, AI)",
          "Os dois",
        ],
      },
    ],
  },
  estampas: {
    title: "Estampas (produto & apparel)",
    fields: [
      {
        id: "product",
        kind: "checkbox",
        label: "Produto",
        options: [
          "Camiseta",
          "Moletom / hoodie",
          "Bolsa / tote",
          "Boné",
          "Meia",
          "Caneca",
          "Almofada",
          "Adesivo",
          "Poster",
          "Outro",
        ],
      },
      {
        id: "technique",
        kind: "radio",
        label: "Técnica de impressão",
        options: [
          "Silk / serigrafia",
          "DTG (digital)",
          "Sublimação",
          "Bordado",
          "Transfer",
          "Não sei, vocês decidem",
        ],
      },
      {
        id: "colors",
        kind: "radio",
        label: "Limite de cores",
        options: [
          "1 cor",
          "2 cores",
          "3 a 4 cores",
          "Full color",
          "A definir",
        ],
      },
      {
        id: "placement",
        kind: "checkbox",
        label: "Posicionamento",
        options: [
          "Peito",
          "Costas",
          "Lateral",
          "Manga",
          "Corrida (all-over)",
          "Pequeno (bolso / etiqueta)",
        ],
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Quantas estampas diferentes?",
        options: ["1", "2 a 3", "4 a 6", "Coleção (7+)"],
      },
      {
        id: "theme",
        kind: "textarea",
        label: "Tema & conceito",
        hint: "Qual a ideia por trás da coleção? Para quem é? Tom, humor, referências.",
      },
    ],
  },
  ebooks: {
    title: "E-book / One-pager",
    fields: [
      {
        id: "type",
        kind: "radio",
        label: "Tipo",
        options: [
          "E-book completo",
          "Whitepaper",
          "Relatório / research",
          "One-pager / resumo",
          "Guia / how-to",
          "Checklist",
        ],
      },
      {
        id: "pages",
        kind: "radio",
        label: "Tamanho",
        options: [
          "1 página",
          "2 a 5 páginas",
          "6 a 15 páginas",
          "16 a 30 páginas",
          "31+ páginas",
        ],
      },
      {
        id: "goal",
        kind: "radio",
        label: "Objetivo principal",
        options: [
          "Lead magnet (captura)",
          "Sales / conversão",
          "Educacional / conteúdo",
          "Institucional",
          "Interno",
        ],
      },
      {
        id: "format",
        kind: "checkbox",
        label: "Formato de entrega",
        options: [
          "PDF padrão",
          "PDF interativo (links, forms)",
          "Versão printable",
          "Figma editável",
          "Indesign / source",
        ],
      },
      {
        id: "content",
        kind: "radio",
        label: "Conteúdo",
        options: [
          "Texto final revisado",
          "Texto draft, precisa estruturar",
          "Só tenho os tópicos",
        ],
      },
      {
        id: "visuals",
        kind: "checkbox",
        label: "Visuais necessários",
        options: [
          "Ilustrações",
          "Gráficos / dataviz",
          "Fotos de stock",
          "Ícones",
          "Capa impactante",
          "Só tipografia",
        ],
      },
    ],
  },
  email: {
    title: "Email templates",
    fields: [
      {
        id: "type",
        kind: "checkbox",
        label: "Tipos de email",
        options: [
          "Newsletter",
          "Promocional / campanha",
          "Transacional",
          "Boas-vindas / welcome",
          "Onboarding (sequência)",
          "Abandono de carrinho",
          "Reengajamento",
          "Eventos",
        ],
      },
      {
        id: "platform",
        kind: "radio",
        label: "Plataforma de envio",
        options: [
          "Mailchimp",
          "Klaviyo",
          "Brevo (Sendinblue)",
          "HubSpot",
          "ActiveCampaign",
          "SendGrid",
          "RD Station",
          "Custom / HTML puro",
          "Não sei ainda",
        ],
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Quantos templates?",
        options: [
          "1 template",
          "2 a 3",
          "4 a 6",
          "Sistema modular completo",
        ],
      },
      {
        id: "features",
        kind: "checkbox",
        label: "Requisitos técnicos",
        options: [
          "Responsivo mobile",
          "Dark mode",
          "Blocos modulares reutilizáveis",
          "Código HTML entregue",
          "Acessibilidade",
          "Variáveis dinâmicas (merge tags)",
        ],
      },
      {
        id: "brand",
        kind: "radio",
        label: "Guidelines de marca",
        options: [
          "Sim, tenho brand book",
          "Tenho referências parciais",
          "Não, começar do zero",
        ],
      },
    ],
  },
  ads: {
    title: "Ads / Social media",
    fields: [
      {
        id: "platform",
        kind: "checkbox",
        label: "Plataformas",
        options: [
          "Instagram / Meta",
          "TikTok",
          "LinkedIn",
          "YouTube",
          "X (Twitter)",
          "Pinterest",
          "Google Display",
          "Google Search",
          "Programmatic / DSP",
        ],
      },
      {
        id: "format",
        kind: "checkbox",
        label: "Formatos",
        options: [
          "Static (feed)",
          "Carrossel",
          "Story 9:16",
          "Reels / TikTok vídeo",
          "Banner display",
          "Thumbnail YouTube",
          "Cover / capa",
          "GIF animado",
        ],
      },
      {
        id: "quantity",
        kind: "radio",
        label: "Volume",
        options: [
          "Peça única",
          "Pack de 3 a 5",
          "Pack de 6 a 15",
          "Campanha mensal recorrente",
          "Campanha sazonal grande",
        ],
      },
      {
        id: "goal",
        kind: "radio",
        label: "Objetivo da campanha",
        options: [
          "Awareness",
          "Engajamento",
          "Tráfego",
          "Conversão / venda",
          "Lead / cadastro",
          "App install",
        ],
      },
      {
        id: "content",
        kind: "radio",
        label: "Conteúdo",
        options: [
          "Copy e assets prontos",
          "Copy pronto, precisa criar visual",
          "Preciso de copy e visual",
        ],
      },
      {
        id: "audience",
        kind: "textarea",
        label: "Público & tom",
        hint: "Quem é o alvo, tom desejado, restrições (compliance, legal).",
      },
    ],
  },
  outro: {
    title: "Outro",
    fields: [
      {
        id: "description",
        kind: "textarea",
        label: "Descreva a solicitação",
        hint: "Como isso não se encaixa nas categorias acima, conte com máximo de contexto: o que precisa, prazo, uso final, referências.",
        rows: 8,
      },
    ],
  },
};
