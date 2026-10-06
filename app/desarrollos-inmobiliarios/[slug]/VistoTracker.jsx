"use client";
// Registra la ficha vista (barrio, precio, ambientes) para personalizar listado y home. Sin UI.
import { useEffect } from "react";
import { registrarVista, grupoPers } from "../../../lib/afinidad";

export default function VistoTracker({ slug, barrio, precio, ambientes }) {
  useEffect(() => {
    grupoPers();
    registrarVista({ slug, barrio, precio, ambientes: String(ambientes || "").split(/[,\s]+/).filter((x) => /\d/.test(x)) });
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
