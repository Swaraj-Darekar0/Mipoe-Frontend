import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube, ImageOff, Clock, Eye, Wallet } from "lucide-react";

interface CampaignCardProps {
  id: number;
  name: string;
  platform: string;
  budget: number;
  cpv: number;
  total_view_count?: number;
  hashtag?: string;
  audio?: string;
  deadline: string;
  brand_id?: string;
  campaign_category?: string;
  submitted?: boolean;
  hideStatusActions?: boolean;
  image_url?: string;
  funds_distributed?: number;
  campaign_type?: 'influencer' | 'clipping';
  follower_range?: string;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  id,
  name,
  platform,
  budget,
  cpv,
  total_view_count = 0,
  deadline,
  submitted = false,
  hideStatusActions = false,
  image_url,
  campaign_category,
  funds_distributed = 0,
  campaign_type = 'influencer',
  follower_range,
}) => {
  const [imgError, setImgError] = useState(false);

  const views = total_view_count;
  const totalBudget = budget;
  const amountDistributed = funds_distributed;
  
  const payoutPercent = totalBudget > 0 ? Math.min(Math.round((amountDistributed / totalBudget) * 100), 100) : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-zinc-200/80 hover:border-orange-300 transition-all flex flex-col w-full"
    >
      {/* Visual Header */}
      <div className="relative w-full aspect-video bg-zinc-100 overflow-hidden">
        {image_url && !imgError ? (
          <img
            src={image_url}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col items-center justify-center text-zinc-400">
            <ImageOff size={28} className="mb-1.5 opacity-40 text-orange-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              {name.substring(0, 2)}
            </span>
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-xs border border-zinc-200/80">
          {platform === "Instagram" ? (
            <Instagram size={15} className="text-pink-600" />
          ) : platform === "YouTube" ? (
            <Youtube size={15} className="text-red-600" />
          ) : (
            <span className="text-[10px] font-bold text-zinc-700 px-1">{platform[0]}</span>
          )}
        </div>

        {/* Status & Type Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          {!hideStatusActions && submitted && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-xs backdrop-blur-sm text-[10px] px-2 py-0.5 font-bold">
              Applied
            </Badge>
          )}
          {campaign_type === 'influencer' && follower_range && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200/80 shadow-xs backdrop-blur-sm text-[10px] px-2 py-0.5 font-bold">
              {follower_range}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title & Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display font-bold text-zinc-900 text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors" title={name}>
            {name}
          </h3>
          <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200/80 whitespace-nowrap font-mono font-bold text-xs">
            ₹{cpv} / 1K
          </Badge>
        </div>

        {/* Utilization Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">
            <span>Budget Used</span>
            <span className="text-orange-600">{payoutPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
              style={{ width: `${payoutPercent}%` }}
            />
          </div>
        </div>
            
        {/* Logistics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 mt-0.5 border-t border-zinc-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold flex items-center gap-1">
              <Wallet size={10} className="text-orange-500" /> Budget
            </span>
            <span className="text-xs font-bold text-zinc-800">
              ₹{formatNumber(budget)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold flex items-center gap-1">
              <Eye size={10} className="text-purple-500" /> Views
            </span>
            <span className="text-xs font-bold text-zinc-800">
              {formatNumber(views)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold flex items-center gap-1">
              <Clock size={10} className="text-pink-500" /> Ends
            </span>
            <span className="text-xs font-bold text-zinc-800 truncate">
              {new Date(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;