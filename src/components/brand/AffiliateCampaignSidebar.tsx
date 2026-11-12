import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  LayoutGrid, 
  Users, 
  LogOut, 
  Menu 
} from "lucide-react";
import { getBrandProfile, BrandProfile, logout as logoutApi } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface AffiliateCampaignSidebarProps {
  campaign: any;
  activeTab: "overview" | "partners";
  onTabChange: (tab: "overview" | "partners") => void;
  pendingPartnersCount?: number;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const AffiliateCampaignSidebarContent: React.FC<AffiliateCampaignSidebarProps> = ({
  campaign,
  activeTab,
  onTabChange,
  pendingPartnersCount = 0,
  onNavigate,
}) => {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const data = await getBrandProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch brand profile for affiliate campaign sidebar:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    navigate("/");
  };

  const isSaas = campaign?.campaign_type === "saas_subscription";

  return (
    <div className="flex flex-col h-full text-ink">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-4 pt-1">
        <Link to="/brand/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            sellr<span className="text-brand-blue">.</span>
          </h1>
          <span className="bg-brand-blue/10 text-brand-blue border border-brand-blue/25 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brand
          </span>
        </Link>
      </div>

      {/* Prominent Back to Dashboard Navigation Button */}
      <Link
        to="/brand/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 text-xs font-medium text-charcoal hover:text-ink bg-black/[0.03] hover:bg-black/[0.06] px-3 py-2.5 rounded-xl transition-colors duration-150 mb-4 border border-black/[0.08]"
      >
        <ArrowLeft className="w-4 h-4 text-slate" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Affiliate Campaign Summary Card */}
      <div className="p-3 rounded-xl bg-black/[0.03] border border-black/[0.07] mb-5">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className="text-[10px] font-mono font-bold text-steel tabular-nums">
            #{campaign?.id ?? "---"}
          </span>
          <span className="font-mono text-[9px] bg-brand-blue/10 border border-brand-blue/25 text-brand-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {isSaas ? "SaaS Subscription" : "Product Store"}
          </span>
        </div>
        <p className="font-display font-bold text-xs text-ink truncate leading-snug" title={campaign?.name}>
          {campaign?.name || "Affiliate Campaign"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${campaign?.is_active ? "bg-emerald-600" : "bg-black/25"}`} />
          <span className="font-mono text-[10px] text-slate uppercase tracking-wider font-semibold">
            {campaign?.is_active ? "Active" : "Draft"}
          </span>
        </div>
      </div>

      {/* Campaign Navigation Tabs */}
      <div className="px-2 mb-2">
        <span className="text-[10px] font-mono uppercase font-bold text-steel tracking-[0.14em]">
          01 // Campaign Views
        </span>
      </div>
      <nav className="flex flex-col gap-1 flex-grow pr-1">
        <button
          type="button"
          onClick={() => {
            onTabChange("overview");
            onNavigate?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 text-left cursor-pointer ${
            activeTab === "overview"
              ? "bg-brand-blue/[0.08] text-ink font-semibold border-r-2 border-brand-blue"
              : "text-slate hover:bg-black/[0.03] hover:text-ink"
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${activeTab === "overview" ? "text-brand-blue" : "text-slate"}`} />
          <span>Overview & Rules</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange("partners");
            onNavigate?.();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 text-left cursor-pointer ${
            activeTab === "partners"
              ? "bg-brand-blue/[0.08] text-ink font-semibold border-r-2 border-brand-blue"
              : "text-slate hover:bg-black/[0.03] hover:text-ink"
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className={`w-4 h-4 ${activeTab === "partners" ? "text-brand-blue" : "text-slate"}`} />
            <span>Creators & Applications</span>
          </div>
          {pendingPartnersCount > 0 && (
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                activeTab === "partners"
                  ? "bg-brand-blue text-white"
                  : "bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
              }`}
            >
              {pendingPartnersCount}
            </span>
          )}
        </button>
      </nav>

      {/* Brand User Footer Card */}
      <div className="mt-auto pt-4 border-t border-black/[0.08] flex flex-col gap-1.5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/[0.03] border border-black/[0.07]">
          <div className="size-9 rounded-full bg-brand-blue/10 text-brand-blue font-mono font-bold flex items-center justify-center text-sm border border-brand-blue/25 shrink-0 overflow-hidden">
            {loading ? (
              <div className="w-4 h-4 rounded-full bg-black/15" />
            ) : profile?.logo_url ? (
              <img src={profile.logo_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              (profile?.username?.[0] || "B").toUpperCase()
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-semibold text-xs text-ink truncate">{profile?.username || "Brand"}</p>
            <p className="font-mono text-[10px] text-slate truncate">{profile?.email || "brand@email.com"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate hover:bg-rose-50 hover:text-rose-700 transition-colors w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export const MobileAffiliateCampaignSidebar: React.FC<AffiliateCampaignSidebarProps> = (props) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-md border-b border-black/10">
      <div className="w-10 flex items-center justify-start shrink-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open Navigation Menu"
              className="p-2 -ml-2 rounded-lg text-charcoal hover:text-ink hover:bg-black/[0.04] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-5 w-72 bg-white border-r border-black/10 flex flex-col h-full overflow-hidden">
            <SheetTitle className="sr-only">Affiliate Campaign Navigation</SheetTitle>
            <AffiliateCampaignSidebarContent {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center justify-center">
        <Link to="/brand/dashboard" className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
            sellr<span className="text-brand-blue">.</span>
          </h1>
          <span className="bg-brand-blue/10 text-brand-blue border border-brand-blue/25 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brand
          </span>
        </Link>
      </div>

      <div className="w-10 flex items-center justify-end shrink-0">
        <Link
          to="/brand/dashboard"
          className="p-2 -mr-2 rounded-lg text-slate hover:text-ink hover:bg-black/[0.04] transition-colors"
          title="Back to Dashboard"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};

export const AffiliateCampaignSidebar: React.FC<AffiliateCampaignSidebarProps> = (props) => {
  if (props.isMobile) {
    return <AffiliateCampaignSidebarContent {...props} />;
  }

  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-black/10 bg-white p-5 hidden md:flex">
      <AffiliateCampaignSidebarContent {...props} />
    </aside>
  );
};

export default AffiliateCampaignSidebar;
