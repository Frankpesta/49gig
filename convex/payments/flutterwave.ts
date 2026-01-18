/**
 * Flutterwave API Helper Functions
 * 
 * Flutterwave uses REST API (no official Node.js SDK like Stripe)
 * All requests use HTTP fetch with secret key in Authorization header
 */

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

/**
 * Get Flutterwave API headers
 */
function getFlutterwaveHeaders(): HeadersInit {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "FLUTTERWAVE_SECRET_KEY environment variable is not set. Please configure it in the Convex dashboard."
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
  };
}

/**
 * Initialize a payment with Flutterwave
 * Returns payment link that user will be redirected to
 */
export async function initializePayment(data: {
  tx_ref: string; // Unique transaction reference
  amount: number; // Amount in currency unit (not cents)
  currency: string; // e.g., "NGN", "USD", "KES"
  redirect_url: string; // URL to redirect after payment
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, string>;
}): Promise<{
  status: string;
  message: string;
  data: {
    link: string; // Payment URL
    tx_ref: string;
    status: string;
  };
}> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(tx_ref: string): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    card: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      token: string;
      expiry: string;
    };
    created_at: string;
    status: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    meta: Record<string, any>;
  };
}> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${tx_ref}`,
    {
      method: "GET",
      headers: getFlutterwaveHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Create a refund
 */
export async function createRefund(data: {
  id: number; // Transaction ID
  amount?: number; // Optional: partial refund amount
}): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    wallet_id: number;
    transaction_id: number;
    tx_ref: string;
    flw_ref: string;
    wallet_updated: boolean;
    created_at: string;
    account_id: number;
    status: string;
    amount: number;
    destination: string;
  };
}> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${data.id}/refund`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify({ amount: data.amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Create a subaccount (for freelancers - equivalent to Stripe Connect)
 */
export async function createSubaccount(data: {
  business_name: string;
  business_email: string;
  business_mobile: string;
  account_number: string;
  account_bank: string;
  country: string;
  split_type: "percentage" | "flat";
  split_value: number; // Percentage or flat amount
}): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    account_name: string;
    account_reference: string;
    bank_name: string;
    bank_code: string;
    created_at: string;
  };
}> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Transfer funds to a subaccount or bank account
 */
export async function createTransfer(data: {
  account_bank: string; // Bank code
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string; // Unique transfer reference
  beneficiary_name?: string;
  destination_branch_code?: string;
  callback_url?: string;
  debit_currency?: string;
  subaccount?: string; // Subaccount ID if transferring to subaccount
}): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get subaccount details
 */
export async function getSubaccount(subaccountId: string): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    account_name: string;
    account_reference: string;
    bank_name: string;
    bank_code: string;
    split_ratio: number;
    split_type: string;
    split_value: number;
    subaccount_id: string;
    email: string;
    mobilization_number: string;
    country: string;
    created_at: string;
  };
}> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/subaccounts/${subaccountId}`,
    {
      method: "GET",
      headers: getFlutterwaveHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get transfer details
 */
export async function getTransfer(transferId: string): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/transfers/${transferId}`,
    {
      method: "GET",
      headers: getFlutterwaveHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Flutterwave API error: ${response.statusText}`
    );
  }

  return response.json();
}
