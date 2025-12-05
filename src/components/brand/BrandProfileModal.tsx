import React, { useState, useEffect } from 'react';
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
import { Loader2 } from "lucide-react";

// Import the new phone input component and its styles
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandProfile: BrandProfile | null;
  onProfileUpdated: () => void;
}

const BrandProfileModal: React.FC<BrandProfileModalProps> = ({ isOpen, onClose, brandProfile, onProfileUpdated }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState(brandProfile?.username || '');
  const [phone, setPhone] = useState<string | undefined>(brandProfile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (brandProfile) {
      setUsername(brandProfile.username || '');
      setPhone(brandProfile.phone || '');
    }
  }, [brandProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Business name cannot be empty.');
      return;
    }
    // Use the library's validation function for robustness
    if (!phone || !isValidPhoneNumber(phone)) {
      setError('Please enter a valid phone number.');
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
      <DialogContent className="sm:max-w-[425px]">
        {/* Inline styles to match the phone input with the project's UI design */}
        <style>
          {`
            .PhoneInputInput {
              display: flex;
              height: 40px;
              width: 100%;
              border-radius: 0.375rem;
              border: 1px solid hsl(240 5.9% 90%);
              background-color: transparent;
              padding: 0.5rem 0.75rem;
              font-size: 0.875rem;
              line-height: 1.25rem;
              outline: none;
            }
            .PhoneInputInput:focus {
              border-color: hsl(240 5.9% 70%);
            }
          `}
        </style>
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your business name and phone number to proceed with transactions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Business Name
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number
            </Label>
            <div className="col-span-3">
              <PhoneInput
                id="phone"
                placeholder="Enter phone number"
                value={phone}
                onChange={setPhone}
                defaultCountry="IN"
                international
                countryCallingCodeEditable={false}
                className="w-full"
                inputClassName="PhoneInputInput"
              />
            </div>
          </div>
          {error && <p className="col-span-4 text-red-500 text-sm text-center">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandProfileModal;
