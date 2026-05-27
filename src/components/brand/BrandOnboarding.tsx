import React, { useState, useEffect } from "react";
import { 
  verifyBrandPan, 
  submitBrandProfile, 
  BrandProfile 
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  ShieldAlert,
  Edit,
  Globe,
  Instagram,
  Youtube,
  ChevronLeft
} from "lucide-react";

interface BrandOnboardingProps {
  profile: BrandProfile | null;
  onProfileUpdated: (silent?: boolean) => Promise<void>;
}

export const BrandOnboarding: React.FC<BrandOnboardingProps> = ({ profile, onProfileUpdated }) => {
  const { toast } = useToast();

  // Step 2 (Verification) States
  const [panNumber, setPanNumber] = useState("");
  const [panHolderName, setPanHolderName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panError, setPanError] = useState("");
  const [editPanMode, setEditPanMode] = useState(false);

  // Step 3 (Profile Setup) States
  const [category, setCategory] = useState("Fashion");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [profileError, setProfileError] = useState("");
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Initialize values from profile
  useEffect(() => {
    if (profile) {
      if (profile.pan_holder_name) setPanHolderName(profile.pan_holder_name);
      if (profile.business_address) setBusinessAddress(profile.business_address);
      if (profile.category) setCategory(profile.category);
      if (profile.website_url) setWebsiteUrl(profile.website_url);
      if (profile.description) setDescription(profile.description);
      if (profile.logo_url) setLogoUrl(profile.logo_url);
      if (profile.banner_url) setBannerUrl(profile.banner_url);
      if (profile.instagram_url) setInstagramUrl(profile.instagram_url);
      if (profile.youtube_url) setYoutubeUrl(profile.youtube_url);
      
      // If PAN is successfully verified, populate masked PAN
      if (profile.pan_verification_status === "SUCCESS") {
        setPanNumber("*********");
      }
    }
  }, [profile]);

  const handleVerifyPanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanError("");

    if (!panNumber || panNumber.trim().length !== 10) {
      setPanError("PAN Card number must be exactly 10 characters.");
      return;
    }
    if (!panHolderName.trim()) {
      setPanError("Please enter the name printed on the PAN card.");
      return;
    }
    if (!businessAddress.trim()) {
      setPanError("Please enter your business registered address.");
      return;
    }

    if (!consentGiven) {
      setShowConsentModal(true);
      return;
    }

    await triggerPanVerification();
  };

  const triggerPanVerification = async () => {
    setVerifyingPan(true);
    setPanError("");
    try {
      const res = await verifyBrandPan({
        pan_number: panNumber.toUpperCase(),
        pan_holder_name: panHolderName,
        business_address: businessAddress,
        consent_given: true
      });
      toast({
        title: "Verification Initiated",
        description: res.msg || "PAN checking is running asynchronously.",
      });
      setShowConsentModal(false);
      setEditPanMode(false);
      await onProfileUpdated();
    } catch (err: any) {
      setPanError(err.message || "An error occurred during PAN submission.");
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleProfileSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setSubmittingProfile(true);

    try {
      const res = await submitBrandProfile({
        logo_url: logoUrl || undefined,
        banner_url: bannerUrl || undefined,
        description: description || undefined,
        instagram_url: instagramUrl || undefined,
        youtube_url: youtubeUrl || undefined,
        website_url: websiteUrl || undefined,
        category: category
      });
      toast({
        title: "Setup Complete",
        description: res.msg || "Onboarding profile details submitted for compliance review.",
      });
      await onProfileUpdated();
    } catch (err: any) {
      setProfileError(err.message || "Failed to submit brand profile setup.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const panIsVerified = profile?.pan_verification_status === "SUCCESS";
  const onboardingStatus = profile?.onboarding_status;

  // Determine current step index for visual stepper
  const getStepIndex = () => {
    if (!profile) return 2;
    if (editPanMode) return 2;

    const status = profile.onboarding_status;
    if (status === "not_started" || status === "pan_failed") return 2;
    if (status === "verifying_pan") return 2;
    if (status === "pan_verified") return 3;
    if (status === "pending_verification") return 4;
    if (status === "rejected") return 4;
    if (status === "verified") return 5;
    return 2;
  };

  const currentStep = getStepIndex();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Stepper Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Onboarding Compliance Wizard</h2>
        <p className="mt-2 text-gray-600">Complete verification to launch your marketing campaigns on Mipoe.</p>
      </div>

      {/* Stepper Progress Steps */}
      <div className="relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
        
        <div className="flex justify-between items-center">
          {/* Step 1: Account */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-green-100 text-green-700 border-2 border-green-600 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="mt-2 text-xs font-semibold text-green-700">Account Created</span>
          </div>

          {/* Step 2: Verification */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              currentStep === 2
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100 border-2 border-indigo-700 scale-110"
                : currentStep > 2
                ? "bg-green-100 text-green-700 border-2 border-green-600"
                : "bg-white text-gray-400 border-2 border-gray-200"
            }`}>
              {currentStep > 2 ? <CheckCircle2 className="w-6 h-6" /> : "2"}
            </div>
            <span className={`mt-2 text-xs font-semibold ${
              currentStep === 2 ? "text-indigo-600" : currentStep > 2 ? "text-green-700" : "text-gray-400"
            }`}>Verification</span>
          </div>

          {/* Step 3: Profile */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              currentStep === 3
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100 border-2 border-indigo-700 scale-110"
                : currentStep > 3
                ? "bg-green-100 text-green-700 border-2 border-green-600"
                : "bg-white text-gray-400 border-2 border-gray-200"
            }`}>
              {currentStep > 3 ? <CheckCircle2 className="w-6 h-6" /> : "3"}
            </div>
            <span className={`mt-2 text-xs font-semibold ${
              currentStep === 3 ? "text-indigo-600" : currentStep > 3 ? "text-green-700" : "text-gray-400"
            }`}>Profile Setup</span>
          </div>

          {/* Step 4: Compliance */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              currentStep === 4
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100 border-2 border-indigo-700 scale-110"
                : "bg-white text-gray-400 border-2 border-gray-200"
            }`}>
              "4"
            </div>
            <span className={`mt-2 text-xs font-semibold ${
              currentStep === 4 ? "text-indigo-600" : "text-gray-400"
            }`}>Compliance Review</span>
          </div>
        </div>
      </div>

      {/* Main Containers Wrapper */}
      <div className="space-y-8">
        
        {/* CARD 1: Business Verification (PAN Check) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative overflow-hidden">
          
          {/* SUCCESS OVERLAY (Active when PAN verified and not in edit override mode) */}
          {panIsVerified && !editPanMode && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex flex-col items-center justify-center rounded-2xl z-20 animate-in fade-in duration-300">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm border border-green-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-lg font-bold text-green-700">Verification Success</span>
              <p className="text-xs text-gray-500 mt-1 max-w-[240px] text-center">Your business credentials have been successfully validated.</p>
              
              {/* Edit button in bottom right */}
              <button
                onClick={() => setEditPanMode(true)}
                className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-7 h-7 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-800">Business Verification Details</h3>
          </div>

          {onboardingStatus === "verifying_pan" ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Cashfree PAN Verification in Progress</h4>
              <p className="text-gray-500 mt-2 text-sm max-w-md">
                We are querying the Cashfree payment gateway verification servers to check your PAN details. This takes less than 30 seconds.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyPanSubmit} className="space-y-6">
              {onboardingStatus === "pan_failed" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-sm">
                  <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold">Verification Failed</p>
                    <p className="text-red-600 mt-1">{profile?.rejection_reason || "Invalid PAN card or mismatch detected."}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Card Number</label>
                  <Input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="font-mono tracking-wider text-lg"
                    disabled={panIsVerified && !editPanMode}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name (as on PAN)</label>
                  <Input
                    type="text"
                    placeholder="Holder Full Name"
                    value={panHolderName}
                    onChange={(e) => setPanHolderName(e.target.value)}
                    disabled={panIsVerified && !editPanMode}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Registered Business Address</label>
                <Textarea
                  placeholder="Enter the official business address used for registration..."
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  rows={3}
                  disabled={panIsVerified && !editPanMode}
                  required
                />
              </div>

              {/* Consent checkbox */}
              {!panIsVerified && (
                <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                    I agree to the verification of my business identity credentials. I consent to the secure encrypted storage of this PII data for compliance purposes.
                  </label>
                </div>
              )}

              {panError && <p className="text-red-500 text-sm font-medium">{panError}</p>}

              {!panIsVerified && (
                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
                    disabled={verifyingPan}
                  >
                    {verifyingPan ? "Verifying..." : "Verify Business"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* CARD 2: Brand Profile Setup (Unlocked only when PAN is successfully verified) */}
        {panIsVerified && !editPanMode && (onboardingStatus === "pan_verified" || onboardingStatus === "pending_verification" || onboardingStatus === "rejected") && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-7 h-7 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-800">Setup Brand Profile Customizations</h3>
            </div>

            <form onSubmit={handleProfileSetupSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Business Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-indigo-500"
                    disabled={onboardingStatus === "pending_verification"}
                  >
                    <option value="Gaming">Gaming</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Beauty & Skin care">Beauty & Skin care</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Software Platforms">Software Platforms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Official Website URL</label>
                  <Input
                    type="url"
                    placeholder="https://yourbrand.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={onboardingStatus === "pending_verification"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Description</label>
                <Textarea
                  placeholder="Describe your brand products, campaign styles, and audience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={onboardingStatus === "pending_verification"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    disabled={onboardingStatus === "pending_verification"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image URL (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/banner.png"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    disabled={onboardingStatus === "pending_verification"}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-gray-800 mb-4">Social Media Channels (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-600 flex-shrink-0" />
                    <Input
                      type="url"
                      placeholder="Instagram Account URL"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      disabled={onboardingStatus === "pending_verification"}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <Input
                      type="url"
                      placeholder="YouTube Channel URL"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={onboardingStatus === "pending_verification"}
                    />
                  </div>
                </div>
              </div>

              {profileError && <p className="text-red-500 text-sm font-medium">{profileError}</p>}

              {onboardingStatus !== "pending_verification" && (
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
                    disabled={submittingProfile}
                  >
                    {submittingProfile ? "Submitting..." : "Submit Profile Details"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* CARD 3: Compliance review waiting screen / Rejection feedback */}
        {(onboardingStatus === "pending_verification" || onboardingStatus === "rejected") && !editPanMode && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-in slide-in-from-bottom duration-300">
            {onboardingStatus === "rejected" ? (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Compliance Verification Rejected</h3>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-left max-w-xl mx-auto space-y-2">
                  <p className="font-semibold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Admin Reviewer Feedback:
                  </p>
                  <p className="text-red-700 whitespace-pre-wrap text-sm">
                    {profile?.rejection_reason || "Your profile documents do not match our regulatory verification standards. Please review and re-submit your profile settings."}
                  </p>
                </div>

                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Click the **Edit** button in the Business Verification card above to update credentials, or modify the profile customizations form.
                </p>
              </div>
            ) : (
              <div className="text-center py-10">
                {/* Custom Ticking Clock Animation */}
                <div className="relative w-24 h-24 mx-auto mb-8 bg-indigo-50 border-4 border-indigo-200 rounded-full flex items-center justify-center shadow-inner">
                  <div className="relative w-full h-full">
                    <div className="absolute top-[15%] left-[48%] w-[4%] h-[35%] bg-indigo-700 rounded-full origin-bottom animate-[spin_18s_linear_infinite]" />
                    <div className="absolute top-[25%] left-[49%] w-[2%] h-[25%] bg-indigo-400 rounded-full origin-bottom animate-[spin_2s_linear_infinite]" />
                    <div className="absolute top-[46%] left-[46%] w-[8%] h-[8%] bg-indigo-600 rounded-full shadow" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800">Onboarding Verification Pending</h3>
                
                {/* Compliance Wait Banner */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-4 my-6 max-w-md mx-auto">
                  <p className="font-semibold text-indigo-900 text-sm flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Compliance Review in Progress
                  </p>
                  <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
                    This may take 1-2 hours. Compliance reviewers are currently validating your PAN holder details against business directory information.
                  </p>
                </div>

                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Your campaign launch controls, payouts, and wallet balance are locked until the review resolves. You will be automatically unlocked.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Consent dialogue modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <h4 className="text-lg font-bold text-gray-900">Regulatory Verification Consent</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              To check and prevent financial fraud, Mipoe requires validating your business details through standard identity services. By continuing:
            </p>
            <ul className="text-xs text-gray-500 space-y-2 list-disc pl-5 mb-6">
              <li>Your PAN card data is symmetrically encrypted using system security tokens.</li>
              <li>Verification requests are handled through the Cashfree Sync API.</li>
              <li>Your decrypted raw credentials are never exposed via public APIs.</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowConsentModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setConsentGiven(true);
                  triggerPanVerification();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                I Agree & Consent
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
