import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full p-8 md:p-12 bg-dark-void text-dusty-grey text-xs font-mono uppercase tracking-wider border-t border-dusty-grey/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <p className="text-snow mb-4 text-sm font-bold">Mipoe </p>
          <p className="max-w-md leading-relaxed opacity-70">
            reimagined for the decentralized web.
            Consolidating all interests in art, culture, and commerce under one
            algorithmic-free rubric.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-snow mb-2 block">Contact</span>
          <a className="hover:text-primary transition-colors" href="#">
            info@mipoe.index
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            1-800-NO-ALGO
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Mumbai, India
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-snow mb-2 block">Legals</span>
          <a className="hover:text-primary transition-colors" href="#">
            Terms of Service
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <span className="mt-4 opacity-50">© 2025 Mipoe </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;