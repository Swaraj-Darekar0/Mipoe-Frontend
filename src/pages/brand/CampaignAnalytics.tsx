import React, { useState, useEffect, useCallback,useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {Upload, ImageOff, Undo} from "lucide-react";

// Update import paths to point to frontend/src
import BrandLayout from "../../layouts/BrandLayout";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
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
  updateCampaignStatus,
  updateCampaignViewThreshold,
  updateCampaignDeadline,
  updateCampaignImage, // ADD THIS
  uploadCampaignImage,
  deleteCampaignImage, // ADD THIS
  getWalletBalance, 
  allocateBudget, 
  reclaimBudget,
  Campaign
} from "../../lib/api";
import { Wallet, ArrowDownUp } from "lucide-react";
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
  const [viewThresholdInput, setViewThresholdInput] = useState<number>(0);
  const [deadlineInput, setDeadlineInput] = useState<string>("");
  const [showAllClips, setShowAllClips] = useState<boolean>(false);
  const [showAllCreators, setShowAllCreators] = useState<boolean>(false);
const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchCampaignData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const id = parseInt(campaignId);
      const data = await fetchCampaignById(id);
      setCampaign(data);
      setIsActive(data.is_active);
      setBudget(data.budget);
      setRequirements(data.requirements || "");
      setViewThresholdInput(data.view_threshold);
      setDeadlineInput(data.deadline.split('T')[0]);
      
      // ADD THIS LINE to load existing image
      setImagePreview(data.image_url || null); 
      const walletData = await getWalletBalance();
      setWalletBalance(walletData.balance);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
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
      await allocateBudget(campaign.id, allocationAmount);
      
      // Update local state to reflect changes instantly (Optimistic UI)
      setWalletBalance(prev => prev - allocationAmount);
      setCampaign(prev => prev ? ({ ...prev, funds_allocated: (prev.funds_allocated || 0) + allocationAmount }) : null);
      
      alert(`Successfully allocated ₹${allocationAmount}`);
      setAllocationAmount(0);
    } catch (err: any) {
      alert(`Allocation Failed: ${err.message}`);
    } finally {
      setIsProcessingFund(false);
    }
  };

const handleReclaim = async () => {
    if (!campaign || allocationAmount <= 0) return;
    setIsProcessingFund(true);
    try {
      await reclaimBudget(campaign.id, allocationAmount);
      
      // Update local state
      setWalletBalance(prev => prev + allocationAmount);
      setCampaign(prev => prev ? ({ ...prev, funds_allocated: (prev.funds_allocated || 0) - allocationAmount }) : null);
      
      alert(`Successfully reclaimed ₹${allocationAmount}`);
      setAllocationAmount(0);
    } catch (err: any) {
      alert(`Reclaim Failed: ${err.message}`);
    } finally {
      setIsProcessingFund(false);
    }
  };
  
  const formatViews = (views: number): string => {
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

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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

  const handleUpdateBudget = async () => {
    if (!campaign) return;
    try {
      await updateCampaignBudget(campaign.id, { budget });
      alert("Budget updated successfully!");
      // fetchCampaignData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to update budget: ${err.message}`);
      } else {
        alert("Failed to update budget: An unknown error occurred");
      }
    }
  };

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

  const calculateExpectedViews = (budget: number, cpv: number, viewThreshold: number) => {
    if (cpv === 0 || viewThreshold === 0) return 0;
    return (budget / cpv) * viewThreshold;
  };


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

  const expectedViews = calculateExpectedViews(campaign.budget, campaign.cpv, campaign.view_threshold);
  
  
  // Use the pre-sorted accepted clips from the backend
  const sortedAcceptedClips = campaign.accepted_clips || [];
  
  // Use the pre-calculated creator rankings from the backend
  const sortedCreators = (campaign.creator_rankings || []).map(creator => ({
    id: creator.creator_id,
    name: creator.creator_name,
    views: creator.total_views,
    clipCount: creator.clip_count
  }));
  
  const displayedCreators = showAllCreators ? sortedCreators : sortedCreators.slice(0, 3);
  const displayedClips = showAllClips ? sortedAcceptedClips : sortedAcceptedClips.slice(0, 3);
  const isLive = campaign ? new Date() < new Date(campaign.deadline) : false;
  return (
    <BrandLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
              {campaign.category && (
                <span className="text-sm text-gray-500">
                  {campaign.category.replace('_', ' / ')}
                </span>
              )}
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

{/* Top "Bento" Grid Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        
       
         {/* 4. Campaign Status */}
        <div className="bg-white rounded shadow p-6 flex flex-col gap-4">
          <label className="font-medium mb-2">Status</label>
          <label className="font-medium flex items-center gap-3 h-full cursor-pointer">
            <Switch checked={isActive} onCheckedChange={handleUpdateStatus} />
            <span className={isActive ? "text-green-600" : "text-gray-500"}>
              {isActive ? "Campaign Active" : "Paused"}
            </span>
          </label>
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
          />
          <Button className="mt-2 w-fit self-end" variant="secondary" size="sm" onClick={handleUpdateViewThreshold}>
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
          />
          <Button className="mt-2 w-fit self-end" variant="secondary" size="sm" onClick={handleUpdateDeadline}>
            Update Deadline
          </Button>
        </div>

      {/* 1. FUND MANAGER (Fluid Layout) */}
        <div className="bg-white rounded shadow p-6 h-full flex flex-col justify-between gap-4 relative overflow-hidden md:col-span-2">
          
          {/* ZONE 1: Header (Fixed Top) */}
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

          {/* ZONE 2: Gray Stats Box (The "Spring" - Expands to fill height) */}
          <div className="bg-gray-50 p-4 rounded border border-gray-100 flex-1 flex flex-col justify-center gap-2 min-h-[100px]">
              <div>
                <p className="text-xs text-gray-500 mb-1">Funds Locked in Campaign</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-bold text-gray-800 tracking-tight">
                     ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                   </p>
                   {/* Removed the "/ Budget" text since 'budget' is now just a target, not a limit */}
                </div>
              </div>
            </div>
            
            {/* ZONE 3: Controls */}
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-xs font-medium text-gray-600">Move Funds (₹)</label>
              
              {isLive && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-1 border border-amber-100">
                  🔒 Reclaiming is disabled while campaign is live (until {new Date(campaign?.deadline).toLocaleDateString()}).
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
                  />
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  {/* Allocate Button (Always allowed if you have wallet balance) */}
                  <Button 
                    size="sm" 
                    onClick={handleAllocate} 
                    disabled={isProcessingFund || allocationAmount > walletBalance}
                    className="bg-blue-600 hover:bg-blue-700 px-4"
                  >
                    Allocate Funds
                  </Button>
                  
                  {/* Reclaim Button (LOCKED if isLive) */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleReclaim}
                    disabled={isProcessingFund || isLive || allocationAmount > (campaign?.funds_allocated || 0)}
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
        <div className="bg-white rounded shadow p-6 md:col-span-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-medium">Update Campaign Cover</label>
            {/* Visual feedback when a new file is selected but not saved */}
            {imageFile && (
              <span className="text-xs text-blue-600 font-medium animate-pulse">
                Preview Mode - Unsaved Changes
              </span>
            )}
          </div>

          {/* The "Simulator" - Matches Campaign View Exactly */}
          <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200 group">
            {imagePreview && !imgError ? (
              <>
                <img
                  src={imagePreview}
                  alt="Campaign Preview"
                  loading="lazy"
                  referrerPolicy="no-referrer" // Critical for Supabase images to load correctly
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-105 duration-500"
                />
                {/* Visual Helper Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium">
                    This is how your card will appear to creators
                  </p>
                </div>
              </>
            ) : (
              // The Fallback (Clean, branded placeholder)
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageOff size={48} className="mb-3 opacity-50" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  No Image Available
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Upload a 16:9 image for best results
                </span>
              </div>
            )}
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm cursor-pointer"
              />
              <p className="text-[10px] text-gray-400 mt-1 pl-1">
                Recommended: 1280x720 (WebP/JPG)
              </p>
            </div>
            
            {/* Only show Save button if a new file is selected */}
            {imageFile && (
             <div className="flex gap-2">
                {/* REVERT BUTTON */}
                <Button
                  size="sm"
                  variant="outline" // Ghost/Outline style to de-emphasize
                  onClick={handleRevertImage}
                  className="px-3 text-gray-600 border-gray-300 hover:bg-gray-100"
                  title="Discard changes"
                >
                  <Undo size={14} className="mr-1" /> Revert
                </Button>

                {/* SAVE BUTTON */}
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
        </div>

        {/* 6. Requirements (MOVED: Now Spans 3 Columns / Full Row) */}
        <div className="bg-white rounded shadow p-6 flex flex-col gap-3 md:col-span-3">
          <label className="font-medium mb-2">Update Campaign Requirements</label>
          <Textarea
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            rows={4}
            className="resize-y"
          />
          <Button className="mt-2 w-fit self-end" size="sm" onClick={handleUpdateRequirements}>
            Update Requirements
          </Button>
        </div>
      </div>

      {/* Metrics Section - Second Bento Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded shadow p-6">
          <div className="text-gray-400 text-xs">Total Eyeballs Gained</div>
          <div className="text-2xl font-bold">{campaign.total_view_count.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-gray-400 text-xs mb-1">Cost per {campaign.view_threshold.toLocaleString()} Eyeballs</div>
          <div className="flex gap-3 items-end">
            <span className="text-lg font-semibold text-gray-700">₹{campaign.cpv.toFixed(2)}</span>
            
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

      {/* Accepted Clip URLs Section */}
      <div className="bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Accepted Clips</h3>
          {sortedAcceptedClips.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllClips(!showAllClips)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showAllClips ? 'Show Less' : `View All (${sortedAcceptedClips.length})`}
            </Button>
          )}
        </div>
        {displayedClips.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {displayedClips.map((clip, index) => (
                <div 
                  key={index} 
                  className="p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <a 
                      href={clip.clip_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex-1 truncate mr-4"
                      title={clip.clip_url}
                    >
                      {clip.clip_url.split('/').pop() || 'View Clip'}
                    </a>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        {clip.view_count?.toLocaleString() || 0} eyeballs
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No accepted clips for this campaign yet.</p>
        )}
      </div>
      </div>
    </BrandLayout>
  );
};

export default CampaignAnalytics;
