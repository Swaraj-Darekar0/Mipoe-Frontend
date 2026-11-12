import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check
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

  // Base L2 Smart Account Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(localStorage.getItem('wallet_address'));
  const [copiedWallet, setCopiedWallet] = useState(false);

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
        const addr = data.wallet_address || localStorage.getItem('wallet_address');
        if (addr) {
          setWalletAddress(addr);
          localStorage.setItem('wallet_address', addr);
        }
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
        nickname: profile.nickname || profile.username || "Creator",
        bio: profile.bio || "Creator at sellr",
        phone: profile.phone || "9999999999",
      });
      toast({
        title: "Onboarding Completed",
        description: "Welcome to sellr! Your creator hub is activated."
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
        accent="creator"
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        stepLabels={["Personal Details", "Social Verification", "Smart Account Ready"]}
        onboardingTitle="Creator Onboarding"
        sidebarBrandSubtitle="Creator Studio"
        hideFooter={true}
        disableStepIndicators={false}
        sidebarHeader={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lava/10 border border-lava/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-lava" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-steel">Signed in as</p>
              <p className="font-display font-bold text-sm text-ink truncate">{profile.username || "Creator Account"}</p>
            </div>
          </div>
        }
        sidebarFooter={
          <div className="space-y-2 text-xs text-slate">
            <p className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-lava shrink-0" />
              All data encrypted end-to-end
            </p>
            <p className="flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-ink shrink-0" />
              Professional account required
            </p>
          </div>
        }
      >
          {/* Step 1: Personal Details */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-black/10">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-steel block mb-1">
                  Step 01 // Channel Identity
                </span>
                <h3 className="font-display text-lg font-bold text-ink">Personal & Channel Information</h3>
                <p className="text-xs text-slate">Tell us how you would like to be identified on sellr.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nickname" className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-steel flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-lava" /> Display Name / Nickname
                </label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={profile.nickname || ""}
                  onChange={handleChange}
                  placeholder="e.g., ViralVidsCreator"
                  className="bg-black/[0.02] border-black/10 text-ink rounded-xl placeholder:text-steel/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-steel flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-lava" /> Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone || ""}
                  onChange={handleChange}
                  placeholder="e.g., +91 98765 43210"
                  className="bg-black/[0.02] border-black/10 text-ink rounded-xl placeholder:text-steel/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-steel flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-lava" /> Channel Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ""}
                  onChange={handleChange}
                  placeholder="Briefly describe your content niche, style, and audience..."
                  className="bg-black/[0.02] border-black/10 text-ink rounded-xl placeholder:text-steel/60 resize-none text-xs"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-black/10">
                <Button
                  type="button"
                  variant="creator"
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
                  className="py-2.5 px-5 flex items-center gap-2 text-xs"
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
              <div className="pb-3 border-b border-black/10">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-steel block mb-1">
                  Step 02 // Social Verification
                </span>
                <h3 className="font-display text-lg font-bold text-ink">Social Channel Connection</h3>
                <p className="text-xs text-slate">Connect your Instagram Professional (Creator/Business) account.</p>
              </div>

              {profile.instagram_verified ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-500/25 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">Instagram Linked</p>
                      <p className="text-xs text-emerald-700 font-mono truncate">@{profile.instagram_username || "verified_account"}</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="ink"
                    onClick={handleConnectInstagram}
                    disabled={authLoading}
                    className="w-full py-3 h-11 text-xs"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving & Redirecting...
                      </>
                    ) : (
                      <>
                        <Instagram className="h-4 w-4 mr-2 text-lava" />
                        Connect Instagram Account
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2 text-amber-800 text-[11px] bg-amber-50 p-3 border border-amber-500/25 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Onboarding requires an Instagram Creator/Business account to verify clip views.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-rose-700 text-xs bg-rose-50 border border-rose-500/25 p-3 rounded-xl flex items-start gap-2">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end items-center pt-3 border-t border-black/10">
                <Button
                  type="button"
                  variant="creator"
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
                  className="py-2.5 px-5 flex items-center gap-2 text-xs"
                >
                  Continue to Smart Account
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Step>

          {/* Step 3: Smart Account Activation (No Upfront Bank Friction) */}
          <Step>
            <div className="space-y-4 text-left py-1">
              <div className="pb-3 border-b border-black/10">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-steel block mb-1">
                  Step 03 // Settlement Rail
                </span>
                <h3 className="font-display text-lg font-bold text-ink">Smart Account Ready</h3>
                <p className="text-xs text-slate">Your instant micro-payout wallet on Base L2 is activated and ready for earnings.</p>
              </div>

              {/* Base L2 Smart Wallet Address Card */}
              <div className="p-4 bg-black/[0.03] border border-black/10 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-ink tracking-wide">Base L2 Smart Account</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-lava/10 text-lava border border-lava/25">
                    ERC-4337
                  </span>
                </div>

                {walletAddress ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-white border border-black/10 rounded-xl px-3 py-2 text-xs">
                      <code className="text-ink font-mono text-[11px] select-all break-all min-w-0">
                        {walletAddress}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress);
                          setCopiedWallet(true);
                          toast({ title: "Copied!", description: "Smart account address copied to clipboard." });
                          setTimeout(() => setCopiedWallet(false), 2000);
                        }}
                        className="text-steel hover:text-ink transition-colors duration-150 p-1 shrink-0 cursor-pointer"
                        title="Copy address"
                      >
                        {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate px-1">
                      <span>Zero-gas sponsored by Paymaster</span>
                      <a
                        href={`https://sepolia.basescan.org/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lava hover:underline inline-flex items-center gap-1 font-medium shrink-0"
                      >
                        BaseScan Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 py-2 text-xs text-slate">
                    <Loader2 className="w-4 h-4 animate-spin text-lava shrink-0" />
                    <span>Provisioning smart contract account on Base Sepolia...</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-black/[0.02] border border-black/10 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-lava/10 text-lava shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Zero Upfront Friction</h4>
                    <p className="text-[11px] text-slate mt-0.5 leading-relaxed">
                      No bank account or PAN details required today. When your clips earn milestone views, simply enter your UPI ID at withdrawal to receive instant INR payouts.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-black/[0.02] border border-black/10 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">Instant Milestone Crediting</h4>
                    <p className="text-[11px] text-slate mt-0.5 leading-relaxed">
                      Every verified milestone is automatically allocated to your wallet. You retain full control with zero lockup periods.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="pt-2">
                <Button
                  type="submit"
                  variant="creator"
                  className="w-full py-3 h-11 flex items-center justify-center gap-2 text-xs"
                  disabled={loading || !profile.instagram_verified}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Activate Creator Hub & Enter Dashboard <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Step>
      </Stepper>

      <Dialog open={isSandboxOpen} onOpenChange={setIsSandboxOpen}>
        <DialogContent className="bg-white border border-black/10 text-ink sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
                <Lock className="h-4 w-4 shrink-0" />
                <DialogTitle className="font-display text-lg font-bold text-ink">Simulate Meta OAuth</DialogTitle>
              </div>
              <span className="bg-amber-50 text-amber-800 border border-amber-500/25 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                Sandbox Mode
              </span>
            </div>
            <DialogDescription className="text-xs text-slate leading-relaxed">
              Live Meta App config was not detected. Simulate redirects from Meta callback endpoints below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="mockUsername" className="text-[10px] font-mono font-bold uppercase tracking-wider text-steel">
                Instagram Handle
              </label>
              <Input
                id="mockUsername"
                type="text"
                value={mockUsername}
                onChange={(e) => setMockUsername(e.target.value)}
                placeholder="creatorxyz"
                className="bg-black/[0.02] border-black/10 text-ink rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => handleSimulateSandbox("success")}
                disabled={sandboxLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-xs"
              >
                {sandboxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate Success (Creator Account)"}
              </Button>
              <Button
                type="button"
                onClick={() => handleSimulateSandbox("failure")}
                disabled={sandboxLoading}
                variant="outline"
                className="w-full border-rose-500/30 text-rose-700 hover:bg-rose-50 h-10 text-xs"
              >
                Simulate Failure (Personal Account)
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsSandboxOpen(false)}
              variant="ghost"
              size="sm"
              className="w-full text-slate text-xs"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompleteProfile;