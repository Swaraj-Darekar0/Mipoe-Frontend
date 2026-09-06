import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const POLICY_LINKS = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cookie-policy", label: "Cookie Policy" },
];

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/** Shared page shell for the Terms, Privacy and Cookie policy pages. */
const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-dark-void text-[#C8C8C8]">
      <header className="border-b border-dusty-grey/20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-mono text-sm font-bold uppercase tracking-wider text-snow hover:text-[#FF5C00] transition-colors">
            sellr.
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-dusty-grey hover:text-[#FF5C00] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <nav className="mb-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider">
          {POLICY_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={
                pathname === to
                  ? "text-[#FF5C00] border-b border-[#FF5C00] pb-0.5"
                  : "text-dusty-grey hover:text-snow transition-colors"
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-snow">{title}</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-dusty-grey">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed md:text-[15px]">{children}</div>

        <footer className="mt-16 border-t border-dusty-grey/20 pt-8 text-xs text-dusty-grey">
          <p>
            Questions about this document? Write to{" "}
            <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">
              info@sellr.in
            </a>
            .
          </p>
          <p className="mt-4 font-mono uppercase tracking-wider opacity-60">© 2026 sellr · Mumbai, India</p>
        </footer>
      </main>
    </div>
  );
};

/** Numbered content section with the shared heading style. */
export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-display text-lg font-semibold text-[#FF5C00]">{title}</h2>
    {children}
  </section>
);

/** "The short version" callout — a plain-English summary shown before the full text. */
export const ShortVersion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="rounded-xl border border-[#FF5C00]/25 bg-[#FF5C00]/5 p-5 md:p-6">
    <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#FF5C00]">The short version</p>
    <ul className="list-disc space-y-2 pl-5 text-snow/90">{children}</ul>
  </aside>
);

export default LegalLayout;
