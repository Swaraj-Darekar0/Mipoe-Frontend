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
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
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
          <p className="font-bold text-sm">Aggregating affiliate intelligence metrics...</p>
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
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Header Section */}
        <header className="space-y-1.5">
          <h1 className="font-display text-4xl font-extrabold text-white flex items-center gap-2.5">
            Affiliate Analytics
            <TrendingUp className="w-6 h-6 text-orange-500 shrink-0" />
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Monitor your affiliate applications, tracking codes conversion success, and recursive lifetime payouts.
          </p>
        </header>

        {/* Analytics stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <Coins className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Total Affiliate Earnings</span>
                <span className="text-lg font-black text-white block mt-0.5">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Approved Programs</span>
                <span className="text-lg font-black text-white block mt-0.5">{approvedCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Pending Approvals</span>
                <span className="text-lg font-black text-white block mt-0.5">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Rejected Applications</span>
                <span className="text-lg font-black text-white block mt-0.5">{rejectedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Applications list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Applied Programs & Payouts ({appliedCampaigns.length})
              </h3>

              {appliedCampaigns.length === 0 ? (
                <div className="bg-zinc-950/40 p-12 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-650" />
                  <p className="font-bold text-xs">No active applications</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Submit applications to campaigns in the Explore tab to start earning.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Campaign Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Earnings</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {appliedCampaigns.map(c => (
                        <tr key={c.id} className="hover:bg-zinc-950/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white truncate max-w-[180px]">{c.name}</td>
                          <td className="py-3.5 px-4">
                            {c.campaign_type === "saas_subscription" ? (
                              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] px-1.5 font-bold uppercase">SaaS</Badge>
                            ) : (
                              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] px-1.5 font-bold uppercase">Store</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.application_status === "active" ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-2 font-bold uppercase">Approved</Badge>
                            ) : c.application_status === "applied" ? (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] px-2 font-bold uppercase">Pending</Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] px-2 font-bold uppercase">Rejected</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-indigo-400">₹{getCampaignEarnings(c.id).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Link to={`/creator/affiliate-campaigns/${c.id}`} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
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
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Recent Conversions
              </h3>

              {conversions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic bg-zinc-950/40 p-4 border border-dashed border-zinc-800 rounded-xl">No conversions logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {conversions.slice(0, 5).map(conv => (
                    <div key={conv.id} className="bg-zinc-950/60 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">{conv.product_name || "General Conversion"}</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5 font-mono">{conv.order_id}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-indigo-400 text-xs block">₹{conv.commission_amount}</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</span>
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
