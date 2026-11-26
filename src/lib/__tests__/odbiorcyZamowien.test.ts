import { afterEach, describe, expect, it, vi } from "vitest";
import { odbiorcyZamowien } from "@/lib/mail";

describe("powiadomienia sklepu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("idą wyłącznie na skrzynkę firmy — także gdy na serwerze zostanie stara zmienna MAIL_SKLEP", () => {
    vi.stubEnv("MAIL_SKLEP", "prywatny@example.com");
    expect(odbiorcyZamowien()).toEqual(["amin.kids1@hotmail.com"]);
  });
});
