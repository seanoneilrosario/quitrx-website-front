export type ScriptAccessCustomer = {
  scriptActive?: boolean;
  tags?: string[];
};

export function hasActiveScript(customer?: ScriptAccessCustomer) {
  if (customer?.scriptActive === true) return true;

  return customer?.tags?.some((tag) =>
    ["script", "scriptactive"].includes(tag.trim().toLowerCase()),
  ) ?? false;
}
