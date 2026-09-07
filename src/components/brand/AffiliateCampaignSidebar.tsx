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
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-4 pt-1">
        <Link to="/brand/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            SELLR<span className="text-indigo-600">.</span>
          </h1>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brand
          </span>
        </Link>
      </div>

      {/* Prominent Back to Dashboard Navigation Button */}
      <Link
        to="/brand/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-3.5 py-2.5 rounded-xl transition-all mb-4 border border-zinc-200/60"
      >
        <ArrowLeft className="w-4 h-4 text-zinc-500" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Affiliate Campaign Summary Card */}
      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 mb-5">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className="text-[10px] font-mono font-semibold text-zinc-400">
            #{campaign?.id ?? "---"}
          </span>
          <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {isSaas ? "SaaS Subscription" : "Product Store"}
          </span>
        </div>
        <p className="font-bold text-xs text-zinc-900 truncate leading-snug" title={campaign?.name}>
          {campaign?.name || "Affiliate Campaign"}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${campaign?.is_active ? "bg-emerald-500" : "bg-zinc-300"}`} />
          <span className="text-[10px] text-zinc-500 font-medium">
            {campaign?.is_active ? "Active" : "Draft"}
          </span>
        </div>
      </div>

      {/* Campaign Navigation Tabs */}
      <div className="px-2 mb-2">
        <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
          Campaign Tabs
        </span>
      </div>
      <nav className="flex flex-col gap-1.5 flex-grow pr-1">
        <button
          type="button"
          onClick={() => {
            onTabChange("overview");
            onNavigate?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Overview & Rules</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange("partners");
            onNavigate?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
            activeTab === "partners"
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4" />
            <span>Creators & Applications</span>
          </div>
          {pendingPartnersCount > 0 && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === "partners"
                  ? "bg-indigo-700 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {pendingPartnersCount}
            </span>
          )}
        </button>
      </nav>

      {/* Brand User Footer Card */}
      <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-1.5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <div className="size-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200 shrink-0 overflow-hidden">
            {loading ? (
              <div className="w-4 h-4 rounded-full bg-indigo-200 animate-pulse" />
            ) : profile?.logo_url ? (
              <img src={profile.logo_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              (profile?.username?.[0] || "B").toUpperCase()
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-semibold text-xs text-zinc-900 truncate">{profile?.username || "Brand"}</p>
            <p className="text-[11px] text-zinc-500 truncate">{profile?.email || "brand@email.com"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors w-full"
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
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-zinc-200/80">
      <div className="w-10 flex items-center justify-start shrink-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open Navigation Menu"
              className="p-2 -ml-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-5 w-72 bg-white flex flex-col h-full overflow-hidden">
            <SheetTitle className="sr-only">Affiliate Campaign Navigation</SheetTitle>
            <AffiliateCampaignSidebarContent {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center justify-center">
        <Link to="/brand/dashboard" className="flex items-center gap-2.5">
          <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900">
            SELLR<span className="text-indigo-600">.</span>
          </h1>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brand
          </span>
        </Link>
      </div>

      <div className="w-10 flex items-center justify-end shrink-0">
        <Link
          to="/brand/dashboard"
          className="p-2 -mr-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
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
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-zinc-200/80 bg-white p-5 hidden md:flex">
      <AffiliateCampaignSidebarContent {...props} />
    </aside>
  );
};

export default AffiliateCampaignSidebar;
