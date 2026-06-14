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
  ExternalLink,
  Layers, 
  Briefcase,
  AlertCircle,
  TrendingUp,
  Info
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
        className: "bg-emerald-600/90 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
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
      className: "bg-green-600/90 border-green-500 text-white shadow-lg shadow-green-500/20"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <p className="font-bold text-sm">Synchronizing campaign metrics...</p>
        </div>
      </CreatorLayout>
    );
  }

  if (!campaign) return null;

  const isJoined = campaign.joined;
  const isSaas = campaign.campaign_type === "saas_subscription";
  
  // Stats
  const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalSales = conversions.length;

  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  return (
    <CreatorLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <Link 
          to="/creator/affiliate-campaigns" 
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        {/* Campaign Hero Card */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Cover Image */}
          <div className="w-full md:w-56 aspect-video md:aspect-square bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-zinc-700/50">
            {campaign.image_url ? (
              <img 
                src={campaign.image_url} 
                alt={campaign.name} 
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-zinc-600 relative">
                <Sparkles className="w-12 h-12 text-indigo-500/30 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500/50">Affiliate</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5 flex-1 w-full">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {isSaas ? (
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    SaaS Subscription
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    Product-Based
                  </Badge>
                )}
                
                {campaign.application_status === "active" ? (
                  <Badge className="bg-emerald-500/90 text-white border-none text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    Active Partner
                  </Badge>
                ) : campaign.application_status === "applied" ? (
                  <Badge className="bg-yellow-500/95 text-black border-none text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    Applied (Reviewing)
                  </Badge>
                ) : campaign.application_status === "rejected" ? (
                  <Badge className="bg-red-500/95 text-white border-none text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    Rejected
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[9px] uppercase font-black tracking-wider px-2 py-0.5">
                    Not Joined
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {campaign.name}
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-2xl">
                {campaign.description || "Promote this campaign via your custom links and start earning commissions."}
              </p>
            </div>

            {/* Campaign info tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : "Ended"})</span>
              </div>
            </div>

            {/* CTA Join / Copy Panel */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {campaign.application_status === "active" ? (
                <>
                  <div className="space-y-1 w-full sm:w-auto">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Your Referral Link</span>
                    <span className="text-xs text-indigo-400 font-extrabold truncate block max-w-xs md:max-w-md">
                      {window.location.origin}/affiliate/{campaign.affiliate_code}
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className={`w-full sm:w-auto font-bold text-xs px-5 h-10 rounded-xl shrink-0 transition ${
                      copied 
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white animate-in zoom-in duration-200" 
                        : "bg-indigo-650 hover:bg-indigo-700 text-white"
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
                    <span className="text-xs text-zinc-400 block font-semibold">Your application is under review</span>
                    <span className="text-[10px] text-zinc-500 block">Once the brand approves your profile, you will get access to your referral link.</span>
                  </div>
                  <Button
                    disabled
                    className="w-full sm:w-auto bg-zinc-800 text-zinc-500 font-bold text-xs h-10 px-6 rounded-xl shrink-0 cursor-not-allowed border border-zinc-700/30"
                  >
                    <Clock className="w-4 h-4 mr-1.5" />
                    Pending Approval
                  </Button>
                </>
              ) : campaign.application_status === "rejected" ? (
                <>
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <span className="text-xs text-red-400 block font-semibold">Application Rejected</span>
                    <span className="text-[10px] text-zinc-500 block">Your application was not approved by the brand for this campaign.</span>
                  </div>
                  <Button
                    disabled
                    className="w-full sm:w-auto bg-zinc-800 text-red-500/60 font-bold text-xs h-10 px-6 rounded-xl shrink-0 cursor-not-allowed border border-zinc-750"
                  >
                    Rejected
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <span className="text-xs text-zinc-400 block font-semibold">Ready to partner with this campaign?</span>
                    <span className="text-[10px] text-zinc-500 block">Click below to join and get your custom referral link.</span>
                  </div>
                  <Button
                    disabled={joining}
                    onClick={handleJoin}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6 rounded-xl shrink-0"
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
          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Coins className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Your Earnings</span>
                <span className="text-xl font-black text-white block mt-1">₹{totalEarnings.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Total Referrals</span>
                <span className="text-xl font-black text-white block mt-1">{totalSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800/80 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Conversion rate</span>
                <span className="text-xl font-black text-white block mt-1">
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
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-400" />
                Commission Breakdown
              </h3>
              
              {isSaas && campaign.commission_schedule ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.keys(campaign.commission_schedule).map(interval => {
                      const data = campaign.commission_schedule[interval];
                      const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
                      return (
                        <div key={interval} className="bg-zinc-950 p-4 border border-zinc-800/60 rounded-2xl">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">{interval} Plan</span>
                          <span className="font-black text-lg text-white block mt-1">{valStr}</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">commission per checkout</span>
                        </div>
                      );
                    })}
                  </div>
                  {campaign.recurring_commission ? (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex gap-3">
                      <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-indigo-300 block">Recurring Commission Enabled</span>
                        <span className="text-[10px] text-zinc-400 block mt-1">
                          You will receive commissions on each subscription renewal payout
                          {campaign.recurring_commission_limit ? ` (capped at a maximum of ${campaign.recurring_commission_limit} renewals).` : "."}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-2xl flex gap-3">
                      <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-zinc-300 block">One-time Commission Model</span>
                        <span className="text-[10px] text-zinc-400 block mt-1">Commissions are earned only on the initial customer checkout. Renewals do not trigger payouts.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-950 p-4 border border-zinc-800/60 rounded-2xl">
                  <span className="text-xs text-zinc-300 font-bold block">
                    Flat rate payout per successful referral conversion:
                  </span>
                  <span className="text-xl font-extrabold text-indigo-400 block mt-1.5">
                    {campaign.commission_type === "percentage" 
                      ? `${campaign.commission_value}% of product sale value` 
                      : `₹${campaign.commission_value} fixed per sale`}
                  </span>
                </div>
              )}
            </div>

            {/* Referral Transactions Table */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Referral Conversions List ({conversions.length})
              </h3>

              {conversions.length === 0 ? (
                <div className="bg-zinc-950/40 p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="font-bold text-xs">No referrals logged yet</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Share your referral link with subscribers to start generating conversions.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Plan/Product</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {conversions.map((conv) => (
                        <tr key={conv.id} className="hover:bg-zinc-950/40 transition">
                          <td className="py-3 px-4 font-mono text-zinc-400">{conv.order_id}</td>
                          <td className="py-3 px-4 font-bold">{conv.product_name || "General Conversion"}</td>
                          <td className="py-3 px-4 font-bold">₹{conv.order_amount}</td>
                          <td className="py-3 px-4 font-extrabold text-indigo-400">₹{conv.commission_amount}</td>
                          <td className="py-3 px-4 text-zinc-500">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            {conv.status === "completed" ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-2 py-0.5">
                                Paid
                              </Badge>
                            ) : conv.status === "insufficient_budget" ? (
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] px-2 py-0.5">
                                Pending Funds
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] px-2 py-0.5">
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
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Mapped Programs & Plans
              </h3>
              
              <div className="space-y-3">
                {campaign.products && campaign.products.length > 0 ? (
                  campaign.products.map(p => (
                    <div key={p.id} className="bg-zinc-950 p-4 border border-zinc-800/60 rounded-2xl flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Base Plan ID: {p.id}</span>
                      </div>
                      <span className="font-black text-sm text-indigo-400">₹{p.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No direct plan mapping restrictions. All sales conversion events qualify.</p>
                )}
              </div>
            </div>

            {/* Campaign Creator Requirements */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Creator Requirements
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs">
                  <span className="text-zinc-500 font-bold">Follower Cap Criteria</span>
                  <span className="text-white font-extrabold">
                    {campaign.creator_requirements?.min_followers 
                      ? `${campaign.creator_requirements.min_followers.toLocaleString()}+ followers`
                      : "Open to all creators"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs">
                  <span className="text-zinc-500 font-bold">Platform Focus</span>
                  <span className="text-white font-extrabold">
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

const Loader2 = ({ className }: { className?: string }) => (
  <svg 
    className={`animate-spin ${className}`} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default AffiliateCampaignView;
