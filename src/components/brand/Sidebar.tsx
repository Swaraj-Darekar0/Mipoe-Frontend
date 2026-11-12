import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  Sparkles,
  Scissors,
  Megaphone,
  ShoppingBag,
  Inbox,
  BarChart3,
  ReceiptText,
  LogOut,
  Menu,
} from 'lucide-react';
import { getBrandProfile, BrandProfile, logout as logoutApi } from '@/lib/api';
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
    if (location.pathname !== to) return false;
    if (to === '/brand/dashboard') {
      const currentParams = new URLSearchParams(location.search);
      return !currentParams.has('tab');
    }
    return true;
  })();

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-xl text-sm transition-colors duration-150 group ${
        isActive
          ? 'bg-brand-blue/[0.08] text-ink font-semibold border-r-2 border-brand-blue'
          : 'text-slate font-medium hover:bg-black/[0.03] hover:text-ink'
      }`}
    >
      <span
        className={`shrink-0 transition-colors duration-150 ${
          isActive ? 'text-brand-blue' : 'text-steel group-hover:text-charcoal'
        }`}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
};

interface LaunchButtonProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const LaunchButton: React.FC<LaunchButtonProps> = ({
  to,
  icon,
  children,
  onClick,
  variant = 'primary',
}) => {
  const location = useLocation();
  const isActive = (location.pathname + location.search) === to;

  const activeStyles =
    variant === 'primary'
      ? 'bg-brand-blue text-white border border-brand-blue'
      : 'bg-ink text-white border border-ink';

  const inactiveStyles =
    variant === 'primary'
      ? 'bg-brand-blue/[0.08] text-ink hover:bg-brand-blue/[0.14] border border-brand-blue/25'
      : 'bg-black/[0.03] text-ink hover:bg-black/[0.06] border border-black/10';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors duration-150 ${
        isActive ? activeStyles : inactiveStyles
      }`}
    >
      <span
        className={`shrink-0 ${
          isActive
            ? 'text-white'
            : variant === 'primary'
            ? 'text-brand-blue'
            : 'text-charcoal'
        }`}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
};

export interface BrandSidebarContentProps {
  onNavigate?: () => void;
}

export const BrandSidebarContent: React.FC<BrandSidebarContentProps> = ({ onNavigate }) => {
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
        console.error('Failed to fetch brand profile for sidebar:', error);
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
    if (onNavigate) {
      onNavigate();
    }
    await logoutApi();
    navigate('/');
  };

  const isSaas = profile?.category?.toLowerCase().includes('saas');

  return (
    <div className="flex flex-col h-full text-ink">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-5 pt-0.5 pr-6 md:pr-0">
        <Link to="/brand/dashboard" onClick={onNavigate} className="flex items-center gap-2 min-h-[44px]">
          <span className="font-display text-xl font-bold tracking-tight text-ink lowercase">
            sellr<span className="text-brand-blue">.</span>
          </span>
          <span className="bg-brand-blue/10 text-brand-blue border border-brand-blue/20 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
            BRAND PORTAL
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
        {/* Overview Section */}
        <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          01 // OVERVIEW
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/brand/dashboard" icon={<LayoutGrid className="w-4 h-4" />} onClick={onNavigate}>
            Dashboard
          </NavLink>
        </div>

        {/* Campaigns Section */}
        <div className="mt-2 mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          02 // CAMPAIGNS
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/brand/dashboard?tab=campaigns" icon={<Building2 className="w-4 h-4" />} onClick={onNavigate}>
            Brand Campaigns
          </NavLink>
          <div className="flex flex-col gap-1.5 pt-1">
            <LaunchButton
              to="/brand/create?type=influencer"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={onNavigate}
              variant="primary"
            >
              Launch UGC Campaign
            </LaunchButton>
            <LaunchButton
              to="/brand/create?type=clipping"
              icon={<Scissors className="w-3.5 h-3.5" />}
              onClick={onNavigate}
              variant="secondary"
            >
              Launch Clipping Campaign
            </LaunchButton>
          </div>
        </div>

        {/* Affiliate Settings Section */}
        <div className="mt-2 mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          03 // AFFILIATE
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/brand/dashboard?tab=affiliate_campaigns" icon={<Megaphone className="w-4 h-4" />} onClick={onNavigate}>
            Affiliate Campaigns
          </NavLink>
          {!isSaas && (
            <NavLink to="/brand/dashboard?tab=product_catalog" icon={<ShoppingBag className="w-4 h-4" />} onClick={onNavigate}>
              Product Catalog
            </NavLink>
          )}
          <NavLink to="/brand/dashboard?tab=affiliate_crm" icon={<Inbox className="w-4 h-4" />} onClick={onNavigate}>
            Affiliate CRM
          </NavLink>
        </div>

        {/* Finance Section */}
        <div className="mt-2 mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
          04 // FINANCE
        </div>
        <div className="flex flex-col gap-1 mb-2">
          <NavLink to="/brand/transactions" icon={<BarChart3 className="w-4 h-4" />} onClick={onNavigate}>
            Transaction Log
          </NavLink>
          <NavLink to="/brand/dashboard?tab=tax_invoices" icon={<ReceiptText className="w-4 h-4" />} onClick={onNavigate}>
            GST &amp; Invoices (ITC)
          </NavLink>
        </div>
      </nav>

      {/* Brand User Footer Card */}
      <div className="mt-auto pt-4 border-t border-black/10 flex flex-col gap-1.5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/[0.03] border border-black/[0.08] min-h-[44px]">
          <div
            className={`size-9 rounded-full font-mono font-bold flex items-center justify-center text-xs border shrink-0 overflow-hidden ${
              loading
                ? 'bg-black/[0.08] border-black/[0.08]'
                : profile?.logo_url
                ? 'bg-white border-black/10'
                : 'bg-ink text-white border-black/10'
            }`}
          >
            {loading ? null : profile?.logo_url ? (
              <img src={profile.logo_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              (profile?.username?.[0] || 'B').toUpperCase()
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-display font-semibold text-xs text-ink truncate">
              {loading ? 'Loading...' : profile?.username || 'Brand'}
            </p>
            <p className="font-mono text-[10px] text-slate truncate">
              {loading ? 'brand workspace' : profile?.email || 'brand@email.com'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider text-slate hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-500/25 transition-colors duration-150 w-full min-h-[44px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export const MobileBrandSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-white/95 border-b border-black/10">
      <div className="w-11 flex items-center justify-start shrink-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open Navigation Menu"
              className="min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-lg text-charcoal hover:text-ink hover:bg-black/[0.04] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-5 w-72 bg-white text-ink border-r border-black/10 flex flex-col h-full overflow-hidden"
          >
            <SheetTitle className="sr-only">Brand Navigation</SheetTitle>
            <BrandSidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center justify-center">
        <Link to="/brand/dashboard" className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-display text-lg font-bold tracking-tight text-ink lowercase">
            sellr<span className="text-brand-blue">.</span>
          </span>
          <span className="bg-brand-blue/10 text-brand-blue border border-brand-blue/25 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            BRAND
          </span>
        </Link>
      </div>

      <div className="w-11 shrink-0" aria-hidden="true" />
    </header>
  );
};

export const BrandSidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-black/10 bg-white text-ink p-5 hidden md:flex">
      <BrandSidebarContent />
    </aside>
  );
};

export default BrandSidebar;
