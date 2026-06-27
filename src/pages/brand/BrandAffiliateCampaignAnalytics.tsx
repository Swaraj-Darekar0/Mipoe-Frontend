import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BrandLayout from "@/layouts/BrandLayout";
import { 
  getAffiliateCampaignDetails, 
  getBrandConversions, 
  reviewCreatorAffiliateApplication,
  allocateAffiliateBudget,
  reclaimAffiliateBudget,
  getWalletBalance,
  getBrandProducts,
  getBrandProfile,
  updateAffiliateCampaign
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  Users, 
  User,
  TrendingUp, 
  Layers, 
  UserCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  CheckCircle,
  XCircle,
  Download
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
    const commission_schedule: any = {};
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
        payload.landing_page_url = editLandingPageUrl;
        payload.commission_schedule = commission_schedule;
        payload.recurring_commission = editRecurringCommission;
        payload.recurring_commission_limit = editRecurringCommission && editRecurringLimit ? parseInt(editRecurringLimit) : null;
        payload.commission_type = monthlyActive ? monthlyCommType : Object.values(commission_schedule)[0].type;
        payload.commission_value = monthlyActive ? parseFloat(monthlyCommValue) : Object.values(commission_schedule)[0].value;
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
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <Clock className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="font-semibold text-sm">Loading campaign stats & partners...</p>
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
    <BrandLayout>
      <div className="space-y-6">
        
        {/* Back Link */}
        <Link 
          to="/brand/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Campaign Header Card */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {isSaas ? "SaaS Subscription" : "Product Store"}
              </span>
              {campaign.is_active ? (
                <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Active
                </span>
              ) : (
                <span className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Draft
                </span>
              )}
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {campaign.name}
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xl">
              {campaign.description || "No description provided."}
            </p>
          </div>

          {/* Quick Wallet Budget Actions */}
          <div className="bg-gray-50 p-4 border border-gray-150 rounded-2xl flex items-center justify-between gap-6 w-full md:w-auto shrink-0 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Free Campaign Budget</span>
              <span className="font-extrabold text-lg text-gray-800 block">₹{freeBudget.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBudgetAction("reclaim");
                  setShowBudgetModal(true);
                }}
                disabled={freeBudget <= 0}
                className="text-xs h-8"
              >
                Reclaim
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setBudgetAction("allocate");
                  setShowBudgetModal(true);
                }}
                className="text-xs h-8 bg-indigo-650 hover:bg-indigo-750 text-white"
              >
                Add Funds
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-gray-150 rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Coins className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Allocated Funds</span>
                <span className="text-base font-extrabold text-gray-800 block mt-0.5">₹{campaign.funds_allocated.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-150 rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Distributed Payouts</span>
                <span className="text-base font-extrabold text-gray-800 block mt-0.5">₹{campaign.funds_distributed.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-150 rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Referred Conversions</span>
                <span className="text-base font-extrabold text-gray-800 block mt-0.5">{totalSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-150 rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <UserCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Approved Partners</span>
                <span className="text-base font-extrabold text-gray-800 block mt-0.5">{approvedPartners.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab switcher */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 font-bold text-xs border-b-2 uppercase tracking-wide transition-all ${
                activeTab === "overview" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Overview & Campaign Rules
            </button>
            <button
              onClick={() => setActiveTab("partners")}
              className={`pb-3 font-bold text-xs border-b-2 uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "partners" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Creators & Applications
              {pendingPartners.length > 0 && (
                <span className="bg-orange-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                  {pendingPartners.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          isEditing ? (
            <form onSubmit={handleEditSubmit} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Edit Campaign Settings</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Modify campaign rules, criteria, mapping, and timelines.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-xs h-8 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingEdit}
                    size="sm"
                    className="text-xs h-8 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl"
                  >
                    {submittingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campaign Name</label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cover Image URL</label>
                    <Input
                      type="text"
                      placeholder="https://example.com/banner.jpg"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                {isSaas && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Landing Page URL</label>
                    <Input
                      type="text"
                      value={editLandingPageUrl}
                      onChange={(e) => setEditLandingPageUrl(e.target.value)}
                      required
                      className="rounded-xl border-gray-200"
                    />
                    {brandProfile?.website_url && (
                      <p className="text-[9px] text-gray-400 italic">
                        Must match or be a subdomain of your verified website: <span className="font-semibold text-indigo-650">{brandProfile.website_url}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campaign Description & Guidelines</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full min-h-[100px] text-xs p-3 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Commission Rules */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Commission Rules</h4>
                {isSaas ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-gray-550 uppercase tracking-wider">Billing Interval Payouts</label>
                      
                      {/* Weekly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-weekly-active"
                            checked={weeklyActive}
                            onChange={(e) => setWeeklyActive(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                          />
                          <label htmlFor="edit-weekly-active" className="text-xs font-bold text-gray-700">Weekly Plan</label>
                        </div>
                        {weeklyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={weeklyCommType}
                              onChange={(e: any) => setWeeklyCommType(e.target.value)}
                              className="text-xs p-1.5 border border-gray-200 rounded-lg bg-white"
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
                              className="w-24 h-8 text-xs rounded-lg border-gray-200"
                            />
                          </div>
                        )}
                      </div>

                      {/* Monthly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-monthly-active"
                            checked={monthlyActive}
                            onChange={(e) => setMonthlyActive(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                          />
                          <label htmlFor="edit-monthly-active" className="text-xs font-bold text-gray-700">Monthly Plan</label>
                        </div>
                        {monthlyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={monthlyCommType}
                              onChange={(e: any) => setMonthlyCommType(e.target.value)}
                              className="text-xs p-1.5 border border-gray-200 rounded-lg bg-white"
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
                              className="w-24 h-8 text-xs rounded-lg border-gray-200"
                            />
                          </div>
                        )}
                      </div>

                      {/* Yearly active check */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="edit-yearly-active"
                            checked={yearlyActive}
                            onChange={(e) => setYearlyActive(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                          />
                          <label htmlFor="edit-yearly-active" className="text-xs font-bold text-gray-700">Yearly Plan</label>
                        </div>
                        {yearlyActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={yearlyCommType}
                              onChange={(e: any) => setYearlyCommType(e.target.value)}
                              className="text-xs p-1.5 border border-gray-200 rounded-lg bg-white"
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
                              className="w-24 h-8 text-xs rounded-lg border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-recurring-comm"
                          checked={editRecurringCommission}
                          onChange={(e) => setEditRecurringCommission(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-recurring-comm" className="text-xs font-bold text-gray-700">Enable Recurring Commissions</label>
                      </div>
                      
                      {editRecurringCommission && (
                        <div className="space-y-1.5 max-w-xs pl-6">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Cap Limit (Optional)</label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={editRecurringLimit}
                            onChange={(e) => setEditRecurringLimit(e.target.value)}
                            className="h-8 text-xs rounded-lg border-gray-200"
                          />
                          <p className="text-[9px] text-gray-400">Leave blank for unlimited payouts per subscription lifetime.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Commission Type</label>
                      <select
                        value={editCommissionType}
                        onChange={(e: any) => setEditCommissionType(e.target.value)}
                        className="text-xs p-2 border border-gray-200 rounded-xl bg-white w-full h-10 focus:outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Flat (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Commission Value</label>
                      <Input
                        type="number"
                        step="any"
                        value={editCommissionValue}
                        onChange={(e) => setEditCommissionValue(e.target.value)}
                        required
                        className="rounded-xl border-gray-200 h-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements & Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-150">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Target & Criteria</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date (Deadline)</label>
                      <Input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Min Follower Criteria</label>
                      <Input
                        type="number"
                        value={editMinFollowers}
                        onChange={(e) => setEditMinFollowers(e.target.value)}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mapped Store Products / Plans</h4>
                  <p className="text-[10px] text-gray-400">Select which products/plans this campaign applies to. If none are selected, all sales qualify.</p>
                  
                  {products.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl text-center text-xs text-gray-400 italic">
                      No products/plans found in your catalog. Please add products first.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 p-2.5 rounded-xl bg-white">
                      {products.map(p => {
                        const isChecked = editSelectedProductIds.includes(p.id);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-xs">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`edit-prod-${p.id}`}
                                checked={isChecked}
                                onChange={() => toggleProductSelect(p.id)}
                                className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                              />
                              <label htmlFor={`edit-prod-${p.id}`} className="font-medium text-gray-700 cursor-pointer">{p.name}</label>
                            </div>
                            <span className="font-bold text-indigo-650">₹{p.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs h-9 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingEdit}
                  size="sm"
                  className="text-xs h-9 px-4 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl"
                >
                  {submittingEdit ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Commission Rules */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Coins className="w-4 h-4 text-indigo-500" />
                      Commission Payout Structure
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                      className="text-xs h-8 border-indigo-200 text-indigo-650 hover:bg-indigo-50 rounded-xl"
                    >
                      Edit Campaign Rules
                    </Button>
                  </div>

                  {isSaas && campaign.commission_schedule ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.keys(campaign.commission_schedule).map(interval => {
                          const data = campaign.commission_schedule[interval];
                          const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
                          return (
                            <div key={interval} className="bg-gray-50 border border-gray-150 p-4 rounded-xl">
                              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{interval} Plan</span>
                              <span className="font-extrabold text-base text-gray-800 block mt-1">{valStr}</span>
                            </div>
                          );
                        })}
                      </div>

                      {campaign.recurring_commission ? (
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-3 text-xs leading-relaxed text-gray-650">
                          <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-indigo-900 block">Recurring Commission Enabled</span>
                            <span className="block mt-0.5">
                              Creators receive commissions on every renewal checkout
                              {campaign.recurring_commission_limit ? ` (capped up to ${campaign.recurring_commission_limit} payments).` : "."}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl flex gap-3 text-xs leading-relaxed text-gray-500">
                          <Info className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-gray-700 block">One-time Commission Payout</span>
                            <span className="block mt-0.5">Commissions are calculated and paid out only on the subscriber's initial sign-up checkout event.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-xs">
                      <span className="text-gray-500 font-medium">Flat rate conversion payout:</span>
                      <span className="font-bold text-indigo-600 block text-base mt-1.5">
                        {campaign.commission_type === "percentage" 
                          ? `${campaign.commission_value}% per sale` 
                          : `₹${campaign.commission_value} flat per sale`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description guidelines */}
                <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-3 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm">Campaign Terms & Instructions</h3>
                  <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {campaign.description || "No custom instructions supplied."}
                  </div>
                </div>

              </div>

              {/* Right Column: Plans & Criteria info */}
              <div className="space-y-6">
                
                <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Mapped Plans / Products
                  </h3>

                  <div className="space-y-2">
                    {campaign.products && campaign.products.length > 0 ? (
                      campaign.products.map((p: any) => (
                        <div key={p.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{p.name}</span>
                          <span className="font-bold text-indigo-650">₹{p.price}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No plan mapping restrictions. All sales conversion events qualify.</p>
                    )}
                  </div>
                </div>

                {/* Requirements & dates */}
                <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Timeline & Target
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Start Date</span>
                      <span className="font-bold text-gray-700">{new Date(campaign.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">End Date</span>
                      <span className="font-bold text-gray-700">{new Date(campaign.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Min Follower Criteria</span>
                      <span className="font-bold text-gray-700">
                        {campaign.creator_requirements?.min_followers 
                          ? `${campaign.creator_requirements.min_followers.toLocaleString()}+ followers`
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
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  Pending Creator Applications ({pendingPartners.length})
                </h3>

                {pendingPartners.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-250">No pending creator applications for this program.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Creator Name</th>
                          <th className="py-3 px-4">Instagram profile</th>
                          <th className="py-3 px-4">Followers</th>
                          <th className="py-3 px-4">Applied Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {pendingPartners.map((partner: any) => {
                          const isSelected = selectedPartner?.creator_id === partner.creator_id;
                          return (
                            <tr 
                              key={partner.creator_id} 
                              onClick={() => setSelectedPartner(partner)}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-indigo-50/80 font-medium border-l-2 border-l-indigo-600" 
                                  : "hover:bg-gray-50/50"
                              }`}
                            >
                              <td className="py-3.5 px-4 font-bold">{partner.username}</td>
                              <td className="py-3.5 px-4 font-bold text-indigo-600">
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
                                  <span className="text-gray-400">Not Linked</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-bold">{(partner.follower_count || 0).toLocaleString()}</td>
                              <td className="py-3.5 px-4 text-gray-400">{new Date(partner.created_at).toLocaleDateString()}</td>
                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                    disabled={reviewingId === partner.creator_id}
                                    className="h-7 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewCreator(partner.creator_id, "approve")}
                                    disabled={reviewingId === partner.creator_id}
                                    className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white font-bold"
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
                )}
              </div>

              {/* APPROVED PARTNERS LIST */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Approved Program Partners ({approvedPartners.length})
                </h3>

                {approvedPartners.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-250">No approved creators on this campaign yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Creator Name</th>
                          <th className="py-3 px-4">Instagram</th>
                          <th className="py-3 px-4">Followers</th>
                          <th className="py-3 px-4">Affiliate Code</th>
                          <th className="py-3 px-4">Joined Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {approvedPartners.map((partner: any) => {
                          const isSelected = selectedPartner?.creator_id === partner.creator_id;
                          return (
                            <tr 
                              key={partner.creator_id}
                              onClick={() => setSelectedPartner(partner)}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-indigo-50/80 font-medium border-l-2 border-l-indigo-600" 
                                  : "hover:bg-gray-50/50"
                              }`}
                            >
                              <td className="py-3.5 px-4 font-bold">{partner.username}</td>
                              <td className="py-3.5 px-4 font-bold text-indigo-600">
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
                                  <span className="text-gray-400">Not Linked</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-bold">{(partner.follower_count || 0).toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-mono text-gray-500">{partner.code}</td>
                              <td className="py-3.5 px-4 text-gray-400">{new Date(partner.created_at).toLocaleDateString()}</td>
                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewCreator(partner.creator_id, "reject")}
                                  disabled={reviewingId === partner.creator_id}
                                  className="h-7 px-3 text-red-650 hover:bg-red-50 hover:text-red-700"
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
                )}
              </div>
            </div>

            {/* Right Side: Creator Profile Quick View Card */}
            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-150 p-5 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-gray-800 text-sm leading-tight">
                    {selectedPartner ? selectedPartner.username : "No Selection"}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">
                    Creator Profile Quickview
                  </span>
                </div>

                {selectedPartner ? (
                  <div className="p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Instagram Profile link</span>
                      {selectedPartner.instagram_username ? (
                        <a 
                          href={`https://instagram.com/${selectedPartner.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50 break-all"
                        >
                          https://instagram.com/{selectedPartner.instagram_username}
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic block bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                          No Instagram profile linked
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Follower count</span>
                        <span className="font-black text-gray-800 text-sm block mt-0.5">
                          {(selectedPartner.follower_count || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
                        <div className="mt-1">
                          {selectedPartner.status === "active" ? (
                            <Badge className="bg-green-50 border-green-200 text-green-700 text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                              Approved
                            </Badge>
                          ) : selectedPartner.status === "applied" ? (
                            <Badge className="bg-yellow-50 border-yellow-200 text-yellow-800 text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                              Pending
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 border-red-200 text-red-700 text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider">
                              Rejected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Applied Date</span>
                        <span className="font-bold text-gray-700">
                          {new Date(selectedPartner.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedPartner.code && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 font-bold uppercase tracking-wider">Affiliate Code</span>
                          <span className="font-mono font-bold text-gray-650 bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                            {selectedPartner.code}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Panel in Preview */}
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      {selectedPartner.status === "applied" && (
                        <>
                          <Button
                            onClick={() => handleReviewCreator(selectedPartner.creator_id, "approve")}
                            disabled={reviewingId === selectedPartner.creator_id}
                            className="w-full bg-green-600 hover:bg-green-750 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
                          >
                            Approve Creator
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReviewCreator(selectedPartner.creator_id, "reject")}
                            disabled={reviewingId === selectedPartner.creator_id}
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold text-xs h-9 rounded-xl"
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
                          className="w-full text-red-650 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold text-xs h-9 rounded-xl"
                        >
                          Revoke Access
                        </Button>
                      )}
                      {selectedPartner.status === "rejected" && (
                        <Button
                          onClick={() => handleReviewCreator(selectedPartner.creator_id, "approve")}
                          disabled={reviewingId === selectedPartner.creator_id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs h-9 rounded-xl"
                        >
                          Re-Approve Creator
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 italic text-xs">
                    Select a creator from the left list to review their profile details.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Conversions Tab */}
        {activeTab === "conversions" && (
          <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm">Referred Conversions Log List ({conversions.length})</h3>

            {conversions.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-xs">No conversions recorded yet</p>
                <p className="text-[10px] text-gray-400 mt-1">Conversions will appear here once customers buy plans/products via creator reference links.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Order ID / Subscription</th>
                      <th className="py-3 px-4">Partner</th>
                      <th className="py-3 px-4">Plan/Product</th>
                      <th className="py-3 px-4">Order Amount</th>
                      <th className="py-3 px-4">Commission Paid</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {conversions.map((conv) => (
                      <tr key={conv.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-gray-500">{conv.order_id}</td>
                        <td className="py-3 px-4 font-bold">{conv.creator_name || "Direct Referral"}</td>
                        <td className="py-3 px-4">{conv.product_name || "General Conversion"}</td>
                        <td className="py-3 px-4 font-bold">₹{conv.order_amount}</td>
                        <td className="py-3 px-4 font-extrabold text-indigo-650">₹{conv.commission_amount}</td>
                        <td className="py-3 px-4 text-gray-400">{new Date(conv.created_at || conv.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {conv.status === "completed" ? (
                            <Badge className="bg-green-50 border-green-200 text-green-700 text-[9px] px-2 py-0.5 font-bold uppercase">
                              Settled
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-100 text-zinc-650 text-[9px] px-2 py-0.5 font-bold">
                              {conv.status}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* BUDGET ALLOCATION / RECLAIM MODAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-650" />
              {budgetAction === "allocate" ? "Add Campaign Funds" : "Reclaim Campaign Funds"}
            </h3>
            
            <p className="text-xs text-gray-550 leading-relaxed mb-4">
              {budgetAction === "allocate" 
                ? `Allocate budget to fund creator payouts. Your available wallet balance is ₹${walletBalance.toLocaleString()}.`
                : `Reclaim unspent pre-allocated funds from this campaign back to your wallet balance.`}
            </p>

            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (INR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowBudgetModal(false)}
                  disabled={submittingBudget}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submittingBudget}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                >
                  {submittingBudget ? "Processing..." : budgetAction === "allocate" ? "Add Funds" : "Reclaim"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </BrandLayout>
  );
};
