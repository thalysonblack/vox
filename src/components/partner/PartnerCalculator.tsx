"use client";

import { useState, useMemo, useCallback } from "react";

const PROJECT_TYPES = [
  { value: "landing", label: "Landing Page", price: 1500 },
  { value: "site5", label: "Site at\u00e9 5 p\u00e1g.", price: 3500 },
  { value: "ecommerce", label: "E-commerce UI", price: 5000 },
];

const SCOPES = [
  { value: "design", label: "S\u00f3 design", multiplier: 1, includesDev: false },
  { value: "design_dev", label: "Design + Dev", multiplier: 1.6, includesDev: true },
  { value: "dev_only", label: "Dev sobre design pronto", multiplier: 1.35, includesDev: true },
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

function brl(value: number): string {
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
  hasCheck,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  hasCheck?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex cursor-pointer items-center gap-3 border px-5 py-3 text-[13px] font-normal transition-all duration-200 ${
        active
          ? "border-white bg-white text-black"
          : "border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/70"
      }`}
    >
      {hasCheck && (
        <span
          className={`flex h-[10px] w-[10px] shrink-0 items-center justify-center border text-[7px] leading-none ${
            active ? "border-black/30 text-black" : "border-white/15"
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

  const proj = PROJECT_TYPES.find((p) => p.value === projectType)!;
  const scp = SCOPES.find((s) => s.value === scope)!;
  const pri = PRIORITIES.find((p) => p.value === priority)!;

  const toggle = useCallback((v: string) => {
    setIntegrations((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }, []);

  const { total, breakdown, entry, delivery } = useMemo(() => {
    const base = proj.price * scp.multiplier;
    const intTotal = scp.includesDev
      ? integrations.reduce((sum, key) => {
          const f = INTEGRATIONS.find((i) => i.value === key);
          return sum + (f?.price ?? 0);
        }, 0)
      : 0;
    const sub = base + intTotal;
    const fin = Math.round(sub * pri.multiplier);

    const parts: string[] = [proj.label, scp.label];
    if (scp.includesDev && integrations.length > 0) {
      integrations.forEach((key) => {
        const f = INTEGRATIONS.find((i) => i.value === key);
        if (f) parts.push(f.label);
      });
    }
    if (pri.value !== "standard") parts.push(pri.label);

    return {
      total: fin,
      breakdown: parts.join(" + "),
      entry: Math.round(fin * 0.6),
      delivery: Math.round(fin * 0.4),
    };
  }, [proj, scp, pri, integrations]);

  return (
    <div className="grid gap-20 lg:grid-cols-[1fr_380px]">
      <div className="space-y-16">
        <Group label="Tipo de projeto">
          {PROJECT_TYPES.map((opt) => (
            <Pill
              key={opt.value}
              label={`${opt.label} \u2014 ${brl(opt.price)}`}
              active={projectType === opt.value}
              onClick={() => setProjectType(opt.value)}
            />
          ))}
        </Group>

        <Group label="Escopo de entrega">
          {SCOPES.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              active={scope === opt.value}
              onClick={() => setScope(opt.value)}
            />
          ))}
        </Group>

        {scp.includesDev && (
          <Group label="Integra&ccedil;&otilde;es">
            {INTEGRATIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={`${opt.label} +${brl(opt.price)}`}
                active={integrations.includes(opt.value)}
                onClick={() => toggle(opt.value)}
                hasCheck
              />
            ))}
          </Group>
        )}

        <Group label="Prioridade">
          {PRIORITIES.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              active={priority === opt.value}
              onClick={() => setPriority(opt.value)}
            />
          ))}
        </Group>
      </div>

      <div className="lg:sticky lg:top-16 lg:self-start">
        <div className="border-l border-white/[0.06] pl-8">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
            Estimativa
          </p>

          <p className="mt-8 text-[56px] font-medium leading-[1] tracking-[-0.04em] text-white lg:text-[64px]">
            {brl(total)}
          </p>

          <p className="mt-6 text-[14px] font-normal leading-[1.6] text-white/25">
            {breakdown}
          </p>

          <div className="mt-10 space-y-4 border-t border-white/[0.06] pt-8">
            <div className="flex justify-between text-[14px]">
              <span className="font-normal text-white/25">Entrada (60%)</span>
              <span className="font-medium text-white">{brl(entry)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="font-normal text-white/25">Na entrega (40%)</span>
              <span className="font-medium text-white">{brl(delivery)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.1em] text-white/25">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
