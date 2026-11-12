import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BrandLayout from "@/layouts/BrandLayout";
import AffiliateCampaignSidebar from "@/components/brand/AffiliateCampaignSidebar";
import {
  getAffiliateCampaignDetails,
  getBrandConversions,
  reviewCreatorAffiliateApplication,
  allocateAffiliateBudget,
  reclaimAffiliateBudget,
  getWalletBalance,
  getBrandProducts,
  getBrandProfile,
  updateAffiliateCampaign,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PortalPageHeader,
  MetricCell,
  StatusPill,
} from "@/components/ui/PortalPrimitives";
import {
  Loader2,
  Coins,
  User,
  Layers,
  UserCheck,
  ExternalLink,
  Info,
  Calendar,
  CheckCircle,
} from "lucide-react";

export const BrandAffiliateCampaignAnalytics: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<any | null>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

  // Budget management
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAction, setBudgetAction] = useState<"allocate" | "reclaim">("allocate");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [submittingBudget, setSubmittingBudget] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "partners">("overview");

  // Brand and Catalog data
  const [brandProfile, setBrandProfile] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editLandingPageUrl, setEditLandingPageUrl] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editMinFollowers, setEditMinFollowers] = useState("");
  const [editCommissionType, setEditCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [editCommissionValue, setEditCommissionValue] = useState("");
  
  // SaaS commission schedule rates
  const [weeklyCommType, setWeeklyCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [weeklyCommValue, setWeeklyCommValue] = useState("");
  const [weeklyActive, setWeeklyActive] = useState(false);

  const [monthlyCommType, setMonthlyCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [monthlyCommValue, setMonthlyCommValue] = useState("");
  const [monthlyActive, setMonthlyActive] = useState(false);

  const [yearlyCommType, setYearlyCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [yearlyCommValue, setYearlyCommValue] = useState("");
  const [yearlyActive, setYearlyActive] = useState(false);

  const [editRecurringCommission, setEditRecurringCommission] = useState(false);
  const [editRecurringLimit, setEditRecurringLimit] = useState("");

  const [editSelectedProductIds, setEditSelectedProductIds] = useState<number[]>([]);

  // Sync selected partner on campaign update
  useEffect(() => {
    if (campaign && campaign.partners && campaign.partners.length > 0) {
      const allPartners = campaign.partners;
      if (!selectedPartner) {
        const pending = allPartners.filter((p: any) => p.status === "applied");
        if (pending.length > 0) {
          setSelectedPartner(pending[0]);
        } else {
          setSelectedPartner(allPartners[0]);
        }
      } else {
        const updated = allPartners.find((p: any) => p.creator_id === selectedPartner.creator_id);
        if (updated) {
          setSelectedPartner(updated);
        } else {
          setSelectedPartner(allPartners[0]);
        }
      }
    } else {
      setSelectedPartner(null);
    }
  }, [campaign]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const id = Number(campaignId);
      const [campDetails, brandConversions, walletData, prodData, brandProf] = await Promise.all([
        getAffiliateCampaignDetails(id),
        getBrandConversions(),
        getWalletBalance(),
        getBrandProducts(),
        getBrandProfile()
      ]);

      setCampaign(campDetails);
      setWalletBalance(walletData.balance);
      setProducts(prodData);
      setBrandProfile(brandProf);

      // Filter conversions for this campaign
      const campaignConversions = brandConversions.filter(c => c.campaign_id === id);
      setConversions(campaignConversions);

    } catch (err: any) {
      toast({
        title: "Load Error",
        description: err.message || "Failed to load campaign analytics.",
        variant: "destructive"
      });
      navigate("/brand/dashboard");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [campaignId, navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startEditing = () => {
    if (!campaign) return;
    setEditName(campaign.name || "");
    setEditDesc(campaign.description || "");
    setEditImageUrl(campaign.image_url || "");
    setEditLandingPageUrl(campaign.landing_page_url || "");
    
    // Dates format for input date type is YYYY-MM-DD
    setEditStartDate(campaign.start_date ? campaign.start_date.split("T")[0] : "");
    setEditDeadline(campaign.deadline ? campaign.deadline.split("T")[0] : "");
    
    setEditMinFollowers(campaign.creator_requirements?.min_followers?.toString() || "0");
    setEditCommissionType(campaign.commission_type || "percentage");
    setEditCommissionValue(campaign.commission_value?.toString() || "");

    // SaaS Schedule
    const sched = campaign.commission_schedule || {};
    if (sched.weekly) {
      setWeeklyActive(true);
      setWeeklyCommType(sched.weekly.type);
      setWeeklyCommValue(sched.weekly.value.toString());
    } else {
      setWeeklyActive(false);
      setWeeklyCommType("percentage");
      setWeeklyCommValue("");
    }

    if (sched.monthly) {
      setMonthlyActive(true);
      setMonthlyCommType(sched.monthly.type);
      setMonthlyCommValue(sched.monthly.value.toString());
    } else {
      setMonthlyActive(false);
      setMonthlyCommType("percentage");
      setMonthlyCommValue("");
    }

    if (sched.yearly) {
      setYearlyActive(true);
      setYearlyCommType(sched.yearly.type);
      setYearlyCommValue(sched.yearly.value.toString());
    } else {
      setYearlyActive(false);
      setYearlyCommType("percentage");
      setYearlyCommValue("");
    }

    setEditRecurringCommission(campaign.recurring_commission || false);
    setEditRecurringLimit(campaign.recurring_commission_limit?.toString() || "");

    const mappedProdIds = campaign.products ? campaign.products.map((p: any) => p.id) : [];
    setEditSelectedProductIds(mappedProdIds);

    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    if (!editName.trim()) {
      toast({ title: "Validation Error", description: "Campaign name is required.", variant: "destructive" });
      return;
    }

    if (!editStartDate || !editDeadline) {
      toast({ title: "Validation Error", description: "Start and end dates are required.", variant: "destructive" });
      return;
    }

    if (new Date(editDeadline) <= new Date(editStartDate)) {
      toast({ title: "Validation Error", description: "End date must be after start date.", variant: "destructive" });
      return;
    }

    // Build SaaS schedule payload
    const commission_schedule: Record<string, { type: "percentage" | "fixed"; value: number }> = {};
    if (isSaas) {
      if (weeklyActive && weeklyCommValue) {
        commission_schedule["weekly"] = {
          type: weeklyCommType,
          value: parseFloat(weeklyCommValue)
        };
      }
      if (monthlyActive && monthlyCommValue) {
        commission_schedule["monthly"] = {
          type: monthlyCommType,
          value: parseFloat(monthlyCommValue)
        };
      }
      if (yearlyActive && yearlyCommValue) {
        commission_schedule["yearly"] = {
          type: yearlyCommType,
          value: parseFloat(yearlyCommValue)
        };
      }

      if (Object.keys(commission_schedule).length === 0) {
        toast({ 
          title: "Validation Error", 
          description: "Please specify at least one commission rate for Weekly, Monthly, or Yearly billing intervals.", 
          variant: "destructive" 
        });
        return;
      }
    }

    // Domain validation helper
    const getDomain = (urlStr: string): string => {
      if (!urlStr) return "";
      let temp = urlStr;
      if (!temp.startsWith("http://") && !temp.startsWith("https://")) {
        temp = "https://" + temp;
      }
      try {
        const parsed = new URL(temp);
        let hostname = parsed.hostname;
        if (hostname.startsWith("www.")) {
          hostname = hostname.substring(4);
        }
        return hostname.toLowerCase();
      } catch (err) {
        return "";
      }
    };

    // Domain validation for SaaS brands
    if (isSaas) {
      if (!editLandingPageUrl.trim()) {
        toast({ title: "Validation Error", description: "Landing page URL is required for SaaS campaigns.", variant: "destructive" });
        return;
      }

      const brandDomain = getDomain(brandProfile?.website_url || "");
      const campaignDomain = getDomain(editLandingPageUrl);

      if (!brandDomain || !campaignDomain) {
        toast({ title: "Validation Error", description: "Invalid website or landing page URL format.", variant: "destructive" });
        return;
      }

      if (campaignDomain !== brandDomain && !campaignDomain.endsWith("." + brandDomain)) {
        toast({
          title: "Validation Error",
          description: `Campaign landing page URL domain (${campaignDomain}) must match or be a subdomain of your verified website domain (${brandDomain}).`,
          variant: "destructive"
        });
        return;
      }

      // Validate products domain
      for (const pId of editSelectedProductIds) {
        const prod = products.find(p => p.id === pId);
        if (prod && prod.product_url) {
          const prodDomain = getDomain(prod.product_url);
          if (prodDomain !== brandDomain && !prodDomain.endsWith("." + brandDomain)) {
            toast({
              title: "Validation Error",
              description: `Product plan URL domain (${prodDomain}) for product '${prod.name}' must match your verified website domain (${brandDomain}).`,
              variant: "destructive"
            });
            return;
          }
        }
      }
    }

    setSubmittingEdit(true);
    try {
      const payload: any = {
        name: editName,
        description: editDesc,
        image_url: editImageUrl || undefined,
        start_date: editStartDate,
        deadline: editDeadline,
        creator_requirements: {
          min_followers: editMinFollowers ? parseInt(editMinFollowers) : 0,
          platform: campaign.creator_requirements?.platform || "instagram"
        },
        product_ids: editSelectedProductIds
      };

      if (isSaas) {
        const scheduleEntries = Object.values(commission_schedule);
        payload.landing_page_url = editLandingPageUrl;
        payload.commission_schedule = commission_schedule;
        payload.recurring_commission = editRecurringCommission;
        payload.recurring_commission_limit = editRecurringCommission && editRecurringLimit ? parseInt(editRecurringLimit) : null;
        payload.commission_type = monthlyActive && monthlyCommValue ? monthlyCommType : scheduleEntries[0].type;
        payload.commission_value = monthlyActive && monthlyCommValue ? parseFloat(monthlyCommValue) : scheduleEntries[0].value;
      } else {
        payload.commission_type = editCommissionType;
        payload.commission_value = parseFloat(editCommissionValue) || 0;
      }

      await updateAffiliateCampaign(campaign.id, payload);
      toast({ title: "Changes Saved", description: "Your campaign changes have been updated successfully." });
      setIsEditing(false);
      await loadData(true);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message || "Failed to update campaign", variant: "destructive" });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const toggleProductSelect = (id: number) => {
    setEditSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleReviewCreator = async (creatorId: number, action: "approve" | "reject") => {
    setReviewingId(creatorId);
    try {
      await reviewCreatorAffiliateApplication(Number(campaignId), creatorId, action);
      toast({
        title: `Creator application ${action}d`,
        description: `Successfully processed application for this creator.`
      });
      await loadData(true);
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Could not review creator application.",
        variant: "destructive"
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation Error", description: "Invalid amount input.", variant: "destructive" });
      return;
    }

    setSubmittingBudget(true);
    try {
      if (budgetAction === "allocate") {
        if (walletBalance < amount) {
          toast({ title: "Error", description: "Insufficient wallet balance", variant: "destructive" });
          setSubmittingBudget(false);
          return;
        }
        await allocateAffiliateBudget(campaign.id, amount);
        toast({ title: "Budget Allocated", description: `Added ₹${amount} to campaign budget.` });
      } else {
        const available = campaign.funds_allocated - campaign.funds_distributed;
        if (available < amount) {
          toast({ title: "Error", description: "Cannot reclaim more than campaign's free budget.", variant: "destructive" });
          setSubmittingBudget(false);
          return;
        }
        await reclaimAffiliateBudget(campaign.id, amount);
        toast({ title: "Budget Reclaimed", description: `Returned ₹${amount} back to wallet.` });
      }
      
      setBudgetAmount("");
      setShowBudgetModal(false);
      await loadData(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Budget transaction failed.", variant: "destructive" });
    } finally {
      setSubmittingBudget(false);
    }
  };

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-steel">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading campaign stats & partners...</p>
        </div>
      </BrandLayout>
    );
  }

  if (!campaign) return null;

  // Math
  const freeBudget = campaign.funds_allocated - campaign.funds_distributed;
  const isSaas = campaign.campaign_type === "saas_subscription";
  const totalSales = conversions.length;
  const totalCommissionPaid = conversions.reduce((sum, c) => sum + c.commission_amount, 0);

  const partners = campaign.partners || [];
  const pendingPartners = partners.filter((p: any) => p.status === "applied");
  const approvedPartners = partners.filter((p: any) => p.status === "active");

  return (
    <BrandLayout
      sidebar={
        <AffiliateCampaignSidebar
          campaign={campaign}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingPartnersCount={pendingPartners.length}
        />
      }
    >
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow={isSaas ? "SAAS AFFILIATE PROGRAM" : "PRODUCT AFFILIATE PROGRAM"}
          title={campaign.name}
          afterTitle={
            <StatusPill tone={campaign.is_active ? "success" : "neutral"}>
              {campaign.is_active ? "Active" : "Draft"}
            </StatusPill>
          }
          subtitle={campaign.description || "No description provided."}
          accent="brand"
        />

        {/* Quick Wallet Budget Bar */}
        <div className="bg-white border border-black/10 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] text-steel font-bold block uppercase tracking-widest">
              Free Campaign Budget
            </span>
            <span className="font-mono font-bold text-xl text-ink tabular-nums block">
              ₹{freeBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBudgetAction("reclaim");
                setShowBudgetModal(true);
              }}
              disabled={freeBudget <= 0}
              className="text-xs h-8 flex-1 sm:flex-none"
            >
              Reclaim
            </Button>
            <Button
              size="sm"
              variant="brand"
              onClick={() => {
                setBudgetAction("allocate");
                setShowBudgetModal(true);
              }}
              className="text-xs h-8 flex-1 sm:flex-none"
            >
              Add Funds
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCell
            label="Allocated Funds"
            value={`₹${campaign.funds_allocated.toLocaleString()}`}
          />
          <MetricCell
            label="Distributed Payouts"
            value={`₹${campaign.funds_distributed.toLocaleString()}`}
          />
          <MetricCell
            label="Referred Conversions"
            value={totalSales}
            sublabel={`₹${totalCommissionPaid.toLocaleString()} paid`}
          />
          <MetricCell
            label="Approved Partners"
            value={approvedPartners.length}
          />
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          isEditing ? (
            <form
              onSubmit={handleEditSubmit}
              className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.08]">
                <div>
                  <h3 className="font-display font-bold text-ink text-base">Edit Campaign Settings</h3>
                  <p className="text-xs text-steel mt-0.5">
                    Modify campaign rules, criteria, mapping, and timelines.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={submittingEdit}
                    size="sm"
                    className="text-xs h-8"
                  >
                    {submittingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* General Info */}
              <div className="space-y-4">
                <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
                  General Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                      Campaign Name
                    </label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="rounded-xl border-black/15 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                      Cover Image URL
                    </label>
                    <Input
                      type="text"
                      placeholder="https://example.com/banner.jpg"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="rounded-xl border-black/15 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                    />
                  </div>
                </div>

                {isSaas && (
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                      Landing Page URL
                    </label>
                    <Input
                      type="text"
                      value={editLandingPageUrl}
                      onChange={(e) => setEditLandingPageUrl(e.target.value)}
                      required
                      className="rounded-xl border-black/15 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
                    />
                    {brandProfile?.website_url && (
                      <p className="text-[11px] text-steel">
                        Must match or be a subdomain of your verified website:{" "}
                        <span className="font-semibold text-brand-blue">{brandProfile.website_url}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                    Campaign Description & Guidelines
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full min-h-[100px] text-xs p-3 rounded-xl border border-black/15 bg-white text-ink placeholder:text-steel focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Commission Rules */}
              <div className="space-y-4 pt-4 border-t border-black/[0.08]">
                <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
                  Commission Rules
                </h4>
                {isSaas ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block font-mono text-[10px] font-bold text-slate uppercase tracking-wider">
                        Billing Interval Payouts
                      </label>

                      {/* Weekly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-black/[0.02] border border-black/10 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-weekly-active"
                            checked={weeklyActive}
                            onChange={(e) => setWeeklyActive(e.target.checked)}
                            className="w-4 h-4 accent-[#2b5ce6] rounded border-black/20 focus:ring-brand-blue cursor-pointer"
                          />
                          <label htmlFor="edit-weekly-active" className="text-xs font-bold text-ink cursor-pointer">
                            Weekly Plan
                          </label>
                        </div>
                        {weeklyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={weeklyCommType}
                              onChange={(e: any) => setWeeklyCommType(e.target.value)}
                              className="h-8 text-xs px-2 border border-black/15 rounded-lg bg-white text-ink focus:outline-none focus:border-brand-blue"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Flat (₹)</option>
                            </select>
                            <Input
                              type="number"
                              step="any"
                              value={weeklyCommValue}
                              onChange={(e) => setWeeklyCommValue(e.target.value)}
                              placeholder="Rate"
                              className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                            />
                          </div>
                        )}
                      </div>

                      {/* Monthly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-black/[0.02] border border-black/10 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-monthly-active"
                            checked={monthlyActive}
                            onChange={(e) => setMonthlyActive(e.target.checked)}
                            className="w-4 h-4 accent-[#2b5ce6] rounded border-black/20 focus:ring-brand-blue cursor-pointer"
                          />
                          <label htmlFor="edit-monthly-active" className="text-xs font-bold text-ink cursor-pointer">
                            Monthly Plan
                          </label>
                        </div>
                        {monthlyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={monthlyCommType}
                              onChange={(e: any) => setMonthlyCommType(e.target.value)}
                              className="h-8 text-xs px-2 border border-black/15 rounded-lg bg-white text-ink focus:outline-none focus:border-brand-blue"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Flat (₹)</option>
                            </select>
                            <Input
                              type="number"
                              step="any"
                              value={monthlyCommValue}
                              onChange={(e) => setMonthlyCommValue(e.target.value)}
                              placeholder="Rate"
                              className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                            />
                          </div>
                        )}
                      </div>

                      {/* Yearly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-black/[0.02] border border-black/10 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-yearly-active"
                            checked={yearlyActive}
                            onChange={(e) => setYearlyActive(e.target.checked)}
                            className="w-4 h-4 accent-[#2b5ce6] rounded border-black/20 focus:ring-brand-blue cursor-pointer"
                          />
                          <label htmlFor="edit-yearly-active" className="text-xs font-bold text-ink cursor-pointer">
                            Yearly Plan
                          </label>
                        </div>
                        {yearlyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={yearlyCommType}
                              onChange={(e: any) => setYearlyCommType(e.target.value)}
                              className="h-8 text-xs px-2 border border-black/15 rounded-lg bg-white text-ink focus:outline-none focus:border-brand-blue"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Flat (₹)</option>
                            </select>
                            <Input
                              type="number"
                              step="any"
                              value={yearlyCommValue}
                              onChange={(e) => setYearlyCommValue(e.target.value)}
                              placeholder="Rate"
                              className="w-24 h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-brand-blue/[0.05] border border-brand-blue/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-recurring-comm"
                          checked={editRecurringCommission}
                          onChange={(e) => setEditRecurringCommission(e.target.checked)}
                          className="w-4 h-4 accent-[#2b5ce6] rounded border-black/20 focus:ring-brand-blue cursor-pointer"
                        />
                        <label htmlFor="edit-recurring-comm" className="text-xs font-bold text-ink cursor-pointer">
                          Enable Recurring Commissions
                        </label>
                      </div>

                      {editRecurringCommission && (
                        <div className="space-y-1.5 max-w-xs pl-6">
                          <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                            Payment Cap Limit (Optional)
                          </label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={editRecurringLimit}
                            onChange={(e) => setEditRecurringLimit(e.target.value)}
                            className="h-8 text-xs font-mono tabular-nums rounded-lg border-black/15"
                          />
                          <p className="text-[11px] text-steel">
                            Leave blank for unlimited payouts per subscription lifetime.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                        Commission Type
                      </label>
                      <select
                        value={editCommissionType}
                        onChange={(e: any) => setEditCommissionType(e.target.value)}
                        className="text-xs px-3 border border-black/15 rounded-xl bg-white text-ink w-full h-10 focus:outline-none focus:border-brand-blue"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                        Commission Value
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={editCommissionValue}
                        onChange={(e) => setEditCommissionValue(e.target.value)}
                        required
                        className="rounded-xl border-black/15 font-mono tabular-nums h-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements & Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/[0.08]">
                <div className="space-y-3">
                  <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
                    Target & Criteria
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        required
                        className="rounded-xl border-black/15 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                        End Date (Deadline)
                      </label>
                      <Input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        required
                        className="rounded-xl border-black/15 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-mono text-[10px] font-bold text-steel uppercase tracking-wider">
                        Min Follower Criteria
                      </label>
                      <Input
                        type="number"
                        value={editMinFollowers}
                        onChange={(e) => setEditMinFollowers(e.target.value)}
                        className="rounded-xl border-black/15 font-mono tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono text-[11px] font-bold text-steel uppercase tracking-widest">
                    Mapped Store Products / Plans
                  </h4>
                  <p className="text-[11px] text-steel">
                    Select which products/plans this campaign applies to. If none are selected, all sales qualify.
                  </p>

                  {products.length === 0 ? (
                    <div className="p-4 bg-black/[0.02] border border-dashed border-black/15 rounded-xl text-center text-xs text-steel">
                      No products/plans found in your catalog. Please add products first.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-black/10 p-2.5 rounded-xl bg-white">
                      {products.map((p) => {
                        const isChecked = editSelectedProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 hover:bg-black/[0.02] rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                id={`edit-prod-${p.id}`}
                                checked={isChecked}
                                onChange={() => toggleProductSelect(p.id)}
                                className="w-4 h-4 accent-[#2b5ce6] rounded border-black/20 focus:ring-brand-blue cursor-pointer"
                              />
                              <label
                                htmlFor={`edit-prod-${p.id}`}
                                className="font-medium text-ink cursor-pointer truncate"
                              >
                                {p.name}
                              </label>
                            </div>
                            <span className="font-mono font-bold text-brand-blue tabular-nums shrink-0">
                              ₹{p.price}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-black/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  disabled={submittingEdit}
                  size="sm"
                  className="w-full sm:w-auto text-xs h-9 px-4"
                >
                  {submittingEdit ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Commission Rules */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-black/10 p-5 sm:p-6 rounded-2xl space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                      <Coins className="w-4 h-4 text-brand-blue" />
                      Commission Payout Structure
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                      className="text-xs h-8 text-brand-blue border-brand-blue/30 hover:bg-brand-blue/10 w-full sm:w-auto"
                    >
                      Edit Campaign Rules
                    </Button>
                  </div>

                  {isSaas && campaign.commission_schedule ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {Object.keys(campaign.commission_schedule).map((interval) => {
                          const data = campaign.commission_schedule[interval];
                          const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
                          return (
                            <div
                              key={interval}
                              className="bg-black/[0.03] border border-black/[0.06] p-4 rounded-xl"
                            >
                              <span className="font-mono text-[10px] text-steel font-bold block uppercase tracking-widest">
                                {interval} Plan
                              </span>
                              <span className="font-mono font-bold text-lg text-ink tabular-nums block mt-1">
                                {valStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {campaign.recurring_commission ? (
                        <div className="p-4 bg-brand-blue/[0.05] border border-brand-blue/20 rounded-xl flex gap-3 text-xs leading-relaxed text-slate">
                          <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-ink block">Recurring Commission Enabled</span>
                            <span className="block mt-0.5">
                              Creators receive commissions on every renewal checkout
                              {campaign.recurring_commission_limit
                                ? ` (capped up to ${campaign.recurring_commission_limit} payments).`
                                : "."}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-black/[0.02] border border-black/[0.08] rounded-xl flex gap-3 text-xs leading-relaxed text-slate">
                          <Info className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-ink block">One-time Commission Payout</span>
                            <span className="block mt-0.5">
                              Commissions are calculated and paid out only on the subscriber's initial sign-up checkout event.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-black/[0.03] border border-black/[0.06] p-4 rounded-xl text-xs">
                      <span className="font-mono text-[10px] text-steel font-bold uppercase tracking-widest block">
                        Flat Rate Conversion Payout
                      </span>
                      <span className="font-mono font-bold text-brand-blue block text-lg tabular-nums mt-1.5">
                        {campaign.commission_type === "percentage"
                          ? `${campaign.commission_value}% per sale`
                          : `₹${campaign.commission_value} flat per sale`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description guidelines */}
                <div className="bg-white border border-black/10 p-5 sm:p-6 rounded-2xl space-y-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <h3 className="font-display font-bold text-ink text-sm">
                    Campaign Terms & Instructions
                  </h3>
                  <div className="text-xs text-slate leading-relaxed whitespace-pre-wrap">
                    {campaign.description || "No custom instructions supplied."}
                  </div>
                </div>
              </div>

              {/* Right Column: Plans & Criteria info */}
              <div className="space-y-6">
                <div className="bg-white border border-black/10 p-5 sm:p-6 rounded-2xl space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <h3 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-blue" />
                    Mapped Plans / Products
                  </h3>

                  <div className="space-y-2">
                    {campaign.products && campaign.products.length > 0 ? (
                      campaign.products.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 bg-black/[0.02] border border-black/[0.08] rounded-xl flex justify-between items-center text-xs"
                        >
                          <span className="font-semibold text-ink truncate pr-2">{p.name}</span>
                          <span className="font-mono font-bold text-brand-blue tabular-nums shrink-0">
                            ₹{p.price}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-steel">
                        No plan mapping restrictions. All sales conversion events qualify.
                      </p>
                    )}
                  </div>
                </div>

                {/* Requirements & dates */}
                <div className="bg-white border border-black/10 p-5 sm:p-6 rounded-2xl space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                  <h3 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-blue" />
                    Timeline & Target
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                      <span className="text-steel">Start Date</span>
                      <span className="font-mono font-semibold text-ink tabular-nums">
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                      <span className="text-steel">End Date</span>
                      <span className="font-mono font-semibold text-ink tabular-nums">
                        {new Date(campaign.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-black/[0.06]">
                      <span className="text-steel">Min Follower Criteria</span>
                      <span className="font-mono font-semibold text-ink tabular-nums">
                        {campaign.creator_requirements?.min_followers
                          ? `${campaign.creator_requirements.min_followers.toLocaleString()}+`
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Partners Tab */}
        {activeTab === "partners" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Side: Tables List */}
            <div className="lg:col-span-2 space-y-6">
              {/* PENDING APPLICATIONS */}
              <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                <h3 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-blue" />
                  Pending Creator Applications ({pendingPartners.length})
                </h3>

                {pendingPartners.length === 0 ? (
                  <p className="text-xs text-steel bg-black/[0.02] p-4 rounded-xl border border-dashed border-black/15">
                    No pending creator applications for this program.
                  </p>
                ) : (
                  <>
                    {/* Mobile Cards (< md) */}
                    <div className="md:hidden space-y-3">
                      {pendingPartners.map((partner: any) => {
                        const isSelected = selectedPartner?.creator_id === partner.creator_id;
                        return (
                          <div
                            key={partner.creator_id}
                            onClick={() => setSelectedPartner(partner)}
                            className={`p-4 rounded-xl border transition-colors duration-150 space-y-3 cursor-pointer ${
                              isSelected
                                ? "bg-brand-blue/[0.05] border-brand-blue/35"
                                : "bg-black/[0.02] border-black/10"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-ink truncate">{partner.username}</p>
                                {partner.instagram_username ? (
                                  <a
                                    href={`https://instagram.com/${partner.instagram_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline mt-0.5"
                                  >
                                    @{partner.instagram_username}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-steel">Not Linked</span>
                                )}
                              </div>
                              <StatusPill tone="warning">Pending</StatusPill>
                            </div>
                            <div className="flex items-center justify-between text-xs text-steel pt-1 border-t border-black/[0.06]">
                              <span className="font-mono tabular-nums font-semibold text-ink">
                                {(partner.follower_count || 0).toLocaleString()} followers
                              </span>
                              <span className="font-mono text-[11px] tabular-nums">
                                {new Date(partner.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                disabled={reviewingId === partner.creator_id}
                                className="flex-1 h-8 text-xs text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReviewCreator(partner.creator_id, "approve")}
                                disabled={reviewingId === partner.creator_id}
                                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table (>= md) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.08] font-mono text-[10px] text-steel font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Creator Name</th>
                            <th className="py-3 px-4">Instagram Profile</th>
                            <th className="py-3 px-4">Followers</th>
                            <th className="py-3 px-4">Applied Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] text-ink">
                          {pendingPartners.map((partner: any) => {
                            const isSelected = selectedPartner?.creator_id === partner.creator_id;
                            return (
                              <tr
                                key={partner.creator_id}
                                onClick={() => setSelectedPartner(partner)}
                                className={`cursor-pointer transition-colors duration-150 ${
                                  isSelected
                                    ? "bg-brand-blue/[0.06] font-medium border-l-2 border-l-brand-blue"
                                    : "hover:bg-black/[0.02]"
                                }`}
                              >
                                <td className="py-3.5 px-4 font-bold">{partner.username}</td>
                                <td className="py-3.5 px-4 font-semibold text-brand-blue">
                                  {partner.instagram_username ? (
                                    <a
                                      href={`https://instagram.com/${partner.instagram_username}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 hover:underline"
                                    >
                                      @{partner.instagram_username}
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-steel font-normal">Not Linked</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                                  {(partner.follower_count || 0).toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-steel tabular-nums">
                                  {new Date(partner.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                      disabled={reviewingId === partner.creator_id}
                                      className="h-7 px-3 text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700"
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleReviewCreator(partner.creator_id, "approve")}
                                      disabled={reviewingId === partner.creator_id}
                                      className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    >
                                      Approve
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* APPROVED PARTNERS LIST */}
              <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                <h3 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Approved Program Partners ({approvedPartners.length})
                </h3>

                {approvedPartners.length === 0 ? (
                  <p className="text-xs text-steel bg-black/[0.02] p-4 rounded-xl border border-dashed border-black/15">
                    No approved creators on this campaign yet.
                  </p>
                ) : (
                  <>
                    {/* Mobile Cards (< md) */}
                    <div className="md:hidden space-y-3">
                      {approvedPartners.map((partner: any) => {
                        const isSelected = selectedPartner?.creator_id === partner.creator_id;
                        return (
                          <div
                            key={partner.creator_id}
                            onClick={() => setSelectedPartner(partner)}
                            className={`p-4 rounded-xl border transition-colors duration-150 space-y-3 cursor-pointer ${
                              isSelected
                                ? "bg-brand-blue/[0.05] border-brand-blue/35"
                                : "bg-black/[0.02] border-black/10"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-ink truncate">{partner.username}</p>
                                {partner.instagram_username ? (
                                  <a
                                    href={`https://instagram.com/${partner.instagram_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline mt-0.5"
                                  >
                                    @{partner.instagram_username}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-steel">Not Linked</span>
                                )}
                              </div>
                              <StatusPill tone="success">Approved</StatusPill>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-black/[0.06]">
                              <span className="font-mono text-steel">
                                Code: <strong className="text-ink">{partner.code || "—"}</strong>
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-ink">
                                {(partner.follower_count || 0).toLocaleString()} followers
                              </span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                disabled={reviewingId === partner.creator_id}
                                className="w-full h-8 text-xs text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700"
                              >
                                Revoke Access
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table (>= md) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.08] font-mono text-[10px] text-steel font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Creator Name</th>
                            <th className="py-3 px-4">Instagram</th>
                            <th className="py-3 px-4">Followers</th>
                            <th className="py-3 px-4">Affiliate Code</th>
                            <th className="py-3 px-4">Joined Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] text-ink">
                          {approvedPartners.map((partner: any) => {
                            const isSelected = selectedPartner?.creator_id === partner.creator_id;
                            return (
                              <tr
                                key={partner.creator_id}
                                onClick={() => setSelectedPartner(partner)}
                                className={`cursor-pointer transition-colors duration-150 ${
                                  isSelected
                                    ? "bg-brand-blue/[0.06] font-medium border-l-2 border-l-brand-blue"
                                    : "hover:bg-black/[0.02]"
                                }`}
                              >
                                <td className="py-3.5 px-4 font-bold">{partner.username}</td>
                                <td className="py-3.5 px-4 font-semibold text-brand-blue">
                                  {partner.instagram_username ? (
                                    <a
                                      href={`https://instagram.com/${partner.instagram_username}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 hover:underline"
                                    >
                                      @{partner.instagram_username}
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-steel font-normal">Not Linked</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                                  {(partner.follower_count || 0).toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate">{partner.code}</td>
                                <td className="py-3.5 px-4 font-mono text-steel tabular-nums">
                                  {new Date(partner.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                    disabled={reviewingId === partner.creator_id}
                                    className="h-7 px-3 text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700"
                                  >
                                    Revoke Access
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Side: Creator Profile Quick View Card */}
            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <div className="bg-white border border-black/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="bg-[#fafafb] border-b border-black/[0.08] p-5 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue flex items-center justify-center mb-3">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="font-display font-bold text-ink text-sm leading-tight">
                    {selectedPartner ? selectedPartner.username : "No Selection"}
                  </h3>
                  <span className="font-mono text-[10px] text-steel font-bold uppercase tracking-widest mt-1 block">
                    Creator Profile Quickview
                  </span>
                </div>

                {selectedPartner ? (
                  <div className="p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-steel font-bold uppercase tracking-wider block">
                        Instagram Profile Link
                      </span>
                      {selectedPartner.instagram_username ? (
                        <a
                          href={`https://instagram.com/${selectedPartner.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-brand-blue hover:underline flex items-center gap-1.5 bg-brand-blue/[0.05] p-2.5 rounded-xl border border-brand-blue/20 break-all"
                        >
                          https://instagram.com/{selectedPartner.instagram_username}
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-steel block bg-black/[0.02] p-2.5 rounded-xl border border-black/10">
                          No Instagram profile linked
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/[0.03] p-3 rounded-xl border border-black/[0.06]">
                        <span className="font-mono text-[9px] text-steel font-bold uppercase tracking-wider block">
                          Follower Count
                        </span>
                        <span className="font-mono font-bold text-ink text-sm tabular-nums block mt-0.5">
                          {(selectedPartner.follower_count || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-black/[0.03] p-3 rounded-xl border border-black/[0.06]">
                        <span className="font-mono text-[9px] text-steel font-bold uppercase tracking-wider block">
                          Status
                        </span>
                        <div className="mt-1">
                          {selectedPartner.status === "active" ? (
                            <StatusPill tone="success">Approved</StatusPill>
                          ) : selectedPartner.status === "applied" ? (
                            <StatusPill tone="warning">Pending</StatusPill>
                          ) : (
                            <StatusPill tone="danger">Rejected</StatusPill>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-black/[0.08]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono text-steel font-bold uppercase tracking-wider">
                          Applied Date
                        </span>
                        <span className="font-mono font-semibold text-ink tabular-nums">
                          {new Date(selectedPartner.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedPartner.code && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-mono text-steel font-bold uppercase tracking-wider">
                            Affiliate Code
                          </span>
                          <span className="font-mono font-bold text-ink bg-black/[0.03] px-2 py-0.5 rounded border border-black/10">
                            {selectedPartner.code}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Panel in Preview */}
                    <div className="pt-4 border-t border-black/[0.08] space-y-2">
                      {selectedPartner.status === "applied" && (
                        <>
                          <Button
                            onClick={() => handleReviewCreator(selectedPartner.creator_id, "approve")}
                            disabled={reviewingId === selectedPartner.creator_id}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                          >
                            Approve Creator
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReviewCreator(selectedPartner.creator_id, "reject")}
                            disabled={reviewingId === selectedPartner.creator_id}
                            className="w-full text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-9"
                          >
                            Reject Application
                          </Button>
                        </>
                      )}
                      {selectedPartner.status === "active" && (
                        <Button
                          variant="outline"
                          onClick={() => handleReviewCreator(selectedPartner.creator_id, "reject")}
                          disabled={reviewingId === selectedPartner.creator_id}
                          className="w-full text-rose-600 border-rose-500/25 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-9"
                        >
                          Revoke Access
                        </Button>
                      )}
                      {selectedPartner.status === "rejected" && (
                        <Button
                          onClick={() => handleReviewCreator(selectedPartner.creator_id, "approve")}
                          disabled={reviewingId === selectedPartner.creator_id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                        >
                          Re-Approve Creator
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-steel text-xs">
                    Select a creator from the list to review their profile details.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BUDGET ALLOCATION / RECLAIM MODAL */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand-blue" />
              {budgetAction === "allocate" ? "Add Campaign Funds" : "Reclaim Campaign Funds"}
            </DialogTitle>
            <DialogDescription>
              {budgetAction === "allocate"
                ? `Allocate budget to fund creator payouts. Your available wallet balance is ₹${walletBalance.toLocaleString()}.`
                : "Reclaim unspent pre-allocated funds from this campaign back to your wallet balance."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold text-steel uppercase tracking-wider">
                Amount (INR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
                className="rounded-xl border-black/15 font-mono tabular-nums focus-visible:border-brand-blue focus-visible:ring-brand-blue/20"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBudgetModal(false)}
                disabled={submittingBudget}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={submittingBudget}
              >
                {submittingBudget
                  ? "Processing..."
                  : budgetAction === "allocate"
                  ? "Add Funds"
                  : "Reclaim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </BrandLayout>
  );
};
