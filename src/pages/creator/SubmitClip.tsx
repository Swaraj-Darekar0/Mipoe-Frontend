import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { submitClip, fetchCampaignById, Campaign, fetchCreatorProfile, CreatorProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Extract media code from various Instagram Reels URL formats
const extractInstagramMediaCode = (url: string): string | null => {
  // Remove trailing slashes
  url = url.trim().replace(/\/$/, "");

  // Pattern 1: https://www.instagram.com/reels/MEDIAID
  const pattern1 = /instagram\.com\/reels\/([A-Za-z0-9_-]+)/;
  const match1 = url.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: https://www.instagram.com/p/MEDIAID (old format)
  const pattern2 = /instagram\.com\/p\/([A-Za-z0-9_-]+)/;
  const match2 = url.match(pattern2);
  if (match2) return match2[1];

  // Pattern 3: Just the media code itself
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
};

// Convert extracted media code to standardized format
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

const SubmitClip = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(true);

  // Fetch campaign details and creator profile when component mounts or campaignId changes
  useEffect(() => {
    const getCampaignAndProfileDetails = async () => {
      if (!campaignId) {
        setCampaignLoading(false);
        setError("Campaign ID is missing.");
        return;
      }
      try {
        setCampaignLoading(true);
        const [fetchedCampaign, fetchedProfile] = await Promise.all([
          fetchCampaignById(Number(campaignId)),
          fetchCreatorProfile(),
        ]);
        setCampaign(fetchedCampaign);
        setCreatorProfile(fetchedProfile);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load campaign details.");
        }
        setCampaign(null);
      } finally {
        setCampaignLoading(false);
      }
    };
    getCampaignAndProfileDetails();
  }, [campaignId]);

  const hasInstagram = creatorProfile?.instagram_verified && creatorProfile?.instagram_username;
  const followerCount = creatorProfile?.instagram_follower_count ?? 0;
  
  const qualifies = campaign?.campaign_type !== "influencer" || 
    !campaign?.follower_range || 
    (!!hasInstagram && checkFollowerRangeMatch(followerCount, campaign.follower_range));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!campaignId) {
        throw new Error("Cannot submit clip: Campaign ID is missing.");
      }

      // Hard check follower range requirement on submit
      if (campaign?.campaign_type === "influencer" && campaign.follower_range) {
        if (!hasInstagram) {
          throw new Error("Please link and verify your Instagram account first to participate in influencer campaigns.");
        }
        if (!checkFollowerRangeMatch(followerCount, campaign.follower_range)) {
          throw new Error(
            `Your linked Instagram follower count (${followerCount.toLocaleString()}) does not meet the campaign's target follower requirement (${campaign.follower_range} followers).`
          );
        }
      }

      // Extract media code from the provided URL
      const mediaCode = extractInstagramMediaCode(link);
      if (!mediaCode) {
        throw new Error(
          "Invalid Instagram Reels URL format. Please provide a valid Instagram Reels link or media code."
        );
      }

      // Convert to standard format
      const standardizedUrl = convertToStandardFormat(mediaCode);

      await submitClip({
        campaign_id: Number(campaignId),
        clip_url: standardizedUrl
      });
      setSuccess("Clip submitted successfully!");
      setLink("");
      setTimeout(() => navigate("/creator/dashboard"), 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (campaignLoading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CreatorLayout>
    );
  }

  if (error && !campaign) { // Display error if campaign fetching failed and no campaign data
    return (
      <CreatorLayout>
        <div className="max-w-md bg-white p-8 rounded-lg shadow mx-auto text-red-600">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <Button onClick={() => navigate("/creator/dashboard")} className="mt-4">Back to Dashboard</Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="max-w-md text-gray-600 bg-white p-8 rounded-lg shadow mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Submit Clip</h2>
        <div className="mb-4">
          <span className="text-gray-600">Campaign:</span>{" "}
          <span className="font-semibold text-gray-800">
            {campaign?.name ?? campaignId ?? "Unknown"}
          </span>
        </div>
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Video clip link section */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-semibold">
              Video Clip Link (IG Reels)
            </label>
            <input
              type="url"
              className="w-full text-gray-600 border rounded px-3 py-2 bg-gray-50 focus:bg-white"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://www.instagram.com/reels/..."
              required
            />
          </div>
          {error && <div className="text-red-650 text-sm font-medium">{error}</div>}
          {success && <div className="text-green-650 text-sm font-medium">{success}</div>}
          <Button
            type="submit"
            className="w-full"
            disabled={!link || loading || !campaign}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </CreatorLayout>
  );
};

export default SubmitClip;
