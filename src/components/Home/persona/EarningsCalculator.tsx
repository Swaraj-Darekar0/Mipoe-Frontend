import React, { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { personaContent, calculatorHeadline, calculatorSubtext } from "./personaContent";
import type { Persona } from "./personaContent";

interface EarningsCalculatorProps {
  persona: Persona;
}

const ACCENT: Record<Persona, { text: string; bg: string; ctaText: string }> = {
  creator: { text: "text-creator-pink", bg: "bg-creator-pink", ctaText: "text-ink-deep" },
  brand: { text: "text-brand-blue", bg: "bg-brand-blue", ctaText: "text-canvas" },
};

const EarningsCalculator: React.FC<EarningsCalculatorProps> = ({ persona }) => {
  const content = personaContent[persona].calculator;
  const [a, setA] = useState(content.sliders[0].defaultValue);
  const [b, setB] = useState(content.sliders[1].defaultValue);
  const accent = ACCENT[persona];
  const resultParts = content.computeResult(a, b);
  const values = [a, b];
  const setters = [setA, setB];

  return (
    <section id="calculator" className="w-full bg-canvas py-16 md:py-24 border-t border-hairline">
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
        <h2 className="font-semibold text-[32px] md:text-[48px] leading-[1.1] tracking-[-1px] text-ink">
          {calculatorHeadline.map((seg, i) =>
            seg.emphasis ? (
              <span key={i} className={accent.text}>
                {seg.text}
              </span>
            ) : (
              <React.Fragment key={i}>{seg.text}</React.Fragment>
            )
          )}
        </h2>
        <p className="mt-4 text-[14px] text-slate max-w-md mx-auto">{calculatorSubtext}</p>

        <div className="mt-12 space-y-10 text-left">
          {content.sliders.map((slider, idx) => {
            const value = values[idx];
            const setValue = setters[idx];
            return (
              <div key={slider.label}>
                <div className="mb-3">
                  <span className="text-[14px] font-medium text-ink">{slider.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[1px] text-steel w-16 shrink-0">
                    {slider.formatValue(slider.min)}
                  </span>
                  <SliderPrimitive.Root
                    className="relative flex items-center flex-1 h-5 select-none touch-none"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={[value]}
                    onValueChange={([v]) => setValue(v)}
                  >
                    <SliderPrimitive.Track className="relative h-1.5 flex-1 rounded-full bg-hairline-strong">
                      <SliderPrimitive.Range className={`absolute h-full rounded-full ${accent.bg}`} />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb
                      className={`block h-5 w-5 rounded-full ${accent.bg} shadow-[0_2px_6px_rgba(15,15,15,0.3)] focus:outline-none`}
                      aria-label={slider.label}
                    />
                  </SliderPrimitive.Root>
                  <span className="text-[11px] font-semibold uppercase tracking-[1px] text-steel w-16 shrink-0 text-right">
                    {slider.formatValue(slider.max)}
                  </span>
                </div>
                <div className="mt-2 text-center">
                  <span className="font-semibold text-[20px] text-ink">{slider.formatValue(value)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 font-semibold text-[20px] md:text-[26px] leading-[1.45] text-ink">
          {resultParts.map((part, i) =>
            part.emphasis ? (
              <span key={i} className={accent.text}>
                {part.text}
              </span>
            ) : (
              <React.Fragment key={i}>{part.text}</React.Fragment>
            )
          )}
        </p>

        <p className="mt-4 text-[13px] text-slate max-w-lg mx-auto">{content.disclaimer}</p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="rounded-[8px] border border-dashed border-hairline-strong px-4 py-3 text-[14px] text-slate">
            {content.handlePreview}
          </span>
          <a
            href={personaContent[persona].ctaHref}
            className={`rounded-[8px] px-6 py-3 text-[14px] font-medium ${accent.ctaText} ${accent.bg} hover:opacity-90 transition-opacity`}
          >
            {content.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
};

export default EarningsCalculator;
