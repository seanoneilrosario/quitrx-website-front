export type QuitRxFormCustomer = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    address1?: string;
    address2?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    province?: string;
    postcode?: string;
    zip?: string;
  };
  addresses?: QuitRxFormCustomer["address"][];
};

export type QuitRxForm = "intake" | "uploadScript" | "escriptRequest" | "renewal";

const FORM_URLS: Record<QuitRxForm, string> = {
  intake: "https://forms.quitrx.com.au/quickrx/form/QuitRXIntakeForm/formperma/n3JR1Lhg5OV91in2ovvhZMReVat5zQRQnwEmd6GYusw",
  uploadScript: "https://forms.zohopublic.com.au/quickrx/form/QuitRXScriptUpload/formperma/tNPCUM7T9J2EfT3pdRP68U6T6HezBgFAcqRmifGD4eg",
  escriptRequest: "https://forms.quitrx.com.au/quickrx/form/QuitRXEscriptRequestThisisusedforonlyafterfreepriv/formperma/kv_pCXTnqL7KtQx2aQj8yauEXxjqzQKzTTwrIKi8i5c",
  renewal: "https://forms.quithero.com.au/quickrx/form/QuitRXScriptRenewal/formperma/Zc9s8aLGPTVQntvZrepRaqSCsgNugnAh0z_ApC8x2XY",
};

export function buildQuitRxFormUrl(form: QuitRxForm, customer?: QuitRxFormCustomer) {
  const url = new URL(FORM_URLS[form]);
  const address = customer?.address ?? customer?.addresses?.[0];
  const common = {
    email: customer?.email ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
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
