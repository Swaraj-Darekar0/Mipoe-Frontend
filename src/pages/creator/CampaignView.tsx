import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, ImageOff } from "lucide-react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Progress } from "@/components/ui/progress"
import {
  fetchCampaignById,
  fetchCreatorClipsForCampaign,
  deleteClip,
  Campaign,
  ClipData,
} from "@/lib/api";

const CampaignView = () => {
  const { campaign_id } = useParams();
  const navigate = useNavigate();
  const creator_id = Number(localStorage.getItem("creator_id")) || 1;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [imgError, setImgError] = useState(false);
  const [submittedClips, setSubmittedClips] = useState<ClipData[]>([]);
  const [acceptedClips, setAcceptedClips] = useState<ClipData[]>([]);
  const [rejectedClips, setRejectedClips] = useState<ClipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);

  const fetchCampaignAndClips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [camp, clips] = await Promise.allSettled([
        fetchCampaignById(Number(campaign_id)),
        fetchCreatorClipsForCampaign(Number(campaign_id)),
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
        status: clip.is_deleted_by_admin
          ? "rejected"
          : clip.status || "in_review",
        view_count: clip.view_count ?? 0,
      }));

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
      setLoading(true);
      const clips = await fetchCreatorClipsForCampaign(Number(campaign_id));
      const processedClips = clips.map((clip) => ({
        ...clip,
        status: clip.is_deleted_by_admin
          ? "rejected"
          : clip.status || "in_review",
        view_count: clip.view_count ?? 0,
      }));

      setSubmittedClips(
        processedClips.filter((c) => c.status === "in_review"),
      );
      setAcceptedClips(processedClips.filter((c) => c.status === "accepted"));
      setRejectedClips(processedClips.filter((c) => c.status === "rejected"));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to refresh clips: ${err.message}`
          : "An unknown error occurred while refreshing clips",
      );
    } finally {
      setLoading(false);
    }
  }, [campaign_id]);

  const handleDeleteClip = useCallback(
    async (clipId: number, isAccepted: boolean = false) => {
      if (
        !window.confirm(
          isAccepted ? "Delete this accepted clip?" : "Delete this clip?",
        )
      )
        return;
      try {
        setDeletingClipId(clipId);
        await deleteClip(clipId);
        refreshClips();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setDeletingClipId(null);
      }
    },
    [refreshClips],
  );

  if (loading) {
    return (
      <CreatorLayout>
        <div>Loading...</div>
      </CreatorLayout>
    );
  }

  if (error || !campaign) {
    return (
      <CreatorLayout>
        <div className="text-red-700 text-sm">{error || "Campaign not found."}</div>
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
    "1. Don't use bots",
    "2. Don't portray bad the brand image",
    "3. Adhere to all platform guidelines",
  ];
  const campaignRequirements = campaign.requirements
    ? campaign.requirements.split("\n").filter((req) => req.trim() !== "")
    : defaultRequirements;

  const formatCategory = (category: string): string => {
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
      month: "long",
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
      <div className="bg-fafafa px-4 sm:px-6 md:px-8 py-6 md:py-8 flex justify-center">
        <div className="max-w-5xl w-full flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-stretch">
            <div className="flex-1 flex flex-col gap-5 md:gap-6">
              <div className="w-full aspect-video bg-foreground-100 border border-foreground-200 overflow-hidden relative rounded-lg">
                {campaign.image_url && !imgError ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.name}
                    className="w-full h-full object-cover object-top transition-transform duration-400"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-foreground-400 gap-1.5 text-xs uppercase tracking-wider">
                    <ImageOff size={32} />
                    No Preview
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2.5 md:gap-3">
                <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground-800 leading-tight flex-1 min-w-[160px]">
                    {campaign.name}
                  </h1>
                  {campaign.category && (
                    <span className="inline-flex items-center px-2.5 sm:px-3 py-1 border border-foreground-800 text-[10px] sm:text-xs font-semibold uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                      {formatCategory(campaign.category)}
                    </span>
                  )}
                </div>
                {campaign.asset_link ? (
                  <a
                    href={campaign.asset_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-800 text-[11px] sm:text-xs underline font-medium"
                  >
                    View campaign assets
                  </a>
                ) : null}
              </div>
              <div className="flex flex-col gap-2.5 md:gap-3">
                <h2 className="text-sm sm:text-base font-semibold text-foreground-800">
                  Requirements
                </h2>
                <div className="flex flex-col gap-2 text-xs sm:text-sm text-foreground-700">
                  {campaignRequirements.map((req, index) => (
                    <div key={index}>{req}</div>
                  ))}
                  {campaign.hashtag && (
                    <div>Include hashtag: {campaign.hashtag}</div>
                  )}
                  {campaign.audio && <div>Use audio: {campaign.audio}</div>}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 md:gap-3">
                <h2 className="text-sm sm:text-base font-semibold text-foreground-800">
                  Your Submissions
                </h2>
                <div className="bg-[#0A0A0A] border border-foreground-200 flex flex-col">
                  {allClips.length === 0 ? (
                    <div className="p-4 text-sm text-foreground-500">
                      You have not submitted any clips yet.
                    </div>
                  ) : (
                    allClips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className={`flex justify-between items-center p-4 md:p-5 gap-4 ${index !== allClips.length - 1
                            ? "border-b border-foreground-200"
                            : ""
                          }`}
                      >
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <a
                            href={clip.clip_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground-800 font-semibold text-sm sm:text-base break-words"
                          >
                            {clip.clip_url}
                          </a>
                          <div className="flex gap-3 text-foreground-500 text-[11px] sm:text-xs flex-wrap">
                            {clip.submitted_at && (
                              <span>
                                Submitted: {formatDate(clip.submitted_at)}
                              </span>
                            )}
                            {formatViews(clip.view_count) && (
                              <span>{formatViews(clip.view_count)}</span>
                            )}
                            <span className="font-semibold text-foreground-800 text-xs uppercase tracking-wider">
                              {clip.status === "accepted"
                                ? "Accepted"
                                : "In Review"}
                            </span>
                          </div>
                        </div>
                        <button
                          className={`bg-transparent border-0 text-red-700 cursor-pointer p-0 flex items-center ${deletingClipId === clip.id
                              ? "opacity-50"
                              : "opacity-100"
                            }`}
                          onClick={() =>
                            handleDeleteClip(clip.id, clip.status === "accepted")
                          }
                          disabled={deletingClipId === clip.id}
                          title="Delete clip"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {rejectedClips.length > 0 && (
                <div className="flex flex-col gap-2.5 md:gap-3">
                  <div className="h-px bg-foreground-200 w-full" />
                  <h2 className="text-sm sm:text-base font-semibold text-foreground-800">
                    Clips Needing Revision
                  </h2>
                  <div className="flex flex-col gap-4">
                    {rejectedClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="border border-red-300 bg-red-50 p-4 flex flex-col gap-3"
                      >
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-700 font-semibold text-base break-words"
                        >
                          {clip.clip_url}
                        </a>
                        {clip.feedback && (
                          <div className="text-sm text-red-800">
                            <strong>Feedback:</strong> {clip.feedback}
                          </div>
                        )}
                        <button
                          className={`bg-foreground-800 text-white border-0 px-3 py-2 text-xs sm:text-sm font-semibold cursor-pointer ${deletingClipId === clip.id
                              ? "opacity-60"
                              : "opacity-100"
                            }`}
                          onClick={() => handleDeleteClip(clip.id)}
                          disabled={deletingClipId === clip.id}
                        >
                          {deletingClipId === clip.id
                            ? "Deleting..."
                            : "Delete Clip"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-auto md:flex-shrink-0 md:basis-72 lg:basis-80">
              <div className="bg-[#0A0A0A] border border-foreground-200 p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 w-full">
                <button
                  className="bg-white text-black px-4 py-2 text-center font-semibold text-xs sm:text-sm cursor-pointer tracking-wide"
                  onClick={() => navigate(`/creator/submit/${campaign.id}`)}
                >
                  Submit Clip
                </button>
                <div className="h-px bg-foreground-200 w-full" />
                <div className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm text-foreground-800">
                  <div>
                    <div className="text-foreground-500 text-xs uppercase tracking-wider">
                      Total Budget
                    </div>
                    <div className="font-semibold text-lg">
                      ₹{campaign.budget.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-500 text-xs uppercase tracking-wider">
                      CPV
                    </div>
                    <div className="font-semibold text-base">
                      ₹{campaign.cpv}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-500 text-xs uppercase tracking-wider">
                      Deadline
                    </div>
                    <div className="font-semibold text-sm">
                      {campaign.deadline ? formatDate(campaign.deadline) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-500 text-xs uppercase tracking-wider">
                      Payout Progress
                    </div>
                    <Progress className="h-1.5 sm:h-2" value={payoutPercent} />
                    <div className="text-xs text-foreground-800 mt-1">
                      {payoutPercent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-500 text-xs uppercase tracking-wider">
                      Paid Out
                    </div>
                    <div className="text-sm font-medium">
                      ₹{fundsDistributed.toLocaleString()} / ₹
                      {totalBudget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CampaignView;