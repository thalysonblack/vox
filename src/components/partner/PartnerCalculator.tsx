"use client";

import { useState, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types & data                                                      */
/* ------------------------------------------------------------------ */

interface ProjectOption {
  value: string;
  label: string;
  price: number;
}

interface ScopeOption {
  value: string;
  label: string;
  multiplier: number;
  includesDev: boolean;
}

interface IntegrationOption {
  value: string;
  label: string;
  price: number;
}

interface PriorityOption {
  value: string;
  label: string;
  multiplier: number;
}

const PROJECT_TYPES: ProjectOption[] = [
  { value: "landing", label: "Landing Page", price: 1500 },
  { value: "site5", label: "Site at\u00e9 5 p\u00e1ginas", price: 3500 },
  { value: "ecommerce", label: "E-commerce UI", price: 5000 },
];

const SCOPES: ScopeOption[] = [
  { value: "design", label: "S\u00f3 design", multiplier: 1, includesDev: false },
  {
    value: "design_dev",
    label: "Design + Dev",
    multiplier: 1.6,
    includesDev: true,
  },
  {
    value: "dev_only",
    label: "Dev em cima de design pronto",
    multiplier: 1.35,
    includesDev: true,
  },
];

const INTEGRATIONS: IntegrationOption[] = [
  { value: "cms", label: "CMS", price: 400 },
  { value: "forms", label: "Formul\u00e1rios", price: 200 },
  { value: "analytics", label: "Analytics", price: 150 },
  { value: "payment", label: "Pagamento", price: 600 },
  { value: "automations", label: "Automa\u00e7\u00f5es", price: 350 },
];

const PRIORITIES: PriorityOption[] = [
  { value: "standard", label: "Padr\u00e3o", multiplier: 1 },
  { value: "priority", label: "Prioridade", multiplier: 1.3 },
  { value: "urgent", label: "Urgente", multiplier: 1.6 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/* ------------------------------------------------------------------ */
/*  Pill / Checkbox sub-components                                    */
/* ------------------------------------------------------------------ */

function RadioPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 border px-4 py-3 text-[13px] font-medium tracking-[-0.2px] transition-colors ${
        active
          ? "border-black bg-black text-white"
          : "border-black/15 text-black hover:border-black/40"
      }`}
    >
      {label}
    </button>
  );
}

function CheckboxPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-[12px] font-medium tracking-[-0.2px] transition-colors ${
        active
          ? "border-black bg-black text-white"
          : "border-black/15 text-black hover:border-black/40"
      }`}
    >
      <span
        className={`inline-flex h-3 w-3 items-center justify-center border text-[8px] leading-none ${
          active ? "border-white text-white" : "border-black/30"
        }`}
      >
        {active ? "\u2713" : ""}
      </span>
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Calculator                                                        */
/* ------------------------------------------------------------------ */

export default function PartnerCalculator() {
  const [projectType, setProjectType] = useState<string>("landing");
  const [scope, setScope] = useState<string>("design");
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [priority, setPriority] = useState<string>("standard");

  const selectedProject = PROJECT_TYPES.find((p) => p.value === projectType)!;
  const selectedScope = SCOPES.find((s) => s.value === scope)!;
  const selectedPriority = PRIORITIES.find((p) => p.value === priority)!;

  const toggleIntegration = useCallback((value: string) => {
    setIntegrations((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }, []);

  const { total, breakdown, entry, delivery } = useMemo(() => {
    const base = selectedProject.price * selectedScope.multiplier;
    const integrationsTotal = selectedScope.includesDev
      ? integrations.reduce((sum, key) => {
          const found = INTEGRATIONS.find((i) => i.value === key);
          return sum + (found?.price ?? 0);
        }, 0)
      : 0;
    const subtotal = base + integrationsTotal;
    const finalTotal = Math.round(subtotal * selectedPriority.multiplier);

    const parts: string[] = [selectedProject.label];
    parts.push(selectedScope.label);
    if (selectedScope.includesDev && integrations.length > 0) {
      integrations.forEach((key) => {
        const found = INTEGRATIONS.find((i) => i.value === key);
        if (found) parts.push(found.label);
      });
    }
    if (selectedPriority.value !== "standard") {
      parts.push(selectedPriority.label);
    }

    return {
      total: finalTotal,
      breakdown: parts.join(" + "),
      entry: Math.round(finalTotal * 0.6),
      delivery: Math.round(finalTotal * 0.4),
    };
  }, [
    selectedProject,
    selectedScope,
    selectedPriority,
    integrations,
  ]);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
      {/* Left: inputs */}
      <div className="space-y-12">
        {/* Project type */}
        <div>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
            Tipo de projeto
          </p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map((opt) => (
              <RadioPill
                key={opt.value}
                label={`${opt.label} \u2014 ${formatBRL(opt.price)}`}
                active={projectType === opt.value}
                onClick={() => setProjectType(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Scope */}
        <div>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
            Escopo de entrega
          </p>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((opt) => (
              <RadioPill
                key={opt.value}
                label={opt.label}
                active={scope === opt.value}
                onClick={() => setScope(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Integrations (only when dev is included) */}
        {selectedScope.includesDev && (
          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
              Integra&ccedil;&otilde;es
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map((opt) => (
                <CheckboxPill
                  key={opt.value}
                  label={`${opt.label} +${formatBRL(opt.price)}`}
                  active={integrations.includes(opt.value)}
                  onClick={() => toggleIntegration(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Priority */}
        <div>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
            Prioridade
          </p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((opt) => (
              <RadioPill
                key={opt.value}
                label={opt.label}
                active={priority === opt.value}
                onClick={() => setPriority(opt.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: result panel */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="border-l-2 border-black pl-6">
          <p className="text-[12px] font-semibold uppercase tracking-[-0.42px] text-black/55">
            Estimativa
          </p>
          <p className="mt-3 text-[36px] font-semibold leading-[1] tracking-[-1.6px] text-black md:text-[42px]">
            {formatBRL(total)}
          </p>
          <p className="mt-4 text-[13px] font-medium leading-[1.5] tracking-[-0.2px] text-black/50">
            {breakdown}
          </p>

          <div className="mt-6 space-y-2 border-t border-black/10 pt-6">
            <div className="flex justify-between text-[13px] tracking-[-0.2px]">
              <span className="font-medium text-black/60">Entrada (60%)</span>
              <span className="font-semibold text-black">
                {formatBRL(entry)}
              </span>
            </div>
            <div className="flex justify-between text-[13px] tracking-[-0.2px]">
              <span className="font-medium text-black/60">
                Na entrega (40%)
              </span>
              <span className="font-semibold text-black">
                {formatBRL(delivery)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
