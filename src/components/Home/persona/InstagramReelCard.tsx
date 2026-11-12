import React, { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music,
  MoreHorizontal,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface InstagramReelCardProps {
  username?: string;
  avatarUrl?: string;
  timeAgo?: string;
  audioTrack?: string;
  videoSrc?: string;
  posterSrc?: string;
  caption?: string;
  hashtags?: string[];
  likesCount?: number | string;
  commentsCount?: number | string;
  sharesCount?: number | string;
  savesCount?: number | string;
  verifiedReach?: string;
  payoutBadge?: string;
  isCompact?: boolean;
}

/**
 * Authentic Light-Mode Instagram Reel / Post Component
 * Faithfully mirrors the reference image layout in crisp light mode:
 * - Header: Avatar, Username, Verified checkmark, time elapsed, audio track row, more options
 * - Center: High-definition vertical 4:5 media frame with speaker toggle
 * - Action Bar: Heart (Like count), Comment bubble, Send/Share, Bookmark ribbon
 * - Caption: Bold username + authentic UGC caption + hashtags
 * - Optional Sellr Settlement chip
 */
export const InstagramReelCard: React.FC<InstagramReelCardProps> = ({
  username = "varenform",
  avatarUrl,
  timeAgo = "1w",
  audioTrack = "Whitney Houston • Call You Tonight",
  videoSrc = "/REFER.mp4",
  posterSrc = "/refer_poster.jpg",
  caption = "The cleanest wireless audio drop this year",
  hashtags = ["#ootd", "#fit", "#mensstyle", "#sellr"],
  likesCount = 174,
  commentsCount = 2,
  sharesCount = 3,
  savesCount = 20,
  verifiedReach = "420K VIEWS ✓",
  payoutBadge = "₹16,800 Credited ⚡",
  isCompact = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const displayLikes = typeof likesCount === "number" ? likesCount + (isLiked ? 1 : 0) : likesCount;
  const displaySaves = typeof savesCount === "number" ? savesCount + (isSaved ? 1 : 0) : savesCount;

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div
      className={`w-full min-w-0 rounded-[1.25rem] sm:rounded-2xl bg-white border border-black/10 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.08)] select-none overflow-hidden transition-all ${
        isCompact ? "p-2 sm:p-2.5" : "p-2.5 sm:p-3"
      }`}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Creator Avatar with subtle gradient ring */}
          <div className="relative shrink-0">
            <div className="size-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shadow-xs">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono font-bold text-[10px] text-charcoal">
                    {username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Username & Audio Track Subtitle */}
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-[11px] sm:text-[11.5px] text-charcoal tracking-tight truncate">
                {username}
              </span>
              {/* Blue Verified Checkmark */}
              <CheckCircle2 className="w-2.5 h-2.5 text-sky-500 fill-sky-500 shrink-0" />
              <span className="text-[10px] text-charcoal/40 shrink-0 font-normal">
                • {timeAgo}
              </span>
            </div>

            {/* Audio Track Attribution */}
            <div className="flex items-center gap-1 text-[9px] text-charcoal/60 min-w-0 mt-0.5">
              <Music className="w-2 h-2 shrink-0 text-charcoal/50" />
              <span className="truncate font-medium">{audioTrack}</span>
            </div>
          </div>
        </div>

        {/* Options Button */}
        <button
          type="button"
          className="p-0.5 text-charcoal/50 hover:text-charcoal transition-colors cursor-pointer"
          aria-label="More options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Media Frame (Vertical Reel / Video) */}
      <div
        className={`relative w-full rounded-xl overflow-hidden bg-neutral-900 border border-black/5 shadow-inner ${
          isCompact ? "h-[160px] sm:h-[175px]" : "h-[175px] sm:h-[190px]"
        }`}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Subtle cinematic gradient overlay for readable badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none" />

        {/* Top-Right Reach Verification Pill */}
        {verifiedReach && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[8px] font-mono text-emerald-400 font-bold border border-white/10 shadow-xs flex items-center gap-1">
            <Sparkles className="w-2 h-2 text-emerald-400" />
            <span>{verifiedReach}</span>
          </div>
        )}

        {/* Top-Left Authentic Tag */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[7.5px] font-mono font-bold text-charcoal shadow-xs">
          Reel
        </div>

        {/* Bottom-Right Mute / Audio Toggle Button */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          className="absolute bottom-1.5 right-1.5 size-5 rounded-full bg-black/65 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
        >
          {isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* 3. Action Bar (Heart, Comment, Send, Bookmark) */}
      <div className="pt-1.5 pb-0.5 flex items-center justify-between text-charcoal">
        <div className="flex items-center gap-2.5">
          {/* Like Button */}
          <button
            type="button"
            onClick={toggleLike}
            className="flex items-center gap-1 transition-transform active:scale-90 cursor-pointer"
            aria-label="Like post"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isLiked ? "text-rose-500 fill-rose-500" : "text-charcoal hover:text-rose-500"
              }`}
            />
            <span className="text-[10px] font-mono font-semibold text-charcoal tracking-tight tabular-nums">
              {displayLikes}
            </span>
          </button>

          {/* Comment Button */}
          <div className="flex items-center gap-1 text-charcoal/90">
            <MessageCircle className="w-3.5 h-3.5 text-charcoal" />
            <span className="text-[10px] font-mono font-semibold text-charcoal tracking-tight tabular-nums">
              {commentsCount}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex items-center gap-1 text-charcoal/90">
            <Send className="w-3 h-3 text-charcoal" />
            <span className="text-[10px] font-mono font-semibold text-charcoal tracking-tight tabular-nums">
              {sharesCount}
            </span>
          </div>
        </div>

        {/* Bookmark / Save Ribbon with count */}
        <button
          type="button"
          onClick={toggleSave}
          className="flex items-center gap-1 transition-transform active:scale-90 cursor-pointer"
          aria-label="Save post"
        >
          <Bookmark
            className={`w-3.5 h-3.5 transition-colors ${
              isSaved ? "text-amber-500 fill-amber-500" : "text-charcoal hover:text-amber-500"
            }`}
          />
          <span className="text-[10px] font-mono font-semibold text-charcoal tracking-tight tabular-nums">
            {displaySaves}
          </span>
        </button>
      </div>

      {/* 4. Caption & Hashtag Row */}
      <div className="pt-0.5 text-[10px] sm:text-[10.5px] leading-tight text-charcoal min-w-0">
        <span className="font-bold text-charcoal mr-1">{username}</span>
        <span className="text-charcoal/90 line-clamp-1">{caption}</span>
        {hashtags && hashtags.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1 text-[9.5px] text-sky-600 font-medium line-clamp-1 overflow-hidden">
            {hashtags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. Sellr Settlement Bottom Pill */}
      {payoutBadge && (
        <div className="mt-1.5 pt-1 border-t border-black/5 flex items-center justify-between text-[9px] font-mono min-w-0">
          <span className="text-charcoal/60 truncate">Monetization Verified</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-500/20 shadow-2xs shrink-0 ml-1">
            {payoutBadge}
          </span>
        </div>
      )}
    </div>
  );
};
