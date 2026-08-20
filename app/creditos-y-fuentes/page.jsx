// app/creditos-y-fuentes/page.jsx — Transparencia de fuentes (imágenes, contenido y datos).
// Resguardo legal: declara de dónde sale cada material y ofrece un canal de reclamo
// (notice-and-takedown) a contacto@. Página estática, indexable.
import Link from "next/link";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import Breadcrumb from "../_ui/Breadcrumb";
import { CONTACT_EMAIL } from "../../lib/constants";

export const metadata = {
  title: "Créditos y fuentes | Departamentos en Pozo",
  description:
    "De dónde provienen las imágenes, los contenidos y los datos de Departamentos en Pozo. Transparencia de fuentes y canal de reclamo de derechos.",
  alternates: { canonical: "/creditos-y-fuentes/" },
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

export default function CreditosPage() {
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
          items={[{ name: "Inicio", href: "/" }, { name: "Créditos y fuentes" }]}
        />
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Créditos y fuentes
        </h1>
        <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">
          Trabajamos con el criterio de citar el origen de cada imagen y cada dato. Acá explicamos de dónde
          provienen los materiales del sitio y cómo pedir una corrección o el retiro de un contenido.
        </p>
      </PageHeader>

      <Container className="py-12 md:py-14 space-y-10">
        <Bloque icon="photo_library" titulo="Imágenes y fotografías">
          <p>
            <strong className="text-primary">Fotos editoriales de las guías.</strong> Usamos imágenes con licencia de
            bancos de imágenes libres de regalías (principalmente <a href="https://www.pexels.com" target="_blank" rel="noopener nofollow" className="text-secondary hover:underline">Pexels</a>),
            con crédito al autor al pie de cada foto.
          </p>
          <p>
            <strong className="text-primary">Renders y fotos de proyectos.</strong> Las imágenes que ilustran cada
            desarrollo son de referencia, gentileza de la desarrolladora o tomadas de fuentes públicas (portales
            inmobiliarios y sitios oficiales de los proyectos). Se muestran con fin informativo, para identificar cada
            emprendimiento; los derechos pertenecen a sus autores o titulares.
          </p>
          <p>
            <strong className="text-primary">Logos y marcas.</strong> Los logos de desarrolladoras, inmobiliarias y
            terceros pertenecen a sus respectivos titulares y se utilizan únicamente con fines de identificación.
          </p>
        </Bloque>

        <Bloque icon="edit_note" titulo="Contenido y datos">
          <p>
            <strong className="text-primary">Textos y análisis.</strong> Las guías, comparativas y notas son producción
            propia del equipo de Departamentos en Pozo. Escribimos con criterio independiente: no cobramos por aparecer
            ni recibimos comisión por derivar consultas.
          </p>
          <p>
            <strong className="text-primary">Datos de proyectos, precios y desarrolladoras.</strong> Se recopilan de
            fuentes públicas —portales inmobiliarios, sitios oficiales de las desarrolladoras y organismos públicos— y
            se ordenan para facilitar la comparación. Son de referencia y pueden variar; verificá cada dato con la
            fuente original antes de decidir.
          </p>
          <p>
            El contenido tiene fines informativos y educativos y no constituye asesoramiento financiero, legal ni
            impositivo, ni una oferta o recomendación de inversión.
          </p>
        </Bloque>

        <Bloque icon="verified_user" titulo="¿Sos desarrolladora y querés validar tus datos?">
          <p>
            Si desarrollás o comercializás un proyecto que figura en el sitio y querés que su ficha (precio, avance de
            obra, tipologías, formas de pago e imágenes) esté completa y validada, escribinos a {mail} y la
            actualizamos con tu información oficial.
          </p>
        </Bloque>

        <Bloque icon="gavel" titulo="Reclamo de derechos (retiro o corrección)">
          <p>
            Publicamos de buena fe y con intención de acreditar correctamente cada fuente. Si sos titular de los
            derechos de una imagen, texto o dato y querés que lo acreditemos de otra forma, lo modifiquemos o lo
            retiremos, escribinos a {mail} indicando el material y el enlace. Damos de baja o corregimos a la brevedad.
          </p>
        </Bloque>

        <div className="pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver al inicio
          </Link>
        </div>
      </Container>
    </article>
  );
}
