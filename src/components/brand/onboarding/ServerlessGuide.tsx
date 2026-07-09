import React, { useState } from "react";
import { ClipboardCopy, Check, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { ConnectionStatusSimulator } from "./ConnectionStatusSimulator";

interface ServerlessGuideProps {
  gateway: string;
  apiKey: string;
  webhookUrl: string;
  copyToClipboard: (text: string, label: string) => void;
}

export const ServerlessGuide: React.FC<ServerlessGuideProps> = ({
  gateway,
  apiKey,
  webhookUrl,
  copyToClipboard
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<"supabase" | "lambda">("supabase");
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggleStep = (step: number) => {
    setOpenStep(openStep === step ? null : step);
  };

  const steps = selectedPlatform === "supabase" ? [
    {
      step: 1,
      title: "Create a New Supabase Edge Function",
      description: "Initialize a new Supabase edge function using the CLI inside your project root folder.",
      label: "CLI Command:",
      info: "supabase functions new mipoe-conversion-sync"
    },
    {
      step: 2,
      title: "Save Secret Environment Keys",
      description: "Configure edge environment variables inside your Supabase dashboard or deploy them via CLI so the script has access to API secrets securely.",
      label: "Required Environment Secrets:",
      info: `MIPOE_API_KEY=[Your Mipoe API Key]\nSTRIPE_WEBHOOK_SECRET=[Stripe Webhook Secret]\nRAZORPAY_WEBHOOK_SECRET=[Razorpay Webhook Secret]`
    },
    {
      step: 3,
      title: "Implement Signature Validation",
      description: "Ensure the edge function validates incoming cryptographic hashes using your gateway secret before processing the event.",
      label: "Handled Webhook Headers:",
      info: "• Stripe: stripe-signature\n• Razorpay: x-razorpay-signature"
    },
    {
      step: 4,
      title: "Forward Referrals to Mipoe",
      description: "Deploy the function. Once signature validation succeeds, retrieve metadata. If (and only if) the affiliate referral code is present, forward DPD details server-to-server; otherwise, ignore it.",
      label: "Mipoe Verification URL:",
      info: `Webhook Endpoint: ${webhookUrl}`
    }
  ] : [
    {
      step: 1,
      title: "Create an AWS Lambda Function",
      description: "Create a Node.js Lambda function in your AWS Console. Configure an HTTP API Gateway endpoint as a trigger to make the function accessible."
    },
    {
      step: 2,
      title: "Set Environment Variables",
      description: "Store your gateway keys and Mipoe authentication details securely under the Lambda Configuration -> Environment variables tab.",
      label: "Lambda Env Keys:",
      info: "• STRIPE_SECRET_KEY / RAZORPAY_WEBHOOK_SECRET\n• MIPOE_API_KEY"
    },
    {
      step: 3,
      title: "Verify Webhook Signature",
      description: "Extract signature headers inside the Lambda handler and perform cryptographic hash verification.",
      label: "Signature Event Verification:",
      info: "Compare incoming request signature against calculated HMAC signature or Stripe SDK constructEvent validator."
    },
    {
      step: 4,
      title: "Forward Referrals to Mipoe",
      description: "Invoke a fetch POST request inside AWS Lambda to report details and referral code to Mipoe only when a valid affiliate code is present.",
      label: "Payload details:",
      info: `Post URL: ${webhookUrl}\nAuthorization: Bearer [Your Mipoe API Key]`
    }
  ];

  const getSnippets = () => {
    const isStripe = gateway === "stripe";
    const isRazorpay = gateway === "razorpay";

    const snippets = {
      supabase: "",
      lambda: ""
    };

    if (isStripe) {
      snippets.supabase = `// Supabase Edge Function (Deno TypeScript)
// Create a new function: supabase functions new stripe-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@10.13.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const affiliateCode = session.metadata?.ref

      // Only forward to Mipoe if referral code is present
      if (!affiliateCode) {
        return new Response(JSON.stringify({ ignored: true, reason: 'No affiliate code' }), { 
          headers: { 'Content-Type': 'application/json' } 
        })
      }
      
      const res = await fetch('${webhookUrl}', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ${apiKey}',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'subscription.created',
          subscription_id: session.subscription,
          customer_email: session.customer_details?.email,
          amount: session.amount_total / 100,
          currency: session.currency.toUpperCase(),
          plan_id: session.metadata?.plan_id || 'default',
          interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
          affiliate_code: affiliateCode
        })
      })
      console.log('Mipoe verification responded:', res.status)
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(\`Error: \${err.message}\`, { status: 400 })
  }
})`;

      snippets.lambda = `// AWS Lambda Node.js Webhook Handler
// Environment Variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    return { statusCode: 400, body: \`Webhook Error: \${err.message}\` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const affiliateCode = session.metadata?.ref;

    // Only forward to Mipoe if referral code is present
    if (!affiliateCode) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ ignored: true, reason: 'No affiliate code' }) 
      };
    }
    
    await fetch('${webhookUrl}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: session.subscription,
        customer_email: session.customer_details.email,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        plan_id: session.metadata.plan_id || 'default',
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: affiliateCode
      })
    });
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};`;
    } else {
      // Razorpay or cashfree/payu
      snippets.supabase = `// Supabase Edge Function (Deno TypeScript) for Razorpay
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HmacSHA256 } from "https://esm.sh/crypto-js"

serve(async (req) => {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || ''

    const expectedSig = HmacSHA256(body, secret).toString()
    if (signature !== expectedSig) {
      return new Response('Invalid signature', { status: 400 })
    }

    const data = JSON.parse(body)
    if (data.event === 'subscription.charged') {
      const payment = data.payload.payment.entity
      const subscription = data.payload.subscription.entity
      const affiliateCode = payment.notes?.ref

      // Only forward to Mipoe if referral code is present
      if (!affiliateCode) {
        return new Response(JSON.stringify({ ignored: true, reason: 'No affiliate code' }), { 
          headers: { 'Content-Type': 'application/json' } 
        })
      }

      const res = await fetch('${webhookUrl}', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ${apiKey}',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'subscription.created',
          subscription_id: subscription.id,
          customer_email: payment.email,
          amount: payment.amount / 100,
          currency: payment.currency,
          plan_id: subscription.plan_id,
          interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
          affiliate_code: affiliateCode
        })
      })
      console.log('Mipoe verification responded:', res.status)
    }

    return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(\`Error: \${err.message}\`, { status: 400 })
  }
})`;

      snippets.lambda = `// AWS Lambda Node.js Webhook Handler for Razorpay
const crypto = require('crypto');

exports.handler = async (event) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'];
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(event.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { statusCode: 400, body: 'Invalid signature' };
  }

  const data = JSON.parse(event.body);

  if (data.event === 'subscription.charged') {
    const payment = data.payload.payment.entity;
    const subscription = data.payload.subscription.entity;
    const affiliateCode = payment.notes?.ref;

    // Only forward to Mipoe if referral code is present
    if (!affiliateCode) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ ignored: true, reason: 'No affiliate code' }) 
      };
    }

    await fetch('${webhookUrl}', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'subscription.created',
        subscription_id: subscription.id,
        customer_email: payment.email,
        amount: payment.amount / 100,
        currency: payment.currency,
        plan_id: subscription.plan_id,
        interval: 'monthly', // 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
        affiliate_code: affiliateCode
      })
    });
  }

  return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };
};`;
    }

    return snippets;
  };

  const snippets = getSnippets();
  const currentSnippet = snippets[selectedPlatform] || "";

  const handleCopy = () => {
    copyToClipboard(currentSnippet, `${selectedPlatform === "supabase" ? "Supabase Edge" : "AWS Lambda"} Snippet`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-5 flex gap-4">
        <Cpu className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Serverless Edge Functions</h4>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Deploy thin serverless handler functions that receive webhook payloads, verify them with the gateway client library, and forward them safely to Mipoe.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-start gap-2 border-b border-gray-150 pb-2">
          <button
            type="button"
            onClick={() => setSelectedPlatform("supabase")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              selectedPlatform === "supabase"
                ? "bg-slate-900 text-slate-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Supabase Edge (Deno TS)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform("lambda")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              selectedPlatform === "lambda"
                ? "bg-slate-900 text-slate-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            AWS Lambda (Node.js)
          </button>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold text-gray-850 text-xs uppercase tracking-wider text-slate-400">Integration Steps Checklist</h5>

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

          <h5 className="font-bold text-gray-850 text-xs uppercase tracking-wider text-slate-400 pt-2">Serverless Code Configuration</h5>

          <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-7 w-7 flex items-center justify-center rounded transition-all border border-slate-800"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            </button>
            <pre className="overflow-x-auto whitespace-pre max-h-[350px] pr-8">{currentSnippet}</pre>
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
