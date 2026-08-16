import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { personaContent } from "./personaContent";
import type { Persona } from "./personaContent";

interface FAQAccordionProps {
  persona: Persona;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ persona }) => {
  const items = personaContent[persona].faq;

  return (
    <section id="faq" className="w-full bg-canvas py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6 md:px-8">
        <h2 className="font-semibold text-[28px] md:text-[36px] leading-[1.2] tracking-[-0.5px] text-ink text-center mb-10">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-hairline">
              <AccordionTrigger className="text-[17px] md:text-[18px] font-semibold text-ink py-5 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] md:text-[16px] leading-[1.55] text-slate pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQAccordion;
