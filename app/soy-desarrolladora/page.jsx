// app/soy-desarrolladora/page.jsx — Sección para desarrolladoras: deja claro que nuestros datos
// no están validados oficialmente e invita a actualizarlos, corregirlos o conversar (formulario).
import Container from "../_ui/Container";
import { SITE } from "../../lib/wp";
import SoyDesarrolladoraForm from "./SoyDesarrolladoraForm";

export const metadata = {
  title: "Soy desarrolladora — actualizá tus datos | Departamentos en Pozo",
  description: "Listamos desarrolladoras y proyectos en pozo de CABA con datos públicos, no validados oficialmente. Si sos la desarrolladora y querés actualizar tus datos, sumar un proyecto o conversar, escribinos.",
  alternates: { canonical: `${SITE}/soy-desarrolladora/` },
};

export default function SoyDesarrolladoraPage() {
  return (
    <Container as="main" className="py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">¿Sos una desarrolladora?</h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg">
            Actualizá tus datos, sumá un proyecto o conversemos. Nos encargamos de que tu ficha refleje lo correcto.
          </p>
        </div>

        {/* Transparencia: los datos que mostramos son públicos y no están validados oficialmente. */}
        <div className="border border-outline-variant rounded-xl p-5 mb-6 bg-surface-container-low flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-link-gold shrink-0">info</span>
          <p className="text-[13.5px] text-on-surface leading-relaxed">
            Los datos de desarrolladoras y proyectos que publicamos provienen de <strong>fuentes públicas y no están validados oficialmente</strong> con cada empresa. Si sos la desarrolladora y algo no está actualizado o correcto, escribinos y lo ajustamos apenas lo confirmes — sin costo.
          </p>
        </div>

        <SoyDesarrolladoraForm />

        <p className="text-[12px] text-on-surface-variant text-center mt-4">
          También podés escribirnos directo a <a href="mailto:contacto@departamentosenpozo.com.ar" className="text-secondary underline hover:no-underline">contacto@departamentosenpozo.com.ar</a>.
        </p>
      </div>
    </Container>
  );
}
