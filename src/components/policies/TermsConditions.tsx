import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { LegalSection, ShortVersion } from "./LegalLayout";

export const TermsConditions: React.FC = () => {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="22 August 2026">
      <ShortVersion>
        <li>Sellr connects brands with creators for two things: view-based reel campaigns and affiliate (commission-based) selling.</li>
        <li>You must be 18+ and keep your account details accurate. Creators need an Instagram Professional (Creator/Business) account to participate.</li>
        <li>Creators earn from real, verified views and real, tracked sales. Faking either gets your account terminated and your earnings forfeited.</li>
        <li>Brands must fund campaigns before they go live. Unspent budget can be reclaimed; refunds to your bank go through an admin-reviewed process.</li>
        <li>These terms are governed by Indian law, with courts in Mumbai, Maharashtra.</li>
      </ShortVersion>

      <LegalSection title="1. Who We Are & Acceptance of These Terms">
        <p>
          Sellr ("Sellr", "we", "us") operates a creator–brand marketplace, based in Mumbai, India, where brands run promotional
          campaigns and creators earn by publishing short-form content (Instagram reels) and by promoting products through
          affiliate links and personal storefronts. By creating an account or using any part of the platform, you agree to these
          Terms & Conditions, our <Link to="/privacy" className="text-[#FF5C00] hover:underline">Privacy Policy</Link> and our{" "}
          <Link to="/cookie-policy" className="text-[#FF5C00] hover:underline">Cookie Policy</Link>. If you do not agree, please do
          not use Sellr.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility & Your Account">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must be at least <strong className="text-snow">18 years old</strong> to register.</li>
          <li>You register as either a <strong className="text-snow">Creator</strong> or a <strong className="text-snow">Brand</strong>. Each role has its own dashboard, obligations and payment flows described below.</li>
          <li>You agree to provide accurate registration and profile information and to keep it up to date. Verification steps (such as PAN validation for brands) rely on this information being correct.</li>
          <li>You are responsible for all activity that happens under your account and session. Keep your password safe. You can also sign in with Google; the same responsibility applies.</li>
          <li>We may suspend or terminate accounts that provide false information, abuse the platform or violate these terms (see Section 13).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. For Creators: Campaigns & Reel Submissions">
        <ul className="list-disc space-y-2 pl-5">
          <li>Creators may submit reels to active campaigns, up to <strong className="text-snow">5 submissions per campaign</strong>. Submissions must follow the brand's brief and requirements.</li>
          <li>The brand (or a Sellr admin) reviews each submission and either accepts it or rejects it with feedback. Only accepted clips count toward view tracking and earnings.</li>
          <li>Submitted reels must <strong className="text-snow">remain public on Instagram</strong> for the life of the campaign. Deleting, archiving or making a submitted reel private may cancel pending earnings for that clip.</li>
          <li>Earnings are milestone-based: when your accepted clips cross the campaign's view thresholds, payouts are calculated and distributed automatically (payout runs happen on an hourly schedule) or manually by the brand.</li>
          <li>Artificially inflating metrics — bots, purchased views, view farms, spam or any other manipulation — is strictly prohibited and results in <strong className="text-snow">account termination and forfeiture of your wallet balance</strong>.</li>
          <li>If you delete an accepted clip yourself, its recorded views are removed from the campaign totals.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. For Creators: Instagram Linking & Metrics">
        <ul className="list-disc space-y-2 pl-5">
          <li>To participate in reel campaigns you must link an Instagram <strong className="text-snow">Professional account (Creator or Business)</strong>. Personal accounts cannot be linked because they do not expose the analytics we need.</li>
          <li>Linking happens through Meta's official OAuth flow. You will be asked to grant permissions that let us read your account identity, media and insights. We store the resulting access tokens encrypted and use them only to verify your account and fetch performance metrics for submitted clips.</li>
          <li>View counts and related metrics for your clips are fetched from Instagram. Sellr is not responsible for discrepancies caused by Instagram's own reporting, delays or outages, though we make reasonable efforts to keep metrics accurate.</li>
          <li>You can disconnect your Instagram account by contacting us; doing so ends your ability to participate in reel campaigns until re-linked.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. For Creators: Affiliate Links & Your Storefront">
        <ul className="list-disc space-y-2 pl-5">
          <li>Creators can join affiliate campaigns and receive unique tracking links. When someone clicks your link and completes a qualifying purchase or subscription on the brand's site, you earn a commission (a percentage of the sale or a fixed amount, as stated in the campaign).</li>
          <li>You can publish a personal storefront page on Sellr listing your affiliate products. <strong className="text-snow">Your storefront is a public page</strong> — its name, bio, banner and product list are visible to anyone on the internet.</li>
          <li>Attribution is based on our click-tracking and the brand's order data (for example Shopify order webhooks or the brand's own purchase events). Commissions for subscription (SaaS) products may follow a recurring commission schedule defined by the campaign.</li>
          <li>Prohibited affiliate behaviour includes: buying through your own links (self-purchase), cookie stuffing, misleading or deceptive promotion, spamming links, and misrepresenting the brand or product. Violations lead to reversal of commissions and account termination.</li>
          <li>When promoting products, you are responsible for complying with applicable advertising-disclosure rules, including the ASCI guidelines for influencer advertising in India (for example, clearly labelling paid partnerships).</li>
          <li>Commissions are only payable once the underlying transaction is confirmed by the brand's platform and are subject to reversal if the order is cancelled, refunded or found fraudulent.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. For Brands: Onboarding & Verification">
        <ul className="list-disc space-y-2 pl-5">
          <li>Brands must complete onboarding before running campaigns. This includes <strong className="text-snow">PAN verification</strong> (validated with our payment partner Cashfree, with your consent), business details, a company logo and linking your Instagram and YouTube accounts.</li>
          <li>Onboarding applications are reviewed by Sellr admins and may be approved or rejected. We may ask for additional information and may remove brands that fail verification.</li>
          <li>You confirm that the business information you provide (including PAN and business address) is accurate and that you are authorised to act for the business you register.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. For Brands: Campaigns, Budgets & Moderation">
        <ul className="list-disc space-y-2 pl-5">
          <li>Campaigns must be <strong className="text-snow">funded before activation</strong>. Budget you allocate to a campaign is locked to that campaign until it is paid out to creators or reclaimed by you.</li>
          <li>You control your campaign's budget, view thresholds per payout milestone, creator requirements and deadline, and you may pause or reactivate a campaign.</li>
          <li>You are responsible for reviewing creator submissions promptly and fairly — approving clips that meet your brief and rejecting others with feedback.</li>
          <li>Expired campaigns are deactivated automatically. Deleting a campaign returns its remaining budget to your Sellr wallet.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. For Brands: Affiliate Integrations (Shopify, Custom API, Cashfree)">
        <ul className="list-disc space-y-2 pl-5">
          <li>To run affiliate campaigns you connect a sales source: a <strong className="text-snow">Shopify store</strong> (via Shopify OAuth), a <strong className="text-snow">custom integration</strong> (we issue you an API key, webhook URL and signing secret), or <strong className="text-snow">Cashfree subscriptions</strong> for recurring SaaS billing.</li>
          <li>You authorise Sellr to receive order and subscription events from these sources (for example Shopify order webhooks) and to use them to attribute conversions and calculate creator commissions.</li>
          <li>If you use the custom integration, you must keep your API key and signing secret confidential and send accurate, truthful purchase events. Sending false events to avoid or inflate commissions is a material breach of these terms.</li>
          <li>Creator commissions on confirmed conversions are deducted from your funded affiliate campaign budget.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Wallets, Payments, Fees & Taxes">
        <ul className="list-disc space-y-2 pl-5">
          <li>All amounts on Sellr are in <strong className="text-snow">Indian Rupees (INR)</strong>. Payments are processed by Cashfree Payments; brands can deposit via Cashfree checkout or a dedicated virtual bank account.</li>
          <li>Your Sellr wallet balance is a prepaid platform balance, not a bank deposit. It earns no interest.</li>
          <li>Creators withdraw earnings to their verified bank account or UPI ID. Withdrawals may take time to process; failed withdrawals are reversed back to your wallet balance.</li>
          <li>Sellr may charge service fees on transactions. Any fee will be visible before you confirm the relevant transaction.</li>
          <li>Payouts and deposits are subject to applicable Indian tax and compliance requirements (for example PAN validation and any tax deduction at source required by law). You are responsible for your own taxes on amounts you earn through Sellr.</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Refunds & Reclaiming Budgets">
        <ul className="list-disc space-y-2 pl-5">
          <li>Brands can reclaim <strong className="text-snow">unspent</strong> campaign budget back to their Sellr wallet at any time. Budget already paid out to creators for met milestones or confirmed conversions is not refundable.</li>
          <li>Refunds from your Sellr wallet back to your bank are made by request and go through an admin-reviewed audit process. Each request is approved or rejected with a recorded reason, and you can track its status in your dashboard.</li>
          <li>Creator earnings that were obtained legitimately remain payable even if a campaign ends; earnings obtained through fraud or manipulation are forfeited.</li>
        </ul>
      </LegalSection>

      <LegalSection title="11. Prohibited Conduct">
        <p>Across the whole platform, you must not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Manipulate views, clicks, conversions or any other metric;</li>
          <li>Impersonate another person or business, or submit content you do not have the rights to;</li>
          <li>Post unlawful, infringing, hateful or deceptive content, or promote products in a misleading way;</li>
          <li>Probe, scrape, overload or otherwise interfere with the platform, or attempt to access other users' accounts or data;</li>
          <li>Use Sellr for money laundering or any activity that violates applicable law.</li>
        </ul>
      </LegalSection>

      <LegalSection title="12. Content Ownership & Licences">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Creators keep ownership of their content.</strong> By submitting a clip to a campaign, you grant Sellr and the sponsoring brand a non-exclusive licence to view, track, display and share that content for purposes connected to the campaign (for example showing it in dashboards, analytics and rankings).</li>
          <li>Brands grant creators a limited licence to use campaign briefs, product information and brand assets solely to create content for that campaign.</li>
          <li>Sellr and its logos, design and software remain the property of Sellr. You may not copy or reuse them without permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="13. Termination">
        <ul className="list-disc space-y-2 pl-5">
          <li>You can stop using Sellr at any time and may request account deletion by writing to <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a>. Withdraw your remaining balance before requesting deletion.</li>
          <li>We may suspend or terminate your account for breach of these terms, fraud, legal requirements or extended inactivity. Where reasonable, we will tell you why.</li>
          <li>On termination for fraud or metric manipulation, pending earnings and wallet balances connected to the fraud are forfeited. Legitimate, verified earnings will be settled.</li>
        </ul>
      </LegalSection>

      <LegalSection title="14. Disclaimers & Limitation of Liability">
        <ul className="list-disc space-y-2 pl-5">
          <li>Sellr is provided <strong className="text-snow">"as is"</strong>. We work to keep the platform reliable but do not guarantee uninterrupted availability.</li>
          <li>We depend on third-party services — Instagram/Meta for metrics, Cashfree for payments, Shopify for order data, Supabase for sign-in, Resend for email. We are not liable for failures, delays or data inaccuracies originating from those services, though we will make reasonable efforts to correct their effects.</li>
          <li>Sellr is a marketplace, not a party to the commercial relationship between a brand and a creator's audience. Brands are responsible for their products; creators are responsible for their content.</li>
          <li>To the maximum extent permitted by law, Sellr's total liability to you for any claim is limited to the greater of the service fees you paid to Sellr in the 12 months before the claim, or the amount held in your Sellr wallet at the time of the claim. We are not liable for indirect or consequential losses such as lost profits or lost followers.</li>
          <li>Nothing in these terms limits liability that cannot be limited under Indian law.</li>
        </ul>
      </LegalSection>

      <LegalSection title="15. Governing Law & Disputes">
        <p>
          These terms are governed by the laws of India. Any dispute arising out of or relating to Sellr is subject to the
          exclusive jurisdiction of the courts at <strong className="text-snow">Mumbai, Maharashtra</strong>. Before going to
          court, we encourage you to contact us first — most issues are resolved by support.
        </p>
      </LegalSection>

      <LegalSection title="16. Changes to These Terms">
        <p>
          We may update these terms as the platform evolves (for example when we launch new features). When we make material
          changes we will update the "Last updated" date above and notify you through the platform or by email. Continuing to use
          Sellr after a change takes effect means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="17. Contact">
        <p>
          Sellr — Mumbai, India. Email:{" "}
          <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};

export default TermsConditions;
