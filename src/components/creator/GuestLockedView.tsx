import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
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
    "Secured by ERC-4337 Smart Account on Base",
  ],
  returnUrl = "/creator/wallet",
  icon = <Wallet className="w-7 h-7 text-lava" />,
}) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate(`/login?role=creator&redirect=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto my-4 sm:my-10 px-2 sm:px-4 overflow-hidden">
      <div className="relative rounded-2xl bg-white text-ink border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-8 text-center overflow-hidden">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-4">
          00 // CREATOR AUTHENTICATION REQUIRED
        </p>

        {/* Top Badge */}
        <div className="relative mx-auto size-14 rounded-xl bg-black/[0.03] border border-black/10 text-lava flex items-center justify-center mb-4">
          <div className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-ink text-white border border-white flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </div>
          {icon}
        </div>

        {/* Title & Subheading */}
        <div className="space-y-2 mb-5 min-w-0">
          <span className="inline-flex items-center justify-center font-mono text-[10px] font-bold text-lava bg-lava/10 border border-lava/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider max-w-full break-words">
            {subtitle}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-[1.15]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Value Highlights Well */}
        {bulletPoints && bulletPoints.length > 0 && (
          <div className="rounded-xl bg-black/[0.03] border border-black/[0.06] p-4 my-5 text-left max-w-md mx-auto space-y-2.5">
            {bulletPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 text-xs text-charcoal min-w-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug break-words">{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <Button
            onClick={handleSignIn}
            variant="creator"
            className="w-full sm:w-auto font-mono text-xs font-bold uppercase tracking-wider px-6 h-10 rounded-xl flex items-center justify-center gap-2"
          >
            Sign In with Google (1-Click)
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/creator/campaigns")}
            className="w-full sm:w-auto font-mono text-xs font-bold uppercase tracking-wider px-5 h-10 rounded-xl"
          >
            Explore Active Campaigns
          </Button>
        </div>

        {/* Trust Footnote */}
        <div className="mt-6 pt-4 border-t border-black/[0.08] flex items-center justify-center flex-wrap gap-2 font-mono text-[10px] text-steel">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>No credit card required. Free instant creator onboarding.</span>
        </div>
      </div>
    </div>
  );
};

export default GuestLockedView;

