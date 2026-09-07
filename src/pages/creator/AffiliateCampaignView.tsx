import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CreatorLayout from "@/layouts/CreatorLayout";
import { 
  getCreatorAffiliateCampaigns, 
  getCreatorConversions, 
  joinAffiliateCampaign,
  CreatorAffiliateCampaign 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  Copy, 
  Check, 
  Sparkles, 
  Target, 
  Award, 
  Layers, 
  Briefcase,
  AlertCircle,
  TrendingUp,
  Info,
  Loader2
} from "lucide-react";

const AffiliateCampaignView: React.FC = () => {
  const { campaign_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CreatorAffiliateCampaign | null>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const [allCamps, allConversions] = await Promise.all([
        getCreatorAffiliateCampaigns(),
        getCreatorConversions()
      ]);

      const selectedCamp = allCamps.find(c => c.id === Number(campaign_id));
      if (!selectedCamp) {
        toast({
          title: "Error",
          description: "Affiliate campaign not found.",
          variant: "destructive"
        });
        navigate("/creator/affiliate-campaigns");
        return;
      }

      setCampaign(selectedCamp);
      
      // Filter conversions matching this campaign
      const campaignConversions = allConversions.filter(
        (conv: any) => conv.campaign_id === Number(campaign_id)
      );
      setConversions(campaignConversions);

    } catch (err: any) {
      toast({
        title: "Load Error",
        description: err.message || "Failed to load campaign statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [campaign_id, navigate, toast]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  const handleJoin = async () => {
    if (!campaign) return;
    setJoining(true);
    try {
      await joinAffiliateCampaign(campaign.id);
      toast({
        title: "Joined!",
        description: "You are now part of this affiliate program.",
        className: "bg-emerald-600 border-emerald-500 text-white shadow-md"
      });
      await loadCampaignData();
    } catch (err: any) {
      toast({
        title: "Failed to Join",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    if (!campaign || !campaign.affiliate_code) return;
    const referralUrl = `${window.location.origin}/affiliate/${campaign.affiliate_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral URL copied to clipboard.",
      className: "bg-emerald-600 border-emerald-500 text-white shadow-md"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <p className="font-semibold text-sm">Synchronizing campaign metrics...</p>
        </div>
      </CreatorLayout>
    );
  }

  if (!campaign) return null;

  const isSaas = campaign.campaign_type === "saas_subscription";
  
  // Stats
  const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalSales = conversions.length;

  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  return (
    <CreatorLayout>
      <div className="space-y-8 animate-in fade-in duration-200">
        
        {/* Back Link */}
        <Link 
          to="/creator/affiliate-campaigns" 
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        {/* Campaign Hero Card */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Cover Image */}
          <div className="w-full md:w-56 aspect-video md:aspect-square bg-zinc-100 rounded-2xl overflow-hidden shrink-0 border border-zinc-200/80">
            {campaign.image_url ? (
              <img 
                src={campaign.image_url} 
                alt={campaign.name} 
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-50 via-zinc-50 to-zinc-100 flex flex-col items-center justify-center text-zinc-400 relative">
                <Sparkles className="w-10 h-10 text-orange-400 mb-1.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Affiliate</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5 flex-1 w-full">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {isSaas ? (
                  <Badge className="bg-orange-50 text-orange-700 border border-orange-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    SaaS Subscription
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Product-Based
                  </Badge>
                )}
                
                {campaign.application_status === "active" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Active Partner
                  </Badge>
                ) : campaign.application_status === "applied" ? (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Applied (Reviewing)
                  </Badge>
                ) : campaign.application_status === "rejected" ? (
                  <Badge className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Rejected
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    Not Joined
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 leading-tight">
                {campaign.name}
              </h2>
              <p className="text-zinc-600 text-xs md:text-sm leading-relaxed max-w-2xl">
                {campaign.description || "Promote this campaign via your custom links and start earning commissions."}
              </p>
            </div>

            {/* Campaign info tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : "Ended"})</span>
              </div>
            </div>

            {/* CTA Join / Copy Panel */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {campaign.application_status === "active" ? (
                <>
                  <div className="space-y-1 w-full sm:w-auto">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Your Referral Link</span>
                    <span className="text-xs text-orange-600 font-mono font-bold truncate block max-w-xs md:max-w-md">
                      {window.location.origin}/affiliate/{campaign.affiliate_code}
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className={`w-full sm:w-auto font-bold text-xs px-5 h-10 rounded-xl shrink-0 transition ${
                      copied 
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white" 
                        : "bg-zinc-900 hover:bg-zinc-800 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Copied Link
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </>
              ) : campaign.application_status === "applied" ? (
                <>
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <span className="text-xs text-zinc-700 block font-semibold">Your application is under review</span>
                    <span className="text-[10px] text-zinc-500 block">Once the brand approves your profile, you will get access to your referral link.</span>
                  </div>
                  <Button
                    disabled
                    className="w-full sm:w-auto bg-zinc-100 text-zinc-400 font-semibold text-xs h-10 px-6 rounded-xl shrink-0 cursor-not-allowed border border-zinc-200"
                  >
                    <Clock className="w-4 h-4 mr-1.5 text-zinc-400" />
                    Pending Approval
                  </Button>
                </>
              ) : campaign.application_status === "rejected" ? (
                <>
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <span className="text-xs text-rose-700 block font-semibold">Application Rejected</span>
                    <span className="text-[10px] text-zinc-500 block">Your application was not approved by the brand for this campaign.</span>
                  </div>
                  <Button
                    disabled
                    className="w-full sm:w-auto bg-rose-50 text-rose-600 font-semibold text-xs h-10 px-6 rounded-xl shrink-0 cursor-not-allowed border border-rose-200"
                  >
                    Rejected
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <span className="text-xs text-zinc-700 block font-semibold">Ready to partner with this campaign?</span>
                    <span className="text-[10px] text-zinc-500 block">Click below to join and get your custom referral link.</span>
                  </div>
                  <Button
                    disabled={joining}
                    onClick={handleJoin}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-10 px-6 rounded-xl shrink-0 shadow-xs"
                  >
                    {joining ? "Joining..." : "Join Affiliate Program"}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Coins className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Your Earnings</span>
                <span className="text-xl font-black text-zinc-900 block mt-1">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Total Referrals</span>
                <span className="text-xl font-black text-zinc-900 block mt-1">{totalSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-zinc-100 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-zinc-700" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Conversion rate</span>
                <span className="text-xl font-black text-zinc-900 block mt-1">
                  {totalSales > 0 ? "100%" : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Details Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Commission breakdown details */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-orange-500" />
                Commission Breakdown
              </h3>
              
              {isSaas && campaign.commission_schedule ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.keys(campaign.commission_schedule).map(interval => {
                      const data = campaign.commission_schedule[interval];
                      const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
                      return (
                        <div key={interval} className="bg-zinc-50 p-4 border border-zinc-200/80 rounded-2xl">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">{interval} Plan</span>
                          <span className="font-black text-lg text-zinc-900 block mt-1">{valStr}</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">commission per checkout</span>
                        </div>
                      );
                    })}
                  </div>
                  {campaign.recurring_commission ? (
                    <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl flex gap-3">
                      <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-orange-950 block">Recurring Commission Enabled</span>
                        <span className="text-[11px] text-orange-800 block mt-1">
                          You will receive commissions on each subscription renewal payout
                          {campaign.recurring_commission_limit ? ` (capped at a maximum of ${campaign.recurring_commission_limit} renewals).` : "."}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex gap-3">
                      <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">One-time Commission Model</span>
                        <span className="text-[11px] text-zinc-500 block mt-1">Commissions are earned only on the initial customer checkout. Renewals do not trigger payouts.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-50 p-4 border border-zinc-200/80 rounded-2xl">
                  <span className="text-xs text-zinc-600 font-medium block">
                    Flat rate payout per successful referral conversion:
                  </span>
                  <span className="text-xl font-extrabold text-orange-600 block mt-1.5">
                    {campaign.commission_type === "percentage" 
                      ? `${campaign.commission_value}% of product sale value` 
                      : `₹${campaign.commission_value} fixed per sale`}
                  </span>
                </div>
              )}
            </div>

            {/* Referral Transactions Table */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                Referral Conversions List ({conversions.length})
              </h3>

              {conversions.length === 0 ? (
                <div className="bg-zinc-50/60 p-8 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p className="font-bold text-xs text-zinc-800">No referrals logged yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Share your referral link with subscribers to start generating conversions.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Plan/Product</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {conversions.map((conv) => (
                        <tr key={conv.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono text-zinc-500">{conv.order_id}</td>
                          <td className="py-3 px-4 font-bold text-zinc-900">{conv.product_name || "General Conversion"}</td>
                          <td className="py-3 px-4 font-bold text-zinc-800">₹{conv.order_amount}</td>
                          <td className="py-3 px-4 font-bold text-orange-600">₹{conv.commission_amount}</td>
                          <td className="py-3 px-4 text-zinc-500">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {conv.status === "completed" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] px-2 py-0.5">
                                Paid
                              </Badge>
                            ) : conv.status === "insufficient_budget" ? (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] px-2 py-0.5">
                                Pending Funds
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] px-2 py-0.5">
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

          </div>

          {/* Sidebar Plans info */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Mapped Programs & Plans
              </h3>
              
              <div className="space-y-3">
                {campaign.products && campaign.products.length > 0 ? (
                  campaign.products.map(p => (
                    <div key={p.id} className="bg-zinc-50 p-4 border border-zinc-200/80 rounded-2xl flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-900 text-xs block truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Base Plan ID: {p.id}</span>
                      </div>
                      <span className="font-black text-sm text-orange-600">₹{p.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No direct plan mapping restrictions. All sales conversion events qualify.</p>
                )}
              </div>
            </div>

            {/* Campaign Creator Requirements */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Creator Requirements
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-zinc-100 text-xs">
                  <span className="text-zinc-500 font-medium">Follower Cap Criteria</span>
                  <span className="text-zinc-900 font-bold">
                    {campaign.creator_requirements?.min_followers 
                      ? `${campaign.creator_requirements.min_followers.toLocaleString()}+ followers`
                      : "Open to all creators"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-zinc-100 text-xs">
                  <span className="text-zinc-500 font-medium">Platform Focus</span>
                  <span className="text-zinc-900 font-bold">
                    {campaign.creator_requirements?.platform || "Any"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </CreatorLayout>
  );
};

export default AffiliateCampaignView;
