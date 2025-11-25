import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Instagram, Youtube, Trash2,ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { fetchCampaignById, fetchCreatorClipsForCampaign, deleteClip, Campaign, ClipData } from "@/lib/api";


const CampaignView = () => {
  const { campaign_id } = useParams();
  const navigate = useNavigate();
  // TODO: Replace with actual creator_id from auth context or localStorage
  const creator_id = Number(localStorage.getItem("creator_id")) || 1;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [imgError, setImgError] = useState(false);
  const [submittedClips, setSubmittedClips] = useState<ClipData[]>([]);
  const [acceptedClips, setAcceptedClips] = useState<ClipData[]>([]);
  const [rejectedClips, setRejectedClips] = useState<ClipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingClipId, setDeletingClipId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCampaignAndClips = useCallback(async () => {
    console.log('1. Starting to fetch campaign and clips...');
    try {
      setLoading(true);
      setError("");
      console.log('2. Making API requests...');
      
      const [camp, clips] = await Promise.allSettled([
        fetchCampaignById(Number(campaign_id)),
        fetchCreatorClipsForCampaign(Number(campaign_id))
      ]);
      
      console.log('3. API responses received:', { camp, clips });

      // Handle campaign fetch result
      if (camp.status === 'rejected') {
        console.error('Error fetching campaign:', camp.reason);
        throw new Error(`Failed to load campaign: ${camp.reason.message}`);
      }
      
      // Handle clips fetch result
      if (clips.status === 'rejected') {
        console.error('Error fetching clips:', clips.reason);
        throw new Error(`Failed to load clips: ${clips.reason.message}`);
      }
      
      const campaignData = camp.value;
      const clipsData = clips.value;
      
      console.log('4. Processing clips data...', clipsData);
      
      // Process clips to ensure we have the latest data
      const processedClips = clipsData.map((clip: ClipData, index: number) => {
        const processed = {
          ...clip,
          // Ensure status is properly set based on the data
          status: clip.is_deleted_by_admin ? 'rejected' : (clip.status || 'in_review'),
          view_count: clip.view_count ?? 0 // default view_count to 0 if null/undefined
        };
        console.log(`   Clip ${index + 1}:`, { original: clip, processed });
        return processed;
      });
      
      console.log('5. Updating state with processed data...');
      
      // Update state in a single batch to avoid multiple re-renders
      setCampaign(campaignData);
      setSubmittedClips(processedClips.filter(c => c.status === 'in_review'));
      setAcceptedClips(processedClips.filter(c => c.status === 'accepted'));
      setRejectedClips(processedClips.filter(c => c.status === 'rejected'));
      
      console.log('6. State update complete');
      
    } catch (err: unknown) {
      console.error('Error in fetchCampaignAndClips:', err);
      if (err instanceof Error) {
        setError(`Failed to load campaign data: ${err.message}`);
      } else {
        setError("An unknown error occurred while loading campaign data");
      }
    } finally {
      console.log('7. Setting loading to false');
      setLoading(false);
    }
  }, [campaign_id]);

  useEffect(() => {
    console.log('useEffect triggered, campaign_id:', campaign_id);
    console.log('Current loading state:', loading);
    console.log('Current error state:', error);
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        await fetchCampaignAndClips();
      } catch (err) {
        console.error('Error in fetchData:', err);
      }
    };
    
    fetchData();
    
    return () => {
      console.log('Cleaning up...');
      controller.abort();
    };
  }, [fetchCampaignAndClips, campaign_id]);

  const refreshClips = useCallback(async () => {
    try {
      setLoading(true);
      const clips = await fetchCreatorClipsForCampaign(Number(campaign_id));
      
      // Process clips to ensure we have the latest data
      const processedClips = clips.map(clip => ({
        ...clip,
        status: clip.is_deleted_by_admin ? 'rejected' : (clip.status || 'in_review'),
        view_count: clip.view_count ?? 0 // default view_count during refresh as well
      }));
      
      // Update state with the latest clips
      setSubmittedClips(processedClips.filter(c => c.status === 'in_review'));
      setAcceptedClips(processedClips.filter(c => c.status === 'accepted'));
      setRejectedClips(processedClips.filter(c => c.status === 'rejected'));
    } catch (err) {
      console.error('Error refreshing clips:', err);
      if (err instanceof Error) {
        setError(`Failed to refresh clips: ${err.message}`);
      } else {
        setError("An unknown error occurred while refreshing clips");
      }
    } finally {
      setLoading(false);
    }
  }, [campaign_id]);

  const handleDeleteClip = useCallback(async (clipId: number, isAccepted: boolean = false) => {
    if (!window.confirm(isAccepted ? 'Delete this accepted clip?' : 'Delete this clip?')) return;
    try {
      setDeletingClipId(clipId);
      await deleteClip(clipId);
      // Trigger a refresh of the clips
      refreshClips();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setDeletingClipId(null);
    }
  }, [refreshClips]);

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
        <div className="text-red-600 text-sm">{error || "Campaign not found."}</div>
      </CreatorLayout>
    );
  }

  // Placeholder for payout percent
  const paid = 0;
  const target = campaign.budget - campaign.budget * 0.05;
  const payoutPercent = target > 0 ? Math.min(Math.round((paid / target) * 100), 100) : 0;

  const defaultRequirements = [
    "1. Don't use bots",
    "2. Don't portray bad the brand image",
    "3. Adhere to all platform guidelines",
  ];
  const campaignRequirements = campaign.requirements
    ? campaign.requirements.split('\n').filter(req => req.trim() !== '')
    : defaultRequirements;

  // Add this helper function to format category for display
  const formatCategory = (category: string): string => {
    // Replace underscores with spaces and capitalize each word
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' / ');
  };

  return (
    <CreatorLayout>
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>

            {campaign.category && (
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formatCategory(campaign.category)}
                </span>
              </div>
            )}
          </div>
          {/* Placeholder for days remaining */}
        </div>

        {/* Banner (placeholder for future image) */}
        <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
      {campaign.image_url && !imgError ? (
        <img
          src={campaign.image_url}
          alt={campaign.name}
           // ⚡ High Traffic Optimization
         // Handle broken links gracefully
          className="w-full h-full object-cover object-top transition-transform hover:scale-105 duration-500"
        />
      ) : (
        // The Fallback (Clean, branded placeholder)
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <ImageOff size={32} className="mb-2 opacity-50" />
          <span className="text-xs font-medium uppercase tracking-wider">No Preview</span>
        </div>
      )}
      
      {/* Optional: Overlay Gradient for text readability if you put text over images */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-0" />
      
    </div>
    {campaign.asset_link ?(
            <a href={campaign.asset_link} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
              <span>View Campaign Asset</span>
            </a>
          ) : (
            <span>No Asset Link Available</span>
          )}
              
        {/* Action button */}
        <div className="flex flex-col items-center">
          <Button
            className="w-full sm:w-auto px-8 py-2 bg-blue-700 hover:bg-blue-800 font-bold text-white text-base rounded shadow mb-1"
            onClick={() => navigate(`/creator/submit/${campaign.id}`)}
          >
            Submit Clip
          </Button>
        </div>

        {/* Progress Bar section */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-gray-700 font-semibold">Paid Out</span>
            <span className="text-xs bg-gray-100 px-2 rounded text-gray-700 font-semibold">
              ₹{paid.toLocaleString()} / ₹{campaign.budget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={payoutPercent} className="w-full h-3 bg-gray-200" />
            <span className="text-xs text-gray-800 font-semibold min-w-[38px]">
              {payoutPercent}%
            </span>
          </div>
        </div>

        <Separator />

        {/* Metrics grid */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium uppercase text-gray-400 mb-0.5">Platforms</span>
              <div className="flex items-center gap-2">
                {campaign.platform === "Instagram" && (
                  <Instagram className="text-pink-500 bg-white rounded-full border border-pink-100" size={21} />
                )}
                {campaign.platform === "YouTube" && (
                  <Youtube className="text-red-600 bg-white rounded-full border border-red-200" size={21} />
                )}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium uppercase text-gray-400 mb-0.5">Budget</span>
              <span className="text-sm font-medium">₹{campaign.budget.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium uppercase text-gray-400 mb-0.5">CPV</span>
              <span className="text-sm font-medium">₹{campaign.cpv}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Requirements Section */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Requirements</h2>
          <div className="bg-gray-50 rounded-lg border p-4 text-sm shadow-sm">
            <ul className="list-disc pl-6 space-y-2">
              {campaignRequirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
              {campaign.hashtag && <li>Use hashtag: {campaign.hashtag}</li>}
              {campaign.audio && <li>Use audio: {campaign.audio}</li>}
            </ul>
          </div>
        </div>

        <Separator />

        {/* Submitted Clips Section */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Your Submitted Clips</h2>
          {submittedClips.length === 0 ? (
            <div className="text-gray-400 text-sm">No clips submitted yet.</div>
          ) : (
            <div className="grid gap-4">
              {submittedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="border rounded-lg px-4 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <a
                      href={clip.clip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline break-all"
                    >
                      {clip.clip_url}
                    </a>
                    <span className="ml-2 text-xs font-semibold text-yellow-700">In Review</span>
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    onClick={() => handleDeleteClip(clip.id)}
                    disabled={deletingClipId === clip.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Rejected Clips Section */}
        {rejectedClips.length > 0 && (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Clips Needing Revision</h2>
              <div className="grid gap-4">
                {rejectedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="border rounded-lg px-4 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-50 border-red-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={clip.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                        >
                          View my clip 
                        </a>
                        <span className="text-xs font-semibold text-red-700">This clip will get deleted by 12 am Today</span>
                      </div>
                      {clip.feedback && (
                        <div className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Feedback:</span> {clip.feedback}
                        </div>
                      )}
                      <button
                        className={`text-white text-sm py-1 px-3 rounded-md font-medium transition-colors ${
                          deletingClipId === clip.id 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        onClick={() => handleDeleteClip(clip.id)}
                        disabled={deletingClipId === clip.id}
                      >
                        {deletingClipId === clip.id ? "Deleting..." : "OK (Delete Clip)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Accepted Clips Section */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Your Accepted Clips</h2>
          {acceptedClips.length === 0 ? (
            <div className="text-gray-400 text-sm">No clips accepted yet.</div>
          ) : (
            <div className="grid gap-4">
              {acceptedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="border rounded-lg px-4 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-green-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-1">
                      <a
                        href={clip.clip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-900 font-medium break-words w-full"
                      >
                        View my clip 
                      </a>
                      <span className="text-xs font-semibold text-green-700 mt-1">Accepted</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="text-gray-500">Submitted: {clip.submitted_at}</div>
                      {clip.view_count != null && (
                        <div className="text-gray-700 font-medium">Views: {clip.view_count.toLocaleString()}</div>
                      )}
                      {clip.caption && (
                        <div className="text-gray-700">Caption: {clip.caption}</div>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    onClick={() => handleDeleteClip(clip.id, true)}
                    disabled={deletingClipId === clip.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CampaignView;
