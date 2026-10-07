import { afterEach, expect, it, vi } from "vitest";
import { createRequestGate } from "./request-gate";
afterEach(() => vi.useRealTimers());

it("limits concurrent work across callers and releases slots on failure", async () => {
  const gate = createRequestGate(2);
  let active = 0;
  let maximum = 0;
  const jobs = Array.from({ length: 8 }, (_, index) =>
    gate.run(async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await Promise.resolve();
      active -= 1;
      if (index === 0) throw new Error("failed");
    }),
  );
  await Promise.allSettled(jobs);
  expect(maximum).toBe(2);
  await expect(gate.run(async () => "recovered")).resolves.toBe("recovered");
});

it("rejects queued requests during cooldown and resumes afterwards", async () => {
  vi.useFakeTimers();
  const gate = createRequestGate(1);
  const backend = vi.fn();
  const first = gate.run(async () => {
    gate.cooldown(30_000);
  });
  const queued = gate.run(backend);
  await first;
  await expect(queued).rejects.toThrow("rate limited");
  expect(backend).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(30_000);
  await gate.run(backend);
  expect(backend).toHaveBeenCalledTimes(1);
});
