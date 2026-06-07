import { useEffect, useState } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  fetchBrandCampaigns, 
  deleteCampaign, 
  Campaign, 
  verifyDeposit, 
  getWalletBalance,
  getBrandProfile,
  BrandProfile,
  getAffiliateStatus
} from "@/lib/api";
import WalletOverview from "@/components/brand/WalletOverview";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Clock, 
  Building2,
  Lock,
  XCircle,
  Instagram,
  Youtube,
  Globe,
  Users,
  Inbox,
  Link2,
  Megaphone,
  ShoppingBag,
  LineChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandOnboarding } from "@/components/brand/BrandOnboarding";
import { AffiliateOnboarding } from "@/components/brand/AffiliateOnboarding";
import { ProductCatalog } from "@/components/brand/ProductCatalog";
import { AffiliateCampaigns } from "@/components/brand/AffiliateCampaigns";
import { AffiliateCRM } from "@/components/brand/AffiliateCRM";

const BrandDashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Onboarding States
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "affiliate_campaigns" | "product_catalog" | "affiliate_crm" | "affiliate_onboarding">("campaigns");
  const [affiliateStatus, setAffiliateStatus] = useState<"not_started" | "completed">("not_started");
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [integrationType, setIntegrationType] = useState<"shopify" | "custom" | "cashfree">("shopify");

  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance();
      setWalletBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    }
  };

  const verifyTransaction = async (orderId: string) => {
    try {
      toast({ title: "Verifying Payment", description: "Please wait..." });
      const data = await verifyDeposit(orderId);
      setWalletBalance(data.new_balance);
      toast({ 
        title: "Success!", 
        description: `Deposit verified. New Balance: ₹${data.new_balance}`, 
        className: "bg-green-50 border-green-200" 
      });
      navigate("/brand/dashboard", { replace: true });
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  };

  const loadProfile = async (silent = false) => {
    if (!silent) setProfileLoading(true);
    try {
      const [data, statusData] = await Promise.all([
        getBrandProfile(),
        getAffiliateStatus()
      ]);
      setProfile(data);
      setAffiliateStatus(statusData.status);
      if (statusData.has_shopify_token || statusData.shopify_shop) {
        setIntegrationType("shopify");
      } else if (statusData.custom_api_key) {
        setIntegrationType("custom");
      } else if (statusData.has_cashfree_connected) {
        setIntegrationType("cashfree");
      }
    } catch (err) {
      console.error("Failed to load brand profile or status", err);
    } finally {
      if (!silent) setProfileLoading(false);
      setAffiliateLoading(false);
    }
  };

  const handleAffiliateHeaderClick = () => {
    if (affiliateStatus !== "completed") {
      setActiveTab("affiliate_onboarding");
    } else {
      setActiveTab("affiliate_campaigns");
    }
  };

  const handleAffiliateSubTabClick = (tab: "affiliate_campaigns" | "product_catalog" | "affiliate_crm") => {
    if (affiliateStatus !== "completed") {
      setActiveTab("affiliate_onboarding");
      toast({
        title: "Onboarding Required",
        description: "Please complete the affiliate onboarding to unlock this space.",
        variant: "destructive"
      });
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    const success = searchParams.get("success");
    const integration = searchParams.get("integration");
    const errorParam = searchParams.get("error");

    if (success === "true" && integration === "shopify") {
      toast({
        title: "Shopify Connected!",
        description: "Your Shopify store has been successfully integrated.",
        className: "bg-green-50 border-green-200"
      });
      loadProfile(true);
      setActiveTab("product_catalog");
      navigate("/brand/dashboard", { replace: true });
    } else if (errorParam) {
      toast({
        title: "Shopify Integration Failed",
        description: errorParam,
        variant: "destructive"
      });
      navigate("/brand/dashboard", { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    loadProfile();
  }, []);

  // Polling for automated PAN check and admin compliance review updates
  useEffect(() => {
    if (!profile) return;
    const status = profile.onboarding_status;
    
    if (status === "verifying_pan" || status === "pending_verification") {
      const interval = setInterval(() => {
        loadProfile(true);
      }, status === "verifying_pan" ? 3000 : 8000);
      return () => clearInterval(interval);
    }
  }, [profile?.onboarding_status]);

  useEffect(() => {
    if (profile?.onboarding_status === "verified") {
      const loadDashboardData = async () => {
        try {
          setLoading(true);
          const [campaignData, balanceData] = await Promise.all([
            fetchBrandCampaigns(),
            getWalletBalance()
          ]);
          setCampaigns(campaignData);
          setWalletBalance(balanceData.balance);

          const orderId = searchParams.get("order_id");
          if (orderId) {
            verifyTransaction(orderId);
          }
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError("An unknown error occurred");
        } finally {
          setLoading(false);
        }
      };
      loadDashboardData();
    }
  }, [profile?.onboarding_status]);

  if (profileLoading && !profile) {
    return (
      <BrandLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Clock className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading compliance dashboard...</p>
        </div>
      </BrandLayout>
    );
  }  

  // If Verified, render normal dashboard
  if (profile?.onboarding_status === "verified") {
    const isPersonalAgency = profile?.category === "Personal Agency";

    if (isPersonalAgency) {
      return (
        <BrandLayout fullWidth={false}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Campaign Performance</h2>
            <Link to="/brand/transactions">
              <Button className="gap-2" variant="outline">
                <BarChart3 className="w-4 h-4" />
                Transaction Log
              </Button>
            </Link>
          </div>
          
          <WalletOverview balance={walletBalance} onRefresh={fetchBalance} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden mt-6">
            {error && <div className="text-red-650 text-sm p-4">{error}</div>}
            {loading ? (
              <div className="p-8 text-center text-gray-500 font-medium">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-lg text-gray-700">No campaigns created yet</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Launch your first marketing campaign to get started!</p>
                <Link to="/brand/create">
                  <Button className="bg-indigo-650 hover:bg-indigo-700">Create Campaign</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-150">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Funds Locked</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPV</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Eyeballs</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {campaigns.map(campaign => (
                      <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-semibold whitespace-nowrap">
                          {campaign.campaign_approval === "pending_approval" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                              <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                              Pending Approval
                            </span>
                          ) : campaign.campaign_approval === "rejected" ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700 shadow-sm cursor-help"
                              title={`Rejection Reason: ${campaign.rejection_reason || "Unspecified"}`}
                            >
                              <XCircle className="w-3 h-3 text-red-500" />
                              Rejected
                            </span>
                          ) : campaign.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-600 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {campaign.campaign_approval === "approved" ? (
                            <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline text-indigo-600 hover:text-indigo-800 transition-colors">
                              {campaign.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500 cursor-not-allowed flex items-center gap-1.5 w-fit" title="Campaign is pending approval or rejected.">
                              <Lock className="w-3.5 h-3.5 text-gray-400" />
                              {campaign.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                            {campaign.platform.toLowerCase() === "instagram" ? (
                              <Instagram className="w-4 h-4 text-pink-500" />
                            ) : (
                              <Youtube className="w-4 h-4 text-red-500" />
                            )}
                            <span className="capitalize">{campaign.platform}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                          ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600 whitespace-nowrap">₹{campaign.cpv}</td>
                        <td className="px-6 py-4 text-gray-650 whitespace-nowrap">{(campaign.total_view_count || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-505 whitespace-nowrap">
                          {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline disabled:opacity-50 transition-colors"
                            onClick={async () => {
                              const funds = campaign.funds_allocated || 0;
                              let confirmMessage = "";

                              if (funds > 0) {
                                confirmMessage = `⚠️ REFUND WARNING ⚠️\n\nThis campaign still has ₹${funds.toLocaleString()} allocated.\n\nDeleting it will:\n1. REFUND ₹${funds.toLocaleString()} to your Wallet.\n2. PERMANENTLY DELETE all campaign data.\n\nAre you sure you want to proceed?`;
                              } else {
                                confirmMessage = "Are you sure you want to delete this campaign? This action cannot be undone.";
                              }

                              if (!window.confirm(confirmMessage)) return;

                              try {
                                setDeletingId(campaign.id);
                                await deleteCampaign(campaign.id);
                                setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                                if (funds > 0) {
                                  alert(`Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`);
                                  window.location.reload(); 
                                }
                              } catch (err: unknown) {
                                if (err instanceof Error) {
                                  setError(err.message);
                                } else {
                                  setError("An unknown error occurred");
                                }
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            disabled={deletingId === campaign.id}
                          >
                            {deletingId === campaign.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </BrandLayout>
      );
    }

    return (
      <BrandLayout fullWidth={true}>
        <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-10rem)] w-full">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm h-fit md:sticky md:top-6">
            <div className="space-y-6">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Campaigns</span>
                <button
                  onClick={() => setActiveTab("campaigns")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeTab === "campaigns"
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Brand Campaigns
                </button>
              </div>

              <div>
                <button
                  onClick={handleAffiliateHeaderClick}
                  className="block w-full text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 hover:text-gray-600 transition"
                >
                  Affiliate Settings
                </button>
                <div className="space-y-1">
                  <button
                    onClick={() => handleAffiliateSubTabClick("affiliate_campaigns")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "affiliate_campaigns"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-4 h-4" />
                      Affiliate Campaigns
                    </div>
                    {affiliateStatus !== "completed" && (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleAffiliateSubTabClick("product_catalog")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "product_catalog"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4 h-4" />
                      Product Catalog
                    </div>
                    {affiliateStatus !== "completed" && (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleAffiliateSubTabClick("affiliate_crm")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "affiliate_crm"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Inbox className="w-4 h-4" />
                      Affiliate CRM
                    </div>
                    {affiliateStatus !== "completed" && (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Workspace Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "campaigns" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Campaign Performance</h2>
                  <Link to="/brand/transactions">
                    <Button className="gap-2" variant="outline">
                      <BarChart3 className="w-4 h-4" />
                      Transaction Log
                    </Button>
                  </Link>
                </div>
                
                <WalletOverview balance={walletBalance} onRefresh={fetchBalance} />
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden mt-6">
                  {error && <div className="text-red-650 text-sm p-4">{error}</div>}
                  {loading ? (
                    <div className="p-8 text-center text-gray-500 font-medium">Loading campaigns...</div>
                  ) : campaigns.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-semibold text-lg text-gray-700">No campaigns created yet</p>
                      <p className="text-gray-400 text-sm mt-1 mb-4">Launch your first marketing campaign to get started!</p>
                      <Link to="/brand/create">
                        <Button className="bg-indigo-650 hover:bg-indigo-700">Create Campaign</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50/75 border-b border-gray-150">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Funds Locked</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPV</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Eyeballs</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {campaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-4 font-semibold whitespace-nowrap">
                                {campaign.campaign_approval === "pending_approval" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                                    <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                                    Pending Approval
                                  </span>
                                ) : campaign.campaign_approval === "rejected" ? (
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700 shadow-sm cursor-help"
                                    title={`Rejection Reason: ${campaign.rejection_reason || "Unspecified"}`}
                                  >
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    Rejected
                                  </span>
                                ) : campaign.is_active ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-600 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {campaign.campaign_approval === "approved" ? (
                                  <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline text-indigo-600 hover:text-indigo-800 transition-colors">
                                    {campaign.name}
                                  </Link>
                                ) : (
                                  <span className="text-gray-500 cursor-not-allowed flex items-center gap-1.5 w-fit" title="Campaign is pending approval or rejected.">
                                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                                    {campaign.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                  {campaign.platform.toLowerCase() === "instagram" ? (
                                    <Instagram className="w-4 h-4 text-pink-500" />
                                  ) : (
                                    <Youtube className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="capitalize">{campaign.platform}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                                ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-600 whitespace-nowrap">₹{campaign.cpv}</td>
                              <td className="px-6 py-4 text-gray-655 whitespace-nowrap">{(campaign.total_view_count || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline disabled:opacity-50 transition-colors"
                                  onClick={async () => {
                                    const funds = campaign.funds_allocated || 0;
                                    let confirmMessage = "";

                                    if (funds > 0) {
                                      confirmMessage = `⚠️ REFUND WARNING ⚠️\n\nThis campaign still has ₹${funds.toLocaleString()} allocated.\n\nDeleting it will:\n1. REFUND ₹${funds.toLocaleString()} to your Wallet.\n2. PERMANENTLY DELETE all campaign data.\n\nAre you sure you want to proceed?`;
                                    } else {
                                      confirmMessage = "Are you sure you want to delete this campaign? This action cannot be undone.";
                                    }

                                    if (!window.confirm(confirmMessage)) return;

                                    try {
                                      setDeletingId(campaign.id);
                                      await deleteCampaign(campaign.id);
                                      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                                      if (funds > 0) {
                                        alert(`Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`);
                                        window.location.reload(); 
                                      }
                                    } catch (err: unknown) {
                                      if (err instanceof Error) {
                                        setError(err.message);
                                      } else {
                                        setError("An unknown error occurred");
                                      }
                                    } finally {
                                      setDeletingId(null);
                                    }
                                  }}
                                  disabled={deletingId === campaign.id}
                                >
                                  {deletingId === campaign.id ? "Deleting..." : "Delete"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "affiliate_onboarding" && (
              <AffiliateOnboarding 
                businessCategory={profile?.category || "Product Based"} 
                onOnboardingCompleted={() => {
                  setAffiliateStatus("completed");
                  setActiveTab("affiliate_campaigns");
                }} 
              />
            )}
            {activeTab === "affiliate_campaigns" && (
              <AffiliateCampaigns />
            )}
            {activeTab === "product_catalog" && (
              <ProductCatalog integrationType={integrationType} />
            )}
            {activeTab === "affiliate_crm" && (
              <AffiliateCRM />
            )}
          </div>
        </div>
      </BrandLayout>
    );
  }

  // Render Onboarding Wizard
  return (
    <BrandLayout>
      <BrandOnboarding 
        profile={profile} 
        onProfileUpdated={loadProfile} 
      />
    </BrandLayout>
  );
};

export default BrandDashboard;