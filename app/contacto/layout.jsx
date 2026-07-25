// Layout server-side sólo para inyectar metadata en /contacto/ (la página es client
// component y no puede exportar `metadata` por sí misma).
export const metadata = {
  title: "Contacto | Departamentos en Pozo",
  description:
    "Contactá a Departamentos en Pozo para asesoría independiente de inversión en preventa en CABA y GBA. No somos inmobiliaria ni desarrolladora.",
  alternates: { canonical: "https://departamentosenpozo.com.ar/contacto/" },
};

export default function ContactoLayout({ children }) {
  return children;
}
