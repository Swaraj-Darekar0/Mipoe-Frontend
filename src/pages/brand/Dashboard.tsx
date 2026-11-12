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
  getAffiliateStatus,
  getCachedBrandProfile,
  getCachedBrandCampaigns,
  getCachedAffiliateStatus
} from "@/lib/api";
import WalletOverview from "@/components/brand/WalletOverview";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Lock, 
  Loader2,
  Instagram, 
  Youtube 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandOnboarding } from "@/components/brand/BrandOnboarding";
import { AffiliateOnboarding } from "@/components/brand/AffiliateOnboarding";
import { ProductCatalog } from "@/components/brand/ProductCatalog";
import { AffiliateCampaigns } from "@/components/brand/AffiliateCampaigns";
import { AffiliateCRM } from "@/components/brand/AffiliateCRM";
import { TaxInvoicesTab } from "@/components/brand/TaxInvoicesTab";
import { PortalPageHeader, StatusPill, ConfirmDialog } from "@/components/ui/PortalPrimitives";

const BrandDashboard = () => {
  const cachedProfile = getCachedBrandProfile();
  const cachedCampaigns = getCachedBrandCampaigns();
  const cachedAffiliate = getCachedAffiliateStatus();

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => cachedCampaigns || []);
  const [loading, setLoading] = useState(() => !cachedCampaigns);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState<Campaign | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Onboarding States
  const [profile, setProfile] = useState<BrandProfile | null>(() => cachedProfile);
  const [profileLoading, setProfileLoading] = useState(() => !cachedProfile);
  const [activeTab, setActiveTab] = useState<"campaigns" | "affiliate_campaigns" | "product_catalog" | "affiliate_crm" | "affiliate_onboarding" | "tax_invoices">("campaigns");
  const [affiliateStatus, setAffiliateStatus] = useState<"not_started" | "completed">(() => cachedAffiliate?.status || "not_started");
  const [affiliateLoading, setAffiliateLoading] = useState(() => !cachedAffiliate);
  const [integrationType, setIntegrationType] = useState<"shopify" | "custom" | "cashfree">(() => {
    if (cachedAffiliate?.has_shopify_token || cachedAffiliate?.shopify_shop) return "shopify";
    if (cachedAffiliate?.custom_api_key) return "custom";
    if (cachedAffiliate?.onboarding_gateway) return "cashfree";
    return "shopify";
  });

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
        className: "bg-emerald-600 border-emerald-500 text-white" 
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
        getBrandProfile(silent),
        getAffiliateStatus(silent)
      ]);
      setProfile(data);
      setAffiliateStatus(statusData.status);
      if (statusData.has_shopify_token || statusData.shopify_shop) {
        setIntegrationType("shopify");
      } else if (statusData.custom_api_key) {
        setIntegrationType("custom");
      } else if (statusData.onboarding_gateway) {
        setIntegrationType("cashfree");
      }
    } catch (err) {
      console.error("Failed to load brand profile or status", err);
    } finally {
      if (!silent) setProfileLoading(false);
      setAffiliateLoading(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "tax_invoices") {
      setActiveTab("tax_invoices");
      return;
    }

    const isPersonalAgency = profile?.category === "Personal Agency";
    if (isPersonalAgency || !tabParam || tabParam === "campaigns") {
      setActiveTab("campaigns");
      return;
    }

    if (tabParam === "affiliate_campaigns" || tabParam === "product_catalog" || tabParam === "affiliate_crm") {
      if (tabParam === "product_catalog" && profile?.category?.toLowerCase().includes("saas")) {
        setActiveTab("affiliate_campaigns");
        return;
      }
      if (!affiliateLoading && affiliateStatus !== "completed") {
        setActiveTab("affiliate_onboarding");
        toast({
          title: "Onboarding Required",
          description: "Please complete the affiliate onboarding to unlock this space.",
          variant: "destructive"
        });
      } else {
        setActiveTab(tabParam as any);
      }
    } else if (tabParam === "affiliate_onboarding") {
      setActiveTab("affiliate_onboarding");
    }
  }, [searchParams, affiliateStatus, affiliateLoading, profile?.category]);

  useEffect(() => {
    const success = searchParams.get("success");
    const integration = searchParams.get("integration");
    const errorParam = searchParams.get("error");

    if (success === "true" && integration === "shopify") {
      toast({
        title: "Shopify Connected!",
        description: "Your Shopify store has been successfully integrated.",
        className: "bg-emerald-600 border-emerald-500 text-white"
      });
      loadProfile(true);
      setActiveTab("product_catalog");
      navigate("/brand/dashboard?tab=product_catalog", { replace: true });
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
    loadProfile(Boolean(cachedProfile));
  }, []);

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
          if (!cachedCampaigns) setLoading(true);
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

  const executeDeleteCampaign = async () => {
    if (!confirmDeleteCampaign) return;
    const target = confirmDeleteCampaign;
    const funds = target.funds_allocated || 0;
    try {
      setDeletingId(target.id);
      await deleteCampaign(target.id);
      setCampaigns(prev => prev.filter(c => c.id !== target.id));
      if (funds > 0) {
        await fetchBalance();
        toast({
          title: "Campaign Deleted",
          description: `Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`,
          className: "bg-emerald-600 border-emerald-500 text-white"
        });
      } else {
        toast({
          title: "Campaign Deleted",
          description: "The campaign has been permanently removed."
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      setError(msg);
      toast({ title: "Delete Failed", description: msg, variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDeleteCampaign(null);
    }
  };

  if (profileLoading && !profile) {
    return (
      <BrandLayout>
        <div className="flex flex-col items-center justify-center py-20 text-slate">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-3" />
          <p className="font-medium text-sm">Loading compliance dashboard...</p>
        </div>
      </BrandLayout>
    );
  }  

  // If Verified, render normal dashboard
  if (profile?.onboarding_status === "verified") {
    const isPersonalAgency = profile?.category === "Personal Agency";

    const renderApprovalPill = (campaign: Campaign) => {
      if (campaign.campaign_approval === "pending_approval") {
        return <StatusPill tone="warning" showDot>Pending Approval</StatusPill>;
      }
      if (campaign.campaign_approval === "rejected") {
        return (
          <span title={`Rejection Reason: ${campaign.rejection_reason || "Unspecified"}`}>
            <StatusPill tone="danger">Rejected</StatusPill>
          </span>
        );
      }
      if (campaign.is_active) {
        return <StatusPill tone="success" showDot>Active</StatusPill>;
      }
      return <StatusPill tone="neutral" showDot>Inactive</StatusPill>;
    };

    return (
      <BrandLayout>
        <div className="w-full space-y-6">
          {activeTab === "campaigns" && (
            <>
              <PortalPageHeader
                eyebrow="01 // CAMPAIGN LEDGER"
                title="Campaign"
                highlighted="Performance"
                accent="brand"
                subtitle="Manage and track your creator marketing campaigns."
              />
              
              <WalletOverview balance={walletBalance} onRefresh={fetchBalance} />
              
              <div className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden mt-6">
                {error && <div className="text-rose-600 text-sm p-4 border-b border-black/10 bg-rose-50/50">{error}</div>}
                {loading ? (
                  <div className="p-10 text-center text-slate font-medium text-sm">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                  <div className="p-10 sm:p-12 text-center text-slate">
                    <Building2 className="w-10 h-10 mx-auto text-steel mb-3" />
                    <p className="font-display font-bold text-lg text-ink">No campaigns created yet</p>
                    <p className="text-slate text-sm mt-1 mb-5">Launch your first marketing campaign to get started.</p>
                    <Link to="/brand/create">
                      <Button variant="brand">Create Campaign</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="divide-y divide-black/[0.06] sm:hidden">
                      {campaigns.map(campaign => (
                        <div key={campaign.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {campaign.campaign_approval === "approved" ? (
                                <Link
                                  to={`/brand/dashboard/${campaign.id}`}
                                  className="font-display font-bold text-sm text-brand-blue hover:underline block truncate"
                                >
                                  {campaign.name}
                                </Link>
                              ) : (
                                <span className="text-sm font-semibold text-slate flex items-center gap-1.5 truncate">
                                  <Lock className="w-3.5 h-3.5 text-steel shrink-0" />
                                  <span className="truncate">{campaign.name}</span>
                                </span>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate">
                                {campaign.platform.toLowerCase() === "instagram" ? (
                                  <Instagram className="w-3.5 h-3.5 text-ink" />
                                ) : (
                                  <Youtube className="w-3.5 h-3.5 text-rose-600" />
                                )}
                                <span className="capitalize">{campaign.platform}</span>
                              </div>
                            </div>
                            {renderApprovalPill(campaign)}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 text-xs">
                            <div>
                              <span className="text-[10px] font-mono text-steel uppercase block">Locked</span>
                              <span className="font-mono font-bold tabular-nums text-ink">
                                ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-steel uppercase block">CPV</span>
                              <span className="font-mono font-semibold tabular-nums text-slate">₹{campaign.cpv}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-steel uppercase block">Eyeballs</span>
                              <span className="font-mono font-semibold tabular-nums text-slate">
                                {(campaign.total_view_count || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                            <span className="font-mono text-steel">
                              {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : "—"}
                            </span>
                            <button
                              className="text-rose-600 hover:text-rose-700 font-semibold hover:underline disabled:opacity-50"
                              onClick={() => setConfirmDeleteCampaign(campaign)}
                              disabled={deletingId === campaign.id}
                            >
                              {deletingId === campaign.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-black/10">
                        <thead>
                          <tr className="bg-black/[0.02] border-b border-black/10">
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Campaign</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Platform</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Funds Locked</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">CPV</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Total Eyeballs</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Deadline</th>
                            <th className="px-6 py-4 text-left text-[10px] font-mono font-bold text-steel uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] bg-white">
                          {campaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-black/[0.02] transition-colors duration-150">
                              <td className="px-6 py-4 font-semibold whitespace-nowrap">
                                {renderApprovalPill(campaign)}
                              </td>
                              <td className="px-6 py-4 font-semibold text-ink">
                                {campaign.campaign_approval === "approved" ? (
                                  <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline text-brand-blue font-semibold transition-colors duration-150">
                                    {campaign.name}
                                  </Link>
                                ) : (
                                  <span className="text-slate cursor-not-allowed flex items-center gap-1.5 w-fit" title="Campaign is pending approval or rejected.">
                                    <Lock className="w-3.5 h-3.5 text-steel" />
                                    {campaign.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-sm text-slate font-medium">
                                  {campaign.platform.toLowerCase() === "instagram" ? (
                                    <Instagram className="w-4 h-4 text-ink" />
                                  ) : (
                                    <Youtube className="w-4 h-4 text-rose-600" />
                                  )}
                                  <span className="capitalize">{campaign.platform}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono font-semibold tabular-nums text-ink whitespace-nowrap">
                                ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-mono font-medium tabular-nums text-slate whitespace-nowrap">₹{campaign.cpv}</td>
                              <td className="px-6 py-4 font-mono tabular-nums text-ink whitespace-nowrap">{(campaign.total_view_count || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 font-mono text-xs text-steel whitespace-nowrap">
                                {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold hover:underline disabled:opacity-50 transition-colors duration-150 cursor-pointer"
                                  onClick={() => setConfirmDeleteCampaign(campaign)}
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
                  </>
                )}
              </div>
            </>
          )}

          {!isPersonalAgency && (
            <>
              {activeTab === "affiliate_onboarding" && (
                <AffiliateOnboarding 
                  businessCategory={profile?.category || "Product Based"} 
                  onOnboardingCompleted={() => {
                    setAffiliateStatus("completed");
                    setActiveTab("affiliate_campaigns");
                    navigate("/brand/dashboard?tab=affiliate_campaigns");
                  }} 
                />
              )}
              {activeTab === "affiliate_campaigns" && (
                <AffiliateCampaigns 
                  brandCategory={profile?.category || "Product Based"} 
                  brandWebsiteUrl={profile?.website_url || ""}
                />
              )}
              {activeTab === "product_catalog" && !profile?.category?.toLowerCase().includes("saas") && (
                <ProductCatalog integrationType={integrationType} />
              )}
              {activeTab === "affiliate_crm" && (
                <AffiliateCRM />
              )}
            </>
          )}

          {activeTab === "tax_invoices" && (
            <TaxInvoicesTab />
          )}
        </div>

        <ConfirmDialog
          open={Boolean(confirmDeleteCampaign)}
          onOpenChange={(open) => {
            if (!open) setConfirmDeleteCampaign(null);
          }}
          title="Delete Campaign"
          description={
            (confirmDeleteCampaign?.funds_allocated || 0) > 0
              ? `This campaign still has ₹${(confirmDeleteCampaign?.funds_allocated || 0).toLocaleString()} allocated. Deleting it will refund the full remaining budget to your wallet and permanently remove all campaign data.`
              : `Are you sure you want to delete "${confirmDeleteCampaign?.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Campaign"
          variant="destructive"
          loading={deletingId !== null}
          onConfirm={executeDeleteCampaign}
        />
      </BrandLayout>
    );
  }

  // Render Onboarding Wizard
  return (
    <BrandOnboarding 
      profile={profile} 
      onProfileUpdated={loadProfile} 
    />
  );
};

export default BrandDashboard;