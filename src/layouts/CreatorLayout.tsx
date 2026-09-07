import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar, { MobileCreatorSidebar } from '@/components/creator/Sidebar';
import { fetchCreatorProfile, CreatorProfile as ApiCreatorProfile } from '@/lib/api';

interface CreatorLayoutProps {
  children: React.ReactNode;
}

const CreatorLayout: React.FC<CreatorLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<ApiCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await fetchCreatorProfile();
        if (isMounted) setUser(profile);
      } catch (error) {
        console.error("Failed to fetch creator profile for layout:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#ffffff] text-zinc-900 flex flex-col md:flex-row overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
      {/* Desktop sidebar */}
      <CreatorSidebar />

      {/* Sticky mobile topbar */}
      <header className="md:hidden sticky top-0 z-40 grid grid-cols-3 items-center h-14 px-4 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        {/* Left (col 1) */}
        <div className="flex items-center justify-start">
          <MobileCreatorSidebar />
        </div>

        {/* Center (col 2) */}
        <div className="flex items-center justify-center">
          <Link to="/creator/dashboard" className="flex items-center gap-1.5">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-zinc-900">
              SELLR<span className="text-orange-500">.</span>
            </h1>
            <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Creator
            </span>
          </Link>
        </div>

        {/* Right (col 3) */}
        <div className="flex items-center justify-end">
          <Link
            to="/creator/profile"
            aria-label="Creator profile"
            className="size-9 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <div className="size-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs border border-orange-200 hover:ring-2 hover:ring-orange-400 transition-all">
              {loading ? (
                <div className="w-3.5 h-3.5 rounded-full bg-orange-200 animate-pulse" />
              ) : (
                (user?.username?.[0] || 'C').toUpperCase()
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 w-full md:ml-64 min-w-0 px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CreatorLayout;
