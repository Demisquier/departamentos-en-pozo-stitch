// app/opengraph-image.jsx — Imagen OG por defecto (1200x630) para todo el sitio.
// Next la inyecta como <meta property="og:image"> en toda página que no defina la suya.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Departamentos en Pozo — proyectos en pozo en CABA y GBA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px", background: "#0f1f3d", color: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 30, color: "#c9a45c", letterSpacing: 4, textTransform: "uppercase" }}>departamentosenpozo.com.ar</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>Departamentos en Pozo</div>
        <div style={{ fontSize: 38, marginTop: 24, color: "#d9dee7" }}>Proyectos en pozo en CABA y GBA: precios, desarrolladoras y guías</div>
      </div>
    ),
    size
  );
}
