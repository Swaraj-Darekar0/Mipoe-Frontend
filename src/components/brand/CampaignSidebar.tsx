import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart2, 
  ShieldCheck, 
  LogOut, 
  Menu 
} from "lucide-react";
import { getBrandProfile, BrandProfile, logout as logoutApi, Campaign } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface CampaignSidebarProps {
  campaign: Campaign | null;
  activeTab: "statistics" | "verification";
  onTabChange: (tab: "statistics" | "verification") => void;
  verificationCount?: number;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const CampaignSidebarContent: React.FC<CampaignSidebarProps> = ({
  campaign,
  activeTab,
  onTabChange,
  verificationCount = 0,
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
        console.error("Failed to fetch brand profile for campaign sidebar:", error);
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

  const isClipping = campaign?.campaign_type?.toLowerCase() === "clipping";

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

      {/* Campaign Summary Card */}
      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 mb-5">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className="text-[10px] font-mono font-semibold text-zinc-400">
            #{campaign?.id ?? "---"}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${
              isClipping
                ? "border-purple-200 text-purple-700 bg-purple-50"
                : "border-pink-200 text-pink-700 bg-pink-50"
            }`}
          >
            {isClipping ? "Clipping" : "Influencer"}
          </span>
        </div>
        <p className="font-bold text-xs text-zinc-900 truncate leading-snug" title={campaign?.name}>
          {campaign?.name || "Campaign Details"}
        </p>
        {campaign?.category && (
          <p className="text-[10px] text-zinc-400 capitalize mt-0.5 truncate">
            {campaign.category.replace("_", " / ")}
          </p>
        )}
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
            onTabChange("statistics");
            onNavigate?.();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
            activeTab === "statistics"
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Statistics & Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange("verification");
            onNavigate?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
            activeTab === "verification"
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Content Verification</span>
          </div>
          {verificationCount > 0 && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === "verification"
                  ? "bg-indigo-700 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {verificationCount}
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

export const MobileCampaignSidebar: React.FC<CampaignSidebarProps> = (props) => {
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
            <SheetTitle className="sr-only">Campaign Navigation</SheetTitle>
            <CampaignSidebarContent {...props} onNavigate={() => setOpen(false)} />
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

export const CampaignSidebar: React.FC<CampaignSidebarProps> = (props) => {
  if (props.isMobile) {
    return <CampaignSidebarContent {...props} />;
  }

  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-zinc-200/80 bg-white p-5 hidden md:flex">
      <CampaignSidebarContent {...props} />
    </aside>
  );
};

export default CampaignSidebar;
