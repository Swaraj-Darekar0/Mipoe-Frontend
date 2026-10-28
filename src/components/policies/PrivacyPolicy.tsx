import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { LegalSection, ShortVersion } from "./LegalLayout";

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="25 October 2026">
      <ShortVersion>
        <li>We collect what we need to operate the creator marketing engine: your account credentials, payout/UPI details, linked social accounts, and verified view metrics.</li>
        <li>We operate a 100% non-custodial Web 2.5 smart account architecture (via Okto by CoinDCX on Base L2) where users own their MPC keys and Mipoe never pools or holds custody of client funds.</li>
        <li>CoinDCX and Onramp.money are registered with FIU-IND (Financial Intelligence Unit of India), providing a comprehensive statutory compliance shield for all INR & UPI rails.</li>
        <li>TDS is deducted at source under Section 194S (1% with valid PAN) and deposited with the Government of India, with quarterly Form 26Q credit certificates generated for creators.</li>
        <li>Under India's Digital Personal Data Protection Act, 2023 (DPDP Act), all data resides in Indian data centers (AWS Mumbai) and you have the right to full self-service PII erasure at any time via your profile settings or <strong>DELETE /api/auth/account</strong>.</li>
      </ShortVersion>

      <LegalSection title="1. Scope & Mipoe Legal Architecture">
        <p>
          This policy explains how Mipoe ("we", "us", "platform") processes, protects, and respects your personal data.
          Our operational and financial framework is built upon four non-negotiable statutory pillars under Indian law:
        </p>
        <ul className="list-disc space-y-2 pl-5 mt-2">
          <li>
            <strong className="text-snow">1. Non-Custodial Multi-Party Computation (MPC):</strong> Mipoe is an influencer marketing platform, not a bank, broker, or centralized crypto custodian. Embedded smart accounts on the Base L2 network are provisioned via <strong>Okto (by CoinDCX)</strong>, where private key shares are partitioned and controlled by the user. Mipoe never holds custody of your private keys or pooled funds.
          </li>
          <li>
            <strong className="text-snow">2. FIU-IND Statutory Compliance Shield:</strong> Our fiat on-ramp and off-ramp banking integrations are powered by <strong>CoinDCX (Neblio Technologies Pvt. Ltd.)</strong> and <strong>Onramp.money</strong>, both officially registered reporting entities with the <strong>Financial Intelligence Unit - India (FIU-IND)</strong> under the Prevention of Money Laundering Act (PMLA). All statutory AML/CFT compliance for INR transactions is managed directly through these regulated gateways.
          </li>
          <li>
            <strong className="text-snow">3. Indian Income Tax & Statutory Form 26Q Filing (Section 194S):</strong> In accordance with Section 194S of the Income Tax Act, 1961, Mipoe enforces Just-in-Time (JIT) 1% TDS on creator withdrawals. Creator PAN cards are collected solely for submitting quarterly Form 26Q / 26QE returns so creators receive official tax credit in their AIS/26AS statement.
          </li>
          <li>
            <strong className="text-snow">4. DPDP Act 2023 & Indian Data Residency:</strong> All database servers, caching layers, and cryptographic stores are localized in India (AWS Mumbai ap-south-1). Mipoe enforces strict user consent, purpose limitation, and absolute right to erasure.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Information You Give Us">
        <p><strong className="text-snow">Every account:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Verified Google OAuth profile ID or verified Indian mobile / WhatsApp phone number, role (creator or brand), and non-custodial EVM wallet address.</li>
        </ul>
        <p><strong className="text-snow">Creators additionally:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Channel display name, bio, and phone/WhatsApp number;</li>
          <li>Instagram handle and, upon linking, your verified Professional account ID;</li>
          <li>Instant payout target: UPI ID (e.g. name@okaxis) and Permanent Account Number (PAN) for statutory Section 194S TDS filing;</li>
          <li>Storefront metadata: custom banner, bio, and listed affiliate products.</li>
        </ul>
        <p><strong className="text-snow">Brands additionally:</strong></p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Company name, contact phone, business address, and GSTIN/PAN for statutory tax invoicing;</li>
          <li>Company logo, creative assets, and social handles;</li>
          <li>Integration credentials you connect: Shopify store domain and access token, custom webhook secrets, and on-ramp deposit records.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Web 2.5 Smart Accounts & Blockchain Infrastructure">
        <p>
          To eliminate corporate banking bottlenecks and high processing charges, Mipoe operates on a hybrid Web 2.5 financial architecture:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-snow">Invisible Smart Wallets:</strong> Upon signing in with Google or Phone/WhatsApp, an embedded, non-custodial EVM smart account is provisioned for you on the <strong>Base L2 network</strong> via <strong>Okto (by CoinDCX)</strong>.
          </li>
          <li>
            <strong className="text-snow">Non-Custodial Multi-Party Computation (MPC):</strong> Private key shares are split mathematically using threshold cryptography. Mipoe does not hold, store, or have access to your private keys or seed phrases.
          </li>
          <li>
            <strong className="text-snow">Zero-Fee Brand Deposits (Option B):</strong> When a brand deposits INR via UPI, onramp.money converts fiat to Base USDC. Mipoe fully absorbs all fiat-to-crypto processing fees, ensuring 100% of deposited INR is credited to your campaign pool.
          </li>
          <li>
            <strong className="text-snow">Instant Fiat Payouts:</strong> Milestone allocations are tracked in real-time. When a creator withdraws earnings, the off-ramp infrastructure disburses fiat INR directly to the creator's UPI ID.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Information Collected Automatically">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Session data:</strong> A secure, signed HttpOnly cookie maintains your authenticated session — see the <Link to="/cookie-policy" className="text-[#FF5C00] hover:underline">Cookie Policy</Link> for details.</li>
          <li><strong className="text-snow">Content metrics:</strong> For clips submitted to campaigns, our performance scraper polls view counts, likes, and engagement metrics directly from the Instagram Graph API.</li>
          <li><strong className="text-snow">Financial audit ledger:</strong> Every deposit, budget allocation, milestone payout, TDS deduction, and withdrawal is recorded in an immutable ledger for accounting integrity.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Third-Party Integrations & Service Providers">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Okto (by CoinDCX):</strong> Non-custodial MPC smart account generation, Base L2 key management, and session token verification;</li>
          <li><strong className="text-snow">Onramp.money:</strong> Instant UPI on-ramp deposit processing and off-ramp payout disbursement;</li>
          <li><strong className="text-snow">Supabase:</strong> Cloud database, storage buckets, and OAuth session synchronization;</li>
          <li><strong className="text-snow">Resend:</strong> Delivery of transactional emails, password resets, and payout alerts;</li>
          <li><strong className="text-snow">Meta / Instagram:</strong> OAuth verification and view performance polling under Meta’s API terms;</li>
          <li><strong className="text-snow">Shopify:</strong> Affiliate product catalog synchronization and conversion webhooks.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Indian Tax Compliance & JIT TDS Disclosures">
        <p>
          Mipoe strictly complies with Indian Income Tax statutory requirements:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-snow">Just-in-Time (JIT) Progressive Profiling:</strong> We never force creators to provide PAN or bank details upfront at registration. Creators can sign up, clip, and earn milestone rewards without paperwork friction.
          </li>
          <li>
            <strong className="text-snow">Dynamic TDS Rate (1% vs 20%):</strong> At the moment of withdrawal:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>If a valid PAN is provided, standard <strong>1% TDS</strong> is deducted under Section 194S / 194J;</li>
              <li>If no PAN is provided, statutory penalty rate of <strong>20% TDS</strong> is deducted pursuant to Section 206AA of the Income Tax Act.</li>
            </ul>
          </li>
          <li>
            TDS deducted is deposited directly with the Government of India, and Form 16A certificates are generated quarterly for creator tax credits.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Data Security & Cryptographic Protection">
        <ul className="list-disc space-y-2 pl-5">
          <li>Passwords are hashed using argon2id with high memory-cost parameters;</li>
          <li>Sensitive financial fields (PAN, UPI IDs, integration tokens) are encrypted at rest using AES-256 / Fernet encryption;</li>
          <li>All API traffic is strictly enforced over TLS 1.3 with automated rate limiting and JWT blocklist validation in Redis.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Data Subject Rights & Account Deletion (DPDP & GDPR)">
        <p>Under the DPDP Act 2023, you have full sovereignty over your personal data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-snow">Self-Service Account Deletion:</strong> You can delete your account at any time via <code>DELETE /api/auth/account</code> or your dashboard profile settings.
          </li>
          <li>
            <strong className="text-snow">PII Scrubbing:</strong> Upon deletion, your personal identifiers (name, email, phone, Instagram handle, PAN, and credentials) are permanently overwritten with pseudonymized hashes and scrubbed from our active databases.
          </li>
          <li>
            <strong className="text-snow">Blockchain Ledger Disclosure:</strong> You acknowledge that transactions recorded on the public Base L2 blockchain are cryptographically immutable by design. While Mipoe severs all links between your identity and your wallet address in our databases, on-chain transaction records cannot be modified or erased.
          </li>
          <li>
            <strong className="text-snow">Statutory Retention:</strong> Financial audit ledgers and tax deduction certificates are retained for the statutory 6-year period as mandated by Section 44AB of the Indian Income Tax Act.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Contact & Grievance Redressal">
        <p>
          In accordance with the DPDP Act 2023, for questions, data subject access requests, or grievance redressal:
        </p>
        <p className="mt-2">
          <strong>Grievance Officer:</strong> Mipoe Privacy & Legal Operations<br />
          <strong>Email:</strong> <a href="mailto:info@mipoe.com" className="text-[#FF5C00] hover:underline">info@mipoe.com</a><br />
          <strong>Address:</strong> Mipoe Technologies, Mumbai, India.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
