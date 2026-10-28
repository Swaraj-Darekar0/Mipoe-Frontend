import React, { useState, useEffect } from "react";
import Stepper, { Step } from "@/components/ui/Stepper";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { 
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
  ChevronRight, 
  Instagram, 
  Youtube, 
  UserCheck, 
  Sparkles,
  ShieldCheck,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BrandOnboardingProps {
  profile: BrandProfile | null;
  onProfileUpdated: (silent?: boolean) => Promise<void>;
}

export const BrandOnboarding: React.FC<BrandOnboardingProps> = ({ profile, onProfileUpdated }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Determine current step index for visual stepper (3 steps total)
  const getStepIndex = () => {
    if (!profile) return 1;
    const status = profile.onboarding_status;
    if (status === "not_started") return 1;
    if (status === "pending_verification" || status === "verified" || status === "rejected") return 3;
    return 2;
  };

  const [activeStep, setActiveStep] = useState(getStepIndex());

  // Step 1 (Brand & Business Details) States
  const [brandUsername, setBrandUsername] = useState(profile?.username || "");
  const [brandEmail, setBrandEmail] = useState(profile?.email || "");
  const [businessAddress, setBusinessAddress] = useState(profile?.business_address || "");
  const [savingStep1, setSavingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState("");

  // Step 2 (Profile Setup & Socials) States
  const [category, setCategory] = useState(profile?.category || "Personal Agency");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || "");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [logoFileToUpload, setLogoFileToUpload] = useState<File | null>(null);
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url || "");
  
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
      if (profile.username) setBrandUsername(profile.username);
      if (profile.email) setBrandEmail(profile.email);
      if (profile.business_address) setBusinessAddress(profile.business_address);
      if (profile.category) setCategory(profile.category);
      if (profile.website_url) setWebsiteUrl(profile.website_url);
      if (profile.description) setDescription(profile.description);
      if (profile.logo_url) setLogoUrl(profile.logo_url);
      if (profile.instagram_url) setInstagramUrl(profile.instagram_url);
      if (profile.youtube_url) setYoutubeUrl(profile.youtube_url);
      
      const calculatedStep = getStepIndex();
      setActiveStep((prev) => Math.max(prev, calculatedStep));
    }
  }, [profile]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error("");
    setSavingStep1(true);
    try {
      const trimmedUser = brandUsername.trim();
      const trimmedEmail = brandEmail.trim();
      if (!trimmedUser) {
        setStep1Error("Brand name cannot be empty.");
        setSavingStep1(false);
        return;
      }
      if (!trimmedEmail) {
        setStep1Error("Business email cannot be empty.");
        setSavingStep1(false);
        return;
      }

      const { updateBrandProfile } = await import("@/lib/api");
      await updateBrandProfile({
        username: trimmedUser,
        email: trimmedEmail,
        business_address: businessAddress.trim(),
      });
      setActiveStep(2);
      await onProfileUpdated(true);
    } catch (err: any) {
      setStep1Error(err.message || "Failed to update brand profile credentials.");
    } finally {
      setSavingStep1(false);
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
          if (res && res.url) {
            finalLogoUrl = res.url;
            setLogoUrl(res.url);
          }
        } catch (uploadErr: any) {
          console.error("Logo upload failed:", uploadErr);
          setProfileError(uploadErr.message || "Failed to upload logo image.");
          setSubmittingProfile(false);
          setUploadingLogo(false);
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      const res = await submitBrandProfile({
        logo_url: finalLogoUrl,
        banner_url: null,
        description: description,
        category: category as any,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        website_url: websiteUrl,
      });

      toast({
        title: "Brand Profile Ready!",
        description: res.msg || "Your brand profile is verified and active.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-950",
      });

      await onProfileUpdated();
      setActiveStep(3);
    } catch (err: any) {
      setProfileError(err.message || "An error occurred while submitting your profile.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleConfirmOAuthModal = () => {
    if (!mockInputName.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a username or channel name.",
        variant: "destructive",
      });
      return;
    }

    if (oauthProvider === "instagram") {
      const sanitized = mockInputName.replace("@", "").trim();
      setInstagramUrl(`https://instagram.com/${sanitized}`);
      toast({
        title: "Instagram Linked",
        description: `Connected @${sanitized} to your brand profile.`,
        className: "bg-pink-50 border-pink-200 text-pink-900",
      });
    } else if (oauthProvider === "youtube") {
      const sanitized = mockInputName.trim().replace(/\s+/g, "_");
      setYoutubeUrl(`https://youtube.com/@${sanitized}`);
      toast({
        title: "YouTube Linked",
        description: `Connected ${mockInputName} to your brand profile.`,
        className: "bg-red-50 border-red-200 text-red-900",
      });
    }

    setOauthModalOpen(false);
    setMockInputName("");
    setOauthProvider(null);
  };

  const onboardingStatus = profile?.onboarding_status;

  return (
    <>
      <Stepper
        layout="split"
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        stepLabels={["Brand Details", "Profile & Socials", "Review & Launch"]}
        onboardingTitle="Brand Onboarding"
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              Zero-Fee UPI & Base L2 Deposits
            </p>
            <p className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              Instant Creator Campaign Distribution
            </p>
          </div>
        }
        className="shadow-2xl"
      >
        {/* Step 1: Brand Credentials & Registered Business Details */}
        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Brand Identity & Credentials</h3>
                <p className="text-xs text-gray-500">Configure your official brand name and primary business address.</p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Brand Name / Trade Name <span className="text-red-500">*</span>
                    </label>
                    {profile?.username && brandUsername !== profile.username && (
                      <button
                        type="button"
                        onClick={() => setBrandUsername(profile.username)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                      >
                        Use default ({profile.username})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      value={brandUsername}
                      placeholder={profile?.username || "Enter brand name"}
                      onChange={(e) => setBrandUsername(e.target.value)}
                      className="text-sm font-medium bg-white"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your brand name displayed to creators across campaign briefs and agreements.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Business Contact Email <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <Input
                    type="email"
                    value={brandEmail}
                    placeholder={profile?.email || "business@brand.com"}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    className="text-sm font-medium bg-white"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct email for invoice receipts, campaign notifications, and tax certificates.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Business Address
                  </label>
                  <Textarea
                    placeholder="Enter city, state, and address for invoicing..."
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    rows={2}
                    className="text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used on your deposit invoices. (You can also link a GSTIN later from the sidebar).
                  </p>
                </div>
              </div>

              {step1Error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                  {step1Error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingStep1}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm"
                >
                  {savingStep1 ? "Saving..." : "Save & Proceed to Profile Setup"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </Step>

        {/* Step 2: Brand Profile Setup */}
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
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setCategory(opt.id)}
                        className={`flex flex-col justify-between border-2 rounded-xl p-3.5 transition-all duration-200 text-left h-full cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-600/10"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white"
                        }`}
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
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://yourbrand.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <Globe className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brand Description</label>
                <Textarea
                  placeholder="Describe your brand products, campaign styles, and audience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
                  disabled={uploadingLogo}
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

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(1)}
                  className="text-xs"
                >
                  Back to Details
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm"
                  disabled={submittingProfile}
                >
                  {submittingProfile ? "Completing Setup..." : "Complete & Launch Brand"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </Step>

        {/* Step 3: Complete & Ready */}
        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">Brand Setup Complete!</h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Your brand identity has been verified. You can now deposit budget via UPI or Base L2, create UGC/clipping campaigns, and partner with top creators.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  type="button"
                  onClick={() => navigate("/brand/dashboard")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md inline-flex items-center gap-2 text-sm"
                >
                  Go to Brand Dashboard
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/brand/create?type=influencer")}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-lg text-sm"
                >
                  Launch UGC Campaign
                </Button>
              </div>
            </div>
          </div>
        </Step>
      </Stepper>

      {/* Simulated OAuth Modal */}
      {oauthModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              {oauthProvider === "instagram" ? (
                <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
                  <Instagram className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                  <Youtube className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  Connect {oauthProvider === "instagram" ? "Instagram" : "YouTube"}
                </h4>
                <p className="text-[11px] text-gray-500">Enter your official social handle or channel name.</p>
              </div>
            </div>

            <Input
              type="text"
              placeholder={oauthProvider === "instagram" ? "@yourbrand" : "Your Channel Name"}
              value={mockInputName}
              onChange={(e) => setMockInputName(e.target.value)}
              className="text-xs"
              autoFocus
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOauthModalOpen(false);
                  setMockInputName("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmOAuthModal}
                className={oauthProvider === "instagram" ? "bg-pink-600 hover:bg-pink-700 text-white text-xs" : "bg-red-600 hover:bg-red-700 text-white text-xs"}
              >
                Connect Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
