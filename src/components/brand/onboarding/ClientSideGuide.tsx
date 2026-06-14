import React, { useState } from "react";
import { ClipboardCopy, Check, ShieldAlert, Key, HelpCircle, Save, Layers, ExternalLink, Youtube, Video } from "lucide-react";

interface ClientSideGuideProps {
  gateway: string;
  apiKey: string;
  webhookUrl: string;
  brandId: string | number;
  onSaveCredentials: (readKey: string, clientId?: string) => Promise<void>;
  savingCredentials: boolean;
  copyToClipboard: (text: string, label: string) => void;
}

export const ClientSideGuide: React.FC<ClientSideGuideProps> = ({
  gateway,
  apiKey,
  webhookUrl,
  brandId,
  onSaveCredentials,
  savingCredentials,
  copyToClipboard
}) => {
  const [activeTab, setActiveTab] = useState<"key_guide" | "config" | "js_snippet">("key_guide");
  const [readKey, setReadKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeVideo, setActiveVideo] = useState<"test" | "live">("test");

  // YouTube walkthough video href and thumbnail helpers
  const youtubeWalkthroughHref = "https://youtu.be/Cer8UfBGX_E";
  const extractYoutubeId = (url: string) => {
    try {
      // supports youtu.be/ID and youtube.com/watch?v=ID
      const shortMatch = url.match(/youtu\.be\/(^[?#&\/]*)?([A-Za-z0-9_-]+)/) || url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
      if (shortMatch) return shortMatch[2] || shortMatch[1];
      const vMatch = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
      if (vMatch) return vMatch[1];
    } catch (e) {
      // ignore
    }
    return null;
  };
  const youtubeVideoId = extractYoutubeId(youtubeWalkthroughHref) || 'Cer8UfBGX_E';
  const thumbnailMaxRes = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
  const thumbnailFallback = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

  // Parse API base from webhook URL (e.g. http://localhost:5000)
  const getApiBase = () => {
    try {
      const idx = webhookUrl.indexOf("/api/webhooks/");
      if (idx !== -1) {
        return webhookUrl.substring(0, idx);
      }
    } catch (e) {}
    return "https://enrich-prominent-backspace.ngrok-free.dev";
  };

  const apiBase = getApiBase();

  const isStripe = gateway === "stripe";
  const isRazorpay = gateway === "razorpay";

  interface StepItem {
    step: number;
    title: string;
    description: string;
    image?: string;
    alt?: string;
  }

  // Step instructions and image maps
  const stripeSteps: StepItem[] = [
    {
      step: 1,
      title: "Open Developer Keys",
      description: "Navigate to the Stripe Dashboard -> Developers -> API Keys tab."
    },
    {
      step: 2,
      title: "Create Restricted Key",
      description: "Click on '+ Create restricted key' to generate a security-limited API key."
    },
    {
      step: 3,
      title: "Configure Permissions",
      description: "Find 'Checkout Sessions' and set it to 'Read'. Find 'Payment Intents' and set to 'Read'. Set all other permissions to 'None'."
    },
    {
      step: 4,
      title: "Copy Restricted Key",
      description: "Click 'Create key', copy the key (starts with 'rk_live_' or 'rk_test_'), and paste it in the Configure Credentials tab.",
      image: "https://b.stripecdn.com/docs-statics-srv/assets/copy-app-keys.89fd5ca5d68b91c105164092b4de5029.png",
      alt: "Copy Restricted Key modal"
    }
  ];

  const razorpaySteps: StepItem[] = [
    {
      step: 1,
      title: "Go to API Keys settings",
      description: "Login to Razorpay Dashboard -> Account & Settings -> API Keys.",
      image: "/onboarding/razorpay_step1.png",
      alt: "Razorpay settings tab"
    },
    {
      step: 2,
      title: "Generate Key",
      description: "Click on 'Generate Key' (or 'Regenerate Key' if you already have one) to create active credentials.",
      image: "/onboarding/razorpay_step2.png",
      alt: "Generate Key screen"
    },
    {
      step: 3,
      title: "Retrieve Key ID and Secret",
      description: "Copy both Key ID (starts with 'rzp_') and Key Secret which is shown only once in the popup.",
      image: "/onboarding/razorpay_step3.png",
      alt: "Key ID and Secret popup modal"
    },
    {
      step: 4,
      title: "Complete Configuration",
      description: "Since Razorpay keys have global access, protect these credentials. Paste both Key ID and Secret in the 'Link Credentials' tab.",
      image: "/onboarding/razorpay_step4.png",
      alt: "Razorpay Key configuration complete"
    }
  ];

  const steps = isStripe ? stripeSteps : razorpaySteps;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readKey.trim()) {
      return;
    }
    await onSaveCredentials(readKey, clientId);
  };

  const getJsSnippet = () => {
    if (isStripe) {
      return `// 1. Save referrer code from URL query parameter (e.g. ?ref=CREATOR_CODE) when visitor lands
const urlParams = new URLSearchParams(window.location.search);
const affiliateCode = urlParams.get('ref');
if (affiliateCode) {
  localStorage.setItem('mipoe_affiliate_code', affiliateCode);
}

// 2. Add this in your Stripe checkout success redirect landing page
const successParams = new URLSearchParams(window.location.search);
const sessionId = successParams.get('session_id'); // Ensure your Stripe return URL contains {CHECKOUT_SESSION_ID}
const storedAffiliate = localStorage.getItem('mipoe_affiliate_code');

if (sessionId && storedAffiliate) {
  fetch('${apiBase}/api/webhooks/public-subscription/${brandId}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gateway: 'stripe',
      transaction_id: sessionId,
      affiliate_code: storedAffiliate,
      plan_id: 'default', // optional subscription tier identifier
      interval: 'monthly' // billing interval: 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Mipoe Conversion Synced successfully:', data);
    // Clear code after successful conversion to prevent repeats
    localStorage.removeItem('mipoe_affiliate_code');
  })
  .catch(err => console.error('Verification failed:', err));
}`;
    } else {
      return `// 1. Save referrer code from URL query parameter (e.g. ?ref=CREATOR_CODE) when visitor lands
const urlParams = new URLSearchParams(window.location.search);
const affiliateCode = urlParams.get('ref');
if (affiliateCode) {
  localStorage.setItem('mipoe_affiliate_code', affiliateCode);
}

// 2. Invoke this in your Razorpay checkout success handler / payment callback
const handleRazorpayPaymentSuccess = (response) => {
  const paymentId = response.razorpay_payment_id; // Razorpay payment transaction identifier
  const storedAffiliate = localStorage.getItem('mipoe_affiliate_code');

  if (paymentId && storedAffiliate) {
    fetch('${apiBase}/api/webhooks/public-subscription/${brandId}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gateway: 'razorpay',
        transaction_id: paymentId,
        affiliate_code: storedAffiliate,
        plan_id: 'premium', // optional
        interval: 'monthly' // billing interval: 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Mipoe Conversion Synced successfully:', data);
      localStorage.removeItem('mipoe_affiliate_code');
    })
    .catch(err => console.error('Verification failed:', err));
  }
};`;
    }
  };

  const handleCopySnippet = () => {
    copyToClipboard(getJsSnippet(), "Frontend JS Snippet");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      
      {/* Security Caution Alert */}
      <div className={`border rounded-xl p-5 flex gap-4 ${isStripe ? "bg-rose-50 border-rose-200 text-rose-950" : "bg-amber-50 border-amber-200 text-amber-950"}`}>
        <ShieldAlert className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isStripe ? "text-rose-600" : "text-amber-600"}`} />
        <div>
          <h4 className={`font-bold text-sm ${isStripe ? "text-rose-900" : "text-amber-900"}`}>
            {isStripe ? "Security Recommendation: Restricted Key Required" : "Security Notice: Razorpay Master Key Warning"}
          </h4>
          <p className={`text-xs mt-1 leading-relaxed ${isStripe ? "text-rose-800" : "text-amber-800"}`}>
            {isStripe 
              ? "Since client-side apps send request details directly from the user's browser, you must NEVER expose your Master API Secret Key. Follow the instructions below to generate a Restricted Read-Only Key that can only read transactions."
              : "Razorpay does not currently support Restricted API Keys. The credentials you paste will have full read/write access. If you prefer a zero-trust model where you do not share secrets with Mipoe, we highly recommend switching to our Serverless Edge Functions or Database Webhooks methods."
            }
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-150 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("key_guide")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "key_guide"
              ? "bg-slate-900 text-slate-100 shadow-sm"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {isStripe ? "1. Generate Restricted Key" : "1. Key Generation Guide"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "config"
              ? "bg-slate-900 text-slate-100 shadow-sm"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          2. Link Credentials
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("js_snippet")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "js_snippet"
              ? "bg-slate-900 text-slate-100 shadow-sm"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          3. Frontend JS Snippet
        </button>
      </div>

      {/* TAB 1: Key Generation Steps */}
      {activeTab === "key_guide" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-gray-850 text-sm">
              {isStripe ? "How to create a Restricted Key on Stripe" : "How to generate API Keys on Razorpay"}
            </h5>
          </div>

          {isStripe ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((item) => (
                <div key={item.step} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                        {item.step}
                      </span>
                      <span className="font-bold text-gray-800 text-xs">{item.title}</span>
                    </div>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{item.description}</p>
                  </div>
                  
                  {/* Image Placeholder with clean preview layout */}
                  {item.image && (
                    <div className="bg-slate-200 border border-slate-350 rounded-lg overflow-hidden flex items-center justify-center h-40 relative group">
                      <img 
                        src={item.image} 
                        alt={item.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.parentElement?.querySelector('.img-placeholder') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="img-placeholder hidden absolute inset-0 flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                        <HelpCircle className="w-8 h-8 text-slate-350 mb-1" />
                        <span className="text-[10px] font-medium text-slate-500">{item.alt}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stepper Timeline - Full Width for maximum breathing room */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Walkthrough Checklist
                  </span>
                  <h6 className="font-bold text-gray-800 text-sm mt-2">
                    Follow these steps to generate your Live Mode API credentials
                  </h6>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { 
                      title: "1. Switch to Live Mode", 
                      desc: "Log in to your Razorpay Dashboard. Make sure the toggle at the top right is set to 'Live Mode'. Do not use test keys as they cannot process real campaign conversions." 
                    },
                    { 
                      title: "2. Open API Keys Panel", 
                      desc: "Navigate to 'Account & Settings' from the left menu. Under 'Website and App settings', click on the 'API Keys' link." 
                    },
                    { 
                      title: "3. Click Generate Key", 
                      desc: "Click the 'Generate Key' button. If you already have an active key, click 'Regenerate Key' to create a new Key ID and Secret." 
                    },
                    { 
                      title: "4. Securely Copy Keys", 
                      desc: "A popup will display your Key ID and Key Secret. Copy both values immediately. Note that the Key Secret is only shown once and cannot be retrieved later." 
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all hover:shadow-sm">
                      <span className="block font-bold text-gray-800 text-xs mb-1.5">{step.title}</span>
                      <span className="text-[11px] text-gray-500 leading-relaxed block">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soothing, Spacious Resource Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Custom Premium Video Walkthrough Launcher Card */}
                <a 
                  href="https://youtu.be/Cer8UfBGX_E" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group block bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md hover:shadow-lg overflow-hidden transition-all hover:-translate-y-[5%]"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <span className="font-bold text-xs text-slate-200">Video Walkthrough</span>
                      </div>
                      <span className="text-[9px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        Live Mode Tutorial
                      </span>
                    </div>
                    
                    {/* Simulated Player Card (thumbnail background, fallback handling) */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                      {/* Thumbnail image (try maxres, fall back to hq) */}
                      <img
                        src={thumbnailMaxRes}
                        alt="Video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.dataset.fallback !== '1') {
                            img.dataset.fallback = '1';
                            img.src = thumbnailFallback;
                          } else {
                            // If even fallback fails, hide image to reveal gradient
                            img.style.display = 'none';
                          }
                        }}
                      />

                      {/* Thumbnail overlay gradient to ensure contrast with controls */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-indigo-950/30 to-purple-950/20 opacity-80" />

                      {/* Play Button Overlay */}
                      <div className="relative z-10 w-12 h-12 bg-red-650 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg ">
                        <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>

                      <span className="absolute bottom-3 left-3 text-[10px] text-slate-350 z-10 font-semibold bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                        2:15 • Razorpay Official
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block font-bold text-xs text-slate-100 group-hover:text-indigo-400 transition-colors">
                        Watch: How to Generate Live API Keys
                      </span>
                      <span className="block text-[10px] text-slate-400 leading-relaxed">
                        Watch Razorpay's official video guide on YouTube explaining the key generation and management process.
                      </span>
                    </div>
                  </div>
                </a>

                {/* Documentation Link Card */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-650" />
                      <span className="font-bold text-xs text-gray-800">Official Documentation</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      For detailed requirements on merchant account verification, KYC activation, key management rules, and Razorpay API rate structures, consult the official dashboard documentation.
                    </p>
                  </div>

                  <div className="pt-2">
                    <a 
                      href="https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full justify-center inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2 py-2 rounded-xl transition-all shadow-sm"
                    >
                      Read Razorpay API Keys Guide <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              Continue to Link Credentials
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Credentials Form */}
      {activeTab === "config" && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex gap-3">
            <Key className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 text-xs">Verify & Save Restricted Key</p>
              <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                Enter your restricted keys here. We encrypt these credentials symmetrically at rest using industry-grade algorithms. They will only be used to read transaction statuses during client webhook calls.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {isRazorpay && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Razorpay Key ID (Client ID)</label>
                <input
                  type="text"
                  placeholder="e.g. rzp_live_A1b2C3d4E5f6G7"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                {isStripe ? "Stripe Restricted API Key" : "Razorpay Key Secret"}
              </label>
              <input
                type="password"
                placeholder={isStripe ? "Starts with rk_live_ or rk_test_" : "Enter your Razorpay Key Secret"}
                value={readKey}
                onChange={(e) => setReadKey(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingCredentials || !readKey.trim() || (isRazorpay && !clientId.trim())}
              className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingCredentials ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving keys...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save & Activate Client Verification
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: JavaScript Snippet */}
      {activeTab === "js_snippet" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Client-Side Verification Script</span>
            <span className="text-[10px] text-gray-400">Add to success/completion landing pages</span>
          </div>

          <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-7 w-7 flex items-center justify-center rounded transition-all border border-slate-800"
              onClick={handleCopySnippet}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            </button>
            <pre className="overflow-x-auto whitespace-pre max-h-[350px] pr-8">{getJsSnippet()}</pre>
          </div>
        </div>
      )}

    </div>
  );
};
