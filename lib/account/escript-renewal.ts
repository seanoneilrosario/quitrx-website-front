import type { QuitHeroCustomer } from "@/lib/quithero/customers";

export function escriptRenewalUrl(customer: QuitHeroCustomer) {
  const address =
    customer.addresses?.find((entry) => entry.isDefault) ??
    customer.address ??
    customer.addresses?.[0];
  const url = new URL(
    "https://forms.quitrx.com.au/quickrx/form/QuitRXEscriptRequestRenewThisisusedforonlyafterfre/formperma/WYCZQquSgJ_aeL7brgxtrkDlbZiA7dnpQK-2cXcc-G4",
  );
  const fields = {
    email: customer.email,
    firstname: customer.firstName,
    lastname: customer.lastName,
    IHINumber: customer.IHINumber,
    MedicareNumber: customer.medicareNumber,
    IRN: customer.medicareIRNumber,
    streetaddress: address?.address1 ?? address?.line1,
    streetaddress2: address?.address2 ?? address?.line2,
    city: address?.city,
    zip: address?.postcode ?? address?.zip,
    state: address?.state ?? address?.province,
    phone: customer.phone || address?.phone,
  };
  for (const [key, value] of Object.entries(fields)) {
    url.searchParams.set(key, value ?? "");
  }
  return url.toString();
}
