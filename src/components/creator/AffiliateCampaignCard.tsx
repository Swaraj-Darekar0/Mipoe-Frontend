import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Coins, 
  Copy, 
  Check, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { CreatorAffiliateCampaign } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AffiliateCampaignCardProps {
  campaign: CreatorAffiliateCampaign;
  onJoin: (id: number) => Promise<void>;
  joiningId: number | null;
  onCardClick: (id: number) => void;
}

export const AffiliateCampaignCard: React.FC<AffiliateCampaignCardProps> = ({
  campaign,
  onJoin,
  joiningId,
  onCardClick
}) => {
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const isJoined = campaign.joined;
  const isSaas = campaign.campaign_type === "saas_subscription";
  
  // Format dates
  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    if (!campaign.affiliate_code) return;
    
    const referralUrl = `${window.location.origin}/affiliate/${campaign.affiliate_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral URL copied to your clipboard.",
      className: "bg-emerald-600 border-emerald-500 text-white shadow-md"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin(campaign.id);
  };

  // Render commission summary label
  const renderCommissionLabel = () => {
    if (isSaas && campaign.commission_schedule) {
      const schedule = campaign.commission_schedule;
      const intervals = Object.keys(schedule);
      if (intervals.length > 0) {
        return intervals.map(interval => {
          const data = schedule[interval];
          const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
          return `${interval.charAt(0).toUpperCase() + interval.slice(1)}: ${valStr}`;
        }).join(" | ");
      }
    }
    return campaign.commission_type === "percentage" 
      ? `${campaign.commission_value}% per sale` 
      : `₹${campaign.commission_value} flat per sale`;
  };

  return (
    <div
      onClick={() => onCardClick(campaign.id)}
      className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-zinc-200/80 hover:border-orange-300 transition-all duration-200 flex flex-col w-full cursor-pointer hover:-translate-y-0.5"
    >
      {/* Banner Cover */}
      <div className="relative w-full aspect-video bg-zinc-100 overflow-hidden">
        {campaign.image_url && !imgError ? (
          <img
            src={campaign.image_url}
            alt={campaign.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-50 via-zinc-50 to-zinc-100 flex flex-col items-center justify-center text-zinc-400 relative">
            <Sparkles className="w-8 h-8 text-orange-400 mb-1.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Affiliate Program
            </span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          {isSaas ? (
            <Badge className="bg-orange-50 text-orange-700 border border-orange-200/80 shadow-xs text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              SaaS Subscription
            </Badge>
          ) : (
            <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200/80 shadow-xs text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Product-Based
            </Badge>
          )}

          {campaign.application_status === "active" && (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Active Partner
            </Badge>
          )}
          {campaign.application_status === "applied" && (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Applied (Reviewing)
            </Badge>
          )}
          {campaign.application_status === "rejected" && (
            <Badge className="bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Rejected
            </Badge>
          )}
        </div>

        {/* Date / Timer badge */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-200/80 text-[10px] text-zinc-700 font-bold flex items-center gap-1.5 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</span>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3.5">
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-zinc-900 text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors" title={campaign.name}>
            {campaign.name}
          </h3>
          <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
            {campaign.description || "Refer subscribers and earn commissions on successful conversions."}
          </p>
        </div>

        {/* Commission Box */}
        <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg shrink-0">
            <Coins className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Commission Structure</span>
            <span className="font-bold text-xs text-orange-700 truncate block mt-0.5" title={renderCommissionLabel()}>
              {renderCommissionLabel()}
            </span>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="pt-2 border-t border-zinc-100 flex gap-2">
          {campaign.application_status === "active" ? (
            <Button
              onClick={handleCopyLink}
              className={`w-full font-bold text-xs h-9 rounded-xl transition ${
                copied 
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white" 
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy Referral Link
                </>
              )}
            </Button>
          ) : campaign.application_status === "applied" ? (
            <Button
              disabled
              className="w-full bg-zinc-50 text-zinc-400 font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-zinc-200"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-zinc-400" />
              Applied (Pending Approval)
            </Button>
          ) : campaign.application_status === "rejected" ? (
            <Button
              disabled
              className="w-full bg-rose-50 text-rose-600 font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-rose-200"
            >
              Application Rejected
            </Button>
          ) : (
            <Button
              disabled={joiningId === campaign.id}
              onClick={handleJoinClick}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              {joiningId === campaign.id ? "Joining..." : "Join Program"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
