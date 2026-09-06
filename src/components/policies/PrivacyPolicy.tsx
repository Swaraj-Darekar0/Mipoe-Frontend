import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { LegalSection, ShortVersion } from "./LegalLayout";

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="22 August 2026">
      <ShortVersion>
        <li>We collect what we need to run the marketplace: your account details, payout/verification details, linked social accounts, and performance metrics.</li>
        <li>Sensitive data — passwords, bank details, PAN, Instagram tokens — is hashed or encrypted before it is stored.</li>
        <li>If you click a creator's affiliate link, we log that click (IP address, browser info, referring page) to attribute the sale — even if you never create an account.</li>
        <li>We never sell your data. We share it only with the partners that make the platform work: Cashfree, Supabase, Resend, Meta/Instagram and Shopify.</li>
        <li>You can ask us to access, correct or delete your data at <strong>info@sellr.in</strong>.</li>
      </ShortVersion>

      <LegalSection title="1. Scope">
        <p>
          This policy explains what personal data Sellr ("we", "us") collects, why, how it is protected and what rights you have.
          It applies to creators, brands, and visitors who browse public pages or click affiliate links. We process personal data
          in accordance with Indian law, including the <strong className="text-snow">Digital Personal Data Protection Act, 2023</strong>{" "}
          and the Information Technology Act, 2000 and its rules.
        </p>
      </LegalSection>

      <LegalSection title="2. Information You Give Us">
        <p><strong className="text-snow">Every account:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Username, email address, password (stored only as a hash — see Section 8) and your role (creator or brand).</li>
        </ul>
        <p><strong className="text-snow">Creators additionally:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Nickname, bio and phone number;</li>
          <li>Instagram handle and, after linking, your Instagram Professional account ID;</li>
          <li>Payout details: bank account number and IFSC, or UPI ID (stored encrypted);</li>
          <li>Your storefront content: banner, bio and the products you choose to list.</li>
        </ul>
        <p><strong className="text-snow">Brands additionally:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Company name, phone number, business category and business address;</li>
          <li>PAN number and PAN holder name for verification (stored encrypted, shown masked to our admins);</li>
          <li>Company logo and social handles (Instagram, YouTube);</li>
          <li>Integration credentials you connect: Shopify store domain and access token, custom-API keys and webhook secrets, Cashfree app credentials (stored encrypted).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Information Collected Automatically">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Session data:</strong> a secure login cookie keeps you signed in — see the <Link to="/cookie-policy" className="text-[#FF5C00] hover:underline">Cookie Policy</Link> for details.</li>
          <li><strong className="text-snow">Affiliate click logs:</strong> when anyone (including visitors without an account) clicks a Sellr affiliate link, we record the click with the IP address, browser user-agent, referring page and campaign parameters. We use this to attribute sales to the right creator, to pay commissions correctly and to detect click fraud.</li>
          <li><strong className="text-snow">Content metrics:</strong> for clips submitted to campaigns, we collect performance metrics (views, likes, comments) from Instagram to calculate milestone earnings.</li>
          <li><strong className="text-snow">Transaction records:</strong> deposits, allocations, payouts, withdrawals and refunds are recorded in an audit ledger, as required for financial compliance.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Information From Third Parties">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Google sign-in (via Supabase):</strong> if you sign in with Google, we receive your name, email and profile identity from Google to create or match your account.</li>
          <li><strong className="text-snow">Meta / Instagram:</strong> when a creator links Instagram, we receive account details (account type, username, business account ID) and access tokens that let us read media and insights. Tokens are stored encrypted and never exposed to the browser.</li>
          <li><strong className="text-snow">Shopify and brand order events:</strong> for affiliate attribution, brands' stores send us order events (order reference, value and related metadata) so we can confirm conversions and pay commissions.</li>
          <li><strong className="text-snow">Cashfree:</strong> we receive payment confirmations, payout statuses and PAN verification results.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. How We Use Your Information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Authenticate you and maintain your session securely;</li>
          <li>Run campaigns: match creators to campaigns, process submissions, let brands review clips and rank performance;</li>
          <li>Verify content performance (Instagram metrics) and attribute affiliate sales (click and order data);</li>
          <li>Process money: deposits, budget allocation, milestone payouts, commissions, withdrawals and refunds, including PAN and tax compliance;</li>
          <li>Send transactional emails (via Resend), such as password resets, payout confirmations and campaign notifications;</li>
          <li>Prevent fraud, enforce our <Link to="/terms" className="text-[#FF5C00] hover:underline">Terms & Conditions</Link> and comply with legal obligations.</li>
        </ul>
        <p>We do not use your personal data for third-party advertising, and we do not sell it to anyone.</p>
      </LegalSection>

      <LegalSection title="6. What Is Public">
        <p>Some information is public by design — please share it knowingly:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>A creator's <strong className="text-snow">storefront page</strong> (username, bio, banner and listed products) is visible to anyone on the internet;</li>
          <li>Campaign pages and rankings can show creator usernames and clip performance to participants of that campaign;</li>
          <li>A brand's name, logo and campaign details are visible to creators browsing campaigns.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Who We Share Data With">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Cashfree Payments:</strong> payment processing, payouts to bank/UPI, PAN verification and related compliance;</li>
          <li><strong className="text-snow">Supabase:</strong> Google sign-in and file storage (for example brand logos);</li>
          <li><strong className="text-snow">Resend:</strong> delivery of transactional emails;</li>
          <li><strong className="text-snow">Meta / Instagram:</strong> account linking and metrics retrieval, under Meta's own terms;</li>
          <li><strong className="text-snow">Shopify:</strong> if a brand connects a Shopify store, data flows between Sellr and that store for product sync and order attribution;</li>
          <li><strong className="text-snow">Between users:</strong> brands see the usernames and clip metrics of creators participating in their campaigns; creators see brand and campaign information. Payout details and PAN are never shown to other users;</li>
          <li><strong className="text-snow">Legal:</strong> we may disclose data where required by law, regulation or valid legal process.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. How We Protect Your Data">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Passwords</strong> are hashed with Argon2id before storage — we never store or see your actual password;</li>
          <li><strong className="text-snow">Sensitive fields</strong> — bank details, UPI IDs, PAN numbers, Instagram access tokens and integration credentials — are encrypted at rest using symmetric encryption (Fernet);</li>
          <li><strong className="text-snow">Sessions</strong> use a signed, HttpOnly cookie that JavaScript cannot read, and revoked sessions are blocklisted server-side so a stolen token cannot be reused after logout;</li>
          <li>Access to admin tooling is role-restricted, and PAN data is masked in admin views.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Data Retention">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account and profile data is kept while your account is active;</li>
          <li>Financial records (transactions, payouts, refunds, PAN verification results) are retained as long as Indian tax and financial regulations require, even after account deletion;</li>
          <li>Affiliate click logs are kept for attribution and fraud-prevention purposes and then deleted or anonymised;</li>
          <li>When you delete your account, we remove or anonymise personal data that we are not legally required to keep.</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Your Rights">
        <p>Under the DPDP Act 2023 you have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access a summary of the personal data we hold about you;</li>
          <li>Correct inaccurate or incomplete data (most profile data you can edit yourself in your dashboard);</li>
          <li>Request erasure of your data, subject to legal retention requirements;</li>
          <li>Withdraw consent (for example unlink your Instagram account), understanding that some features stop working without it;</li>
          <li>Nominate a person to exercise these rights on your behalf;</li>
          <li>Raise a grievance with us — and if you are not satisfied with our response, complain to the Data Protection Board of India.</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a>. We respond to grievances
          within the timelines prescribed by law.
        </p>
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          Sellr is for users aged 18 and above. We do not knowingly collect data from anyone under 18; if we learn that we have,
          we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes & Contact">
        <p>
          If we change this policy in a meaningful way, we will update the date above and notify you through the platform or by
          email. Questions, requests and grievances:{" "}
          <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a> — Sellr, Mumbai, India.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
