import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  readCheckoutDiscount,
  saveCheckoutDiscount,
  subscribeCheckoutDiscount,
} from "./discount-storage";

beforeEach(() => {
  const values = new Map<string, string>();
  const browser = new EventTarget();
  Object.assign(browser, {
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  vi.stubGlobal("window", browser);
});
afterEach(() => vi.unstubAllGlobals());

it("restores the saved code from browser storage for the same customer", () => {
  saveCheckoutDiscount("customer-a", "SAVE");
  expect(readCheckoutDiscount("customer-a")).toBe("SAVE");
  expect(readCheckoutDiscount("customer-b")).toBe("");
  expect(readCheckoutDiscount()).toBe("");
});

it("clears a removed or completed checkout code without affecting another customer", () => {
  saveCheckoutDiscount("customer-a", "SAVE");
  saveCheckoutDiscount("customer-b", "OTHER");
  saveCheckoutDiscount("customer-a", "");
  expect(readCheckoutDiscount("customer-a")).toBe("");
  expect(readCheckoutDiscount("customer-b")).toBe("OTHER");
});

it("notifies subscribers and cleans up on unmount", () => {
  const onChange = vi.fn();
  const unsubscribe = subscribeCheckoutDiscount(onChange);
  saveCheckoutDiscount("customer", "SAVE");
  expect(onChange).toHaveBeenCalledTimes(1);
  unsubscribe();
  saveCheckoutDiscount("customer", "");
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("does not break checkout when browser storage is blocked", () => {
  Object.defineProperty(window, "sessionStorage", {
    get: () => {
      throw new Error("Storage blocked");
    },
  });
  expect(readCheckoutDiscount("customer")).toBe("");
  expect(() => saveCheckoutDiscount("customer", "SAVE")).not.toThrow();
});
