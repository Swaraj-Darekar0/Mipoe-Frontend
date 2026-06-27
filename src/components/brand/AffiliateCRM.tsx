import React, { useEffect, useState } from "react";
import { 
  getCRMPartners, 
  getMappingClicks, 
  getMappingConversions 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Globe, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Database,
  ArrowLeft,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Coins,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [selectedPartner, setSelectedPartner] = useState<CRMPartner | null>(null);
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
        variant: "destructive" 
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
        getMappingConversions(partner.mapping_id)
      ]);
      setClicks(clickLogs);
      setConversions(convLogs);
    } catch (err: any) {
      toast({
        title: "Error Loading Details",
        description: err.message || "Could not fetch click/conversion logs.",
        variant: "destructive"
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Math aggregates
  const totalPartners = partners.length;
  const totalClicks = partners.reduce((sum, p) => sum + (p.total_clicks || 0), 0);
  const totalConversions = partners.reduce((sum, p) => sum + (p.total_conversions || 0), 0);
  const totalSales = partners.reduce((sum, p) => sum + (p.total_sales || 0), 0);
  const totalCommissions = partners.reduce((sum, p) => sum + (p.total_commission || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <Clock className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="font-semibold text-sm">Loading affiliate CRM records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {!selectedPartner ? (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-gray-150 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Partners</span>
                  <span className="text-lg font-black text-gray-800 block mt-0.5">{totalPartners} Creator(s)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-150 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Clicks</span>
                  <span className="text-lg font-black text-gray-800 block mt-0.5">{totalClicks.toLocaleString()} click(s)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-150 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Referral Sales</span>
                  <span className="text-lg font-black text-gray-800 block mt-0.5">₹{totalSales.toLocaleString()}</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">{totalConversions} conversion(s)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-150 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Commissions Paid</span>
                  <span className="text-lg font-black text-gray-800 block mt-0.5">₹{totalCommissions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CRM Partners List Table */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Affiliate Relationship Manager (CRM)</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Click any partner block/row below to inspect granular referral click stream and conversion metrics.</p>
            </div>

            {partners.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="font-bold text-gray-700 text-sm">No partners mapped yet</p>
                <p className="text-xs text-gray-400 mt-1">Approved creators in your affiliate campaigns will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-150 text-left">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Creator / Partner</th>
                      <th className="px-6 py-4">Affiliate Program</th>
                      <th className="px-6 py-4">Promo Code</th>
                      <th className="px-6 py-4 text-center">Clicks</th>
                      <th className="px-6 py-4 text-center">Conversions</th>
                      <th className="px-6 py-4">Sales Amount</th>
                      <th className="px-6 py-4">Commission</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-xs text-gray-750">
                    {partners.map(p => (
                      <tr 
                        key={p.mapping_id} 
                        onClick={() => loadPartnerDetails(p)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {p.creator.profile_image ? (
                              <img src={p.creator.profile_image} alt={p.creator.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 bg-indigo-50">
                                {p.creator.username.substring(0,2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">@{p.creator.username}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {p.creator.instagram_username ? `IG: ${p.creator.instagram_username}` : "Platform Account"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 block">{p.campaign.name}</span>
                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block mt-1">
                            {p.campaign.campaign_type === "saas_subscription" ? "SaaS" : "Product Store"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 font-semibold">{p.affiliate_code}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{p.total_clicks}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{p.total_conversions}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">₹{p.total_sales.toLocaleString()}</td>
                        <td className="px-6 py-4 font-extrabold text-indigo-650">₹{p.total_commission.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                            p.status === "active" 
                              ? "bg-green-50 border border-green-200 text-green-700" 
                              : "bg-zinc-100 border border-zinc-200 text-zinc-650"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Detailed Partner Sub-Panel Dashboard */
        <div className="space-y-6 animate-in slide-in-from-right duration-250">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPartner(null)}
              className="text-xs h-8 border-gray-200 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Partners
            </Button>
            <h3 className="font-bold text-gray-900 text-base">Partner Overview: @{selectedPartner.creator.username}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Partner profile & settings info */}
            <div className="space-y-6">
              
              {/* Creator details card */}
              <Card className="bg-white border-gray-150 shadow-sm rounded-2xl overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-80" />
                <CardContent className="p-5 pt-0 relative">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-white overflow-hidden -mt-8 shadow-md">
                    {selectedPartner.creator.profile_image ? (
                      <img src={selectedPartner.creator.profile_image} alt={selectedPartner.creator.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-extrabold text-lg text-indigo-650 bg-indigo-50">
                        {selectedPartner.creator.username.substring(0,2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <span className="font-extrabold text-base text-gray-900 block">@{selectedPartner.creator.username}</span>
                    {selectedPartner.creator.instagram_username && (
                      <a 
                        href={`https://instagram.com/${selectedPartner.creator.instagram_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-650 hover:underline inline-flex items-center gap-1"
                      >
                        Instagram: @{selectedPartner.creator.instagram_username}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-[10px] text-gray-400 block pt-1 uppercase tracking-widest font-mono">Affiliate Promo Code</span>
                    <span className="font-mono text-sm font-black text-gray-800 bg-gray-50 border border-gray-150 rounded-xl px-3 py-1.5 block text-center select-all">
                      {selectedPartner.affiliate_code}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign rules summary */}
              <Card className="bg-white border-gray-150 shadow-sm rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h4 className="font-bold text-gray-950 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                    <Megaphone className="w-4 h-4 text-indigo-500" />
                    Campaign Payout Terms
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Campaign Name</span>
                      <span className="font-bold text-gray-800 block mt-0.5">{selectedPartner.campaign.name}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 block">Commission Model</span>
                      {selectedPartner.campaign.campaign_type === "saas_subscription" ? (
                        <div className="mt-1 space-y-1">
                          <span className="font-bold text-indigo-600 block">SaaS Interval Schedule</span>
                          {/* We fetch full campaign payout structure from details */}
                          <span className="text-[10px] text-gray-500 leading-normal block">
                            Calculated dynamically based on weekly/monthly/yearly pricing plans.
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-800 block mt-0.5 capitalize">
                          {selectedPartner.campaign.commission_type === "percentage" 
                            ? `${selectedPartner.campaign.commission_value}% per sale` 
                            : `₹${selectedPartner.campaign.commission_value} flat per sale`}
                        </span>
                      )}
                    </div>

                    {selectedPartner.campaign.landing_page_url && (
                      <div>
                        <span className="text-gray-400 block">Promo Landing Page</span>
                        <a 
                          href={selectedPartner.campaign.landing_page_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-bold text-indigo-650 hover:underline flex items-center gap-1 mt-0.5 break-all"
                        >
                          {selectedPartner.campaign.landing_page_url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side: click logs and conversion logs tabs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Partner Aggregated Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm">
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Clicks</span>
                  <span className="text-lg font-extrabold text-gray-800 block mt-0.5">{selectedPartner.total_clicks}</span>
                </div>
                <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm">
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Conversions</span>
                  <span className="text-lg font-extrabold text-gray-800 block mt-0.5">{selectedPartner.total_conversions}</span>
                </div>
                <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm">
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Earnings</span>
                  <span className="text-lg font-extrabold text-indigo-650 block mt-0.5">₹{selectedPartner.total_commission.toLocaleString()}</span>
                </div>
              </div>

              {/* Clicks Log Table */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Referral Click Stream Logs ({clicks.length})
                </h4>

                {detailLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <p className="text-xs">Loading click stream...</p>
                  </div>
                ) : clicks.length === 0 ? (
                  <div className="py-8 text-center text-gray-450 border border-dashed border-gray-200 rounded-xl">
                    <Info className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs font-bold">No clicks recorded yet</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Clicks are logged when users click the creator's redirect link.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-150 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">IP Address</th>
                          <th className="py-3 px-4">Referrer Source</th>
                          <th className="py-3 px-4">Device Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {clicks.map(click => (
                          <tr key={click.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 text-gray-550 whitespace-nowrap">{click.created_at ? new Date(click.created_at).toLocaleString() : "—"}</td>
                            <td className="py-2.5 px-4 font-mono text-gray-500">{click.ip_address || "—"}</td>
                            <td className="py-2.5 px-4 truncate max-w-xs text-gray-500" title={click.referrer}>
                              {click.referrer ? (
                                <a href={click.referrer} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                  {click.referrer.split('/')[2] || "Link"}
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ) : "Direct / Bookmark"}
                            </td>
                            <td className="py-2.5 px-4 truncate max-w-[150px] text-gray-400" title={click.user_agent}>
                              {click.user_agent || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Conversions Log Table */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  Conversion & Sales Commissions ({conversions.length})
                </h4>

                {detailLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <p className="text-xs">Loading conversions...</p>
                  </div>
                ) : conversions.length === 0 ? (
                  <div className="py-8 text-center text-gray-450 border border-dashed border-gray-200 rounded-xl">
                    <Info className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs font-bold">No sales conversion logged yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-150 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Order ID / Ref</th>
                          <th className="py-3 px-4">Purchased Plan/Product</th>
                          <th className="py-3 px-4">Order Amount</th>
                          <th className="py-3 px-4">Commission</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {conversions.map(conv => (
                          <tr key={conv.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono text-gray-500">{conv.order_id}</td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{conv.product_name || "General Conversion"}</td>
                            <td className="py-2.5 px-4 font-bold">₹{conv.order_amount.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-extrabold text-indigo-650">₹{conv.commission_amount.toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-gray-400">{conv.timestamp ? new Date(conv.timestamp).toLocaleString() : "—"}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-wider ${
                                conv.status === "completed" 
                                  ? "bg-green-50 border border-green-200 text-green-700" 
                                  : conv.status === "insufficient_budget"
                                  ? "bg-red-50 border border-red-200 text-red-755"
                                  : "bg-zinc-100 border border-zinc-200 text-zinc-650"
                              }`}>
                                {conv.status === "completed" ? "Success" : conv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
