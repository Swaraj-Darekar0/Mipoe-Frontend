import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { submitClip } from "@/lib/api";

const campaigns = {
  "1": { title: "Myntra Summer Shorts" },
  "2": { title: "Tata Tea Snap" },
  "3": { title: "BoAt #BassHeadz" }
};

const SubmitClip = () => {
  const { campaignId } = useParams();
  const campaign = campaigns[campaignId as keyof typeof campaigns];
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // TODO: Replace with actual creator_id from auth context or localStorage
  const creator_id = Number(localStorage.getItem("creator_id")) || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
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

  return (
    <CreatorLayout>
      <div className="max-w-md bg-white p-8 rounded-lg shadow mx-auto">
        <h2 className="text-xl font-bold mb-4">Submit Clip</h2>
        <div className="mb-3">
          <span className="text-gray-600">Campaign:</span>{" "}
          <span className="font-semibold">
            {campaign?.title ?? campaignId ?? "Unknown"}
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
              className="w-full border rounded px-3 py-2"
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
            disabled={!link || loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </CreatorLayout>
  );
};

export default SubmitClip;
