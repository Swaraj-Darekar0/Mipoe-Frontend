import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Flame, Send, Wallet, User, LogOut, Store } from 'lucide-react';
import { fetchCreatorProfile, CreatorProfile as ApiCreatorProfile } from '@/lib/api';
import { logout as logoutApi } from "@/lib/api";

const NavLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = to.includes('?') 
    ? (location.pathname + location.search) === to 
    : location.pathname === to && !location.search;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

const Sidebar = () => {
  const [user, setUser] = useState<ApiCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchCreatorProfile();
        setUser(profile);
      } catch (error) {
        console.error("Failed to fetch user profile for sidebar:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);
  
  const handleLogout = async () => {
    await logoutApi();
    navigate("/");
  };

  return (
    <aside className="fixed top-0 left-0 z-50 h-full w-64 flex-col border-r border-zinc-200/80 bg-[#ffffff] p-6 hidden md:flex">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8 pt-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
          SELLR<span className="text-orange-500">.</span>
        </h1>
        <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Creator
        </span>
      </div>

      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto">
        <NavLink to="/creator/dashboard" icon={<LayoutGrid className="w-4 h-4 text-orange-500" />}>Hub</NavLink>
        
        <div className="mt-5 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Campaigns
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/creator/campaigns?type=influencer" icon={<Flame className="w-4 h-4 text-pink-500" />}>Influencer</NavLink>
          <NavLink to="/creator/campaigns?type=clipping" icon={<Flame className="w-4 h-4 text-purple-500" />}>Clipping</NavLink>
        </div>

        <div className="mt-4 mb-1 px-3 text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Affiliate
        </div>
        <div className="flex flex-col gap-1 pl-1 mb-1">
          <NavLink to="/creator/affiliate-campaigns" icon={<Flame className="w-4 h-4 text-orange-500" />}>Campaigns</NavLink>
          <NavLink to="/creator/affiliate-analytics" icon={<LayoutGrid className="w-4 h-4 text-orange-500" />}>Analytics</NavLink>
          <NavLink to="/creator/store" icon={<Store className="w-4 h-4 text-orange-500" />}>My Store</NavLink>
        </div>

        <NavLink to="/creator/submissions" icon={<Send className="w-4 h-4 text-blue-500" />}>Submissions</NavLink>
        <NavLink to="/creator/wallet" icon={<Wallet className="w-4 h-4 text-emerald-500" />}>Earnings</NavLink>
      </nav>

      {/* User Footer Card */}
      <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-1.5">
        <Link to="/creator/profile" className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 transition-colors">
          <div className="size-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm border border-orange-200">
            {loading ? (
              <div className="w-4 h-4 rounded-full bg-orange-200 animate-pulse" />
            ) : (
              (user?.username?.[0] || 'C').toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-xs text-zinc-900 truncate">{user?.username || 'Creator'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email || 'creator@email.com'}</p>
          </div>
        </Link>
        
        <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors w-full">
          <LogOut className="w-4 h-4"/>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

