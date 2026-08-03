import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Fasolka — ubrania dziecięce 0-12 lat";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #fbf7f2 0%, #f4e2d6 100%)",
          color: "#231f1c",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 6, color: "#9a5a3b", fontWeight: 600 }}>SKLEP DZIECIĘCY</div>
        <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1.05, marginTop: 8 }}>Fasolka</div>
        <div style={{ fontSize: 44, color: "#4a423c", marginTop: 16 }}>
          Ubranka dla dzieci 0–12 lat — miękkie i bezpieczne
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 40, fontSize: 28, color: "#6b615a" }}>
          <span style={{ background: "#fff", padding: "8px 20px", borderRadius: 4 }}>Dziewczynki</span>
          <span style={{ background: "#fff", padding: "8px 20px", borderRadius: 4 }}>Chłopcy</span>
          <span style={{ background: "#fff", padding: "8px 20px", borderRadius: 4 }}>Niemowlęta</span>
        </div>
      </div>
    ),
    size,
  );
}
