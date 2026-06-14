import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Instagram, 
  Youtube, 
  ImageOff, 
  Clock, 
  Coins, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink,
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
    
    // Construct the referral url (similar to join return url)
    const referralUrl = `${window.location.origin}/affiliate/${campaign.affiliate_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral URL copied to your clipboard.",
      className: "bg-green-600/90 border-green-500 text-white shadow-lg shadow-green-500/20"
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
        // e.g. "Monthly: 15% | Yearly: 20%"
        return intervals.map(interval => {
          const data = schedule[interval];
          const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
          return `${interval.charAt(0).toUpperCase() + interval.slice(1)}: ${valStr}`;
        }).join(" | ");
      }
    }
    // Fallback to base
    return campaign.commission_type === "percentage" 
      ? `${campaign.commission_value}% per sale` 
      : `₹${campaign.commission_value} flat per sale`;
  };

  return (
    <div
      onClick={() => onCardClick(campaign.id)}
      className="group bg-zinc-900 rounded-2xl overflow-hidden shadow-xl border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 flex flex-col w-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer"
    >
      {/* Banner Cover */}
      <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
        
        {campaign.image_url && !imgError ? (
          <img
            src={campaign.image_url}
            alt={campaign.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-zinc-600 relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-25" />
            <Sparkles className="w-10 h-10 text-indigo-500/30 mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500/50">
              Affiliate Program
            </span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isSaas ? (
            <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none shadow-md text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
              SaaS Subscription
            </Badge>
          ) : (
            <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 shadow-md text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
              Product-Based
            </Badge>
          )}

          {campaign.application_status === "active" && (
            <Badge className="bg-emerald-500/95 text-white border-none shadow-md text-[9px] uppercase font-black tracking-wider px-2 py-0.5 flex items-center gap-1">
              Active Partner
            </Badge>
          )}
          {campaign.application_status === "applied" && (
            <Badge className="bg-yellow-500/95 text-black border-none shadow-md text-[9px] uppercase font-black tracking-wider px-2 py-0.5 flex items-center gap-1">
              Applied (Reviewing)
            </Badge>
          )}
          {campaign.application_status === "rejected" && (
            <Badge className="bg-red-500/95 text-white border-none shadow-md text-[9px] uppercase font-black tracking-wider px-2 py-0.5 flex items-center gap-1">
              Rejected
            </Badge>
          )}
        </div>

        {/* Date / Timer badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-zinc-300 font-bold flex items-center gap-1.5 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
      </div>

      {/* Details Area */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-bold text-white text-lg leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors" title={campaign.name}>
            {campaign.name}
          </h3>
          <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
            {campaign.description || "Refer custom subscribers and earn commissions on successful conversions."}
          </p>
        </div>

        {/* Commission Box */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
            <Coins className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Commission Structure</span>
            <span className="font-extrabold text-xs text-indigo-400 truncate block mt-0.5" title={renderCommissionLabel()}>
              {renderCommissionLabel()}
            </span>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="pt-2 border-t border-zinc-800/50 flex gap-2">
          {campaign.application_status === "active" ? (
            <Button
              onClick={handleCopyLink}
              className={`w-full font-bold text-xs h-9 rounded-xl transition ${
                copied 
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white animate-in zoom-in duration-100" 
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 animate-in zoom-in duration-200" />
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
              className="w-full bg-zinc-800 text-zinc-500 font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-zinc-700/35"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Applied (Pending Approval)
            </Button>
          ) : campaign.application_status === "rejected" ? (
            <Button
              disabled
              className="w-full bg-zinc-800 text-red-500/60 font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-zinc-750"
            >
              Application Rejected
            </Button>
          ) : (
            <Button
              disabled={joiningId === campaign.id}
              onClick={handleJoinClick}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
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
