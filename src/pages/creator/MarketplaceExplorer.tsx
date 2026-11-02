import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  fetchAllCampaigns, 
  getCreatorAffiliateCampaigns, 
  Campaign, 
  CreatorAffiliateCampaign,
  getUserId 
} from "@/lib/api";
import CampaignCard from "@/components/creator/CampaignCard";
import { AffiliateCampaignCard } from "@/components/creator/AffiliateCampaignCard";
import { useToast } from "@/hooks/use-toast";
import { 
  LogIn, 
  Sparkles, 
  Zap, 
  Video, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Coins,
  Loader2
} from "lucide-react";

interface MarketplaceExplorerProps {
  isAuthenticated?: boolean;
}

export const MarketplaceExplorer: React.FC<MarketplaceExplorerProps> = ({ isAuthenticated = false }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [affiliateCampaigns, setAffiliateCampaigns] = useState<CreatorAffiliateCampaign[]>([]);

  // Refs for horizontal scroll containers
  const ugcScrollRef = useRef<HTMLDivElement>(null);
  const clippingScrollRef = useRef<HTMLDivElement>(null);
  const affiliateScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMarketplaceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [campsRes, affRes] = await Promise.allSettled([
          fetchAllCampaigns(),
          getCreatorAffiliateCampaigns(),
        ]);

        if (campsRes.status === "fulfilled") {
          setAllCampaigns(campsRes.value);
        } else {
          console.warn("Failed to load standard campaigns:", campsRes.reason);
        }

        if (affRes.status === "fulfilled") {
          setAffiliateCampaigns(affRes.value);
        } else {
          console.warn("Failed to load affiliate campaigns:", affRes.reason);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load marketplace campaigns.");
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceData();
  }, []);

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  // 1. UGC & Influencer Campaigns
  const ugcCampaigns = allCampaigns.filter(
    (c) =>
      c.campaign_type === "influencer" &&
      (!c.deadline || new Date(c.deadline) >= todayStart)
  );

  // 2. Clipping Campaigns
  const clippingCampaigns = allCampaigns.filter(
    (c) =>
      c.campaign_type === "clipping" &&
      (!c.deadline || new Date(c.deadline) >= todayStart)
  );

  // 3. Active Affiliate Campaigns
  const activeAffiliateCampaigns = affiliateCampaigns.filter(
    (c) => !c.deadline || new Date(c.deadline) >= todayStart
  );

  // Scroll helper
  const handleScroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollOffset = direction === "left" ? -380 : 380;
      ref.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/creator/dashboard/${id}`);
  };

  const handleAffiliateCardClick = (id: number) => {
    navigate(`/creator/affiliate-campaigns/${id}`);
  };

  const handleJoinAffiliate = async (id: number) => {
    const userId = getUserId();
    if (!userId) {
      navigate(`/login?role=creator&redirect=${encodeURIComponent("/creator/campaigns")}`);
      return;
    }
    navigate(`/creator/affiliate-campaigns/${id}`);
  };

  const totalDeals = ugcCampaigns.length + clippingCampaigns.length + activeAffiliateCampaigns.length;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* 1. Global Sticky Public Header (Zero Sidebar) */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Context Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="font-display text-2xl font-black tracking-tight text-zinc-900 group-hover:text-orange-600 transition-colors">
                SELLR<span className="text-[#FF5C00]">.</span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-bold text-orange-700 tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-[#FF5C00]" />
              <span>Creator Marketplace</span>
            </div>
          </div>

          {/* Right Action: Prominent Login / Sign-in CTA */}
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{totalDeals} Live Deals Available</span>
              </div>
            )}

            {!isAuthenticated ? (
              <Link
                to={`/login?role=creator&redirect=${encodeURIComponent("/creator/campaigns")}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in to Earn</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </Link>
            ) : (
              <Link
                to="/creator/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Go to Hub</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Headline Area */}
      <section className="bg-white border-b border-zinc-200/60 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5C00]">
                <TrendingUp className="w-3.5 h-3.5" />
                Public Campaign Directory
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
                Campaign Marketplace Explorer
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Explore active brand briefs, verified payout budgets, and viral clip incentives. Join with Google to claim deals and start earning.
              </p>
            </div>

            {/* Quick Metrics Capsule */}
            <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 w-fit shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/70 shadow-2xs">
                <Video className="w-4 h-4 text-pink-500" />
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">UGC</p>
                  <p className="text-xs font-extrabold text-zinc-800 leading-tight">{ugcCampaigns.length} Deals</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/70 shadow-2xs">
                <Zap className="w-4 h-4 text-purple-500" />
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Clipping</p>
                  <p className="text-xs font-extrabold text-zinc-800 leading-tight">{clippingCampaigns.length} Deals</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/70 shadow-2xs">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Affiliate</p>
                  <p className="text-xs font-extrabold text-zinc-800 leading-tight">{activeAffiliateCampaigns.length} Deals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content: 3 Horizontally Scrollable Categories */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {loading ? (
          <div className="w-full py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#FF5C00] animate-spin" />
            <p className="text-xs text-zinc-500 font-medium tracking-wide">Loading marketplace opportunities...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center space-y-2">
            <p className="text-sm font-bold">Failed to load campaigns</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <>
            {/* CATEGORY 1: Influencer & UGC Deals */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                        Influencer & UGC Campaigns
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-bold uppercase">
                        {ugcCampaigns.length} Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Collaborate directly with consumer brands for creative product reviews and sponsored content.
                    </p>
                  </div>
                </div>

                {/* Desktop Horizontal Scroll Controls */}
                {ugcCampaigns.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => handleScroll(ugcScrollRef, "left")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Left"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScroll(ugcScrollRef, "right")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Right"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {ugcCampaigns.length === 0 ? (
                <div className="w-full py-12 px-6 rounded-2xl border border-dashed border-zinc-200 bg-white text-center space-y-1.5">
                  <Video className="w-6 h-6 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-700">No active UGC campaigns currently</p>
                  <p className="text-xs text-zinc-400">New influencer partnerships launch every Monday. Check back soon!</p>
                </div>
              ) : (
                <div
                  ref={ugcScrollRef}
                  className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {ugcCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="w-[300px] sm:w-[340px] shrink-0 snap-start cursor-pointer hover:-translate-y-1 transition-transform"
                      onClick={() => handleCardClick(camp.id)}
                    >
                      <CampaignCard {...camp} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CATEGORY 2: Viral Clipping Campaigns */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100/70 text-purple-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                        Viral Clipping Campaigns
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold uppercase">
                        {clippingCampaigns.length} Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Repurpose long-form content into viral Reels & Shorts. Earn guaranteed payouts per 1,000 views.
                    </p>
                  </div>
                </div>

                {/* Desktop Horizontal Scroll Controls */}
                {clippingCampaigns.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => handleScroll(clippingScrollRef, "left")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Left"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScroll(clippingScrollRef, "right")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Right"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {clippingCampaigns.length === 0 ? (
                <div className="w-full py-12 px-6 rounded-2xl border border-dashed border-zinc-200 bg-white text-center space-y-1.5">
                  <Zap className="w-6 h-6 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-700">No active clipping campaigns currently</p>
                  <p className="text-xs text-zinc-400">Podcasts and streaming partners are replenishing budgets. Check back shortly!</p>
                </div>
              ) : (
                <div
                  ref={clippingScrollRef}
                  className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {clippingCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="w-[300px] sm:w-[340px] shrink-0 snap-start cursor-pointer hover:-translate-y-1 transition-transform"
                      onClick={() => handleCardClick(camp.id)}
                    >
                      <CampaignCard {...camp} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CATEGORY 3: Affiliate & Sponsorship Campaigns */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100/70 text-amber-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                        Affiliate & Product Sponsorships
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase">
                        {activeAffiliateCampaigns.length} Programs
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Promote top D2C products & SaaS tools. Earn high percentage commissions on every completed customer sale.
                    </p>
                  </div>
                </div>

                {/* Desktop Horizontal Scroll Controls */}
                {activeAffiliateCampaigns.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => handleScroll(affiliateScrollRef, "left")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Left"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScroll(affiliateScrollRef, "right")}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Scroll Right"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {activeAffiliateCampaigns.length === 0 ? (
                <div className="w-full py-12 px-6 rounded-2xl border border-dashed border-zinc-200 bg-white text-center space-y-1.5">
                  <ShoppingBag className="w-6 h-6 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-700">No active affiliate programs currently</p>
                  <p className="text-xs text-zinc-400">D2C store catalogs and SaaS programs are updating. Check back soon!</p>
                </div>
              ) : (
                <div
                  ref={affiliateScrollRef}
                  className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {activeAffiliateCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="w-[300px] sm:w-[340px] shrink-0 snap-start cursor-pointer hover:-translate-y-1 transition-transform"
                    >
                      <AffiliateCampaignCard
                        campaign={camp}
                        onJoin={handleJoinAffiliate}
                        joiningId={null}
                        onCardClick={handleAffiliateCardClick}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* 4. Bottom Guest Banner with 1-Click Login CTA */}
      {!isAuthenticated && (
        <aside className="bg-gradient-to-r from-zinc-900 to-black text-white py-6 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Zero Fees &bull; Direct UPI & On-Chain Payouts
              </div>
              <p className="text-sm text-zinc-300">
                Ready to turn your views into daily revenue? Sign in with Google to get started in 10 seconds.
              </p>
            </div>

            <Link
              to={`/login?role=creator&redirect=${encodeURIComponent("/creator/campaigns")}`}
              className="px-6 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-bold text-sm shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect with Google</span>
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
};

export default MarketplaceExplorer;
