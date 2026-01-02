import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { submitClip, fetchCampaignById, Campaign } from "@/lib/api";
import { Loader2 } from "lucide-react";

const SubmitClip = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(true);

  // Fetch campaign details when component mounts or campaignId changes
  useEffect(() => {
    const getCampaignDetails = async () => {
      if (!campaignId) {
        setCampaignLoading(false);
        setError("Campaign ID is missing.");
        return;
      }
      try {
        setCampaignLoading(true);
        const fetchedCampaign = await fetchCampaignById(Number(campaignId));
        setCampaign(fetchedCampaign);
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
    getCampaignDetails();
  }, [campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!campaignId) {
        throw new Error("Cannot submit clip: Campaign ID is missing.");
      }
      await submitClip({
        campaign_id: Number(campaignId),
        clip_url: link
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
        <h2 className="text-xl font-bold mb-4">Submit Clip</h2>
        <div className="mb-3">
          <span className="text-gray-600">Campaign:</span>{" "}
          <span className="font-semibold">
            {campaign?.name ?? campaignId ?? "Unknown"}
          </span>
        </div>
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Video clip link section */}
          <div>
            <label className="block text-gray-700 mb-1">
              Video Clip Link (IG/YouTube)
            </label>
            <input
              type="url"
              className="w-full text-gray-600 border rounded px-3 py-2"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://youtube.com/..."
              required
            />
          </div>
          {/* Removed Add Media section */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
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
