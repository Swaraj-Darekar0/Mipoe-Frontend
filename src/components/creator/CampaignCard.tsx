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
  brand_id?: number;
  submitted?: boolean;
  hideStatusActions?: boolean;
  image_url?: string; // Added image support
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
}) => {
  const [imgError, setImgError] = useState(false);

  // Math Logic
  const views = total_view_count;
  const paid = 0; // Placeholder for now
  const target = budget - budget * 0.05; // 95% utilization target
  const payoutPercent = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;

  // Helper for large numbers (e.g. 1.5k, 1.2M)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      className="group bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800 flex flex-col w-full sm:w-[350px] "
    >
      {/* --- SECTION 1: THE HOOK (Visual Header) --- */}
      <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
        
        {/* 1. The Image */}
        {image_url && !imgError ? (
          <img
            src={image_url}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          // Fallback: Dark Aesthetic Gradient
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center text-zinc-600">
            <ImageOff size={32} className="mb-2 opacity-20" />
            <span className="text-[10px] font-medium uppercase tracking-widest opacity-40">
              {name.substring(0, 2)}
            </span>
          </div>
        )}

        {/* 2. Floating Overlay: Platform Icon (Top Right) */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white/10">
          {platform === "Instagram" ? (
            <Instagram size={16} className="text-pink-500" />
          ) : platform === "YouTube" ? (
            <Youtube size={16} className="text-red-500" />
          ) : (
            <span className="text-[10px] font-bold text-white px-1">{platform[0]}</span>
          )}
        </div>

        {/* 3. Floating Overlay: Status Badge (Top Left) */}
        {!hideStatusActions && submitted && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-none shadow-md backdrop-blur-sm text-[10px] px-2 py-0.5">
              Applied
            </Badge>
          </div>
        )}
        
        {/* 4. Gradient protection for text legibility (bottom) */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
      </div>


      {/* --- SECTION 2: THE DETAILS (Data Body) --- */}
      <div className="p-4 flex flex-col gap-3">
        
        {/* Row 1: Identity & Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-white text-lg leading-tight line-clamp-1" title={name}>
            {name}
          </h3>
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 border-blue-500/30 whitespace-nowrap">
            ₹{cpv} / 1K
          </Badge>
        </div>

        {/* Row 2: Utilization Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium text-zinc-400">
            <span>Budget Used</span>
            <span>{payoutPercent}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${payoutPercent}%` }}
            />
          </div>
        </div>

        {/* Row 3: Key Logistics (Grid) */}
        <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-zinc-800/50">
          
          {/* Metric 1: Budget */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Wallet size={10} /> Budget
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {formatNumber(budget)}
            </span>
          </div>

          {/* Metric 2: Views */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Eye size={10} /> Views
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {formatNumber(views)}
            </span>
          </div>

          {/* Metric 3: Deadline */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Clock size={10} /> Ends
            </span>
            <span className="text-sm font-medium text-zinc-200 truncate">
              {new Date(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CampaignCard;