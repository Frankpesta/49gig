import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { SiteOrganizationJsonLd } from "@/components/seo/site-json-ld";
import { getCanonicalSiteUrl } from "@/lib/seo/site-url";

const siteOrigin = getCanonicalSiteUrl();

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": `${siteOrigin}/rss.xml`,
    },
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <SiteOrganizationJsonLd />
      <main className="flex-1 overflow-x-hidden pt-12 sm:pt-14 md:pt-16">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_15%_15%,rgba(7,18,43,0.08),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(254,193,16,0.10),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(7,18,43,0.06),transparent_42%)]" />
        {children}
      </main>
      <Footer />

      <Script id="livechat-init" strategy="afterInteractive">{`
        window.__lc = window.__lc || {};
        window.__lc.license = 19805373;
        window.__lc.integration_name = "manual_onboarding";
        window.__lc.product_name = "livechat";
        ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
      `}</Script>
      <noscript>
        <a href="https://www.livechat.com/chat-with/19805373/" rel="nofollow">Chat with us</a>
        {", powered by "}
        <a href="https://www.livechat.com/?welcome" rel="noopener noreferrer" target="_blank">LiveChat</a>
      </noscript>
    </div>
  );
}
