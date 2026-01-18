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
    customer: {
      id: number;
      phone_number: string | null;
      name: string;
      email: string;
      created_at: string;
    };
    account_id: number;
    meta: any;
  };
}> {
  // Flutterwave verify payment endpoint uses tx_ref query parameter
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
export async function createRefund(
  transaction_id: string,
  amount: number,
  reason: string
): Promise<{
  status: string;
  message: string;
  data: {
    id: number;
    wallet_id: number;
    charge_amount: number;
    status: string;
    destination: string;
    meta: any;
    account_id: number;
    customer: {
      id: number;
      customer_email: string;
      customer_name: string;
    };
    created_at: string;
  };
}> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transaction_id}/refund`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify({
      amount,
      comments: reason,
    }),
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
  account_bank: string; // Bank code (will be converted to number)
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
  // Convert bank code to number as Flutterwave requires numeric account_bank
  const account_bank_numeric = parseInt(data.account_bank, 10);
  if (isNaN(account_bank_numeric)) {
    throw new Error(`Invalid bank code: ${data.account_bank}. Bank code must be numeric.`);
  }

  const payload: any = {
    account_number: data.account_number,
    account_bank: account_bank_numeric, // Send as number
    amount: data.amount,
    narration: data.narration,
    currency: data.currency,
    reference: data.reference,
  };

  if (data.beneficiary_name) payload.beneficiary_name = data.beneficiary_name;
  if (data.destination_branch_code) payload.destination_branch_code = data.destination_branch_code;
  if (data.callback_url) payload.callback_url = data.callback_url;
  if (data.debit_currency) payload.debit_currency = data.debit_currency;
  if (data.subaccount) payload.subaccount = data.subaccount;

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify(payload),
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
 * Create a Flutterwave subaccount
 * Equivalent to Stripe Connect account creation
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
  // Flutterwave expects bank code as string with leading zeros preserved (e.g., "044")
  // Ensure it's a valid bank code string
  const account_bank_str = data.account_bank.trim();
  if (!account_bank_str || !/^\d+$/.test(account_bank_str)) {
    throw new Error(`Invalid bank code: ${data.account_bank}. Bank code must be numeric.`);
  }

  const payload = {
    business_name: data.business_name,
    business_email: data.business_email,
    business_mobile: data.business_mobile,
    account_number: data.account_number,
    account_bank: account_bank_str, // Send as string (e.g., "044")
    country: data.country,
    split_type: data.split_type,
    split_value: data.split_value,
  };

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts`, {
    method: "POST",
    headers: getFlutterwaveHeaders(),
    body: JSON.stringify(payload),
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

/**
 * Verify bank account number
 * Use this before creating subaccounts to ensure account number is valid
 */
export async function verifyAccountNumber(data: {
  account_number: string;
  account_bank: string; // Bank code
}): Promise<{
  status: string;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}> {
  // Flutterwave expects bank code as string with leading zeros preserved (e.g., "044")
  const account_bank_str = data.account_bank.trim();
  if (!account_bank_str || !/^\d+$/.test(account_bank_str)) {
    throw new Error(`Invalid bank code: ${data.account_bank}. Bank code must be numeric.`);
  }

  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/accounts/resolve`,
    {
      method: "POST",
      headers: getFlutterwaveHeaders(),
      body: JSON.stringify({
        account_number: data.account_number,
        account_bank: account_bank_str, // Send as string (e.g., "044")
      }),
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
 * Get list of banks for a country
 * Returns banks with their codes for subaccount creation
 */
export async function getBanks(country: string): Promise<{
  status: string;
  message: string;
  data: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}> {
  const response = await fetch(
    `${FLUTTERWAVE_BASE_URL}/banks/${country}`,
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
