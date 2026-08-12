import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Stepper, { Step } from "@/components/ui/Stepper";
import {
  fetchCreatorProfile,
  updateCreatorProfile,
  getInstagramAuthUrl,
  simulateMockMetaCallback,
  type CreatorProfile as ApiCreatorProfile
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Phone,
  User,
  FileText,
  Loader2,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  CheckCircle2
} from "lucide-react";

const CompleteProfile = () => {
  const [profile, setProfile] = useState<ApiCreatorProfile>({
    username: "",
    email: "",
    nickname: "",
    bio: "",
    phone: "",
    profile_completed: false,
    instagram_username: "",
    instagram_verified: false,
  });

  // Payout Credentials States
  const [upiId, setUpiId] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sandbox Modal states
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [mockUsername, setMockUsername] = useState("creatorxyz");

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      const data = await fetchCreatorProfile();
      if (data.profile_completed) {
        navigate("/creator/dashboard");
      } else {
        setProfile(data);
        if (data.instagram_verified) {
          setActiveStep(3);
        }
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();

    // Check URL parameters for OAuth callbacks
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const errParam = params.get("error");
    const mockParam = params.get("mock_oauth");

    if (success === "true") {
      const username = params.get("username") || "your account";
      toast({
        title: "Instagram Linked!",
        description: `Successfully verified and connected @${username}.`
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      loadProfile();
      setActiveStep(3);
    } else if (errParam) {
      setError(`Rejection: ${errParam}. Please verify your Instagram account configuration.`);
      toast({
        variant: "destructive",
        title: "Instagram Connection Failed",
        description: errParam
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mockParam === "true") {
      setIsSandboxOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConnectInstagram = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      // Pre-save inputs to backend before redirecting
      await updateCreatorProfile({
        nickname: profile.nickname,
        bio: profile.bio,
        phone: profile.phone,
      });

      const { url } = await getInstagramAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setAuthLoading(false);
      setError(err.message || "Failed to initiate Instagram connection.");
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: err.message || "Failed to link Instagram"
      });
    }
  };

  const handleSimulateSandbox = async (status: "success" | "failure") => {
    setSandboxLoading(true);
    try {
      if (status === "success") {
        await simulateMockMetaCallback({
          status: "success",
          username: mockUsername
        });
        toast({
          title: "Sandbox Success",
          description: `Simulated linking Instagram account @${mockUsername}.`
        });
        setIsSandboxOpen(false);
        await loadProfile();
        setActiveStep(3);
      } else {
        try {
          await simulateMockMetaCallback({
            status: "failure",
            error_msg: "Rejection: Instagram account type is Personal. Please convert to a Creator or Business account."
          });
        } catch (backendErr: any) {
          setError(backendErr.message || "Instagram account type is Personal.");
        }
        toast({
          variant: "destructive",
          title: "Sandbox Rejected",
          description: "Simulated personal account rejection successfully."
        });
        setIsSandboxOpen(false);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Simulation Error",
        description: err.message || "Failed to run simulation callback"
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.instagram_verified) {
      setError("Please connect and verify your Instagram professional account first.");
      setActiveStep(2);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateCreatorProfile({
        nickname: profile.nickname,
        bio: profile.bio,
        phone: profile.phone,
      });
      toast({
        title: "Onboarding Completed",
        description: "Welcome to Mipoe! Your creator hub is activated."
      });
      navigate("/creator/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
      toast({
        title: "Onboarding Failed",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stepper
        layout="split"
        isDarkTheme={true}
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        stepLabels={["Personal Details", "Social Verification", "Payout Setup", "Launch Hub"]}
        onboardingTitle="Creator Onboarding"
        hideFooter={true}
        disableStepIndicators={false}
        sidebarHeader={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Signed in as</p>
                <p className="font-bold text-sm text-white">{profile.username || "Creator Account"}</p>
              </div>
            </div>
          }
          sidebarFooter={
            <div className="space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                All data encrypted end-to-end
              </p>
              <p className="flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                Professional account required
              </p>
            </div>
          }
        className="shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
      >
          {/* Step 1: Personal Details */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Personal & Channel Information</h3>
                <p className="text-xs text-gray-400">Tell us how you would like to be identified on Mipoe.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nickname" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-400" /> Display Name / Nickname
                </label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={profile.nickname || ""}
                  onChange={handleChange}
                  placeholder="e.g., ViralVidsCreator"
                  className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-indigo-400" /> Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone || ""}
                  onChange={handleChange}
                  placeholder="e.g., +91 98765 43210"
                  className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" /> Channel Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ""}
                  onChange={handleChange}
                  placeholder="Briefly describe your content niche, style, and audience..."
                  className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 resize-none text-xs"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => {
                    if (!profile.nickname || !profile.phone || !profile.bio) {
                      toast({
                        title: "Required Fields Missing",
                        description: "Please fill in your nickname, phone number, and bio.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setActiveStep(2);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs transition-all"
                >
                  Continue to Social Verification
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Step>

          {/* Step 2: Social Media Verification */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Social Channel Connection</h3>
                <p className="text-xs text-gray-400">Connect your Instagram Professional (Creator/Business) account.</p>
              </div>

              {profile.instagram_verified ? (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Instagram Linked</p>
                      <p className="text-xs text-emerald-300/80">@{profile.instagram_username || "verified_account"}</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleConnectInstagram}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-2xl transition duration-200 shadow-lg shadow-pink-600/10 active:scale-[0.98] disabled:opacity-50 text-xs"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving & Redirecting...
                      </>
                    ) : (
                      <>
                        <Instagram className="h-4 w-4" />
                        Connect Instagram Account
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-[11px] bg-yellow-500/10 p-2.5 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Onboarding requires an Instagram Creator/Business account to verify clip views.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end items-center pt-3 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => {
                    if (!profile.instagram_verified) {
                      toast({
                        title: "Instagram Verification Required",
                        description: "Please connect your Instagram account to continue.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setActiveStep(3);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs transition-all"
                >
                  Continue to Payout Setup
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Step>

          {/* Step 3: Payout Setup */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Payout Credentials</h3>
                <p className="text-xs text-gray-400">Configure your UPI ID or Direct Bank Details for campaign commission payouts.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="upiId" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> UPI ID (Fast Payouts)
                </label>
                <Input
                  id="upiId"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. creatorname@okaxis"
                  className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 text-xs"
                />
              </div>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Or Direct Bank Transfer</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400">Account Holder Name</label>
                    <Input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Holder Full Name"
                      className="bg-white/5 border-white/10 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400">Bank Account Number</label>
                    <Input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="12-16 Digit Account No."
                      className="bg-white/5 border-white/10 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400">IFSC Code</label>
                  <Input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="bg-white/5 border-white/10 text-white rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center pt-3 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs transition-all"
                >
                  Continue to Final Review
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Step>

          {/* Step 4: Launch Hub */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Review & Complete Onboarding</h3>
                <p className="text-xs text-gray-400">Review your profile details before launching your Creator Hub.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-gray-400">Nickname:</span>
                  <span className="font-bold text-white">{profile.nickname || "—"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-bold text-white">{profile.phone || "—"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-gray-400">Instagram Handle:</span>
                  <span className="font-bold text-emerald-400">@{profile.instagram_username || "linked"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payout Target:</span>
                  <span className="font-bold text-white">{upiId ? upiId : bankAccountNumber ? `Bank (${bankAccountNumber.slice(-4)})` : "Configured"}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full py-5 rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 font-bold transition duration-200 flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
                  disabled={loading || !profile.instagram_verified}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <>
                      Complete Onboarding & Launch Hub <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

            </div>
          </Step>
      </Stepper>
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181B] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative">
              <div className="absolute top-4 right-4 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-yellow-500/20">
                Sandbox Mode
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg">
                  <Lock className="h-5 w-5" />
                  <span>Simulate Meta OAuth</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We detected that live Meta App config is missing. Use this developer interface to simulate redirects from Meta callback endpoints.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="mockUsername" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Instagram Handle
                  </label>
                  <Input
                    id="mockUsername"
                    type="text"
                    value={mockUsername}
                    onChange={(e) => setMockUsername(e.target.value)}
                    placeholder="creatorxyz"
                    className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-gray-600 focus:border-yellow-500/40 focus:ring-yellow-500/10"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSimulateSandbox("success")}
                    disabled={sandboxLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                  >
                    {sandboxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate Success (Creator Account)"}
                  </Button>
                  <Button
                    onClick={() => handleSimulateSandbox("failure")}
                    disabled={sandboxLoading}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 py-5 rounded-xl font-bold text-xs"
                  >
                    Simulate Failure (Personal Account)
                  </Button>
                  <Button
                    onClick={() => setIsSandboxOpen(false)}
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompleteProfile;