// Wzorce LIKE/ILIKE w zapytaniach do bazy: znaki specjalne z danych od klienta muszą być dosłowne.
// Bez tego adres „%@%.%" pasowałby do każdego zamówienia (ujawnianie cudzych danych po kawałku).
export const escLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

// PostgREST zamienia też „*" na „%", a tej gwiazdki nie da się zapisać dosłownie — adresy
// z %, * albo \ odrzucamy już w formularzach (prawdziwe skrzynki takich znaków nie używają).
export const EMAIL_BEZPIECZNY = /^[^\s@%*\\]+@[^\s@%*\\]+\.[^\s@%*\\]{2,}$/;
