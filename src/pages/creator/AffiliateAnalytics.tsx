import React, { useEffect, useState, useCallback } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { 
  getCreatorAffiliateCampaigns, 
  getCreatorConversions, 
  getWalletBalance,
  CreatorAffiliateCampaign 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Clock, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Briefcase 
} from "lucide-react";
import { Link } from "react-router-dom";

const CreatorAffiliateAnalyticsPage: React.FC = () => {
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<CreatorAffiliateCampaign[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <p className="font-semibold text-sm">Aggregating affiliate intelligence metrics...</p>
        </div>
      </CreatorLayout>
    );
  }

  // Filter lists
  const appliedCampaigns = campaigns.filter(c => c.application_status !== null);
  const pendingCount = campaigns.filter(c => c.application_status === "applied").length;
  const approvedCount = campaigns.filter(c => c.application_status === "active").length;
  const rejectedCount = campaigns.filter(c => c.application_status === "rejected").length;

  const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);

  // Group conversions by campaign to get earnings per campaign
  const getCampaignEarnings = (campaignId: number) => {
    return conversions
      .filter(conv => conv.campaign_id === campaignId)
      .reduce((sum, conv) => sum + conv.commission_amount, 0);
  };

  return (
    <CreatorLayout>
      <div className="space-y-8 animate-in fade-in duration-200">
        
        {/* Header Section */}
        <header className="space-y-1.5">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 flex items-center gap-2.5">
            Affiliate Analytics
            <TrendingUp className="w-6 h-6 text-orange-500 shrink-0" />
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl">
            Monitor your affiliate applications, tracking codes conversion success, and recursive lifetime payouts.
          </p>
        </header>

        {/* Analytics stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Coins className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Total Affiliate Earnings</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Approved Programs</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{approvedCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Pending Approvals</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Rejected Applications</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{rejectedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Applications list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Applied Programs & Payouts ({appliedCampaigns.length})
              </h3>

              {appliedCampaigns.length === 0 ? (
                <div className="bg-zinc-50/60 p-12 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-500 max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p className="font-bold text-xs text-zinc-800">No active applications</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Submit applications to campaigns in the Explore tab to start earning.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Campaign Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Earnings</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {appliedCampaigns.map(c => (
                        <tr key={c.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3.5 px-4 font-bold text-zinc-900 truncate max-w-[180px]">{c.name}</td>
                          <td className="py-3.5 px-4">
                            {c.campaign_type === "saas_subscription" ? (
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200/60 text-[10px] px-2 py-0.5 font-bold uppercase">SaaS</Badge>
                            ) : (
                              <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200/60 text-[10px] px-2 py-0.5 font-bold uppercase">Store</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.application_status === "active" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px] px-2 py-0.5 font-bold uppercase">Approved</Badge>
                            ) : c.application_status === "applied" ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 text-[10px] px-2 py-0.5 font-bold uppercase">Pending</Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200/60 text-[10px] px-2 py-0.5 font-bold uppercase">Rejected</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-orange-600">₹{getCampaignEarnings(c.id).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Link to={`/creator/affiliate-campaigns/${c.id}`} className="text-orange-600 hover:text-orange-700 font-bold hover:underline">
                              View Stats
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Conversions summary list */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                Recent Conversions
              </h3>

              {conversions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic bg-zinc-50/60 p-4 border border-dashed border-zinc-200 rounded-xl">No conversions logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {conversions.slice(0, 5).map(conv => (
                    <div key={conv.id} className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-900 text-xs block truncate">{conv.product_name || "General Conversion"}</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">{conv.order_id}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-orange-600 text-xs block">₹{conv.commission_amount}</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</span>
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
