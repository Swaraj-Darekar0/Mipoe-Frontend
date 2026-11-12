import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import CreatorSidebar, { MobileCreatorSidebar } from '@/components/creator/Sidebar';
import { fetchCreatorProfile, getUserId, CreatorProfile as ApiCreatorProfile } from '@/lib/api';

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
        if (!getUserId()) {
          if (isMounted) setLoading(false);
          return;
        }
        const profile = await fetchCreatorProfile();
        if (isMounted) setUser(profile);
      } catch {
        // Guest mode or unauthenticated
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
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row overflow-x-hidden selection:bg-lava/15 selection:text-ink">
      {/* Desktop sidebar */}
      <CreatorSidebar />

      {/* Sticky mobile topbar */}
      <header className="md:hidden sticky top-0 z-40 grid grid-cols-3 items-center h-14 px-3 sm:px-4 bg-white/95 border-b border-black/10">
        {/* Left (col 1) */}
        <div className="flex items-center justify-start">
          <MobileCreatorSidebar />
        </div>

        {/* Center (col 2) */}
        <div className="flex items-center justify-center">
          <Link to="/creator/campaigns" className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-display text-lg font-bold tracking-tight text-ink lowercase">
              sellr<span className="text-lava">.</span>
            </span>
            <span className="bg-lava/10 text-lava border border-lava/25 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              CREATOR
            </span>
          </Link>
        </div>

        {/* Right (col 3) */}
        <div className="flex items-center justify-end">
          {loading ? (
            <div
              aria-label="Loading creator profile"
              className="size-8 rounded-full bg-black/[0.06] border border-black/10 flex items-center justify-center"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-steel" />
            </div>
          ) : user ? (
            <Link
              to="/creator/profile"
              aria-label="Creator profile"
              className="min-h-[44px] min-w-[44px] flex items-center justify-end rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-lava"
            >
              <div className="size-8 rounded-full bg-ink text-white font-mono font-bold flex items-center justify-center text-xs border border-black/10 hover:bg-charcoal transition-colors duration-150">
                {(user?.username?.[0] || 'C').toUpperCase()}
              </div>
            </Link>
          ) : (
            <Link
              to="/login?role=creator"
              className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:text-lava px-2.5 py-1.5 min-h-[36px] inline-flex items-center rounded-lg bg-black/[0.03] hover:bg-lava/10 border border-black/10 hover:border-lava/30 transition-colors duration-150 whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 w-full md:ml-64 min-w-0 p-3 sm:p-4 md:p-5">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CreatorLayout;
