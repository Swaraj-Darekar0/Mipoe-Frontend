import { useState } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { createCampaign, uploadCampaignImage, Campaign } from "@/lib/api";
import { compressImage } from "@/utils/imageCompression"; // Assumes utils file exists

const CreateCampaign = () => {
  const [platform, setPlatform] = useState("");

  const [cpv, setCpv] = useState<number>(0);
  const [displayCpv, setDisplayCpv] = useState<string>("0");
  const [hashtag, setHashtag] = useState("");
  const [audio, setAudio] = useState("");
  const [deadline, setDeadline] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Campaign['category']>("fashion_clothing");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewThreshold, setViewThreshold] = useState<number>(1000);
  const [displayViewThreshold, setDisplayViewThreshold] = useState<string>("1000");
  const [requirements, setRequirements] = useState("1. Don't use bots\n2. Don't portray bad the brand image\n3. Adhere to all platform guidelines");
  const [assetLink, setAssetLink] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // TODO: Replace with actual brand_id from auth context or localStorage
  const brand_id = Number(localStorage.getItem("brand_id")) || 1;


  const handleCpvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayCpv(value);
  };

  const handleCpvBlur = () => {
    const value = parseFloat(displayCpv);
    if (!isNaN(value)) {
      const roundedCpv = Math.round(value / 100) * 100;
      setCpv(roundedCpv);
      setDisplayCpv(String(roundedCpv));
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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Create a local preview URL
      setImagePreview(URL.createObjectURL(file));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
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
        brand_id,
        platform,
        budget: 0,        // Target Budget (Starts at 0, implies "Not Set")
        funds_allocated: 0, // <--- ADD THIS LINE (Fixes the TS Error)
        cpv,
        hashtag,
        audio,
        deadline,
        name,
        view_threshold: Number(viewThreshold),
        requirements: requirements,
        asset_link: assetLink,
        category,
        image_url: imageUrl
      });
      
      setSuccess("Campaign created successfully!");
      // ... (Rest of your reset logic remains the same) ...
      setName("");
      // ... 
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
        <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
        <div className="space-y-4">
          {/* Image Upload Section */}
          <div>
            <label htmlFor="1" className="block text-gray-700 mb-1">Campaign Cover Image</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">No Image</span>
                )}
              </div>
              <div className="flex-1">
                <input
                id="1"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 1280x720 (16:9)</p>
              </div>
            </div>
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
            <label htmlFor="2" className="block text-gray-700 mb-1">Category</label>
            <select
              id="2"
              className="w-full border rounded px-3 py-2"
              value={category}
              onChange={e => setCategory(e.target.value as Campaign['category'])}
            >
              <option value="fashion_clothing">Fashion / Clothing</option>
              <option value="beauty_products">Beauty Products</option>
            </select>
          </div>
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
            <label className="block text-gray-700 mb-1">
              CPV (Cost per {viewThreshold || 'N'} views) ₹
              <span className="text-gray-400 text-sm ml-2 font-normal">Multiples of ₹100</span>
            </label>
            <input
              type="number"
              step={100}
              className="w-full border rounded px-3 py-2"
              value={displayCpv}
              onChange={handleCpvChange}
              onBlur={handleCpvBlur}
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Requirements</label>
            <textarea
              className="w-full border rounded px-3 py-2 h-32"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              placeholder="e.g., '1. Don't use bots\n2. Ensure high quality content'"
            />
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