import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  Trash2, 
  ImageOff, 
  Link as LinkIcon, 
  Loader2, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft,
  LogIn,
  ShieldCheck
} from "lucide-react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/PortalPrimitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  fetchCampaignById,
  fetchCreatorClipsForCampaign,
  deleteClip,
  submitClip,
  Campaign,
  ClipData,
  fetchCreatorProfile,
  CreatorProfile,
  getUserId,
  checkAuthStatus,
} from "@/lib/api";

// Extract media code from various Instagram Reels URL formats
const extractInstagramMediaCode = (url: string): string | null => {
  url = url.trim().replace(/\/$/, "");
  const pattern1 = /instagram\.com\/reels\/([A-Za-z0-9_-]+)/;
  const match1 = url.match(pattern1);
  if (match1) return match1[1];

  const pattern2 = /instagram\.com\/p\/([A-Za-z0-9_-]+)/;
  const match2 = url.match(pattern2);
  if (match2) return match2[1];

  if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
};

const convertToStandardFormat = (mediaCode: string): string => {
  return `https://www.instagram.com/reels/${mediaCode}`;
};

// Check if creator's follower count meets the campaign range requirement
const checkFollowerRangeMatch = (followers: number, rangeStr: string): boolean => {
  if (!rangeStr) return true;

  const cleanedRange = rangeStr.replace(/,/g, "").trim();

  if (cleanedRange.endsWith("+")) {
    const val = parseInt(cleanedRange.slice(0, -1).trim(), 10);
    return !isNaN(val) && followers >= val;
  }

  const parts = cleanedRange.split("-");
  if (parts.length === 2) {
    const minVal = parseInt(parts[0].trim(), 10);
    const maxVal = parseInt(parts[1].trim(), 10);
    return !isNaN(minVal) && !isNaN(maxVal) && followers >= minVal && followers <= maxVal;
  }

  return false;
};

const CampaignView = () => {
  const { campaign_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(() => getUserId());
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [imgError, setImgError] = useState(false);
  const [submittedClips, setSubmittedClips] = useState<ClipData[]>([]);
  const [acceptedClips, setAcceptedClips] = useState<ClipData[]>([]);
  const [rejectedClips, setRejectedClips] = useState<ClipData[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const [confirmDeleteClip, setConfirmDeleteClip] = useState<{ id: number; isAccepted: boolean } | null>(null);

  // Submit modal state
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [clipUrlInput, setClipUrlInput] = useState("");
  const [submittingClip, setSubmittingClip] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sync auth state if authenticated via cookies/session
  useEffect(() => {
    let isMounted = true;
    const verifyUser = async () => {
      const currentId = getUserId();
      if (currentId) {
        if (isMounted) setUserId(currentId);
        return;
      }
      try {
        const res = await checkAuthStatus();
        if (isMounted && res.authenticated && res.user_id) {
          setUserId(res.user_id);
        }
      } catch {
        // Guest mode
      }
    };
    verifyUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCampaignAndClips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const userId = getUserId();

      if (!userId) {
        const campaignData = await fetchCampaignById(Number(campaign_id));
        setCampaign(campaignData);
        setSubmittedClips([]);
        setAcceptedClips([]);
        setRejectedClips([]);
        return;
      }

      const [camp, clips, profile] = await Promise.allSettled([
        fetchCampaignById(Number(campaign_id)),
        fetchCreatorClipsForCampaign(Number(campaign_id)),
        fetchCreatorProfile(),
      ]);

      if (camp.status === "rejected") {
        throw new Error(`Failed to load campaign: ${camp.reason.message}`);
      }

      const campaignData = camp.value;
      let processedClips: ClipData[] = [];
      if (clips.status === "fulfilled" && Array.isArray(clips.value)) {
        processedClips = clips.value.map((clip: ClipData) => ({
          ...clip,
          view_count: clip.view_count ?? 0,
        }));
      }

      if (profile.status === "fulfilled") {
        setCreatorProfile(profile.value);
      }

      setCampaign(campaignData);
      setSubmittedClips(
        processedClips.filter((c) => c.status === "in_review"),
      );
      setAcceptedClips(processedClips.filter((c) => c.status === "accepted"));
      setRejectedClips(processedClips.filter((c) => c.status === "rejected"));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Failed to load campaign data: ${err.message}`
          : "An unknown error occurred while loading campaign data",
      );
    } finally {
      setLoading(false);
    }
  }, [campaign_id]);

  useEffect(() => {
    fetchCampaignAndClips();
  }, [fetchCampaignAndClips]);

  const refreshClips = useCallback(async () => {
    try {
      const clips = await fetchCreatorClipsForCampaign(Number(campaign_id));
      const processedClips = clips.map((clip) => ({
        ...clip,
        view_count: clip.view_count ?? 0,
      }));
      setSubmittedClips(
        processedClips.filter((c) => c.status === "in_review"),
      );
      setAcceptedClips(processedClips.filter((c) => c.status === "accepted"));
      setRejectedClips(processedClips.filter((c) => c.status === "rejected"));
    } catch (err) {
      console.error("Error refreshing clips:", err);
    }
  }, [campaign_id]);

  const handleDeleteClip = useCallback((clipId: number, isAccepted: boolean = false) => {
    setConfirmDeleteClip({ id: clipId, isAccepted });
  }, []);

  const executeDeleteClip = useCallback(async () => {
    if (!confirmDeleteClip) return;
    const { id: clipId } = confirmDeleteClip;
    setConfirmDeleteClip(null);
    try {
      setDeletingClipId(clipId);
      await deleteClip(clipId);
      toast({
        title: "Clip Deleted",
        description: "Your clip submission has been deleted.",
      });
      await refreshClips();
    } catch (err: unknown) {
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingClipId(null);
    }
  }, [confirmDeleteClip, refreshClips, toast]);

  const hasInstagram = creatorProfile?.instagram_verified && creatorProfile?.instagram_username;
  const followerCount = creatorProfile?.instagram_follower_count ?? 0;
  
  const qualifies = !campaign || campaign.campaign_type !== "influencer" || 
    !campaign.follower_range || 
    (!!hasInstagram && checkFollowerRangeMatch(followerCount, campaign.follower_range));

  const handleOpenSubmitDialog = () => {
    const userId = getUserId();
    if (!userId) {
      const returnUrl = `/creator/dashboard/${campaign_id}?submit=true`;
      navigate(`/login?role=creator&redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setSubmitError("");
    setClipUrlInput("");
    setIsSubmitDialogOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("submit") === "true") {
      const userId = getUserId();
      if (!userId) {
        const returnUrl = `/creator/dashboard/${campaign_id}?submit=true`;
        navigate(`/login?role=creator&redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      if (qualifies) {
        setIsSubmitDialogOpen(true);
      }
    }
  }, [searchParams, qualifies, campaign_id, navigate]);

  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!campaign_id) {
      setSubmitError("Campaign ID missing.");
      return;
    }

    if (campaign?.campaign_type === "influencer" && campaign.follower_range) {
      if (!hasInstagram) {
        setSubmitError("Please link and verify your Instagram account first to participate in influencer campaigns.");
        return;
      }
      if (!checkFollowerRangeMatch(followerCount, campaign.follower_range)) {
        setSubmitError(
          `Your linked Instagram follower count (${followerCount.toLocaleString()}) does not meet the campaign requirement (${campaign.follower_range} followers).`
        );
        return;
      }
    }

    const mediaCode = extractInstagramMediaCode(clipUrlInput);
    if (!mediaCode) {
      setSubmitError("Please enter a valid Instagram Reels link or media code.");
      return;
    }

    const standardizedUrl = convertToStandardFormat(mediaCode);
    setSubmittingClip(true);

    try {
      await submitClip({
        campaign_id: Number(campaign_id),
        clip_url: standardizedUrl,
      });
      toast({
        title: "Clip Submitted Successfully!",
        description: "Your clip has been queued for verification.",
      });
      setClipUrlInput("");
      setIsSubmitDialogOpen(false);
      await refreshClips();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit clip. Please try again.");
    } finally {
      setSubmittingClip(false);
    }
  };

  if (loading) {
    const spinner = (
      <div className="flex items-center justify-center h-72 rounded-2xl border border-black/10 bg-white">
        <div className="text-slate font-mono text-xs uppercase tracking-wider flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-lava" />
          Loading Brief...
        </div>
      </div>
    );
    if (!userId) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col">
          <header className="h-16 border-b border-black/10 bg-white px-4 flex items-center justify-between">
            <Link to="/" className="font-display text-2xl font-bold text-ink">
              sellr<span className="text-lava">.</span>
            </Link>
          </header>
          <div className="flex-1 flex items-center justify-center px-4">
            {spinner}
          </div>
        </div>
      );
    }
    return (
      <CreatorLayout>
        {spinner}
      </CreatorLayout>
    );
  }

  if (error || !campaign) {
    const errorCard = (
      <div className="p-8 text-center bg-rose-50 border border-rose-500/25 rounded-2xl max-w-lg mx-auto mt-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-rose-800 font-semibold text-sm">{error || "Campaign not found."}</p>
        <Button variant="ink" size="sm" onClick={() => navigate(userId ? "/creator/dashboard" : "/creator/campaigns")} className="mt-4">
          {userId ? "Back to Hub" : "Back to Marketplace"}
        </Button>
      </div>
    );
    if (!userId) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col">
          <header className="h-16 border-b border-black/10 bg-white px-4 flex items-center justify-between">
            <Link to="/" className="font-display text-2xl font-bold text-ink">
              sellr<span className="text-lava">.</span>
            </Link>
          </header>
          <div className="flex-1 px-4">
            {errorCard}
          </div>
        </div>
      );
    }
    return (
      <CreatorLayout>
        {errorCard}
      </CreatorLayout>
    );
  }

  const totalBudget = campaign.budget || 0;
  const fundsDistributed = campaign.funds_distributed || 0;
  const payoutPercent =
    totalBudget > 0
      ? Math.min(Math.round((fundsDistributed / totalBudget) * 100), 100)
      : 0;

  const defaultRequirements = [
    "Don't use artificial view bots or automation",
    "Don't portray the brand or product in a negative light",
    "Adhere strictly to all community and platform guidelines",
  ];
  const campaignRequirements = campaign.requirements
    ? campaign.requirements.split("\n").filter((req) => req.trim() !== "")
    : defaultRequirements;

  const formatCategory = (category: string): string => {
    if (category === "promotional") return "Promotional (YouTube, Gaming, Business)";
    if (!category) return "General";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" / ");
  };

  const allClips = [...acceptedClips, ...submittedClips];

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatViews = (views?: number | null) => {
    if (views == null) return null;
    if (views >= 1_000_000) {
      return `${(views / 1_000_000).toFixed(1)}M Views`;
    }
    if (views >= 1_000) {
      return `${(views / 1_000).toFixed(1)}K Views`;
    }
    return `${views.toLocaleString()} Views`;
  };

  const campaignContent = (
    <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Media & Campaign Info */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Banner Cover */}
            <div className="w-full aspect-video sm:aspect-[21/9] bg-black/[0.03] border border-black/10 overflow-hidden relative rounded-2xl">
              {campaign.image_url && !imgError ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.name}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-steel gap-2 text-xs font-mono uppercase tracking-wider">
                  <ImageOff size={32} className="text-black/20" />
                  <span>No Campaign Banner</span>
                </div>
              )}
            </div>

            {/* Campaign Header Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight flex-1 min-w-[200px]">
                  {campaign.name}
                </h1>
                <div className="flex gap-2 flex-wrap items-center">
                  {campaign.campaign_type && (
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border ${
                      campaign.campaign_type === 'clipping' 
                        ? 'border-lava/25 text-lava bg-lava/10' 
                        : 'border-black/10 text-ink bg-black/[0.04]'
                    }`}>
                      {campaign.campaign_type === 'clipping' ? 'Clipping' : 'Influencer'}
                    </span>
                  )}
                  {campaign.category && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-black/10 bg-black/[0.03] text-slate text-xs font-medium">
                      {formatCategory(campaign.category)}
                    </span>
                  )}
                  {campaign.campaign_type === 'influencer' && campaign.follower_range && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-black/10 bg-black/[0.04] text-ink font-mono text-[11px] font-bold">
                      Req: {campaign.follower_range}
                    </span>
                  )}
                </div>
              </div>

              {campaign.asset_link ? (
                <a
                  href={campaign.asset_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-lava hover:underline"
                >
                  <span>Download campaign asset materials</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            {/* Description Card */}
            {campaign.description && (
              <Card className="p-5 sm:p-6 space-y-2">
                <h2 className="font-display text-sm sm:text-base font-bold text-ink">
                  Campaign Description
                </h2>
                <p className="text-xs sm:text-sm text-slate whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </p>
              </Card>
            )}

            {/* Requirements Card */}
            <Card className="p-5 sm:p-6 space-y-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ink">
                Participation Guidelines & Requirements
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate">
                {campaignRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-lava mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
                {campaign.hashtag && (
                  <li className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-steel font-semibold">Mandatory Hashtag:</span>
                    <span className="px-2 py-0.5 rounded-md bg-lava/10 text-lava border border-lava/25 font-bold">
                      {campaign.hashtag}
                    </span>
                  </li>
                )}
                {campaign.audio && (
                  <li className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="text-steel font-semibold">Required Audio:</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/[0.04] text-ink border border-black/10 font-bold break-all">
                      {campaign.audio}
                    </span>
                  </li>
                )}
              </ul>
            </Card>

            {/* Your Submissions List Card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-ink">
                    Your Submissions ({allClips.length})
                  </h2>
                  <p className="text-xs text-slate">Clips submitted for this campaign.</p>
                </div>
                {allClips.length > 0 && qualifies && (
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={handleOpenSubmitDialog}
                    className="h-8 text-xs"
                  >
                    Submit Another Clip
                  </Button>
                )}
              </div>

              {allClips.length === 0 ? (
                <div className="py-10 text-center text-steel text-xs">
                  <Send className="w-8 h-8 text-black/20 mx-auto mb-2" />
                  <p className="font-display font-bold text-ink text-sm">No clips submitted yet</p>
                  <p className="text-slate mt-1 max-w-sm mx-auto">
                    {!userId
                      ? "Sign in with Google to view your submission history and track live view counts."
                      : "Submit your first Instagram Reel link to begin tracking views."}
                  </p>
                  {!userId && (
                    <Button
                      onClick={handleOpenSubmitDialog}
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1.5 text-lava" />
                      Sign In to Submit
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {allClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-4 rounded-xl border border-black/10 bg-black/[0.02] hover:bg-black/[0.04] transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-ink hover:text-lava text-sm inline-flex items-center gap-1.5 max-w-full transition-colors duration-150"
                        >
                          <span className="truncate block min-w-0 max-w-full sm:max-w-sm">{clip.clip_url}</span>
                          <LinkIcon className="h-3 w-3 shrink-0 text-steel" />
                        </a>
                        <div className="flex items-center gap-3 text-xs text-slate font-mono">
                          {clip.submitted_at && (
                            <span>{formatDate(clip.submitted_at)}</span>
                          )}
                          {formatViews(clip.view_count) && (
                            <span className="font-bold text-ink tabular-nums">{formatViews(clip.view_count)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                        <Badge
                          className={
                            clip.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-500/25 text-xs font-semibold shadow-none"
                              : "bg-amber-50 text-amber-800 border border-amber-500/25 text-xs font-semibold shadow-none"
                          }
                        >
                          {clip.status === "accepted" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1 text-amber-600" />
                          )}
                          {clip.status === "accepted" ? "Accepted" : "In Review"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClip(clip.id, clip.status === "accepted")}
                          disabled={deletingClipId === clip.id}
                          className="h-8 w-8 text-steel hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Delete clip submission"
                        >
                          {deletingClipId === clip.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Rejected Clips / Revision Section */}
            {rejectedClips.length > 0 && (
              <Card className="bg-rose-50/50 border-rose-500/25 p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-rose-900">
                  Clips Needing Revision ({rejectedClips.length})
                </h2>
                <div className="space-y-3">
                  {rejectedClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="border border-rose-500/25 bg-white p-4 rounded-xl flex flex-col gap-2.5"
                    >
                      <a
                        href={clip.clip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-700 font-semibold text-sm break-all hover:underline"
                      >
                        {clip.clip_url}
                      </a>
                      {clip.feedback && (
                        <div className="text-xs text-slate bg-rose-50 p-2.5 rounded-lg border border-rose-500/20">
                          <strong className="text-rose-800">Feedback:</strong> {clip.feedback}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClip(clip.id)}
                          disabled={deletingClipId === clip.id}
                          className="text-xs font-semibold text-rose-700 hover:bg-rose-50 h-8"
                        >
                          {deletingClipId === clip.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
                          Remove Clip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Right Column: Campaign Budget, CPV & Action Sidebar */}
          <div className="lg:col-span-4">
            <Card className="p-5 sm:p-6 flex flex-col gap-5 lg:sticky lg:top-6">
              
              {/* Primary Action Button */}
              <div className="space-y-2">
                {!userId ? (
                  <Button
                    variant="creator"
                    onClick={handleOpenSubmitDialog}
                    className="w-full py-3 h-11 font-bold text-sm"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span>Sign in to Submit Clip</span>
                  </Button>
                ) : (
                  <Button
                    variant={qualifies ? "creator" : "outline"}
                    onClick={handleOpenSubmitDialog}
                    disabled={!qualifies}
                    className="w-full py-3 h-11 font-bold text-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {qualifies ? "Submit Clip" : "Locked (Requirement)"}
                  </Button>
                )}
                {!userId ? (
                  <p className="text-[11px] text-slate text-center leading-normal">
                    Sign in with Google to submit your Reel link and claim earnings.
                  </p>
                ) : !qualifies && (
                  <div className="space-y-1.5 text-center">
                    <p className="text-[11px] text-rose-700 leading-normal">
                      {!hasInstagram 
                        ? "Requires verified Instagram profile connection." 
                        : `Requires ${campaign.follower_range} followers (Your account: ${followerCount.toLocaleString()}).`}
                    </p>
                    {!hasInstagram && (
                      <Link
                        to="/creator/profile"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-lava hover:underline"
                      >
                        Connect Instagram in Profile &rarr;
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-black/10 w-full" />

              {/* Metrics Breakdown */}
              <div className="space-y-4 text-xs">
                <div className="rounded-xl bg-black/[0.03] border border-black/[0.06] p-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-steel font-bold block mb-1">
                    Total Budget Pool
                  </span>
                  <span className="font-mono text-2xl font-bold text-ink tabular-nums block">
                    ₹{campaign.budget.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/[0.03] border border-black/[0.06] p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-steel font-bold block mb-1">
                      CPV (1k Views)
                    </span>
                    <span className="font-mono text-base font-bold text-ink tabular-nums block">
                      ₹{campaign.cpv}
                    </span>
                  </div>
                  <div className="rounded-xl bg-black/[0.03] border border-black/[0.06] p-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-steel font-bold block mb-1">
                      Deadline
                    </span>
                    <span className="font-semibold text-xs text-ink block mt-0.5">
                      {campaign.deadline ? formatDate(campaign.deadline) : "Ongoing"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-steel uppercase tracking-wider">Payout Progress</span>
                    <span className="text-ink tabular-nums">{payoutPercent}%</span>
                  </div>
                  <Progress className="h-2 bg-black/[0.06]" value={payoutPercent} />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate pt-0.5">
                    <span>Paid Out</span>
                    <span className="font-bold text-ink tabular-nums">
                      ₹{fundsDistributed.toLocaleString()} / ₹{totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </Card>
          </div>

        </div>
      </div>
    );

    const submitDialog = (
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-black/10 p-6 text-ink">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-ink">
              Submit Campaign Clip
            </DialogTitle>
            <DialogDescription className="text-xs text-slate mt-1">
              Paste the public link of your published Instagram Reel for "{campaign.name}".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitClip} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="clip-url" className="text-xs font-semibold text-ink">
                Instagram Reel URL
              </Label>
              <Input
                id="clip-url"
                type="url"
                placeholder="https://www.instagram.com/reels/..."
                value={clipUrlInput}
                onChange={(e) => {
                  setClipUrlInput(e.target.value);
                  setSubmitError("");
                }}
                required
                className="bg-black/[0.02] border-black/10 focus:bg-white text-ink rounded-xl text-sm h-11"
              />
              <p className="text-[11px] text-steel">
                Ensure your Instagram profile is public and the video meets all campaign guidelines.
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-500/25 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="bg-black/[0.03] border border-black/[0.06] rounded-xl p-3.5 space-y-1.5 text-xs text-slate">
              <p className="font-bold text-ink text-[11px] uppercase tracking-wider font-mono">Submission Checklist</p>
              <p className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Includes required hashtag: {campaign.hashtag || "#sellr"}</span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Reel is publicly accessible</span>
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="submit"
                variant="creator"
                disabled={submittingClip || !clipUrlInput.trim()}
                className="flex-1 text-xs h-11"
              >
                {submittingClip ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying & Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirm & Submit Clip
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitDialogOpen(false)}
                disabled={submittingClip}
                className="h-11 text-xs px-4"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );

    const deleteConfirmModal = (
      <ConfirmDialog
        open={!!confirmDeleteClip}
        onOpenChange={(open) => !open && setConfirmDeleteClip(null)}
        title={confirmDeleteClip?.isAccepted ? "Delete Accepted Clip?" : "Delete Clip Submission?"}
        description="This clip URL will be removed from tracking for this campaign. Pending views will no longer be counted."
        confirmLabel="Delete Clip"
        variant="destructive"
        onConfirm={executeDeleteClip}
      />
    );

    if (!userId) {
      return (
        <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-ink selection:text-white">
          <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-black/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <Link to="/" className="flex items-center gap-1 shrink-0">
                  <span className="font-display text-2xl font-bold tracking-tight text-ink">
                    sellr<span className="text-lava">.</span>
                  </span>
                </Link>
                <div className="h-4 w-px bg-black/10 shrink-0" />
                <button
                  onClick={() => navigate("/creator/campaigns")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-ink transition-colors duration-150 cursor-pointer truncate"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Back to Marketplace</span>
                  <span className="sm:hidden">Marketplace</span>
                </button>
              </div>

              <div className="flex items-center shrink-0">
                <Link
                  to={`/login?role=creator&redirect=${encodeURIComponent(`/creator/dashboard/${campaign_id}?submit=true`)}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lava hover:bg-lava-hover text-white font-semibold text-xs sm:text-sm transition-colors duration-150 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign in</span>
                  <span className="hidden sm:inline">to Earn</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {campaignContent}
          </main>

          <aside className="bg-white text-ink py-6 border-t border-black/10 mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 font-mono text-[11px] font-bold text-lava uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Ready to submit your content?
                </div>
                <p className="text-sm text-slate">
                  Sign in with Google to submit Reel links, track verified view milestones, and claim daily UPI earnings.
                </p>
              </div>

              <Link
                to={`/login?role=creator&redirect=${encodeURIComponent(`/creator/dashboard/${campaign_id}?submit=true`)}`}
                className="px-5 py-2.5 rounded-xl bg-ink hover:bg-charcoal text-white font-semibold text-sm transition-colors duration-150 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Connect with Google to Submit</span>
              </Link>
            </div>
          </aside>

          {submitDialog}
          {deleteConfirmModal}
        </div>
      );
    }

    return (
      <CreatorLayout>
        {campaignContent}
        {submitDialog}
        {deleteConfirmModal}
      </CreatorLayout>
    );
};

export default CampaignView;