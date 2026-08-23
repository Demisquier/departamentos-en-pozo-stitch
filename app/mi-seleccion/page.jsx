// app/mi-seleccion/page.jsx — Landing PRIVADA del usuario (propiedades guardadas).
// Server component solo para setear metadata noindex (es privada, no debe indexarse);
// toda la lógica vive en el client component MiSeleccion.
import Container from "../_ui/Container";
import MiSeleccion from "./MiSeleccion";
import { getDesarrollos } from "../../lib/wp";
import { mapDesarrollos } from "../../lib/catalogo";

export const metadata = {
  title: "Mi Plan | Departamentos en Pozo",
  description: "Tu plan de inversión en pozo: los proyectos que guardaste, tu objetivo y presupuesto, y las novedades de lo que seguís.",
  robots: { index: false, follow: false },
};

export default async function MiSeleccionPage() {
  // Catálogo mapeado (campos mínimos) para calcular "similares" en el cliente contra lo guardado.
  let catalogo = [];
  try {
    const mapped = mapDesarrollos(await getDesarrollos());
    catalogo = mapped.map((m) => ({
      slug: m.slug, nombre: m.nombre, barrio: m.barrio, direccion: m.direccion,
      precio: m.precio, precioM2: m.precioM2, precioDesde: m.precioDesde,
      ambientes: m.ambientes, entrega: m.entrega, etapa: m.etapa,
      imagen: m.imagen, desarrolladora: m.desarrolladora,
    }));
  } catch (e) { catalogo = []; }

  return (
    <Container as="main" className="py-10 md:py-14">
      <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-2">Mi Plan</h1>
      <p className="text-on-surface-variant font-body-lg text-body-lg mb-8 max-w-2xl">
        Tu plan de inversión en pozo: los proyectos que guardaste, tu objetivo y presupuesto, y qué cambió para vos. Te ayudamos a decidir. Se guarda en tu cuenta para que lo veas desde cualquier dispositivo.
      </p>
      <MiSeleccion catalogo={catalogo} />
    </Container>
  );
}
