import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Flame,
  Scissors,
  Megaphone,
  BarChart3,
  Send,
  Wallet,
  LogOut,
  Store,
  Menu,
  Lock,
  Sparkles,
} from 'lucide-react';
import { fetchCreatorProfile, CreatorProfile as ApiCreatorProfile, logout as logoutApi, getUserId } from '@/lib/api';
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
  badge?: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, children, onClick, badge }) => {
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
      className={`flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] rounded-xl text-sm transition-colors duration-150 group ${
        isActive
          ? 'bg-lava/10 text-ink font-semibold border-r-2 border-lava'
          : 'text-slate font-medium hover:bg-black/[0.03] hover:text-ink'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? 'text-lava' : 'text-steel group-hover:text-charcoal'
          }`}
        >
          {icon}
        </span>
        <span className="truncate">{children}</span>
      </div>
      {badge}
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
      if (!getUserId()) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const profile = await fetchCreatorProfile();
        if (isMounted) setUser(profile);
      } catch (error) {
        console.error('Failed to fetch user profile for sidebar:', error);
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
    navigate('/');
  };

  const isGuest = !user && !loading;
  const guestLockBadge = isGuest ? (
    <Lock className="w-3.5 h-3.5 text-steel group-hover:text-lava transition-colors duration-150 shrink-0" />
  ) : null;

  return (
    <div className="flex flex-col h-full text-ink">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-5 pt-0.5 pr-6 md:pr-0">
        <Link
          to="/creator/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <span className="font-display text-xl font-bold tracking-tight text-ink lowercase">
            sellr<span className="text-lava">.</span>
          </span>
          <span className="bg-lava/10 text-lava border border-lava/25 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
            CREATOR PORTAL
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
        <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          01 // HUB
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <NavLink to="/creator/dashboard" icon={<LayoutGrid className="w-4 h-4" />} onClick={onNavigate}>
            Hub
          </NavLink>
        </div>

        <div className="mt-2 mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          02 // CAMPAIGNS
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <NavLink to="/creator/campaigns" icon={<Flame className="w-4 h-4" />} onClick={onNavigate}>
            All Campaigns
          </NavLink>
          <NavLink to="/creator/campaigns?type=influencer" icon={<Sparkles className="w-4 h-4" />} onClick={onNavigate}>
            Influencer / UGC
          </NavLink>
          <NavLink to="/creator/campaigns?type=clipping" icon={<Scissors className="w-4 h-4" />} onClick={onNavigate}>
            Clipping
          </NavLink>
          <NavLink to="/creator/affiliate-campaigns" icon={<Megaphone className="w-4 h-4" />} onClick={onNavigate}>
            Affiliate Campaigns
          </NavLink>
          <NavLink to="/creator/submissions" icon={<Send className="w-4 h-4" />} onClick={onNavigate} badge={guestLockBadge}>
            Submissions
          </NavLink>
        </div>

        <div className="mt-2 mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          03 // EARNINGS &amp; STORE
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/creator/wallet" icon={<Wallet className="w-4 h-4" />} onClick={onNavigate} badge={guestLockBadge}>
            Earnings
          </NavLink>
          <NavLink to="/creator/affiliate-analytics" icon={<BarChart3 className="w-4 h-4" />} onClick={onNavigate} badge={guestLockBadge}>
            Analytics
          </NavLink>
          <NavLink to="/creator/store" icon={<Store className="w-4 h-4" />} onClick={onNavigate} badge={guestLockBadge}>
            My Store
          </NavLink>
        </div>
      </nav>

      {/* Bottom User Profile Card & Logout */}
      <div className="mt-auto pt-4 border-t border-black/10 flex flex-col gap-1.5">
        {isGuest ? (
          <Link
            to="/login?role=creator"
            onClick={onNavigate}
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.05] border border-black/[0.08] hover:border-lava/35 transition-colors duration-150 min-h-[44px]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-ink text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                ?
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="font-display font-semibold text-xs text-ink truncate">Guest Explorer</p>
                <p className="font-mono text-[10px] text-slate truncate">Sign in to earn</p>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-lava shrink-0">
              Login →
            </span>
          </Link>
        ) : (
          <Link
            to="/creator/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.05] border border-black/[0.08] hover:border-black/15 transition-colors duration-150 min-h-[44px]"
          >
            <div
              className={`size-9 rounded-full font-mono font-bold flex items-center justify-center text-xs border shrink-0 ${
                loading
                  ? 'bg-black/[0.08] border-black/[0.08]'
                  : 'bg-ink text-white border-black/10'
              }`}
            >
              {loading ? null : (user?.username?.[0] || 'C').toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="font-display font-semibold text-xs text-ink truncate">
                {loading ? 'Loading...' : user?.username || 'Creator'}
              </p>
              <p className="font-mono text-[10px] text-slate truncate">
                {loading ? 'creator workspace' : user?.email || 'creator@email.com'}
              </p>
            </div>
          </Link>
        )}

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider text-slate hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-500/25 transition-colors duration-150 w-full min-h-[44px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        )}
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
          className="min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-lg text-charcoal hover:text-ink hover:bg-black/[0.04] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-lava"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-5 w-72 bg-white text-ink border-r border-black/10 flex flex-col h-full overflow-hidden"
      >
        <SheetTitle className="sr-only">Creator Navigation</SheetTitle>
        <CreatorSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

export const CreatorSidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-black/10 bg-white text-ink p-5 hidden md:flex">
      <CreatorSidebarContent />
    </aside>
  );
};

export default CreatorSidebar;
