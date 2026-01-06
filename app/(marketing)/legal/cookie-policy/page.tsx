"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { Cookie } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: Cookie, text: "Cookie Policy" }}
        title="Cookie Policy"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>49GIG uses cookies for the following purposes:</p>

            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the Platform to function properly. They enable core functionality such as security, network management, and accessibility.
            </p>
            <ul>
              <li>Authentication and security</li>
              <li>Session management</li>
              <li>Load balancing</li>
            </ul>

            <h3>2.2 Performance and Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with the Platform by collecting and reporting information anonymously.
            </p>
            <ul>
              <li>Google Analytics</li>
              <li>Page view tracking</li>
              <li>User behavior analysis</li>
            </ul>

            <h3>2.3 Functionality Cookies</h3>
            <p>
              These cookies allow the Platform to remember choices you make and provide enhanced, personalized features.
            </p>
            <ul>
              <li>Language preferences</li>
              <li>Theme selection (light/dark mode)</li>
              <li>User interface customization</li>
            </ul>

            <h3>2.4 Targeting and Advertising Cookies</h3>
            <p>
              These cookies are used to deliver advertisements relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.
            </p>

            <h2>3. Third-Party Cookies</h2>
            <p>
              We may allow third-party service providers to place cookies on your device for the purposes described above. These third parties include:
            </p>
            <ul>
              <li>Google Analytics</li>
              <li>Payment processors</li>
              <li>Social media platforms</li>
              <li>Advertising networks</li>
            </ul>

            <h2>4. Managing Cookies</h2>
            <p>
              You can control and manage cookies in various ways:
            </p>

            <h3>4.1 Browser Settings</h3>
            <p>
              Most browsers allow you to refuse or accept cookies. You can usually find cookie settings in the "Options" or "Preferences" menu of your browser.
            </p>

            <h3>4.2 Cookie Consent Tool</h3>
            <p>
              When you first visit our Platform, you'll see a cookie consent banner. You can manage your cookie preferences through this tool.
            </p>

            <h3>4.3 Opt-Out Links</h3>
            <ul>
              <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
            </ul>

            <h2>5. Impact of Blocking Cookies</h2>
            <p>
              If you choose to block or delete cookies, some features of the Platform may not function properly or may be unavailable. Essential cookies cannot be blocked if you wish to use the Platform.
            </p>

            <h2>6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
            </p>

            <h2>7. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact us:</p>
            <ul>
              <li><strong>Email:</strong> privacy@49gig.com</li>
              <li><strong>Address:</strong> 49GIG, Lagos, Nigeria</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

