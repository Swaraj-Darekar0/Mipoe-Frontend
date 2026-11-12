import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateBrandProfile, BrandProfile } from "@/lib/api";

// Import the phone input component and its styles
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: BrandProfile | null;
  onProfileUpdated: () => void;
}

const BrandProfileModal: React.FC<BrandProfileModalProps> = ({
  isOpen,
  onClose,
  brandProfile,
  onProfileUpdated,
}) => {
  const { toast } = useToast();
  const [username, setUsername] = useState(brandProfile?.username || "");
  const [phone, setPhone] = useState<string | undefined>(brandProfile?.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (brandProfile) {
      setUsername(brandProfile.username || "");
      setPhone(brandProfile.phone || "");
    }
  }, [brandProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Business name cannot be empty.");
      return;
    }
    // Use the library's validation function for robustness
    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      await updateBrandProfile({ username, phone });
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
      onProfileUpdated(); // Notify parent that profile was updated
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      toast({
        title: "Error",
        description: err.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[440px]">
        {/* Light Paper styles for react-phone-number-input */}
        <style>
          {`
            .sellr-phone-input {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              width: 100%;
              min-width: 0;
            }
            .sellr-phone-input .PhoneInputCountry {
              height: 40px;
              padding: 0 0.625rem;
              border-radius: 0.75rem;
              border: 1px solid rgba(18, 19, 22, 0.15);
              background-color: #ffffff;
              margin-right: 0;
            }
            .sellr-phone-input .PhoneInputInput {
              display: flex;
              height: 40px;
              width: 100%;
              min-width: 0;
              border-radius: 0.75rem;
              border: 1px solid rgba(18, 19, 22, 0.15);
              background-color: #ffffff;
              color: #0e0e11;
              padding: 0.5rem 0.75rem;
              font-size: 0.875rem;
              line-height: 1.25rem;
              outline: none;
              transition: border-color 150ms ease;
            }
            .sellr-phone-input .PhoneInputInput:focus {
              border-color: #2b5ce6;
            }
          `}
        </style>
        <DialogHeader>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            01 // ACCOUNT COMPLIANCE
          </p>
          <DialogTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-slate leading-relaxed">
            Provide your business name and verified phone number to proceed with vault transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
            >
              Business Name
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Acme Studio Pvt. Ltd."
              className="focus-visible:border-brand-blue"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
            >
              Phone Number
            </Label>
            <div className="min-w-0 w-full">
              <PhoneInput
                id="phone"
                placeholder="Enter phone number"
                value={phone}
                onChange={setPhone}
                defaultCountry="IN"
                international
                countryCallingCodeEditable={false}
                className="sellr-phone-input"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-500/25 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandProfileModal;
