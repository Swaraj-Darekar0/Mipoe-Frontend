import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PrivacyPolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F7F7F7] max-w-lg w-[90vw] rounded-xl p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-[#F7F7F7]">Privacy Policy</DialogTitle>
          <DialogDescription className="text-[#989898] text-sm mt-1">
            Last Updated: May 2026
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto mt-4 pr-2 space-y-4 text-[#C8C8C8] text-sm leading-relaxed scrollbar-thin scrollbar-thumb-[#FF5C00]/20 scrollbar-track-transparent">
          <p>
            At Mipoe, we value your privacy and are committed to protecting your personal data. This Privacy Policy details how we collect, process, and safeguard your information.
          </p>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us when registering and updating your profile:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Creators:</strong> Username, email, nickname, phone number, bio, Instagram handle, and settlement bank details / UPI ID.</li>
            <li><strong>Brands:</strong> Username, email, phone number, PAN details, company category, logo, and business address.</li>
          </ul>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">2. How We Use Your Data</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>To authenticate your session and manage your profile.</li>
            <li>To match creators with campaigns and process content submissions.</li>
            <li>To process deposits, withdrawals, and platform fee settlements via our payment gateways.</li>
            <li>To link Instagram accounts and verify posted reels metrics securely.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">3. Security & Hashing</h3>
          <p>
            We implement industry-grade security measures to safeguard your information:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Passwords:</strong> All credentials are hashed securely using the <strong>Argon2id</strong> password hashing algorithm before database storage.</li>
            <li><strong>PII Encryption:</strong> Sensitive banking details and PAN identification cards are symmetrically encrypted using <strong>cryptography.fernet</strong> before database persistence.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">4. Sharing of Data</h3>
          <p>
            We do not sell your personal data. We only share data with verified third-party partners (like Cashfree for tax compliance and payouts, Resend for email notifications) necessary to fulfill our core services.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default PrivacyPolicy;
