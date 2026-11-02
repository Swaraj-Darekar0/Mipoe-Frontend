import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { LegalSection, ShortVersion } from "./LegalLayout";

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded bg-glucon-grey-2 px-1 py-0.5 text-snow">{children}</code>
);

export const CookiePolicy: React.FC = () => {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="3 November 2026">
      <ShortVersion>
        <li>Zero advertising, tracking, or cross-site profiling cookies. We do not sell data or track you across the web.</li>
        <li>Authentication primarily utilizes client-side session tokens in secure local storage (<Code>localStorage</Code>) transmitted via authorization headers, along with an optional essential backend session cookie (<Code>access_token</Code>).</li>
        <li>Third-party partners (Google Identity Services, Crossmint smart accounts, Onramp.money UPI rails, Meta, Shopify) operate strictly during their respective authentication and payment flows.</li>
        <li>Affiliate links drop no tracking cookies on browser visitors — link clicks and attribution are logged entirely server-side.</li>
        <li>You can clear cookies or local storage at any time in your browser settings; public browsing remains completely unaffected.</li>
      </ShortVersion>

      <LegalSection title="1. What Are Cookies and Local Storage?">
        <p>
          Cookies are small data files placed on your device when you visit a website to remember your session or preferences.
          Modern web applications also use <strong className="text-snow">browser local storage</strong> (<Code>localStorage</Code> and <Code>sessionStorage</Code>)
          to store state client-side. This policy explains how Mipoe (operating as Sellr / Mipoe) uses both technologies transparently and responsibly.
        </p>
      </LegalSection>

      <LegalSection title="2. How We Use Cookies & Session Tokens">
        <p>
          Mipoe uses a modern, lightweight Web 2.5 architecture designed to minimize browser storage footprint. We set <strong className="text-snow">no advertising, no analytics, and no cross-site profiling cookies</strong>.
        </p>
        <div className="space-y-3 mt-3">
          <p><strong className="text-snow">A. Client-Side Session Tokens (Local Storage):</strong></p>
          <ul className="list-disc space-y-2 pl-5">
            <li>When you log in via Google or credentials, authenticated session identifiers (<Code>user_id</Code>, <Code>role</Code>, and cryptographic access JWTs) are stored in your browser's local storage.</li>
            <li>These tokens are transmitted securely via HTTP headers (<Code>Authorization: Bearer</Code>) to our backend API endpoints.</li>
            <li>Local storage allows instant dashboard rendering without waiting for server roundtrips, and is immediately cleared upon logout.</li>
          </ul>

          <p className="mt-4"><strong className="text-snow">B. Essential Backend Session Cookie:</strong></p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-snow">Cookie Name:</strong> <Code>access_token</Code></li>
            <li><strong className="text-snow">Purpose:</strong> Provides secure session continuity between our frontend (Vercel) and backend microservices (Render).</li>
            <li><strong className="text-snow">Security Flags:</strong> Configured with <Code>HttpOnly</Code> (inaccessible to client JavaScript / XSS protection), <Code>Secure</Code> (strictly transmitted over TLS 1.3 encryption), and <Code>SameSite=None</Code> for verified cross-domain API communication.</li>
            <li><strong className="text-snow">Session Renewal & Logout:</strong> Valid for a sliding 30-day window during active usage. Logging out explicitly clears the token, deletes the cookie, and blocklists the session ID on our servers.</li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection title="3. Third-Party Integrations">
        <p>
          When you use specialized features, third-party infrastructure providers may process tokens or set functional cookies under their respective privacy policies:
        </p>
        <ul className="list-disc space-y-2 pl-5 mt-2">
          <li><strong className="text-snow">Google Identity Services (GIS):</strong> When you click "Continue with Google", Google's official identity client (<Code>accounts.google.com/gsi/client</Code>) authenticates your Google account and issues a verified OpenID Connect ID token.</li>
          <li><strong className="text-snow">Crossmint (Web 2.5 Smart Accounts):</strong> Non-custodial ERC-4337 smart accounts are provisioned on the Base L2 blockchain. Secure session credentials verify wallet signature requests without storing private keys in your browser.</li>
          <li><strong className="text-snow">Onramp.money (FIU-IND Compliant Gateway):</strong> During instant UPI deposits and creator off-ramp withdrawals, the Onramp.money checkout widget securely processes banking verification and payment callbacks.</li>
          <li><strong className="text-snow">Meta / Instagram Graph API:</strong> Used when creators link an Instagram Professional account via Meta's OAuth dialog to authorize reel view metric scraping.</li>
          <li><strong className="text-snow">Shopify:</strong> Used when brands connect their e-commerce storefront to verify affiliate conversion webhooks.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Affiliate Links: Zero Browser Tracking Cookies">
        <p>
          When consumers click a creator's affiliate link or storefront product recommendation, we do <strong className="text-snow">not</strong> plant any tracking cookies or marketing beacons in the consumer's browser:
        </p>
        <ul className="list-disc space-y-2 pl-5 mt-2">
          <li>The link click is securely logged on our server (timestamp, referring page, and campaign attribution tag) so commissions can be accurately credited to the creator — see our <Link to="/privacy" className="text-[#FF5C00] hover:underline">Privacy Policy</Link>.</li>
          <li>The visitor is seamlessly redirected to the brand's destination site with standard campaign parameters (<Code>utm_source=sellr</Code>).</li>
          <li>The destination store operates under its own independent terms and cookie policy.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Managing Your Cookies & Browser Storage">
        <p>
          You can clear cookies, site data, and local storage at any time through your browser settings (Chrome, Safari, Firefox, Edge, or Brave).
          Because our platform uses secure token-based headers, public marketing pages and storefront browsing remain completely accessible even if third-party cookies are disabled. Logging into your creator or brand dashboard requires permitting essential session tokens so our servers can verify your identity.
        </p>
      </LegalSection>

      <LegalSection title="6. Policy Updates & Contact">
        <p>
          As our platform evolves, we may update this Cookie Policy to reflect new statutory guidelines or technical updates. Any changes will be published here with an updated revision date.
        </p>
        <p className="mt-2">
          For technical or privacy inquiries, contact our data protection team at{" "}
          <a href="mailto:info@mipoe.com" className="text-[#FF5C00] hover:underline">info@mipoe.com</a> or{" "}
          <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};

export default CookiePolicy;
