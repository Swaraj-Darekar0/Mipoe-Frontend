import React from "react";
import { Video, Play, ExternalLink } from "lucide-react";
import { ClipData } from "@/lib/api";

interface ReelPlayFrameProps {
  clip: ClipData | null;
}

export const ReelPlayFrame: React.FC<ReelPlayFrameProps> = ({ clip }) => {
  return (
    <div className="lg:col-span-1 rounded-2xl bg-white border border-black/10 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between items-center min-h-[440px] w-full min-w-0 text-ink">
      <div className="w-full">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-1">
          01 // VISUAL SOURCE
        </p>
        <div className="flex items-center gap-2 mb-0.5">
          <Video className="w-4 h-4 text-brand-blue shrink-0" />
          <h4 className="font-display text-base font-bold tracking-tight text-ink">
            Reel Visual Frame
          </h4>
        </div>
        <p className="text-xs text-slate mb-5">Clicking play opens source media</p>
      </div>

      {clip ? (
        <a
          href={clip.clip_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-[210px] aspect-[9/16] bg-black/[0.04] border border-black/10 rounded-2xl text-ink overflow-hidden relative group cursor-pointer transition-colors duration-150 hover:border-brand-blue/50 flex flex-col justify-center items-center"
        >
          {clip.clip_thumbnail ? (
            <>
              <img
                src={clip.clip_thumbnail}
                alt="Reel thumbnail preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors duration-150">
                <div className="w-12 h-12 rounded-full bg-white border border-black/10 text-brand-blue flex items-center justify-center transition-colors duration-150 group-hover:bg-brand-blue group-hover:text-white">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-black/[0.04] flex flex-col justify-between items-center text-center p-4">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-black/10 text-slate">
                No Cover Cached
              </span>

              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white border border-black/10 text-brand-blue flex items-center justify-center transition-colors duration-150 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <Video className="w-5 h-5 text-steel" />
              </div>

              <span className="font-mono text-[10px] text-steel leading-snug">
                Wait for scraper update or launch source
              </span>
            </div>
          )}
        </a>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-steel text-center py-8">
          <Play className="w-10 h-10 mb-2 opacity-35" />
          <span className="font-mono text-xs uppercase tracking-wider">Select a clip to view</span>
        </div>
      )}

      <div className="w-full pt-4 mt-4 text-center border-t border-black/[0.06] min-w-0">
        {clip ? (
          <>
            <p className="font-mono text-xs font-bold text-charcoal truncate mb-1.5">
              Creator: {clip.creator_name || `ID #${clip.creator_id}`}
            </p>
            <a
              href={clip.clip_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-blue hover:underline"
            >
              Launch Original Media Link <ExternalLink className="w-3 h-3" />
            </a>
          </>
        ) : (
          <span className="font-mono text-xs text-steel">Waiting for selection...</span>
        )}
      </div>
    </div>
  );
};
