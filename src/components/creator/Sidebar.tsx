import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Flame, Send, Wallet, User, LogOut } from 'lucide-react';
import { fetchCreatorProfile, CreatorProfile as ApiCreatorProfile } from '@/lib/api';
import { logout as logoutApi } from "@/lib/api";

const NavLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
    <aside className="fixed top-0 left-0 z-50 h-full w-64 flex-col border-r border-white/10 bg-[#18181B] p-6 hidden md:flex">
      <div className="flex items-center gap-4 mb-10">
        <div className="size-8 text-primary">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"></path>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Mipoe</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-grow">
        <NavLink to="/creator/dashboard" icon={<LayoutGrid className="w-5 h-5" />}>Hub</NavLink>
        <NavLink to="/creator/campaigns" icon={<Flame className="w-5 h-5" />}>Campaigns</NavLink>
        <NavLink to="/creator/submissions" icon={<Send className="w-5 h-5" />}>Submissions</NavLink>
        <NavLink to="/creator/wallet" icon={<Wallet className="w-5 h-5" />}>Earnings</NavLink>
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <Link to="/creator/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
          <div className="size-10 rounded-full bg-gray-700 flex items-center justify-center">
            {loading ? (
              <div className="w-5 h-5 rounded-full bg-gray-600 animate-pulse" />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-body font-semibold text-sm text-white truncate">{user?.username || 'Creator'}</p>
            <p className="font-body text-xs text-gray-400 truncate">{user?.email || 'creator@email.com'}</p>
          </div>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-5 h-5"/>
            <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
