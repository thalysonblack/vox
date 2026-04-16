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
          <div key={index} className="border-b border-white/10">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full cursor-pointer items-center justify-between py-7 text-left"
            >
              <span className="pr-8 text-[15px] font-semibold leading-[1.4] tracking-[-0.3px] text-white md:text-[17px]">
                {item.question}
              </span>
              <span
                className="shrink-0 text-[20px] font-light text-white/35 transition-transform duration-200"
                style={{
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                maxHeight: isOpen ? "200px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p className="pb-7 text-[14px] font-medium leading-[1.65] tracking-[-0.2px] text-white/50">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
