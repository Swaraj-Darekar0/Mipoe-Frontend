import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Trash2, ImageOff, Link as LinkIcon, Loader2, Sparkles, Send, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [imgError, setImgError] = useState(false);
  const [submittedClips, setSubmittedClips] = useState<ClipData[]>([]);
  const [acceptedClips, setAcceptedClips] = useState<ClipData[]>([]);
  const [rejectedClips, setRejectedClips] = useState<ClipData[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);

  // Submit modal state
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [clipUrlInput, setClipUrlInput] = useState("");
  const [submittingClip, setSubmittingClip] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchCampaignAndClips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [camp, clips, profile] = await Promise.allSettled([
        fetchCampaignById(Number(campaign_id)),
        fetchCreatorClipsForCampaign(Number(campaign_id)),
        fetchCreatorProfile(),
      ]);

      if (camp.status === "rejected") {
        throw new Error(`Failed to load campaign: ${camp.reason.message}`);
      }
      if (clips.status === "rejected") {
        throw new Error(`Failed to load clips: ${clips.reason.message}`);
      }

      const campaignData = camp.value;
      const clipsData = clips.value;
      const processedClips = clipsData.map((clip: ClipData) => ({
        ...clip,
        view_count: clip.view_count ?? 0,
      }));

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

  const handleDeleteClip = useCallback(
    async (clipId: number, isAccepted: boolean = false) => {
      if (
        !window.confirm(
          isAccepted ? "Delete this accepted clip?" : "Delete this clip submission?",
        )
      )
        return;
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
    },
    [refreshClips, toast],
  );

  const hasInstagram = creatorProfile?.instagram_verified && creatorProfile?.instagram_username;
  const followerCount = creatorProfile?.instagram_follower_count ?? 0;
  
  const qualifies = !campaign || campaign.campaign_type !== "influencer" || 
    !campaign.follower_range || 
    (!!hasInstagram && checkFollowerRangeMatch(followerCount, campaign.follower_range));

  useEffect(() => {
    if (searchParams.get("submit") === "true" && qualifies) {
      setIsSubmitDialogOpen(true);
    }
  }, [searchParams, qualifies]);

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
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-72">
          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </CreatorLayout>
    );
  }

  if (error || !campaign) {
    return (
      <CreatorLayout>
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto mt-12">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-rose-800 font-semibold text-sm">{error || "Campaign not found."}</p>
          <Button onClick={() => navigate("/creator/dashboard")} className="mt-4 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
            Back to Hub
          </Button>
        </div>
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

  return (
    <CreatorLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Media & Campaign Info */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Banner Cover */}
            <div className="w-full aspect-video sm:aspect-[21/9] bg-zinc-100 border border-zinc-200/80 overflow-hidden relative rounded-2xl shadow-xs">
              {campaign.image_url && !imgError ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.name}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 text-xs uppercase tracking-wider">
                  <ImageOff size={32} className="text-zinc-300" />
                  <span>No Campaign Banner</span>
                </div>
              )}
            </div>

            {/* Campaign Header Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-tight flex-1 min-w-[200px]">
                  {campaign.name}
                </h1>
                <div className="flex gap-2 flex-wrap items-center">
                  {campaign.campaign_type && (
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      campaign.campaign_type === 'clipping' 
                        ? 'border-purple-200 text-purple-700 bg-purple-50' 
                        : 'border-pink-200 text-pink-700 bg-pink-50'
                    }`}>
                      {campaign.campaign_type === 'clipping' ? 'Clipping' : 'Influencer'}
                    </span>
                  )}
                  {campaign.category && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs font-semibold">
                      {formatCategory(campaign.category)}
                    </span>
                  )}
                  {campaign.campaign_type === 'influencer' && campaign.follower_range && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  <span>Download campaign asset materials</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            {/* Description Card */}
            {campaign.description && (
              <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-2">
                <h2 className="font-display text-sm sm:text-base font-bold text-zinc-900">
                  Campaign Description
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.description}
                </p>
              </Card>
            )}

            {/* Requirements Card */}
            <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-zinc-900">
                Participation Guidelines & Requirements
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-700">
                {campaignRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
                {campaign.hashtag && (
                  <li className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-zinc-400 font-semibold">Mandatory Hashtag:</span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                      {campaign.hashtag}
                    </span>
                  </li>
                )}
                {campaign.audio && (
                  <li className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-zinc-400 font-semibold">Required Audio:</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                      {campaign.audio}
                    </span>
                  </li>
                )}
              </ul>
            </Card>

            {/* Your Submissions List Card */}
            <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-900">
                    Your Submissions ({allClips.length})
                  </h2>
                  <p className="text-xs text-zinc-500">Clips submitted for this campaign.</p>
                </div>
                {allClips.length > 0 && qualifies && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSubmitError("");
                      setClipUrlInput("");
                      setIsSubmitDialogOpen(true);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl h-8 shadow-xs"
                  >
                    Submit Another Clip
                  </Button>
                )}
              </div>

              {allClips.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 text-xs">
                  <Send className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="font-semibold text-zinc-700 text-sm">No clips submitted yet</p>
                  <p className="text-zinc-400 mt-1">Submit your first Instagram Reel link to begin tracking views.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-zinc-900 hover:text-orange-600 text-sm break-all inline-flex items-center gap-1"
                        >
                          <span className="truncate max-w-sm">{clip.clip_url}</span>
                          <LinkIcon className="h-3 w-3 shrink-0 text-zinc-400" />
                        </a>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                          {clip.submitted_at && (
                            <span>{formatDate(clip.submitted_at)}</span>
                          )}
                          {formatViews(clip.view_count) && (
                            <span className="font-bold text-zinc-800">{formatViews(clip.view_count)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                        <Badge
                          className={
                            clip.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-none"
                              : "bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold shadow-none"
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
                          className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
              <Card className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="font-display text-base font-bold text-rose-900">
                  Clips Needing Revision ({rejectedClips.length})
                </h2>
                <div className="space-y-3">
                  {rejectedClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="border border-rose-200 bg-white p-4 rounded-xl flex flex-col gap-2.5 shadow-xs"
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
                        <div className="text-xs text-zinc-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                          <strong className="text-rose-800">Feedback:</strong> {clip.feedback}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClip(clip.id)}
                          disabled={deletingClipId === clip.id}
                          className="text-xs font-semibold text-rose-600 hover:bg-rose-50 h-8"
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
            <Card className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-6 sticky top-6">
              
              {/* Primary Action Button */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setSubmitError("");
                    setClipUrlInput("");
                    setIsSubmitDialogOpen(true);
                  }}
                  disabled={!qualifies}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xs ${
                    qualifies 
                      ? "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer active:scale-98" 
                      : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {qualifies ? "Submit Clip" : "Locked (Requirement)"}
                </Button>
                {!qualifies && (
                  <p className="text-[11px] text-rose-600 text-center leading-normal">
                    {!hasInstagram 
                      ? "Requires verified Instagram profile connection." 
                      : `Requires ${campaign.follower_range} followers (Your account: ${followerCount.toLocaleString()}).`}
                  </p>
                )}
              </div>

              <div className="h-px bg-zinc-100 w-full" />

              {/* Metrics Breakdown */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                    Total Budget
                  </span>
                  <span className="font-mono text-2xl font-bold text-zinc-900 block">
                    ₹{campaign.budget.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                      CPV (Per 1k Views)
                    </span>
                    <span className="font-mono text-base font-bold text-zinc-900 block">
                      ₹{campaign.cpv}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                      Deadline
                    </span>
                    <span className="font-semibold text-xs text-zinc-800 block mt-1">
                      {campaign.deadline ? formatDate(campaign.deadline) : "Ongoing"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-zinc-400 uppercase tracking-wider">Payout Progress</span>
                    <span className="text-zinc-900">{payoutPercent}%</span>
                  </div>
                  <Progress className="h-2 bg-zinc-100" value={payoutPercent} />
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-0.5">
                    <span>Paid Out</span>
                    <span className="font-bold text-zinc-800">
                      ₹{fundsDistributed.toLocaleString()} / ₹{totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </Card>
          </div>

        </div>
      </div>

      {/* In-page Submit Clip Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-zinc-200/80 p-6 text-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-zinc-900">
              Submit Campaign Clip
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              Paste the public link of your published Instagram Reel for "{campaign.name}".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitClip} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="clip-url" className="text-xs font-semibold text-zinc-700">
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
                className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 rounded-xl text-sm h-11"
              />
              <p className="text-[11px] text-zinc-400">
                Ensure your Instagram profile is public and the video meets all campaign guidelines.
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-3.5 space-y-1.5 text-xs text-zinc-600">
              <p className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider font-mono">Submission Checklist</p>
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
                disabled={submittingClip || !clipUrlInput.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl h-11 shadow-xs transition-all disabled:opacity-50"
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
                className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl h-11 text-xs font-semibold px-4"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CampaignView;