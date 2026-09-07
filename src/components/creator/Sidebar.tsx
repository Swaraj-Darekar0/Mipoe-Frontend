import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Flame, Send, Wallet, LogOut, Store, Menu } from 'lucide-react';
import { fetchCreatorProfile, CreatorProfile as ApiCreatorProfile, logout as logoutApi } from '@/lib/api';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, children, onClick }) => {
  const location = useLocation();

  const isActive = (() => {
    if (to.includes('?')) {
      const [toPath, toQuery] = to.split('?');
      if (location.pathname !== toPath) return false;
      const toParams = new URLSearchParams(toQuery);
      const currentParams = new URLSearchParams(location.search);
      for (const [key, value] of toParams.entries()) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    }
    return location.pathname === to && !location.search;
  })();

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-orange-500/10 text-orange-600 font-semibold border-r-2 border-orange-500 shadow-xs'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

export interface CreatorSidebarContentProps {
  onNavigate?: () => void;
}

export const CreatorSidebarContent: React.FC<CreatorSidebarContentProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<ApiCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await fetchCreatorProfile();
        if (isMounted) setUser(profile);
      } catch (error) {
        console.error("Failed to fetch user profile for sidebar:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    if (onNavigate) {
      onNavigate();
    }
    await logoutApi();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-6 pt-1">
        <Link
          to="/creator/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-h-[44px]"
        >
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            SELLR<span className="text-orange-500">.</span>
          </h1>
          <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Creator
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-1">
        <NavLink to="/creator/dashboard" icon={<LayoutGrid className="w-4 h-4 text-orange-500" />} onClick={onNavigate}>
          Hub
        </NavLink>

        <div className="mt-5 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Campaigns
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/creator/campaigns?type=influencer" icon={<Flame className="w-4 h-4 text-pink-500" />} onClick={onNavigate}>
            Influencer
          </NavLink>
          <NavLink to="/creator/campaigns?type=clipping" icon={<Flame className="w-4 h-4 text-purple-500" />} onClick={onNavigate}>
            Clipping
          </NavLink>
        </div>

        <div className="mt-4 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Affiliate
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/creator/affiliate-campaigns" icon={<Flame className="w-4 h-4 text-orange-500" />} onClick={onNavigate}>
            Campaigns
          </NavLink>
          <NavLink to="/creator/affiliate-analytics" icon={<LayoutGrid className="w-4 h-4 text-orange-500" />} onClick={onNavigate}>
            Analytics
          </NavLink>
          <NavLink to="/creator/store" icon={<Store className="w-4 h-4 text-orange-500" />} onClick={onNavigate}>
            My Store
          </NavLink>
        </div>

        <NavLink to="/creator/submissions" icon={<Send className="w-4 h-4 text-blue-500" />} onClick={onNavigate}>
          Submissions
        </NavLink>
        <NavLink to="/creator/wallet" icon={<Wallet className="w-4 h-4 text-emerald-500" />} onClick={onNavigate}>
          Earnings
        </NavLink>
      </nav>

      {/* Bottom User Profile Card & Logout */}
      <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-1.5">
        <Link
          to="/creator/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 transition-colors min-h-[44px]"
        >
          <div className="size-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm border border-orange-200 shrink-0">
            {loading ? (
              <div className="w-4 h-4 rounded-full bg-orange-200 animate-pulse" />
            ) : (
              (user?.username?.[0] || 'C').toUpperCase()
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-semibold text-xs text-zinc-900 truncate">{user?.username || 'Creator'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email || 'creator@email.com'}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors w-full min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export const MobileCreatorSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open Navigation Menu"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-5 w-72 bg-white flex flex-col h-full overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <SheetTitle className="sr-only">Creator Navigation</SheetTitle>
        <CreatorSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

export const CreatorSidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-zinc-200/80 bg-white p-5 hidden md:flex">
      <CreatorSidebarContent />
    </aside>
  );
};

export default CreatorSidebar;
