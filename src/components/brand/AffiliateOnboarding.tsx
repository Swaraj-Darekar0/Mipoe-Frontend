import React, { useState, useEffect } from "react";
import { connectShopify, connectCustom, initializeSaasIntegration, getAffiliateStatus, getUserId, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  ShoppingBag, 
  Key, 
  Link2, 
  CheckCircle, 
  ShieldAlert, 
  ClipboardCopy, 
  Layers,
  ArrowRight,
  Database,
  Code,
  Terminal,
  Check,
  ChevronRight,
  Loader2,
  Server,
  Cpu
} from "lucide-react";
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

  // Dynamic code snippets builder
  const getIntegrationSnippet = () => {
    if (!saasCredentials || !selectedGateway) return "";
    const url = saasCredentials.webhook_url;
    const key = saasCredentials.api_key;

    const snippets = {
      stripe: {
        node: `// Node.js Express (Stripe Webhook handler)
app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    await fetch('${url}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${key}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: session.subscription,
        customer_email: session.customer_details.email,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        plan_id: session.metadata.plan_id || 'default',
        affiliate_code: session.metadata.ref // passed from your frontend checkout
      })
    });
  }
  response.send();
});`,
        python: `# Python FastAPI (Stripe Webhook handler)
@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        async with httpx.AsyncClient() as client:
            await client.post(
                "${url}",
                headers={"Authorization": "Bearer ${key}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": session.get("subscription"),
                    "customer_email": session.get("customer_details", {}).get("email"),
                    "amount": session.get("amount_total") / 100,
                    "currency": session.get("currency", "usd").upper(),
                    "plan_id": session.get("metadata", {}).get("plan_id", "default"),
                    "affiliate_code": session.get("metadata", {}).get("ref")
                }
            )
    return {"status": "success"}`,
        php: `// PHP (Stripe Webhook handler)
$payload = @file_get_contents('php://input');
$event = \\Stripe\\Webhook::constructEvent($payload, $sigHeader, $endpointSecret);

if ($event->type === 'checkout.session.completed') {
    $session = $event->data->object;
    $ch = curl_init('${url}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $session->subscription,
        'customer_email' => $session->customer_details->email,
        'amount' => $session->amount_total / 100,
        'currency' => strtoupper($session->currency),
        'plan_id' => $session->metadata->plan_id ?? 'default',
        'affiliate_code' => $session->metadata->ref ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`,
        curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "subscription.created",
    "subscription_id": "sub_123456",
    "customer_email": "customer@example.com",
    "amount": 29.99,
    "currency": "USD",
    "plan_id": "monthly-pro",
    "affiliate_code": "CREATOR_CODE"
  }'`
      },
      razorpay: {
        node: `// Node.js (Razorpay Webhook handler)
app.post('/webhook-razorpay', async (req, res) => {
  const event = req.body.event;
  const payment = req.body.payload.payment.entity;
  const subscription = req.body.payload.subscription.entity;

  if (event === 'subscription.charged') {
    await fetch('${url}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${key}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: subscription.id,
        customer_email: payment.email,
        amount: payment.amount / 100,
        currency: payment.currency,
        plan_id: subscription.plan_id,
        affiliate_code: payment.notes.ref // passed inside checkout notes
      })
    });
  }
  res.send({ status: 'ok' });
});`,
        python: `# Python FastAPI (Razorpay Webhook)
@app.post("/webhook-razorpay")
async def razorpay_webhook(request: Request):
    data = await request.json()
    event = data.get("event")
    
    if event == "subscription.charged":
        payment = data["payload"]["payment"]["entity"]
        sub = data["payload"]["subscription"]["entity"]
        async with httpx.AsyncClient() as client:
            await client.post(
                "${url}",
                headers={"Authorization": "Bearer ${key}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": sub.get("id"),
                    "customer_email": payment.get("email"),
                    "amount": payment.get("amount") / 100,
                    "currency": payment.get("currency", "INR"),
                    "plan_id": sub.get("plan_id"),
                    "affiliate_code": payment.get("notes", {}).get("ref")
                }
            )
    return {"status": "ok"}`,
        php: `// PHP (Razorpay Webhook handler)
$data = json_decode(@file_get_contents('php://input'));

if ($data->event === 'subscription.charged') {
    $payment = $data->payload->payment->entity;
    $sub = $data->payload->subscription->entity;
    
    $ch = curl_init('${url}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $sub->id,
        'customer_email' => $payment->email,
        'amount' => $payment->amount / 100,
        'currency' => $payment->currency,
        'plan_id' => $sub->plan_id,
        'affiliate_code' => $payment->notes->ref ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`,
        curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "subscription.created",
    "subscription_id": "sub_rzp_9876",
    "customer_email": "customer@example.com",
    "amount": 999.00,
    "currency": "INR",
    "plan_id": "plan_gold",
    "affiliate_code": "CREATOR_CODE"
  }'`
      },
      cashfree: {
        node: `// Node.js (Cashfree Webhook handler)
app.post('/webhook-cashfree', async (req, res) => {
  const event = req.body.event;
  
  if (event === 'SUBSCRIPTION_NEW_ORDER') {
    await fetch('${url}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${key}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: req.body.subscriptionId,
        customer_email: req.body.customerEmail,
        amount: req.body.orderAmount,
        currency: 'INR',
        plan_id: req.body.planId,
        affiliate_code: req.body.affiliateCode // passed in metadata
      })
    });
  }
  res.send();
});`,
        python: `# Python FastAPI (Cashfree Webhook)
@app.post("/webhook-cashfree")
async def cashfree_webhook(request: Request):
    data = await request.json()
    if data.get("event") == "SUBSCRIPTION_NEW_ORDER":
        async with httpx.AsyncClient() as client:
            await client.post(
                "${url}",
                headers={"Authorization": "Bearer ${key}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": data.get("subscriptionId"),
                    "customer_email": data.get("customerEmail"),
                    "amount": data.get("orderAmount"),
                    "currency": "INR",
                    "plan_id": data.get("planId"),
                    "affiliate_code": data.get("affiliateCode")
                }
            )
    return {"status": "ok"}`,
        php: `// PHP (Cashfree Webhook handler)
$data = json_decode(@file_get_contents('php://input'));

if ($data->event === 'SUBSCRIPTION_NEW_ORDER') {
    $ch = curl_init('${url}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $data->subscriptionId,
        'customer_email' => $data->customerEmail,
        'amount' => $data->orderAmount,
        'currency' => 'INR',
        'plan_id' => $data->planId,
        'affiliate_code' => $data->affiliateCode ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`,
        curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "subscription.created",
    "subscription_id": "sub_cf_4567",
    "customer_email": "customer@example.com",
    "amount": 499.00,
    "currency": "INR",
    "plan_id": "pro_tier",
    "affiliate_code": "CREATOR_CODE"
  }'`
      },
      payu: {
        node: `// Node.js (PayU Success callback)
app.post('/payu-success', async (req, res) => {
  const status = req.body.status;
  
  if (status === 'success') {
    await fetch('${url}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${key}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: req.body.txnid,
        customer_email: req.body.email,
        amount: req.body.amount,
        currency: 'INR',
        plan_id: req.body.productinfo,
        affiliate_code: req.body.udf1 // User Defined Field 1
      })
    });
  }
  res.redirect('/success');
});`,
        python: `# Python FastAPI (PayU Success callback)
@app.post("/payu-success")
async def payu_success(request: Request):
    form_data = await request.form()
    if form_data.get("status") == "success":
        async with httpx.AsyncClient() as client:
            await client.post(
                "${url}",
                headers={"Authorization": "Bearer ${key}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": form_data.get("txnid"),
                    "customer_email": form_data.get("email"),
                    "amount": float(form_data.get("amount", 0)),
                    "currency": "INR",
                    "plan_id": form_data.get("productinfo"),
                    "affiliate_code": form_data.get("udf1")
                }
            )
    return RedirectResponse("/success")`,
        php: `// PHP (PayU Success callback handler)
if ($_POST['status'] === 'success') {
    $ch = curl_init('${url}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $_POST['txnid'],
        'customer_email' => $_POST['email'],
        'amount' => $_POST['amount'],
        'currency' => 'INR',
        'plan_id' => $_POST['productinfo'],
        'affiliate_code' => $_POST['udf1'] ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`,
        curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "subscription.created",
    "subscription_id": "txnid_payu_123",
    "customer_email": "customer@example.com",
    "amount": 1200.00,
    "currency": "INR",
    "plan_id": "yearly_plan",
    "affiliate_code": "CREATOR_CODE"
  }'`
      }
    };

    return snippets[selectedGateway][selectedLanguage];
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Affiliate Program Onboarding</h2>
        <p className="mt-2 text-gray-600">
          Configure tracking for your {businessCategory === "Product Based" ? "e-commerce catalog" : "subscription software plans"}.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-150 p-6 md:p-8">
        
        {/* CATEGORY 1: E-commerce Product Brands */}
        {businessCategory === "Product Based" && (
          <div className="space-y-6">
            <div className="flex justify-center gap-4 mb-6 border-b border-gray-150 pb-4">
              <button
                type="button"
                onClick={() => setActiveMethod("shopify")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeMethod === "shopify" 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Option 1: Shopify OAuth
              </button>
              <button
                type="button"
                onClick={() => setActiveMethod("custom")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeMethod === "custom" 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Option 2: Custom Webhook API
              </button>
            </div>

            {activeMethod === "shopify" && (
              <form onSubmit={handleShopifyConnect} className="space-y-6">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                  <ShoppingBag className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Shopify Integration Method</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Connect your store using official OAuth permissions. We automatically synchronize pricing, images, variants, stock, and track discount conversion events.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Shopify Store Domain</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. my-awesome-brand"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="text-base"
                    />
                    <span className="inline-flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm font-mono font-medium">
                      .myshopify.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">Please input your brand name or full myshopify domain.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    disabled={connectingShopify}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                  >
                    {connectingShopify ? "Initiating redirect..." : "Connect Shopify Store"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {activeMethod === "custom" && (
              <div className="space-y-6">
                {!customCredentials ? (
                  <div className="text-center py-6">
                    <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-800 text-base">Custom Headless CMS Developer Setup</h3>
                    <p className="text-gray-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                      Generate a private API key and tracking webhook endpoint. Your developers will push purchase events directly to Mipoe system.
                    </p>
                    <Button 
                      onClick={handleCustomConnect} 
                      disabled={activatingCustom}
                      className="bg-indigo-600 hover:bg-indigo-700 mt-5 font-semibold"
                    >
                      {activatingCustom ? "Activating..." : "Generate Webhook Key"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-800 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-950">Custom Webhook Integration Ready!</p>
                        <p className="text-green-700 text-xs mt-0.5">Please share these keys securely with your website developers.</p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-gray-50 border border-gray-150 rounded-xl p-5 font-medium text-xs text-gray-700">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Private API Key</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.api_key}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.api_key, "API Key")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Webhook Endpoint URL</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.webhook_url}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.webhook_url, "Webhook URL")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Webhook Signing Secret</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.webhook_secret}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.webhook_secret, "Webhook Secret")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-xl p-4 bg-slate-900 text-slate-100 font-mono text-[10px] leading-relaxed">
                      <span className="text-slate-400 block mb-1"># Developer Integration Payload Sample</span>
                      <pre className="overflow-x-auto whitespace-pre">{`POST ${customCredentials.webhook_url}\nHeaders:\n  Authorization: Bearer ${customCredentials.api_key.substring(0, 10)}...\n\nBody:\n{\n  "order_id": "ORD-993882",\n  "order_amount": 1850.00,\n  "currency": "INR",\n  "affiliate_reference": "ref_creator_username",\n  "product_id": "prod_123",\n  "product_name": "Premium Cotton Shirt"\n}`}</pre>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={onOnboardingCompleted} className="bg-green-650 hover:bg-green-700 text-white font-semibold">
                        Go to Catalog Workspace
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CATEGORY 2: SaaS Subscription Brands */}
        {businessCategory === "SaaS Based" && (
          <div className="space-y-6">
            
            {/* Step indicator */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-6 mb-6">
              {[
                { step: 1, label: "Select Gateway" },
                { step: 2, label: "Add Code" },
                { step: 3, label: "Verify Setup" },
                { step: 4, label: "Completed" }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    saasStep === item.step
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-150"
                      : saasStep > item.step
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {saasStep > item.step ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline ${
                    saasStep === item.step ? "text-indigo-600" : saasStep > item.step ? "text-green-600" : "text-gray-400"
                  }`}>{item.label}</span>
                  {item.step < 4 && <ChevronRight className="w-4 h-4 text-gray-300 hidden md:inline ml-2" />}
                </div>
              ))}
            </div>

            {/* STEP 1: Select Gateway */}
            {saasStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                  <Database className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">SaaS Affiliate Onboarding</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Select your billing provider. We will generate custom tracking hooks to log referral subscriptions and manage recurring commission payouts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                  >
                    {initializingSaas ? "Initializing..." : "Generate Webhook URL"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Code Integration */}
            {saasStep === 2 && saasCredentials && (
              <div className="space-y-6 animate-in fade-in duration-350">
                {integrationPath === null ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                      <Code className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800">Select Integration Method</p>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                          Choose how you want to integrate tracking into your application stack.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: Backend Server */}
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

                      {/* Option 2: Serverless Edge */}
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

                      {/* Option 3: Database Trigger Webhooks */}
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

                      {/* Option 4: Client-Side */}
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

                    <div className="flex justify-between pt-2 border-t border-gray-150">
                      <Button variant="outline" onClick={() => setSaasStep(1)}>
                        Back
                      </Button>
                      <Button onClick={() => setSaasStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                        Continue to Verification
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
                      ← Choose a different integration method
                    </button>

                    {/* API Credentials Card - Visible for reference */}
                    <div className="space-y-3 bg-gray-50 border border-gray-150 rounded-xl p-4 font-medium text-xs text-gray-700 font-sans">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Webhook Endpoint URL</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2 rounded-lg flex-1 text-gray-600 font-mono break-all">{saasCredentials.webhook_url}</code>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => copyToClipboard(saasCredentials.webhook_url, "Webhook URL")}>
                            <ClipboardCopy className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      {integrationPath !== "client_side" && (
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Private API Key</span>
                          <div className="flex gap-2">
                            <code className="bg-white border border-gray-200 p-2 rounded-lg flex-1 text-gray-600 font-mono break-all">{saasCredentials.api_key}</code>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => copyToClipboard(saasCredentials.api_key, "API Key")}>
                              <ClipboardCopy className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {integrationPath === "backend" && (
                      <BackendServerGuide
                        gateway={selectedGateway || ""}
                        apiKey={saasCredentials.api_key}
                        webhookUrl={saasCredentials.webhook_url}
                        copyToClipboard={copyToClipboard}
                      />
                    )}

                    {integrationPath === "serverless" && (
                      <ServerlessGuide
                        gateway={selectedGateway || ""}
                        apiKey={saasCredentials.api_key}
                        webhookUrl={saasCredentials.webhook_url}
                        copyToClipboard={copyToClipboard}
                      />
                    )}

                    {integrationPath === "db_webhook" && (
                      <DatabaseWebhookGuide
                        gateway={selectedGateway || ""}
                        apiKey={saasCredentials.api_key}
                        webhookUrl={saasCredentials.webhook_url}
                        copyToClipboard={copyToClipboard}
                      />
                    )}

                    {integrationPath === "client_side" && (
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

                    <div className="flex justify-between pt-2 border-t border-gray-150">
                      <Button variant="outline" onClick={() => setIntegrationPath(null)}>
                        Back to Methods
                      </Button>
                      <Button onClick={() => setSaasStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                        Continue to Verification
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Verification */}
            {saasStep === 3 && saasCredentials && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    Verify your <span className="font-serif italic text-indigo-650 font-normal">integration</span> telemetry
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                    We need to verify that your endpoint receives payment events and successfully forwards referral pings. Use the cURL command below to trigger a test event, or use our <span className="font-serif italic text-indigo-600">browser simulator</span> for a quick validation.
                  </p>
                </div>

                {/* Verification cURL */}
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

                {/* macOS Terminal Interface */}
                <div className="bg-slate-950/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono mt-4">
                  {/* macOS Style Bar */}
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
                  {/* Terminal Logs Content */}
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

                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" onClick={() => setSaasStep(2)}>
                    Back
                  </Button>
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Check Status
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Completed */}
            {saasStep === 4 && (
              <div className="space-y-6 text-center py-6 animate-in scale-in duration-300">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4 animate-bounce" />
                <h3 className="font-extrabold text-gray-900 text-xl">Integration Verified! ✅</h3>
                <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
                  Your SaaS subscription tracking is now fully active. We successfully received the test conversion webhook. You can now launch campaigns and map products to your partners.
                </p>

                <div className="pt-4">
                  <Button onClick={onOnboardingCompleted} className="bg-green-650 hover:bg-green-700 text-white font-semibold">
                    Go to Campaigns Workspace
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

interface InfoProps {
  className?: string;
}

const Info: React.FC<InfoProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.086 1.086L12.5 12.5l-.041.02a.75.75 0 11-1.086-1.086L11.25 11.25zM12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z" />
  </svg>
);
