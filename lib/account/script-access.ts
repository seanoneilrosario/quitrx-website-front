export type ScriptAccessCustomer = {
  scriptActive?: boolean;
  scriptExpiry?: string | null;
  tags?: string[];
};

export function hasActiveScript(customer?: ScriptAccessCustomer) {
  if (customer?.scriptActive === true) return true;

  return (
    customer?.tags?.some((tag) => ["script", "scriptactive"].includes(tag.trim().toLowerCase())) ??
    false
  );
}

export function hasExpiredScript(customer?: ScriptAccessCustomer, now = new Date()) {
  if (!customer?.scriptExpiry) return false;

  const expiry = new Date(customer.scriptExpiry);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime();
}

export function canRenewScript(customer?: ScriptAccessCustomer, now = new Date()) {
  if (!customer?.scriptExpiry) return false;

  const expiry = new Date(customer.scriptExpiry);
  if (Number.isNaN(expiry.getTime())) return false;

  const renewalStart = new Date(expiry);
  const expiryDay = renewalStart.getUTCDate();
  renewalStart.setUTCDate(1);
  renewalStart.setUTCMonth(renewalStart.getUTCMonth() - 2);
  const lastDayOfRenewalMonth = new Date(
    Date.UTC(renewalStart.getUTCFullYear(), renewalStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  renewalStart.setUTCDate(Math.min(expiryDay, lastDayOfRenewalMonth));

  return now.getTime() >= renewalStart.getTime();
}
