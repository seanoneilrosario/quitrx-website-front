export type ScriptAccessCustomer = {
  scriptActive?: boolean;
  tags?: string[];
};

export function hasActiveScript(customer?: ScriptAccessCustomer) {
  return customer?.scriptActive === true;
}
