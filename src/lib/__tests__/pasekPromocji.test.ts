import { describe, expect, it } from "vitest";
import { doKiedy } from "@/components/PasekPromocji";

describe("pasek promocji — do kiedy", () => {
  const koniec = new Date("2026-11-01T23:59:59+01:00").getTime();
  it("ten sam dzień", () => expect(doKiedy(koniec, new Date("2026-11-01T18:00:00+01:00").getTime())).toBe("tylko dziś do 23:59"));
  it("następny dzień", () => expect(doKiedy(koniec, new Date("2026-10-31T09:00:00+01:00").getTime())).toBe("do jutra 23:59"));
  it("później", () => expect(doKiedy(koniec, new Date("2026-10-28T09:00:00+01:00").getTime())).toBe("do niedz. 1.11, 23:59"));
});
