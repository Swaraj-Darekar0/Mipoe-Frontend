import React, { useState } from "react";
import { ClipboardCopy, Check, Database, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { ConnectionStatusSimulator } from "./ConnectionStatusSimulator";

interface DatabaseWebhookGuideProps {
  gateway: string;
  apiKey: string;
  webhookUrl: string;
  copyToClipboard: (text: string, label: string) => void;
}

export const DatabaseWebhookGuide: React.FC<DatabaseWebhookGuideProps> = ({
  gateway,
  apiKey,
  webhookUrl,
  copyToClipboard
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<"supabase" | "hasura">("supabase");
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggleStep = (step: number) => {
    setOpenStep(openStep === step ? null : step);
  };

  const steps = selectedPlatform === "supabase" ? [
    {
      step: 1,
      title: "Sync Payment Gateway to Database",
      description: "Ensure that your checkout or subscription rows are synchronized in real-time to your Supabase PostgreSQL database (e.g. using a Stripe-Supabase wrapper/extension or standard API database inserts)."
    },
    {
      step: 2,
      title: "Create Supabase Database Webhook",
      description: "Go to your Supabase Dashboard -> Database -> Webhooks. Click 'Create Webhook' and fill in the basic event metadata details.",
      label: "Basic Settings:",
      info: "• Name: mipoe_conversion_sync\n• Schema: public\n• Table: [Choose your subscriptions or purchases table]\n• Events: Check 'Insert'"
    },
    {
      step: 3,
      title: "Configure Target URL & Auth Headers",
      description: "Under the Webhook settings, choose HTTP POST method and enter Mipoe's verification webhook endpoint and Auth headers.",
      label: "Webhook Target details:",
      info: `• Webhook URL: ${webhookUrl}\n• Header: Authorization: Bearer ${apiKey}`
    },
    {
      step: 4,
      title: "Deploy PostgreSQL Trigger to Format Payload",
      description: "Create a PL/pgSQL database trigger function that compiles the required payment fields and conditionally invokes Mipoe's webhook automatically via the pg_net extension only when a referral code is present.",
      label: "SQL Trigger Action:",
      info: "See the Supabase PostgreSQL Trigger template script below."
    }
  ] : [
    {
      step: 1,
      title: "Open Event Triggers Panel in Hasura",
      description: "Login to your Hasura Console. Go to the Data tab, select your subscriptions or orders table, navigate to the 'Event Triggers' tab, and click 'Create'."
    },
    {
      step: 2,
      title: "Configure Hasura Event Operations",
      description: "Set the Trigger Name to 'notify_mipoe_conversion' and select 'Insert' as the database operation trigger.",
      label: "Trigger Event Settings:",
      info: "• Name: notify_mipoe_conversion\n• Operations: Insert"
    },
    {
      step: 3,
      title: "Configure Webhook URL & Authentication",
      description: "Set the webhook destination and add authentication headers so Hasura can authorize the payload with Mipoe.",
      label: "Endpoint configurations:",
      info: `• Webhook URL: ${webhookUrl}\n• Headers:\n  - Authorization: Bearer ${apiKey}\n  - Content-Type: application/json`
    },
    {
      step: 4,
      title: "Verify JSON Schema & Mapping",
      description: "Hasura will POST the newly inserted row automatically. Mipoe parses Hasura's payload shape natively.",
      label: "JSON Event Sample:",
      info: "See the Hasura Event Trigger Body sample mapping below."
    }
  ];

  const getInstructions = () => {
    const isStripe = gateway === "stripe";

    if (selectedPlatform === "supabase") {
      return {
        title: "Setup Supabase Database Webhook (Zero Code)",
        steps: [
          "Ensure you synchronize your checkout data or subscription tables into your PostgreSQL database in real-time (e.g. using a Stripe-Supabase wrapper/extension or standard DB insertions).",
          "Go to your Supabase Dashboard -> Database -> Webhooks.",
          "Click 'Create Webhook' and configure the settings:",
          "  - Name: 'mipoe_conversion_sync'",
          "  - Schema: 'public'",
          "  - Table: Choose your subscriptions or orders table (e.g. 'subscriptions' or 'purchases')",
          "  - Events: Check 'Insert' (and optionally 'Update' if tracking lifecycle updates)",
          "  - Type: Choose 'HTTP POST'",
          "  - URL: '" + webhookUrl + "'",
          "  - HTTP Headers: Add 'Authorization' with value 'Bearer " + apiKey + "'",
          "Create a Database Trigger on row insertion that automatically fetches the row's payment fields and formats them to invoke the webhook. See the trigger sample code below."
        ],
        code: `-- Supabase PostgreSQL Trigger to parse and dispatch conversion webhook
CREATE OR REPLACE FUNCTION public.notify_mipoe_conversion()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Construct the payload dynamically from your subscription/payment row fields
  payload := jsonb_build_object(
    'event', 'subscription.created',
    'subscription_id', NEW.stripe_subscription_id, -- Maps subscription ref
    'customer_email', NEW.email,
    'amount', NEW.price_amount,
    'currency', UPPER(NEW.currency),
    'plan_id', NEW.plan_name,
    'interval', NEW.billing_interval, -- 'weekly', 'monthly', or 'yearly' (maps to campaign schedule)
    'affiliate_code', NEW.referral_code -- Ensure you saved referral code in DB row
  );

  -- Only perform HTTP request if referral_code is present
  IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
    PERFORM net.http_post(
      url := '${webhookUrl}',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ${apiKey}',
        'Content-Type', 'application/json'
      ),
      body := payload::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE TRIGGER after_subscription_insert
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mipoe_conversion();`
      };
    } else {
      return {
        title: "Setup Hasura Event Trigger (Zero Code)",
        steps: [
          "Go to your Hasura Console -> Data -> select your subscriptions/orders table.",
          "Navigate to the 'Event Triggers' tab and click 'Create'.",
          "Set Trigger Name: 'notify_mipoe_conversion'.",
          "Select Database Operations: Check 'Insert'.",
          "Webhook URL: Set to '" + webhookUrl + "'.",
          "Configure Headers:",
          "  - Authorization: 'Bearer " + apiKey + "'",
          "  - Content-Type: 'application/json'",
          "Go to the 'Advanced Settings' of the Trigger, configure 'Retry Conf' if you want reliability (e.g. 3 retries).",
          "Hasura will automatically send the row payload. In Mipoe dashboard campaign settings, ensure you map the payload fields (Hasura wraps data in $trigger.event.data.new) or use a thin SQL view that aligns with Mipoe's schema."
        ],
        code: `// Sample Hasura Event Trigger Body mapping
// Hasura will POST the following JSON shape to Mipoe:
{
  "event": {
    "op": "INSERT",
    "data": {
      "new": {
        "id": "sub_hasura_102",
        "email": "customer@example.com",
        "price": 39.00,
        "currency": "USD",
        "plan_type": "enterprise",
        "interval": "monthly",
        "affiliate_code": "CREATOR_CODE" 
      }
    }
  }
}
// Mipoe's webhook automatically extracts the Hasura event payload structure 
// if it recognizes the Hasura header structure.`
      };
    }
  };

  const info = getInstructions();

  const handleCopy = () => {
    copyToClipboard(info.code, `${selectedPlatform === "supabase" ? "Supabase SQL Trigger" : "Hasura payload"} Code`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-5 flex gap-4">
        <Database className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Database-Level Webhook Triggers</h4>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Automate tracking directly from your SQL database. When a new row is inserted into your subscription or transaction table, trigger an database webhook call to Mipoe.
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
            Supabase DB Webhooks
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform("hasura")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              selectedPlatform === "hasura"
                ? "bg-slate-900 text-slate-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Hasura Event Triggers
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

          <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider text-slate-400 pt-2">Database Code Configuration</h5>

          <div className="border border-gray-150 rounded-xl p-4 bg-slate-950 text-slate-100 font-mono text-[10px] leading-relaxed relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-7 w-7 flex items-center justify-center rounded transition-all border border-slate-800"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            </button>
            <pre className="overflow-x-auto whitespace-pre max-h-[250px] pr-8">{info.code}</pre>
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
