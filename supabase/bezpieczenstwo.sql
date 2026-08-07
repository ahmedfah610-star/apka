-- bobas-shopping — utwardzenie bezpieczeństwa bazy.
-- Uruchom w Supabase → SQL Editor (po schema.sql i konta.sql).

-- 1) Funkcje płatności/zamówień NIE mogą być wywoływane przez publiczność.
--    Wcześniej anon/authenticated mogły przez /rest/v1/rpc oznaczyć dowolne
--    zamówienie jako opłacone lub złożyć zamówienie. Teraz tylko service_role
--    (webhook/checkout po stronie serwera) ma do nich dostęp.
revoke execute on function public.oplac_zamowienie(uuid) from public, anon, authenticated;
revoke execute on function public.zloz_zamowienie(jsonb, numeric, numeric, numeric, text, jsonb) from public, anon, authenticated;

-- 2) Ustal stały search_path funkcji (ochrona przed przejęciem przez obiekty
--    w innych schematach).
alter function public.oplac_zamowienie(uuid) set search_path = public;
alter function public.zloz_zamowienie(jsonb, numeric, numeric, numeric, text, jsonb) set search_path = public;
