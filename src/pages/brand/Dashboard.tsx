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
  BrandProfile
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
  Link2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandOnboarding } from "@/components/brand/BrandOnboarding";

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
  const [activeTab, setActiveTab] = useState<"campaigns" | "website" | "influencer" | "crm">("campaigns");

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
      const data = await getBrandProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load brand profile", err);
    } finally {
      if (!silent) setProfileLoading(false);
    }
  };

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
  }  const renderWebsiteSpace = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Website Space & Integrations</h3>
              <p className="text-sm text-gray-500 mt-1">Connect your shop platform and configure product mappings for affiliate campaigns.</p>
            </div>
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Pending Setup
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Platform Webhook Setup
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Install the Mipoe javascript pixel in the <code>&lt;head&gt;</code> of your website to automatically track conversions, clicks, and referral sales.
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
                {`<!-- Mipoe Conversion Pixel -->\n<script src="https://cdn.mipoe.com/sdk/pixel.js" data-brand-id="${profile?.id || 'brand_123'}" async></script>`}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                  API Integration Keys
                </h4>
                <p className="text-xs text-gray-550 leading-relaxed mb-4">
                  Use your private key to integrate with custom headless CMS, WooCommerce, Shopify, or custom backends.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <input 
                  type="password" 
                  value="••••••••••••••••••••••••••••••••" 
                  readOnly 
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-500 flex-1"
                />
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-semibold" onClick={() => toast({ title: "API Key Copied" })}>
                  Copy Key
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">Product Mapping & Affiliate Rules</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-150 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-6 py-3">Store Product</th>
                  <th className="px-6 py-3">Sku</th>
                  <th className="px-6 py-3">Base Commission</th>
                  <th className="px-6 py-3">Campaign Mapping</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-xs">
                {[
                  { name: "Classic Cotton Crewneck", sku: "CC-CRWN-001", commission: "10% per sale", campaign: "Spring Casual Drop", status: "Active" },
                  { name: "HydroGlow Tinted Serum", sku: "HG-SRM-50ML", commission: "15% per sale", campaign: "Serum Product launch", status: "Active" },
                  { name: "Horizon Active Fit Shoes", sku: "HZ-SHOE-W9", commission: "12% per sale", campaign: "Horizon Run Season 3", status: "Draft" },
                ].map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-semibold text-gray-850">{p.name}</td>
                    <td className="px-6 py-3 font-mono text-gray-500">{p.sku}</td>
                    <td className="px-6 py-3 font-semibold text-indigo-650">{p.commission}</td>
                    <td className="px-6 py-3 text-gray-600">{p.campaign}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${p.status === "Active" ? "bg-green-500" : "bg-amber-500"}`} />
                      <span className="font-medium text-gray-700">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInfluencerRequests = () => {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Influencer Campaign Requests</h3>
            <p className="text-sm text-gray-500 mt-1">Review creators applying to partner on your affiliate and clip-reward campaigns.</p>
          </div>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold">
            3 Pending
          </span>
        </div>

        <div className="space-y-4">
          {[
            { name: "Aarav Sharma", handle: "@aarav_vlogs", reach: "120K followers", category: "Tech & Lifestyle", pitch: "Hey! I would love to promote your new software tool. My audience of developers and builders is highly engaged and always looking for SaaS recommendations.", rate: "₹4.50 CPV + 10% RevShare" },
            { name: "Neha Patel", handle: "@neha.glows", reach: "85K followers", category: "Beauty & Fashion", pitch: "Your tinted serum fits perfectly with my daily morning skincare routine reels. I do aesthetic GRWM styling and get 50K+ views on average.", rate: "₹5.00 CPV + 12% RevShare" },
            { name: "Rohan Das", handle: "@rohan_clips", reach: "420K followers", category: "Entertainment & Gaming", pitch: "I run a highly active gaming clip compilation channel. I can easily center-crop and post funny snippets of your platform to my daily YouTube Shorts feed.", rate: "₹3.50 CPV Only" },
          ].map((inf, i) => (
            <div key={i} className="border border-gray-150 hover:border-gray-300 rounded-xl p-5 transition duration-150 bg-white">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">{inf.name}</span>
                    <span className="text-xs text-gray-400 font-medium">{inf.handle}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">{inf.reach}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">{inf.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed border-l-2 border-gray-150 pl-3 italic">
                    "{inf.pitch}"
                  </p>
                </div>
                <div className="text-left sm:text-right flex flex-col justify-between h-full min-w-[150px] sm:items-end">
                  <span className="text-xs font-bold text-indigo-600 block sm:mb-4">{inf.rate}</span>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-500 hover:text-red-650 hover:bg-red-50 text-xs font-semibold h-8"
                      onClick={() => toast({ title: "Request Declined", description: `You declined ${inf.name}'s proposal.` })}
                    >
                      Decline
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-indigo-650 hover:bg-indigo-700 text-xs font-semibold h-8"
                      onClick={() => toast({ title: "Partner Recruited!", description: `${inf.name} is now approved to promote this campaign.` })}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCRM = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Active Partners", value: "14 Creators", sub: "+2 this week" },
            { label: "Affiliate Sales Generated", value: "₹2,48,900", sub: "182 total orders" },
            { label: "Total Commissions Paid", value: "₹29,860", sub: "Next payout in 3 days" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
              <span className="text-2xl font-bold text-gray-800 mt-2 block">{stat.value}</span>
              <span className="text-[10px] text-green-600 font-semibold mt-1 block">{stat.sub}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Affiliate Relationship Manager (CRM)</h3>
            <Button size="sm" className="bg-indigo-650 hover:bg-indigo-700 font-semibold h-8" onClick={() => toast({ title: "CSV Export Started" })}>Export Data</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-150 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-6 py-3">Creator</th>
                  <th className="px-6 py-3">Conversion Rate</th>
                  <th className="px-6 py-3">Link Clicks</th>
                  <th className="px-6 py-3">Sales Generated</th>
                  <th className="px-6 py-3">Revenue Commission</th>
                  <th className="px-6 py-3">Loyalty Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-xs">
                {[
                  { name: "Priya Patel", clicks: 1240, conv: "4.2%", sales: "₹94,800", comm: "₹11,376", tier: "Gold (12% commission)" },
                  { name: "Kabir Dev", clicks: 830, conv: "3.5%", sales: "₹58,100", comm: "₹6,972", tier: "Silver (10% commission)" },
                  { name: "Ananya Nair", clicks: 2100, conv: "2.8%", sales: "₹96,000", comm: "₹11,520", tier: "Gold (12% commission)" },
                ].map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-semibold text-gray-850">{c.name}</td>
                    <td className="px-6 py-3 font-medium text-gray-700">{c.conv}</td>
                    <td className="px-6 py-3 text-gray-505">{c.clicks.toLocaleString()}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800">{c.sales}</td>
                    <td className="px-6 py-3 font-bold text-green-605">{c.comm}</td>
                    <td className="px-6 py-3">
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {c.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

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
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Affiliate Space</span>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab("website")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "website"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Website Space
                  </button>
                  <button
                    onClick={() => setActiveTab("influencer")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "influencer"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Influencer Requests
                  </button>
                  <button
                    onClick={() => setActiveTab("crm")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === "crm"
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    CRM Page
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

            {activeTab === "website" && renderWebsiteSpace()}
            {activeTab === "influencer" && renderInfluencerRequests()}
            {activeTab === "crm" && renderCRM()}
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