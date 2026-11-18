'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Métricas propias (sin datos personales), en lote cada pocos segundos vía sendBeacon:
//  - imp: una tarjeta de proyecto (data-imp-slug) estuvo ≥50% visible ≥600 ms (1 vez por página).
//  - vis: visita a una ficha /desarrollos-inmobiliarios/{slug}/.
//  - wa:  clic en un link de WhatsApp dentro de una ficha.
const FICHA = /^\/desarrollos-inmobiliarios\/([a-z0-9-]+)\/?$/;
let cola = [];
let timer = null;
function flush() {
  if (!cola.length) return;
  const body = JSON.stringify({ e: cola.splice(0, 300) });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }));
    else fetch('/api/track', { method: 'POST', body, keepalive: true });
  } catch (e) {}
}
function push(s, t) {
  cola.push({ s, t });
  if (!timer) timer = setTimeout(() => { timer = null; flush(); }, 4000);
}

export default function MetricsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const vistos = new Set();
    const m = FICHA.exec(pathname || '');
    const fichaSlug = m ? m[1] : null;
    if (fichaSlug) push(fichaSlug, 'vis');

    const timers = new Map();
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      for (const en of entries) {
        const s = en.target.getAttribute('data-imp-slug');
        if (!s || vistos.has(s)) continue;
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!timers.has(en.target)) timers.set(en.target, setTimeout(() => { vistos.add(s); push(s, 'imp'); io.unobserve(en.target); }, 600));
        } else if (timers.has(en.target)) { clearTimeout(timers.get(en.target)); timers.delete(en.target); }
      }
    }, { threshold: [0.5] }) : null;
    const observar = (root) => { if (!io) return; root.querySelectorAll && root.querySelectorAll('[data-imp-slug]').forEach((el) => io.observe(el)); };
    observar(document);
    const mo = new MutationObserver((muts) => { for (const mu of muts) mu.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.hasAttribute && n.hasAttribute('data-imp-slug')) io && io.observe(n); observar(n); } }); });
    mo.observe(document.body, { childList: true, subtree: true });

    const onClick = (e) => {
      const a = e.target && e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com/send"]');
      if (a && fichaSlug) push(fichaSlug, 'wa');
    };
    document.addEventListener('click', onClick, true);
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { io && io.disconnect(); mo.disconnect(); document.removeEventListener('click', onClick, true); document.removeEventListener('visibilitychange', onHide); timers.forEach(clearTimeout); flush(); };
  }, [pathname]);

  return null;
}
