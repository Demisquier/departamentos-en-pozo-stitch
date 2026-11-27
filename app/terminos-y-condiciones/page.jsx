// app/terminos-y-condiciones/page.jsx — Términos y condiciones de uso del sitio y de la app
// (ChatGPT / conectores MCP). Requisito del directorio de plugins de OpenAI (termsOfServiceURL).
// Misma estructura que /politica-de-privacidad/.
import Link from "next/link";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import Breadcrumb from "../_ui/Breadcrumb";
import { CONTACT_EMAIL } from "../../lib/constants";

export const metadata = {
  title: "Términos y condiciones | Departamentos en Pozo",
  description:
    "Condiciones de uso de Departamentos en Pozo y de su app para ChatGPT y otros asistentes: alcance de la información, precios de referencia, consultas a desarrolladoras y responsabilidades.",
  alternates: { canonical: "/terminos-y-condiciones/" },
};

function Bloque({ icon, titulo, children }) {
  return (
    <section className="max-w-[70ch]">
      <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[22px] text-link-gold">{icon}</span>
        {titulo}
      </h2>
      <div className="text-on-surface-variant text-[15px] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  const mail = (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary font-medium hover:underline">{CONTACT_EMAIL}</a>
  );
  return (
    <article>
      <PageHeader py="py-14 md:py-20">
        <Breadcrumb
          tone="dark"
          sep="›"
          ariaLabel="Migas de pan"
          className="mb-6"
          items={[{ name: "Inicio", href: "/" }, { name: "Términos y condiciones" }]}
        />
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Términos y condiciones
        </h1>
        <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">
          Condiciones de uso de departamentosenpozo.com.ar y de la app de Departamentos en Pozo para ChatGPT y otros
          asistentes de IA. Al usar el sitio o la app aceptás estas condiciones.
        </p>
      </PageHeader>

      <Container className="py-12 md:py-14 space-y-10">
        <Bloque icon="info" titulo="Qué es Departamentos en Pozo">
          <p>
            Departamentos en Pozo es un portal independiente que reúne y analiza información pública de proyectos de
            departamentos en pozo y en construcción de CABA y GBA. No somos inmobiliaria ni desarrolladora, no
            intermediamos en la compraventa y no cobramos comisión por las operaciones.
          </p>
        </Bloque>

        <Bloque icon="fact_check" titulo="Alcance de la información">
          <p>
            Los precios, tipologías, fechas de entrega, formas de pago y demás datos de cada proyecto provienen de las
            desarrolladoras, de quienes los comercializan o de publicaciones públicas, y pueden cambiar sin aviso. Son{" "}
            <strong className="text-primary">valores de referencia</strong>: antes de reservar o firmar, confirmá
            precio, condiciones, estructura legal y avance de obra con quien comercializa el proyecto.
          </p>
          <p>
            Los análisis, rankings, índices y comparaciones son información general y{" "}
            <strong className="text-primary">no constituyen asesoramiento financiero, legal ni impositivo</strong>.
          </p>
        </Bloque>

        <Bloque icon="forum" titulo="App para ChatGPT y otros asistentes de IA">
          <p>
            La app permite buscar, filtrar y comparar proyectos del catálogo, ver estadísticas de precios y, si lo
            pedís, solicitar que el responsable de un proyecto te contacte. Las respuestas del asistente se generan a
            partir de nuestros datos, pero el texto final lo produce el asistente: ante cualquier diferencia, vale la
            información publicada en la ficha del proyecto en nuestro sitio.
          </p>
          <p>
            La solicitud de contacto solo se envía cuando vos la pedís, con los datos que vos indicás, y se comparte
            con la inmobiliaria o desarrolladora del proyecto elegido, según nuestra{" "}
            <Link href="/politica-de-privacidad/" className="text-secondary hover:underline">Política de privacidad</Link>.
          </p>
        </Bloque>

        <Bloque icon="real_estate_agent" titulo="Consultas a desarrolladoras e inmobiliarias">
          <p>
            Cuando enviás una consulta, la relación comercial es directamente entre vos y quien comercializa el
            proyecto. Departamentos en Pozo no garantiza la respuesta, las condiciones ofrecidas ni la ejecución de la
            obra, y no es parte de ninguna operación.
          </p>
        </Bloque>

        <Bloque icon="gavel" titulo="Uso aceptable y propiedad">
          <p>
            Podés usar el sitio y la app para fines personales. No está permitido extraer el catálogo de forma masiva
            ni usarlo para enviar comunicaciones no solicitadas. Las marcas, imágenes y renders pertenecen a sus
            titulares; si sos titular de un proyecto y querés corregir datos o darlo de baja, escribinos a {mail}.
          </p>
        </Bloque>

        <Bloque icon="support_agent" titulo="Soporte y contacto">
          <p>
            Para dudas, reclamos o pedidos de corrección, escribinos a {mail} o usá la página de{" "}
            <Link href="/contacto/" className="text-secondary hover:underline">contacto</Link>. Respondemos dentro de las
            72 horas hábiles. Estos términos se rigen por las leyes de la República Argentina.
          </p>
        </Bloque>

        <p className="text-[13px] text-on-surface-variant max-w-[70ch]">
          Última actualización: noviembre 2026. La versión vigente es siempre la publicada en esta página.
        </p>
      </Container>
    </article>
  );
}
