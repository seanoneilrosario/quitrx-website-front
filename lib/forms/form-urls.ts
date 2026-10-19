export type QuitRxFormCustomer = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: {
    address1?: string | null;
    address2?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    province?: string | null;
    postcode?: string | null;
    zip?: string | null;
  } | null;
  addresses?: (QuitRxFormCustomer["address"] | null)[] | null;
};

export type QuitRxForm = "intake" | "uploadScript" | "escriptRequest" | "renewal";

const FORM_URLS: Record<QuitRxForm, string> = {
  intake:
    "https://forms.quitrx.com.au/quickrx/form/QuitRXIntakeForm/formperma/n3JR1Lhg5OV91in2ovvhZMReVat5zQRQnwEmd6GYusw",
  uploadScript:
    "https://forms.zohopublic.com.au/quickrx/form/QuitRXScriptUpload/formperma/tNPCUM7T9J2EfT3pdRP68U6T6HezBgFAcqRmifGD4eg",
  escriptRequest:
    "https://forms.quitrx.com.au/quickrx/form/QuitRXEscriptRequestThisisusedforonlyafterfreepriv/formperma/kv_pCXTnqL7KtQx2aQj8yauEXxjqzQKzTTwrIKi8i5c",
  renewal:
    "https://forms.quithero.com.au/quickrx/form/QuitRXScriptRenewal/formperma/Zc9s8aLGPTVQntvZrepRaqSCsgNugnAh0z_ApC8x2XY",
};

export function formatAustralianPhoneForForm(phone?: string | null) {
  let decoded = phone?.trim() ?? "";

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original value if it contains malformed URL encoding.
  }

  const digits = decoded.replace(/\D/g, "");

  if (/^61\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^0061\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^4\d{8}$/.test(digits)) return `0${digits}`;

  return decoded;
}

export function buildQuitRxFormUrl(form: QuitRxForm, customer?: QuitRxFormCustomer) {
  const url = new URL(FORM_URLS[form]);
  const address = customer?.address ?? customer?.addresses?.find(Boolean);
  const common = {
    email: customer?.email ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: formatAustralianPhoneForForm(customer?.phone),
  };

  const parameters: Record<QuitRxForm, Record<string, string>> = {
    intake: {
      email: common.email,
      firstname: common.firstName,
      lastname: common.lastName,
      phone: common.phone,
    },
    uploadScript: {
      email: common.email,
      first_name: common.firstName,
      last_name: common.lastName,
    },
    escriptRequest: {
      email: common.email,
      firstname: common.firstName,
      lastname: common.lastName,
      streetaddress: address?.address1 ?? address?.line1 ?? "",
      streetaddress2: address?.address2 ?? address?.line2 ?? "",
      city: address?.city ?? "",
      zip: address?.postcode ?? address?.zip ?? "",
      state: address?.state ?? address?.province ?? "",
      phone: common.phone,
    },
    renewal: {
      firstname: common.firstName,
      lastname: common.lastName,
      email: common.email,
    },
  };

  Object.entries(parameters[form]).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("zf_rszfm", "1");
  return url;
}
