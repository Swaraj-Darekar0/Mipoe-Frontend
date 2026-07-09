import React, { useState, useEffect } from "react";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
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
  const [category, setCategory] = useState("Personal Agency");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [logoFileToUpload, setLogoFileToUpload] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  // Logo file upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoValidationError, setLogoValidationError] = useState("");
  const [showLogoErrorModal, setShowLogoErrorModal] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Simulated OAuth States
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"instagram" | "youtube" | null>(null);
  const [mockInputName, setMockInputName] = useState("");

  // Interactive Cropper States
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [croppingFileName, setCroppingFileName] = useState("");

  const getInstagramHandle = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    return "@" + parts[parts.length - 1];
  };

  const getYoutubeChannel = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    const name = parts[parts.length - 1];
    return decodeURIComponent(name).replace(/_/g, " ");
  };

  // Initialize values from profile
  useEffect(() => {
    if (profile) {
      if (profile.pan_holder_name) setPanHolderName(profile.pan_holder_name);
      if (profile.business_address) setBusinessAddress(profile.business_address);
      if (profile.category) setCategory(profile.category);
      if (profile.website_url) setWebsiteUrl(profile.website_url);
      if (profile.description) setDescription(profile.description);
      if (profile.logo_url) setLogoUrl(profile.logo_url);
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
        PII_verify_consent_given: true
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

    if (!logoUrl && !logoFileToUpload) {
      setProfileError("Please select a brand logo first.");
      setSubmittingProfile(false);
      return;
    }
    if (!instagramUrl && !youtubeUrl) {
      setProfileError("Please connect at least one social media channel (Instagram or YouTube).");
      setSubmittingProfile(false);
      return;
    }
    if (category === "SaaS Based" && (!websiteUrl || !websiteUrl.trim())) {
      setProfileError("Website URL is required for SaaS Based brands.");
      setSubmittingProfile(false);
      return;
    }

    try {
      let finalLogoUrl = logoUrl;

      // If a new file is staged, upload it now
      if (logoFileToUpload) {
        setUploadingLogo(true);
        try {
          const { uploadBrandLogo } = await import("@/lib/api");
          const res = await uploadBrandLogo(logoFileToUpload);
          finalLogoUrl = res.logo_url;
          setLogoUrl(res.logo_url);
        } catch (err: any) {
          throw new Error(err.message || "Failed to upload logo to storage.");
        } finally {
          setUploadingLogo(false);
        }
      }

      const res = await submitBrandProfile({
        logo_url: finalLogoUrl || undefined,
        description: description || undefined,
        instagram_url: instagramUrl || undefined,
        youtube_url: youtubeUrl || undefined,
        website_url: websiteUrl || undefined,
        category: category as any
      });

      toast({
        title: "Setup Complete",
        description: res.msg || "Onboarding profile details submitted for compliance review.",
      });

      // Clear staged states and preview URLs
      setLogoFileToUpload(null);
      setLogoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
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
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Business Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        id: "Personal Agency",
                        title: "Personal Agency",
                        benefits: ["Clipping", "Influencer UGC"],
                        description: "Best for agencies managing creator networks or talent.",
                        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
                      },
                      {
                        id: "Product Based",
                        title: "Product Based",
                        benefits: ["Clipping", "Influencer UGC", "Affiliate"],
                        description: "Best for e-commerce and physical product brands.",
                        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
                      },
                      {
                        id: "SaaS Based",
                        title: "SaaS Based",
                        benefits: ["Clipping", "Influencer UGC", "Affiliate"],
                        description: "Best for software platforms and subscription tools.",
                        badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    ].map((opt) => {
                      const isSelected = category === opt.id;
                      const isDisabled = onboardingStatus === "pending_verification";
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (!isDisabled) {
                              setCategory(opt.id);
                            }
                          }}
                          className={`flex flex-col justify-between border-2 rounded-xl p-4 transition-all duration-200 text-left h-full ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-600/10"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white"
                          } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm text-gray-900">{opt.title}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                              {opt.description}
                            </p>
                          </div>
                          <div className="mt-auto pt-2 border-t border-dashed border-gray-100">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                              Campaign Benefits
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {opt.benefits.map((b) => (
                                <span 
                                  key={b} 
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                    isSelected 
                                      ? opt.badgeColor
                                      : "bg-gray-50 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

              <div className="space-y-2">
                <ImageCropInput
                  value={logoPreviewUrl || logoUrl}
                  onChange={(file, previewUrl) => {
                    setLogoPreviewUrl(previewUrl);
                    setLogoFileToUpload(file);
                    if (file || previewUrl) {
                      setProfileError("");
                    } else {
                      setLogoUrl("");
                    }
                  }}
                  aspectRatio="1:1"
                  disabled={uploadingLogo || onboardingStatus === "pending_verification"}
                  label="Brand Logo (Mandatory)"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800">Social Media Channels (Mandatory)</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect either your Instagram Professional Account, your YouTube Channel, or both.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {/* Instagram Connection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-100 p-2.5 rounded-lg text-pink-600 flex-shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Instagram Professional Account</p>
                        {instagramUrl ? (
                          <p className="text-xs text-green-600 font-medium">Connected as {getInstagramHandle(instagramUrl)}</p>
                        ) : (
                          <p className="text-xs text-gray-500">Not connected</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {instagramUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setInstagramUrl("")}
                          disabled={onboardingStatus === "pending_verification"}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setOauthProvider("instagram");
                            setMockInputName("brand_instagram");
                            setOauthModalOpen(true);
                          }}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-sm w-full sm:w-auto"
                        >
                          Connect Account
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* YouTube Connection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2.5 rounded-lg text-red-600 flex-shrink-0">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">YouTube Channel</p>
                        {youtubeUrl ? (
                          <p className="text-xs text-green-600 font-medium">Connected as {getYoutubeChannel(youtubeUrl)}</p>
                        ) : (
                          <p className="text-xs text-gray-500">Not connected</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {youtubeUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setYoutubeUrl("")}
                          disabled={onboardingStatus === "pending_verification"}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setOauthProvider("youtube");
                            setMockInputName("Brand Official Channel");
                            setOauthModalOpen(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm w-full sm:w-auto"
                        >
                          Connect Channel
                        </Button>
                      )}
                    </div>
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

      {/* Simulated OAuth modal */}
      {oauthModalOpen && oauthProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-indigo-600 mb-4">
              {oauthProvider === "instagram" ? (
                <Instagram className="w-7 h-7 text-pink-600" />
              ) : (
                <Youtube className="w-7 h-7 text-red-600" />
              )}
              <h4 className="text-lg font-bold text-gray-900">
                {oauthProvider === "instagram" ? "Connect Instagram (Sandbox)" : "Connect YouTube (Sandbox)"}
              </h4>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              You are currently in sandbox mode. Choose how you want to simulate this OAuth flow:
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {oauthProvider === "instagram" ? "Mock Instagram Handle" : "Mock Channel Name"}
                </label>
                <Input
                  type="text"
                  value={mockInputName}
                  onChange={(e) => setMockInputName(e.target.value)}
                  placeholder={oauthProvider === "instagram" ? "brand_username" : "Brand Channel Title"}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (oauthProvider === "instagram") {
                    setInstagramUrl(`https://instagram.com/${mockInputName.trim()}`);
                    toast({
                      title: "Instagram Linked",
                      description: `Successfully linked @${mockInputName.trim()}`,
                    });
                  } else {
                    const slug = mockInputName.trim().toLowerCase().replace(/\s+/g, "_");
                    setYoutubeUrl(`https://youtube.com/c/${encodeURIComponent(slug)}`);
                    toast({
                      title: "YouTube Linked",
                      description: `Successfully linked ${mockInputName.trim()}`,
                    });
                  }
                  setOauthModalOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold w-full"
              >
                Simulate OAuth Success
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  toast({
                    title: "OAuth Cancelled",
                    description: "Simulation resulted in a user cancellation or invalid credentials.",
                    variant: "destructive",
                  });
                  setOauthModalOpen(false);
                }}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
              >
                Simulate OAuth Failure
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setOauthModalOpen(false)}
                className="w-full text-gray-500 mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
