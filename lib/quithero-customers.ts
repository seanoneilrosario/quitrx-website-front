import "server-only";

export type QuitHeroAddress = {
  address1?: string;
  address2?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  province?: string;
  postcode?: string;
  zip?: string;
  country?: string;
};

export type QuitHeroCustomer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  numberOfOrders?: number;
  totalSpent?: number;
  currencyCode?: string;
  tags?: string[];
  taxExempt?: boolean;
  verifiedEmail?: boolean;
  state?: string;
  consultPurchase?: boolean;
  scriptId?: string;
  scriptExpiry?: string;
  birthday?: string;
  scriptValidity?: string;
  renewalForm?: string;
  gender?: string;
  vapeTag?: string;
  pouchTag?: string;
  document?: string;
  socLogin?: string;
  scriptUploaded?: string;
  scriptActive?: boolean;
  address?: QuitHeroAddress;
  addresses?: QuitHeroAddress[];
};

export type CreateQuitHeroCustomer = Omit<QuitHeroCustomer, "id"> & {
  email: string;
};

export type UpdateQuitHeroCustomer = Partial<Omit<QuitHeroCustomer, "id">>;

export type QuitHeroAuthenticatedUser = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type QuitHeroSearchResponse =
  | QuitHeroCustomer[]
  | QuitHeroCustomer
  | {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      customers?: unknown;
    }
  | Record<string, unknown>;

const DEFAULT_API_BASE_URL = "https://retail-api.quithero.com.au";

const customerSyncs = new Map<
  string,
  Promise<QuitHeroCustomer | undefined>
>();

class QuitHeroApiError extends Error {
  constructor(
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(`QuitHero request failed with status ${status}.`);
    this.name = "QuitHeroApiError";
  }
}

function getApiBaseUrl() {
  return (
    process.env.QUITHERO_API_BASE_URL ?? DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

function getApiKey() {
  const apiKey = process.env.QUITHERO_API_KEY;

  if (!apiKey) {
    throw new Error("QuitHero API key is not configured.");
  }

  return apiKey;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isCustomer(value: unknown): value is QuitHeroCustomer {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { email?: unknown }).email === "string"
  );
}

function extractCustomers(value: unknown): QuitHeroCustomer[] {
  if (Array.isArray(value)) {
    return value.filter(isCustomer);
  }

  if (isCustomer(value)) {
    return [value];
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const wrapper = value as Record<string, unknown>;

  for (const key of [
    "data",
    "items",
    "results",
    "customers",
  ]) {
    const customers = extractCustomers(wrapper[key]);

    if (customers.length) {
      return customers;
    }
  }

  return [];
}

function customerPayload(
  user: QuitHeroAuthenticatedUser,
): CreateQuitHeroCustomer | undefined {
  const email = user.email?.trim();

  if (!email) {
    return undefined;
  }

  const payload: CreateQuitHeroCustomer = {
    email,
  };

  if (user.firstName?.trim()) {
    payload.firstName = user.firstName.trim();
  }

  if (user.lastName?.trim()) {
    payload.lastName = user.lastName.trim();
  }

  if (user.phone?.trim()) {
    payload.phone = user.phone.trim();
  }

  return payload;
}

async function quitHeroRequest<T>(
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(
    `${getApiBaseUrl()}${path}`,
    {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-api-key": getApiKey(),
        ...init.headers,
      },
      cache: "no-store",
    },
  );

  const body = await response.text();

  let parsed: unknown;

  try {
    parsed = body ? JSON.parse(body) : undefined;
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    throw new QuitHeroApiError(
      response.status,
      parsed,
    );
  }

  return parsed as T;
}

export async function findQuitHeroCustomerByEmail(
  email: string,
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return undefined;
  }

  const response =
    await quitHeroRequest<QuitHeroSearchResponse>(
      `/customers?search=${encodeURIComponent(
        normalizedEmail,
      )}`,
    );

  return extractCustomers(response).find(
    (customer) =>
      typeof customer.email === "string" &&
      normalizeEmail(customer.email) === normalizedEmail,
  );
}

/**
 * Find a QuitHero customer linked to an OAuth account.
 */
export async function findQuitHeroCustomerByOAuth(
  provider: "facebook" | "google",
  providerAccountId: string,
) {
  const normalizedProviderAccountId =
    providerAccountId.trim();

  if (!normalizedProviderAccountId) {
    return undefined;
  }

  return quitHeroRequest<QuitHeroCustomer | null>(
    `/customers/oauth/${encodeURIComponent(
      provider,
    )}/${encodeURIComponent(normalizedProviderAccountId)}`,
  );
}

/**
 * Link a Facebook/Google account to an existing
 * QuitHero customer.
 */
export async function linkQuitHeroCustomerOAuth(
  customerId: string,
  provider: "facebook" | "google",
  providerAccountId: string,
) {
  const id = customerId.trim();

  const normalizedProviderAccountId =
    providerAccountId.trim();

  if (!id) {
    throw new Error("Customer ID is required.");
  }

  if (!normalizedProviderAccountId) {
    throw new Error(
      "Provider account ID is required.",
    );
  }

  return quitHeroRequest(
    `/customers/${encodeURIComponent(id)}/oauth`,
    {
      method: "POST",
      body: JSON.stringify({
        provider,
        providerAccountId:
          normalizedProviderAccountId,
      }),
    },
  );
}

export async function createQuitHeroCustomer(
  customer: CreateQuitHeroCustomer,
) {
  return quitHeroRequest<QuitHeroCustomer>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify(customer),
    },
  );
}

export async function updateQuitHeroCustomer(
  id: string,
  customer: UpdateQuitHeroCustomer,
) {
  const customerId = id.trim();

  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  return quitHeroRequest<QuitHeroCustomer>(
    `/customers/${encodeURIComponent(customerId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(customer),
    },
  );
}

export function isQuitHeroDuplicateError(
  error: unknown,
) {
  if (!(error instanceof QuitHeroApiError)) {
    return false;
  }

  const message = JSON.stringify(
    error.responseBody ?? "",
  ).toLowerCase();

  return (
    error.status === 409 ||
    (error.status === 422 &&
      /duplicate|already exists|email/.test(message))
  );
}

async function syncQuitHeroCustomerOnce(
  user: QuitHeroAuthenticatedUser,
) {
  const customer = customerPayload(user);

  if (!customer) {
    return undefined;
  }

  const existing =
    await findQuitHeroCustomerByEmail(
      customer.email,
    );

  if (existing) {
    return existing;
  }

  try {
    return await createQuitHeroCustomer(
      customer,
    );
  } catch (error) {
    if (isQuitHeroDuplicateError(error)) {
      return findQuitHeroCustomerByEmail(
        customer.email,
      );
    }

    throw error;
  }
}

export async function syncQuitHeroCustomer(
  user: QuitHeroAuthenticatedUser,
) {
  const email = user.email
    ?.trim()
    .toLowerCase();

  if (!email) {
    return undefined;
  }

  const existingSync =
    customerSyncs.get(email);

  if (existingSync) {
    return existingSync;
  }

  const sync =
    syncQuitHeroCustomerOnce(user).finally(() =>
      customerSyncs.delete(email),
    );

  customerSyncs.set(email, sync);

  return sync;
}

export async function syncQuitHeroCustomerWithoutBlocking(
  user: QuitHeroAuthenticatedUser,
) {
  try {
    return await syncQuitHeroCustomer(user);
  } catch (error) {
    console.error(
      "QuitHero customer synchronization failed.",
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        status:
          error instanceof QuitHeroApiError
            ? error.status
            : undefined,
      },
    );

    return undefined;
  }
}