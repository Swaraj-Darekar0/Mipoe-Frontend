import React from "react";
import { Video, Play, ExternalLink } from "lucide-react";
import { ClipData } from "@/lib/api";

interface ReelPlayFrameProps {
  clip: ClipData | null;
}

export const ReelPlayFrame: React.FC<ReelPlayFrameProps> = ({ clip }) => {
  return (
    <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between items-center min-h-[460px] w-full">
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1">
          <Video className="w-5 h-5 text-indigo-600" />
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Reel Visual Frame</h4>
        </div>
        <p className="text-xs text-gray-500 mb-6">Clicking play opens source</p>
      </div>

      {clip ? (
        <a
          href={clip.clip_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-[210px] aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative group shadow-md hover:shadow-xl border border-slate-800 cursor-pointer transition-transform duration-300 hover:scale-102 flex flex-col justify-center items-center"
        >
          {clip.clip_thumbnail ? (
            <img
              src={clip.clip_thumbnail}
              alt="Reel thumbnail preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950 flex flex-col justify-center items-center text-center p-4">
              <Video className="w-12 h-12 text-indigo-500 opacity-40 mb-2 animate-pulse" />
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">No Cover Cached</span>
              <span className="text-[9px] text-indigo-400/80 mt-1">Wait for scraper update</span>
            </div>
          )}
          
          {/* Semi-transparent Dark overlay & Play icon */}
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/45 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
              <Play className="w-6 h-6 fill-indigo-600 translate-x-0.5" />
            </div>
          </div>
        </a>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-gray-400 text-center">
          <Play className="w-12 h-12 mb-2 opacity-30" />
          <span className="text-sm font-medium">Select a clip to view</span>
        </div>
      )}

      <div className="w-full pt-6 text-center border-t border-slate-100">
        {clip ? (
          <>
            <p className="text-xs text-slate-500 truncate font-semibold mb-2">Creator: {clip.creator_name || `ID #${clip.creator_id}`}</p>
            <a
              href={clip.clip_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
            >
              Launch Original Media Link <ExternalLink className="w-3 h-3" />
            </a>
          </>
        ) : (
          <span className="text-xs text-slate-400">Waiting for selection...</span>
        )}
      </div>
    </div>
  );
};
