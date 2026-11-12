import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import CreatorLayout from "@/layouts/CreatorLayout";
import { 
  getCreatorAffiliateCampaigns, 
  getCreatorConversions, 
  joinAffiliateCampaign,
  CreatorAffiliateCampaign,
  getUserId,
  checkAuthStatus
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  Loader2,
  LogIn,
  ShieldCheck
} from "lucide-react";
import { MetricCell, StatusPill } from "@/components/ui/PortalPrimitives";

const AffiliateCampaignView: React.FC = () => {
  const { campaign_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(() => getUserId());
  const [campaign, setCampaign] = useState<CreatorAffiliateCampaign | null>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync auth state
  useEffect(() => {
    let isMounted = true;
    const verifyUser = async () => {
      const currentId = getUserId();
      if (currentId) {
        if (isMounted) setUserId(currentId);
        return;
      }
      try {
        const res = await checkAuthStatus();
        if (isMounted && res.authenticated && res.user_id) {
          setUserId(res.user_id);
        }
      } catch {
        // Guest mode
      }
    };
    verifyUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUserId = getUserId();
      const [allCamps, allConversions] = await Promise.all([
        getCreatorAffiliateCampaigns(),
        currentUserId ? getCreatorConversions().catch(() => []) : Promise.resolve([])
      ]);

      const selectedCamp = allCamps.find(c => c.id === Number(campaign_id));
      if (!selectedCamp) {
        toast({
          title: "Error",
          description: "Affiliate campaign not found.",
          variant: "destructive"
        });
        navigate(currentUserId ? "/creator/affiliate-campaigns" : "/creator/campaigns");
        return;
      }

      setCampaign(selectedCamp);
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
    const currentUserId = getUserId();
    if (!currentUserId) {
      const returnUrl = `/creator/affiliate-campaigns/${campaign_id}?join=true`;
      navigate(`/login?role=creator&redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!campaign) return;
    setJoining(true);
    try {
      await joinAffiliateCampaign(campaign.id);
      toast({
        title: "Joined!",
        description: "You are now part of this affiliate program.",
        className: "bg-emerald-600 border-emerald-500 text-white"
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

  useEffect(() => {
    if (searchParams.get("join") === "true") {
      const currentUserId = getUserId();
      if (currentUserId && campaign && campaign.application_status !== "active" && campaign.application_status !== "applied") {
        handleJoin();
      }
    }
  }, [searchParams, campaign]);

  const handleCopyLink = () => {
    if (!campaign || !campaign.affiliate_code) return;
    const referralUrl = `${window.location.origin}/affiliate/${campaign.affiliate_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral URL copied to clipboard.",
      className: "bg-emerald-600 border-emerald-500 text-white"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    const spinner = (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate">
        <Loader2 className="w-8 h-8 animate-spin text-lava mb-3" />
        <p className="font-semibold text-sm">Synchronizing campaign metrics...</p>
      </div>
    );
    if (!userId) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col">
          <header className="h-16 border-b border-black/10 bg-white px-4 flex items-center justify-between">
            <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">
              sellr<span className="text-lava">.</span>
            </Link>
          </header>
          <div className="flex-1 flex items-center justify-center">
            {spinner}
          </div>
        </div>
      );
    }
    return (
      <CreatorLayout>
        {spinner}
      </CreatorLayout>
    );
  }

  if (!campaign) return null;

  const isSaas = campaign.campaign_type === "saas_subscription";
  const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalSales = conversions.length;
  const daysLeft = Math.ceil(
    (new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  const affiliateContent = (
    <div className="space-y-8">
      {/* Back Link */}
      <Link 
        to={userId ? "/creator/affiliate-campaigns" : "/creator/campaigns"} 
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate hover:text-ink transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4" />
        {userId ? "Back to Campaigns" : "Back to Marketplace"}
      </Link>

      {/* Campaign Hero Card */}
      <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        {/* Cover Image */}
        <div className="w-full md:w-56 aspect-video md:aspect-square bg-black/[0.03] rounded-2xl overflow-hidden shrink-0 border border-black/10">
          {campaign.image_url ? (
            <img 
              src={campaign.image_url} 
              alt={campaign.name} 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-black/[0.03] flex flex-col items-center justify-center text-steel">
              <Sparkles className="w-9 h-9 text-lava mb-1.5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-steel">Affiliate</span>
            </div>
          )}
        </div>

          {/* Details */}
        <div className="space-y-5 flex-1 w-full min-w-0">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={isSaas ? "creator" : "neutral"}>
                {isSaas ? "SaaS Subscription" : "Product-Based"}
              </StatusPill>
              {campaign.application_status === "active" ? (
                <StatusPill tone="success" showDot>Active Partner</StatusPill>
              ) : campaign.application_status === "applied" ? (
                <StatusPill tone="warning" showDot>Applied (Reviewing)</StatusPill>
              ) : campaign.application_status === "rejected" ? (
                <StatusPill tone="danger">Rejected</StatusPill>
              ) : (
                <StatusPill tone="neutral">Not Joined</StatusPill>
              )}
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
              {campaign.name}
            </h1>
            <p className="text-slate text-xs md:text-sm leading-relaxed max-w-2xl">
              {campaign.description || "Promote this campaign via your custom links and start earning commissions."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium text-slate">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-steel" />
              <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : "Ended"})</span>
            </div>
          </div>

          {/* CTA Join / Copy Panel */}
          <div className="bg-black/[0.02] border border-black/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {campaign.application_status === "active" ? (
              <>
                <div className="space-y-1 w-full sm:w-auto min-w-0">
                  <span className="text-[10px] font-mono text-steel font-bold block uppercase tracking-widest">Your Referral Link</span>
                  <span className="text-xs text-lava font-mono font-bold truncate block w-full sm:max-w-xs md:max-w-md">
                    {window.location.origin}/affiliate/{campaign.affiliate_code}
                  </span>
                </div>
                <Button
                  variant={copied ? "default" : "ink"}
                  onClick={handleCopyLink}
                  className={`w-full sm:w-auto font-semibold text-xs px-5 h-10 rounded-xl shrink-0 ${
                    copied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""
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
                  <span className="text-xs text-ink block font-semibold">Your application is under review</span>
                  <span className="text-[11px] text-slate block">Once the brand approves your profile, you will get access to your referral link.</span>
                </div>
                <Button
                  disabled
                  variant="outline"
                  className="w-full sm:w-auto font-semibold text-xs h-10 px-6 rounded-xl shrink-0"
                >
                  <Clock className="w-4 h-4 mr-1.5 text-steel" />
                  Pending Approval
                </Button>
              </>
            ) : campaign.application_status === "rejected" ? (
              <>
                <div className="space-y-1 w-full sm:w-auto text-left">
                  <span className="text-xs text-rose-700 block font-semibold">Application Rejected</span>
                  <span className="text-[11px] text-slate block">Your application was not approved by the brand for this campaign.</span>
                </div>
                <Button
                  disabled
                  className="w-full sm:w-auto bg-rose-50 text-rose-600 font-semibold text-xs h-10 px-6 rounded-xl shrink-0 border border-rose-200"
                >
                  Rejected
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1 w-full sm:w-auto text-left">
                  <span className="text-xs text-ink block font-semibold">Ready to partner with this campaign?</span>
                  <span className="text-[11px] text-slate block">
                    {!userId 
                      ? "Sign in with Google to get your custom referral link and earn commissions."
                      : "Click below to join and get your custom referral link."}
                  </span>
                </div>
                <Button
                  disabled={joining}
                  variant="creator"
                  onClick={handleJoin}
                  className="w-full sm:w-auto font-semibold text-xs h-10 px-6 rounded-xl shrink-0 flex items-center justify-center gap-2"
                >
                  {!userId && <LogIn className="w-4 h-4" />}
                  {joining ? "Joining..." : !userId ? "Sign in to Join Campaign" : "Join Affiliate Program"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <MetricCell
          label="Your Earnings"
          value={`₹${totalEarnings.toLocaleString()}`}
          sublabel="Cumulative commissions"
          valueClassName="text-lava"
        />
        <MetricCell
          label="Total Referrals"
          value={totalSales}
          sublabel="Verified orders"
          valueClassName="text-emerald-700"
        />
        <MetricCell
          label="Conversion Rate"
          value={totalSales > 0 ? "100%" : "0%"}
          sublabel="Checkout attribution"
        />
      </div>

      {/* Bottom Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Commission breakdown details */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-lava" />
              Commission Breakdown
            </h3>
            
            {isSaas && campaign.commission_schedule ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.keys(campaign.commission_schedule).map(interval => {
                    const data = campaign.commission_schedule[interval];
                    const valStr = data.type === "percentage" ? `${data.value}%` : `₹${data.value}`;
                    return (
                      <div key={interval} className="bg-black/[0.02] p-4 border border-black/10 rounded-2xl">
                        <span className="text-[10px] font-mono text-steel font-bold block uppercase tracking-widest">{interval} Plan</span>
                        <span className="font-mono font-bold tabular-nums text-lg text-ink block mt-1">{valStr}</span>
                        <span className="text-[11px] text-slate block mt-0.5">commission per checkout</span>
                      </div>
                    );
                  })}
                </div>
                {campaign.recurring_commission ? (
                  <div className="p-4 bg-lava/5 border border-lava/20 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-lava shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-ink block">Recurring Commission Enabled</span>
                      <span className="text-[11px] text-slate block mt-1">
                        You will receive commissions on each subscription renewal payout
                        {campaign.recurring_commission_limit ? ` (capped at a maximum of ${campaign.recurring_commission_limit} renewals).` : "."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-black/[0.02] border border-black/10 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-steel shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-ink block">One-time Commission Model</span>
                      <span className="text-[11px] text-slate block mt-1">Commissions are earned only on the initial customer checkout. Renewals do not trigger payouts.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/[0.02] p-4 border border-black/10 rounded-2xl">
                <span className="text-xs text-slate font-medium block">
                  Flat rate payout per successful referral conversion:
                </span>
                <span className="font-mono text-xl font-bold tabular-nums text-lava block mt-1.5">
                  {campaign.commission_type === "percentage" 
                    ? `${campaign.commission_value}% of product sale value` 
                    : `₹${campaign.commission_value} fixed per sale`}
                </span>
              </div>
            )}
          </div>

          {/* Referral Transactions Table */}
          <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-lava" />
              Referral Conversions List ({conversions.length})
            </h3>

            {conversions.length === 0 ? (
              <div className="bg-black/[0.02] p-8 border border-dashed border-black/15 rounded-2xl text-center text-slate">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-steel" />
                <p className="font-bold text-xs text-ink">No referrals logged yet</p>
                <p className="text-[11px] text-slate mt-1">Share your referral link with subscribers to start generating conversions.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 sm:hidden">
                  {conversions.map((conv) => (
                    <div key={conv.id} className="bg-black/[0.02] border border-black/10 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-ink text-sm truncate">{conv.product_name || "General Conversion"}</p>
                          <p className="font-mono text-[10px] text-steel truncate mt-0.5">{conv.order_id}</p>
                        </div>
                        <span className="font-mono font-bold tabular-nums text-sm text-lava shrink-0">+₹{conv.commission_amount}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                        <span className="font-mono text-slate">Order: ₹{conv.order_amount}</span>
                        <StatusPill tone={conv.status === "completed" ? "success" : conv.status === "insufficient_budget" ? "warning" : "neutral"}>
                          {conv.status === "completed" ? "Paid" : conv.status === "insufficient_budget" ? "Pending Funds" : conv.status}
                        </StatusPill>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-steel font-mono font-bold uppercase tracking-widest text-[10px]">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Plan/Product</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06] text-slate">
                      {conversions.map((conv) => (
                        <tr key={conv.id} className="hover:bg-black/[0.02] transition-colors duration-150">
                          <td className="py-3 px-4 font-mono text-steel">{conv.order_id}</td>
                          <td className="py-3 px-4 font-bold text-ink">{conv.product_name || "General Conversion"}</td>
                          <td className="py-3 px-4 font-mono font-semibold tabular-nums text-ink">₹{conv.order_amount}</td>
                          <td className="py-3 px-4 font-mono font-bold tabular-nums text-lava">₹{conv.commission_amount}</td>
                          <td className="py-3 px-4 font-mono text-steel">{new Date(conv.created_at || conv.timestamp).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <StatusPill tone={conv.status === "completed" ? "success" : conv.status === "insufficient_budget" ? "warning" : "neutral"}>
                              {conv.status === "completed" ? "Paid" : conv.status === "insufficient_budget" ? "Pending Funds" : conv.status}
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

        {/* Sidebar Plans info */}
        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-lava" />
              Mapped Programs & Plans
            </h3>
            
            <div className="space-y-3">
              {campaign.products && campaign.products.length > 0 ? (
                campaign.products.map(p => (
                  <div key={p.id} className="bg-black/[0.02] p-4 border border-black/10 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-ink text-xs block truncate">{p.name}</span>
                      <span className="text-[10px] font-mono text-steel block mt-0.5">Base Plan ID: {p.id}</span>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-sm text-lava shrink-0">₹{p.price}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate">No direct plan mapping restrictions. All sales conversion events qualify.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h3 className="font-display font-bold text-ink text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-lava" />
              Creator Requirements
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-black/[0.06] text-xs gap-4">
                <span className="text-slate font-medium">Follower Cap Criteria</span>
                <span className="text-ink font-mono font-bold text-right">
                  {campaign.creator_requirements?.min_followers 
                    ? `${campaign.creator_requirements.min_followers.toLocaleString()}+ followers`
                    : "Open to all creators"}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 text-xs gap-4">
                <span className="text-slate font-medium">Platform Focus</span>
                <span className="text-ink font-bold text-right">
                  {campaign.creator_requirements?.platform || "Any"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-lava/15 selection:text-ink">
        <header className="sticky top-0 z-40 w-full bg-white border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink shrink-0">
                sellr<span className="text-lava">.</span>
              </Link>
              <div className="h-4 w-px bg-black/10 shrink-0" />
              <button
                onClick={() => navigate("/creator/campaigns")}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-ink transition-colors duration-150 cursor-pointer truncate"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Back to Marketplace</span>
                <span className="sm:hidden">Marketplace</span>
              </button>
            </div>

            <Link
              to={`/login?role=creator&redirect=${encodeURIComponent(`/creator/affiliate-campaigns/${campaign_id}?join=true`)}`}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-lava hover:bg-lava-hover text-white font-bold text-xs sm:text-sm transition-colors duration-150 shrink-0"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign in to Earn</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {affiliateContent}
        </main>

        <aside className="bg-white text-ink py-6 border-t border-black/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-lava uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Partner with top brands today
              </div>
              <p className="text-sm text-slate">
                Sign in with Google to get instant access to custom referral links and automated daily commissions.
              </p>
            </div>

            <Link
              to={`/login?role=creator&redirect=${encodeURIComponent(`/creator/affiliate-campaigns/${campaign_id}?join=true`)}`}
              className="px-6 py-2.5 rounded-xl bg-lava hover:bg-lava-hover text-white font-bold text-xs sm:text-sm shrink-0 flex items-center gap-2 transition-colors duration-150"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect with Google to Join</span>
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <CreatorLayout>
      {affiliateContent}
    </CreatorLayout>
  );
};

export default AffiliateCampaignView;
