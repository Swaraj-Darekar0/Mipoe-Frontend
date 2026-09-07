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
  LogOut, 
  Menu 
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
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600 shadow-xs'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

interface LaunchButtonProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  accentColor?: 'indigo' | 'purple';
}

const LaunchButton: React.FC<LaunchButtonProps> = ({
  to,
  icon,
  children,
  onClick,
  accentColor = 'indigo',
}) => {
  const location = useLocation();
  const isActive = (location.pathname + location.search) === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
        isActive
          ? accentColor === 'indigo'
            ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
            : 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-600'
          : accentColor === 'indigo'
          ? 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/90 border border-indigo-200/70'
          : 'bg-purple-50/80 text-purple-700 hover:bg-purple-100/90 border border-purple-200/70'
      }`}
    >
      <span className={isActive ? 'text-white' : ''}>{icon}</span>
      <span>{children}</span>
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
    await logoutApi();
    navigate('/');
  };

  const isSaas = profile?.category?.toLowerCase().includes('saas');

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-6 pt-1">
        <Link to="/brand/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            SELLR<span className="text-indigo-600">.</span>
          </h1>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brand
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-1">
        <NavLink to="/brand/dashboard" icon={<LayoutGrid className="w-4 h-4 text-indigo-600" />} onClick={onNavigate}>
          Dashboard
        </NavLink>

        {/* Campaigns Section */}
        <div className="mt-5 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Campaigns
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/brand/dashboard?tab=campaigns" icon={<Building2 className="w-4 h-4 text-indigo-600" />} onClick={onNavigate}>
            Brand Campaigns
          </NavLink>
          <div className="flex flex-col gap-1.5 pt-1">
            <LaunchButton
              to="/brand/create?type=influencer"
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={onNavigate}
              accentColor="indigo"
            >
              Launch UGC Campaign
            </LaunchButton>
            <LaunchButton
              to="/brand/create?type=clipping"
              icon={<Scissors className="w-3.5 h-3.5 text-purple-600" />}
              onClick={onNavigate}
              accentColor="purple"
            >
              Launch Clipping Campaign
            </LaunchButton>
          </div>
        </div>

        {/* Affiliate Settings Section */}
        <div className="mt-5 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Affiliate Settings
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/brand/dashboard?tab=affiliate_campaigns" icon={<Megaphone className="w-4 h-4 text-blue-500" />} onClick={onNavigate}>
            Affiliate Campaigns
          </NavLink>
          {!isSaas && (
            <NavLink to="/brand/dashboard?tab=product_catalog" icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />} onClick={onNavigate}>
              Product Catalog
            </NavLink>
          )}
          <NavLink to="/brand/dashboard?tab=affiliate_crm" icon={<Inbox className="w-4 h-4 text-violet-500" />} onClick={onNavigate}>
            Affiliate CRM
          </NavLink>
        </div>

        {/* Finance Section */}
        <div className="mt-5 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Finance
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/brand/transactions" icon={<BarChart3 className="w-4 h-4 text-teal-600" />} onClick={onNavigate}>
            Transaction Log
          </NavLink>
        </div>
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
              (profile?.username?.[0] || 'B').toUpperCase()
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-semibold text-xs text-zinc-900 truncate">{profile?.username || 'Brand'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{profile?.email || 'brand@email.com'}</p>
          </div>
        </div>

        <button
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

export const MobileBrandSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

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
            <SheetTitle className="sr-only">Brand Navigation</SheetTitle>
            <BrandSidebarContent onNavigate={() => setOpen(false)} />
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

      <div className="w-10 shrink-0" aria-hidden="true" />
    </header>
  );
};

export const BrandSidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 flex-col border-r border-zinc-200/80 bg-white p-5 hidden md:flex">
      <BrandSidebarContent />
    </aside>
  );
};

export default BrandSidebar;
