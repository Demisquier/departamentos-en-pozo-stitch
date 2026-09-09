// app/asesor-ia/page.jsx — Asesor IA (chat GPT real, env-gated). Noindex por ahora (beta).
import Container from "../_ui/Container";
import { SITE } from "../../lib/wp";
import AsesorIA from "./AsesorIA";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Asesor IA · Departamentos en Pozo",
  description: "Consultá con nuestro asesor de inversión en pozo asistido por IA: te orienta sobre proyectos, barrios y riesgos, con datos de nuestro catálogo independiente.",
  alternates: { canonical: `${SITE}/asesor-ia/` },
  robots: { index: false, follow: false },
};

export default function AsesorIAPage() {
  return (
    <Container as="main" className="py-3 md:py-14">
      <div className="max-w-xl mx-auto text-center mb-3 md:mb-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-[12px] font-label-caps uppercase tracking-wider text-secondary border border-outline-variant rounded-full px-2.5 py-0.5 md:py-1 mb-2 md:mb-3">
          <span className="material-symbols-outlined text-[15px] md:text-[16px]">auto_awesome</span> Beta
        </span>
        <h1 className="font-headline-md text-[26px] md:text-display-lg text-primary leading-tight mb-1.5 md:mb-3">Asesor IA</h1>
        <p className="text-on-surface-variant font-body-lg text-body-md md:text-body-lg hidden sm:block">
          Preguntá sobre proyectos, barrios, precios o riesgos del pozo. Respuestas basadas en nuestro catálogo independiente — no somos comercial de las desarrolladoras.
        </p>
      </div>
      <div className="max-w-xl mx-auto h-[calc(100dvh-190px)] min-h-[440px] md:h-[72vh] md:min-h-[520px]">
        <AsesorIA />
      </div>
      <p className="text-[12px] text-on-surface-variant mt-6 max-w-xl mx-auto text-center leading-relaxed">
        Las respuestas son orientativas y pueden contener errores. No constituyen asesoramiento financiero. Verificá siempre precio, forma de pago y avance de obra en la ficha del proyecto.
      </p>
    </Container>
  );
}
