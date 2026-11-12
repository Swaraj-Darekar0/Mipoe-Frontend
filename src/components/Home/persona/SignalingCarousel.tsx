import React, { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { MoreHorizontal, X, ChevronUp, Check, Sparkles, ExternalLink, CheckCircle2, ArrowRight } from "lucide-react";
import type { CarouselStep } from "./personaContent";
import { InstagramReelCard } from "./InstagramReelCard";
import HighlightedText from "./HighlightedText";
import { SquishyWord } from "./SquishySectionHeading";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// High-contrast neutral palette (zero pink)
const TINT_CLASS: Record<CarouselStep["tint"], string> = {
  peach: "bg-[#ffffff]",
  rose: "bg-[#fbfbfd]",
  mint: "bg-[#ffffff]",
  lavender: "bg-[#fbfbfd]",
  sky: "bg-[#ffffff]",
};

const TINT_BORDER: Record<CarouselStep["tint"], string> = {
  peach: "border-black/5",
  rose: "border-black/5",
  mint: "border-black/5",
  lavender: "border-black/5",
  sky: "border-black/5",
};

interface SignalingCarouselProps {
  label: string;
  intro: string;
  steps: CarouselStep[];
  persona?: "creator" | "brand";
}

// Real Sellr Platform UI Snippets tailored to each persona and step (Authentic platform architecture)
const renderPlatformSnippet = (
  stepNumber: string,
  persona: "creator" | "brand" = "creator",
  isCompact: boolean = true
) => {
  if (persona === "brand") {
    switch (stepNumber) {
      case "01":
      case "1":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
              <span className="text-charcoal/70 font-semibold truncate">sellr.in/brand</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Escrow Locked
              </span>
            </div>

            <div className="mt-2.5 min-w-0">
              <div className="text-[12.5px] font-bold text-charcoal tracking-tight truncate font-display leading-tight">
                Urban Vault • Tech Audio Drop
              </div>
              <div className="mt-1 flex items-baseline gap-2 font-mono min-w-0">
                <span className="text-lg font-bold text-emerald-600 shrink-0">₹1,50,000</span>
                <span className="text-[9px] text-charcoal/60 truncate">Smart Contract Escrow</span>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Rate</div>
                <div className="font-bold text-charcoal text-[9.5px] mt-0.5">₹85 / 1K Views</div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Target Views</div>
                <div className="font-bold text-charcoal text-[9.5px] mt-0.5">17,60,000</div>
              </div>
            </div>

            <div className="mt-2.5 w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full w-full" />
            </div>

            <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between min-w-0">
              <span className="text-[9px] text-charcoal/70 font-mono truncate">100% Escrow Protection</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-bold font-mono shadow-xs shrink-0 ml-1">
                Active ⚡
              </span>
            </div>
          </div>
        );

      case "02":
      case "2":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
              <span className="text-charcoal/70 font-semibold truncate">Creator Applications</span>
              <span className="px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold uppercase text-[8px] border border-orange-500/20 shrink-0">
                48 In Review
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-charcoal font-bold text-[11px] font-mono">
                  R
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-charcoal truncate font-display leading-tight">
                  @rohit.reels
                </div>
                <div className="text-[9px] text-charcoal/60 font-mono truncate">
                  240K Followers • Tech
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[8.5px] font-mono shrink-0 border border-emerald-500/20">
                Approved ✓
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Engagement</div>
                <div className="font-bold text-charcoal text-[9.5px] mt-0.5">6.8% Rate</div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Audience Fit</div>
                <div className="font-bold text-emerald-600 text-[9.5px] mt-0.5">94% Gen-Z</div>
              </div>
            </div>

            <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[9px] font-mono text-charcoal/70 min-w-0">
              <span className="truncate">Auto-Matched Algorithmically</span>
              <span className="text-sky-600 font-bold shrink-0 ml-1">Matched ⚡</span>
            </div>
          </div>
        );

      case "03":
      case "3":
        return (
          <InstagramReelCard
            username="rohit.reels"
            timeAgo="3d"
            audioTrack="Urban Vault • Authentic Audio Drop"
            videoSrc="/REFER.mp4"
            posterSrc="/refer_poster.jpg"
            caption="Testing the new Urban Vault ANC buds in Mumbai noise 🎧"
            hashtags={["#urbanvault", "#techreview", "#sellrpartner"]}
            likesCount={340}
            commentsCount={18}
            sharesCount={45}
            savesCount={82}
            verifiedReach="520K VERIFIED VIEWS"
            payoutBadge="6.4x ROAS Delivered ⚡"
            isCompact={isCompact}
          />
        );

      case "04":
      case "4":
        return (
          <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
              <span className="text-charcoal/70 font-semibold truncate">Live Attribution Ledger</span>
              <span className="text-emerald-600 font-bold shrink-0 ml-1">Live Tracking</span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[9px] text-charcoal/60 font-mono">Attributed Sales Revenue</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tracking-tight truncate mt-0.5">
                  ₹2,84,000
                </div>
              </div>
              <div className="text-right shrink-0 ml-1">
                <div className="text-[9.5px] text-charcoal/70 font-mono font-semibold">Spend: ₹44,200</div>
                <div className="text-[9.5px] text-amber-600 font-mono font-bold">6.4x ROAS</div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Verified Views</div>
                <div className="font-bold text-charcoal text-[9.5px] mt-0.5">520,000</div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Avg Rate</div>
                <div className="font-bold text-emerald-600 text-[9.5px] mt-0.5">₹85 / 1K views</div>
              </div>
            </div>

            <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between min-w-0">
              <div className="text-[9px] text-charcoal/70 font-mono truncate">
                Ad Fraud Deduplication: <span className="text-charcoal font-semibold">Active</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/5 text-charcoal font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
                Real-Time
              </span>
            </div>
          </div>
        );

      case "05":
      case "5":
      default:
        return (
          <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
            <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
              <span className="text-charcoal/70 font-semibold truncate">Campaign Settlement</span>
              <span className="text-emerald-600 font-bold shrink-0 ml-1">Zero Waste Billing ✓</span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[9px] text-charcoal/60 font-mono">Delivered Reach</div>
                <div className="text-xl sm:text-2xl font-black text-charcoal font-mono tracking-tight truncate mt-0.5">
                  1.5M Views
                </div>
              </div>
              <div className="text-right shrink-0 ml-1">
                <div className="text-[9.5px] text-emerald-600 font-mono font-bold">100% Target Met</div>
                <div className="text-[8px] text-charcoal/50 font-mono">₹0 Unused Escrow</div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Retainers Paid</div>
                <div className="font-bold text-emerald-600 text-[9.5px] mt-0.5">₹0 Wasted</div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
                <div className="text-charcoal/50 text-[8px] uppercase">Settlement Model</div>
                <div className="font-bold text-charcoal text-[9.5px] mt-0.5">Pay-Per-View</div>
              </div>
            </div>

            <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between min-w-0">
              <div className="text-[9px] text-charcoal/70 font-mono truncate">
                Contract: <span className="text-charcoal font-semibold">100% Settled</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
                Settled ⚡
              </span>
            </div>
          </div>
        );
    }
  }

  // Creator platform snippets
  switch (stepNumber) {
    case "01":
    case "1":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
            <span className="text-charcoal/70 font-semibold shrink-0">sellr.in</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1 shrink-0 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified Creator
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-charcoal font-bold text-[11px] font-mono">
                S
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-charcoal truncate font-display leading-tight">
                @swaraj
              </div>
              <div className="text-[9px] text-charcoal/60 font-mono truncate">
                500+ Followers • Nano
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8.5px] font-mono font-bold shrink-0 border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Social Channels Linked */}
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="text-charcoal/50 text-[8px] uppercase">Instagram</div>
              <div className="font-bold text-charcoal text-[9.5px] mt-0.5">Connected ✓</div>
            </div>
            <div className="p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="text-charcoal/50 text-[8px] uppercase">YouTube</div>
              <div className="font-bold text-charcoal text-[9.5px] mt-0.5">Connected ✓</div>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[9px] font-mono text-charcoal/70 min-w-0">
            <span className="text-charcoal/80 font-semibold truncate">Smart Escrow</span>
            <span className="text-orange-600 font-bold shrink-0 ml-1">Instant Payouts ⚡</span>
          </div>
        </div>
      );

    case "02":
    case "2":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-zinc-950 text-white p-3 sm:p-3.5 border border-white/15 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.35)] select-none">
          {/* Top Header: Brand Identity + Platform Badge (Faithfully mirroring CampaignCard.tsx) */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-white/10 border border-white/20 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                UV
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-display font-bold text-[12px] text-white tracking-tight truncate">
                  Urban Vault
                </span>
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-mono text-[9px] font-bold text-zinc-400 tracking-wider shrink-0 uppercase">
              [ IG REELS ]
            </span>
          </div>

          {/* Monetary Anchor: Exact Rate Per 1,000 Views */}
          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                ₹85
              </span>
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                / 1K VIEWS
              </span>
            </div>
            <p className="font-mono text-[8.5px] font-semibold tracking-wider uppercase text-zinc-400 mt-0.5">
              PER 1,000 VERIFIED VIEWS • ESCROW LOCKED
            </p>
          </div>

          {/* Authentic UGC Campaign Brief Description */}
          <p className="mt-2 text-[10px] text-zinc-300 font-normal leading-snug line-clamp-2">
            Film a quick vertical reel showing how you use our ANC earbuds in real life. No stiff corporate scripts.
          </p>

          {/* Symmetrical 3-Column Financial Grid */}
          <div className="mt-2.5 grid grid-cols-3 gap-1 py-1.5 px-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <div>
              <p className="font-mono text-[7.5px] font-bold uppercase tracking-wider text-zinc-400">
                POOL
              </p>
              <p className="font-mono text-[10.5px] font-bold text-white mt-0.5">
                ₹1,50,000
              </p>
            </div>
            <div className="border-x border-white/10">
              <p className="font-mono text-[7.5px] font-bold uppercase tracking-wider text-zinc-400">
                TARGET
              </p>
              <p className="font-mono text-[10.5px] font-bold text-white mt-0.5">
                1.76M
              </p>
            </div>
            <div>
              <p className="font-mono text-[7.5px] font-bold uppercase tracking-wider text-zinc-400">
                ENDS IN
              </p>
              <p className="font-mono text-[10.5px] font-bold text-white mt-0.5">
                12D LEFT
              </p>
            </div>
          </div>

          {/* Escrow Progress Bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 uppercase tracking-wider">
              <span>BUDGET USED</span>
              <span className="font-bold text-white">68%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full w-[68%]" />
            </div>
          </div>

          {/* Action Callout */}
          <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-orange-400">
              VIEW DEAL & JOIN
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-mono font-bold text-[9px] shadow-xs flex items-center gap-1">
              JOIN <ArrowRight className="size-2.5" />
            </span>
          </div>
        </div>
      );

    case "03":
    case "3":
      return (
        <InstagramReelCard
          username="varenform"
          timeAgo="1w"
          audioTrack="Whitney Houston • Call You Tonight"
          videoSrc="/REFER.mp4"
          posterSrc="/refer_poster.jpg"
          caption="The cleanest wireless audio drop this year"
          hashtags={["#ootd", "#fit", "#mensstyle", "#sellr"]}
          likesCount={174}
          commentsCount={2}
          sharesCount={3}
          savesCount={20}
          verifiedReach="210K VIEWS ✓"
          payoutBadge="₹17,850 Credited ⚡"
          isCompact={isCompact}
        />
      );

    case "04":
    case "4":
      return (
        <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
            <span className="text-charcoal/70 font-semibold truncate">Sellr Creator Wallet</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1 shrink-0 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Instant UPI Ready
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between min-w-0">
            <div className="min-w-0">
              <div className="text-[9px] text-charcoal/60 font-mono">Available to Withdraw</div>
              <div className="text-xl sm:text-2xl font-black text-charcoal font-mono tracking-tight truncate mt-0.5">
                ₹26,350.00
              </div>
            </div>
            <div className="text-right shrink-0 ml-1">
              <div className="text-[9.5px] text-emerald-600 font-mono font-bold">+₹4,250 today</div>
              <div className="text-[8px] text-charcoal/50 font-mono">From Verified Views</div>
            </div>
          </div>

          {/* Recent View Settlements */}
          <div className="mt-2.5 space-y-1.5 text-[9px] font-mono">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="truncate">
                <span className="font-semibold text-charcoal">Urban Vault ANC Drop</span>
                <span className="text-charcoal/50 block text-[8px]">210K Verified Views</span>
              </div>
              <span className="font-bold text-emerald-600 shrink-0 ml-1">+₹17,850 ✓</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="truncate">
                <span className="font-semibold text-charcoal">Wireless Audio Review</span>
                <span className="text-charcoal/50 block text-[8px]">100K Verified Views</span>
              </div>
              <span className="font-bold text-emerald-600 shrink-0 ml-1">+₹8,500 ✓</span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between min-w-0">
            <div className="text-[9px] text-charcoal/70 font-mono truncate">
              UPI: <span className="text-charcoal font-semibold">swaraj@okaxis</span>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] font-mono shadow-xs shrink-0 ml-1">
              Withdraw to Bank ⚡
            </span>
          </div>
        </div>
      );

    case "05":
    case "5":
    default:
      return (
        <div className="w-full min-w-0 rounded-2xl bg-white text-charcoal p-3 sm:p-3.5 border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] select-none">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 text-[9.5px] font-mono min-w-0">
            <span className="text-charcoal/70 font-semibold truncate">sellr.in/store/swaraj</span>
            <span className="text-amber-600 font-bold shrink-0 ml-1">Top 5% Creator ★</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-charcoal font-bold text-[11px] font-mono">
                S
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold text-charcoal truncate font-display leading-tight">
                Swaraj's Audio Picks
              </div>
              <div className="text-[9px] text-charcoal/60 font-mono truncate">
                14 Live Brand Drops Curated
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8.5px] font-mono font-bold shrink-0 border border-emerald-500/20">
              Live
            </span>
          </div>

          {/* Curated Drops */}
          <div className="mt-2.5 space-y-1.5 text-[9px] font-mono">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="truncate">
                <span className="font-semibold text-charcoal">Urban Vault ANC Buds</span>
                <span className="text-charcoal/50 block text-[8px]">₹3,499 retail</span>
              </div>
              <span className="font-bold text-orange-600 shrink-0 ml-1">12% Comm.</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.03] border border-black/5">
              <div className="truncate">
                <span className="font-semibold text-charcoal">Minimalist Desk Mat</span>
                <span className="text-charcoal/50 block text-[8px]">₹1,299 retail</span>
              </div>
              <span className="font-bold text-orange-600 shrink-0 ml-1">15% Comm.</span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[9px] min-w-0">
            <span className="text-charcoal/70 font-mono truncate">Store Conv: <strong className="text-charcoal">4.8%</strong></span>
            <span className="text-orange-600 font-bold font-mono flex items-center gap-1 shrink-0 ml-1">
              Share Store <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      );
  }
};

// ============================================================================
// MOBILE VIEWPORT COMPONENT (Instagram Stories Analogy: Tap & 10s Auto-Advance)
// ============================================================================
const MobileSignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps, persona }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerResetCount, setTimerResetCount] = useState(0);

  const setPaused = useCallback((val: boolean) => {
    setIsPaused(val);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleNextStory = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % steps.length);
    setTimerResetCount((c) => c + 1);
  }, [steps.length]);

  const handlePrevStory = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setTimerResetCount((c) => c + 1);
  }, []);

  const scrollToStep = useCallback((idx: number) => {
    const safeIndex = Math.min(steps.length - 1, Math.max(0, idx));
    setActiveIndex(safeIndex);
    setTimerResetCount((c) => c + 1);
  }, [steps.length]);

  const currentStep = steps[activeIndex] || steps[0];

  return (
    <div ref={containerRef} className="w-full bg-canvas py-10 sm:py-14 overflow-hidden">
      <div className="flex flex-col items-center justify-between w-full max-w-sm mx-auto px-2 min-h-[560px] sm:min-h-[620px] gap-3.5">
        <div className="text-center max-w-sm mx-auto shrink-0 px-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/5 text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal/70 mb-1">
            <span>{label}</span>
            <span>•</span>
            <span>Step {currentStep.number}/05</span>
          </div>
          <h2 className="font-display font-bold text-[18px] sm:text-[21px] leading-tight tracking-tight text-ink">
            {currentStep.title}
          </h2>
        </div>

        {/* Slender, centered iPhone mockup for mobile */}
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-auto select-none">
          <div
            className="relative rounded-[2.75rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.65)] overflow-visible shrink-0"
            style={{
              height: "clamp(400px, 58svh, 510px)",
              width: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              minHeight: "clamp(400px, 58svh, 510px)",
              maxHeight: "clamp(400px, 58svh, 510px)",
              minWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              maxWidth: "calc(clamp(400px, 58svh, 510px) / 2.048)",
              transform: "translate3d(0, 0, 0)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Left Buttons: Action + Volume */}
            <div className="absolute -left-[2.5px] top-[17%] h-4 w-[2.5px] rounded-l-full bg-[#25252a]" />
            <div className="absolute -left-[2.5px] top-[26%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
            <div className="absolute -left-[2.5px] top-[37%] h-10 w-[2.5px] rounded-l-full bg-[#25252a]" />
            {/* Right Buttons: Power + Camera Control */}
            <div className="absolute -right-[2.5px] top-[29%] h-13 w-[2.5px] rounded-r-full bg-[#25252a]" />
            <div className="absolute -right-[2px] top-[67%] h-9 w-[2px] rounded-r-full bg-[#222226]" />

            {/* Inner Screen */}
            <div className="relative w-full h-full rounded-[2.6rem] overflow-hidden bg-white ring-1 ring-white/10 flex flex-col justify-between min-w-0 min-h-0 border border-black/5 select-none">
              {/* Dynamic Island */}
              <div
                className="absolute top-2 inset-x-0 mx-auto w-[28%] max-w-[72px] h-[17px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                style={{ left: 0, right: 0, margin: "0 auto" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
              </div>

              {/* Pinned Top Story Header & 5-Segment Progress Bar */}
              <div className="relative z-30 pt-8.5 px-3.5 pb-1 shrink-0 flex flex-col gap-1.5 select-none bg-white">
                <div className="relative w-full flex items-center gap-1 pt-0.5 px-0.5 shrink-0 pointer-events-auto">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToStep(i);
                      }}
                      className="h-1 flex-1 rounded-full bg-charcoal/15 overflow-hidden cursor-pointer"
                      title={`Step ${i + 1}`}
                    >
                      {i < activeIndex ? (
                        <div className="h-full w-full bg-charcoal rounded-full" />
                      ) : i === activeIndex ? (
                        <div
                          key={`mobile-active-${activeIndex}-${timerResetCount}`}
                          className="h-full bg-charcoal rounded-full story-bar-active"
                          style={{
                            animationPlayState: isInView && !isPaused ? "running" : "paused",
                          }}
                          onAnimationEnd={handleNextStory}
                        />
                      ) : (
                        <div className="h-full w-0 bg-charcoal rounded-full" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="relative flex items-center justify-between pt-1 pb-0.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-charcoal flex items-center justify-center text-white text-[9.5px] font-mono font-bold shadow-xs">
                      s.
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-mono font-bold text-[12px] text-charcoal tracking-tight">
                        {persona === "brand" ? "sellr.in/brand" : "sellr.in"}
                      </span>
                      <span className="text-[9.5px] font-mono font-semibold text-charcoal/60">
                        Step {currentStep.number} / 05
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-charcoal/50">
                    <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Menu">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Close">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Story Canvas with smooth Animated transition */}
              <div className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto scrollbar-none my-auto flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={`w-full h-full flex flex-col justify-center px-3 sm:px-3.5 py-1 relative select-none ${TINT_CLASS[currentStep.tint]}`}
                  >
                    <span className="absolute -top-2 -right-1 text-[60px] font-bold leading-none text-charcoal/[0.04] select-none pointer-events-none font-display">
                      {currentStep.number}
                    </span>

                    <div className="relative z-10 my-auto py-0.5 flex flex-col gap-1 min-h-0 justify-center">
                      <div className="w-full shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {renderPlatformSnippet(currentStep.number, persona, true)}
                      </div>

                      <p className="text-[9.5px] sm:text-[10px] leading-snug text-charcoal/75 shrink-0 px-1 text-center font-medium line-clamp-2 mt-0.5">
                        {currentStep.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile Instagram Tap Overlays */}
              <div
                className="absolute inset-0 z-20 flex pointer-events-none"
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onMouseLeave={() => setPaused(false)}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevStory();
                  }}
                  className="w-[40%] h-full pointer-events-auto cursor-pointer"
                  aria-label="Previous story"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                  }}
                  className="w-[60%] h-full pointer-events-auto cursor-pointer"
                  aria-label="Next story"
                />
              </div>

              {/* Bottom CTA */}
              <div className="relative z-30 pt-1 pb-3 px-3.5 flex flex-col items-center justify-center shrink-0 w-full select-none bg-white pointer-events-auto">
                <ChevronUp className="w-4 h-4 text-charcoal/80 animate-bounce -mb-0.5 pointer-events-none" />
                <a
                  href="/login?role=creator"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[170px] py-1.5 px-3 rounded-xl bg-[#f2f2f5] hover:bg-[#eaebee] border border-black/8 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-charcoal text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95 cursor-pointer"
                >
                  <span>sellr.in</span>
                </a>
              </div>

              {/* Home Bar */}
              <div
                className="absolute bottom-1.5 inset-x-0 mx-auto w-18 h-1 rounded-full bg-charcoal/25 z-40 pointer-events-none"
                style={{ left: 0, right: 0, margin: "0 auto" }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 shrink-0 pt-1">
          {steps.map((step, i) => (
            <button
              key={step.number}
              type="button"
              onClick={() => scrollToStep(i)}
              aria-label={`Go to step ${step.number}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? "w-6 bg-ink" : "w-1.5 bg-hairline-strong hover:bg-slate"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DESKTOP VIEWPORT COMPONENT (Scroll-Driven Pinning + 10s Timer + Vertical Slide)
// ============================================================================
const DesktopSignalingCarousel: React.FC<SignalingCarouselProps> = ({ label, intro, steps, persona }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const activeIndexRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerResetCount, setTimerResetCount] = useState(0);

  const setPaused = useCallback((val: boolean) => {
    setIsPaused(val);
  }, []);

  // IntersectionObserver to only run auto-advance when section is in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Jump to specific step directly and smoothly
  const scrollToStep = useCallback((idx: number) => {
    const safeIndex = Math.min(steps.length - 1, Math.max(0, idx));
    isProgrammaticScrollRef.current = true;
    setDirection(safeIndex >= activeIndexRef.current ? 1 : -1);
    setActiveIndex(safeIndex);
    activeIndexRef.current = safeIndex;
    setTimerResetCount((c) => c + 1);
  }, [steps.length]);

  // When the 10-second timer completes on desktop, advance to next story
  const handleDesktopTimerComplete = useCallback(() => {
    const next = (activeIndexRef.current + 1) % steps.length;
    scrollToStep(next);
  }, [scrollToStep, steps.length]);

  // Desktop scroll-driven progression using ScrollTrigger with matchMedia
  useEffect(() => {
    const container = containerRef.current;
    const pinEl = pinRef.current;
    if (!container || steps.length < 2) return;

    const scrollDistance = steps.length * 850;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const st = ScrollTrigger.create({
        trigger: container,
        pin: pinEl || container,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        anticipatePin: 0,
        refreshPriority: 10,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (isProgrammaticScrollRef.current) {
            if (Math.abs(self.getVelocity()) > 20) {
              isProgrammaticScrollRef.current = false;
            } else {
              return;
            }
          }

          // Active dwell mapping:
          // Allocate 0.0 to 0.82 for sequential progression through steps 0..4 (all 5 steps complete smoothly).
          // Progress 0.82 to 1.0 is a complete dwell period holding Step 5 (flip-flip slide)
          // fully settled and visible before unpinning into the next section.
          const activeRatio = 0.82;
          let next: number;
          if (self.progress >= activeRatio) {
            next = steps.length - 1;
          } else {
            const normalizedProgress = self.progress / activeRatio;
            next = Math.min(
              steps.length - 1,
              Math.max(0, Math.floor(normalizedProgress * steps.length))
            );
          }

          if (next !== activeIndexRef.current) {
            setDirection(next >= activeIndexRef.current ? 1 : -1);
            activeIndexRef.current = next;
            setActiveIndex(next);
            setTimerResetCount((c) => c + 1);
          }
        },
      });

      scrollTriggerRef.current = st;

      return () => {
        st.kill(true);
        scrollTriggerRef.current = null;
      };
    });

    return () => mm.revert();
  }, [steps.length]);

  const chassisRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // 3D Chassis Tilt and Specular Glare Reacting to Cursor
  useEffect(() => {
    const container = containerRef.current;
    const chassis = chassisRef.current;
    const glare = glareRef.current;
    if (!container || !chassis || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const xTo = gsap.quickTo(chassis, "rotationY", { duration: 0.5, ease: "power2.out" });
    const yTo = gsap.quickTo(chassis, "rotationX", { duration: 0.5, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const xRel = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const yRel = (e.clientY - rect.top) / rect.height - 0.5;

      xTo(xRel * 14); // -7deg to +7deg
      yTo(-yRel * 12); // +6deg to -6deg

      if (glare) {
        const px = Math.round((xRel + 0.5) * 100);
        const py = Math.round((yRel + 0.5) * 100);
        glare.style.background = `radial-gradient(circle 340px at ${px}% ${py}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)`;
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
      if (glare) {
        glare.style.background = "radial-gradient(circle 340px at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)";
      }
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const currentStep = steps[activeIndex] || steps[0];

  const renderHybridTitle = (title: string) => {
    if (title.includes(".")) {
      const dotIdx = title.indexOf(".");
      const primary = title.slice(0, dotIdx + 1).trim();
      const secondary = title.slice(dotIdx + 1).trim();
      return (
        <div className="flex flex-col">
          <span className="font-display font-black uppercase text-ink tracking-tight block">
            <SquishyWord text={primary} />
          </span>
          {secondary && (
            <div className="mt-1.5">
              <HighlightedText
                colorClass="bg-creator-pink/25"
                textColorClass="text-slate-800"
              >
                {secondary}
              </HighlightedText>
            </div>
          )}
        </div>
      );
    }

    const words = title.split(" ");
    if (words.length <= 3) {
      return (
        <span className="font-display font-black uppercase text-ink tracking-tight block">
          <SquishyWord text={title} />
        </span>
      );
    }
    const splitPoint = Math.min(3, Math.ceil(words.length / 2));
    const primary = words.slice(0, splitPoint).join(" ");
    const secondary = words.slice(splitPoint).join(" ");
    return (
      <div className="flex flex-col">
        <span className="font-display font-black uppercase text-ink tracking-tight block">
          <SquishyWord text={`${primary}.`} />
        </span>
        <div className="mt-1.5">
          <HighlightedText
            colorClass="bg-creator-pink/25"
            textColorClass="text-slate-800"
          >
            {secondary}
          </HighlightedText>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-canvas"
    >
      <div ref={pinRef} className="w-full h-[100svh] max-h-[100svh] min-h-[580px] overflow-hidden flex flex-col justify-center relative py-2">
        {/* Center Top Pill Badge without dirty blur */}
        <div
          className="absolute top-16 lg:top-20 inset-x-0 mx-auto w-fit z-20 flex items-center justify-center pointer-events-none"
          style={{ left: 0, right: 0, margin: "0 auto" }}
        >
          <div className="relative pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-hairline-strong text-charcoal text-[11px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {label}
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full h-full flex flex-col justify-center">
        {/* Two Column Grid */}
        <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto px-6">
          {/* Left Section: Smooth Vertical Sliding Title & Persistent Step Navigation */}
          <div className="lg:col-span-5 flex flex-col justify-center min-h-[380px] relative pr-4">
            <div className="relative z-10 min-h-[220px] flex flex-col justify-center overflow-visible">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      opacity: 0,
                      y: dir >= 0 ? 32 : -32,
                    }),
                    center: {
                      opacity: 1,
                      y: 0,
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      y: dir >= 0 ? -32 : 32,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="text-[12px] font-mono font-semibold uppercase tracking-[1.8px] text-slate/80 mb-2.5">
                    Step {currentStep.number} of 05
                  </div>
                  <h2 className="text-[34px] lg:text-[40px] xl:text-[44px] leading-[1.08] tracking-[-0.03em]">
                    {renderHybridTitle(currentStep.title)}
                  </h2>
                  <p className="mt-3.5 text-[14px] lg:text-[15px] leading-relaxed text-charcoal/70 max-w-md">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Persistent, stable Step Navigation Buttons */}
            <div className="mt-6 flex items-center gap-2 pt-3 border-t border-black/5">
              {steps.map((step, idx) => (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => scrollToStep(idx)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    idx === activeIndex
                      ? "bg-charcoal text-white shadow-xs scale-105"
                      : "bg-black/5 hover:bg-black/10 text-charcoal/60"
                  }`}
                  aria-label={`Go to Step ${step.number}`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section: Stationary Phone Mockup with 3D Chassis Tilt and Specular Glare */}
          <div className="lg:col-span-7 flex items-center justify-center relative perspective-1200">
            <div
              ref={chassisRef}
              className="relative shrink-0 flex items-center justify-center select-none will-change-transform transform-style-3d transition-transform duration-100 ease-out"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              style={{
                height: "clamp(480px, 72svh, 680px)",
                width: "calc(clamp(480px, 72svh, 680px) / 2.02)",
                minHeight: "clamp(480px, 72svh, 680px)",
                maxHeight: "clamp(480px, 72svh, 680px)",
                minWidth: "calc(clamp(480px, 72svh, 680px) / 2.02)",
                maxWidth: "calc(clamp(480px, 72svh, 680px) / 2.02)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="relative w-full h-full rounded-[2.85rem] bg-[#121318] p-[3px] ring-1 ring-white/15 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] overflow-visible">
                {/* Left Buttons: Action + Volume */}
                <div className="absolute -left-[2.5px] top-[17%] h-5 w-[2.5px] rounded-l-full bg-[#25252a]" />
                <div className="absolute -left-[2.5px] top-[26%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                <div className="absolute -left-[2.5px] top-[37%] h-11 w-[2.5px] rounded-l-full bg-[#25252a]" />
                {/* Right Buttons: Power + Camera Control */}
                <div className="absolute -right-[2.5px] top-[29%] h-14 w-[2.5px] rounded-r-full bg-[#25252a]" />
                <div className="absolute -right-[2px] top-[67%] h-11 w-[2px] rounded-r-full bg-[#222226]" />

                {/* Dynamic Specular Glare Sheen Layer */}
                <div
                  ref={glareRef}
                  className="absolute inset-0 z-50 pointer-events-none rounded-[2.85rem] transition-all duration-200 opacity-60"
                  style={{
                    background: "radial-gradient(circle 340px at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
                  }}
                />

                {/* Inner Screen */}
                <div className="relative w-full h-full rounded-[2.7rem] overflow-hidden bg-white ring-1 ring-white/10 flex flex-col justify-between min-w-0 min-h-0 border border-black/5 select-none">
                  {/* Dynamic Island */}
                  <div
                    className="absolute top-2.5 inset-x-0 mx-auto w-[28%] max-w-[72px] h-[18px] rounded-full bg-black z-40 flex items-center justify-center pointer-events-none ring-1 ring-white/5 shadow-inner"
                    style={{ left: 0, right: 0, margin: "0 auto" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111116] ml-auto mr-1.5 shrink-0 border border-white/5" />
                  </div>

                  {/* Pinned Top Story Header & 5-Segment Progress Bar */}
                  <div className="relative z-30 pt-9.5 px-4 pb-1 shrink-0 flex flex-col gap-1.5 select-none bg-white">
                    <div className="relative w-full flex items-center gap-1 pt-0.5 px-0.5 shrink-0 pointer-events-auto">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToStep(i);
                          }}
                          className="h-1 flex-1 rounded-full bg-charcoal/15 overflow-hidden cursor-pointer"
                          title={`Step ${i + 1}`}
                        >
                          {i < activeIndex ? (
                            <div className="h-full w-full bg-charcoal rounded-full" />
                          ) : i === activeIndex ? (
                            <div
                              key={`desktop-active-${activeIndex}-${timerResetCount}`}
                              className="h-full bg-charcoal rounded-full story-bar-active"
                              style={{
                                animationPlayState: isInView && !isPaused ? "running" : "paused",
                              }}
                              onAnimationEnd={handleDesktopTimerComplete}
                            />
                          ) : (
                            <div className="h-full w-0 bg-charcoal rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="relative flex items-center justify-between pt-1 pb-0.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-charcoal flex items-center justify-center text-white text-[9.5px] font-mono font-bold shadow-xs">
                          s.
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="font-mono font-bold text-[12px] text-charcoal tracking-tight">
                            {persona === "brand" ? "sellr.in/brand" : "sellr.in"}
                          </span>
                          <span className="text-[9.5px] font-mono font-semibold text-charcoal/60">
                            Step {currentStep.number} / 05
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-charcoal/50">
                        <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Menu">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:text-charcoal transition-colors" aria-label="Close">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle Story Canvas with smooth Vertical Animated transition */}
                  <div className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto sm:overflow-hidden scrollbar-none my-auto flex flex-col justify-center">
                    <AnimatePresence mode="popLayout" custom={direction}>
                      <motion.div
                        key={activeIndex}
                        custom={direction}
                        variants={{
                          enter: (dir: number) => ({
                            opacity: 0,
                            y: dir >= 0 ? 36 : -36,
                          }),
                          center: {
                            opacity: 1,
                            y: 0,
                          },
                          exit: (dir: number) => ({
                            opacity: 0,
                            y: dir >= 0 ? -36 : 36,
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full h-full flex flex-col justify-center px-3.5 sm:px-4 py-1 relative select-none ${TINT_CLASS[currentStep.tint]}`}
                      >
                        <span className="absolute -top-2 -right-1 text-[75px] font-bold leading-none text-charcoal/[0.04] select-none pointer-events-none font-display">
                          {currentStep.number}
                        </span>

                        <div className="relative z-10 my-auto py-0.5 flex flex-col min-h-0 justify-center">
                          <div className="w-full shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            {renderPlatformSnippet(currentStep.number, persona, true)}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Bottom CTA */}
                  <div className="relative z-30 pt-1 pb-3.5 px-4 flex flex-col items-center justify-center shrink-0 w-full select-none bg-white pointer-events-auto">
                    <ChevronUp className="w-4 h-4 text-charcoal/80 animate-bounce -mb-0.5 pointer-events-none" />
                    <a
                      href={persona === "brand" ? "/login?role=brand" : "/login?role=creator"}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-[170px] py-1.5 px-3 rounded-xl bg-[#f2f2f5] hover:bg-[#eaebee] border border-black/8 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-charcoal text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{persona === "brand" ? "sellr.in/brand" : "sellr.in"}</span>
                    </a>
                  </div>

                  {/* Home Bar */}
                  <div
                    className="absolute bottom-2 inset-x-0 mx-auto w-24 h-1 rounded-full bg-charcoal/25 z-40 pointer-events-none"
                    style={{ left: 0, right: 0, margin: "0 auto" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

// ============================================================================
// MAIN COMPONENT (Tailwind Separated Viewports)
// ============================================================================
const SignalingCarousel: React.FC<SignalingCarouselProps> = (props) => {
  return (
    <section id="signaling-factor" className="w-full bg-canvas border-t border-hairline">
      {/* Scoped CSS animation for the active 10s progress bar on both viewports */}
      <style>{`
        @keyframes fillProgressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .story-bar-active {
          animation: fillProgressBar 10s linear forwards;
        }
      `}</style>

      {/* Mobile Viewport - Pure Tailwind block lg:hidden */}
      <div className="block lg:hidden w-full">
        <MobileSignalingCarousel {...props} />
      </div>

      {/* Desktop Viewport - Pure Tailwind hidden lg:block */}
      <div className="hidden lg:block w-full">
        <DesktopSignalingCarousel {...props} />
      </div>
    </section>
  );
};

export default SignalingCarousel;


