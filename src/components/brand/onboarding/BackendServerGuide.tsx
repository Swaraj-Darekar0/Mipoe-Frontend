import React, { useState } from "react";
import { ClipboardCopy, Check, Server, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { ConnectionStatusSimulator } from "./ConnectionStatusSimulator";

interface BackendServerGuideProps {
  gateway: string;
  apiKey: string;
  webhookUrl: string;
  copyToClipboard: (text: string, label: string) => void;
}

export const BackendServerGuide: React.FC<BackendServerGuideProps> = ({
  gateway,
  apiKey,
  webhookUrl,
  copyToClipboard
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<"node" | "python" | "php" | "go">("node");
  const [selectedFramework, setSelectedFramework] = useState<string>("express");
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggleStep = (step: number) => {
    setOpenStep(openStep === step ? null : step);
  };

  const handleLanguageChange = (lang: "node" | "python" | "php" | "go") => {
    setSelectedLanguage(lang);
    if (lang === "node") setSelectedFramework("express");
    else if (lang === "python") setSelectedFramework("fastapi");
    else if (lang === "php") setSelectedFramework("laravel");
    else if (lang === "go") setSelectedFramework("gin");
  };

  const getFrameworksForLanguage = (lang: "node" | "python" | "php" | "go") => {
    if (lang === "node") return [
      { id: "express", label: "Express.js" },
      { id: "nestjs", label: "NestJS" },
      { id: "nextjs", label: "Next.js Route Handler" }
    ];
    if (lang === "python") return [
      { id: "fastapi", label: "FastAPI" },
      { id: "flask", label: "Flask" },
      { id: "django", label: "Django" }
    ];
    if (lang === "php") return [
      { id: "laravel", label: "Laravel" },
      { id: "vanilla", label: "Vanilla PHP" }
    ];
    return [
      { id: "gin", label: "Gin-Gonic" },
      { id: "net_http", label: "net/http (Standard)" }
    ];
  };

  const getFrameworkInstructions = (lang: "node" | "python" | "php" | "go", framework: string) => {
    const isStripe = gateway === "stripe";
    const isRazorpay = gateway === "razorpay";
    const isCashfree = gateway === "cashfree";
    const isPayu = gateway === "payu";

    const refMetaPath = isStripe ? "metadata.ref" : isRazorpay ? "notes.ref" : isPayu ? "udf1" : "metadata.affiliateCode";
    const eventName = isStripe ? "checkout.session.completed" : isRazorpay ? "subscription.charged" : isCashfree ? "SUBSCRIPTION_NEW_ORDER" : "payment success";

    let stepText = "";
    let mountSnippet = "";
    
    if (lang === "node") {
      if (framework === "express") {
        stepText = "In your Express server file (e.g., app.js or server.js), add this endpoint route. Note: Ensure you use express.raw() or express.text() middleware for this route so that rawBody is received as a Buffer or String; pre-parsed JSON will break signature verification.";
        mountSnippet = `// express.js route setup
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const result = await handle${isStripe ? "Stripe" : isRazorpay ? "Razorpay" : isCashfree ? "Cashfree" : "Payu"}Webhook(req.headers, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
});`;
      } else if (framework === "nestjs") {
        stepText = "Create a NestJS controller handler (e.g., webhook.controller.ts). Ensure you configure the raw body parser middleware in NestJS (e.g., using nestjs-raw-body package or custom middleware) so you get the raw Buffer.";
        mountSnippet = `@Post('webhook')
async handleWebhook(@Headers() headers: Record<string, string>, @Req() req: RawBodyRequest<Request>) {
  try {
    return await handle${isStripe ? "Stripe" : isRazorpay ? "Razorpay" : isCashfree ? "Cashfree" : "Payu"}Webhook(headers, req.rawBody);
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}`;
      } else if (framework === "nextjs") {
        stepText = "In your Next.js project, create a Route Handler file (e.g., app/api/webhook/route.ts). Next.js automatically provides request headers and lets you read the raw request text/buffer.";
        mountSnippet = `// Next.js Route Handler (app/api/webhook/route.ts)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const headers = Object.fromEntries(req.headers.entries());
  const rawBody = await req.text(); // Read raw text for signature checks
  
  try {
    const result = await handle${isStripe ? "Stripe" : isRazorpay ? "Razorpay" : isCashfree ? "Cashfree" : "Payu"}Webhook(headers, rawBody);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 400 });
  }
}`;
      }
    } else if (lang === "python") {
      if (framework === "fastapi") {
        stepText = "In your FastAPI application, define a route that takes the Request object directly. Read the raw body bytes asynchronously using await request.body() so signature checking succeeds.";
        mountSnippet = `@app.post("/webhook")
async def payment_webhook(request: Request):
    headers = dict(request.headers)
    body_bytes = await request.body()
    try:
        result = await handle_${gateway}_webhook(headers, body_bytes)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))`;
      } else if (framework === "flask") {
        stepText = "In your Flask app, read the raw body from request.get_data(). Since requests in Flask are synchronous, run your webhook processing synchronously or wrap it.";
        mountSnippet = `@app.route('/webhook', methods=['POST'])
def payment_webhook():
    headers = dict(request.headers)
    body_bytes = request.get_data() # Gets raw body
    try:
        # If your handler function is async, run it synchronously:
        # import asyncio
        # result = asyncio.run(handle_${gateway}_webhook(headers, body_bytes))
        result = handle_${gateway}_webhook_sync(headers, body_bytes) 
        return jsonify(result), 200
    except ValueError as e:
        return str(e), 400`;
      } else if (framework === "django") {
        stepText = "In Django, define a POST view. Disable CSRF checking using the @csrf_exempt decorator. Read the raw request body using request.body.";
        mountSnippet = `from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse

@csrf_exempt
def payment_webhook(request):
    if request.method == 'POST':
        headers = {k: v for k, v in request.headers.items()}
        body_bytes = request.body # Django raw body
        try:
            # Execute handler synchronously or asynchronously
            result = handle_${gateway}_webhook_sync(headers, body_bytes)
            return JsonResponse(result)
        except ValueError as e:
            return HttpResponse(str(e), status=400)
    return HttpResponse(status=405)`;
      }
    } else if (lang === "php") {
      if (framework === "laravel") {
        stepText = "In Laravel, add the webhook route inside routes/api.php. Ensure you add the route path to the except array of your VerifyCsrfToken middleware (or csrf middleware) to bypass CSRF token checks.";
        mountSnippet = `// routes/api.php
Route::post('/webhook', function (Request $request) {
    // Laravel handles request variables directly. 
    // You can access php://input raw data using $request->getContent()
    // Trigger signature verification and Mipoe dispatch
});`;
      } else {
        stepText = "For Vanilla PHP, paste the code snippet inside a publicly accessible .php endpoint file (e.g. webhook.php). It reads directly from raw php://input stream and Server variables.";
        mountSnippet = `// Raw vanilla PHP script execution
// Simply paste the snippet directly into webhook.php and configure env variables.`;
      }
    } else if (lang === "go") {
      if (framework === "gin") {
        stepText = "In Gin-Gonic, use c.GetRawData() to retrieve the request body bytes before parsing. Set header bindings appropriately.";
        mountSnippet = `router.POST("/webhook", func(c *gin.Context) {
    bodyBytes, err := c.GetRawData()
    if err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    // Call handler with headers and bodyBytes
})`;
      } else {
        stepText = "For standard Go net/http handler, read the request Body using io.ReadAll and pass the raw bytes to the signature verifier.";
        mountSnippet = `http.HandleFunc("/webhook", func(w http.ResponseWriter, r *http.Request) {
    bodyBytes, _ := io.ReadAll(r.Body)
    // Validate signature and forward to Mipoe
})`;
      }
    }

    const vibePrompt = `I need to integrate Mipoe's conversion tracking webhook into my backend server.
Please write a secure webhook endpoint for my project.

Context:
- Language & Framework: ${lang === "node" ? "Node.js" : lang === "python" ? "Python" : lang.toUpperCase()} (${framework.toUpperCase()})
- Payment Gateway: ${gateway.toUpperCase()}
- Webhook Event to listen for: ${eventName}
- Webhook Secret Env Var: GATEWAY_WEBHOOK_SECRET
- Mipoe Webhook URL: ${webhookUrl}
- Mipoe API Key Env Var: MIPOE_API_KEY

Requirements:
1. Verify the incoming request signature from ${gateway.toUpperCase()} using the secret key (GATEWAY_WEBHOOK_SECRET).
2. Parse the request body and extract the transaction ID, email, amount, currency, and the affiliate referral code from the metadata (usually ${refMetaPath}).
3. Dispatch a secure server-to-server POST request to Mipoe's webhook URL:
   - Header: Authorization: Bearer [MIPOE_API_KEY]
   - JSON Payload:
     {
       "event": "subscription.created",
       "subscription_id": "[extracted_subscription_id]",
       "customer_email": "[extracted_email]",
       "amount": [extracted_amount_in_base_units],
       "currency": "[extracted_currency_uppercase]",
       "plan_id": "[extracted_plan_id_or_default]",
       "interval": "[billing_interval_weekly_monthly_yearly]",
       "affiliate_code": "[extracted_affiliate_code]"
     }
4. Return a 200 OK status to the payment gateway. Include robust error handling and log any validation failures.
5. Provide instructions on where to paste this code inside my ${framework.toUpperCase()} application structure.`;

    return { stepText, mountSnippet, vibePrompt };
  };

  const steps = [
    {
      step: 1,
      title: "Pass Affiliate Reference in Checkout Metadata",
      description: "Ensure that your payment flow saves the customer's affiliate code inside the gateway's checkout metadata or custom fields so it is present in the webhook payload.",
      label: "Metadata fields to set:",
      info: "• Stripe: metadata.ref = referral_code\n• Razorpay: notes.ref = referral_code\n• PayU: udf1 = referral_code\n• Cashfree: customerDetails.affiliateCode = referral_code"
    },
    {
      step: 2,
      title: "Set up Webhook Endpoint on Your Server",
      description: "Register a secure public POST route in your backend server dashboard. Set your server to listen for checkout session completed or successful payment webhook triggers.",
      label: "Webhook Event Types:",
      info: "• Stripe: checkout.session.completed\n• Razorpay: subscription.charged or payment.captured\n• Cashfree: SUBSCRIPTION_NEW_ORDER"
    },
    {
      step: 3,
      title: "Verify Signature & Security Handshake",
      description: "Verify that incoming requests actually originate from your payment gateway. Extract the raw request body and compare signatures.",
      label: "Signature Header Names:",
      info: "• Stripe: Stripe-Signature\n• Razorpay: X-Razorpay-Signature\n• Cashfree: x-cf-signature"
    },
    {
      step: 4,
      title: "Forward Verified Transactions to Mipoe",
      description: "Extract the details (transaction ID, plan, email, currency, and affiliate code) and send a server-to-server POST request to Mipoe.",
      label: "Mipoe Target Endpoint details:",
      info: `• Webhook URL: ${webhookUrl}\n• Header: Authorization: Bearer [Your Mipoe API Key]`
    }
  ];

  const getSnippets = () => {
    const isStripe = gateway === "stripe";
    const isRazorpay = gateway === "razorpay";
    const isCashfree = gateway === "cashfree";
    const isPayu = gateway === "payu";

    const snippets = {
      node: "",
      python: "",
      php: "",
      go: "",
      ai_prompt: ""
    };

    const vibeCoderPrompt = `I need to integrate Mipoe's conversion tracking webhook into my backend server.
Please write a secure webhook endpoint for my project.

Context:
- Language & Framework: [Specify your language/framework, e.g., Python Flask, Node.js Fastify, Go Fiber, PHP Laravel]
- Payment Gateway: ${gateway.toUpperCase()}
- Webhook Event to listen for: ${
  isStripe ? "checkout.session.completed" : 
  isRazorpay ? "subscription.charged" : 
  isCashfree ? "SUBSCRIPTION_NEW_ORDER" : "payment success"
}
- Webhook Secret Env Var: GATEWAY_WEBHOOK_SECRET
- Mipoe Webhook URL: ${webhookUrl}
- Mipoe API Key Env Var: MIPOE_API_KEY

Requirements:
1. Verify the incoming request signature from ${gateway.toUpperCase()} using the secret key.
2. Parse the request body and extract the transaction ID, email, amount, currency, and the affiliate referral code from the metadata (usually ${
  isStripe ? "metadata.ref" : 
  isRazorpay ? "notes.ref" : 
  isPayu ? "udf1" : "metadata.affiliateCode"
}).
3. Dispatch a secure server-to-server POST request to Mipoe's webhook URL:
   - Header: Authorization: Bearer [MIPOE_API_KEY]
   - JSON Payload:
     {
       "event": "subscription.created",
       "subscription_id": "[extracted_subscription_id]",
       "customer_email": "[extracted_email]",
       "amount": [extracted_amount_in_base_units],
       "currency": "[extracted_currency_uppercase]",
       "plan_id": "[extracted_plan_id_or_default]",
       "interval": "[billing_interval_weekly_monthly_yearly]",
       "affiliate_code": "[extracted_affiliate_code]"
     }
4. Return a 200 OK status to the payment gateway. Include robust error handling and log any validation failures.`;

    snippets.ai_prompt = vibeCoderPrompt;

    if (isStripe) {
      snippets.node = `// Node.js (Framework-Agnostic Webhook Handler Function)
// Works with Express, Fastify, Next.js API Routes, or native Node.js http
const crypto = require('crypto');

/**
 * Validates and forwards Stripe webhook conversion data to Mipoe
 * @param {Object} headers - The raw HTTP request headers
 * @param {String|Buffer} rawBody - The raw request body (must not be pre-parsed)
 */
async function handleStripeWebhook(headers, rawBody) {
  const MIPOE_API_KEY = process.env.MIPOE_API_KEY;
  const MIPOE_WEBHOOK_URL = "${webhookUrl}";
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  // 1. Verify Webhook Signature (Stripe recommends using stripe.webhooks.constructEvent)
  const signature = headers['stripe-signature'];
  if (signature && STRIPE_WEBHOOK_SECRET) {
    // If using stripe npm library:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  }

  // 2. Parse and Map the transaction payload
  const data = JSON.parse(rawBody.toString('utf-8'));
  if (data.type === 'checkout.session.completed') {
    const session = data.data.object;
    const affiliateCode = session.metadata && session.metadata.ref;
    
    if (!affiliateCode) {
      console.log('Skipping: No affiliate referral code found.');
      return { status: 'ignored' };
    }

    // 3. Forward conversion payload to Mipoe API
    const response = await fetch(MIPOE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${MIPOE_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: session.subscription,
        customer_email: session.customer_details && session.customer_details.email,
        amount: session.amount_total ? Number(session.amount_total) / 100 : 0,
        currency: (session.currency || 'USD').toUpperCase(),
        plan_id: (session.metadata && session.metadata.plan_id) || 'default',
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: affiliateCode
      })
    });
    return { status: 'success', mipoeStatus: response.status };
  }
  return { status: 'ignored' };
}`;

      snippets.python = `# Python (Framework-Agnostic Webhook Handler Function)
# Works with FastAPI, Flask, Django, or standard http.server
import os
import stripe
import httpx

async def handle_stripe_webhook(headers: dict, body_bytes: bytes) -> dict:
    """
    Validates and forwards Stripe webhook conversion data to Mipoe
    :param headers: Dictionary of request headers (case-insensitive keys)
    :param body_bytes: Raw request body as bytes
    """
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    MIPOE_API_KEY = os.getenv("MIPOE_API_KEY")
    MIPOE_WEBHOOK_URL = "${webhookUrl}"

    # 1. Verify Webhook Signature securely
    headers_lower = {k.lower(): v for k, v in headers.items()}
    stripe_signature = headers_lower.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(body_bytes, stripe_signature, endpoint_secret)
    except Exception as e:
        raise ValueError(f"Webhook signature verification failed: {e}")

    # 2. Parse and Map the transaction payload
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        affiliate_code = session.get("metadata", {}).get("ref")
        
        if not affiliate_code:
            return {"status": "ignored", "reason": "No affiliate referral code found"}

        # 3. Forward conversion payload to Mipoe API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MIPOE_WEBHOOK_URL,
                headers={"Authorization": f"Bearer {MIPOE_API_KEY}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": session.get("subscription"),
                    "customer_email": session.get("customer_details", {}).get("email"),
                    "amount": session.get("amount_total") / 100,
                    "currency": session.get("currency", "usd").upper(),
                    "plan_id": session.get("metadata", {}).get("plan_id", "default"),
                    "interval": "monthly", # 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
                    "affiliate_code": affiliate_code
                }
            )
            return {"status": "success", "mipoe_status": response.status_code}
    return {"status": "ignored"}`;

      snippets.php = `<?php
// PHP (Stripe Webhook handler)
// Install via Composer: composer require stripe/stripe-php
require_once 'vendor/autoload.php';

\\Stripe\\Stripe::setApiKey('YOUR_STRIPE_SECRET_KEY');
$endpointSecret = 'YOUR_STRIPE_WEBHOOK_SECRET';
$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'];

try {
    $event = \\Stripe\\Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
} catch(\\UnexpectedValueException $e) {
    http_response_code(400);
    exit();
} catch(\\Stripe\\Exception\\SignatureVerificationException $e) {
    http_response_code(400);
    exit();
}

if ($event->type === 'checkout.session.completed') {
    $session = $event->data->object;
    
    // Post to Mipoe API
    $ch = curl_init('${webhookUrl}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $session->subscription,
        'customer_email' => $session->customer_details->email,
        'amount' => $session->amount_total / 100,
        'currency' => strtoupper($session->currency),
        'plan_id' => $session->metadata->plan_id ?? 'default',
        'interval' => 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        'affiliate_code' => $session->metadata->ref ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}
http_response_code(200);`;

      snippets.go = `package main
// Go / Golang (Stripe Webhook handler)
import (
	"bytes"
	"encoding/json"
	"net/http"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/webhook"
)

func stripeWebhookHandler(w http.ResponseWriter, req *http.Request) {
	const MaxBodyBytes = int64(65536)
	req.Body = http.MaxBytesReader(w, req.Body, MaxBodyBytes)
	
	payload, err := io.ReadAll(req.Body)
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	event, err := webhook.ConstructEvent(payload, req.Header.Get("Stripe-Signature"), "YOUR_STRIPE_WEBHOOK_SECRET")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if event.Type == "checkout.session.completed" {
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err == nil {
			// Trigger Mipoe Conversion API
			mipoePayload := map[string]interface{}{
				"event":           "subscription.created",
				"subscription_id": session.Subscription.ID,
				"customer_email":  session.CustomerDetails.Email,
				"amount":          float64(session.AmountTotal) / 100.0,
				"currency":        string(session.Currency),
				"plan_id":         session.Metadata["plan_id"],
				"interval":        "monthly", // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
				"affiliate_code":  session.Metadata["ref"],
			}
			jsonBody, _ := json.Marshal(mipoePayload)
			
			clientReq, _ := http.NewRequest("POST", "${webhookUrl}", bytes.NewBuffer(jsonBody))
			clientReq.Header.Set("Authorization", "Bearer ${apiKey}")
			clientReq.Header.Set("Content-Type", "application/json")
			
			client := &http.Client{}
			client.Do(clientReq)
		}
	}
	w.WriteHeader(http.StatusOK)
}`;
    } else if (isRazorpay) {
      snippets.node = `// Node.js (Framework-Agnostic Webhook Handler Function)
// Works with Express, Fastify, Next.js API Routes, or native Node.js http
const crypto = require('crypto');

/**
 * Validates and forwards Razorpay webhook conversion data to Mipoe
 * @param {Object} headers - The raw HTTP request headers
 * @param {String|Buffer} rawBody - The raw request body (must not be pre-parsed)
 */
async function handleRazorpayWebhook(headers, rawBody) {
  const MIPOE_API_KEY = process.env.MIPOE_API_KEY;
  const MIPOE_WEBHOOK_URL = "${webhookUrl}";
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Verify Webhook Signature securely
  const signature = headers['x-razorpay-signature'];
  if (signature && RAZORPAY_WEBHOOK_SECRET) {
    const computedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
    if (!isValid) {
      throw new Error('Invalid signature verification failed');
    }
  }

  // 2. Parse and Map the transaction payload
  const data = JSON.parse(rawBody.toString('utf-8'));
  
  if (data.event === 'subscription.charged') {
    const payment = data.payload.payment.entity;
    const subscription = data.payload.subscription.entity;
    const affiliateCode = payment.notes && payment.notes.ref;

    if (!affiliateCode) {
      console.log('Skipping: No affiliate referral code found.');
      return { status: 'ignored' };
    }

    // 3. Forward conversion payload to Mipoe API
    const response = await fetch(MIPOE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${MIPOE_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: subscription.id,
        customer_email: payment.email,
        amount: payment.amount ? Number(payment.amount) / 100 : 0,
        currency: (payment.currency || 'INR').toUpperCase(),
        plan_id: subscription.plan_id,
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: affiliateCode
      })
    });
    return { status: 'success', mipoeStatus: response.status };
  }
  return { status: 'ignored' };
}`;

      snippets.python = `# Python (Framework-Agnostic Webhook Handler Function)
# Works with FastAPI, Flask, Django, or standard http.server
import os
import hmac
import hashlib
import json
import httpx

async def handle_razorpay_webhook(headers: dict, body_bytes: bytes) -> dict:
    """
    Validates and forwards Razorpay webhook conversion data to Mipoe
    :param headers: Dictionary of request headers (case-insensitive keys)
    :param body_bytes: Raw request body as bytes
    """
    WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "YOUR_RAZORPAY_WEBHOOK_SECRET").encode()
    MIPOE_API_KEY = os.getenv("MIPOE_API_KEY")
    MIPOE_WEBHOOK_URL = "${webhookUrl}"

    # 1. Verify Webhook Signature securely
    headers_lower = {k.lower(): v for k, v in headers.items()}
    x_razorpay_signature = headers_lower.get("x-razorpay-signature")
    sig = hmac.new(WEBHOOK_SECRET, body_bytes, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, x_razorpay_signature or ""):
        raise ValueError("Signature verification failed")

    # 2. Parse and Map the transaction payload
    data = json.loads(body_bytes.decode("utf-8"))
    event = data.get("event")
    
    if event == "subscription.charged":
        payment = data["payload"]["payment"]["entity"]
        sub = data["payload"]["subscription"]["entity"]
        affiliate_code = payment.get("notes", {}).get("ref")
        
        if not affiliate_code:
            return {"status": "ignored", "reason": "No affiliate referral code found"}

        # 3. Forward conversion payload to Mipoe API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MIPOE_WEBHOOK_URL,
                headers={"Authorization": f"Bearer {MIPOE_API_KEY}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": sub.get("id"),
                    "customer_email": payment.get("email"),
                    "amount": payment.get("amount") / 100,
                    "currency": payment.get("currency", "INR"),
                    "plan_id": sub.get("plan_id"),
                    "interval": "monthly", # 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
                    "affiliate_code": affiliate_code
                }
            )
            return {"status": "success", "mipoe_status": response.status_code}
    return {"status": "ignored"}`;

      snippets.php = `<?php
// PHP (Razorpay Webhook handler)
$secret = 'YOUR_RAZORPAY_WEBHOOK_SECRET';
$payload = @file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'];

$expectedSignature = hash_hmac('sha256', $payload, $secret);

if ($signature !== $expectedSignature) {
    http_response_code(400);
    exit();
}

$data = json_decode($payload);

if ($data->event === 'subscription.charged') {
    $payment = $data->payload->payment->entity;
    $sub = $data->payload->subscription->entity;
    
    $ch = curl_init('${webhookUrl}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $sub->id,
        'customer_email' => $payment->email,
        'amount' => $payment->amount / 100,
        'currency' => $payment->currency,
        'plan_id' => $sub->plan_id,
        'interval' => 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        'affiliate_code' => $payment->notes->ref ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}
http_response_code(200);`;

      snippets.go = `package main
// Go (Razorpay Webhook handler)
import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
)

func razorpayWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	sig := r.Header.Get("X-Razorpay-Signature")
	
	mac := hmac.New(sha256.New, []byte("YOUR_RAZORPAY_WEBHOOK_SECRET"))
	mac.Write(body)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if sig != expectedSig {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var data map[string]interface{}
	json.Unmarshal(body, &data)
	
	if data["event"] == "subscription.charged" {
		payload := data["payload"].(map[string]interface{})
		payment := payload["payment"].(map[string]interface{})["entity"].(map[string]interface{})
		subscription := payload["subscription"].(map[string]interface{})["entity"].(map[string]interface{})
		
		notes := payment["notes"].(map[string]interface{})
		
		mipoePayload := map[string]interface{}{
			"event":           "subscription.created",
			"subscription_id": subscription["id"],
			"customer_email":  payment["email"],
			"amount":          payment["amount"].(float64) / 100.0,
			"currency":        payment["currency"],
			"plan_id":         subscription["plan_id"],
			"interval":        "monthly", // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
			"affiliate_code":  notes["ref"],
		}
		// Dispatch API post request to Mipoe
	}
	w.WriteHeader(http.StatusOK)
}`;
    } else if (isCashfree) {
      snippets.node = `// Node.js (Framework-Agnostic Webhook Handler Function)
// Works with Express, Fastify, Next.js API Routes, or native Node.js http
async function handleCashfreeWebhook(headers, rawBody) {
  const MIPOE_API_KEY = process.env.MIPOE_API_KEY;
  const MIPOE_WEBHOOK_URL = "${webhookUrl}";
  
  const data = JSON.parse(rawBody.toString('utf-8'));
  if (data.event === 'SUBSCRIPTION_NEW_ORDER') {
    const response = await fetch(MIPOE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${MIPOE_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: data.subscriptionId,
        customer_email: data.customerEmail,
        amount: data.orderAmount,
        currency: 'INR',
        plan_id: data.planId,
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: data.affiliateCode // passed in metadata
      })
    });
    return { status: 'success', mipoeStatus: response.status };
  }
  return { status: 'ignored' };
}`;

      snippets.python = `# Python (Framework-Agnostic Webhook Handler Function)
# Works with FastAPI, Flask, Django, or standard http.server
import os
import httpx
import json

async def handle_cashfree_webhook(headers: dict, body_bytes: bytes) -> dict:
    MIPOE_API_KEY = os.getenv("MIPOE_API_KEY")
    MIPOE_WEBHOOK_URL = "${webhookUrl}"
    
    data = json.loads(body_bytes.decode("utf-8"))
    if data.get("event") == "SUBSCRIPTION_NEW_ORDER":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MIPOE_WEBHOOK_URL,
                headers={"Authorization": f"Bearer {MIPOE_API_KEY}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": data.get("subscriptionId"),
                    "customer_email": data.get("customerEmail"),
                    "amount": data.get("orderAmount"),
                    "currency": "INR",
                    "plan_id": data.get("planId"),
                    "interval": "monthly", # 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
                    "affiliate_code": data.get("affiliateCode")
                }
            )
            return {"status": "success", "mipoe_status": response.status_code}
    return {"status": "ignored"}`;

      snippets.php = `<?php
// PHP (Cashfree Webhook)
$data = json_decode(@file_get_contents('php://input'));
if ($data->event === 'SUBSCRIPTION_NEW_ORDER') {
    $ch = curl_init('${webhookUrl}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $data->subscriptionId,
        'customer_email' => $data->customerEmail,
        'amount' => $data->orderAmount,
        'currency' => 'INR',
        'plan_id' => $data->planId,
        'interval' => 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        'affiliate_code' => $data->affiliateCode ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`;

      snippets.go = `// Go (Cashfree Webhook)
// Parse JSON body, check data.event == "SUBSCRIPTION_NEW_ORDER"
// Post JSON payload back to Mipoe at ${webhookUrl}`;
    } else if (isPayu) {
      snippets.node = `// Node.js (Framework-Agnostic Webhook Handler Function)
// Works with Express, Fastify, Next.js API Routes, or native Node.js http
async function handlePayuWebhook(headers, urlEncodedBodyString) {
  const MIPOE_API_KEY = process.env.MIPOE_API_KEY;
  const MIPOE_WEBHOOK_URL = "${webhookUrl}";
  
  const params = new URLSearchParams(urlEncodedBodyString);
  if (params.get('status') === 'success') {
    const response = await fetch(MIPOE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${MIPOE_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: params.get('txnid'),
        customer_email: params.get('email'),
        amount: Number(params.get('amount')),
        currency: 'INR',
        plan_id: params.get('productinfo'),
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: params.get('udf1') // User Defined Field 1 used for affiliate code
      })
    });
    return { status: 'success', mipoeStatus: response.status };
  }
  return { status: 'ignored' };
}`;

      snippets.python = `# Python (Framework-Agnostic Webhook Handler Function)
# Works with FastAPI, Flask, Django, or standard http.server
import os
import httpx
from urllib.parse import parse_qs

async def handle_payu_webhook(headers: dict, body_bytes: bytes) -> dict:
    MIPOE_API_KEY = os.getenv("MIPOE_API_KEY")
    MIPOE_WEBHOOK_URL = "${webhookUrl}"
    
    # PayU webhook sends URL-encoded form data
    params = {k: v[0] for k, v in parse_qs(body_bytes.decode("utf-8")).items()}
    if params.get("status") == "success":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MIPOE_WEBHOOK_URL,
                headers={"Authorization": f"Bearer {MIPOE_API_KEY}", "Content-Type": "application/json"},
                json={
                    "event": "subscription.created",
                    "subscription_id": params.get("txnid"),
                    "customer_email": params.get("email"),
                    "amount": float(params.get("amount", 0)),
                    "currency": "INR",
                    "plan_id": params.get("productinfo"),
                    "interval": "monthly", # 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
                    "affiliate_code": params.get("udf1")
                }
            )
            return {"status": "success", "mipoe_status": response.status_code}
    return {"status": "ignored"}`;

      snippets.php = `<?php
// PHP (PayU Success callback)
if ($_POST['status'] === 'success') {
    $ch = curl_init('${webhookUrl}');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'subscription_id' => $_POST['txnid'],
        'customer_email' => $_POST['email'],
        'amount' => $_POST['amount'],
        'currency' => 'INR',
        'plan_id' => $_POST['productinfo'],
        'interval' => 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        'affiliate_code' => $_POST['udf1'] ?? null
    ]));
    curl_exec($ch);
    curl_close($ch);
}`;

      snippets.go = `// Go (PayU Success callback)
// Extract txnid, amount, email, productinfo, and udf1 (containing affiliate code)
// Post JSON payload back to Mipoe at ${webhookUrl}`;
    }

    return snippets;
  };

  const snippets = getSnippets();
  const currentSnippet = snippets[selectedLanguage] || "";

  const handleCopy = () => {
    const label = `${selectedLanguage.toUpperCase()} Snippet`;
    copyToClipboard(currentSnippet, label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = () => {
    const { vibePrompt } = getFrameworkInstructions(selectedLanguage, selectedFramework);
    copyToClipboard(vibePrompt, "Vibe Coder AI Prompt");
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const frameworks = getFrameworksForLanguage(selectedLanguage);
  const { stepText, mountSnippet, vibePrompt } = getFrameworkInstructions(selectedLanguage, selectedFramework);

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-5 flex gap-4">
        <Server className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Traditional Backend API Integration</h4>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Integrate conversion tracking directly into your secure backend server application. Hook into payment gateway callbacks/webhooks so conversions are sent server-to-server.
          </p>
        </div>
      </div>

      {/* Collapsible Steps Accordion */}
      <div className="space-y-3">
        <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider text-slate-400">Integration Steps Checklist</h5>
        <div className="space-y-2.5">
          {steps.map((item) => {
            const isOpen = openStep === item.step;
            return (
              <div key={item.step} className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-gray-300">
                <button
                  type="button"
                  onClick={() => toggleStep(item.step)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isOpen ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-200 text-gray-600"}`}>
                      {item.step}
                    </span>
                    <span className="font-bold text-gray-800 text-xs">{item.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-gray-100 bg-white text-xs text-gray-600 space-y-3 leading-relaxed animate-in slide-in-from-top-2 duration-205">
                    <p>{item.description}</p>
                    {item.info && (
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                        <span className="block font-bold text-gray-700 text-[10px] uppercase mb-1.5">{item.label}</span>
                        <pre className="font-mono text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed">{item.info}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-gray-850 text-xs uppercase tracking-wider text-slate-400">Implementation Code Snippets</h5>
        </div>

        {/* Language Selection Buttons */}
        <div className="flex justify-start gap-2 border-b border-gray-150 pb-2">
          {(["node", "python", "php", "go"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedLanguage === lang
                  ? "bg-slate-900 text-slate-100 shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {lang === "node" ? "Node.js" : lang === "python" ? "Python" : lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Framework Sub-selectors */}
        <div className="space-y-2 bg-gray-50/50 p-3.5 rounded-xl border border-gray-150">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Choose Web Framework:</span>
          <div className="flex flex-wrap gap-2">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => setSelectedFramework(fw.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  selectedFramework === fw.id
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generic Code Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">1. Framework-Agnostic Webhook Handler Function:</span>
            <span className="text-[10px] text-gray-400">Paste this helper function in your project</span>
          </div>
          <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-7 w-7 flex items-center justify-center rounded transition-all border border-slate-800"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            </button>
            <pre className="overflow-x-auto whitespace-pre max-h-[300px] pr-8">{currentSnippet}</pre>
          </div>
        </div>

        {/* Mounting steps */}
        <div className="space-y-2 bg-indigo-50/20 border border-indigo-100/60 p-4 rounded-xl">
          <span className="text-xs font-bold text-indigo-950 block">2. How to mount in your {frameworks.find(f => f.id === selectedFramework)?.label || selectedFramework} application:</span>
          <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{stepText}</p>
          {mountSnippet && (
            <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed mt-2 relative">
              <button
              title="copyPrompt"
                type="button"
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-6 w-6 flex items-center justify-center rounded transition-all border border-slate-800"
                onClick={() => {
                  copyToClipboard(mountSnippet, `${selectedFramework.toUpperCase()} Mount snippet`);
                }}
              >
                <ClipboardCopy className="w-3 h-3" />
              </button>
              <pre className="overflow-x-auto whitespace-pre max-h-[200px]">{mountSnippet}</pre>
            </div>
          )}
        </div>

        {/* Vibe Coder AI Prompt Section */}
        <div className="space-y-3 pt-3 border-t border-gray-150">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                 3. Vibe Coder AI Integration Prompt
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">Copy & paste this prompt directly into Cursor / Copilot / ChatGPT to generate the entire endpoint</p>
            </div>
            
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-300" />
                  Copied Prompt!
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  Copy AI Prompt
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap select-all scrollbar-thin scrollbar-thumb-slate-800">
            {vibePrompt}
          </div>
        </div>
      </div>

      {/* Live Integration Sandbox */}
      <div className="pt-4 border-t border-gray-150">
        <ConnectionStatusSimulator gateway={gateway} />
      </div>
    </div>
  );
};
