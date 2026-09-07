import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { useToast } from "@/hooks/use-toast";
import { createCampaign, uploadCampaignImage, getBrandProfile } from "@/lib/api";
import { compressImage } from "@/utils/imageCompression";
import {
  Sparkles,
  Users,
  Calendar,
  Instagram,
  Youtube,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Link2,
} from "lucide-react";

interface UgcCampaignBuilderProps {
  businessCategory?: string;
  brandId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FOLLOWER_RANGES = [
  { value: "0 - 1,000", label: "0 - 1K followers (Nano)", minCpv: 100 },
  { value: "1,000 - 5,000", label: "1K - 5K followers (Micro)", minCpv: 100 },
  { value: "5,000 - 10,000", label: "5K - 10K followers (Mid-Tier)", minCpv: 200 },
  { value: "10,000 - 50,000", label: "10K - 50K followers (Rising)", minCpv: 200 },
  { value: "50,000 - 100,000", label: "50K - 100K followers (Macro)", minCpv: 200 },
  { value: "100,000+", label: "100K+ followers (Elite / Celebrity)", minCpv: 200 },
];

export const UgcCampaignBuilder: React.FC<UgcCampaignBuilderProps> = ({
  businessCategory: initialBusinessCategory,
  brandId: initialBrandId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Brand profile & compliance state
  const [businessCategory, setBusinessCategory] = useState<string>(
    initialBusinessCategory || "Personal Agency"
  );
  const [resolvedBrandId, setResolvedBrandId] = useState<string>(
    initialBrandId || localStorage.getItem("brand_id") || "1"
  );

  useEffect(() => {
    if (!initialBusinessCategory || !initialBrandId) {
      getBrandProfile()
        .then((profile) => {
          if (profile.category) setBusinessCategory(profile.category);
          if (profile.id) setResolvedBrandId(String(profile.id));
        })
        .catch((err) => {
          console.error("Failed to load brand profile for UGC campaign builder", err);
        });
    }
  }, [initialBusinessCategory, initialBrandId]);

  // Campaign Category options based on businessCategory
  const getAvailableCampaignCategories = () => {
    if (businessCategory === "Personal Agency") {
      return [{ value: "promotional", label: "Promotional (YouTube, Gaming, Business)" }];
    } else if (businessCategory === "Product Based") {
      return [
        { value: "fashion", label: "Fashion & Apparel" },
        { value: "beauty", label: "Beauty & Cosmetics" },
        { value: "electronics", label: "Electronics & Tech" },
        { value: "home_kitchen", label: "Home & Kitchen" },
        { value: "fitness_wellness", label: "Fitness & Wellness" },
      ];
    } else if (businessCategory === "SaaS Based") {
      return [
        { value: "software_tools", label: "Software & SaaS Tools" },
        { value: "gaming", label: "Gaming" },
        { value: "education", label: "Education & EdTech" },
        { value: "finance_crypto", label: "Finance & Crypto" },
      ];
    }
    return [
      { value: "promotional", label: "Promotional (YouTube, Gaming, Business)" },
      { value: "fashion", label: "Fashion & Apparel" },
      { value: "beauty", label: "Beauty & Cosmetics" },
      { value: "electronics", label: "Electronics & Tech" },
      { value: "home_kitchen", label: "Home & Kitchen" },
      { value: "fitness_wellness", label: "Fitness & Wellness" },
      { value: "software_tools", label: "Software Tools" },
      { value: "gaming", label: "Gaming" },
      { value: "education", label: "Education" },
      { value: "finance_crypto", label: "Finance & Crypto" },
    ];
  };

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("promotional");
  const [platform, setPlatform] = useState<string>("Instagram");
  const [followerRange, setFollowerRange] = useState<string>("0 - 1,000");
  const [assetLink, setAssetLink] = useState("");
  const [deadline, setDeadline] = useState("");

  // CPV Pricing
  const isBelow5k = followerRange === "0 - 1,000" || followerRange === "1,000 - 5,000";
  const minCpv = isBelow5k ? 100 : 200;
  const [cpv, setCpv] = useState<number>(100);
  const [displayCpv, setDisplayCpv] = useState<string>("100");

  // Keep CPV aligned with minCpv when follower range changes
  useEffect(() => {
    if (cpv < minCpv) {
      setCpv(minCpv);
      setDisplayCpv(String(minCpv));
    }
  }, [minCpv, cpv]);

  // Sync category default
  useEffect(() => {
    const cats = getAvailableCampaignCategories();
    if (cats.length > 0 && !cats.some((c) => c.value === category)) {
      setCategory(cats[0].value);
    }
  }, [businessCategory]);

  // Interactive Guidelines / Instructions
  const [guidelines, setGuidelines] = useState<string[]>([
    "Feature the product prominently in the opening 3 seconds",
    "Share authentic personal experience highlighting key product benefits",
    "Tag our official handle and place required promotion link in bio/caption",
    "Adhere to all platform advertising and sponsored content disclosure standards",
  ]);

  // Advanced Options
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [hashtag, setHashtag] = useState("");
  const [audio, setAudio] = useState("");

  // 16:9 Cover Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Minimum date for deadline: today
  const todayStr = new Date().toISOString().split("T")[0];

  const handleCpvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayCpv(e.target.value);
  };

  const handleCpvBlur = () => {
    const parsed = parseFloat(displayCpv);
    if (!isNaN(parsed)) {
      let rounded = Math.round(parsed / 100) * 100;
      if (rounded < minCpv) rounded = minCpv;
      setCpv(rounded);
      setDisplayCpv(String(rounded));
    } else {
      setCpv(minCpv);
      setDisplayCpv(String(minCpv));
    }
  };

  const handleAddGuideline = () => {
    setGuidelines([...guidelines, ""]);
  };

  const handleUpdateGuideline = (index: number, val: string) => {
    const updated = [...guidelines];
    updated[index] = val;
    setGuidelines(updated);
  };

  const handleRemoveGuideline = (index: number) => {
    if (guidelines.length <= 1) return;
    setGuidelines(guidelines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a campaign name.");
      return;
    }
    if (!platform) {
      setError("Please select a platform (Instagram or YouTube).");
      return;
    }
    if (!deadline) {
      setError("Please select a deadline date for the campaign.");
      return;
    }
    if (cpv < minCpv) {
      setError(`Minimum CPV for "${followerRange}" is ₹${minCpv}.`);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          imageUrl = await uploadCampaignImage(compressed);
        } catch (uploadErr) {
          throw new Error("Failed to upload cover image. Please check image format and size.");
        }
      }

      // Format guidelines into requirements text
      const formattedRequirements = guidelines
        .map((g, idx) => `${idx + 1}. ${g.trim()}`)
        .filter((line) => line.split(". ")[1]?.length > 0)
        .join("\n");

      await createCampaign({
        brand_id: resolvedBrandId,
        platform,
        budget: 0,
        funds_allocated: 0,
        funds_distributed: 0,
        cpv,
        hashtag: hashtag.trim() || null,
        audio: audio.trim() || null,
        deadline,
        name: name.trim(),
        description: description.trim(),
        view_threshold: 1000,
        requirements: formattedRequirements || null,
        asset_link: assetLink.trim(),
        category,
        image_url: imageUrl,
        campaign_type: "influencer",
        follower_range: followerRange,
      });

      setSuccess("UGC / Influencer campaign launched successfully!");
      toast({
        title: "Campaign Launched!",
        description: `"${name}" is now live and accepting creator submissions.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate("/brand/dashboard?tab=campaigns");
        }, 800);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while creating the campaign.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-5 sm:px-6 sm:py-6 border-b border-zinc-100 bg-gradient-to-r from-pink-50/60 via-purple-50/30 to-indigo-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-pink-100/90 text-pink-600 flex items-center justify-center shrink-0 border border-pink-200/80 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                  Launch UGC / Influencer Campaign
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                  <Users className="w-3 h-3" />
                  Influencer / UGC
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Collaborate with verified creators to produce authentic user-generated content and drive real conversions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
        {/* Cover Image Upload (16:9) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Campaign Cover Banner (16:9)
          </label>
          <ImageCropInput
            value={imagePreview || ""}
            onChange={(file, previewUrl) => {
              setImagePreview(previewUrl);
              setImageFile(file);
            }}
            aspectRatio="16:9"
            label=""
            placeholder="Upload 16:9 campaign cover image for creator feeds"
            disabled={loading}
          />
          <p className="text-[11px] text-zinc-400">
            Recommended ratio 16:9 (1280×720px). Supports JPG, PNG, or WebP up to 5MB.
          </p>
        </div>

        {/* Section 1: Campaign Details */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            1. Campaign Details
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Campaign Name <span className="text-pink-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Skincare Routine Review"
              required
              className="rounded-xl border-zinc-200 text-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Product / Niche Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
              >
                {getAvailableCampaignCategories().map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Target Platform <span className="text-pink-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setPlatform("Instagram")}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    platform === "Instagram"
                      ? "bg-pink-50 border-pink-300 text-pink-700 shadow-xs"
                      : "bg-zinc-50/70 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("YouTube")}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    platform === "YouTube"
                      ? "bg-red-50 border-red-300 text-red-700 shadow-xs"
                      : "bg-zinc-50/70 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  YouTube
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Campaign Description / Goal
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign goals, brand tone, key talking points, and audience expectations..."
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
            />
          </div>
        </div>

        {/* Section 2: Creator Follower Tier & CPV Payout */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              2. Target Creator Tier & CPV Rate
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
              <ShieldCheck className="w-3 h-3" />
              Min CPV: ₹{minCpv}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Target Creator Follower Range
              </label>
              <select
                value={followerRange}
                onChange={(e) => setFollowerRange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
              >
                {FOLLOWER_RANGES.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400">
                Only creators meeting this follower bracket can apply.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700">
                  CPV (Per 1,000 Views) ₹
                </label>
                <span className="text-[11px] font-medium text-pink-600">
                  Multiples of ₹100
                </span>
              </div>
              <Input
                type="number"
                step={100}
                min={minCpv}
                value={displayCpv}
                onChange={handleCpvChange}
                onBlur={handleCpvBlur}
                placeholder={`Min ₹${minCpv}`}
                className="rounded-xl border-zinc-200 text-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <p className="text-[11px] text-zinc-400">
                Payout calculated per 1,000 verified views generated by accepted reels.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Product Asset Link & Creative Brief */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            3. Product & Creative Brief Link
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Product / Creative Brief Link (Optional)
            </label>
            <div className="relative">
              <Input
                type="url"
                value={assetLink}
                onChange={(e) => setAssetLink(e.target.value)}
                placeholder="https://yourbrand.com/products/xyz or Google Drive creative brief"
                className="rounded-xl border-zinc-200 pl-9 text-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Influencers will use this link to inspect product specs, download branding assets, or submit address requests for gifting.
            </p>
          </div>
        </div>

        {/* Section 4: Custom Influencer Guidelines */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              4. Influencer Guidelines & Instructions
            </h3>
            <span className="text-[11px] text-zinc-400">
              {guidelines.length} guideline{guidelines.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/70 space-y-2.5">
            {guidelines.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 w-5 shrink-0 text-center">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateGuideline(index, e.target.value)}
                  placeholder={`Guideline #${index + 1}...`}
                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
                {guidelines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGuideline(index)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Remove guideline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddGuideline}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Guideline
            </button>
          </div>
        </div>

        {/* Section 5: Schedule & Advanced Rules */}
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            5. Schedule & Advanced Rules
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Campaign Deadline <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                min={todayStr}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="rounded-xl border-zinc-200 pl-9 text-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Last date for creators to submit approved content.
            </p>
          </div>

          {/* Optional Advanced Accordion */}
          <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-pink-500" />
                Advanced Tags & Audio Rules (Optional)
              </span>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-4 bg-zinc-50/50 border-t border-zinc-200/80 space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-600">
                    Mandatory Hashtags
                  </label>
                  <Input
                    type="text"
                    value={hashtag}
                    onChange={(e) => setHashtag(e.target.value)}
                    placeholder="#BrandName #Sponsored #SummerLook"
                    className="rounded-lg border-zinc-200 text-xs bg-white focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-zinc-600">
                    Sound / Audio Track Link
                  </label>
                  <Input
                    type="text"
                    value={audio}
                    onChange={(e) => setAudio(e.target.value)}
                    placeholder="https://instagram.com/reels/audio/... or trending audio name"
                    className="rounded-lg border-zinc-200 text-xs bg-white focus:border-pink-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ? onCancel : () => navigate("/brand/dashboard")}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-[0.98]"
          >
            {loading ? "Launching Campaign..." : "Launch UGC Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UgcCampaignBuilder;
