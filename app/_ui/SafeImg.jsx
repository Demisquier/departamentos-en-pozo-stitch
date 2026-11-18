'use client';
import { useState } from 'react';

// Imagen con fallback: si una URL no carga (render caído, hotlink bloqueado) prueba la siguiente;
// si ninguna carga no muestra nada (queda el fondo de color del contenedor). Evita íconos rotos.
export default function SafeImg({ srcs = [], alt = '', className = '' }) {
  const list = (Array.isArray(srcs) ? srcs : [srcs]).filter(Boolean);
  const [i, setI] = useState(0);
  if (i >= list.length) return null;
  return (
    <img key={list[i]} data-own-fallback="" src={list[i]} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={className}
      onError={() => setI((n) => n + 1)} />
  );
}
