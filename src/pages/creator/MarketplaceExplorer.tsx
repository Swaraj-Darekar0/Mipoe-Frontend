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
import { 
  ChevronLeft, 
  ChevronRight, 
  LogIn
} from "lucide-react";
import gsap from "gsap";
import SquishyHeadline from "@/components/Home/persona/SquishyHeadline";
import type { HeadlineLine } from "@/components/Home/persona/heroType";

const CAMPAIGNS_HEADLINE_LINES: readonly HeadlineLine[] = [
  { text: "ACTIVE" },
  { text: "Campaigns", highlight: true },
];

// Curated brand campaigns matching verified clean logo cards with realistic Indian CPM rates
// const SHOWCASE_UGC_CAMPAIGNS: Campaign[] = [
//   {
//     id: 101,
//     name: "Dolce Studio • Y2K Baby Tees & Flared Denim Fit Check Reels",
//     platform: "Instagram",
//     budget: 340000,
//     cpv: 85,
//     total_view_count: 580000,
//     deadline: "2026-12-01T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "influencer",
//     funds_distributed: 232000,
//     image_url: "/thumbnails/pin_fashion_1.webp",
//   },
//   {
//     id: 102,
//     name: "Stüssy India • Oversized Tees & Cargo Layering Reels",
//     platform: "Instagram",
//     budget: 285000,
//     cpv: 95,
//     total_view_count: 420000,
//     deadline: "2026-11-24T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "influencer",
//     funds_distributed: 147000,
//     image_url: "/thumbnails/camp_stussy_centered.webp",
//   },
//   {
//     id: 103,
//     name: "Y2K Orbit • Chrome Shades & Chunky Chain GRWM",
//     platform: "YouTube",
//     budget: 225000,
//     cpv: 75,
//     total_view_count: 310000,
//     deadline: "2026-11-28T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "influencer",
//     funds_distributed: 98000,
//     image_url: "/thumbnails/camp_y2k_orbit.webp",
//   },
// ];

// const SHOWCASE_CLIPPING_CAMPAIGNS: Campaign[] = [
//   {
//     id: 201,
//     name: "CRTZ Archive • Unboxings & Streetwear Drop Shorts",
//     platform: "YouTube",
//     budget: 240000,
//     cpv: 80,
//     total_view_count: 275000,
//     deadline: "2026-11-21T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "clipping",
//     funds_distributed: 98000,
//     image_url: "/thumbnails/camp_crtz_stars.webp",
//   },
//   {
//     id: 202,
//     name: "Urban Monkey • Caps, Eyewear & Campus Fit Edits",
//     platform: "Instagram",
//     budget: 270000,
//     cpv: 90,
//     total_view_count: 310000,
//     deadline: "2026-11-19T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "clipping",
//     funds_distributed: 112000,
//     image_url: "/thumbnails/camp_urban_monkey_cap.webp",
//   },
//   {
//     id: 203,
//     name: "Bape Sta Club • Sneaker Rotation & Fit Check Clips",
//     platform: "Instagram",
//     budget: 195000,
//     cpv: 65,
//     total_view_count: 490000,
//     deadline: "2026-11-16T00:00:00Z",
//     campaign_category: "fashion",
//     campaign_type: "clipping",
//     funds_distributed: 107800,
//     image_url: "/thumbnails/camp_bape_star.webp",
//   },
// ];

// const SHOWCASE_AFFILIATE_CAMPAIGNS: CreatorAffiliateCampaign[] = [
//   {
//     id: 301,
//     product_name: "Corteiz Drop • Heavyweight Hoodies & Cargo Pants",
//     commission_rate: 1800,
//     campaign_type: "d2c_ecommerce",
//     deadline: "2026-12-30T00:00:00Z",
//     total_pool: 200000,
//     product_url: "https://sellr.in/drop/crtz-fleece",
//     joined: false,
//     active: true,
//   },
//   {
//     id: 302,
//     product_name: "Stüssy Goods • Boxy Knitwear & Graphic Tees",
//     commission_rate: 1500,
//     campaign_type: "d2c_ecommerce",
//     deadline: "2026-12-15T00:00:00Z",
//     total_pool: 500000,
//     product_url: "https://sellr.in/drop/stussy-dice",
//     joined: false,
//     active: true,
//   },
//   {
//     id: 303,
//     product_name: "Angels Streetwear • Track Jackets & Baggy Denim",
//     commission_rate: 1200,
//     campaign_type: "d2c_ecommerce",
//     deadline: "2026-12-31T00:00:00Z",
//     total_pool: 350000,
//     product_url: "https://sellr.in/drop/angels-box",
//     joined: false,
//     active: true,
//   },
// ];

interface MarketplaceExplorerProps {
  isAuthenticated?: boolean;
}

export const MarketplaceExplorer: React.FC<MarketplaceExplorerProps> = ({ isAuthenticated = false }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [affiliateCampaigns, setAffiliateCampaigns] = useState<CreatorAffiliateCampaign[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Horizontal scroll container references
  const heroSectionRef = useRef<HTMLElement>(null);
  const ugcScrollRef = useRef<HTMLDivElement>(null);
  const clippingScrollRef = useRef<HTMLDivElement>(null);
  const affiliateScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!heroSectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", {
        y: 18,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, heroSectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadMarketplaceData = async () => {
      setLoading(true);
      try {
        const [campsRes, affRes] = await Promise.allSettled([
          fetchAllCampaigns(),
          getCreatorAffiliateCampaigns(),
        ]);

        if (isMounted) {
          if (campsRes.status === "fulfilled" && campsRes.value.length > 0) {
            setAllCampaigns(campsRes.value);
          } else {
            setAllCampaigns([...SHOWCASE_UGC_CAMPAIGNS, ...SHOWCASE_CLIPPING_CAMPAIGNS]);
          }

          if (affRes.status === "fulfilled" && affRes.value.length > 0) {
            setAffiliateCampaigns(affRes.value);
          } else {
            setAffiliateCampaigns(SHOWCASE_AFFILIATE_CAMPAIGNS);
          }
        }
      } catch {
        if (isMounted) {
          setAllCampaigns([...SHOWCASE_UGC_CAMPAIGNS, ...SHOWCASE_CLIPPING_CAMPAIGNS]);
          setAffiliateCampaigns(SHOWCASE_AFFILIATE_CAMPAIGNS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMarketplaceData();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const ugcCampaigns = allCampaigns.filter(
    (c) =>
      c.campaign_type === "influencer" &&
      (!c.deadline || new Date(c.deadline) >= todayStart)
  );

  const clippingCampaigns = allCampaigns.filter(
    (c) =>
      c.campaign_type === "clipping" &&
      (!c.deadline || new Date(c.deadline) >= todayStart)
  );

  const activeAffiliateCampaigns = affiliateCampaigns.filter(
    (c) => !c.deadline || new Date(c.deadline) >= todayStart
  );

  const handleScrollRail = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollOffset = direction === "left" ? -380 : 380;
      ref.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

  // Direct Seamless Transit: clicking a card routes to Google login with return intent
  const handleCardClick = (id: number) => {
    const userId = getUserId();
    if (!userId) {
      navigate(`/login?role=creator&redirect=${encodeURIComponent(`/creator/dashboard/${id}`)}`);
    } else {
      navigate(`/creator/dashboard/${id}`);
    }
  };

  const handleAffiliateCardClick = (id: number) => {
    const userId = getUserId();
    if (!userId) {
      navigate(`/login?role=creator&redirect=${encodeURIComponent(`/creator/affiliate-campaigns/${id}`)}`);
    } else {
      navigate(`/creator/affiliate-campaigns/${id}`);
    }
  };

  const handleJoinAffiliate = async (id: number) => {
    handleAffiliateCardClick(id);
  };

  const totalDeals = ugcCampaigns.length + clippingCampaigns.length + activeAffiliateCampaigns.length;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-ink selection:text-white">
      {/* 1. Crisp Swiss Paper Navigation Bar */}
      <header
        className={`sticky top-0 z-40 w-full transition-colors duration-150 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-black/10"
            : "bg-white border-b border-black/[0.06]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-1 shrink-0">
              <span className="font-display text-2xl font-bold tracking-tight text-ink">
                sellr<span className="text-lava">.</span>
              </span>
            </Link>
            <div className="h-4 w-px bg-black/10 hidden sm:block" />
            <span className="font-mono text-[10px] font-bold text-slate uppercase tracking-widest hidden sm:inline-block">
              [{totalDeals} LIVE DEALS]
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isAuthenticated ? (
              <Link
                to={`/login?role=creator&redirect=${encodeURIComponent("/creator/campaigns")}`}
                className="px-4 py-2 rounded-xl bg-ink hover:bg-charcoal text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors duration-150"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Connect with Google</span>
                <span className="sm:hidden xs:hidden">Sign In</span>
              </Link>
            ) : (
              <Link
                to="/creator/dashboard"
                className="font-mono text-xs font-bold text-ink uppercase tracking-wider hover:text-lava transition-colors duration-150"
              >
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero-Matched Kinetic Editorial Header */}
      <section
        ref={heroSectionRef}
        className="pt-10 pb-9 px-4 sm:px-6 lg:px-8 border-b border-black/10 bg-white overflow-x-clip"
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="hero-rise font-mono text-[11px] uppercase tracking-[0.18em] text-steel font-bold">
            VERIFIED CREATOR DEALS
          </p>

          <div className="flex justify-center">
            <SquishyHeadline
              lines={CAMPAIGNS_HEADLINE_LINES}
              lineSize={() => "clamp(42px, 5.5vw, 68px)"}
              containerRef={heroSectionRef}
              highlightColor="bg-creator-pink/30"
            />
          </div>

          <p className="hero-rise font-body text-sm sm:text-base text-slate max-w-xl mx-auto leading-relaxed">
            Pick a brand deal, post your reel or short, and get paid straight to UPI for every 1,000 verified views. Budget is locked before you shoot.
          </p>

          {/* Symmetrical 3-Part Hairline Trust Ledger */}
          <div className="hero-rise pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] font-bold text-slate uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              ESCROW LOCKED UPFRONT
            </span>
            <span className="text-black/15 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              DIRECT UPI PAYOUTS
            </span>
            <span className="text-black/15 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              500+ FOLLOWERS TO START
            </span>
          </div>
        </div>
      </section>

      {/* 3. Horizontal Multi-Rail Showroom */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        
        {/* SECTOR 01: Brand UGC Reels */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
              <span className="font-mono text-xs font-bold text-steel uppercase tracking-widest">
                01 //
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Brand UGC Reels
              </h2>
              <span className="font-mono text-[10px] font-bold uppercase text-lava bg-lava/10 border border-lava/25 px-2 py-0.5 rounded-full tracking-wider">
                {ugcCampaigns.length} OPEN
              </span>
            </div>

            {ugcCampaigns.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleScrollRail(ugcScrollRef, "left")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => handleScrollRail(ugcScrollRef, "right")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={ugcScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {ugcCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="w-[295px] sm:w-[340px] shrink-0 snap-start"
                onClick={() => handleCardClick(camp.id)}
              >
                <CampaignCard {...camp} />
              </div>
            ))}
          </div>
        </section>

        {/* SECTOR 02: Short-Form Clipping */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
              <span className="font-mono text-xs font-bold text-steel uppercase tracking-widest">
                02 //
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Short-Form Clipping
              </h2>
              <span className="font-mono text-[10px] font-bold uppercase text-lava bg-lava/10 border border-lava/25 px-2 py-0.5 rounded-full tracking-wider">
                {clippingCampaigns.length} OPEN
              </span>
            </div>

            {clippingCampaigns.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleScrollRail(clippingScrollRef, "left")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => handleScrollRail(clippingScrollRef, "right")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={clippingScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {clippingCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="w-[295px] sm:w-[340px] shrink-0 snap-start"
                onClick={() => handleCardClick(camp.id)}
              >
                <CampaignCard {...camp} />
              </div>
            ))}
          </div>
        </section>

        {/* SECTOR 03: Affiliate & Product Drops */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
              <span className="font-mono text-xs font-bold text-steel uppercase tracking-widest">
                03 //
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Affiliate & Product Drops
              </h2>
              <span className="font-mono text-[10px] font-bold uppercase text-lava bg-lava/10 border border-lava/25 px-2 py-0.5 rounded-full tracking-wider">
                {activeAffiliateCampaigns.length} LIVE
              </span>
            </div>

            {activeAffiliateCampaigns.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleScrollRail(affiliateScrollRef, "left")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => handleScrollRail(affiliateScrollRef, "right")}
                  className="size-8 rounded-full border border-black/10 hover:border-ink bg-white text-slate hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={affiliateScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {activeAffiliateCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="w-[295px] sm:w-[340px] shrink-0 snap-start"
              >
                <AffiliateCampaignCard
                  campaign={camp}
                  onJoin={handleJoinAffiliate}
                  joiningId={null}
                  onCardClick={handleAffiliateCardClick}
                  image_url={
                    camp.id === 301
                      ? "/thumbnails/camp_corteiz_oval.webp"
                      : camp.id === 302
                      ? "/thumbnails/camp_stussy_dice.webp"
                      : "/thumbnails/camp_angels_box.webp"
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      
    </div>
  );
};

export default MarketplaceExplorer;
