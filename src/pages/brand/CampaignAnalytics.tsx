import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, ImageOff, Undo, Wallet, BarChart2, ShieldCheck } from "lucide-react";
import { ImageCropInput } from "../../components/ui/ImageCropInput";

// Update import paths to point to frontend/src
import BrandLayout from "../../layouts/BrandLayout";
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
  updateCampaignBudget,
  updateCampaignRequirements,
  updateCampaignDescription,
  updateCampaignStatus,
  updateCampaignViewThreshold,
  updateCampaignDeadline,
  updateCampaignImage, // ADD THIS
  uploadCampaignImage,
  deleteCampaignImage, // ADD THIS
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
  const [imgError, setImgError] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [allocationAmount, setAllocationAmount] = useState<number>(0);
  const [isProcessingFund, setIsProcessingFund] = useState(false);
  const [budget, setBudget] = useState<number>(0);
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

  const fetchCampaignData = useCallback(async () => {
    console.log('=== FETCH CAMPAIGN DATA START ===');
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const id = parseInt(campaignId);
      console.log('Fetching campaign with ID:', id);
      const data = await fetchCampaignById(id);
      console.log('Campaign data fetched:', data);
      console.log('Funds allocated from campaign:', data.funds_allocated);
      
      setCampaign(data);
      setIsActive(data.is_active);
      setBudget(data.budget);
      setRequirements(data.requirements || "");
      setDescription(data.description || "");
      setViewThresholdInput(data.view_threshold ?? 0);
      setDeadlineInput(data.deadline ? data.deadline.split("T")[0] : "");

      // ADD THIS LINE to load existing image
      setImagePreview(data.image_url || null);
      const walletData = await getWalletBalance();
      console.log('Wallet data fetched:', walletData);
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
        console.error('fetchCampaignData error:', err);
        setError(err.message);
      } else {
        console.error('Unknown error in fetchCampaignData:', err);
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
      console.log('=== FETCH CAMPAIGN DATA END ===');
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

const handleAllocate = async () => {
  console.log('=== ALLOCATE DEBUG START ===');
  console.log('Campaign ID:', campaign?.id);
  console.log('Allocation Amount:', allocationAmount);
  console.log('Current Wallet Balance:', walletBalance);
  console.log('Current Campaign Funds Allocated:', campaign?.funds_allocated);
  
  if (!campaign || allocationAmount <= 0) {
    console.log('Allocation cancelled: campaign or amount invalid');
    return;
  }
  
  setIsProcessingFund(true);
  try {
    console.log('Calling allocateBudget API with:', { campaignId: campaign.id, amount: allocationAmount });
    const response = await allocateBudget(campaign.id, allocationAmount);
    
    console.log('API Response:', response);
    console.log('New Wallet Balance from API:', response.new_wallet_balance);
    console.log('New Funds Allocated from API:', response.new_funds_allocated);

    // Use actual returned values from backend
    setWalletBalance(response.new_wallet_balance);
    setCampaign(prev => prev ? ({ ...prev, funds_allocated: response.new_funds_allocated }) : null);
    
    console.log('State updated - Wallet:', response.new_wallet_balance, 'Allocated:', response.new_funds_allocated);

    alert(`Successfully allocated ₹${response.allocated_amount}`);
    setAllocationAmount(0);
  } catch (err: any) {
    console.error('Allocation Error:', err);
    console.error('Error Message:', err.message);
    alert(`Allocation Failed: ${err.message}`);
  } finally {
    setIsProcessingFund(false);
    console.log('=== ALLOCATE DEBUG END ===');
  }
};

const handleReclaim = async () => {
  console.log('=== RECLAIM DEBUG START ===');
  console.log('Campaign ID:', campaign?.id);
  console.log('Reclaim Amount:', allocationAmount);
  console.log('Current Wallet Balance:', walletBalance);
  console.log('Current Campaign Funds Allocated:', campaign?.funds_allocated);
  
  if (!campaign || allocationAmount <= 0) {
    console.log('Reclaim cancelled: campaign or amount invalid');
    return;
  }
  
  setIsProcessingFund(true);
  try {
    console.log('Calling reclaimBudget API with:', { campaignId: campaign.id, amount: allocationAmount });
    const response = await reclaimBudget(campaign.id, allocationAmount);
    
    console.log('API Response:', response);
    console.log('New Wallet Balance from API:', response.new_wallet_balance);
    console.log('New Funds Allocated from API:', response.new_funds_allocated);

    // Use actual returned values from backend
    setWalletBalance(response.new_wallet_balance);
    setCampaign(prev => prev ? ({ ...prev, funds_allocated: response.new_funds_allocated }) : null);
    
    console.log('State updated - Wallet:', response.new_wallet_balance, 'Allocated:', response.new_funds_allocated);

    alert(`Successfully reclaimed ₹${response.reclaimed_amount}`);
    setAllocationAmount(0);
  } catch (err: any) {
    console.error('Reclaim Error:', err);
    console.error('Error Message:', err.message);
    alert(`Reclaim Failed: ${err.message}`);
  } finally {
    setIsProcessingFund(false);
    console.log('=== RECLAIM DEBUG END ===');
  }
};

  const formatViews = (views: number | null | undefined): string => {
    if (views === null || views === undefined || isNaN(views)) {
      return "0";
    }
    if (views < 1000) {
      return views.toString();
    } else if (views < 1000000) {
      // Thousands (K)
      const thousands = views / 1000;
      if (thousands < 10) {
        return `${Math.round(thousands * 10) / 10}K`; // 1 decimal
      }
      return `${Math.round(thousands)}K`; // 0 decimals
    } else if (views < 1000000000) {
      // Millions (M)
      const millions = views / 1000000;
      if (millions < 10) {
        return `${Math.round(millions * 10) / 10}M`; // 1 decimal
      }
      return `${Math.round(millions)}M`; // 0 decimals
    } else {
      // Billions (B)
      const billions = views / 1000000000;
      if (billions < 10) {
        return `${Math.round(billions * 10) / 10}B`; // 1 decimal
      }
      return `${Math.round(billions)}B`; // 0 decimals
    }
  };

  const handleUpdateStatus = async () => {
    if (!campaign) return;
    if (!isActive && (campaign.funds_allocated || 0) <= 0) {
      alert("Cannot activate campaign! Please allocate funds using the Fund Manager first.");
      return; // Stop execution here
    }
    try {
      await updateCampaignStatus(campaign.id, { is_active: !isActive });
      setIsActive(!isActive);
      // Optionally, refetch campaign data to ensure all states are in sync
      // fetchCampaignData();
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

    // Store the old URL to delete later
    const oldImageUrl = campaign.image_url;

    try {
      // 1. Compress & Upload NEW Image (Safe Step)
      const compressed = await compressImage(imageFile);
      const newImageUrl = await uploadCampaignImage(compressed);

      // 2. Update Database Reference
      await updateCampaignImage(campaign.id, { image_url: newImageUrl });

      // 3. Delete OLD Image (Cleanup Step)
      // Only runs if steps 1 & 2 succeeded.
      if (oldImageUrl) {
        await deleteCampaignImage(oldImageUrl);
      }

      // 4. Update Local State
      setCampaign({ ...campaign, image_url: newImageUrl });
      setImagePreview(newImageUrl);
      alert("Campaign image updated successfully!");
      setImageFile(null);

    } catch (err: unknown) {
      console.error(err);
      alert("Failed to update image. Please try again.");
      // Note: If upload failed, old image is still safe in DB.
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ... existing state ...

  // NEW: Reference to the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Handler to revert changes
  const handleRevertImage = () => {
    // 1. Reset local state
    setImageFile(null);
    setImgError(false);

    // 2. Restore original image (or null if none existed)
    setImagePreview(campaign?.image_url || null);

    // 3. Clear the HTML input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // const handleUpdateBudget = async () => {
  //   if (!campaign) return;
  //   try {
  //     await updateCampaignBudget(campaign.id, { budget });
  //     alert("Budget updated successfully!");
  //     // fetchCampaignData();
  //   } catch (err: unknown) {
  //     if (err instanceof Error) {
  //       alert(`Failed to update budget: ${err.message}`);
  //     } else {
  //       alert("Failed to update budget: An unknown error occurred");
  //     }
  //   }
  // };

  const handleUpdateRequirements = async () => {
    if (!campaign) return;
    try {
      await updateCampaignRequirements(campaign.id, { requirements });
      alert("Requirements updated successfully!");
      // fetchCampaignData();
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
      // fetchCampaignData();
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
      // fetchCampaignData();
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
      // fetchCampaignData();
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

  const calculateExpectedViews = (budget: number, cpv: number, viewThreshold: number) => {
    if (cpv === 0 || viewThreshold === 0) return 0;
    return (budget / cpv) * viewThreshold;
  };


  const safeTotalViewCount = campaign?.total_view_count ?? 0;
  const safeViewThreshold = campaign?.view_threshold ?? 0;
  const safeCpv = campaign?.cpv ?? 0;
  const verificationClipCount = clipsData?.all_clips?.length ?? 0;
  const expectedViews = calculateExpectedViews(campaign?.budget ?? 0, safeCpv, safeViewThreshold);
  const getEngagementRate = (clip: { view_count?: number | null; like_count?: number | null; comment_count?: number | null }) => {
    const views = clip.view_count ?? 0;
    if (views <= 0) {
      return 0;
    }
    return (((clip.like_count ?? 0) + (clip.comment_count ?? 0)) / views) * 100;
  };


  // Use the pre-sorted accepted clips from the backend
  const sortedAcceptedClips = React.useMemo(() => {
    const acceptedClips = Array.isArray(campaign?.accepted_clips) ? campaign.accepted_clips : [];
    return [...acceptedClips].sort((a, b) => {
      const engagementDiff = getEngagementRate(b) - getEngagementRate(a);
      if (engagementDiff !== 0) {
        return engagementDiff;
      }

      return (b.view_count ?? 0) - (a.view_count ?? 0);
    });
  }, [campaign?.accepted_clips]);

  // Use the pre-calculated creator rankings from the backend
  const sortedCreators = (campaign?.creator_rankings || []).map(creator => ({
    id: creator.creator_id,
    name: creator.creator_name,
    views: creator.total_views ?? 0,
    clipCount: creator.clip_count
  }));

  const displayedCreators = showAllCreators ? sortedCreators : sortedCreators.slice(0, 3);
  const topPerformingClips = sortedAcceptedClips.slice(0, 3);
  const isLive = campaign?.deadline ? new Date() < new Date(campaign.deadline) : false;

  // Derived metrics for Content Verification
  const avgViews = campaign?.accepted_clips?.length
    ? Math.round(
        campaign.accepted_clips.reduce((sum, clip) => sum + (clip.view_count ?? 0), 0) / campaign.accepted_clips.length
      ) || 1000
    : safeViewThreshold || 1000;

  const selectedClipDeviation = !selectedClip
    ? 100
    : avgViews > 0
    ? ((selectedClip.view_count ?? 0) / avgViews) * 100
    : 100;
  const canModerateSelectedClip = !!selectedClip && selectedClip.status !== "accepted" && selectedClip.status !== "rejected";
  const selectedClipStatusLabel = selectedClip?.status === "accepted"
    ? "Approved"
    : selectedClip?.status === "rejected"
    ? "Rejected"
    : "Pending Review";


  const diagnosticSignal = React.useMemo(() => {
    const dev = selectedClipDeviation;
    if (dev > 115) {
      return {
        status: "🔥 Outperforming",
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        pillClass: "bg-emerald-100 text-emerald-800",
        meaning: "The clip is gaining algorithmic traction fast."
      };
    } else if (dev >= 85) {
      return {
        status: "⚡ On Track",
        colorClass: "text-blue-700 bg-blue-50 border-blue-200",
        pillClass: "bg-blue-100 text-blue-800",
        meaning: "Normal performance; steady organic distribution."
      };
    } else {
      return {
        status: "📉 Underperforming",
        colorClass: "text-rose-700 bg-rose-50 border-rose-200",
        pillClass: "bg-rose-100 text-rose-800",
        meaning: "Weak hook or poor retention; the algorithm is stalling."
      };
    }
  }, [selectedClipDeviation]);

  const chartData = React.useMemo(() => {
    if (!selectedClip) return [];
    const views = selectedClip.view_count || 1000;
    const points = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 7 : 30;
    const data = [];
    
    // Seeded random helper based on clip ID to keep the charts stable when switching tabs/filters
    let seed = (selectedClip.id || 1) * 31;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 1; i <= points; i++) {
      const label = timeFilter === "24h" ? `${i}h` : timeFilter === "7d" ? `Day ${i}` : `Week ${Math.ceil(i / 7.5)}`;
      // Views curve: logarithmic accumulation
      const factor = Math.sin((i / points) * (Math.PI / 2));
      const pointViews = Math.round(views * factor * (0.9 + random() * 0.2));
      const engagementRate = Number((5 + random() * 6 + Math.sin(i) * 1.5).toFixed(1));
      
      data.push({
        name: label,
        Views: pointViews,
        Engagement: engagementRate
      });
    }
    return data;
  }, [selectedClip, timeFilter]);

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-full text-gray-500">
          Loading campaign data...
        </div>
      </BrandLayout>
    );
  }

  if (error) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-full text-red-600">
          Error: {error}
        </div>
      </BrandLayout>
    );
  }

  if (!campaign) {
    return (
      <BrandLayout>
        <div className="flex justify-center items-center h-full text-gray-500">
          No campaign data found.
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="-mx-4 space-y-6 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {/* Approval Banner Notification */}
        {campaign.campaign_approval === "pending_approval" && (
          <div className="bg-amber-50 border border-amber-250 text-amber-800 px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-sm">
            <Clock className="w-5 h-5 animate-pulse text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Campaign Pending Approval</p>
              <p className="text-xs text-amber-700 mt-0.5">This campaign is currently being reviewed by the admin panel. Editing and budget controls are temporarily locked.</p>
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
              <p className="text-xs text-red-650 mt-1.5">Please create a new campaign correcting these details.</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 items-center">
              <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
              <div className="flex gap-2 items-center flex-wrap">
                {campaign.campaign_type && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${
                    campaign.campaign_type === 'clipping'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-pink-500 text-pink-600 bg-pink-50'
                  }`}>
                    {campaign.campaign_type === 'clipping' ? 'Clipping' : 'Influencer'}
                  </span>
                )}
                {campaign.campaign_type === 'influencer' && campaign.follower_range && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-blue-500 text-blue-600 bg-blue-50 rounded">
                    Req: {campaign.follower_range} followers
                  </span>
                )}
                {campaign.category && (
                  <span className="text-sm text-gray-500">
                    {campaign.category.replace('_', ' / ')}
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-400">Campaign ID: {campaign.id}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/brand/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Dashboard
          </Button>
        </div>

        {/* Sidebar + Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-4 self-start shadow-sm flex flex-col gap-2">
            <div className="px-2 py-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Campaign Tabs</span>
            </div>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === "statistics"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition ${
                activeTab === "verification"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                Content Verification
              </div>
              {verificationClipCount > 0 ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'verification' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {verificationClipCount}
                </span>
              ) : null}
            </button>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 min-w-0">
            {activeTab === "statistics" ? (
              <div className="space-y-6">
                {/* Top "Bento" Grid Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">

                  {/* 4. Campaign Status */}
                  <div className="bg-white rounded shadow p-6 flex flex-col gap-4">
                    <label className="font-medium mb-2">Status</label>
                    <label className="font-medium flex items-center gap-3 h-full cursor-pointer">
                      <Switch
                        checked={isActive}
                        onCheckedChange={handleUpdateStatus}
                        disabled={(!isActive && (campaign?.funds_allocated || 0) <= 0) || campaign.campaign_approval !== "approved"}
                      />
                      <span className={isActive ? "text-green-600" : "text-gray-500"}>
                        {isActive ? "Campaign Active" : "Paused"}
                      </span>
                    </label>

                    {/* Helper Text */}
                    {!isActive && (campaign?.funds_allocated || 0) <= 0 && (
                      <span className="text-xs text-red-500">
                        Allocate funds to activate.
                      </span>
                    )}
                  </div>

                  {/* 2. Update View Threshold */}
                  <div className="bg-white rounded shadow p-6 flex flex-col gap-3">
                    <label className="font-medium mb-2">Update View Threshold</label>
                    <Input
                      type="number"
                      value={viewThresholdInput}
                      onChange={e => setViewThresholdInput(Number(e.target.value))}
                      min="0"
                      className="w-full max-w-[180px]"
                      disabled={campaign.campaign_approval !== "approved"}
                    />
                    <Button className="mt-2 w-fit self-end" variant="secondary" size="sm" onClick={handleUpdateViewThreshold} disabled={campaign.campaign_approval !== "approved"}>
                      Update Threshold
                    </Button>
                  </div>

                  {/* 3. Update Deadline */}
                  <div className="bg-white rounded shadow p-6 flex flex-col gap-3">
                    <label className="font-medium mb-2">Update Deadline</label>
                    <Input
                      type="date"
                      value={deadlineInput}
                      onChange={e => setDeadlineInput(e.target.value)}
                      className="w-full max-w-[180px]"
                      disabled={campaign.campaign_approval !== "approved"}
                    />
                    <Button className="mt-2 w-fit self-end" variant="secondary" size="sm" onClick={handleUpdateDeadline} disabled={campaign.campaign_approval !== "approved"}>
                      Update Deadline
                    </Button>
                  </div>

                  {/* 1. FUND MANAGER (Fluid Layout) */}
                  <div className="bg-white rounded shadow p-6 h-full flex flex-col justify-between gap-4 relative overflow-hidden md:col-span-1">
                    <div className="flex justify-between items-start shrink-0">
                      <h3 className="font-medium text-gray-700 flex items-center gap-2">
                        <Wallet size={18} className="text-blue-600" />
                        Fund Manager
                      </h3>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Wallet Balance</p>
                        <p className="font-bold text-green-600">₹{walletBalance.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded border border-gray-100 flex-1 flex flex-col justify-center gap-2 min-h-[100px]">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Funds Locked in Campaign</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-bold text-gray-800 tracking-tight">
                            ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <label className="text-xs font-medium text-gray-600">Move Funds (₹)</label>

                      {isLive && (campaign.funds_allocated || 0) > 0 && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-1 border border-amber-100">
                          🔒 Reclaiming is disabled while campaign is live (until {new Date(campaign.deadline).toLocaleDateString()}).
                        </div>
                      )}

                      <div className="flex flex-wrap items-stretch gap-2">
                        <div className="flex-grow min-w-[120px]">
                          <Input
                            type="number"
                            value={allocationAmount}
                            onChange={e => setAllocationAmount(Number(e.target.value))}
                            min="0"
                            placeholder="0"
                            className="w-full"
                            disabled={campaign.campaign_approval !== "approved"}
                          />
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={handleAllocate}
                            disabled={isProcessingFund || allocationAmount > walletBalance || campaign.campaign_approval !== "approved"}
                            className="bg-blue-600 hover:bg-blue-700 px-4"
                          >
                            Allocate Funds
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReclaim}
                            disabled={isProcessingFund || isLive || allocationAmount > (campaign?.funds_allocated || 0) || campaign.campaign_approval !== "approved"}
                            className={`px-4 ${isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isLive ? "Cannot reclaim funds while campaign is live" : "Return funds to wallet"}
                          >
                            Reclaim Funds
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Update Image (Visual Editor Mode) */}
                  <div className="bg-white rounded shadow p-6 md:col-span-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <label className="font-medium">Update Campaign Cover</label>
                      {imageFile && (
                        <span className="text-xs text-blue-600 font-medium animate-pulse">
                          Preview Mode - Unsaved Changes
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

                    {imageFile && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRevertImage}
                          className="px-3 text-gray-600 border-gray-300 hover:bg-gray-100"
                          title="Discard changes"
                        >
                          <Undo size={14} className="mr-1" /> Revert
                        </Button>

                        <Button
                          size="sm"
                          onClick={handleUpdateImage}
                          disabled={isUploadingImage}
                          className="px-4"
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

                  {/* 6. Requirements */}
                  <div className="bg-white rounded shadow p-6 flex flex-col gap-3 md:col-span-3">
                    <label className="font-medium mb-2">Update Campaign Requirements</label>
                    <Textarea
                      value={requirements}
                      onChange={e => setRequirements(e.target.value)}
                      rows={4}
                      className="resize-y"
                      disabled={campaign.campaign_approval !== "approved"}
                    />
                    <Button className="mt-2 w-fit self-end" size="sm" onClick={handleUpdateRequirements} disabled={campaign.campaign_approval !== "approved"}>
                      Update Requirements
                    </Button>
                  </div>

                  {/* 7. Description */}
                  <div className="bg-white rounded shadow p-6 flex flex-col gap-3 md:col-span-3">
                    <label className="font-medium mb-2">Update Campaign Description</label>
                    <Textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      className="resize-y"
                      disabled={campaign.campaign_approval !== "approved"}
                      placeholder="Enter campaign description..."
                    />
                    <Button className="mt-2 w-fit self-end" size="sm" onClick={handleUpdateDescription} disabled={campaign.campaign_approval !== "approved"}>
                      Update Description
                    </Button>
                  </div>
                </div>

                {/* Metrics Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded shadow p-6">
                    <div className="text-gray-400 text-xs">Total Eyeballs Gained</div>
                    <div className="text-2xl font-bold">{safeTotalViewCount.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded shadow p-6">
                    <div className="text-gray-400 text-xs mb-1">Cost per {safeViewThreshold.toLocaleString()} Eyeballs</div>
                    <div className="flex gap-3 items-end">
                      <span className="text-lg font-semibold text-gray-700">₹{safeCpv.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded shadow p-6">
                    <div className="text-gray-400 text-xs">Expected ROI</div>
                    <div className="text-lg font-bold">{formatViews(expectedViews)} eyeballs</div>
                  </div>
                </div>

                {/* User-Level Performance Table */}
                <div className="bg-white rounded shadow p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">User-Level Performance</h3>
                    {sortedCreators.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllCreators(!showAllCreators)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showAllCreators ? 'Show Less' : `View All (${sortedCreators.length})`}
                      </Button>
                    )}
                  </div>
                  {displayedCreators.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Creator</TableHead>
                          <TableHead className="text-right">Total eyeballs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedCreators.map((creator, index) => (
                          <TableRow key={creator.name}>
                            <TableCell>#{index + 1}</TableCell>
                            <TableCell className="font-medium">{creator.name}</TableCell>
                            <TableCell className="text-right">{creator.views.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500">No creator performance data available yet.</p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Top Performing Clips</h3>
                      <p className="text-sm text-gray-500">Ranked by live engagement rate using likes + comments against views.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Showing top 3 reels
                    </div>
                  </div>

                  {topPerformingClips.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-3">
                      {topPerformingClips.map((clip, index) => {
                        const engagementRate = getEngagementRate(clip);
                        const totalInteractions = (clip.like_count ?? 0) + (clip.comment_count ?? 0);

                        return (
                          <div
                            key={`${clip.id}-${clip.clip_url}`}
                            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Rank #{index + 1}</p>
                                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                  {clip.creator_name || `Creator #${clip.creator_id}`}
                                </p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                {formatViews(clip.view_count ?? 0)} views
                              </span>
                            </div>

                            <a
                              href={clip.clip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 block truncate text-sm font-medium text-blue-600 hover:underline"
                              title={clip.clip_url}
                            >
                              {clip.clip_url}
                            </a>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-slate-200">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Submitted</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {clip.submitted_at
                                    ? new Date(clip.submitted_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                      })
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-slate-200">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Interactions</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{formatViews(totalInteractions)}</p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Engagement Rate</p>
                                <p className="mt-1 text-lg font-bold">{engagementRate.toFixed(2)}%</p>
                              </div>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                  >
                                    View Split
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-64 rounded-2xl border-slate-200 p-4 shadow-xl">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Engagement Distribution</p>
                                  <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                      <span className="text-slate-500">Views</span>
                                      <span className="font-semibold text-slate-900">{formatViews(clip.view_count ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                      <span className="text-slate-500">Likes</span>
                                      <span className="font-semibold text-slate-900">{formatViews(clip.like_count ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                      <span className="text-slate-500">Comments</span>
                                      <span className="font-semibold text-slate-900">{formatViews(clip.comment_count ?? 0)}</span>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No accepted clips for this campaign yet.</p>
                  )}
                </div>
              </div>
            ) : (
              // CONTENT VERIFICATION TAB
              <div className="space-y-6">
                <ClipsListTable
                  clips={clipsData?.all_clips || []}
                  selectedClip={selectedClip}
                  onSelectClip={setSelectedClip}
                  loading={loadingClips}
                />

                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Reel Decision Panel</h3>
                    <p className="text-sm text-gray-500">
                      {selectedClip
                        ? `Selected clip is currently ${selectedClipStatusLabel.toLowerCase()}.`
                        : "Select a reel from the table to approve or reject it."}
                    </p>
                    {selectedClip?.feedback ? (
                      <p className="mt-2 text-xs text-rose-600">Rejection reason: {selectedClip.feedback}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleClipModeration("accepted")}
                      disabled={!canModerateSelectedClip || isUpdatingClipStatus}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isUpdatingClipStatus ? "Processing..." : "Approve Reel"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClipModeration("rejected")}
                      disabled={!canModerateSelectedClip || isUpdatingClipStatus}
                      className="border-rose-300 text-rose-600 hover:bg-rose-50"
                    >
                      Reject Reel
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>
      </div>

    </BrandLayout>
  );
};

export default CampaignAnalytics;
