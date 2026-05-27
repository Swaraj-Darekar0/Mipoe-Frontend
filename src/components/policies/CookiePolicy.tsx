import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CookiePolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F7F7F7] max-w-lg w-[90vw] rounded-xl p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-[#F7F7F7]">Cookie Policy</DialogTitle>
          <DialogDescription className="text-[#989898] text-sm mt-1">
            Last Updated: May 2026
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto mt-4 pr-2 space-y-4 text-[#C8C8C8] text-sm leading-relaxed scrollbar-thin scrollbar-thumb-[#FF5C00]/20 scrollbar-track-transparent">
          <p>
            Welcome to Mipoe. This Cookie Policy explains how we use cookies and similar technologies to recognize you when you visit our marketplace platform.
          </p>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">1. What are Cookies?</h3>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or work more efficiently, as well as to provide reporting information.
          </p>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">2. Why We Use Cookies</h3>
          <p>
            We use cookies to maintain secure sessions and keep you signed in to our platform. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Essential Session Cookies:</strong> We store a secure, cryptographically-signed <code className="bg-[#2A2A2A] px-1 py-0.5 rounded text-white">access_token</code> cookie in your browser. This cookie is marked as <code className="bg-[#2A2A2A] px-1 py-0.5 rounded text-white">HttpOnly</code>, meaning it cannot be read by JavaScript scripts, keeping your credentials secure from Cross-Site Scripting (XSS) attacks.
            </li>
            <li>
              <strong>Sliding Session Duration:</strong> The cookie maintains your active login state for 30 days. When you interact with the marketplace, the backend automatically renews (slides) this period so you stay signed in seamlessly.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">3. Third-Party Cookies</h3>
          <p>
            We may integrate with external providers like Supabase (for Google OAuth login) and Cashfree (for payment gateway settlements). These services set secure third-party cookies to verify your identity and process transaction payloads securely.
          </p>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">4. Controlling Cookies</h3>
          <p>
            You have the right to accept or decline cookies. Please note that since our marketplace uses the <code className="bg-[#2A2A2A] px-1 py-0.5 rounded text-white">access_token</code> session cookie for core authentication and security, disabling it will prevent you from logging in or using any authenticated features of Mipoe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default CookiePolicy;
