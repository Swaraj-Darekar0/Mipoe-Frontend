import React, { useEffect, useState, useCallback } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import GuestLockedView from "@/components/creator/GuestLockedView";
import { 
  getCreatorAffiliateCampaigns, 
  getCreatorConversions, 
  getWalletBalance,
  CreatorAffiliateCampaign,
  getUserId 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Briefcase 
} from "lucide-react";
import { Link } from "react-router-dom";
import { PortalPageHeader, MetricCell, StatusPill } from "@/components/ui/PortalPrimitives";

const CreatorAffiliateAnalyticsPage: React.FC = () => {
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<CreatorAffiliateCampaign[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!getUserId()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [campsData, conversionsData, walletData] = await Promise.all([
        getCreatorAffiliateCampaigns(),
        getCreatorConversions(),
        getWalletBalance()
      ]);
      setCampaigns(campsData);
      setConversions(conversionsData);
      setWalletBalance(walletData.balance);
    } catch (err: any) {
      toast({
        title: "Load Error",
        description: err.message || "Failed to load affiliate analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!getUserId()) {
    return (
      <CreatorLayout>
        <GuestLockedView
          title="Affiliate Performance & Commission Tracking"
          subtitle="Real-Time Clicks, Conversions & Earnings"
          description="Sign in to monitor your affiliate link traffic, active attribution conversions, and unlock direct commission payouts."
          returnUrl="/creator/affiliate-analytics"
          icon={<TrendingUp className="w-8 h-8 text-lava" />}
        />
      </CreatorLayout>
    );
  }

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate">
          <Loader2 className="w-8 h-8 animate-spin text-lava mb-3" />
          <p className="font-semibold text-sm">Aggregating affiliate intelligence metrics...</p>
        </div>
      </CreatorLayout>
    );
  }

  const appliedCampaigns = campaigns.filter(c => c.application_status !== null);
  const pendingCount = campaigns.filter(c => c.application_status === "applied").length;
  const approvedCount = campaigns.filter(c => c.application_status === "active").length;
  const rejectedCount = campaigns.filter(c => c.application_status === "rejected").length;

  const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);

  const getCampaignEarnings = (campaignId: number) => {
    return conversions
      .filter(conv => conv.campaign_id === campaignId)
      .reduce((sum, conv) => sum + conv.commission_amount, 0);
  };

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <PortalPageHeader
          eyebrow="03 // PERFORMANCE LEDGER"
          title="Affiliate"
          highlighted="Analytics"
          accent="creator"
          subtitle="Monitor your affiliate applications, tracking code conversion success, and recurring payouts."
          action={
            <div className="bg-white border border-black/10 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] shrink-0">
              <div className="p-2 bg-lava/10 border border-lava/20 rounded-xl">
                <Coins className="w-4 h-4 text-lava" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-steel font-bold block uppercase tracking-widest">Wallet Balance</span>
                <span className="font-mono font-bold tabular-nums text-base text-ink">₹{walletBalance.toLocaleString()}</span>
              </div>
            </div>
          }
        />

        {/* Analytics stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCell
            label="Total Affiliate Earnings"
            value={`₹${totalEarnings.toLocaleString()}`}
            sublabel="Attributed commissions"
            valueClassName="text-lava"
          />
          <MetricCell
            label="Approved Programs"
            value={approvedCount}
            sublabel="Active partner codes"
            valueClassName="text-emerald-700"
          />
          <MetricCell
            label="Pending Approvals"
            value={pendingCount}
            sublabel="Under brand review"
            valueClassName="text-amber-700"
          />
          <MetricCell
            label="Rejected Applications"
            value={rejectedCount}
            sublabel="Declined programs"
            valueClassName="text-rose-700"
          />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Applications list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
              <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-lava" />
                Applied Programs & Payouts ({appliedCampaigns.length})
              </h3>

              {appliedCampaigns.length === 0 ? (
                <div className="bg-black/[0.02] p-10 border border-dashed border-black/15 rounded-2xl text-center text-slate max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-steel" />
                  <p className="font-bold text-xs text-ink">No active applications</p>
                  <p className="text-[11px] text-slate mt-1">Submit applications to campaigns in the Explore tab to start earning.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="space-y-3 sm:hidden">
                    {appliedCampaigns.map(c => (
                      <div key={c.id} className="bg-black/[0.02] border border-black/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-ink text-sm truncate">{c.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <StatusPill tone={c.campaign_type === "saas_subscription" ? "creator" : "neutral"}>
                                {c.campaign_type === "saas_subscription" ? "SaaS" : "Store"}
                              </StatusPill>
                              <StatusPill
                                tone={
                                  c.application_status === "active"
                                    ? "success"
                                    : c.application_status === "applied"
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {c.application_status === "active"
                                  ? "Approved"
                                  : c.application_status === "applied"
                                  ? "Pending"
                                  : "Rejected"}
                              </StatusPill>
                            </div>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-sm text-lava shrink-0">
                            ₹{getCampaignEarnings(c.id).toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-black/5 flex justify-end">
                          <Link
                            to={`/creator/affiliate-campaigns/${c.id}`}
                            className="text-xs text-lava hover:text-lava-hover font-semibold hover:underline"
                          >
                            View Stats
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/10 text-steel font-mono font-bold uppercase tracking-widest text-[10px]">
                          <th className="py-3 px-4">Campaign Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Earnings</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] text-slate">
                        {appliedCampaigns.map(c => (
                          <tr key={c.id} className="hover:bg-black/[0.02] transition-colors duration-150">
                            <td className="py-3.5 px-4 font-bold text-ink truncate max-w-[180px]">{c.name}</td>
                            <td className="py-3.5 px-4">
                              <StatusPill tone={c.campaign_type === "saas_subscription" ? "creator" : "neutral"}>
                                {c.campaign_type === "saas_subscription" ? "SaaS" : "Store"}
                              </StatusPill>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusPill
                                tone={
                                  c.application_status === "active"
                                    ? "success"
                                    : c.application_status === "applied"
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {c.application_status === "active"
                                  ? "Approved"
                                  : c.application_status === "applied"
                                  ? "Pending"
                                  : "Rejected"}
                              </StatusPill>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-lava">
                              ₹{getCampaignEarnings(c.id).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to={`/creator/affiliate-campaigns/${c.id}`}
                                className="text-lava hover:text-lava-hover font-semibold hover:underline"
                              >
                                View Stats
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Conversions summary list */}
          <div>
            <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
              <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-lava" />
                Recent Conversions
              </h3>

              {conversions.length === 0 ? (
                <p className="text-xs text-slate bg-black/[0.02] p-4 border border-dashed border-black/15 rounded-xl">
                  No conversions logged yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {conversions.slice(0, 5).map(conv => (
                    <div key={conv.id} className="bg-black/[0.02] border border-black/10 p-3.5 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-bold text-ink text-xs block truncate">{conv.product_name || "General Conversion"}</span>
                        <span className="text-[10px] text-steel block mt-0.5 font-mono truncate">{conv.order_id}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold tabular-nums text-lava text-xs block">₹{conv.commission_amount}</span>
                        <span className="text-[10px] text-steel font-mono block mt-0.5">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAffiliateAnalyticsPage;
