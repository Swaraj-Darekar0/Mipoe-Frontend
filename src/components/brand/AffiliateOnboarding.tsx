import React, { useState, useEffect } from "react";
import { connectShopify, connectCustom, initializeSaasIntegration, getAffiliateStatus, getUserId, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  ShoppingBag, 
  CheckCircle, 
  ClipboardCopy, 
  Layers,
  ArrowRight,
  Database,
  Code,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Server,
  Cpu,
  Sparkles
} from "lucide-react";
import Stepper, { Step } from "@/components/ui/Stepper";
import { BackendServerGuide } from "./onboarding/BackendServerGuide";
import { ServerlessGuide } from "./onboarding/ServerlessGuide";
import { DatabaseWebhookGuide } from "./onboarding/DatabaseWebhookGuide";
import { ClientSideGuide } from "./onboarding/ClientSideGuide";

interface AffiliateOnboardingProps {
  businessCategory: string; // 'Product Based' | 'SaaS Based'
  onOnboardingCompleted: () => void;
}

export const AffiliateOnboarding: React.FC<AffiliateOnboardingProps> = ({ 
  businessCategory, 
  onOnboardingCompleted 
}) => {
  const { toast } = useToast();

  const getRealWebhookUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    const idx = rawUrl.indexOf("/api/webhooks/");
    if (idx !== -1) {
      return `${API_BASE}${rawUrl.substring(idx)}`;
    }
    return rawUrl;
  };

  const [activeMethod, setActiveMethod] = useState<"shopify" | "custom" | "saas" | null>(
    businessCategory === "Product Based" ? "custom" : "saas"
  );

  // Shopify States
  const [shopName, setShopName] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);

  // Custom Integration States
  const [customCredentials, setCustomCredentials] = useState<{
    api_key: string;
    webhook_url: string;
    webhook_secret: string;
  } | null>(null);
  const [activatingCustom, setActivatingCustom] = useState(false);

  // SaaS Wizard States
  const [saasStep, setSaasStep] = useState(1);
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "razorpay" | "cashfree" | "payu" | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"node" | "python" | "php" | "curl">("node");
  const [initializingSaas, setInitializingSaas] = useState(false);
  const [saasCredentials, setSaasCredentials] = useState<{
    api_key: string;
    webhook_url: string;
    webhook_secret: string;
  } | null>(null);
  const [verifyingSaas, setVerifyingSaas] = useState(false);
  const [isSaasVerified, setIsSaasVerified] = useState(false);

  const [integrationPath, setIntegrationPath] = useState<"backend" | "serverless" | "db_webhook" | "client_side" | null>(null);
  const [savingClientCredentials, setSavingClientCredentials] = useState(false);

  // Webhook Listener Console States
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalState, setTerminalState] = useState<"idle" | "listening" | "success">("idle");
  const [sendingTestPing, setSendingTestPing] = useState(false);

  // Product Based Stepper state
  const [productStep, setProductStep] = useState(1);

  const handleShopifyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ title: "Validation Error", description: "Shop URL is required", variant: "destructive" });
      return;
    }

    setConnectingShopify(true);
    try {
      const res = await connectShopify(shopName);
      window.location.href = res.url;
    } catch (err: any) {
      toast({ 
        title: "Connection Failed", 
        description: err.message || "Failed to initiate Shopify connection.", 
        variant: "destructive" 
      });
    } finally {
      setConnectingShopify(false);
    }
  };

  const handleCustomConnect = async () => {
    setActivatingCustom(true);
    try {
      const res = await connectCustom();
      setCustomCredentials({
        api_key: res.api_key,
        webhook_url: getRealWebhookUrl(res.webhook_url),
        webhook_secret: res.webhook_secret
      });
      toast({ title: "API Activated", description: "Your custom API key has been generated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActivatingCustom(false);
    }
  };

  const handleSaasInitialize = async () => {
    if (!selectedGateway) return;
    setInitializingSaas(true);
    try {
      const res = await initializeSaasIntegration(selectedGateway);
      setSaasCredentials({
        api_key: res.api_key,
        webhook_url: getRealWebhookUrl(res.webhook_url),
        webhook_secret: res.webhook_secret
      });
      setSaasStep(2);
      toast({ title: "Keys Generated", description: `API Key initialized for ${selectedGateway.toUpperCase()}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setInitializingSaas(false);
    }
  };

  const checkVerificationStatus = async () => {
    setVerifyingSaas(true);
    try {
      const status = await getAffiliateStatus();
      if (status.is_affiliate_verified) {
        setIsSaasVerified(true);
        setSaasStep(4);
        toast({ title: "Success", description: "Integration verified successfully! ✅" });
      } else {
        toast({ 
          title: "Verification Pending", 
          description: "No verification event received yet. Please run the cURL command in your terminal first.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingSaas(false);
    }
  };

  // Polling hook for webhook verification
  useEffect(() => {
    let intervalId: any = null;
    
    if (saasStep === 3 && saasCredentials) {
      setTerminalState("listening");
      setTerminalLogs([
        `[${new Date().toLocaleTimeString()}] Initializing inbound verification listener...`,
        `[${new Date().toLocaleTimeString()}] Listening at endpoint: ${saasCredentials.webhook_url}`,
        `[${new Date().toLocaleTimeString()}] Status: [Waiting for webhook event...]`,
        ` ↳ Please run the cURL command in your terminal, or click "Send Test Ping".`
      ]);
      
      const poll = async () => {
        try {
          const status = await getAffiliateStatus();
          if (status.is_affiliate_verified) {
            clearInterval(intervalId);
            setTerminalState("success");
            setTerminalLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] Status: [INCOMING EVENT DETECTED]`,
              "----------------------------------------",
              `[VERIFIED] Webhook verification event received successfully!`,
              `[VERIFIED] Authorization: Bearer mp_key_...`,
              `[VERIFIED] Database state updated: is_affiliate_verified = true`,
              `[VERIFIED] Onboarding completed successfully.`,
              "----------------------------------------",
              "Closing connection. Redirecting..."
            ]);
            setIsSaasVerified(true);
            setTimeout(() => {
              setSaasStep(4);
            }, 3000);
          }
        } catch (err) {
          console.error("Verification polling error:", err);
        }
      };

      intervalId = setInterval(poll, 2500);
      poll(); // Run initial check
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [saasStep, saasCredentials]);

  const triggerMockPing = async () => {
    if (!saasCredentials) return;
    setSendingTestPing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [Browser Test] Dispatching mock event payload...`,
      ` ↳ POST ${saasCredentials.webhook_url}`,
      ` ↳ Authorization: Bearer ${saasCredentials.api_key.substring(0, 12)}...`,
      ` ↳ Payload: {"event": "verification"}`
    ]);
    
    try {
      const res = await fetch(saasCredentials.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${saasCredentials.api_key}`
        },
        body: JSON.stringify({ event: "verification" })
      });
      
      const data = await res.json();
      if (res.ok) {
        setTerminalLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [Browser Test] Connection established: 200 OK`,
          ` ↳ response: "${data.msg || data.status}"`
        ]);
        toast({ title: "Verification Fired", description: "Verification payload sent successfully!" });
      } else {
        throw new Error(data.detail || "Server rejected request");
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [Browser Test] Connection failed:`,
        ` ↳ Error: ${err.message}`
      ]);
      toast({ title: "Ping Failed", description: err.message || "Failed to trigger verification ping.", variant: "destructive" });
    } finally {
      setSendingTestPing(false);
    }
  };

  const handleSaveClientCredentials = async (readKey: string, clientId?: string) => {
    if (!selectedGateway) return;
    setSavingClientCredentials(true);
    try {
      const res = await initializeSaasIntegration(selectedGateway, readKey, clientId);
      setSaasCredentials({
        api_key: res.api_key,
        webhook_url: getRealWebhookUrl(res.webhook_url),
        webhook_secret: res.webhook_secret
      });
      toast({ title: "Credentials Linked", description: "Restricted API keys saved and encrypted successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingClientCredentials(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  if (businessCategory?.toLowerCase().includes("saas")) {
    return (
      <Stepper
        layout="split"
        activeStep={saasStep}
        onStepChange={(step) => setSaasStep(step)}
        stepLabels={["Select Gateway", "Add Code", "Verify Setup", "Completed"]}
        onboardingTitle="Affiliate Setup"
        hideFooter={true}
        disableStepIndicators={false}
        sidebarHeader={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Integration Type</p>
              <p className="font-bold text-sm text-slate-800">SaaS SDK Webhook</p>
            </div>
          </div>
        }
        sidebarFooter={
          <div className="space-y-2 text-xs text-slate-500">
            <p className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              Secure webhook verification
            </p>
          </div>
        }
      >
        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
              <Database className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">SaaS Billing Provider</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Select your billing processor. We will generate custom tracking hooks to log referral subscriptions and manage recurring commission payouts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "stripe", name: "Stripe", desc: "Global SaaS standard checkout" },
                { id: "razorpay", name: "Razorpay", desc: "Popular Indian payment suite" },
                { id: "cashfree", name: "Cashfree", desc: "Flexible subscription payouts" },
                { id: "payu", name: "PayU", desc: "Enterprise gateway solutions" }
              ].map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setSelectedGateway(gw.id as any)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    selectedGateway === gw.id
                      ? "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-200 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <h4 className="font-bold text-gray-800 text-sm">{gw.name}</h4>
                  <p className="text-gray-400 text-[10px] mt-1">{gw.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaasInitialize}
                disabled={!selectedGateway || initializingSaas}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 text-sm"
              >
                {initializingSaas ? "Initializing..." : "Generate Webhook Keys"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-6 text-left py-2">
            {integrationPath === null ? (
              <div className="space-y-6">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                  <Code className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Select Integration Architecture</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Choose how you want to integrate tracking into your application stack.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIntegrationPath("backend")}
                    className="p-5 rounded-xl text-left border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex items-start gap-4"
                  >
                    <Server className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Backend API Integration</h4>
                      <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                        For Node.js, Python, PHP, or Go server webhooks. Standard, secure server-to-server.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntegrationPath("serverless")}
                    className="p-5 rounded-xl text-left border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex items-start gap-4"
                  >
                    <Cpu className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Serverless Edge Functions</h4>
                      <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                        Deploy lightweight edge handlers (Supabase Edge functions, AWS Lambda).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntegrationPath("db_webhook")}
                    className="p-5 rounded-xl text-left border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all flex items-start gap-4"
                  >
                    <Database className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Database Webhooks</h4>
                      <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                        Zero-code triggers directly from database rows (Supabase DB, Hasura).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedGateway === "stripe" || selectedGateway === "razorpay") {
                        setIntegrationPath("client_side");
                      }
                    }}
                    disabled={selectedGateway !== "stripe" && selectedGateway !== "razorpay"}
                    className={`p-5 rounded-xl text-left border transition-all flex items-start gap-4 ${
                      selectedGateway === "stripe" || selectedGateway === "razorpay"
                        ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer"
                        : "bg-gray-50 border-gray-150 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Layers className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-sm">Frontend-Only Apps</h4>
                        {selectedGateway !== "stripe" && selectedGateway !== "razorpay" && (
                          <span className="text-[8px] bg-gray-250 text-gray-500 px-1 py-0.5 rounded">
                            Stripe/Razorpay Only
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                        For frontend checkouts without a dedicated backend. Secure verifications via Restricted Keys.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex justify-end items-center pt-2 border-t border-gray-150">
                  <Button onClick={() => setSaasStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 text-sm">
                    Continue to Verification
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setIntegrationPath(null)}
                  className="text-indigo-600 hover:text-indigo-850 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Choose a different integration method
                </button>

                {saasCredentials && integrationPath === "backend" && (
                  <BackendServerGuide
                    gateway={selectedGateway || ""}
                    language={selectedLanguage}
                    onChangeLanguage={setSelectedLanguage}
                    apiKey={saasCredentials.api_key}
                    webhookUrl={saasCredentials.webhook_url}
                    webhookSecret={saasCredentials.webhook_secret}
                    copyToClipboard={copyToClipboard}
                  />
                )}

                {saasCredentials && integrationPath === "serverless" && (
                  <ServerlessGuide
                    gateway={selectedGateway || ""}
                    apiKey={saasCredentials.api_key}
                    webhookUrl={saasCredentials.webhook_url}
                    webhookSecret={saasCredentials.webhook_secret}
                    copyToClipboard={copyToClipboard}
                  />
                )}

                {saasCredentials && integrationPath === "db_webhook" && (
                  <DatabaseWebhookGuide
                    gateway={selectedGateway || ""}
                    apiKey={saasCredentials.api_key}
                    webhookUrl={saasCredentials.webhook_url}
                    webhookSecret={saasCredentials.webhook_secret}
                    copyToClipboard={copyToClipboard}
                  />
                )}

                {saasCredentials && integrationPath === "client_side" && (
                  <ClientSideGuide
                    gateway={selectedGateway || ""}
                    apiKey={saasCredentials.api_key}
                    webhookUrl={saasCredentials.webhook_url}
                    brandId={getUserId() || ""}
                    onSaveCredentials={handleSaveClientCredentials}
                    savingCredentials={savingClientCredentials}
                    copyToClipboard={copyToClipboard}
                  />
                )}

                <div className="flex justify-end items-center pt-2 border-t border-gray-150">
                  <Button onClick={() => setSaasStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 text-sm">
                    Continue to Verification
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Step>

        <Step>
          <div className="space-y-6 text-left py-2">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                Verify your <span className="font-serif italic text-indigo-650 font-normal">integration</span> telemetry
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                We need to verify that your endpoint receives payment events and successfully forwards referral pings. Use the cURL command below to trigger a test event, or use our browser simulator.
              </p>
            </div>

            {saasCredentials && (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-gray-700">Terminal command (cURL)</span>
                <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed relative">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-7 w-7 p-0" 
                    onClick={() => copyToClipboard(`curl -X POST ${saasCredentials.webhook_url} \\\n  -H "Authorization: Bearer ${saasCredentials.api_key}" \\\n  -H "Content-Type: application/json" \\\n  -d "{\\"event\\": \\"verification\\"}"`, "Verification Command")}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" />
                  </Button>
                  <pre className="overflow-x-auto whitespace-pre">{`curl -X POST ${saasCredentials.webhook_url} \\
  -H "Authorization: Bearer ${saasCredentials.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "verification"}'`}</pre>
                </div>
              </div>
            )}

            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono mt-4">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 font-sans tracking-wide">
                  verification_listener.sh
                </span>
                <div className="flex items-center gap-1.5">
                  {terminalState === "listening" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-semibold font-sans">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Listening
                    </span>
                  )}
                  {terminalState === "success" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[8px] font-semibold font-sans animate-bounce">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 text-[10px] text-slate-300 h-44 overflow-y-auto space-y-1 bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-800">
                {terminalLogs.map((log, idx) => {
                  let color = "text-slate-400";
                  if (log.includes("[VERIFIED]") || log.includes("SUCCESS") || log.includes("established")) color = "text-emerald-400 font-semibold";
                  if (log.includes("[Browser Test]") || log.includes("[Browser Ping]")) color = "text-indigo-400";
                  if (log.includes("Status:")) color = "text-amber-300 font-medium";
                  if (log.includes("Error:") || log.includes("failed:")) color = "text-rose-400 font-medium";
                  return (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-650 select-none">~</span>
                      <span className={`${color} break-all`}>{log}</span>
                    </div>
                  );
                })}
                {terminalState === "listening" && (
                  <div className="flex gap-2 items-center text-slate-500">
                    <span className="text-slate-650 select-none">~</span>
                    <span className="animate-pulse">Listening for incoming connections...</span>
                    <span className="w-1 h-3.5 bg-slate-400 inline-block animate-ping ml-1" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center pt-2">
              <div className="flex gap-3">
                <Button 
                  onClick={triggerMockPing} 
                  disabled={sendingTestPing || terminalState === "success"}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2"
                >
                  {sendingTestPing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Test Ping"
                  )}
                </Button>
                <Button 
                  onClick={async () => {
                    const status = await getAffiliateStatus();
                    if (status.is_affiliate_verified) {
                      setSaasStep(4);
                    } else {
                      toast({
                        title: "Verification Pending",
                        description: "No verification payload detected yet. Run the cURL command or click Send Test Ping.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 text-sm"
                >
                  Check Status
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Step>

        <Step>
          <div className="space-y-6 text-center py-6 animate-in scale-in duration-300">
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4 animate-bounce" />
            <h3 className="font-extrabold text-gray-900 text-xl">Integration Verified! ✅</h3>
            <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
              Your SaaS subscription tracking is now fully active. We successfully received the test conversion webhook. You can now launch campaigns and map products to your partners.
            </p>

            <div className="flex justify-end items-center pt-4">
              <Button onClick={onOnboardingCompleted} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm">
                Go to Campaigns Workspace
              </Button>
            </div>
          </div>
        </Step>
      </Stepper>
    );
  }

  return (
    <Stepper
      layout="split"
      activeStep={productStep}
      onStepChange={(step) => setProductStep(step)}
      stepLabels={["Choose Method", "Connect & Activate"]}
      onboardingTitle="Affiliate Setup"
      hideFooter={true}
      disableStepIndicators={false}
      sidebarHeader={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Integration Type</p>
            <p className="font-bold text-sm text-slate-800">Product Based</p>
          </div>
        </div>
      }
      sidebarFooter={
        <div className="space-y-2 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            Custom or Shopify webhook tracking
          </p>
        </div>
      }
    >
      {/* Step 1: Choose Integration Method */}
      <Step>
        <div className="space-y-6 text-left py-2">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Affiliate Program Setup</h3>
              <p className="text-xs text-gray-500">Choose how you want to integrate product tracking.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setActiveMethod("shopify"); setProductStep(2); }}
              className="p-5 rounded-xl text-left border bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-start gap-4 shadow-sm"
            >
              <ShoppingBag className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Shopify OAuth</h4>
                <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                  Connect your store via official OAuth. Automatic product sync and conversion tracking.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setActiveMethod("custom"); setProductStep(2); }}
              className="p-5 rounded-xl text-left border bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-start gap-4 shadow-sm"
            >
              <Globe className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Custom Webhook API</h4>
                <p className="text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                  Generate API credentials and manually post conversion events from your backend.
                </p>
              </div>
            </button>
          </div>
        </div>
      </Step>

      {/* Step 2: Complete the chosen integration */}
      <Step>
        <div className="space-y-6 text-left py-2">
          {activeMethod === "shopify" && (
            <form onSubmit={handleShopifyConnect} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Shopify Integration</h3>
                  <p className="text-xs text-gray-500">Connect your store using official OAuth permissions.</p>
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                <ShoppingBag className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-500 text-xs leading-relaxed">
                  We automatically synchronize pricing, images, variants, stock, and track discount conversion events.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Shopify Store Domain</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g. my-awesome-brand"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="text-sm"
                  />
                  <span className="inline-flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-xs font-mono font-medium whitespace-nowrap">
                    .myshopify.com
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button type="submit" disabled={connectingShopify} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 text-sm shadow-md">
                  {connectingShopify ? "Connecting..." : "Initiate Shopify Connection"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {activeMethod === "custom" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Custom Webhook API</h3>
                  <p className="text-xs text-gray-500">Generate credentials and post conversions from your backend.</p>
                </div>
              </div>

              {!customCredentials ? (
                <div className="text-center py-6">
                  <Button
                    onClick={handleCustomConnect}
                    disabled={activatingCustom}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 mx-auto"
                  >
                    {activatingCustom ? "Activating..." : "Generate Custom API Credentials"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-gray-700">API Key</span>
                    <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-gray-800 font-mono text-xs flex justify-between items-center">
                      <span className="truncate mr-4">{customCredentials.api_key}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyToClipboard(customCredentials.api_key, "API Key")}>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-gray-700">Webhook Endpoint URL</span>
                    <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-gray-800 font-mono text-xs flex justify-between items-center">
                      <span className="truncate mr-4">{customCredentials.webhook_url}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyToClipboard(customCredentials.webhook_url, "Webhook URL")}>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-gray-700">Webhook Signature Secret</span>
                    <div className="border border-gray-150 rounded-xl p-3 bg-gray-50 text-gray-800 font-mono text-xs flex justify-between items-center">
                      <span className="truncate mr-4">{customCredentials.webhook_secret}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyToClipboard(customCredentials.webhook_secret, "Webhook Secret")}>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 text-slate-350 p-4 rounded-2xl font-mono text-[10px] space-y-2 leading-relaxed">
                    <p className="text-slate-200 font-semibold mb-1">JSON Payload Schema (POST conversion):</p>
                    <pre className="overflow-x-auto whitespace-pre">{`POST ${customCredentials.webhook_url}\nHeaders:\n  Authorization: Bearer ${customCredentials.api_key.substring(0, 10)}...\n\nBody:\n{\n  "order_id": "ORD-993882",\n  "order_amount": 1850.00,\n  "currency": "INR",\n  "affiliate_reference": "ref_creator_username",\n  "product_id": "prod_123",\n  "product_name": "Premium Cotton Shirt"\n}`}</pre>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={onOnboardingCompleted} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                      Go to Catalog Workspace
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!activeMethod && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Please go back to Step 1 and select an integration method.
            </div>
          )}
        </div>
      </Step>
    </Stepper>
  );
};
