import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { useToast } from "@/hooks/use-toast";
import { createCampaign, uploadCampaignImage, getBrandProfile } from "@/lib/api";
import { compressImage } from "@/utils/imageCompression";
import {
  Scissors,
  Video,
  Calendar,
  Instagram,
  Youtube,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Link2,
  TrendingUp,
  Coins,
} from "lucide-react";

interface ClippingCampaignBuilderProps {
  businessCategory?: string;
  brandId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClippingCampaignBuilder: React.FC<ClippingCampaignBuilderProps> = ({
  businessCategory: initialBusinessCategory,
  brandId: initialBrandId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Brand profile & category state
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
          console.error("Failed to load brand profile for Clipping campaign builder", err);
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
  const [sourceVideoLink, setSourceVideoLink] = useState("");
  const [deadline, setDeadline] = useState("");

  // Sync category default
  useEffect(() => {
    const cats = getAvailableCampaignCategories();
    if (cats.length > 0 && !cats.some((c) => c.value === category)) {
      setCategory(cats[0].value);
    }
  }, [businessCategory]);

  // View Threshold: Multiples of 1000 views
  const [viewThreshold, setViewThreshold] = useState<number>(1000);
  const [displayViewThreshold, setDisplayViewThreshold] = useState<string>("1000");

  const handleViewThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayViewThreshold(e.target.value);
  };

  const handleViewThresholdBlur = () => {
    const parsed = parseFloat(displayViewThreshold);
    if (!isNaN(parsed) && parsed > 0) {
      const rounded = Math.max(1000, Math.round(parsed / 1000) * 1000);
      setViewThreshold(rounded);
      setDisplayViewThreshold(String(rounded));
    } else {
      setViewThreshold(1000);
      setDisplayViewThreshold("1000");
    }
  };

  // CPV per 1000 views: Multiples of 100 ₹
  const [cpv, setCpv] = useState<number>(100);
  const [displayCpv, setDisplayCpv] = useState<string>("100");

  const handleCpvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayCpv(e.target.value);
  };

  const handleCpvBlur = () => {
    const parsed = parseFloat(displayCpv);
    if (!isNaN(parsed) && parsed > 0) {
      const rounded = Math.max(100, Math.round(parsed / 100) * 100);
      setCpv(rounded);
      setDisplayCpv(String(rounded));
    } else {
      setCpv(100);
      setDisplayCpv("100");
    }
  };

  // Interactive Clipping Rules & Instructions
  const [rules, setRules] = useState<string[]>([
    "Download raw source video from the provided asset link",
    "Hook viewers within the first 2 seconds to optimize viewer retention",
    "Render vertical format (9:16 aspect ratio, 1080×1920)",
    "Add punchy captions, key sound effects, and maintain original context",
  ]);

  const handleAddRule = () => {
    setRules([...rules, ""]);
  };

  const handleUpdateRule = (index: number, val: string) => {
    const updated = [...rules];
    updated[index] = val;
    setRules(updated);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length <= 1) return;
    setRules(rules.filter((_, i) => i !== index));
  };

  // Optional Advanced Accordion
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
    if (!sourceVideoLink.trim()) {
      setError("Source video link / cloud drive URL is required for clipping campaigns.");
      return;
    }
    if (!deadline) {
      setError("Please select a deadline date for the campaign.");
      return;
    }
    if (viewThreshold < 1000) {
      setError("View threshold must be at least 1,000 views.");
      return;
    }
    if (cpv < 100) {
      setError("CPV must be at least ₹100 per 1,000 views.");
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

      // Format clipping instructions
      const formattedRequirements = rules
        .map((r, idx) => `${idx + 1}. ${r.trim()}`)
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
        view_threshold: viewThreshold,
        requirements: formattedRequirements || null,
        asset_link: sourceVideoLink.trim(),
        category,
        image_url: imageUrl,
        campaign_type: "clipping",
      });

      setSuccess("Clipping campaign launched successfully!");
      toast({
        title: "Clipping Campaign Launched!",
        description: `"${name}" is now live for clipping editors to submit reels.`,
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
    <div className="w-full bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-5 sm:px-6 border-b border-black/[0.08] bg-[#fafafb]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 border border-brand-blue/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
                  Launch Clipping Campaign
                </h2>
                <StatusPill tone="brand">
                  <span className="inline-flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Clipping & Short-Form
                  </span>
                </StatusPill>
              </div>
              <p className="text-xs text-slate mt-0.5">
                Incentivize video editors to extract high-engagement vertical reels and shorts from your long-form footage.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
        {/* Cover Image Upload (16:9) */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-widest text-steel">
            Campaign Cover Banner (16:9)
          </label>
          <ImageCropInput
            value={imagePreview || ""}
            onChange={(file, previewUrl) => {
              setImagePreview(previewUrl);
              setImageFile(file);
            }}
            aspectRatio="16:9"
            accent="brand"
            label=""
            placeholder="Upload 16:9 campaign cover image for video editors"
            disabled={loading}
          />
          <p className="text-[11px] text-steel">
            Recommended ratio 16:9 (1280×720px). Supports JPG, PNG, or WebP up to 5MB.
          </p>
        </div>

        {/* Section 1: Campaign Details */}
        <div className="space-y-4 pt-4 border-t border-black/[0.08]">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-steel">
            1. Campaign Details
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Campaign Name <span className="text-brand-blue">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Founders Podcast Episode #24 Viral Clips"
              required
              className="rounded-xl border-black/15 text-sm focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                Content Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-black/15 bg-white text-sm text-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
              >
                {getAvailableCampaignCategories().map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                Target Platform <span className="text-brand-blue">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setPlatform("Instagram")}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    platform === "Instagram"
                      ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
                      : "bg-black/[0.02] border-black/10 text-slate hover:bg-black/[0.04]"
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("YouTube")}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    platform === "YouTube"
                      ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
                      : "bg-black/[0.02] border-black/10 text-slate hover:bg-black/[0.04]"
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5" />
                  YouTube
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Campaign Description / Context
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the footage themes, highlighted speakers, high-energy moments, and hook recommendations..."
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-black/15 bg-white text-ink placeholder:text-steel focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Section 2: Source Asset & Performance Benchmarks */}
        <div className="space-y-4 pt-4 border-t border-black/[0.08]">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-steel">
            2. Source Video & Payout Benchmarks
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Long-form Source Video Link / Cloud Drive URL <span className="text-brand-blue">*</span>
            </label>
            <div className="relative">
              <Input
                type="url"
                value={sourceVideoLink}
                onChange={(e) => setSourceVideoLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or Google Drive / Dropbox link"
                required
                className="rounded-xl border-black/15 pl-9 text-sm focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
              <Link2 className="w-4 h-4 text-steel absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-steel">
              Editors will download footage from this source link to cut short-form clips. Ensure public/view permissions are enabled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-ink">
                  View Threshold (Payout Benchmark)
                </label>
                <span className="font-mono text-[11px] font-semibold text-brand-blue">
                  Multiples of 1,000
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step={1000}
                  min={1000}
                  value={displayViewThreshold}
                  onChange={handleViewThresholdChange}
                  onBlur={handleViewThresholdBlur}
                  placeholder="e.g. 1000"
                  className="rounded-xl border-black/15 pl-9 font-mono tabular-nums text-sm focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                />
                <TrendingUp className="w-4 h-4 text-steel absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-steel">
                Minimum views a clip must hit before payout is unlocked (min 1,000 views).
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-ink">
                  CPV per 1,000 Views (₹)
                </label>
                <span className="font-mono text-[11px] font-semibold text-brand-blue">
                  Multiples of ₹100
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step={100}
                  min={100}
                  value={displayCpv}
                  onChange={handleCpvChange}
                  onBlur={handleCpvBlur}
                  placeholder="e.g. 100"
                  className="rounded-xl border-black/15 pl-9 font-mono tabular-nums text-sm focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                />
                <Coins className="w-4 h-4 text-steel absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-steel">
                Rate paid to editors per 1,000 verified views achieved.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Custom Clipping Instructions & Rules */}
        <div className="space-y-4 pt-4 border-t border-black/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-steel">
              3. Clipping Instructions & Rules
            </h3>
            <span className="font-mono text-[11px] text-steel tabular-nums">
              {rules.length} rule{rules.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-black/[0.02] p-4 rounded-xl border border-black/[0.08] space-y-2.5">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-steel w-5 shrink-0 text-center tabular-nums">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleUpdateRule(index, e.target.value)}
                  placeholder={`Rule #${index + 1}...`}
                  className="flex-1 border border-black/15 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white text-ink placeholder:text-steel focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
                />
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-1.5 text-steel hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150 cursor-pointer"
                    title="Remove rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRule}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10 px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Section 4: Schedule & Advanced Rules */}
        <div className="space-y-4 pt-4 border-t border-black/[0.08]">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-steel">
            4. Schedule & Advanced Rules
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Campaign Deadline <span className="text-brand-blue">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                min={todayStr}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="rounded-xl border-black/15 pl-9 font-mono text-sm focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
              <Calendar className="w-4 h-4 text-steel absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-steel">
              Deadline date after which clip submissions will close.
            </p>
          </div>

          {/* Optional Advanced Accordion */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-ink hover:bg-black/[0.02] transition-colors duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-brand-blue" />
                Advanced Tags & Audio Rules (Optional)
              </span>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-steel" />
              ) : (
                <ChevronDown className="w-4 h-4 text-steel" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-4 bg-[#fafafb] border-t border-black/[0.08] space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate">
                    Mandatory Hashtags
                  </label>
                  <Input
                    type="text"
                    value={hashtag}
                    onChange={(e) => setHashtag(e.target.value)}
                    placeholder="#ClippingCampaign #ViralPodcast #Highlight"
                    className="rounded-lg border-black/15 text-xs bg-white focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate">
                    Audio / Track Directives
                  </label>
                  <Input
                    type="text"
                    value={audio}
                    onChange={(e) => setAudio(e.target.value)}
                    placeholder="e.g. Original speaker audio or trending background music"
                    className="rounded-lg border-black/15 text-xs bg-white focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-black/[0.08] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ? onCancel : () => navigate("/brand/dashboard")}
            disabled={loading}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="brand"
            disabled={loading}
            className="w-full sm:w-auto text-xs"
          >
            {loading ? "Launching Campaign..." : "Launch Clipping Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClippingCampaignBuilder;
