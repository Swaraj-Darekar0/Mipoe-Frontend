import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Undo,
  Wallet,
  BarChart2,
  ShieldCheck,
  Clock,
  XCircle,
  Eye,
  Coins,
  Target,
  Crown,
  Medal,
  Play,
  ExternalLink,
  Sliders,
  FileText
} from "lucide-react";
import { ImageCropInput } from "../../components/ui/ImageCropInput";

// Update import paths to point to frontend/src
import BrandLayout from "../../layouts/BrandLayout";
import CampaignSidebar from "../../components/brand/CampaignSidebar";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { ClipsListTable } from "../../components/brand/ClipsListTable";
import { ReelPlayFrame } from "../../components/brand/ReelPlayFrame";
import { ReelMetricsPanel } from "../../components/brand/ReelMetricsPanel";
import { Textarea } from "../../components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead
} from "../../components/ui/table";

// Import API types and functions
import {
  fetchCampaignById,
  updateCampaignRequirements,
  updateCampaignDescription,
  updateCampaignStatus,
  updateCampaignViewThreshold,
  updateCampaignDeadline,
  updateCampaignImage,
  uploadCampaignImage,
  deleteCampaignImage,
  getWalletBalance,
  allocateBudget,
  reclaimBudget,
  fetchBrandCampaignClips,
  updateBrandCampaignClipStatus,
  Campaign,
  ClipData
} from "../../lib/api";
import { compressImage } from "../../utils/imageCompression";

const CampaignAnalytics = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [isProcessingFund, setIsProcessingFund] = useState(false);
  const [requirements, setRequirements] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [viewThresholdInput, setViewThresholdInput] = useState<number>(0);
  const [deadlineInput, setDeadlineInput] = useState<string>("");
  const [showAllCreators, setShowAllCreators] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Content Verification Dashboard states
  const [activeTab, setActiveTab] = useState<"statistics" | "verification">("statistics");
  const [clipsData, setClipsData] = useState<{
    accepted_clips: ClipData[];
    submitted_clips: ClipData[];
    all_clips: ClipData[];
  } | null>(null);
  const [loadingClips, setLoadingClips] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d">("24h");
  const [isUpdatingClipStatus, setIsUpdatingClipStatus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCampaignData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const id = parseInt(campaignId);
      const data = await fetchCampaignById(id);

      setCampaign(data);
      setIsActive(data.is_active);
      setRequirements(data.requirements || "");
      setDescription(data.description || "");
      setViewThresholdInput(data.view_threshold ?? 0);
      setDeadlineInput(data.deadline ? data.deadline.split("T")[0] : "");
      setImagePreview(data.image_url || null);

      const walletData = await getWalletBalance();
      setWalletBalance(walletData.balance);

      // Load clips for Content Verification
      setLoadingClips(true);
      try {
        const clips = await fetchBrandCampaignClips(id);
        setClipsData(clips);
        if ((clips.all_clips?.length ?? 0) > 0) {
          setSelectedClip(clips.all_clips[0]);
        }
      } catch (clipErr) {
        console.error("Error loading brand clips:", clipErr);
      } finally {
        setLoadingClips(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("fetchCampaignData error:", err);
        setError(err.message);
      } else {
        console.error("Unknown error in fetchCampaignData:", err);
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  const handleAllocate = async () => {
    if (!campaign || allocationAmount <= 0) return;

    setIsProcessingFund(true);
    try {
      const response = await allocateBudget(campaign.id, allocationAmount);
      setWalletBalance(response.new_wallet_balance);
      setCampaign(prev => (prev ? { ...prev, funds_allocated: response.new_funds_allocated } : null));
      alert(`Successfully allocated ₹${response.allocated_amount}`);
      setAllocationAmount(0);
    } catch (err: any) {
      console.error("Allocation Error:", err);
      alert(`Allocation Failed: ${err.message}`);
    } finally {
      setIsProcessingFund(false);
    }
  };

  const handleReclaim = async () => {
    if (!campaign || allocationAmount <= 0) return;

    setIsProcessingFund(true);
    try {
      const response = await reclaimBudget(campaign.id, allocationAmount);
      setWalletBalance(response.new_wallet_balance);
      setCampaign(prev => (prev ? { ...prev, funds_allocated: response.new_funds_allocated } : null));
      alert(`Successfully reclaimed ₹${response.reclaimed_amount}`);
      setAllocationAmount(0);
    } catch (err: any) {
      console.error("Reclaim Error:", err);
      alert(`Reclaim Failed: ${err.message}`);
    } finally {
      setIsProcessingFund(false);
    }
  };

  const formatViews = (views: number | null | undefined): string => {
    if (views === null || views === undefined || isNaN(views)) {
      return "0";
    }
    if (views < 1000) {
      return views.toString();
    } else if (views < 1000000) {
      const thousands = views / 1000;
      if (thousands < 10) {
        return `${Math.round(thousands * 10) / 10}K`;
      }
      return `${Math.round(thousands)}K`;
    } else if (views < 1000000000) {
      const millions = views / 1000000;
      if (millions < 10) {
        return `${Math.round(millions * 10) / 10}M`;
      }
      return `${Math.round(millions)}M`;
    } else {
      const billions = views / 1000000000;
      if (billions < 10) {
        return `${Math.round(billions * 10) / 10}B`;
      }
      return `${Math.round(billions)}B`;
    }
  };

  const handleUpdateStatus = async () => {
    if (!campaign) return;
    if (!isActive && (campaign.funds_allocated || 0) <= 0) {
      alert("Cannot activate campaign! Please allocate funds using the Fund Manager first.");
      return;
    }
    try {
      await updateCampaignStatus(campaign.id, { is_active: !isActive });
      setIsActive(!isActive);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update campaign status: ${err.message}`);
      } else {
        alert("Failed to update campaign status: An unknown error occurred");
      }
    }
  };

  const handleUpdateImage = async () => {
    if (!campaign || !imageFile) return;
    setIsUploadingImage(true);

    const oldImageUrl = campaign.image_url;

    try {
      const compressed = await compressImage(imageFile);
      const newImageUrl = await uploadCampaignImage(compressed);

      await updateCampaignImage(campaign.id, { image_url: newImageUrl });

      if (oldImageUrl) {
        await deleteCampaignImage(oldImageUrl);
      }

      setCampaign({ ...campaign, image_url: newImageUrl });
      setImagePreview(newImageUrl);
      alert("Campaign image updated successfully!");
      setImageFile(null);
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to update image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRevertImage = () => {
    setImageFile(null);
    setImagePreview(campaign?.image_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateRequirements = async () => {
    if (!campaign) return;
    try {
      await updateCampaignRequirements(campaign.id, { requirements });
      alert("Requirements updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update requirements: ${err.message}`);
      } else {
        alert("Failed to update requirements: An unknown error occurred");
      }
    }
  };

  const handleUpdateDescription = async () => {
    if (!campaign) return;
    try {
      await updateCampaignDescription(campaign.id, { description });
      alert("Description updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update description: ${err.message}`);
      } else {
        alert("Failed to update description: An unknown error occurred");
      }
    }
  };

  const handleUpdateViewThreshold = async () => {
    if (!campaign) return;
    try {
      await updateCampaignViewThreshold(campaign.id, { view_threshold: viewThresholdInput });
      alert("View threshold updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update view threshold: ${err.message}`);
      } else {
        alert("Failed to update view threshold: An unknown error occurred");
      }
    }
  };

  const handleUpdateDeadline = async () => {
    if (!campaign) return;
    try {
      await updateCampaignDeadline(campaign.id, { deadline: deadlineInput });
      alert("Deadline updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update deadline: ${err.message}`);
      } else {
        alert("Failed to update deadline: An unknown error occurred");
      }
    }
  };

  const refreshVerificationData = async (id: number) => {
    const [campaignData, clips] = await Promise.all([
      fetchCampaignById(id),
      fetchBrandCampaignClips(id),
    ]);
    setCampaign(campaignData);
    setClipsData(clips);
    if (!selectedClip) {
      setSelectedClip(clips.all_clips[0] ?? null);
      return;
    }

    const updatedSelection =
      clips.all_clips.find((clip) => clip.clip_url === selectedClip.clip_url) ?? null;
    setSelectedClip(updatedSelection ?? clips.all_clips[0] ?? null);
  };

  const handleClipModeration = async (status: "accepted" | "rejected") => {
    if (!campaign || !selectedClip) return;
    if (selectedClip.status === "accepted" || selectedClip.status === "rejected") return;

    let feedback: string | undefined;
    if (status === "rejected") {
      const reason = window.prompt("Enter rejection reason for this reel:", selectedClip.feedback || "");
      if (reason === null) return;
      feedback = reason.trim();
      if (!feedback) {
        alert("Rejection reason is required.");
        return;
      }
    }

    setIsUpdatingClipStatus(true);
    try {
      const response = await updateBrandCampaignClipStatus(campaign.id, selectedClip.id, { status, feedback });
      alert(response.msg);
      await refreshVerificationData(campaign.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update clip status";
      alert(message);
    } finally {
      setIsUpdatingClipStatus(false);
    }
  };

  const calculateExpectedViews = (budgetVal: number, cpv: number, viewThreshold: number) => {
    if (cpv === 0 || viewThreshold === 0) return 0;
    return (budgetVal / cpv) * viewThreshold;
  };

  const safeTotalViewCount = campaign?.total_view_count ?? 0;
  const safeViewThreshold = campaign?.view_threshold ?? 0;
  const safeCpv = campaign?.cpv ?? 0;
  const expectedViews = calculateExpectedViews(campaign?.budget ?? 0, safeCpv, safeViewThreshold);

  const getEngagementRate = (clip: { view_count?: number | null; like_count?: number | null; comment_count?: number | null }) => {
    const views = clip.view_count ?? 0;
    if (views <= 0) return 0;
    return (((clip.like_count ?? 0) + (clip.comment_count ?? 0)) / views) * 100;
  };

  // Pre-sorted accepted clips from the backend
  const sortedAcceptedClips = useMemo(() => {
    const acceptedClips = Array.isArray(campaign?.accepted_clips) ? campaign.accepted_clips : [];
    return [...acceptedClips].sort((a, b) => {
      const engagementDiff = getEngagementRate(b) - getEngagementRate(a);
      if (engagementDiff !== 0) {
        return engagementDiff;
      }
      return (b.view_count ?? 0) - (a.view_count ?? 0);
    });
  }, [campaign?.accepted_clips]);

  // Pre-calculated creator rankings from the backend
  const sortedCreators = useMemo(() => {
    return (campaign?.creator_rankings || []).map(creator => ({
      id: creator.creator_id,
      name: creator.creator_name,
      views: creator.total_views ?? 0,
      clipCount: creator.clip_count
    }));
  }, [campaign?.creator_rankings]);

  const displayedCreators = showAllCreators ? sortedCreators : sortedCreators.slice(0, 3);
  const topPerformingClips = sortedAcceptedClips.slice(0, 3);
  const isLive = campaign?.deadline ? new Date() < new Date(campaign.deadline) : false;

  // Pending clips count for verification badge
  const pendingClipsCount = useMemo(() => {
    if (!clipsData) return 0;
    if (clipsData.submitted_clips && clipsData.submitted_clips.length > 0) {
      return clipsData.submitted_clips.length;
    }
    return (clipsData.all_clips || []).filter(
      (c) => c.status !== "accepted" && c.status !== "rejected" && !c.is_deleted_by_admin
    ).length;
  }, [clipsData]);

  const verificationClipCount = pendingClipsCount;

  // Derived metrics for Content Verification
  const avgViews = campaign?.accepted_clips?.length
    ? Math.round(
        campaign.accepted_clips.reduce((sum, clip) => sum + (clip.view_count ?? 0), 0) / campaign.accepted_clips.length
      ) || 1000
    : safeViewThreshold || 1000;

  const canModerateSelectedClip = !!selectedClip && selectedClip.status !== "accepted" && selectedClip.status !== "rejected";
  const selectedClipStatusLabel = selectedClip?.status === "accepted"
    ? "Approved"
    : selectedClip?.status === "rejected"
    ? "Rejected"
    : "Pending Review";

  // Rank badge styling helper for Top Performing Clips
  const getRankBadgeInfo = (index: number) => {
    switch (index) {
      case 0:
        return {
          label: "Rank #1",
          Icon: Crown,
          badgeStyle: "bg-amber-50 text-amber-800 border-amber-200/80 shadow-xs",
          cardBorder: "border-zinc-200/80 bg-white hover:border-amber-300/70",
          avatarBg: "bg-amber-100 text-amber-800 border border-amber-200",
          accentColor: "text-amber-600",
        };
      case 1:
        return {
          label: "Rank #2",
          Icon: Medal,
          badgeStyle: "bg-slate-100 text-slate-700 border-slate-200/80 shadow-xs",
          cardBorder: "border-zinc-200/80 bg-white hover:border-slate-300",
          avatarBg: "bg-slate-100 text-slate-700 border border-slate-200",
          accentColor: "text-slate-600",
        };
      case 2:
        return {
          label: "Rank #3",
          Icon: Medal,
          badgeStyle: "bg-orange-50 text-orange-800 border-orange-200/80 shadow-xs",
          cardBorder: "border-zinc-200/80 bg-white hover:border-orange-300/70",
          avatarBg: "bg-orange-100 text-orange-800 border border-orange-200",
          accentColor: "text-orange-600",
        };
      default:
        return {
          label: `Rank #${index + 1}`,
          Icon: Medal,
          badgeStyle: "bg-gray-100 text-gray-700 border-gray-200 shadow-xs",
          cardBorder: "border-zinc-200/80 bg-white",
          avatarBg: "bg-gray-100 text-gray-700 border border-gray-200",
          accentColor: "text-gray-600",
        };
    }
  };

  const getEngagementClassification = (rate: number) => {
    if (rate >= 5) {
      return {
        label: "Outperforming",
        pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
        barClass: "bg-emerald-500",
      };
    }
    if (rate >= 2.5) {
      return {
        label: "On Track",
        pillClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotClass: "bg-blue-500",
        barClass: "bg-blue-500",
      };
    }
    return {
      label: "Underperforming",
      pillClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500",
      barClass: "bg-rose-500",
    };
  };

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-96 text-gray-500 font-medium">
          Loading campaign data...
        </div>
      </BrandLayout>
    );
  }

  if (error) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-96 text-red-600 font-medium">
          Error: {error}
        </div>
      </BrandLayout>
    );
  }

  if (!campaign) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-96 text-gray-500 font-medium">
          No campaign data found.
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout
      sidebar={
        <CampaignSidebar
          campaign={campaign}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          verificationCount={verificationClipCount}
        />
      }
    >
      <div className="w-full space-y-6">
        {/* Approval Banner Notification */}
        {campaign.campaign_approval === "pending_approval" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <Clock className="w-5 h-5 animate-pulse text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Campaign Pending Approval</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This campaign is currently being reviewed by the admin panel. Editing and budget controls are temporarily locked.
              </p>
            </div>
          </div>
        )}
        {campaign.campaign_approval === "rejected" && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl flex items-start gap-3 shadow-sm">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Campaign Disapproved / Rejected</p>
              <p className="text-xs text-red-800 mt-1 font-semibold bg-red-100/50 p-2 rounded-lg border border-red-200/40">
                Reason: {campaign.rejection_reason || "Does not comply with platform guidelines."}
              </p>
              <p className="text-xs text-red-600 mt-1.5">Please create a new campaign correcting these details.</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{campaign.name}</h2>
              {campaign.campaign_type && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${
                    campaign.campaign_type === "clipping"
                      ? "border-purple-300 text-purple-700 bg-purple-50"
                      : "border-pink-300 text-pink-700 bg-pink-50"
                  }`}
                >
                  {campaign.campaign_type === "clipping" ? "Clipping" : "Influencer"}
                </span>
              )}
              {campaign.campaign_type === "influencer" && campaign.follower_range && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border border-blue-300 text-blue-700 bg-blue-50 rounded-full">
                  Req: {campaign.follower_range} followers
                </span>
              )}
              {campaign.category && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {campaign.category.replace("_", " / ")}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">Campaign ID: #{campaign.id}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/brand/dashboard")}
            className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-center sm:justify-start rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>

        {activeTab === "statistics" ? (
          <div className="w-full space-y-6">
            {/* 1. Primary KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Eyeballs Gained */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Eyeballs</span>
                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
                  {safeTotalViewCount.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Live verified views gained</p>
              </div>

              {/* Cost per View / CPV */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cost per View</span>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
                  ₹{safeCpv.toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Per {safeViewThreshold.toLocaleString()} eyeballs
                </p>
              </div>

              {/* Funds Locked / Spend */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Funds Locked</span>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
                  ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Wallet: ₹{walletBalance.toLocaleString()}
                </p>
              </div>

              {/* Expected ROI / Projected Eyeballs */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Expected ROI</span>
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
                  {formatViews(expectedViews)}
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Projected eyeballs target</p>
              </div>
            </div>

            {/* 2. Top Performing Clips Section */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Top Performing Clips</h3>
                  <p className="text-xs text-gray-500">Ranked by live engagement rate using likes + comments against views.</p>
                </div>
                <span className="self-start sm:self-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Showing top {topPerformingClips.length} reels
                </span>
              </div>

              {topPerformingClips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topPerformingClips.map((clip, index) => {
                    const rankInfo = getRankBadgeInfo(index);
                    const RankIcon = rankInfo.Icon;
                    const engagementRate = getEngagementRate(clip);
                    const totalInteractions = (clip.like_count ?? 0) + (clip.comment_count ?? 0);
                    const classification = getEngagementClassification(engagementRate);

                    return (
                      <div
                        key={`${clip.id}-${clip.clip_url}`}
                        className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${rankInfo.cardBorder}`}
                      >
                        <div>
                          {/* Rank Header + Views Pill */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${rankInfo.badgeStyle}`}
                            >
                              <RankIcon className="w-3.5 h-3.5" />
                              {rankInfo.label}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              {formatViews(clip.view_count ?? 0)} views
                            </span>
                          </div>

                          {/* Creator Row */}
                          <div className="flex items-center gap-2.5 mb-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${rankInfo.avatarBg}`}
                            >
                              {(clip.creator_name || "C").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                {clip.creator_name || `Creator #${clip.creator_id}`}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {clip.submitted_at
                                  ? `Submitted ${new Date(clip.submitted_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Compact 4-Metric Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Views</p>
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">{formatViews(clip.view_count ?? 0)}</p>
                            </div>
                            <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Likes</p>
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">{formatViews(clip.like_count ?? 0)}</p>
                            </div>
                            <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Comments</p>
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">{formatViews(clip.comment_count ?? 0)}</p>
                            </div>
                            <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Interactions</p>
                              <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">{formatViews(totalInteractions)}</p>
                            </div>
                          </div>

                          {/* Engagement Rate Pill + Visual Meter - ZERO text collision */}
                          <div className="rounded-lg bg-gray-50/90 border border-gray-100 p-2.5 space-y-2 mb-3">
                            {/* Row 1: Label and Value cleanly separated on opposite edges */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Engagement Rate
                              </span>
                              <span className="text-sm font-extrabold text-gray-900">
                                {engagementRate.toFixed(2)}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${classification.barClass}`}
                                style={{ width: `${Math.min(100, Math.max(8, (engagementRate / 10) * 100))}%` }}
                              />
                            </div>

                            {/* Row 2: Status pill and Interaction count */}
                            <div className="flex items-center justify-between pt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${classification.pillClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${classification.dotClass}`} />
                                {classification.label}
                              </span>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                  >
                                    View Split
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-64 rounded-xl border-gray-200 p-4 shadow-xl">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                    Engagement Distribution
                                  </p>
                                  <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                      <span className="text-gray-500">Views</span>
                                      <span className="font-semibold text-gray-900">{formatViews(clip.view_count ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                      <span className="text-gray-500">Likes</span>
                                      <span className="font-semibold text-gray-900">{formatViews(clip.like_count ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                      <span className="text-gray-500">Comments</span>
                                      <span className="font-semibold text-gray-900">{formatViews(clip.comment_count ?? 0)}</span>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>

                        {/* Direct Action Button */}
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-xs group"
                        >
                          <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                          <span>Watch Reel / Source</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors shrink-0" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No accepted clips for this campaign yet.
                </div>
              )}
            </div>

                {/* 3. Fund Management & Campaign Controls (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {/* Card 1: Fund Manager */}
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                            <Wallet className="w-5 h-5 text-blue-600" />
                            Fund Manager
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">Manage budget allocation and wallet balance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Wallet Balance</p>
                          <p className="font-extrabold text-emerald-600 text-base sm:text-lg">₹{walletBalance.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Funds Locked Box */}
                      <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3 sm:p-3.5 mb-3 sm:mb-4">
                        <p className="text-xs text-gray-500 font-medium mb-1">Funds Locked in Campaign</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {isLive && (campaign.funds_allocated || 0) > 0 && (
                        <div className="text-xs text-amber-700 bg-amber-50 p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 border border-amber-200/70 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            🔒 Reclaiming is disabled while campaign is live (until{" "}
                            {new Date(campaign.deadline).toLocaleDateString()}).
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-gray-700 block">Move Funds (₹)</label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          type="number"
                          value={allocationAmount}
                          onChange={e => setAllocationAmount(Number(e.target.value))}
                          min="0"
                          placeholder="0"
                          className="h-9 w-full sm:w-auto sm:flex-1 text-sm"
                          disabled={campaign.campaign_approval !== "approved"}
                        />
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={handleAllocate}
                            disabled={
                              isProcessingFund ||
                              allocationAmount <= 0 ||
                              allocationAmount > walletBalance ||
                              campaign.campaign_approval !== "approved"
                            }
                            className="h-9 bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 flex-1 sm:flex-initial"
                          >
                            Allocate Funds
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReclaim}
                            disabled={
                              isProcessingFund ||
                              isLive ||
                              allocationAmount <= 0 ||
                              allocationAmount > (campaign?.funds_allocated || 0) ||
                              campaign.campaign_approval !== "approved"
                            }
                            className={`h-9 px-3.5 sm:px-4 flex-1 sm:flex-initial ${isLive ? "opacity-50 cursor-not-allowed" : ""}`}
                            title={isLive ? "Cannot reclaim funds while campaign is live" : "Return funds to wallet"}
                          >
                            Reclaim Funds
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Quick Settings */}
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="mb-3 sm:mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                          <Sliders className="w-5 h-5 text-indigo-600" />
                          Quick Settings & Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Campaign activation, view threshold, and timeline</p>
                      </div>

                      {/* Campaign Active Switch */}
                      <div className="flex items-center justify-between p-3 sm:p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 mb-3 sm:mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">Campaign Status</p>
                          <p className="text-xs text-gray-500 truncate sm:whitespace-normal">
                            {isActive ? "Campaign is currently active and receiving submissions" : "Campaign is paused"}
                          </p>
                          {!isActive && (campaign?.funds_allocated || 0) <= 0 && (
                            <p className="text-xs text-red-500 font-medium mt-1">Allocate funds using Fund Manager to activate.</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Switch
                            checked={isActive}
                            onCheckedChange={handleUpdateStatus}
                            disabled={(!isActive && (campaign?.funds_allocated || 0) <= 0) || campaign.campaign_approval !== "approved"}
                          />
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {isActive ? "Active" : "Paused"}
                          </span>
                        </div>
                      </div>

                      {/* Update View Threshold */}
                      <div className="space-y-1.5 mb-3 sm:mb-4">
                        <label className="text-xs font-semibold text-gray-700 block">Update View Threshold</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="number"
                            value={viewThresholdInput}
                            onChange={e => setViewThresholdInput(Number(e.target.value))}
                            min="0"
                            className="h-9 w-full sm:w-auto sm:flex-1 text-sm"
                            disabled={campaign.campaign_approval !== "approved"}
                          />
                          <Button
                            className="h-9 w-full sm:w-auto shrink-0"
                            variant="secondary"
                            size="sm"
                            onClick={handleUpdateViewThreshold}
                            disabled={campaign.campaign_approval !== "approved"}
                          >
                            Update Threshold
                          </Button>
                        </div>
                      </div>

                      {/* Update Deadline */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Update Deadline</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="date"
                            value={deadlineInput}
                            onChange={e => setDeadlineInput(e.target.value)}
                            className="h-9 w-full sm:w-auto sm:flex-1 text-sm"
                            disabled={campaign.campaign_approval !== "approved"}
                          />
                          <Button
                            className="h-9 w-full sm:w-auto shrink-0"
                            variant="secondary"
                            size="sm"
                            onClick={handleUpdateDeadline}
                            disabled={campaign.campaign_approval !== "approved"}
                          >
                            Update Deadline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Campaign Creative & Requirements (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {/* Card 1: Campaign Cover Banner */}
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                            <Upload className="w-5 h-5 text-indigo-600" />
                            Campaign Cover Banner
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">Crop and replace campaign cover (16:9 ratio)</p>
                        </div>
                        {imageFile && (
                          <span className="text-[11px] bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                            Unsaved Changes
                          </span>
                        )}
                      </div>

                      <ImageCropInput
                        value={imagePreview || ""}
                        onChange={(file, previewUrl) => {
                          setImagePreview(previewUrl);
                          setImageFile(file);
                          if (!file && !previewUrl) {
                            setImagePreview(null);
                            setImageFile(null);
                          }
                        }}
                        aspectRatio="16:9"
                        disabled={isUploadingImage || campaign.campaign_approval !== "approved"}
                        placeholder="Drag and drop or click to upload campaign cover banner"
                      />
                    </div>

                    {imageFile && (
                      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRevertImage}
                          className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-100"
                          title="Discard changes"
                        >
                          <Undo size={14} className="mr-1" /> Revert
                        </Button>

                        <Button
                          size="sm"
                          onClick={handleUpdateImage}
                          disabled={isUploadingImage}
                          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {isUploadingImage ? (
                            <span className="flex items-center gap-2">
                              <Upload size={14} className="animate-bounce" /> Saving...
                            </span>
                          ) : (
                            "Save & Publish"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Campaign Requirements & Description */}
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 sm:gap-5">
                    {/* Requirements */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gray-500" />
                          Campaign Requirements
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleUpdateRequirements}
                          disabled={campaign.campaign_approval !== "approved"}
                          className="h-8 text-xs font-medium"
                        >
                          Update Requirements
                        </Button>
                      </div>
                      <Textarea
                        value={requirements}
                        onChange={e => setRequirements(e.target.value)}
                        rows={3}
                        className="resize-y text-sm rounded-lg"
                        disabled={campaign.campaign_approval !== "approved"}
                        placeholder="Specify requirements for creators..."
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gray-500" />
                          Campaign Description
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleUpdateDescription}
                          disabled={campaign.campaign_approval !== "approved"}
                          className="h-8 text-xs font-medium"
                        >
                          Update Description
                        </Button>
                      </div>
                      <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="resize-y text-sm rounded-lg"
                        disabled={campaign.campaign_approval !== "approved"}
                        placeholder="Enter detailed campaign description..."
                      />
                    </div>
                  </div>
                </div>

                {/* 5. User-Level Performance Table */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">User-Level Performance</h3>
                      <p className="text-xs text-gray-500">Breakdown of creator eyeball contributions</p>
                    </div>
                    {sortedCreators.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllCreators(!showAllCreators)}
                        className="text-indigo-600 hover:text-indigo-800 self-start sm:self-auto text-xs font-semibold"
                      >
                        {showAllCreators ? "Show Less" : `View All (${sortedCreators.length})`}
                      </Button>
                    )}
                  </div>

                  {displayedCreators.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                            <TableHead className="w-20 font-semibold text-xs text-gray-600">Rank</TableHead>
                            <TableHead className="font-semibold text-xs text-gray-600">Creator</TableHead>
                            <TableHead className="font-semibold text-xs text-gray-600">Status</TableHead>
                            <TableHead className="text-right font-semibold text-xs text-gray-600">Total Eyeballs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedCreators.map((creator, index) => (
                            <TableRow key={creator.id || creator.name} className="hover:bg-gray-50/50">
                              <TableCell className="font-semibold text-xs text-gray-500">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    index === 0
                                      ? "bg-amber-100 text-amber-800"
                                      : index === 1
                                      ? "bg-slate-100 text-slate-700"
                                      : index === 2
                                      ? "bg-orange-100 text-orange-800"
                                      : "text-gray-600"
                                  }`}
                                >
                                  #{index + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {(creator.name || "C").slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-sm text-gray-900">{creator.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {creator.clipCount > 0 ? `${creator.clipCount} clips` : "Active"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-sm text-gray-800">
                                {creator.views.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No creator performance data available yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* CONTENT VERIFICATION TAB */
              <div className="w-full space-y-6">
                <ClipsListTable
                  clips={clipsData?.all_clips || []}
                  selectedClip={selectedClip}
                  onSelectClip={setSelectedClip}
                  loading={loadingClips}
                />

                <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Reel Decision Panel</h3>
                    <p className="text-sm text-gray-500">
                      {selectedClip
                        ? `Selected clip is currently ${selectedClipStatusLabel.toLowerCase()}.`
                        : "Select a reel from the table to approve or reject it."}
                    </p>
                    {selectedClip?.feedback ? (
                      <p className="mt-2 text-xs text-rose-600 font-semibold">Rejection reason: {selectedClip.feedback}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <Button
                      onClick={() => handleClipModeration("accepted")}
                      disabled={!canModerateSelectedClip || isUpdatingClipStatus}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isUpdatingClipStatus ? "Processing..." : "Approve Reel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClipModeration("rejected")}
                      disabled={!canModerateSelectedClip || isUpdatingClipStatus}
                      className="w-full sm:w-auto border-rose-300 text-rose-600 hover:bg-rose-50"
                    >
                      Reject Reel
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                  <ReelPlayFrame clip={selectedClip} />
                  <ReelMetricsPanel
                    clip={selectedClip}
                    campaignViewThreshold={campaign.view_threshold}
                    avgViews={avgViews}
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                    formatViews={formatViews}
                  />
                </div>
              </div>
            )}
      </div>
    </BrandLayout>
  );
};

export default CampaignAnalytics;
