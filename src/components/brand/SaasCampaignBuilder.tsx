import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { uploadCampaignImage } from "@/lib/api";
import { compressImage } from "@/utils/imageCompression";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import {
  Megaphone,
  Calendar,
  Coins,
  UserCheck,
  Layers,
  HelpCircle,
  Info,
  Globe,
} from "lucide-react";

interface SaasCampaignBuilderProps {
  products: any[];
  onCancel: () => void;
  onSubmit: (campaignData: any) => Promise<void>;
  submitting: boolean;
  brandWebsiteUrl?: string;
}

export const SaasCampaignBuilder: React.FC<SaasCampaignBuilderProps> = ({
  products,
  onCancel,
  onSubmit,
  submitting,
  brandWebsiteUrl = ""
}) => {
  const { toast } = useToast();
  
  // Section 1: Campaign details
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState(brandWebsiteUrl);

  useEffect(() => {
    if (brandWebsiteUrl && !landingPageUrl) {
      setLandingPageUrl(brandWebsiteUrl);
    }
  }, [brandWebsiteUrl]);

  // Section 2: Budget & Commission related
  const [weeklyActive, setWeeklyActive] = useState(false);
  const [weeklyCommType, setWeeklyCommType] = useState<"percentage" | "fixed">("percentage");
  const [weeklyCommValue, setWeeklyCommValue] = useState("");

  const [monthlyActive, setMonthlyActive] = useState(true); // Default active
  const [monthlyCommType, setMonthlyCommType] = useState<"percentage" | "fixed">("percentage");
  const [monthlyCommValue, setMonthlyCommValue] = useState("");

  const [yearlyActive, setYearlyActive] = useState(true); // Default active
  const [yearlyCommType, setYearlyCommType] = useState<"percentage" | "fixed">("percentage");
  const [yearlyCommValue, setYearlyCommValue] = useState("");

  const [recurringCommission, setRecurringCommission] = useState(false);
  const [recurringLimit, setRecurringLimit] = useState("");

  // Section 3: Campaign criteria (follower count)
  const [minFollowers, setMinFollowers] = useState("");
  const [platformFocus, setPlatformFocus] = useState("Instagram");

  // Section 4: Schedule & associated plans
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [deadline, setDeadline] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !deadline) {
      toast({ 
        title: "Validation Error", 
        description: "Campaign Name and Deadline are required.", 
        variant: "destructive" 
      });
      return;
    }

    if (!landingPageUrl.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Landing Page URL is required for SaaS campaigns.", 
        variant: "destructive" 
      });
      return;
    }

    // Domain validation helper
    const getDomain = (urlStr: string): string => {
      if (!urlStr) return "";
      let formatted = urlStr.trim();
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = "https://" + formatted;
      }
      try {
        const parsed = new URL(formatted);
        let netloc = parsed.hostname || parsed.pathname;
        if (netloc.includes(":")) {
          netloc = netloc.split(":")[0];
        }
        netloc = netloc.toLowerCase();
        if (netloc.startsWith("www.")) {
          netloc = netloc.substring(4);
        }
        return netloc;
      } catch {
        return "";
      }
    };

    const brandDomain = getDomain(brandWebsiteUrl || "");
    const campaignDomain = getDomain(landingPageUrl);

    if (!brandDomain) {
      toast({
        title: "Profile Warning",
        description: "Your brand profile is missing a website. Please update your brand profile first.",
        variant: "destructive"
      });
      return;
    }

    if (!campaignDomain) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid landing page URL.",
        variant: "destructive"
      });
      return;
    }

    if (campaignDomain !== brandDomain && !campaignDomain.endsWith("." + brandDomain)) {
      toast({
        title: "Domain Validation Error",
        description: `Campaign landing page URL domain (${campaignDomain}) must match or be a subdomain of your verified website domain (${brandDomain}).`,
        variant: "destructive"
      });
      return;
    }

    // Build the commission schedule
    const commissionSchedule: Record<string, { type: "percentage" | "fixed"; value: number }> = {};
    if (weeklyActive && weeklyCommValue) {
      commissionSchedule["weekly"] = {
        type: weeklyCommType,
        value: parseFloat(weeklyCommValue)
      };
    }
    if (monthlyActive && monthlyCommValue) {
      commissionSchedule["monthly"] = {
        type: monthlyCommType,
        value: parseFloat(monthlyCommValue)
      };
    }
    if (yearlyActive && yearlyCommValue) {
      commissionSchedule["yearly"] = {
        type: yearlyCommType,
        value: parseFloat(yearlyCommValue)
      };
    }

    const scheduleEntries = Object.values(commissionSchedule);
    if (scheduleEntries.length === 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please specify at least one commission rate for Weekly, Monthly, or Yearly billing intervals.", 
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = "";
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          finalImageUrl = await uploadCampaignImage(compressed);
        } catch {
          toast({ 
            title: "Upload Error", 
            description: "Failed to compress or upload cover image.", 
            variant: "destructive" 
          });
          setUploading(false);
          return;
        }
      }

      const campaignData = {
        name,
        description: desc,
        image_url: finalImageUrl || undefined,
        landing_page_url: landingPageUrl,
        start_date: startDate,
        deadline,
        commission_type: monthlyActive && monthlyCommValue ? monthlyCommType : scheduleEntries[0].type,
        commission_value: monthlyActive && monthlyCommValue ? parseFloat(monthlyCommValue) : scheduleEntries[0].value,
        campaign_type: "saas_subscription",
        commission_schedule: commissionSchedule,
        recurring_commission: recurringCommission,
        recurring_commission_limit: recurringCommission && recurringLimit ? parseInt(recurringLimit) : null,
        creator_requirements: {
          min_followers: minFollowers ? parseInt(minFollowers) : 0,
          platform: platformFocus
        },
        product_ids: selectedProductIds
      };

      await onSubmit(campaignData);
    } finally {
      setUploading(false);
    }
  };

  const toggleProductSelect = (id: number) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header Banner */}
      <div className="bg-[#fafafb] border-b border-black/[0.08] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue rounded-xl shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
              SaaS Affiliate Campaign
            </h3>
            <p className="text-slate text-xs mt-0.5">
              Launch recursive, interval-based commission models for your software subscribers.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-7 max-h-[75vh] overflow-y-auto">
        {/* SECTION 1: General Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.08]">
            <Megaphone className="w-4 h-4 text-brand-blue" />
            <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
              1. Campaign Name & Cover
            </h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                Campaign Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Pro Plan Affiliate Boost"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border-black/15 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
            </div>

            <div className="space-y-1.5">
              <ImageCropInput
                value={imagePreview || ""}
                onChange={(file, previewUrl) => {
                  setImagePreview(previewUrl);
                  setImageFile(file);
                }}
                disabled={submitting || uploading}
                aspectRatio="16:9"
                accent="brand"
                label="Campaign Cover Image"
                placeholder="Upload a high-quality campaign cover image"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
              Campaign Landing Page URL
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. https://mysoftware.com/pricing"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                required
                className="rounded-xl border-black/15 pl-8 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
              <Globe className="w-4 h-4 text-steel absolute left-2.5 top-3" />
            </div>
            {brandWebsiteUrl && (
              <p className="text-[11px] text-steel mt-1">
                Must match or be a subdomain of your verified website:{" "}
                <span className="font-semibold text-brand-blue">{brandWebsiteUrl}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
              Campaign Description
            </label>
            <textarea
              placeholder="Provide information on how creators should promote your software, key messaging, and payout policies..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full min-h-[80px] text-sm p-3 rounded-xl border border-black/15 bg-white text-ink placeholder:text-steel focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
            />
          </div>
        </div>

        {/* SECTION 2: Budget & Commission Related */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.08]">
            <Coins className="w-4 h-4 text-brand-blue" />
            <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
              2. Commission Model & Intervals
            </h4>
          </div>

          {/* Pricing Intervals */}
          <div className="space-y-3">
            <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
              Commission Schedule Rates
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Weekly Interval */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors duration-150 ${
                  weeklyActive
                    ? "bg-brand-blue/[0.05] border-brand-blue/35"
                    : "bg-black/[0.02] border-black/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="weeklyActive"
                      checked={weeklyActive}
                      onChange={(e) => setWeeklyActive(e.target.checked)}
                      className="w-4 h-4 accent-[#2b5ce6] border-black/20 rounded focus:ring-brand-blue cursor-pointer"
                    />
                    <label htmlFor="weeklyActive" className="text-xs font-bold text-ink cursor-pointer">
                      Weekly Subscriptions
                    </label>
                  </div>

                  {weeklyActive && (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 px-2 rounded-lg border border-black/15 bg-white text-xs text-ink focus:outline-none focus:border-brand-blue"
                        value={weeklyCommType}
                        onChange={(e) => setWeeklyCommType(e.target.value as "percentage" | "fixed")}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={weeklyCommValue}
                        onChange={(e) => setWeeklyCommValue(e.target.value)}
                        className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                        required={weeklyActive}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Interval */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors duration-150 ${
                  monthlyActive
                    ? "bg-brand-blue/[0.05] border-brand-blue/35"
                    : "bg-black/[0.02] border-black/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="monthlyActive"
                      checked={monthlyActive}
                      onChange={(e) => setMonthlyActive(e.target.checked)}
                      className="w-4 h-4 accent-[#2b5ce6] border-black/20 rounded focus:ring-brand-blue cursor-pointer"
                    />
                    <label htmlFor="monthlyActive" className="text-xs font-bold text-ink cursor-pointer">
                      Monthly Subscriptions
                    </label>
                  </div>

                  {monthlyActive && (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 px-2 rounded-lg border border-black/15 bg-white text-xs text-ink focus:outline-none focus:border-brand-blue"
                        value={monthlyCommType}
                        onChange={(e) => setMonthlyCommType(e.target.value as "percentage" | "fixed")}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={monthlyCommValue}
                        onChange={(e) => setMonthlyCommValue(e.target.value)}
                        className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                        required={monthlyActive}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Yearly Interval */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors duration-150 ${
                  yearlyActive
                    ? "bg-brand-blue/[0.05] border-brand-blue/35"
                    : "bg-black/[0.02] border-black/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="yearlyActive"
                      checked={yearlyActive}
                      onChange={(e) => setYearlyActive(e.target.checked)}
                      className="w-4 h-4 accent-[#2b5ce6] border-black/20 rounded focus:ring-brand-blue cursor-pointer"
                    />
                    <label htmlFor="yearlyActive" className="text-xs font-bold text-ink cursor-pointer">
                      Yearly Subscriptions
                    </label>
                  </div>

                  {yearlyActive && (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 px-2 rounded-lg border border-black/15 bg-white text-xs text-ink focus:outline-none focus:border-brand-blue"
                        value={yearlyCommType}
                        onChange={(e) => setYearlyCommType(e.target.value as "percentage" | "fixed")}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={yearlyCommValue}
                        onChange={(e) => setYearlyCommValue(e.target.value)}
                        className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                        required={yearlyActive}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Commission Setup */}
          <div className="bg-black/[0.02] p-4 border border-black/[0.08] rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="recurringCommission"
                checked={recurringCommission}
                onChange={(e) => setRecurringCommission(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#2b5ce6] border-black/20 rounded focus:ring-brand-blue cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="recurringCommission" className="text-xs font-bold text-ink block cursor-pointer">
                  Recurring Commissions
                </label>
                <span className="text-[11px] text-steel mt-0.5 block">
                  Enable this if you want creators to receive commission on subscription renewals, rather than just the initial sign-up transaction.
                </span>
              </div>
            </div>

            {recurringCommission && (
              <div className="pl-5 sm:pl-7 space-y-2 border-l-2 border-brand-blue/35">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate">Stop payouts after</span>
                  <Input
                    type="number"
                    placeholder="e.g. 12"
                    value={recurringLimit}
                    onChange={(e) => setRecurringLimit(e.target.value)}
                    className="w-20 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                  />
                  <span className="text-xs text-slate">renewals</span>
                  <span
                    title="Leave empty for unlimited lifetime commission payouts."
                    className="inline-flex cursor-help"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-steel" />
                  </span>
                </div>
                <p className="text-[11px] text-steel">
                  Example: Set to 12 if you only want to pay commission for the subscriber's first year.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Campaign Criteria */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.08]">
            <UserCheck className="w-4 h-4 text-brand-blue" />
            <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
              3. Creator Application Criteria
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                Minimum Follower Count
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                className="rounded-xl border-black/15 font-mono tabular-nums focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                Platform Focus
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-black/15 bg-white text-sm text-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
                value={platformFocus}
                onChange={(e) => setPlatformFocus(e.target.value)}
              >
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="All">All Platforms</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: Schedule & Associated Plans */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.08]">
            <Layers className="w-4 h-4 text-brand-blue" />
            <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
              4. Schedule & Associated SaaS Plans
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="rounded-xl border-black/15 pl-8 font-mono focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                />
                <Calendar className="w-4 h-4 text-steel absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                End Date (Deadline)
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="rounded-xl border-black/15 pl-8 font-mono focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                />
                <Calendar className="w-4 h-4 text-steel absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Product Picker */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] font-bold text-steel uppercase tracking-wider flex items-center gap-1.5">
              Select Associated Subscription Plans
              <span
                title="Only conversions corresponding to these plans will map to this campaign."
                className="inline-flex cursor-help"
              >
                <Info className="w-3.5 h-3.5 text-steel" />
              </span>
            </label>
            {products.length === 0 ? (
              <p className="text-xs text-steel bg-black/[0.02] p-3 rounded-lg border border-dashed border-black/15">
                Optional: No specific subscription plans mapped. The campaign will track and apply commission rates to all subscription events received from your verified domain.
              </p>
            ) : (
              <div className="border border-black/10 rounded-xl p-3 max-h-[150px] overflow-y-auto space-y-2 bg-black/[0.02]">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => toggleProductSelect(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors duration-150 text-xs ${
                      selectedProductIds.includes(p.id)
                        ? "bg-brand-blue/10 border-brand-blue/35 text-ink font-semibold"
                        : "bg-white border-black/10 text-ink hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="font-mono font-bold tabular-nums shrink-0">₹{p.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t border-black/[0.08]">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting || uploading}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="brand"
            disabled={submitting || uploading}
            className="w-full sm:w-auto text-xs"
          >
            {uploading ? "Uploading Cover..." : submitting ? "Launching..." : "Launch SaaS Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
};
