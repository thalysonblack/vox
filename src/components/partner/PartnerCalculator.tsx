"use client";

import { useState, useMemo, useCallback } from "react";

const PROJECT_TYPES = [
  { value: "landing", label: "Landing Page", price: 1500 },
  { value: "site5", label: "Site at\u00e9 5 p\u00e1ginas", price: 3500 },
  { value: "ecommerce", label: "E-commerce UI", price: 5000 },
];

const SCOPES = [
  { value: "design", label: "S\u00f3 design", multiplier: 1, includesDev: false },
  { value: "design_dev", label: "Design + Dev", multiplier: 1.6, includesDev: true },
  { value: "dev_only", label: "Dev em cima de design pronto", multiplier: 1.35, includesDev: true },
];

const INTEGRATIONS = [
  { value: "cms", label: "CMS", price: 400 },
  { value: "forms", label: "Formul\u00e1rios", price: 200 },
  { value: "analytics", label: "Analytics", price: 150 },
  { value: "payment", label: "Pagamento", price: 600 },
  { value: "automations", label: "Automa\u00e7\u00f5es", price: 350 },
];

const PRIORITIES = [
  { value: "standard", label: "Padr\u00e3o", multiplier: 1 },
  { value: "priority", label: "Prioridade", multiplier: 1.3 },
  { value: "urgent", label: "Urgente", multiplier: 1.6 },
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function Pill({
  label,
  active,
  onClick,
  checkbox,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  checkbox?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 border px-4 py-3 text-[12px] font-medium tracking-[-0.15px] transition-colors ${
        active
          ? "border-white bg-white text-black"
          : "border-white/15 text-white/70 hover:border-white/40"
      }`}
    >
      {checkbox && (
        <span
          className={`inline-flex h-[10px] w-[10px] items-center justify-center border text-[7px] leading-none ${
            active ? "border-black/40 text-black" : "border-white/30"
          }`}
        >
          {active ? "\u2713" : ""}
        </span>
      )}
      {label}
    </button>
  );
}

export default function PartnerCalculator() {
  const [projectType, setProjectType] = useState("landing");
  const [scope, setScope] = useState("design");
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [priority, setPriority] = useState("standard");

  const selectedProject = PROJECT_TYPES.find((p) => p.value === projectType)!;
  const selectedScope = SCOPES.find((s) => s.value === scope)!;
  const selectedPriority = PRIORITIES.find((p) => p.value === priority)!;

  const toggleIntegration = useCallback((value: string) => {
    setIntegrations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const { total, breakdown, entry, delivery } = useMemo(() => {
    const base = selectedProject.price * selectedScope.multiplier;
    const intTotal = selectedScope.includesDev
      ? integrations.reduce((sum, key) => {
          const found = INTEGRATIONS.find((i) => i.value === key);
          return sum + (found?.price ?? 0);
        }, 0)
      : 0;
    const subtotal = base + intTotal;
    const finalTotal = Math.round(subtotal * selectedPriority.multiplier);

    const parts: string[] = [selectedProject.label, selectedScope.label];
    if (selectedScope.includesDev && integrations.length > 0) {
      integrations.forEach((key) => {
        const found = INTEGRATIONS.find((i) => i.value === key);
        if (found) parts.push(found.label);
      });
    }
    if (selectedPriority.value !== "standard") parts.push(selectedPriority.label);

    return {
      total: finalTotal,
      breakdown: parts.join(" + "),
      entry: Math.round(finalTotal * 0.6),
      delivery: Math.round(finalTotal * 0.4),
    };
  }, [selectedProject, selectedScope, selectedPriority, integrations]);

  return (
    <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
      <div className="space-y-14">
        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            Tipo de projeto
          </p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map((opt) => (
              <Pill
                key={opt.value}
                label={`${opt.label} \u2014 ${formatBRL(opt.price)}`}
                active={projectType === opt.value}
                onClick={() => setProjectType(opt.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            Escopo de entrega
          </p>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={scope === opt.value}
                onClick={() => setScope(opt.value)}
              />
            ))}
          </div>
        </div>

        {selectedScope.includesDev && (
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
              Integra&ccedil;&otilde;es
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  label={`${opt.label} +${formatBRL(opt.price)}`}
                  active={integrations.includes(opt.value)}
                  onClick={() => toggleIntegration(opt.value)}
                  checkbox
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            Prioridade
          </p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={priority === opt.value}
                onClick={() => setPriority(opt.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-12 lg:self-start">
        <div className="border-l-2 border-white pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            Estimativa
          </p>
          <p className="mt-4 text-[38px] font-semibold leading-[1] tracking-[-1.8px] text-white md:text-[46px]">
            {formatBRL(total)}
          </p>
          <p className="mt-5 text-[13px] font-medium leading-[1.5] tracking-[-0.2px] text-white/40">
            {breakdown}
          </p>
          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
            <div className="flex justify-between text-[13px] tracking-[-0.2px]">
              <span className="font-medium text-white/50">Entrada (60%)</span>
              <span className="font-semibold text-white">{formatBRL(entry)}</span>
            </div>
            <div className="flex justify-between text-[13px] tracking-[-0.2px]">
              <span className="font-medium text-white/50">Na entrega (40%)</span>
              <span className="font-semibold text-white">{formatBRL(delivery)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
