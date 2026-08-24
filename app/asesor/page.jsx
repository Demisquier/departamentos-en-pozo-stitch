// app/asesor/page.jsx — Página del asistente guiado que arma el perfil del comprador.
import Container from "../_ui/Container";
import { SITE } from "../../lib/wp";
import AsesorChat from "./AsesorChat";

export const metadata = {
  title: "Armá tu perfil de comprador | Departamentos en Pozo",
  description: "Contanos qué buscás en 2 minutos y te acompañamos con propuestas de pozo a tu medida. Guardás tu perfil y tu selección en un solo lugar.",
  alternates: { canonical: `${SITE}/asesor/` },
};

export default function AsesorPage() {
  return (
    <Container as="main" className="py-4 md:py-14">
      <div className="max-w-xl mx-auto text-center mb-4 md:mb-8">
        <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">Armá tu perfil, te acompañamos</h1>
        <p className="text-on-surface-variant font-body-lg text-body-lg">
          Contanos qué buscás en 2 minutos. Guardamos tu perfil en tu selección y te ayudamos a encontrar el proyecto en pozo que va con vos — sin presiones.
        </p>
      </div>
      <div className="max-w-xl mx-auto h-[calc(100dvh-210px)] min-h-[440px] md:h-[72vh] md:min-h-[520px]">
        <AsesorChat />
      </div>
    </Container>
  );
}
