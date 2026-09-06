import React from "react";
import { Link } from "react-router-dom";
import LegalLayout, { LegalSection, ShortVersion } from "./LegalLayout";

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded bg-glucon-grey-2 px-1 py-0.5 text-snow">{children}</code>
);

export const CookiePolicy: React.FC = () => {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="22 August 2026">
      <ShortVersion>
        <li>We set exactly one cookie of our own: a secure login cookie. No advertising or analytics cookies.</li>
        <li>Partners we integrate with (Google sign-in, Cashfree checkout, Meta, Shopify) may set their own cookies during their flows.</li>
        <li>Affiliate links don't put a Sellr tracking cookie on your browser — clicks are logged on our server instead.</li>
        <li>Block the login cookie and you simply can't stay signed in; everything else about your browser stays untouched.</li>
      </ShortVersion>

      <LegalSection title="1. What Are Cookies?">
        <p>
          Cookies are small data files placed on your device when you visit a website. Sites use them to remember who you are
          between page loads — for example, to keep you signed in. This policy also covers similar technologies we use, such as
          browser local storage and server-side logging.
        </p>
      </LegalSection>

      <LegalSection title="2. The One Cookie We Set">
        <p>
          Sellr sets a single, essential cookie: <Code>access_token</Code>.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Purpose:</strong> it holds a cryptographically signed token that authenticates you on every request. Without it, you cannot stay logged in.</li>
          <li><strong className="text-snow">HttpOnly:</strong> the cookie cannot be read by JavaScript running in the page, which protects your session from cross-site scripting (XSS) attacks.</li>
          <li><strong className="text-snow">Sliding 30-day duration:</strong> the session lasts 30 days, and using the platform renews it automatically so you stay signed in seamlessly.</li>
          <li><strong className="text-snow">Logout really logs you out:</strong> logging out deletes the cookie and blocklists the token on our servers, so it cannot be reused even if copied.</li>
        </ul>
        <p>We do not set any advertising, analytics or cross-site tracking cookies.</p>
      </LegalSection>

      <LegalSection title="3. Local Storage">
        <p>
          Alongside the cookie, the app keeps non-sensitive display data (such as your username and role) in your browser's local
          storage so your dashboard renders instantly. It contains no passwords or tokens and is cleared when you log out or when
          your session expires.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Cookies">
        <p>Some features hand you over briefly to a partner, and that partner may set its own cookies under its own policy:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-snow">Google sign-in (via Supabase):</strong> used to verify your Google identity when you choose "Continue with Google";</li>
          <li><strong className="text-snow">Cashfree:</strong> used during deposit checkout and payment verification;</li>
          <li><strong className="text-snow">Meta / Instagram:</strong> used when a creator links an Instagram account through Meta's OAuth flow;</li>
          <li><strong className="text-snow">Shopify:</strong> used when a brand connects a Shopify store.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Affiliate Links: Tracked on the Server, Not in Your Browser">
        <p>
          When you click a Sellr affiliate link (for example from a creator's storefront), we do <strong className="text-snow">not</strong>{" "}
          place a Sellr tracking cookie on your browser. Instead:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The click is logged on our server (IP address, browser user-agent, referring page) so the sale can be attributed to the right creator — see our <Link to="/privacy" className="text-[#FF5C00] hover:underline">Privacy Policy</Link>;</li>
          <li>You are redirected to the brand's own site with campaign (UTM) parameters added to the address;</li>
          <li>The destination site — for example a brand's Shopify store — operates under its own cookie and privacy policies.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Controlling Cookies">
        <p>
          You can block or delete cookies in your browser settings at any time. Because the <Code>access_token</Code> cookie is
          essential for authentication, blocking it will prevent you from logging in or using any signed-in feature of Sellr —
          public pages will keep working. The consent checkbox on our login and registration pages records your agreement to this
          essential cookie.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes & Contact">
        <p>
          If we introduce new cookies or change how existing ones work, we will update this page and the date above. Questions:{" "}
          <a href="mailto:info@sellr.in" className="text-[#FF5C00] hover:underline">info@sellr.in</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};

export default CookiePolicy;
