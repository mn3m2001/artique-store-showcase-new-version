import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({ revision: 1, payload: { count: 0 }, conflicts: 0, fail: false }));
vi.mock("@/lib/cloud", () => ({
  isUsingNeon: () => false,
  neonClient: () => null,
  cloudClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { revision: fake.revision, payload: structuredClone(fake.payload) }, error: fake.fail ? { message: "offline" } : null }) }) }) }),
    rpc: async (_name: string, args: { expected_revision: number; next_payload: { count: number } }) => {
      if (fake.conflicts > 0) { fake.conflicts--; fake.revision++; fake.payload.count++; return { data: false, error: null }; }
      if (args.expected_revision !== fake.revision) return { data: false, error: null };
      fake.payload = structuredClone(args.next_payload); fake.revision++;
      return { data: true, error: null };
    },
  }),
}));
import { cloudTransaction, readCloudState, writeCloudState } from "@/lib/db/cloud-state";

describe("Distributed cloud writes", () => {
  beforeEach(() => { fake.revision = 1; fake.payload = { count: 0 }; fake.conflicts = 0; fake.fail = false; });
  const increment = () => cloudTransaction(async () => { const state = await readCloudState<{ count: number }>(); state.count++; await writeCloudState(state); return state.count; });
  it("revalidates against fresh data after a competing writer", async () => { fake.conflicts = 1; expect(await increment()).toBe(2); expect(fake.payload.count).toBe(2); });
  it("preserves simultaneous updates instead of losing one", async () => { await Promise.all([increment(), increment(), increment()]); expect(fake.payload.count).toBe(3); });
  it("does not silently replace an unavailable database", async () => { fake.fail = true; await expect(increment()).rejects.toThrow("offline"); });
  it("rejects writes without a read transaction", async () => { await expect(writeCloudState({ count: 4 })).rejects.toThrow("transaction"); });
});
