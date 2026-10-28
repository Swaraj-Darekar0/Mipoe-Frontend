import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, ShieldCheck, ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GuestLockedViewProps {
  title?: string;
  subtitle?: string;
  description?: string;
  bulletPoints?: string[];
  returnUrl?: string;
  icon?: React.ReactNode;
}

export const GuestLockedView: React.FC<GuestLockedViewProps> = ({
  title = "Creator Financial Vault",
  subtitle = "Instant UPI Payouts & Zero-Fee Withdrawals",
  description = "Connect your account to unlock your wallet, claim campaign earnings, and initiate zero-fee micro-withdrawals to your UPI ID.",
  bulletPoints = [
    "Instant 1-Click UPI & IMPS bank payouts",
    "Zero platform fees on earnings & withdrawals",
    "Automated Section 194S TDS compliance & certificates",
    "Secured by ERC-4337 Smart Account on Base"
  ],
  returnUrl = "/creator/wallet",
  icon = <Wallet className="w-8 h-8 text-orange-500" />
}) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate(`/login?role=creator&redirect=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto my-6 sm:my-12 px-4">
      {/* Background ambient glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-orange-500/20 via-amber-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Grainy Frosted Glass Container */}
      <div className="relative backdrop-blur-xl bg-white/85 dark:bg-zinc-900/85 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl p-6 sm:p-10 text-center overflow-hidden">
        
        {/* Top Badge: Golden Padlock */}
        <div className="relative mx-auto size-16 rounded-2xl bg-gradient-to-b from-orange-100 to-amber-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-xs mb-5">
          <div className="absolute -top-1 -right-1 size-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <Lock className="w-3 h-3" />
          </div>
          {icon}
        </div>

        {/* Title & Subheading */}
        <div className="space-y-1.5 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-snow">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Value Highlights */}
        {bulletPoints && bulletPoints.length > 0 && (
          <div className="bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 my-6 text-left max-w-md mx-auto space-y-2.5">
            {bulletPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={handleSignIn}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            Sign In with Google (1-Click)
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/creator/campaigns")}
            className="w-full sm:w-auto text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-semibold px-5 py-3 rounded-xl"
          >
            Explore Active Campaigns
          </Button>
        </div>

        {/* Trust Footnote */}
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>No credit card required. Free instant creator onboarding.</span>
        </div>
      </div>
    </div>
  );
};

export default GuestLockedView;
