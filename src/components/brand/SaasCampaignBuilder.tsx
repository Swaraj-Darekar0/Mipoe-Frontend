import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Megaphone, 
  Calendar, 
  Coins, 
  UserCheck, 
  Layers, 
  Image as ImageIcon, 
  HelpCircle,
  Sparkles,
  Info,
  Globe
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
  const [imageUrl, setImageUrl] = useState("");
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
      } catch (e) {
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
    const commissionSchedule: any = {};
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

    if (Object.keys(commissionSchedule).length === 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please specify at least one commission rate for Weekly, Monthly, or Yearly billing intervals.", 
        variant: "destructive" 
      });
      return;
    }

    const campaignData = {
      name,
      description: desc,
      image_url: imageUrl || undefined,
      landing_page_url: landingPageUrl,
      start_date: startDate,
      deadline,
      commission_type: monthlyActive ? monthlyCommType : Object.values(commissionSchedule)[0].type, // Fallback
      commission_value: monthlyActive ? parseFloat(monthlyCommValue) : Object.values(commissionSchedule)[0].value, // Fallback
      campaign_type: "saas_subscription",
      commissionSchedule,
      recurring_commission: recurringCommission,
      recurring_commission_limit: recurringCommission && recurringLimit ? parseInt(recurringLimit) : null,
      creator_requirements: {
        min_followers: minFollowers ? parseInt(minFollowers) : 0,
        platform: platformFocus
      },
      product_ids: selectedProductIds
    };

    await onSubmit(campaignData);
  };

  const toggleProductSelect = (id: number) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden max-w-2xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/10 backdrop-blur-md rounded-xl">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">SaaS Affiliate Campaign</h3>
            <p className="text-white/80 text-xs mt-0.5">Launch recursive, interval-based commission models for your software subscribers.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
        
        {/* SECTION 1: General Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Megaphone className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">1. Campaign Name & Cover</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Campaign Name</label>
              <Input
                type="text"
                placeholder="e.g. Pro Plan Affiliate Boost"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cover Image URL</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl border-gray-200 pl-8"
                />
                <ImageIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Campaign Landing Page URL</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. https://mysoftware.com/pricing"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                required
                className="rounded-xl border-gray-200 pl-8 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <Globe className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
            </div>
            {brandWebsiteUrl && (
              <p className="text-[10px] text-gray-400 mt-1 italic">
                Must match or be a subdomain of your verified website: <span className="font-semibold text-indigo-600">{brandWebsiteUrl}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Campaign Description</label>
            <textarea
              placeholder="Provide information on how creators should promote your software, key messaging, and payout policies..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full min-h-[80px] text-sm p-3 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* SECTION 2: Budget & Commission Related */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Coins className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">2. Commission Model & Intervals</h4>
          </div>

          {/* Pricing Intervals */}
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Commission Schedule Rates</label>
            
            <div className="grid grid-cols-1 gap-3">
              
              {/* Weekly Interval */}
              <div className={`p-4 rounded-xl border transition ${weeklyActive ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50/50 border-gray-150'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="weeklyActive"
                      checked={weeklyActive}
                      onChange={(e) => setWeeklyActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="weeklyActive" className="text-xs font-bold text-gray-700 cursor-pointer">Weekly Subscriptions</label>
                  </div>
                  
                  {weeklyActive && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                      <select
                        className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs"
                        value={weeklyCommType}
                        onChange={(e) => setWeeklyCommType(e.target.value as any)}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={weeklyCommValue}
                        onChange={(e) => setWeeklyCommValue(e.target.value)}
                        className="w-20 h-8 text-xs rounded-lg"
                        required={weeklyActive}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Interval */}
              <div className={`p-4 rounded-xl border transition ${monthlyActive ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50/50 border-gray-150'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="monthlyActive"
                      checked={monthlyActive}
                      onChange={(e) => setMonthlyActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="monthlyActive" className="text-xs font-bold text-gray-700 cursor-pointer">Monthly Subscriptions</label>
                  </div>
                  
                  {monthlyActive && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                      <select
                        className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs"
                        value={monthlyCommType}
                        onChange={(e) => setMonthlyCommType(e.target.value as any)}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={monthlyCommValue}
                        onChange={(e) => setMonthlyCommValue(e.target.value)}
                        className="w-20 h-8 text-xs rounded-lg"
                        required={monthlyActive}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Yearly Interval */}
              <div className={`p-4 rounded-xl border transition ${yearlyActive ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50/50 border-gray-150'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="yearlyActive"
                      checked={yearlyActive}
                      onChange={(e) => setYearlyActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="yearlyActive" className="text-xs font-bold text-gray-700 cursor-pointer">Yearly Subscriptions</label>
                  </div>
                  
                  {yearlyActive && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                      <select
                        className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs"
                        value={yearlyCommType}
                        onChange={(e) => setYearlyCommType(e.target.value as any)}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={yearlyCommValue}
                        onChange={(e) => setYearlyCommValue(e.target.value)}
                        className="w-20 h-8 text-xs rounded-lg"
                        required={yearlyActive}
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Recurring Commission Setup */}
          <div className="bg-gray-50 p-4 border border-gray-150 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="recurringCommission"
                checked={recurringCommission}
                onChange={(e) => setRecurringCommission(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <label htmlFor="recurringCommission" className="text-xs font-bold text-gray-700 block cursor-pointer">Recurring Commissions</label>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Enable this if you want creators to receive commission on subscription renewals, rather than just the initial sign-up transaction.</span>
              </div>
            </div>

            {recurringCommission && (
              <div className="pl-7 space-y-2 border-l-2 border-indigo-200 animate-in slide-in-from-left-2 duration-250">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Stop payouts after</span>
                  <Input
                    type="number"
                    placeholder="e.g. 12"
                    value={recurringLimit}
                    onChange={(e) => setRecurringLimit(e.target.value)}
                    className="w-20 h-8 text-xs rounded-lg"
                  />
                  <span className="text-xs text-gray-600">renewals</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" title="Leave empty for unlimited lifetime commission payouts." />
                </div>
                <p className="text-[9px] text-gray-400 italic">Example: Set to 12 if you only want to pay commission for the subscriber's first year.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Campaign Criteria */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <UserCheck className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">3. Creator Application Criteria</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Minimum Follower Count</label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Platform Focus</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Layers className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">4. Schedule & Associated SaaS Plans</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="rounded-xl border-gray-200 pl-8"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">End Date (Deadline)</label>
              <div className="relative">
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="rounded-xl border-gray-200 pl-8"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Product Picker */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              Select Associated Subscription Plans
              <Info className="w-3 h-3 text-gray-400" title="Only conversions corresponding to these plans will map to this campaign." />
            </label>
            {products.length === 0 ? (
              <p className="text-xs text-gray-405 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                Optional: No specific subscription plans mapped. The campaign will track and apply commission rates to all subscription events received from your verified domain.
              </p>
            ) : (
              <div className="border border-gray-200 rounded-xl p-3 max-h-[150px] overflow-y-auto space-y-2 bg-gray-50/50">
                {products.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => toggleProductSelect(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition text-xs ${
                      selectedProductIds.includes(p.id)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="font-bold">₹{p.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
          >
            {submitting ? "Launching..." : "Launch SaaS Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
};
