import Container from "../_ui/Container";
import Breadcrumb from "../_ui/Breadcrumb";
import BuscadorConversacional from "../_ui/BuscadorConversacional";
import { SITE } from "../../lib/wp";

export const revalidate = 3600;

export const metadata = {
  title: "Buscá tu departamento en pozo hablando | Departamentos en Pozo",
  description: "Buscador conversacional: describí lo que buscás en una frase (barrio, ambientes, precio, entrega, financiación) y te mostramos los proyectos en pozo que matchean. Sin filtros, sin scroll.",
  alternates: { canonical: SITE + "/buscar/" },
};

export default function BuscarPage() {
  return (
    <Container as="main" className="py-8 md:py-12">
      <Breadcrumb tone="light" sep="/" sepAriaHidden={false} className="mb-6"
        items={[{ name: "Inicio", href: "/" }, { name: "Buscar" }]} />

      <div className="max-w-3xl">
        <h1 className="font-display-lg text-headline-md md:text-display-lg text-primary leading-tight">
          Buscá tu departamento en pozo <span className="text-secondary">hablando</span>
        </h1>
        <p className="text-body-lg text-on-surface-variant mt-3">
          Olvidate de los filtros. Escribí lo que buscás en una sola frase — barrio, ambientes, precio,
          entrega, financiación — y te mostramos los proyectos en pozo que matchean.
        </p>
      </div>

      <div className="mt-8">
        <BuscadorConversacional />
      </div>

      <p className="text-[12px] text-on-surface-variant mt-10 max-w-3xl leading-relaxed">
        La búsqueda corre sobre nuestro catálogo de proyectos en pozo relevados en CABA y GBA. Los datos son de
        fuentes públicas y de las comercializadoras, pueden variar y no constituyen asesoramiento financiero.
        Entrá a cada ficha para el precio actualizado, la forma de pago y el avance de obra.
      </p>
    </Container>
  );
}
