import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full p-8 md:p-12 bg-dark-void text-dusty-grey text-xs font-mono uppercase tracking-wider border-t border-dusty-grey/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <p className="text-snow mb-4 text-sm font-bold">sellr.</p>
          <p className="max-w-md leading-relaxed opacity-70">
            reimagined for the decentralized web.
            Consolidating all interests in art, culture, and commerce under one
            algorithmic-free rubric.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-snow mb-2 block">Contact</span>
          <a className="hover:text-primary transition-colors" href="mailto:info@sellr.in">
            info@sellr.in
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            1-800-NO-ALGO
          </a>
          <span>Mumbai, India</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-snow mb-2 block">Legals</span>
          <Link className="hover:text-primary transition-colors" to="/terms">
            Terms & Conditions
          </Link>
          <Link className="hover:text-primary transition-colors" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="hover:text-primary transition-colors" to="/cookie-policy">
            Cookie Policy
          </Link>
          <span className="mt-4 opacity-50">© 2026 sellr</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
