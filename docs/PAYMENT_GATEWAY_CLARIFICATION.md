# Payment gateway – clarification for 49GIG

You asked to implement the payment gateway to manage:

- Clients choosing how many months to pay for (≥ 1)
- Tracking clients who haven’t done full payment
- Reminders when the paid duration is nearing completion
- A grace period, then terminating the project if no follow-up payment

To implement this properly, a few decisions are needed:

---

## 1. Which payment provider(s)?

- **Current:** Flutterwave is used (webhook, `pre_funding` payment type, escrow).
- Do you want to keep Flutterwave only, or add Stripe / PayPal / others?
- If multiple: should “months to fund” and escrow work the same for all, or differ by provider?

---

## 2. Follow-up payments (top-up)

- When a client paid for e.g. 3 months and month 4 is approaching, they must “add payment” for the next month(s).
- **Option A – New payment intent per top-up:**  
  Client goes to project → Payment (or “Add funds”) → Chooses “1 month” (or more) → Pays.  
  We create a new payment (type e.g. `top_up`) and increase `lastFundedMonthIndex` and escrow.
- **Option B – Saved payment method / subscription:**  
  Client adds a card once; we charge automatically at the start of each unpaid month (with email reminder and ability to cancel).
- Which option do you want (A, B, or both)?

---

## 3. Grace period and termination

- Implemented: **14 days** after the end of the last funded month we cancel the project and notify the client.
- Reminders are sent (throttled to once every 3 days) until the grace period ends.
- Do you want a different grace period (e.g. 7 or 21 days)?
- After termination, should the client be able to “reactivate” by paying the missing month(s), or is it strictly one-way (project ended, need a new hire)?

---

## 4. Payout to freelancers

- Implemented: when the client approves a month (or auto-release after 0–72 h), funds are released to the freelancer’s **wallet** (pending balance → available). They withdraw to their bank (e.g. via Flutterwave).
- Do you want payouts to go **only** to wallet, or also support “direct to bank” (and if so, which provider)?

---

## 5. Currency and regions

- Which currencies should we support (USD only, or NGN, EUR, etc.)?
- Any country or region restrictions for clients or freelancers?

---

## 6. Platform fee

- Fee is taken from the client payment before escrow (or from release).  
- Should the same fee apply to **top-up** payments, or a different rule?

---

Once you answer these, we can align the Convex/Flutterwave (and any new provider) implementation with your product and compliance requirements.
