"use client";

import { useState, useCallback } from "react";

const FAQ_ITEMS = [
  {
    question: "O que precisa estar pronto antes de acionar?",
    answer:
      "Briefing completo, copy aprovada, marca (logo + paleta) definida. Sem isso, n\u00e3o come\u00e7amos.",
  },
  {
    question: "A Good Taste aparece no projeto?",
    answer:
      "Nunca. Tudo \u00e9 entregue white-label, sob o seu nome. N\u00e3o aparecemos em reuni\u00f5es, propostas ou comunica\u00e7\u00f5es com o cliente final.",
  },
  {
    question: "Trabalham com clientes internacionais?",
    answer:
      "Sim. Operamos em portugu\u00eas, ingl\u00eas e espanhol. Fuso n\u00e3o \u00e9 problema \u2014 trabalhamos ass\u00edncrono.",
  },
  {
    question: "E se o projeto n\u00e3o tiver copy pronta?",
    answer:
      "A gente n\u00e3o entra. Copy \u00e9 pr\u00e9-requisito. Podemos indicar copywriters parceiros se precisar.",
  },
  {
    question: "Como sei se t\u00eam agenda dispon\u00edvel?",
    answer:
      "Manda um WhatsApp ou preenche o form. Respondemos em at\u00e9 24h com disponibilidade e prazo estimado.",
  },
];

export default function PartnerFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div>
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full cursor-pointer items-center justify-between py-8 text-left transition-colors duration-200"
            >
              <span className="pr-12 text-[15px] font-normal leading-[1.4] text-white/80 md:text-[17px]">
                {item.question}
              </span>
              <span
                className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 transition-all duration-200"
              >
                {isOpen ? "Close" : "Open"}
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: isOpen ? "200px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p className="pb-8 text-[14px] font-normal leading-[1.7] text-white/35">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
      <div className="border-t border-white/[0.08]" />
    </div>
  );
}
