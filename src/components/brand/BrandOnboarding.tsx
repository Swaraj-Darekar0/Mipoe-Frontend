import React, { useState, useEffect } from "react";
import Stepper, { Step } from "@/components/ui/Stepper";
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
  ChevronRight, 
  Clock, 
  AlertTriangle,
  ShieldAlert,
  Edit,
  Instagram,
  Youtube,
  ChevronLeft,
  UserCheck,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BrandOnboardingProps {
  profile: BrandProfile | null;
  onProfileUpdated: (silent?: boolean) => Promise<void>;
}

export const BrandOnboarding: React.FC<BrandOnboardingProps> = ({ profile, onProfileUpdated }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Determine current step index for visual stepper
  const getStepIndex = () => {
    if (!profile) return 2;
    const status = profile.onboarding_status;
    if (status === "not_started" || status === "pan_failed" || status === "verifying_pan") return 2;
    if (status === "pan_verified") return 3;
    if (status === "pending_verification" || status === "rejected") return 4;
    if (status === "verified") return 4;
    return 2;
  };

  const [activeStep, setActiveStep] = useState(getStepIndex());

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
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  // Logo file upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Simulated OAuth States
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"instagram" | "youtube" | null>(null);
  const [mockInputName, setMockInputName] = useState("");

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

      const calculatedStep = getStepIndex();
      setActiveStep(calculatedStep);
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
      setActiveStep(3);
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
      setActiveStep(4);
    } catch (err: any) {
      setProfileError(err.message || "Failed to submit brand profile setup.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const panIsVerified = profile?.pan_verification_status === "SUCCESS";
  const onboardingStatus = profile?.onboarding_status;

  return (
    <>
      <Stepper
        layout="split"
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        stepLabels={["Account Created", "Business Verification", "Profile Setup", "Compliance Review"]}
        onboardingTitle="Brand Compliance"
        hideFooter={true}
        disableStepIndicators={false}
        sidebarHeader={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="font-bold text-sm text-slate-800">{profile?.username || "Brand Account"}</p>
            </div>
          </div>
        }
        sidebarFooter={
          <div className="space-y-2 text-xs text-slate-500">
            <p className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              PAN data is encrypted end-to-end
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              Review takes 1-2 hours
            </p>
          </div>
        }
        className="shadow-2xl"
      >
        {/* Step 1: Account Created */}
        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Brand Account Registered</h3>
                <p className="text-xs text-gray-500">Your account identity has been established on Mipoe.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-sm">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand Name / Username</span>
                <span className="font-bold text-slate-800">{profile?.username || "Authenticated User"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Email</span>
                <span className="font-bold text-slate-800">{profile?.email || "—"}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Authentication Completed</p>
                <p className="text-emerald-700">Account status active. Click next to begin business verification.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setActiveStep(2)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm"
              >
                Proceed to Business Verification
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Step>

        {/* Step 2: Business Verification (PAN Check) */}
        <Step>
          <div className="space-y-6 text-left py-2 relative">
            
            {/* SUCCESS OVERLAY (Active when PAN verified and not in edit override mode) */}
            {panIsVerified && !editPanMode && (
              <div className="bg-emerald-50/90 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <div className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-lg font-bold text-emerald-800">Business Verification Success</span>
                <p className="text-xs text-emerald-600 mt-1 max-w-sm">
                  Your business credentials ({panHolderName || "PAN Card"}) have been validated.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditPanMode(true)}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit PAN Info
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow"
                  >
                    Continue to Profile Setup
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {(!panIsVerified || editPanMode) && (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Business Verification Details</h3>
                    <p className="text-xs text-gray-500">Provide official PAN credentials to verify your entity.</p>
                  </div>
                </div>

                {onboardingStatus === "verifying_pan" ? (
                  <div className="text-center py-10 flex flex-col items-center">
                    <div className="relative w-14 h-14 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    </div>
                    <h4 className="text-base font-bold text-gray-800">Cashfree PAN Verification in Progress</h4>
                    <p className="text-gray-500 mt-1 text-xs max-w-md">
                      We are querying payment gateway verification servers to check your PAN details. This takes less than 30 seconds.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyPanSubmit} className="space-y-5">
                    {onboardingStatus === "pan_failed" && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-xs">
                        <XCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Verification Failed</p>
                          <p className="text-red-600 mt-1">{profile?.rejection_reason || "Invalid PAN card or mismatch detected."}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">PAN Card Number</label>
                        <Input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. ABCDE1234F"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                          className="font-mono tracking-wider text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name (as on PAN)</label>
                        <Input
                          type="text"
                          placeholder="Holder Full Name"
                          value={panHolderName}
                          onChange={(e) => setPanHolderName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered Business Address</label>
                      <Textarea
                        placeholder="Enter official registered business address..."
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="border border-gray-100 bg-gray-50 rounded-xl p-3.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                        I agree to the verification of my business identity credentials. I consent to secure encrypted storage of this PII data for compliance purposes.
                      </label>
                    </div>

                    {panError && <p className="text-red-500 text-xs font-medium">{panError}</p>}

                    <div className="flex justify-end items-center pt-2">
                      <Button 
                        type="submit" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm"
                        disabled={verifyingPan}
                      >
                        {verifyingPan ? "Verifying..." : "Verify Business"}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </Step>

        {/* Step 3: Brand Profile Setup */}
        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Setup Brand Profile Customizations</h3>
                <p className="text-xs text-gray-500">Configure business category, branding logo, and social media channels.</p>
              </div>
            </div>

            {!panIsVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-xs mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p>Please complete <strong>Step 2 (Business Verification)</strong> first before submitting profile customization details.</p>
              </div>
            )}

            <form onSubmit={handleProfileSetupSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2.5">Business Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                          if (!isDisabled) setCategory(opt.id);
                        }}
                        className={`flex flex-col justify-between border-2 rounded-xl p-3.5 transition-all duration-200 text-left h-full ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-600/10"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white"
                        } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-gray-900">{opt.title}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                        <div className="mt-auto pt-2 border-t border-dashed border-gray-100">
                          <div className="flex flex-wrap gap-1">
                            {opt.benefits.map((b) => (
                              <span 
                                key={b} 
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Official Website URL</label>
                <Input
                  type="url"
                  placeholder="https://yourbrand.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={onboardingStatus === "pending_verification"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brand Description</label>
                <Textarea
                  placeholder="Describe your brand products, campaign styles, and audience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={onboardingStatus === "pending_verification"}
                />
              </div>

              <div>
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

              <div className="border-t border-gray-100 pt-4">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-gray-800">Social Media Channels (Mandatory)</h4>
                  <p className="text-[11px] text-gray-500">
                    Connect either your Instagram Professional Account, your YouTube Channel, or both.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Instagram Connection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-100 p-2 rounded-lg text-pink-600 flex-shrink-0">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Instagram Professional Account</p>
                        {instagramUrl ? (
                          <p className="text-[11px] text-emerald-600 font-medium">Connected as {getInstagramHandle(instagramUrl)}</p>
                        ) : (
                          <p className="text-[11px] text-gray-500">Not connected</p>
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
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8"
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
                          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs h-8 shadow-sm"
                        >
                          Connect Account
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* YouTube Connection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg text-red-600 flex-shrink-0">
                        <Youtube className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">YouTube Channel</p>
                        {youtubeUrl ? (
                          <p className="text-[11px] text-emerald-600 font-medium">Connected as {getYoutubeChannel(youtubeUrl)}</p>
                        ) : (
                          <p className="text-[11px] text-gray-500">Not connected</p>
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
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8"
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
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 shadow-sm"
                        >
                          Connect Channel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {profileError && <p className="text-red-500 text-xs font-medium">{profileError}</p>}

              <div className="flex justify-end items-center pt-2">
                {onboardingStatus !== "pending_verification" && (
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm"
                    disabled={submittingProfile}
                  >
                    {submittingProfile ? "Submitting..." : "Submit Profile Details"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Step>

        {/* Step 4: Compliance Review */}
        <Step>
          <div className="space-y-6 text-left py-2">
            {onboardingStatus === "verified" ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900">Brand Onboarding Complete!</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your business entity credentials and brand profile details have been verified by compliance reviewers.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => navigate("/brand/dashboard")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md inline-flex items-center gap-2 text-sm"
                  >
                    Go to Brand Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : onboardingStatus === "rejected" ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Compliance Verification Rejected</h3>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left max-w-xl mx-auto space-y-2">
                  <p className="font-semibold text-red-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Admin Reviewer Feedback:
                  </p>
                  <p className="text-red-700 whitespace-pre-wrap text-xs">
                    {profile?.rejection_reason || "Your profile documents do not match our regulatory verification standards. Please review and re-submit your profile settings."}
                  </p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="text-xs"
                  >
                    Edit Business Credentials
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    Modify Profile Setup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                {/* Custom Ticking Clock Animation */}
                <div className="relative w-20 h-20 mx-auto mb-6 bg-indigo-50 border-4 border-indigo-200 rounded-full flex items-center justify-center shadow-inner">
                  <div className="relative w-full h-full">
                    <div className="absolute top-[15%] left-[48%] w-[4%] h-[35%] bg-indigo-700 rounded-full origin-bottom animate-[spin_18s_linear_infinite]" />
                    <div className="absolute top-[25%] left-[49%] w-[2%] h-[25%] bg-indigo-400 rounded-full origin-bottom animate-[spin_2s_linear_infinite]" />
                    <div className="absolute top-[46%] left-[46%] w-[8%] h-[8%] bg-indigo-600 rounded-full shadow" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800">Onboarding Verification Pending</h3>
                
                {/* Compliance Wait Banner */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 my-5 max-w-md mx-auto">
                  <p className="font-semibold text-indigo-900 text-xs flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Compliance Review in Progress
                  </p>
                  <p className="text-indigo-700 text-[11px] mt-1 leading-relaxed">
                    This may take 1-2 hours. Compliance reviewers are currently validating your PAN holder details against business directory information.
                  </p>
                </div>

                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Your campaign launch controls, payouts, and wallet balance are locked until the review resolves. You will be automatically unlocked.
                </p>

                <div className="flex justify-start pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(3)}
                    className="text-gray-600 flex items-center gap-1 text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Profile Setup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Step>
      </Stepper>

      {/* Consent dialogue modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <h4 className="text-lg font-bold text-gray-900">Regulatory Verification Consent</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
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
            
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full"
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
    </>
  );
};
