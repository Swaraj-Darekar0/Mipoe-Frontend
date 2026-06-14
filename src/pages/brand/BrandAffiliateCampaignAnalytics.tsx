import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BrandLayout from "@/layouts/BrandLayout";
import { 
  getAffiliateCampaignDetails, 
  getBrandConversions, 
  reviewCreatorAffiliateApplication,
  allocateAffiliateBudget,
  reclaimAffiliateBudget,
  getWalletBalance
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
  const [activeTab, setActiveTab] = useState<"overview" | "partners" | "conversions">("overview");

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
      const [campDetails, brandConversions, walletData] = await Promise.all([
        getAffiliateCampaignDetails(id),
        getBrandConversions(),
        getWalletBalance()
      ]);

      setCampaign(campDetails);
      setWalletBalance(walletData.balance);

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
            <button
              onClick={() => setActiveTab("conversions")}
              className={`pb-3 font-bold text-xs border-b-2 uppercase tracking-wide transition-all ${
                activeTab === "conversions" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Referred Sales Logs ({conversions.length})
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Commission Rules */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-500" />
                  Commission Payout Structure
                </h3>

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
