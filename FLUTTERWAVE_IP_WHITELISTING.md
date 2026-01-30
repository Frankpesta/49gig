# Flutterwave: "Please enable IP Whitelisting to access this service"

## What this error means

When you **release a milestone payment** (or run any Flutterwave **Transfer** API call), Flutterwave may respond with:

```text
Failed to create transfer: Please enable IP Whitelisting to access this service
```

Flutterwave requires **IP whitelisting** for payouts/transfers. Only requests from IP addresses you add in the dashboard are allowed to create transfers.

## Why it happens with Convex

- **Convex actions** (e.g. `releaseMilestonePayment`) run on Convex’s servers and call Flutterwave from **Convex’s outbound IPs**.
- Convex does **not** provide a fixed list of outbound IP addresses.
- If you haven’t whitelisted those IPs in Flutterwave, the Transfer API returns the IP whitelisting error.

## What you can do

### 1. Enable IP whitelisting and add IPs (Flutterwave dashboard)

1. Log into [Flutterwave Dashboard](https://dashboard.flutterwave.com).
2. Go to **Settings** → **Whitelisted IP addresses**.
3. Click **Add IP Address** and add the IP(s) that will call the Transfer API.
4. Complete the OTP step (email/WhatsApp).

**For Convex:** Convex does not publish a static list of outbound IPs. So you have two paths:

- **Option A – Contact Convex**  
  Ask Convex support if they can provide **egress IP ranges** for your deployment so you can whitelist them in Flutterwave.

- **Option B – Proxy with a fixed IP**  
  Run the Flutterwave transfer from a small service that has a **fixed outbound IP** (e.g. a VPS or a serverless provider that offers static egress). That service calls Flutterwave; your Convex action calls that service. Then whitelist only that proxy’s IP in Flutterwave.

### 2. Ask Flutterwave to relax the requirement (dev/sandbox)

For **development or sandbox**, you can ask Flutterwave support whether they can:

- Disable or relax IP whitelisting for your test account, or  
- Allow Transfer API from “any IP” when using a specific API key or environment.

They will tell you what’s possible for your account type.

### 3. Local / fixed-IP testing

If you are calling the Transfer API from **your own machine** or a server with a **known IP** (e.g. a VPS):

1. Get that IP (e.g. [whatismyip.com](https://www.whatismyip.com/) or your VPS provider).
2. In Flutterwave: **Settings** → **Whitelisted IP addresses** → **Add IP Address** and add that IP.

Then only that environment will be able to create transfers until you add more IPs (e.g. Convex egress or a proxy).

## Summary

| Situation | Action |
|-----------|--------|
| Error when releasing milestone from Convex | Flutterwave is blocking Convex’s IPs. Enable IP whitelisting in Flutterwave and add the IPs that Convex uses (get them from Convex) or use a proxy with a fixed IP. |
| Testing from your own server/PC | Add your server’s or PC’s public IP in Flutterwave **Whitelisted IP addresses**. |
| Need static IPs for Convex | Contact Convex support for egress IP info, or run transfers via a proxy with a fixed IP. |

## References

- [Flutterwave: How to whitelist IP addresses](https://flutterwave.com/ng/support/integrations/how-to-whitelist-ip-addresses-on-your-flutterwave-dashboard)
- Flutterwave Dashboard → **Settings** → **Whitelisted IP addresses**
