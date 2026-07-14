"use client";
import { useEffect, useState } from "react";

// Índice sticky con scrollspy para la página pillar (larga). Lee las secciones ya
// inyectadas del contenido WP por su id. También repara el ancla muerta #comparativa.
const SECTIONS = [
  { id: "top-5", label: "Top 13" },
  { id: "directorio-90", label: "Directorio +200" },
  { id: "tabla", label: "Tabla" },
  { id: "checklist", label: "Checklist" },
  { id: "faq", label: "FAQ" },
];

export default function TocNav() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++;
      const present = SECTIONS.filter((s) => document.getElementById(s.id));
      if (present.length || n > 40) {
        clearInterval(id);
        setItems(present);
      }
    }, 150);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const onScroll = () => {
      setShow(window.scrollY > 520);
      let cur = "";
      for (const s of items) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 130) cur = s.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (!items.length) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-b border-outline-variant shadow-sm transition-transform duration-300 ${
        show ? "translate-y-0" : "-translate-y-[130%] pointer-events-none"
      }`}
    >
      <nav className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex items-center gap-1 overflow-x-auto py-2">
        <span className="text-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest pr-2 shrink-0 hidden sm:inline">
          En esta guía
        </span>
        {items.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] transition-colors shrink-0 ${
              active === s.id
                ? "bg-primary-container text-on-primary"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
            }`}
          >
            {s.label}
          </a>
        ))}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="ml-auto shrink-0 flex items-center gap-1 text-[13px] text-link-gold px-3 py-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
        </a>
      </nav>
    </div>
  );
}
