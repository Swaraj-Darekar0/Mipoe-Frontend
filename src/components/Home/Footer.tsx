import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import CursorStickerTrail from './persona/CursorStickerTrail';
import SlidingScribbleButton from './persona/SlidingScribbleButton';

import HighlightedText from './persona/HighlightedText';
import { SquishyWord } from './persona/SquishySectionHeading';

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-[#0e0e11] text-white overflow-hidden border-t border-white/10 select-none"
    >
      {/* Cursor Sticker Trail with Touch Tap-to-Spawn support */}
      <CursorStickerTrail containerRef={footerRef} spacing={85} />

      {/* Massive CTA Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-16 lg:pt-36 lg:pb-24 border-b border-white/10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-white/60">
              sellr. • Performance Creator Commerce
            </span>
          </div>

          <h2 className="text-[32px] sm:text-[48px] lg:text-[66px] font-display font-black uppercase leading-[0.95] tracking-tight text-white flex flex-wrap items-center gap-x-3 gap-y-1">
            <SquishyWord text="READY TO BRING YOUR" />
            <HighlightedText colorClass="bg-white/15" textColorClass="text-white">
              reach into motion?
            </HighlightedText>
          </h2>

          <p className="mt-5 font-body text-[15px] sm:text-[17px] text-white/70 max-w-xl leading-relaxed">
            Stop waiting for brand sponsorships. Monetize every 1,000 verified views automatically with instant escrow payouts.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <SlidingScribbleButton
              href="/login?role=creator"
              label="Get Started Free"
              accentColor="#ff77cd"
            />

            <a
              href="/login?role=brand"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-mono font-bold tracking-tight transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Launch Brand Campaign</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Navigation & Legal Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 text-xs font-mono tracking-wider">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-bold text-white tracking-tight font-display">sellr.</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono text-emerald-400 font-bold">
                SELLR PLATFORM
              </span>
            </div>
            <p className="max-w-md leading-relaxed text-white/60">
              The performance creator commerce network. Authentic UGC reels, verified view payouts, and friction-free social storefronts.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-white font-bold mb-1 block">Platform</span>
            <a className="text-white/60 hover:text-white transition-colors" href="/#signaling-factor">
              How It Works
            </a>
            <a className="text-white/60 hover:text-white transition-colors" href="/#featured-drops">
              Recent Drops
            </a>
            <a className="text-white/60 hover:text-white transition-colors" href="/#services-pillars">
              Pillars
            </a>
            <a className="text-white/60 hover:text-white transition-colors" href="/#earnings-calculator">
              Earnings Calculator
            </a>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-white font-bold mb-1 block">Legal & Safety</span>
            <Link className="text-white/60 hover:text-white transition-colors" to="/terms">
              Terms & Conditions
            </Link>
            <Link className="text-white/60 hover:text-white transition-colors" to="/privacy">
              Privacy Policy
            </Link>
            <Link className="text-white/60 hover:text-white transition-colors" to="/cookie-policy">
              Escrow Security
            </Link>
            <span className="mt-4 text-white/40">© 2026 sellr. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
