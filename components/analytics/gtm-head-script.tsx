import Script from "next/script";

/**
 * GTM + Google Consent Mode v2 - loads in root layout before React.
 * 1. Push consent_default (denied) so tags won't fire until consent
 * 2. Load GTM container
 * When user accepts, AnalyticsProvider pushes consent_update via dataLayer.
 */
export function GtmHeadScript() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gtmId) return null;

  const consentAndGtmScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'wait_for_update': 500
    });
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;

  return (
    <Script
      id="gtm-consent-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: consentAndGtmScript }}
    />
  );
}
