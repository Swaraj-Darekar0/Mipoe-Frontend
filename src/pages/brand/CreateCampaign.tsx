import { useState, useEffect } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { createCampaign, uploadCampaignImage, Campaign, getBrandProfile } from "@/lib/api";
import { compressImage } from "@/utils/imageCompression"; // Assumes utils file exists
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [businessCategory, setBusinessCategory] = useState<string>("Personal Agency");

  useEffect(() => {
    const checkCompliance = async () => {
      try {
        const profile = await getBrandProfile();
        if (profile.category) {
          setBusinessCategory(profile.category);
        }
        if (profile.onboarding_status !== "verified") {
          toast({
            title: "Access Restricted",
            description: "Please complete business verification to create campaigns.",
            variant: "destructive"
          });
          navigate("/brand/dashboard");
        }
      } catch (err) {
        console.error("Compliance check failed", err);
      }
    };
    checkCompliance();
  }, [navigate]);

  const getAvailableCampaignCategories = () => {
    if (businessCategory === "Personal Agency") {
      return [{ value: "promotional", label: "Promotional (YouTube, Gaming, Business)" }];
    } else if (businessCategory === "Product Based") {
      return [
        { value: "fashion", label: "Fashion" },
        { value: "beauty", label: "Beauty" },
        { value: "electronics", label: "Electronics" },
        { value: "home_kitchen", label: "Home & Kitchen" },
        { value: "fitness_wellness", label: "Fitness & Wellness" }
      ];
    } else { // SaaS Based
      return [
        { value: "software_tools", label: "Software Tools" },
        { value: "gaming", label: "Gaming" },
        { value: "education", label: "Education" },
        { value: "finance_crypto", label: "Finance & Crypto" }
      ];
    }
  };

  const [platform, setPlatform] = useState("");

  const [cpv, setCpv] = useState<number>(0);
  const [displayCpv, setDisplayCpv] = useState<string>("100");
  const [hashtag, setHashtag] = useState("");
  const [audio, setAudio] = useState("");
  const [deadline, setDeadline] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Campaign['category']>("promotional");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync category with businessCategory options
  useEffect(() => {
    const cats = getAvailableCampaignCategories();
    if (cats.length > 0) {
      setCategory(cats[0].value);
    }
  }, [businessCategory]);

  const [viewThreshold, setViewThreshold] = useState<number>(1000);
  const [displayViewThreshold, setDisplayViewThreshold] = useState<string>("1000");
  const [requirements, setRequirements] = useState("");
  const [campaignType, setCampaignType] = useState<'influencer' | 'clipping'>('influencer');
  const [followerRange, setFollowerRange] = useState<string>("0 - 1,000");
  const [manualInstructions, setManualInstructions] = useState<string[]>([
    "Don't use bots",
    "Don't portray bad the brand image",
    "Adhere to all platform guidelines"
  ]);
  const [assetLink, setAssetLink] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sync initial and minimum CPV on campaign type or follower range selection change
  useEffect(() => {
    if (campaignType === "influencer") {
      const isBelow5k = followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000";
      const minCpv = isBelow5k ? 100 : 200;
      if (cpv < minCpv) {
        setCpv(minCpv);
        setDisplayCpv(String(minCpv));
      }
    }
  }, [campaignType, followerRange]);



  // TODO: Replace with actual brand_id from auth context or localStorage
  const brand_id = Number(localStorage.getItem("brand_id")) || 1;

  useEffect(() => {
    const formatted = manualInstructions
      .map((inst, index) => `${index + 1}. ${inst.trim()}`)
      .filter((line) => line.split(". ")[1]?.length > 0)
      .join("\n");
    setRequirements(formatted);
  }, [manualInstructions]);

  const handleCpvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayCpv(value);
  };

  const handleCpvBlur = () => {
    const value = parseFloat(displayCpv);
    if (!isNaN(value)) {
      let roundedCpv = Math.round(value / 100) * 100;
      
      // Enforce minimum CPV based on follower range
      if (campaignType === "influencer") {
        const isBelow5k = followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000";
        const minCpv = isBelow5k ? 100 : 200;
        if (roundedCpv < minCpv) {
          roundedCpv = minCpv;
        }
      } else {
        if (roundedCpv < 0) roundedCpv = 0;
      }
      
      setCpv(roundedCpv);
      setDisplayCpv(String(roundedCpv));
    } else {
      if (campaignType === "influencer") {
        const isBelow5k = followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000";
        const minCpv = isBelow5k ? 100 : 200;
        setCpv(minCpv);
        setDisplayCpv(String(minCpv));
      } else {
        setCpv(0);
        setDisplayCpv("0");
      }
    }
  };

  const handleViewThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayViewThreshold(value);
  };

  const handleViewThresholdBlur = () => {
    const value = parseFloat(displayViewThreshold);
    if (!isNaN(value)) {
      const roundedThreshold = Math.round(value / 1000) * 1000;
      setViewThreshold(roundedThreshold);
      setDisplayViewThreshold(String(roundedThreshold));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Form Validation
      if (!name.trim()) throw new Error("Campaign Name is required.");
      if (!platform) throw new Error("Platform selection is required.");
      if (!deadline) throw new Error("Deadline date is required.");

      if (campaignType === "influencer") {
        const isBelow5k = followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000";
        const minCpv = isBelow5k ? 100 : 200;
        if (cpv < minCpv) {
          throw new Error(`Minimum CPV for range "${followerRange}" is ${minCpv} ₹.`);
        }
      }

      let imageUrl = "";
      
      // 1. Handle Image Upload
      if (imageFile) {
        try {
          const compressedFile = await compressImage(imageFile);
          imageUrl = await uploadCampaignImage(compressedFile);
        } catch (uploadErr) {
          throw new Error("Failed to compress or upload image");
        }
      }

      // 2. Create Campaign
      await createCampaign({
        brand_id: String(brand_id),
        platform,
        budget: 0,        // Target Budget (Starts at 0, implies "Not Set")
        funds_allocated: 0,
        funds_distributed: 0,
        cpv,
        hashtag,
        audio,
        deadline,
        name,
        description,
        view_threshold: Number(viewThreshold),
        requirements: requirements,
        asset_link: assetLink,
        category,
        image_url: imageUrl,
        campaign_type: campaignType,
        follower_range: campaignType === "influencer" ? followerRange : undefined
      });
      
      setSuccess("Campaign created successfully!");
      setName("");
      setDescription("");
      setPlatform("");
      setDisplayCpv("0");
      setCpv(0);
      setHashtag("");
      setAudio("");
      setDeadline("");
      setImageFile(null);
      setImagePreview(null);
      setFollowerRange("0 - 1,000");
      setManualInstructions([
        "Don't use bots",
        "Don't portray bad the brand image",
        "Adhere to all platform guidelines"
      ]);
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
    <BrandLayout>
      <div className="max-w-lg bg-white p-8 rounded-lg shadow mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Create Campaign</h2>
        
        {/* Campaign Type Segmented Control */}
        <div className="bg-gray-100 p-1.5 rounded-xl flex gap-2 w-full mb-6">
          <button
            type="button"
            onClick={() => setCampaignType("influencer")}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              campaignType === "influencer"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Influencer Campaign
          </button>
          <button
            type="button"
            onClick={() => setCampaignType("clipping")}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              campaignType === "clipping"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Clipping Campaign
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-1">
            <ImageCropInput
              value={imagePreview || ""}
              onChange={(file, previewUrl) => {
                setImagePreview(previewUrl);
                setImageFile(file);
              }}
              aspectRatio="16:9"
              label="Campaign Cover Image"
              placeholder="Upload a high-quality campaign cover image"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Campaign Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Campaign Name"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Campaign Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's the campaign about ..."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="2" className="block text-gray-700 mb-1">Category</label>
            <select
              id="2"
              className="w-full border rounded px-3 py-2"
              value={category}
              onChange={e => setCategory(e.target.value as Campaign['category'])}
            >
              {getAvailableCampaignCategories().map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {campaignType === 'influencer' && (
            <div>
              <label htmlFor="follower-range" className="block text-gray-700 mb-1">Target Creator Follower Range</label>
              <select
                id="follower-range"
                className="w-full border rounded px-3 py-2 bg-white"
                value={followerRange}
                onChange={e => setFollowerRange(e.target.value)}
              >
                <option value="0 - 1k">0 - 1K followers</option>
                <option value="1k - 5k">1K - 5K followers</option>
                <option value="5k - 10k">5K - 10K followers</option>
                <option value="10k - 50k">10K - 50K followers</option>
                <option value="50k - 100k">50K - 100K followers</option>
                <option value="100k+">100K+ followers</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="3" className="block text-gray-700 mb-1">Platform</label>
            <select
              id="3"
              className="w-full border rounded px-3 py-2"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option value="">Select Platform</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Video/Product Link (Optional)</label>
            <input
              type="url"
              className="w-full border rounded px-3 py-2"
              value={assetLink}
              onChange={e => setAssetLink(e.target.value)}
              placeholder="https://example.com/video"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">
              View Threshold (Number of Views for Payout)
              <span className="text-gray-400 text-sm ml-2 font-normal">Multiples of 1000 views</span>
            </label>
            <input
              type="number"
              step={1000}
              className="w-full border rounded px-3 py-2"
              value={displayViewThreshold}
              onChange={handleViewThresholdChange}
              onBlur={handleViewThresholdBlur}
              placeholder="e.g. 1000"
              min={1000}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-700 text-sm font-medium">
                CPV (Cost per {viewThreshold || 'N'} views) ₹
                <span className="text-gray-400 text-xs ml-2 font-normal">Multiples of ₹100</span>
              </label>
              {campaignType === 'influencer' && (
                <span className="text-xs font-semibold text-indigo-600">
                  Min CPV: {followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000" ? "100" : "200"} ₹
                </span>
              )}
            </div>
            <input
              type="number"
              step={100}
              min={campaignType === 'influencer' ? (followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000" ? 100 : 200) : 0}
              className="w-full border rounded px-3 py-2"
              value={displayCpv}
              onChange={handleCpvChange}
              onBlur={handleCpvBlur}
              placeholder="e.g. 100"
            />
          </div>
          {/* Interactive Manual Instructions Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-gray-700 font-semibold mb-3">
              Instructions & Rules
            </label>
            <div className="space-y-3">
              {manualInstructions.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-gray-400 text-sm font-medium w-6">{index + 1}.</span>
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    value={instruction}
                    onChange={(e) => {
                      const updated = [...manualInstructions];
                      updated[index] = e.target.value;
                      setManualInstructions(updated);
                    }}
                    placeholder={`e.g., Instruction #${index + 1}`}
                  />
                  {manualInstructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = manualInstructions.filter((_, i) => i !== index);
                        setManualInstructions(updated);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Remove Instruction"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setManualInstructions([...manualInstructions, ""])}
                className="mt-2 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer"
              >
                + Add Instruction
              </button>
            </div>
          </div>
          
          {/* Advanced Requirements Accordion */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors w-full"
            >
              <span className="text-lg">
                {isAdvancedOpen ? "▼" : "▶"}
              </span>
              <span className="font-medium">Advanced Requirements (Optional)</span>
            </button>
            
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isAdvancedOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Hashtag Rules</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={hashtag}
                    onChange={e => setHashtag(e.target.value)}
                    placeholder="#YourBrand"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Audio</label>
                  <span className="text-gray-400 text-sm ml-2 font-normal">Audio Link</span>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={audio}
                    onChange={e => setAudio(e.target.value)}
                    placeholder="Particular Audio info"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="4" className="block text-gray-700 mb-1">Deadline</label>
            <input
            id="4"
              type="date"
              className="w-full border rounded px-3 py-2"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mt-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>

    </BrandLayout>
  );
};

export default CreateCampaign;