import React, { useEffect, useState } from "react";
import {
  getCRMPartners,
  getMappingClicks,
  getMappingConversions,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  TrendingUp,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Info,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCell, StatusPill } from "@/components/ui/PortalPrimitives";

interface CRMPartner {
  mapping_id: number;
  creator: {
    id: number;
    username: string;
    profile_image: string | null;
    instagram_username: string | null;
  };
  campaign: {
    id: number;
    name: string;
    campaign_type: string;
    commission_type: string;
    commission_value: number;
    landing_page_url: string | null;
  };
  affiliate_code: string;
  status: string;
  total_clicks: number;
  total_conversions: number;
  total_sales: number;
  total_commission: number;
  created_at: string | null;
}

export const AffiliateCRM: React.FC = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<CRMPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<CRMPartner | null>(
    null
  );
  const [clicks, setClicks] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPartnersData = async () => {
    setLoading(true);
    try {
      const data = await getCRMPartners();
      setPartners(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load partners records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnersData();
  }, []);

  const loadPartnerDetails = async (partner: CRMPartner) => {
    setSelectedPartner(partner);
    setDetailLoading(true);
    try {
      const [clickLogs, convLogs] = await Promise.all([
        getMappingClicks(partner.mapping_id),
        getMappingConversions(partner.mapping_id),
      ]);
      setClicks(clickLogs);
      setConversions(convLogs);
    } catch (err: any) {
      toast({
        title: "Error Loading Details",
        description: err.message || "Could not fetch click/conversion logs.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Math aggregates
  const totalPartners = partners.length;
  const totalClicks = partners.reduce((sum, p) => sum + (p.total_clicks || 0), 0);
  const totalConversions = partners.reduce(
    (sum, p) => sum + (p.total_conversions || 0),
    0
  );
  const totalSales = partners.reduce((sum, p) => sum + (p.total_sales || 0), 0);
  const totalCommissions = partners.reduce(
    (sum, p) => sum + (p.total_commission || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue mb-3" />
        <p className="font-medium text-sm">Loading affiliate CRM records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedPartner ? (
        <>
          {/* Dashboard Stats */}
          <div className="bg-white border border-black/10 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCell
              label="Total Partners"
              value={`${totalPartners} Creator(s)`}
            />
            <MetricCell
              label="Total Clicks"
              value={totalClicks.toLocaleString()}
              sublabel="tracked referral visits"
            />
            <MetricCell
              label="Referral Sales"
              value={`₹${totalSales.toLocaleString()}`}
              sublabel={`${totalConversions} conversion(s)`}
            />
            <MetricCell
              label="Commissions Paid"
              value={`₹${totalCommissions.toLocaleString()}`}
              valueClassName="text-brand-blue"
            />
          </div>

          {/* CRM Partners List Table */}
          <div className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-black/10">
              <h3 className="font-display font-bold text-ink text-base">
                Affiliate Relationship Manager (CRM)
              </h3>
              <p className="text-xs text-slate mt-0.5">
                Click any partner below to inspect granular referral click stream and conversion metrics.
              </p>
            </div>

            {partners.length === 0 ? (
              <div className="p-12 text-center text-slate">
                <Users className="w-10 h-10 mx-auto text-steel mb-3" />
                <p className="font-display font-bold text-ink text-sm">
                  No partners mapped yet
                </p>
                <p className="text-xs text-slate mt-1">
                  Approved creators in your affiliate campaigns will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-black/[0.06]">
                  {partners.map((p) => (
                    <button
                      type="button"
                      key={p.mapping_id}
                      onClick={() => loadPartnerDetails(p)}
                      className="w-full text-left p-4 space-y-3 hover:bg-black/[0.02] transition-colors duration-150"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-black/[0.04] overflow-hidden shrink-0 border border-black/10">
                            {p.creator.profile_image ? (
                              <img
                                src={p.creator.profile_image}
                                alt={p.creator.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-mono text-xs font-bold text-brand-blue bg-brand-blue/10">
                                {p.creator.username.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-ink block truncate text-sm">
                              @{p.creator.username}
                            </span>
                            <span className="text-[11px] text-slate block truncate">
                              {p.campaign.name}
                            </span>
                          </div>
                        </div>
                        <StatusPill
                          tone={p.status === "active" ? "success" : "neutral"}
                          showDot={p.status === "active"}
                        >
                          {p.status}
                        </StatusPill>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/[0.03] rounded-xl p-2.5 border border-black/[0.06] text-xs">
                        <div>
                          <span className="font-mono text-[9px] text-steel uppercase block">
                            Clicks
                          </span>
                          <span className="font-mono font-bold tabular-nums text-ink">
                            {p.total_clicks}
                          </span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-steel uppercase block">
                            Sales
                          </span>
                          <span className="font-mono font-bold tabular-nums text-ink">
                            ₹{p.total_sales.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-steel uppercase block">
                            Comm.
                          </span>
                          <span className="font-mono font-bold tabular-nums text-brand-blue">
                            ₹{p.total_commission.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-black/10 text-left">
                    <thead>
                      <tr className="bg-[#fafafb] border-b border-black/10 font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                        <th className="px-6 py-3.5">Creator / Partner</th>
                        <th className="px-6 py-3.5">Affiliate Program</th>
                        <th className="px-6 py-3.5">Promo Code</th>
                        <th className="px-6 py-3.5 text-center">Clicks</th>
                        <th className="px-6 py-3.5 text-center">Conversions</th>
                        <th className="px-6 py-3.5">Sales Amount</th>
                        <th className="px-6 py-3.5">Commission</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06] bg-white text-xs text-ink">
                      {partners.map((p) => (
                        <tr
                          key={p.mapping_id}
                          onClick={() => loadPartnerDetails(p)}
                          className="hover:bg-black/[0.02] cursor-pointer transition-colors duration-150"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/[0.04] overflow-hidden shrink-0 border border-black/10">
                              {p.creator.profile_image ? (
                                <img
                                  src={p.creator.profile_image}
                                  alt={p.creator.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-mono text-[11px] font-bold text-brand-blue bg-brand-blue/10">
                                  {p.creator.username
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-ink block">
                                @{p.creator.username}
                              </span>
                              <span className="text-[11px] text-slate block mt-0.5">
                                {p.creator.instagram_username
                                  ? `IG: ${p.creator.instagram_username}`
                                  : "Platform Account"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-ink block">
                              {p.campaign.name}
                            </span>
                            <span className="font-mono text-[9px] bg-black/[0.04] border border-black/10 text-slate px-1.5 py-0.5 rounded font-medium uppercase tracking-wider inline-block mt-1">
                              {p.campaign.campaign_type === "saas_subscription"
                                ? "SaaS"
                                : "Product Store"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate font-semibold">
                            {p.affiliate_code}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold tabular-nums text-ink">
                            {p.total_clicks}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold tabular-nums text-ink">
                            {p.total_conversions}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold tabular-nums text-ink">
                            ₹{p.total_sales.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold tabular-nums text-brand-blue">
                            ₹{p.total_commission.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill
                              tone={p.status === "active" ? "success" : "neutral"}
                              showDot={p.status === "active"}
                            >
                              {p.status}
                            </StatusPill>
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
      ) : (
        /* Detailed Partner Sub-Panel Dashboard */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPartner(null)}
              className="text-xs h-8 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Partners
            </Button>
            <h3 className="font-display font-bold text-ink text-base">
              Partner Overview: @{selectedPartner.creator.username}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Partner profile & settings info */}
            <div className="space-y-6">
              {/* Creator details card */}
              <div className="bg-white border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
                <div className="h-12 bg-[#fafafb] border-b border-black/10" />
                <div className="p-5 pt-0 relative">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-black/10 overflow-hidden -mt-8 shadow-sm">
                    {selectedPartner.creator.profile_image ? (
                      <img
                        src={selectedPartner.creator.profile_image}
                        alt={selectedPartner.creator.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono font-bold text-base text-brand-blue bg-brand-blue/10">
                        {selectedPartner.creator.username
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <span className="font-display font-bold text-base text-ink block">
                      @{selectedPartner.creator.username}
                    </span>
                    {selectedPartner.creator.instagram_username && (
                      <a
                        href={`https://instagram.com/${selectedPartner.creator.instagram_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-brand-blue hover:underline inline-flex items-center gap-1"
                      >
                        Instagram: @{selectedPartner.creator.instagram_username}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-[10px] text-steel block pt-2 uppercase tracking-widest font-mono">
                      Affiliate Promo Code
                    </span>
                    <span className="font-mono text-sm font-bold text-ink bg-black/[0.03] border border-black/10 rounded-xl px-3 py-1.5 block text-center select-all">
                      {selectedPartner.affiliate_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign rules summary */}
              <div className="bg-white border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] rounded-2xl p-5 space-y-4">
                <h4 className="font-mono font-semibold text-ink text-[11px] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-black/10">
                  <Megaphone className="w-4 h-4 text-brand-blue" />
                  Campaign Payout Terms
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-steel uppercase tracking-wider block">
                      Campaign Name
                    </span>
                    <span className="font-semibold text-ink block mt-0.5">
                      {selectedPartner.campaign.name}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] text-steel uppercase tracking-wider block">
                      Commission Model
                    </span>
                    {selectedPartner.campaign.campaign_type ===
                    "saas_subscription" ? (
                      <div className="mt-1 space-y-1">
                        <span className="font-semibold text-brand-blue block">
                          SaaS Interval Schedule
                        </span>
                        {/* We fetch full campaign payout structure from details */}
                        <span className="text-[11px] text-slate leading-normal block">
                          Calculated dynamically based on weekly/monthly/yearly pricing plans.
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-ink block mt-0.5 capitalize">
                        {selectedPartner.campaign.commission_type ===
                        "percentage"
                          ? `${selectedPartner.campaign.commission_value}% per sale`
                          : `₹${selectedPartner.campaign.commission_value} flat per sale`}
                      </span>
                    )}
                  </div>

                  {selectedPartner.campaign.landing_page_url && (
                    <div>
                      <span className="font-mono text-[10px] text-steel uppercase tracking-wider block">
                        Promo Landing Page
                      </span>
                      <a
                        href={selectedPartner.campaign.landing_page_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-blue hover:underline flex items-center gap-1 mt-0.5 break-all"
                      >
                        {selectedPartner.campaign.landing_page_url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: click logs and conversion logs tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Partner Aggregated Stats */}
              <div className="bg-white border border-black/10 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCell
                  label="Clicks"
                  value={selectedPartner.total_clicks.toLocaleString()}
                />
                <MetricCell
                  label="Conversions"
                  value={selectedPartner.total_conversions.toLocaleString()}
                />
                <MetricCell
                  label="Earnings"
                  value={`₹${selectedPartner.total_commission.toLocaleString()}`}
                  valueClassName="text-brand-blue"
                />
              </div>

              {/* Clicks Log Table */}
              <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4">
                <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-blue" />
                  Referral Click Stream Logs ({clicks.length})
                </h4>

                {detailLoading ? (
                  <div className="py-8 text-center text-slate">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-blue mb-2" />
                    <p className="text-xs">Loading click stream...</p>
                  </div>
                ) : clicks.length === 0 ? (
                  <div className="py-8 text-center text-slate border border-dashed border-black/15 rounded-xl bg-black/[0.01]">
                    <Info className="w-5 h-5 mx-auto mb-1 text-steel" />
                    <p className="text-xs font-semibold text-ink">
                      No clicks recorded yet
                    </p>
                    <p className="text-[11px] text-slate mt-0.5">
                      Clicks are logged when users click the creator's redirect link.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Click Cards */}
                    <div className="md:hidden divide-y divide-black/[0.06] border border-black/10 rounded-xl max-h-72 overflow-y-auto">
                      {clicks.map((click) => (
                        <div key={click.id} className="p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-ink">
                              {click.created_at
                                ? new Date(click.created_at).toLocaleString()
                                : "—"}
                            </span>
                            <span className="font-mono text-[11px] text-slate">
                              {click.ip_address || "—"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate truncate">
                            {click.referrer
                              ? click.referrer.split("/")[2] || click.referrer
                              : "Direct / Bookmark"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Click Table */}
                    <div className="hidden md:block overflow-x-auto max-h-64 overflow-y-auto border border-black/10 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#fafafb] border-b border-black/10 font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">IP Address</th>
                            <th className="py-3 px-4">Referrer Source</th>
                            <th className="py-3 px-4">Device Browser</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] text-ink">
                          {clicks.map((click) => (
                            <tr
                              key={click.id}
                              className="hover:bg-black/[0.02] transition-colors duration-150"
                            >
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate whitespace-nowrap">
                                {click.created_at
                                  ? new Date(click.created_at).toLocaleString()
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate">
                                {click.ip_address || "—"}
                              </td>
                              <td
                                className="py-2.5 px-4 truncate max-w-xs text-slate"
                                title={click.referrer}
                              >
                                {click.referrer ? (
                                  <a
                                    href={click.referrer}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-blue hover:underline inline-flex items-center gap-1"
                                  >
                                    {click.referrer.split("/")[2] || "Link"}
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                ) : (
                                  "Direct / Bookmark"
                                )}
                              </td>
                              <td
                                className="py-2.5 px-4 truncate max-w-[150px] text-steel"
                                title={click.user_agent}
                              >
                                {click.user_agent || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Conversions Log Table */}
              <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4">
                <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Conversion & Sales Commissions ({conversions.length})
                </h4>

                {detailLoading ? (
                  <div className="py-8 text-center text-slate">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-blue mb-2" />
                    <p className="text-xs">Loading conversions...</p>
                  </div>
                ) : conversions.length === 0 ? (
                  <div className="py-8 text-center text-slate border border-dashed border-black/15 rounded-xl bg-black/[0.01]">
                    <Info className="w-5 h-5 mx-auto mb-1 text-steel" />
                    <p className="text-xs font-semibold text-ink">
                      No sales conversion logged yet
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Conversion Cards */}
                    <div className="md:hidden divide-y divide-black/[0.06] border border-black/10 rounded-xl max-h-72 overflow-y-auto">
                      {conversions.map((conv) => (
                        <div key={conv.id} className="p-3 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-semibold text-ink block truncate">
                                {conv.product_name || "General Conversion"}
                              </span>
                              <span className="font-mono text-[10px] text-steel">
                                #{conv.order_id}
                              </span>
                            </div>
                            <StatusPill
                              tone={
                                conv.status === "completed"
                                  ? "success"
                                  : conv.status === "insufficient_budget"
                                    ? "danger"
                                    : "neutral"
                              }
                            >
                              {conv.status === "completed"
                                ? "Success"
                                : conv.status}
                            </StatusPill>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate">
                              Order: ₹{conv.order_amount.toLocaleString()}
                            </span>
                            <span className="font-mono font-bold text-brand-blue">
                              Comm: ₹{conv.commission_amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Conversion Table */}
                    <div className="hidden md:block overflow-x-auto max-h-64 overflow-y-auto border border-black/10 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#fafafb] border-b border-black/10 font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                            <th className="py-3 px-4">Order ID / Ref</th>
                            <th className="py-3 px-4">Purchased Plan/Product</th>
                            <th className="py-3 px-4">Order Amount</th>
                            <th className="py-3 px-4">Commission</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] text-ink">
                          {conversions.map((conv) => (
                            <tr
                              key={conv.id}
                              className="hover:bg-black/[0.02] transition-colors duration-150"
                            >
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate">
                                {conv.order_id}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-ink">
                                {conv.product_name || "General Conversion"}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold tabular-nums">
                                ₹{conv.order_amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold tabular-nums text-brand-blue">
                                ₹{conv.commission_amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate">
                                {conv.timestamp
                                  ? new Date(conv.timestamp).toLocaleString()
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-4">
                                <StatusPill
                                  tone={
                                    conv.status === "completed"
                                      ? "success"
                                      : conv.status === "insufficient_budget"
                                        ? "danger"
                                        : "neutral"
                                  }
                                >
                                  {conv.status === "completed"
                                    ? "Success"
                                    : conv.status}
                                </StatusPill>
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
          </div>
        </div>
      )}
    </div>
  );
};
