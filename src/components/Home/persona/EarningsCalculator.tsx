import React, { useState, useEffect, useRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { motion } from "framer-motion";
import gsap from "gsap";
import { personaContent, calculatorSubtext, formatINR, formatLakhViews } from "./personaContent";
import type { Persona } from "./personaContent";
import SlidingScribbleButton from "./SlidingScribbleButton";

import HighlightedText from "./HighlightedText";
import SquishyWord from "./SquishySectionHeading";

interface EarningsCalculatorProps {
  persona: Persona;
}

// GSAP Numeric Ticker component that smoothly rolls numbers on slider drag
const TickerValue: React.FC<{
  value: number;
  format: (val: number) => string;
  className?: string;
}> = ({ value, format, className }) => {
  const [displayVal, setDisplayVal] = useState(value);
  const tweenRef = useRef<{ val: number }>({ val: value });

  useEffect(() => {
    const tween = gsap.to(tweenRef.current, {
      val: value,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayVal(tweenRef.current.val);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return <span className={className}>{format(displayVal)}</span>;
};

const EarningsCalculator: React.FC<EarningsCalculatorProps> = ({ persona }) => {
  const content = personaContent[persona].calculator;
  const [a, setA] = useState(content.sliders[0].defaultValue);
  const [b, setB] = useState(content.sliders[1].defaultValue);

  // Synchronize when switching personas
  useEffect(() => {
    setA(content.sliders[0].defaultValue);
    setB(content.sliders[1].defaultValue);
  }, [persona, content.sliders]);

  // Compute live mathematical values for Creator vs Brand
  let rawLow = 0;
  let rawHigh = 0;
  let rawViewsLow = 0;
  let rawViewsHigh = 0;
  let rawRevLow = 0;
  let rawRevHigh = 0;

  if (persona === "creator") {
    const viewsPerPost = a * 0.6;
    const monthlyViews = viewsPerPost * b;
    const cpvEarnings = monthlyViews * 0.1;
    const flatFeeFloor = b * 75;
    rawLow = cpvEarnings * 0.8 + flatFeeFloor;
    rawHigh = cpvEarnings * 1.5 + flatFeeFloor;
  } else {
    const weeksFactor = 1 + (b - 1) * 0.08;
    rawViewsLow = (a / 0.2) * weeksFactor;
    rawViewsHigh = (a / 0.08) * weeksFactor;
    rawRevLow = a * 3;
    rawRevHigh = a * 6;
  }

  const values = [a, b];
  const setters = [setA, setB];

  return (
    <section
      id="calculator"
      className="w-full min-h-[100svh] bg-canvas border-t border-hairline flex flex-col justify-center items-center pt-24 pb-14 sm:pt-28 sm:pb-20 md:pt-32 px-4 sm:px-6 md:px-8 relative select-none box-border overflow-visible"
    >
      <div className="max-w-3xl w-full mx-auto mt-6 sm:mt-10">
        {/* Dynamic Responsive Header with Squishy Physics & Signature Highlight */}
        <div className="text-center max-w-xl mx-auto mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-hairline-strong text-charcoal text-[10.5px] font-mono font-semibold uppercase tracking-wider shadow-xs mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {persona === "creator" ? "Earnings Calculator" : "ROI & Revenue Estimator"}
          </div>
          <h2 className="font-display font-black text-[24px] sm:text-[32px] md:text-[38px] leading-tight tracking-tight text-ink uppercase flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {persona === "creator" ? (
              <>
                <SquishyWord text="HOW MUCH CAN YOU" />
                <HighlightedText colorClass="bg-creator-pink/30">
                  earn?
                </HighlightedText>
              </>
            ) : (
              <>
                <SquishyWord text="ESTIMATE CAMPAIGN" />
                <HighlightedText colorClass="bg-orange-500/25">
                  returns
                </HighlightedText>
              </>
            )}
          </h2>
          <p className="mt-2 text-[13px] sm:text-[14px] text-slate max-w-sm mx-auto leading-snug">
            {calculatorSubtext}
          </p>
        </div>

        {/* Elevated Architectural White Card */}
        <div className="relative bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-hairline p-5 sm:p-6 md:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] overflow-visible">
          {/* Dual Sliders */}
          <div className="space-y-3.5 sm:space-y-4">
            {content.sliders.map((slider, idx) => {
              const value = values[idx];
              const setValue = setters[idx];
              return (
                <div key={slider.label} className="bg-canvas/50 rounded-2xl p-4 sm:p-5 border border-hairline/60">
                  <div className="flex items-center justify-between mb-3 min-w-0">
                    <span className="text-[13px] sm:text-[14px] font-mono font-semibold text-ink truncate">
                      {slider.label}
                    </span>
                    <span className="font-mono font-black text-[18px] sm:text-[22px] text-ink tracking-tight ml-2 shrink-0">
                      {slider.formatValue(value)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 pt-1">
                    <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate/60 w-14 sm:w-16 shrink-0">
                      {slider.formatValue(slider.min)}
                    </span>

                    <SliderPrimitive.Root
                      className="relative flex items-center flex-1 h-6 select-none touch-none cursor-pointer"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={[value]}
                      onValueChange={([v]) => setValue(v)}
                    >
                      <SliderPrimitive.Track className="relative h-2 flex-1 rounded-full bg-charcoal/10 overflow-hidden">
                        <SliderPrimitive.Range className="absolute h-full rounded-full bg-ink" />
                      </SliderPrimitive.Track>
                      <SliderPrimitive.Thumb
                        className="block h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-ink border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] focus:outline-none transition-transform hover:scale-115 active:scale-95 cursor-grab active:cursor-grabbing"
                        aria-label={slider.label}
                      />
                    </SliderPrimitive.Root>

                    <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate/60 w-14 sm:w-16 shrink-0 text-right">
                      {slider.formatValue(slider.max)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic GSAP Numeric Ticker Display */}
          <div className="mt-8 sm:mt-10 pt-8 border-t border-hairline/80 text-center">
            {persona === "creator" ? (
              <div>
                <p className="font-display text-[17px] sm:text-[22px] md:text-[25px] leading-[1.38] text-ink font-bold max-w-2xl mx-auto">
                  Creators like you on sellr earn between{" "}
                  <HighlightedText
                    colorClass="bg-orange-400/25"
                    textColorClass="text-orange-950 font-mono font-black"
                    isItalic={false}
                  >
                    <TickerValue
                      value={rawLow}
                      format={formatINR}
                      className="inline-block text-[20px] sm:text-[26px] md:text-[30px] align-baseline"
                    />
                  </HighlightedText>{" "}
                  and{" "}
                  <HighlightedText
                    colorClass="bg-emerald-400/25"
                    textColorClass="text-emerald-950 font-mono font-black"
                    isItalic={false}
                  >
                    <TickerValue
                      value={rawHigh}
                      format={formatINR}
                      className="inline-block text-[20px] sm:text-[26px] md:text-[30px] align-baseline"
                    />
                  </HighlightedText>{" "}
                  per month from verified views and brand collaborations combined.
                </p>
                <div className="mt-4 text-center">
                  <p className="text-[12px] sm:text-[13px] font-mono text-charcoal/80 flex items-center justify-center gap-1.5 flex-wrap">
                    <HighlightedText
                      colorClass="bg-emerald-400/25"
                      textColorClass="text-emerald-900 font-semibold font-mono"
                      isItalic={false}
                    >
                      Instant UPI cashout
                    </HighlightedText>
                    <span>to your bank account • Zero agency cuts</span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-display text-[16px] sm:text-[19px] md:text-[22px] leading-[1.45] text-ink font-bold max-w-2xl mx-auto space-y-2 sm:space-y-1">
                  <p className="block">
                    At this budget, your campaign reaches an estimated{" "}
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap align-baseline">
                      <HighlightedText
                        colorClass="bg-blue-400/25"
                        textColorClass="text-blue-950 font-mono font-black"
                        isItalic={false}
                      >
                        <TickerValue
                          value={rawViewsLow}
                          format={formatLakhViews}
                          className="text-[17px] sm:text-[21px] md:text-[23px]"
                        />
                      </HighlightedText>
                      <span className="text-slate-600 font-medium text-sm sm:text-base">to</span>
                      <HighlightedText
                        colorClass="bg-blue-400/25"
                        textColorClass="text-blue-950 font-mono font-black"
                        isItalic={false}
                      >
                        <TickerValue
                          value={rawViewsHigh}
                          format={formatLakhViews}
                          className="text-[17px] sm:text-[21px] md:text-[23px]"
                        />
                      </HighlightedText>
                    </span>{" "}
                    organic views
                  </p>
                  <p className="block">
                    and generates{" "}
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap align-baseline">
                      <HighlightedText
                        colorClass="bg-emerald-400/25"
                        textColorClass="text-emerald-950 font-mono font-black"
                        isItalic={false}
                      >
                        <TickerValue
                          value={rawRevLow}
                          format={formatINR}
                          className="text-[17px] sm:text-[21px] md:text-[23px]"
                        />
                      </HighlightedText>
                      <span className="text-slate-600 font-medium text-sm sm:text-base">to</span>
                      <HighlightedText
                        colorClass="bg-emerald-400/25"
                        textColorClass="text-emerald-950 font-mono font-black"
                        isItalic={false}
                      >
                        <TickerValue
                          value={rawRevHigh}
                          format={formatINR}
                          className="text-[17px] sm:text-[21px] md:text-[23px]"
                        />
                      </HighlightedText>
                    </span>{" "}
                    in attributed revenue.
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-[12px] sm:text-[13px] font-mono text-charcoal/80 flex items-center justify-center gap-1.5 flex-wrap">
                    <HighlightedText
                      colorClass="bg-blue-400/25"
                      textColorClass="text-blue-900 font-semibold font-mono"
                      isItalic={false}
                    >
                      100% escrow protection
                    </HighlightedText>
                    <span>& verified views</span>
                  </p>
                </div>
              </div>
            )}

            <p className="mt-4 font-mono text-[11.5px] text-slate/70 max-w-lg mx-auto leading-relaxed">
              {content.disclaimer}
            </p>

            {/* CTA & Handle Pill */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="rounded-xl border border-dashed border-hairline-strong px-3.5 py-2 text-[12px] font-mono font-semibold text-slate bg-canvas/40 shadow-xs">
                {content.handlePreview}
              </span>

              {/* Primary Action Button with Dynamic Random Underline Doodle */}
              <SlidingScribbleButton
                href={personaContent[persona].ctaHref}
                label={content.ctaLabel}
                accentColor={persona === "creator" ? "#ff77cd" : "#ff5f04"}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EarningsCalculator;
