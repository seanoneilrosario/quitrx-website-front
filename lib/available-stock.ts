export type StockedVariant = {
  inventory?: number;
  allocatedInventory?: number;
};

export function getAvailableStock(variant?: StockedVariant) {
  return Math.max(
    0,
    Number(variant?.inventory ?? 0) - Number(variant?.allocatedInventory ?? 0),
  );
}
