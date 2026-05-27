import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TermsConditionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F7F7F7] max-w-lg w-[90vw] rounded-xl p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-[#F7F7F7]">Terms & Conditions</DialogTitle>
          <DialogDescription className="text-[#989898] text-sm mt-1">
            Last Updated: May 2026
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto mt-4 pr-2 space-y-4 text-[#C8C8C8] text-sm leading-relaxed scrollbar-thin scrollbar-thumb-[#FF5C00]/20 scrollbar-track-transparent">
          <p>
            Please read these Terms & Conditions carefully before using the Mipoe marketplace. By signing up, you agree to be bound by these terms.
          </p>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">1. User Accounts</h3>
          <p>
            You must be at least 18 years old to register. You agree to provide accurate registration information and accept full responsibility for all activities occurring under your session.
          </p>
          
          <h3 className="text-base font-semibold text-[#FF5C00] font-display">2. Creator Rules & Submissions</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Creators can submit reels to active campaigns. Submissions must adhere to the brand requirements and brief description.</li>
            <li>Reels must remain public on Instagram to qualify for view tracking and milestone earnings. Deleting or archiving submitted content may result in payment cancellation or penalty.</li>
            <li>Any attempt to artificially inflate metric views (fake bots, spamming views) is strictly prohibited and will result in account termination and wallet balance forfeiture.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">3. Brand Campaigns & Funding</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Brands must fund their campaigns prior to activation. Budgets are locked in the campaign wallet until milestones are met and distributed.</li>
            <li>Unspent campaign allocations can be reclaimed or refunded back to the brand wallet following the standard administrative approval flow.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#FF5C00] font-display">4. Platform Fees & Settlements</h3>
          <p>
            Mipoe reserves the right to charge service fees on transactions. All payments, deposits, and creator withdrawals are processed in accordance with tax laws and compliance verifications (like PAN card validations).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default TermsConditions;
