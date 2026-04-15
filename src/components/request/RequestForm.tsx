"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { CATEGORY_SCHEMAS, type CategoryField } from "./categorySchemas";

type RequestType =
  | ""
  | "webdesign"
  | "branding"
  | "embalagem"
  | "apresentacoes"
  | "ilustracoes"
  | "mockups3d"
  | "impressao"
  | "estampas"
  | "ebooks"
  | "email"
  | "ads"
  | "outro";

type WebArea =
  | ""
  | "auditoria"
  | "landingpage"
  | "paginasite"
  | "recursos"
  | "produto"
  | "abteste";

const REQUEST_TYPES: { value: Exclude<RequestType, "">; label: string }[] = [
  { value: "webdesign", label: "Design de sites" },
  { value: "branding", label: "Identidade Visual (CI)" },
  { value: "embalagem", label: "Embalagem" },
  { value: "apresentacoes", label: "Apresentações" },
  { value: "ilustracoes", label: "Ilustrações" },
  { value: "mockups3d", label: "Maquetes e modelos 3D" },
  { value: "impressao", label: "Desenhos de impressão" },
  { value: "estampas", label: "Estampas — produtos & roupas" },
  { value: "ebooks", label: "E-books e resumos de uma página" },
  { value: "email", label: "Modelos de e-mail" },
  { value: "ads", label: "Anúncios / mídias sociais" },
  { value: "outro", label: "Outro (especificarei na descrição)" },
];

const WEB_AREAS: { value: Exclude<WebArea, "">; label: string }[] = [
  { value: "auditoria", label: "Auditoria de UI/UX" },
  { value: "landingpage", label: "Landing page(s)" },
  { value: "paginasite", label: "Página(s) do site" },
  { value: "recursos", label: "Recursos & elementos da página" },
  { value: "produto", label: "Design de produto" },
  { value: "abteste", label: "Teste A/B" },
];

const GOALS = [
  "Anunciar ou promover um produto/serviço",
  "Facilitar cadastros/inscrições ou downloads",
  "Entreter e impulsionar o engajamento",
  "Gerar leads",
  "Coletar feedback ou pesquisa",
  "Outro",
];

const PAGE_DESCRIPTIONS = [
  "Página inicial",
  "Página Sobre Nós",
  "Página de contato",
  "Página de finalização da compra",
  "Página do blog",
  "Página de perguntas frequentes",
  "Página do produto ou serviço",
  "Página de Portfólio",
  "Página de Estudos de Caso",
  "Página de depoimentos",
  "Página de Carreiras",
  "Página de Recursos",
  "Página de eventos",
  "Página de login/cadastro",
  "Página de preços",
  "Outro",
];

const CREATIVE_LEVELS: { value: string; label: string; hint: string }[] = [
  {
    value: "minimo",
    label: "Mínimo",
    hint: "Focar estritamente nas diretrizes e no modelo de instrução criativa.",
  },
  {
    value: "moderado",
    label: "Moderado",
    hint: "Explorar novos estilos respeitando as diretrizes da marca.",
  },
  {
    value: "world-class",
    label: "World-class",
    hint: "Ir além de qualquer conceito atual, mantendo o core da marca.",
  },
];

type FormState = {
  title: string;
  contactName: string;
  contactEmail: string;
  company: string;
  workFor: "" | "own" | "other";
  brand: string;
  referenceLinks: string[];
  requestType: RequestType;
  webArea: WebArea;
  tipoAuditoria: string;
  descricaoAuditoria: string;
  dadosUX: string;
  tipoPaginaDestino: string;
  tipoPaginaSite: string;
  goals: string[];
  descricaoPagina: string;
  jornadaCliente: string;
  audienciaAlvo: string;
  descricaoRequestSite: string;
  temConteudo: string;
  tipoRecurso: string;
  descricaoRecursos: string;
  tipoProduto: string;
  descricaoProduto: string;
  fluxoNavegacao: string;
  requisitosProduto: string;
  organizarAB: string;
  objetivoAB: string;
  descricaoAB: string;
  description: string;
  creativeLevel: string;
  deadline: string;
  observacoes: string;
  files: File[];
  references: File[];
  categoryAnswers: Record<string, string | string[]>;
};

const INITIAL_STATE: FormState = {
  title: "",
  contactName: "",
  contactEmail: "",
  company: "",
  workFor: "",
  brand: "",
  referenceLinks: [],
  requestType: "",
  webArea: "",
  tipoAuditoria: "",
  descricaoAuditoria: "",
  dadosUX: "",
  tipoPaginaDestino: "",
  tipoPaginaSite: "",
  goals: [],
  descricaoPagina: "",
  jornadaCliente: "",
  audienciaAlvo: "",
  descricaoRequestSite: "",
  temConteudo: "",
  tipoRecurso: "",
  descricaoRecursos: "",
  tipoProduto: "",
  descricaoProduto: "",
  fluxoNavegacao: "",
  requisitosProduto: "",
  organizarAB: "",
  objetivoAB: "",
  descricaoAB: "",
  description: "",
  creativeLevel: "",
  deadline: "",
  observacoes: "",
  files: [],
  references: [],
  categoryAnswers: {},
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function RequestForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setRequestType = (value: RequestType) => {
    setForm((prev) => ({
      ...prev,
      requestType: value,
      webArea: "",
      categoryAnswers: {},
    }));
  };

  const setCategoryAnswer = (id: string, value: string | string[]) => {
    setForm((prev) => ({
      ...prev,
      categoryAnswers: { ...prev.categoryAnswers, [id]: value },
    }));
  };

  const toggleCategoryCheckbox = (id: string, option: string) => {
    setForm((prev) => {
      const current = prev.categoryAnswers[id];
      const arr = Array.isArray(current) ? current : [];
      const next = arr.includes(option)
        ? arr.filter((v) => v !== option)
        : [...arr, option];
      return {
        ...prev,
        categoryAnswers: { ...prev.categoryAnswers, [id]: next },
      };
    });
  };

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const buildSubtype = (): string => {
    if (form.requestType === "webdesign") return form.webArea;
    return form.requestType;
  };

  const addFiles = (key: "files" | "references", incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], ...Array.from(incoming)].slice(0, 10),
    }));
  };

  const removeFile = (key: "files" | "references", index: number) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("contactName", form.contactName);
      fd.append("contactEmail", form.contactEmail);
      fd.append("company", form.company);
      fd.append("brand", form.brand);
      fd.append("requestType", form.requestType);
      fd.append("requestSubtype", buildSubtype());
      fd.append("creativeLevel", form.creativeLevel);
      fd.append("deadline", form.deadline);
      fd.append("description", form.description);
      const { files: _f, references: _r, ...answersWithoutFiles } = form;
      void _f;
      void _r;
      fd.append("workFor", form.workFor);
      fd.append("answers", JSON.stringify(answersWithoutFiles));
      form.files.forEach((file) => fd.append("files", file));
      form.references.forEach((file) => fd.append("references", file));
      form.referenceLinks.forEach((link) =>
        fd.append("referenceLinks", link),
      );

      const res = await fetch("/api/brief", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Falha ao enviar");
      }
      setStatus("success");
      setForm(INITIAL_STATE);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erro inesperado");
    }
  };

  if (status === "success") {
    return (
      <section className="py-24">
        <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
          Recebido
        </p>
        <h2 className="mt-6 max-w-[820px] text-[44px] font-semibold leading-[1.02] tracking-[-2px] text-black md:text-[68px] md:tracking-[-3px]">
          Obrigado — sua solicitação está registrada.
        </h2>
        <p className="mt-6 max-w-[520px] text-[14px] font-medium leading-[1.5] tracking-[-0.2px] text-black/60">
          A gente responde por email em até 48h úteis com uma devolutiva sobre
          escopo, prazo e próximos passos.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-10 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          Enviar outro briefing
          <span aria-hidden>→</span>
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="divide-y divide-black/10">
      <FormSection index="01" title="Contato">
        <FieldRow>
          <TextField
            label="Seu nome"
            value={form.contactName}
            onChange={(v) => update("contactName", v)}
          />
          <TextField
            label="Email"
            type="email"
            value={form.contactEmail}
            onChange={(v) => update("contactEmail", v)}
          />
        </FieldRow>
        <FieldRow>
          <TextField
            label="Empresa"
            info="A empresa que está fazendo a solicitação (quem nos contrata)."
            value={form.company}
            onChange={(v) => update("company", v)}
          />
          <div />
        </FieldRow>
        <RadioList
          label="Esse trabalho é para quem?"
          name="workFor"
          value={form.workFor}
          onChange={(v) => update("workFor", v as FormState["workFor"])}
          options={["own", "other"]}
          renderOption={(opt) =>
            opt === "own"
              ? "Para a minha empresa"
              : "Para outra marca / cliente"
          }
        />
        {form.workFor === "other" && (
          <TextField
            label="Marca / cliente final"
            info="Ex: uma agência solicitando design para uma marca cliente. Preencha o nome da marca final."
            value={form.brand}
            onChange={(v) => update("brand", v)}
          />
        )}
      </FormSection>

      <FormSection index="02" title="Título da solicitação" required>
        <TextField
          label="Dê um nome curto para este briefing"
          value={form.title}
          onChange={(v) => update("title", v)}
          required
        />
      </FormSection>

      <FormSection index="03" title="Qual a sua solicitação?" required>
        <RadioGrid
          name="requestType"
          value={form.requestType}
          onChange={(v) => setRequestType(v as RequestType)}
          options={REQUEST_TYPES}
        />
      </FormSection>

      {form.requestType === "webdesign" && (
        <FormSection index="04" title="Em que vamos trabalhar?" required>
          <RadioGrid
            name="webArea"
            value={form.webArea}
            onChange={(v) => update("webArea", v as WebArea)}
            options={WEB_AREAS}
          />

          {form.webArea === "auditoria" && (
            <SubGroup>
              <RadioList
                label="Tipo de auditoria"
                name="tipoAuditoria"
                value={form.tipoAuditoria}
                onChange={(v) => update("tipoAuditoria", v)}
                options={[
                  "Uma página",
                  "Várias páginas",
                  "Produto digital",
                  "Outro",
                ]}
              />
              <TextArea
                label="Descreva a solicitação"
                hint="Contexto, desafios, links, acesso a contas de teste e referências para inspiração."
                value={form.descricaoAuditoria}
                onChange={(v) => update("descricaoAuditoria", v)}
              />
              <TextArea
                label="Dados de UX coletados"
                hint="Dados, heatmaps, relatórios de performance — o que você já tem."
                value={form.dadosUX}
                onChange={(v) => update("dadosUX", v)}
              />
            </SubGroup>
          )}

          {form.webArea === "landingpage" && (
            <SubGroup>
              <RadioList
                label="O que você precisa?"
                name="tipoPaginaDestino"
                value={form.tipoPaginaDestino}
                onChange={(v) => update("tipoPaginaDestino", v)}
                options={[
                  "Novos designs",
                  "Redesenhar / otimizar um design existente",
                ]}
              />
            </SubGroup>
          )}

          {form.webArea === "paginasite" && (
            <SubGroup>
              <RadioList
                label="Você quer"
                name="tipoPaginaSite"
                value={form.tipoPaginaSite}
                onChange={(v) => update("tipoPaginaSite", v)}
                options={[
                  "Novos designs",
                  "Redesenhar / otimizar um design existente",
                ]}
              />
              <CheckboxList
                label="Objetivos"
                values={form.goals}
                onToggle={toggleGoal}
                options={GOALS}
              />
              <RadioList
                label="Como descreveria a página?"
                name="descricaoPagina"
                value={form.descricaoPagina}
                onChange={(v) => update("descricaoPagina", v)}
                options={PAGE_DESCRIPTIONS}
              />
              <TextArea
                label="Qual a jornada do cliente?"
                hint="Como o tráfego é gerado? O que vem antes dessa página na experiência?"
                value={form.jornadaCliente}
                onChange={(v) => update("jornadaCliente", v)}
              />
              <TextArea
                label="Quem é a audiência alvo?"
                hint="Quem são, interesses específicos, dores, requisitos a considerar."
                value={form.audienciaAlvo}
                onChange={(v) => update("audienciaAlvo", v)}
              />
              <TextArea
                label="Conte mais sobre a solicitação"
                hint="Wireframes, contexto, referências, links, trabalhos anteriores."
                value={form.descricaoRequestSite}
                onChange={(v) => update("descricaoRequestSite", v)}
              />
              <RadioList
                label="Você já tem o conteúdo escrito da página?"
                name="temConteudo"
                value={form.temConteudo}
                onChange={(v) => update("temConteudo", v)}
                options={["Sim", "Não — usem Lorem Ipsum"]}
              />
            </SubGroup>
          )}

          {form.webArea === "recursos" && (
            <SubGroup>
              <RadioList
                label="O que você precisa?"
                name="tipoRecurso"
                value={form.tipoRecurso}
                onChange={(v) => update("tipoRecurso", v)}
                options={[
                  "Elementos ou assets (ex: graphics)",
                  "Hero section (headers ou data graphics)",
                  "Banners (seção ou produto)",
                  "Interface (skeletons, splash screens)",
                  "Funcional (acordeão, toggles)",
                  "Emocional (alerts, success actions)",
                  "Outro",
                ]}
              />
              <TextArea
                label="Conte mais sobre a solicitação"
                hint="Propostas, wireframes, contexto, referências e links."
                value={form.descricaoRecursos}
                onChange={(v) => update("descricaoRecursos", v)}
              />
            </SubGroup>
          )}

          {form.webArea === "produto" && (
            <SubGroup>
              <RadioList
                label="O que você precisa?"
                name="tipoProduto"
                value={form.tipoProduto}
                onChange={(v) => update("tipoProduto", v)}
                options={[
                  "Web & mobile app design",
                  "Dashboard design",
                  "Digital assets (graphics, prototype animations)",
                  "Outro",
                ]}
              />
              <TextArea
                label="Conte mais sobre a solicitação"
                hint="Propostas principais, wireframes, contexto, requisitos, trabalhos anteriores."
                value={form.descricaoProduto}
                onChange={(v) => update("descricaoProduto", v)}
              />
              <TextArea
                label="Fluxo de navegação do usuário"
                hint="Wireframes, rascunhos, fotos — qualquer coisa que ajude a entender o produto."
                value={form.fluxoNavegacao}
                onChange={(v) => update("fluxoNavegacao", v)}
              />
              <RadioList
                label="Você tem formatos, tamanhos e requisitos funcionais?"
                name="requisitosProduto"
                value={form.requisitosProduto}
                onChange={(v) => update("requisitosProduto", v)}
                options={[
                  "Sim — vou fornecer todos os detalhes",
                  "Não — a equipe decide por mim",
                ]}
              />
            </SubGroup>
          )}

          {form.webArea === "abteste" && (
            <SubGroup>
              <RadioList
                label="Organizar com nomes/códigos de cliente?"
                name="organizarAB"
                value={form.organizarAB}
                onChange={(v) => update("organizarAB", v)}
                options={["Sim", "Não"]}
              />
              <RadioList
                label="Objetivo do teste A/B"
                name="objetivoAB"
                value={form.objetivoAB}
                onChange={(v) => update("objetivoAB", v)}
                options={[
                  "Aumentar taxa de conversão",
                  "Melhorar engajamento",
                  "Otimizar experiência",
                  "Maximizar receita",
                  "Reduzir bounce rate",
                  "Entender preferências da audiência",
                  "Validar hipóteses",
                ]}
              />
              <TextArea
                label="Conte mais sobre o teste"
                hint="Propostas, Loom videos, wireframes, contexto, requisitos, referências."
                value={form.descricaoAB}
                onChange={(v) => update("descricaoAB", v)}
              />
            </SubGroup>
          )}
        </FormSection>
      )}

      {form.requestType &&
        form.requestType !== "webdesign" &&
        CATEGORY_SCHEMAS[form.requestType] && (
          <FormSection
            index="04"
            title={CATEGORY_SCHEMAS[form.requestType].title}
            required
          >
            <div className="space-y-8">
              {CATEGORY_SCHEMAS[form.requestType].fields.map((field) => (
                <CategoryFieldRenderer
                  key={field.id}
                  field={field}
                  value={form.categoryAnswers[field.id]}
                  onRadio={(v) => setCategoryAnswer(field.id, v)}
                  onToggle={(v) => toggleCategoryCheckbox(field.id, v)}
                  onText={(v) => setCategoryAnswer(field.id, v)}
                />
              ))}
            </div>
          </FormSection>
        )}

      <FormSection index="05" title="Descrição geral">
        <TextArea
          label="Conte mais sobre o projeto"
          hint="Propostas, contexto, desafios, requisitos, preferências, referências, links."
          value={form.description}
          onChange={(v) => update("description", v)}
          rows={6}
        />
      </FormSection>

      <FormSection index="06" title="Exploração criativa">
        <div className="space-y-3">
          {CREATIVE_LEVELS.map((lvl) => {
            const active = form.creativeLevel === lvl.value;
            return (
              <label
                key={lvl.value}
                className={`flex cursor-pointer items-start gap-4 border-l-2 py-3 pl-4 transition-colors ${
                  active
                    ? "border-black bg-black/[0.03]"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                <input
                  type="radio"
                  name="creativeLevel"
                  value={lvl.value}
                  checked={active}
                  onChange={() => update("creativeLevel", lvl.value)}
                  className="sr-only"
                />
                <div>
                  <p className="text-[14px] font-semibold tracking-[-0.4px] text-black">
                    {lvl.label}
                  </p>
                  <p className="mt-1 text-[12px] font-medium leading-[1.4] tracking-[-0.2px] text-black/55">
                    {lvl.hint}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </FormSection>

      <FormSection index="07" title="Arquivos & referências">
        <FileDrop
          label="Arquivos necessários"
          hint="Wireframes, briefs, logos, assets — qualquer arquivo relevante para a solicitação."
          files={form.files}
          onAdd={(f) => addFiles("files", f)}
          onRemove={(i) => removeFile("files", i)}
        />
        <FileDrop
          label="Referências para inspiração"
          hint="Referências de outros designs — não precisam ser do mesmo segmento."
          files={form.references}
          onAdd={(f) => addFiles("references", f)}
          onRemove={(i) => removeFile("references", i)}
        />
        <LinkList
          label="Links ou nomes de referência"
          hint="Cole URLs (site, post, vídeo) ou simplesmente o nome de uma marca/projeto que te inspira."
          values={form.referenceLinks}
          onAdd={(v) =>
            setForm((prev) => ({
              ...prev,
              referenceLinks: [...prev.referenceLinks, v].slice(0, 20),
            }))
          }
          onRemove={(idx) =>
            setForm((prev) => ({
              ...prev,
              referenceLinks: prev.referenceLinks.filter((_, i) => i !== idx),
            }))
          }
        />
      </FormSection>

      <FormSection index="08" title="Prazo & observações">
        <FieldRow>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
              Prazo sugerido
            </span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                update("deadline", e.target.value)
              }
              className="border-b border-black/20 bg-transparent py-2 text-[14px] font-medium tracking-[-0.2px] text-black outline-none transition-colors focus:border-black focus-visible:outline-none"
            />
          </div>
          <div />
        </FieldRow>
        <TextArea
          label="Ideias adicionais ou observações"
          value={form.observacoes}
          onChange={(v) => update("observacoes", v)}
          rows={5}
        />
      </FormSection>

      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[420px] text-[12px] font-medium leading-[1.5] tracking-[-0.2px] text-black/50">
          Ao enviar, o briefing entra direto no nosso board. Respondemos por
          email em até 48h úteis.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group inline-flex items-center justify-between gap-6 border border-black bg-black px-8 py-5 text-[12px] font-semibold uppercase tracking-[-0.42px] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 md:min-w-[320px]"
        >
          {status === "submitting" ? "Enviando…" : "Enviar briefing"}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>

      {status === "error" && errorMessage && (
        <p className="pt-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-red-600">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

function FormSection({
  index,
  title,
  required,
  children,
}: {
  index: string;
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-8 py-12 md:grid-cols-[160px_1fr] md:gap-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/40">
          {index}
        </p>
        <p className="mt-2 text-[14px] font-semibold leading-[1.25] tracking-[-0.4px] text-black">
          {title}
          {required && <span className="ml-1 text-black/40">*</span>}
        </p>
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">{children}</div>
  );
}

function SubGroup({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 space-y-8 border-l border-black/10 pl-6">
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  info,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  info?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
        {label}
        {required && <span className="text-black/40">*</span>}
        {info && <InfoTip text={info} />}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="border-b border-black/20 bg-transparent py-2 text-[14px] font-medium tracking-[-0.2px] text-black outline-none transition-colors focus:border-black focus-visible:outline-none"
      />
    </label>
  );
}

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Mais informações"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-black/30 text-[9px] font-semibold text-black/50 transition-colors hover:border-black hover:text-black"
      >
        i
      </button>
      {open && (
        <span className="absolute left-1/2 top-[22px] z-20 w-[240px] -translate-x-1/2 border border-black/15 bg-white p-3 text-[11px] font-medium normal-case leading-[1.45] tracking-[-0.15px] text-black/70 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {text}
        </span>
      )}
    </span>
  );
}

function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="resize-y border-b border-black/20 bg-transparent py-2 text-[14px] font-medium leading-[1.5] tracking-[-0.2px] text-black outline-none transition-colors focus:border-black focus-visible:outline-none"
      />
      {hint && (
        <span className="text-[11px] font-medium leading-[1.4] tracking-[-0.2px] text-black/45">
          {hint}
        </span>
      )}
    </label>
  );
}

function RadioGrid({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-end">
        <span className="text-[10px] font-semibold uppercase tracking-[-0.3px] text-black/35">
          Escolha uma
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 border px-4 py-4 text-[13px] font-medium tracking-[-0.2px] transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black hover:border-black/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={active}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <RadioDot active={active} />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function GroupLabel({
  label,
  mode,
}: {
  label: string;
  mode: "single" | "multi";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
        {label}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[-0.3px] text-black/35">
        {mode === "single" ? "Escolha uma" : "Múltiplas opções"}
      </span>
    </div>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      className={`relative inline-block h-[12px] w-[12px] shrink-0 rounded-full border transition-colors ${
        active ? "border-white" : "border-black/30"
      }`}
    >
      {active && (
        <span className="absolute left-1/2 top-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      )}
    </span>
  );
}

function CheckBox({ active }: { active: boolean }) {
  return (
    <span
      className={`relative inline-block h-[12px] w-[12px] shrink-0 border transition-colors ${
        active ? "border-white bg-transparent" : "border-black/30"
      }`}
    >
      {active && (
        <svg
          viewBox="0 0 10 10"
          className="absolute inset-0 h-full w-full text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2 5.2 4.2 7.4 8.2 2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function RadioList({
  label,
  name,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  renderOption?: (v: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <GroupLabel label={label} mode="single" />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          const displayLabel = renderOption ? renderOption(opt) : opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-[12px] font-medium tracking-[-0.2px] transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black hover:border-black/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={active}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              <RadioDot active={active} />
              {displayLabel}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxList({
  label,
  values,
  onToggle,
  options,
}: {
  label: string;
  values: string[];
  onToggle: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <GroupLabel label={label} mode="multi" />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-[12px] font-medium tracking-[-0.2px] transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black hover:border-black/40"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onToggle(opt)}
                className="sr-only"
              />
              <CheckBox active={active} />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CategoryFieldRenderer({
  field,
  value,
  onRadio,
  onToggle,
  onText,
}: {
  field: CategoryField;
  value: string | string[] | undefined;
  onRadio: (v: string) => void;
  onToggle: (v: string) => void;
  onText: (v: string) => void;
}) {
  if (field.kind === "radio") {
    return (
      <div>
        <RadioList
          label={field.label}
          name={field.id}
          value={typeof value === "string" ? value : ""}
          onChange={onRadio}
          options={field.options}
        />
        {field.hint && (
          <p className="mt-2 text-[11px] font-medium leading-[1.4] tracking-[-0.2px] text-black/45">
            {field.hint}
          </p>
        )}
      </div>
    );
  }
  if (field.kind === "checkbox") {
    return (
      <div>
        <CheckboxList
          label={field.label}
          values={Array.isArray(value) ? value : []}
          onToggle={onToggle}
          options={field.options}
        />
        {field.hint && (
          <p className="mt-2 text-[11px] font-medium leading-[1.4] tracking-[-0.2px] text-black/45">
            {field.hint}
          </p>
        )}
      </div>
    );
  }
  return (
    <TextArea
      label={field.label}
      hint={field.hint}
      rows={field.rows ?? 4}
      value={typeof value === "string" ? value : ""}
      onChange={onText}
    />
  );
}

function LinkList({
  label,
  hint,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
        {label}
      </span>
      <div className="flex items-end gap-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="https://… ou nome da marca"
          className="flex-1 border-b border-black/20 bg-transparent py-2 text-[14px] font-medium tracking-[-0.2px] text-black outline-none transition-colors placeholder:text-black/30 focus:border-black focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={commit}
          className="shrink-0 border border-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[-0.35px] text-black transition-colors hover:bg-black hover:text-white"
        >
          + Adicionar
        </button>
      </div>
      {hint && (
        <span className="text-[11px] font-medium leading-[1.4] tracking-[-0.2px] text-black/45">
          {hint}
        </span>
      )}
      {values.length > 0 && (
        <ul className="mt-1 divide-y divide-black/10 border-t border-b border-black/10">
          {values.map((val, idx) => {
            const isUrl = /^https?:\/\//i.test(val);
            return (
              <li
                key={`${val}-${idx}`}
                className="flex items-center justify-between gap-4 py-2 text-[12px] font-medium tracking-[-0.2px] text-black"
              >
                {isUrl ? (
                  <a
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate underline underline-offset-2 hover:opacity-60"
                  >
                    {val}
                  </a>
                ) : (
                  <span className="truncate">{val}</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-[-0.3px] text-black/50 transition-colors hover:text-black"
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FileDrop({
  label,
  hint,
  files,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  files: File[];
  onAdd: (fl: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = `file-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[-0.35px] text-black/55">
        {label}
      </span>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onAdd(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-black bg-black/[0.03]"
            : "border-black/25 hover:border-black/50"
        }`}
      >
        <input
          id={inputId}
          type="file"
          multiple
          onChange={(e) => onAdd(e.target.files)}
          className="sr-only"
        />
        <span className="text-[13px] font-semibold tracking-[-0.3px] text-black">
          Clique para carregar
          <span className="ml-1 font-medium text-black/50">
            ou arraste e solte
          </span>
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-[-0.2px] text-black/45">
          Até 25MB por arquivo · máx. 10 arquivos
        </span>
      </label>
      {hint && (
        <span className="text-[11px] font-medium leading-[1.4] tracking-[-0.2px] text-black/45">
          {hint}
        </span>
      )}
      {files.length > 0 && (
        <ul className="mt-1 divide-y divide-black/10 border-t border-b border-black/10">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between gap-4 py-2 text-[12px] font-medium tracking-[-0.2px] text-black"
            >
              <span className="truncate">
                {file.name}
                <span className="ml-2 text-black/40">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[-0.3px] text-black/50 transition-colors hover:text-black"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
