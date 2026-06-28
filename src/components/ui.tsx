"use client";

interface PrzyciskProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  wariant?: "primary" | "ghost";
  typ?: "button" | "submit";
}

export function Przycisk({ children, onClick, disabled, wariant = "primary", typ = "button" }: PrzyciskProps) {
  const baza =
    "w-full rounded-2xl px-5 py-4 text-base font-semibold transition active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100";
  const styl =
    wariant === "primary"
      ? "bg-primary text-tlo shadow-md hover:bg-primary/90"
      : "bg-transparent text-primary border border-linia hover:bg-linia/40";

  return (
    <button type={typ} onClick={onClick} disabled={disabled} className={`${baza} ${styl}`}>
      {children}
    </button>
  );
}

interface OpcjaProps {
  aktywna: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function KartaOpcji({ aktywna, onClick, children }: OpcjaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium shadow-sm transition ${
        aktywna
          ? "border-primary bg-primary text-tlo"
          : "border-linia bg-white text-primary hover:border-szalwia"
      }`}
    >
      {children}
    </button>
  );
}

export function Naglowek({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-1 text-xl font-bold text-primary">{children}</h1>;
}

export function Podtytul({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-sm text-primary/60">{children}</p>;
}
