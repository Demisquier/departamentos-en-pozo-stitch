"use client";
import { useEffect } from "react";

// Reactiva los filtros del contenido de WordPress (Top 13 por zona + directorio +200
// con búsqueda y chips). El <script> inline de WP se elimina al renderizar headless,
// así que re-implementamos la lógica sobre el DOM ya inyectado (progressive enhancement).
const deaccent = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function DirEnhancer() {
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      const top = document.getElementById("dir-grid");
      const dirList = document.getElementById("directorio-list");
      if ((top || dirList) || tries > 40) {
        clearInterval(id);
        if (top || dirList) wire();
      }
    }, 150);

    function wire() {
      // Estilo de estado activo (independiente del CSS de WP).
      if (!document.getElementById("dir-enh-css")) {
        const st = document.createElement("style");
        st.id = "dir-enh-css";
        st.textContent =
          ".dir-f.enh-on,.chip-filtro.enh-on{background:#1b2a4a!important;color:#fff!important;border-color:#1b2a4a!important}";
        document.head.appendChild(st);
      }

      // ---- Top 13 (filtro por zona) ----
      const grid = document.getElementById("dir-grid");
      const fbar = document.getElementById("dir-filters");
      const cur = document.querySelector(".dir-cur");
      if (grid && fbar) {
        const cards = [...grid.querySelectorAll(".dir-card")];
        const btns = [...fbar.querySelectorAll(".dir-f")];
        const zonaOf = (el) => deaccent(el.textContent.replace(/\d+/g, "").trim());
        const applyTop = (zona) => {
          let vis = 0;
          cards.forEach((c) => {
            const show = zona === "todas" || deaccent(c.textContent).includes(zona);
            c.style.display = show ? "" : "none";
            if (show) vis++;
          });
          if (cur) cur.textContent = vis;
          btns.forEach((b) => b.classList.toggle("enh-on", zonaOf(b) === zona));
        };
        btns.forEach((b) =>
          b.addEventListener("click", (e) => {
            e.preventDefault();
            applyTop(zonaOf(b));
          })
        );
      }

      // ---- Directorio +200 (búsqueda + chips) ----
      const list = document.getElementById("directorio-list");
      const input = document.getElementById("filtro-input");
      const cont = document.getElementById("filtro-contador");
      const chips = [...document.querySelectorAll(".chip-filtro")];
      if (list) {
        const items = [...list.children];
        let q = "";
        let chip = "";
        const applyDir = () => {
          let vis = 0;
          items.forEach((it) => {
            const t = deaccent(it.textContent);
            const show = (!q || t.includes(q)) && (!chip || t.includes(chip));
            it.style.display = show ? "" : "none";
            if (show) vis++;
          });
          if (cont) cont.textContent = vis;
        };
        if (input) {
          input.addEventListener("input", (e) => {
            q = deaccent(e.target.value.trim());
            applyDir();
          });
        }
        chips.forEach((c) =>
          c.addEventListener("click", (e) => {
            e.preventDefault();
            const label = deaccent(c.textContent.trim());
            if (label.includes("limpiar")) {
              q = "";
              chip = "";
              if (input) input.value = "";
            } else {
              chip = chip === label ? "" : label;
            }
            chips.forEach((x) =>
              x.classList.toggle("enh-on", deaccent(x.textContent.trim()) === chip && chip !== "")
            );
            applyDir();
          })
        );
      }
    }

    return () => clearInterval(id);
  }, []);

  return null;
}
