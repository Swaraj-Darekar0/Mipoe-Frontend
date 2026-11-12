import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandSidebar, { BrandSidebarContent } from "@/components/brand/Sidebar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowLeft } from "lucide-react";

interface BrandLayoutProps {
  children: React.ReactNode;
  sidebar?: "dashboard" | "none" | React.ReactNode;
  mobileSidebar?: React.ReactNode;
  fullWidth?: boolean;
}

const BrandLayout: React.FC<BrandLayoutProps> = ({
  children,
  sidebar = "dashboard",
  mobileSidebar,
  fullWidth = false,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // 1. None Context: full-width canvas with no sidebar or mobile header
  if (sidebar === "none") {
    return (
      <div className="min-h-screen bg-canvas text-ink selection:bg-brand-blue/15 selection:text-ink overflow-x-hidden">
        <main className={`w-full ${fullWidth ? "" : "max-w-7xl mx-auto"} p-3 sm:p-4 md:p-5`}>
          {children}
        </main>
      </div>
    );
  }

  // 2. Custom element sidebar context (e.g. CampaignSidebar, AffiliateCampaignSidebar)
  const isCustomSidebar = typeof sidebar !== "string" && React.isValidElement(sidebar);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row selection:bg-brand-blue/15 selection:text-ink overflow-x-hidden">
      {/* Desktop Sidebar */}
      {isCustomSidebar ? (
        sidebar
      ) : (
        <BrandSidebar />
      )}

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-md border-b border-black/10">
        {/* Top Left: Toggle button (hamburger / mobile drawer trigger) */}
        <div className="w-10 flex items-center justify-start shrink-0">
          {mobileSidebar ? (
            mobileSidebar
          ) : (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open Navigation Menu"
                  className="p-2 -ml-2 rounded-lg text-charcoal hover:text-ink hover:bg-black/[0.04] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-5 w-72 bg-white border-r border-black/10 flex flex-col h-full overflow-hidden">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {isCustomSidebar && React.isValidElement(sidebar) ? (
                  React.cloneElement(sidebar as React.ReactElement<any>, {
                    isMobile: true,
                    onNavigate: () => setMobileOpen(false),
                  })
                ) : (
                  <BrandSidebarContent onNavigate={() => setMobileOpen(false)} />
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Center / Middle: sellr. logo with Brand badge, centered horizontally */}
        <div className="flex items-center justify-center">
          <Link to="/brand/dashboard" className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight text-ink">
              sellr<span className="text-brand-blue">.</span>
            </h1>
            <span className="bg-brand-blue/10 text-brand-blue border border-brand-blue/25 font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Brand
            </span>
          </Link>
        </div>

        {/* Top Right: Empty placeholder spacer or Back Button for Custom Context */}
        <div className="w-10 flex items-center justify-end shrink-0">
          {isCustomSidebar ? (
            <Link
              to="/brand/dashboard"
              className="p-2 -mr-2 rounded-lg text-slate hover:text-ink hover:bg-black/[0.04] transition-colors"
              title="Back to Dashboard"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 min-w-0 min-h-screen bg-canvas p-3 sm:p-4 md:p-5">
        <div className={fullWidth ? "w-full" : "max-w-7xl mx-auto"}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default BrandLayout;
