// app/politica-de-privacidad/page.jsx — Política de privacidad y protección de datos.
// Resguardo legal (Ley 25.326 de Protección de Datos Personales + AAIP): declara qué datos
// se recogen en los formularios de lead, con qué finalidad, con quién se comparten
// (desarrolladora / inmobiliaria del proyecto) y los derechos del titular. Página estática,
// indexable. Clona la estructura de /creditos-y-fuentes/.
import Link from "next/link";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import Breadcrumb from "../_ui/Breadcrumb";
import { CONTACT_EMAIL } from "../../lib/constants";

export const metadata = {
  title: "Política de privacidad | Departamentos en Pozo",
  description:
    "Qué datos personales recopilamos, con qué finalidad, con quién los compartimos y cómo ejercer tus derechos de acceso, rectificación y supresión (Ley 25.326, AAIP).",
  alternates: { canonical: "/politica-de-privacidad/" },
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

export default function PrivacidadPage() {
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
          items={[{ name: "Inicio", href: "/" }, { name: "Política de privacidad" }]}
        />
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Política de privacidad
        </h1>
        <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">
          Qué datos personales recopilamos, para qué los usamos, con quién los compartimos y cómo podés
          ejercer tus derechos. Tratamos tus datos conforme a la Ley 25.326 de Protección de Datos Personales de la
          República Argentina.
        </p>
      </PageHeader>

      <Container className="py-12 md:py-14 space-y-10">
        <Bloque icon="badge" titulo="Quién es el responsable">
          <p>
            El responsable del tratamiento de los datos es <strong className="text-primary">Departamentos en Pozo</strong>{" "}
            (<a href="https://departamentosenpozo.com.ar/" className="text-secondary hover:underline">departamentosenpozo.com.ar</a>),
            un portal de análisis independiente sobre inversión en departamentos en pozo. No somos inmobiliaria ni
            desarrolladora. Para cualquier consulta sobre tus datos, escribinos a {mail}.
          </p>
        </Bloque>

        <Bloque icon="contact_page" titulo="Qué datos recopilamos">
          <p>
            Recogemos únicamente los datos que nos dejás de forma voluntaria en los formularios del sitio (contacto por
            un proyecto, WhatsApp, chat con el asesor, alta de alertas de lanzamientos): típicamente{" "}
            <strong className="text-primary">nombre, email, número de WhatsApp/teléfono</strong> y el proyecto o barrio que
            te interesa. No pedimos datos sensibles ni información financiera.
          </p>
          <p>
            Además, como la mayoría de los sitios, recopilamos datos de navegación anónimos o seudonimizados mediante
            herramientas de analítica (ver “Cookies y analítica”).
          </p>
        </Bloque>

        <Bloque icon="target" titulo="Para qué usamos tus datos (finalidad)">
          <p>
            Usamos tus datos de contacto con una finalidad concreta: <strong className="text-primary">ponerte en
            contacto con quien comercializa el proyecto que te interesó</strong> —la inmobiliaria o, en su defecto, la
            desarrolladora— para que respondan tu consulta, y para enviarte las alertas o recomendaciones que pediste.
          </p>
          <p>
            No usamos tus datos para publicidad de terceros ajenos al proyecto, no los vendemos y no armamos perfiles
            comerciales con ellos.
          </p>
        </Bloque>

        <Bloque icon="share" titulo="Con quién compartimos tus datos">
          <p>
            Al enviar una consulta por un proyecto, <strong className="text-primary">compartimos tus datos de contacto
            con la inmobiliaria o la desarrolladora que comercializa ese proyecto</strong>, que es quien te va a
            contactar. Ese es el motivo por el que dejás tus datos.
          </p>
          <p>
            También utilizamos proveedores que nos ayudan a operar el sitio (hosting, envío de emails y analítica), que
            tratan los datos por nuestra cuenta y bajo confidencialidad. No cedemos tus datos a ningún otro tercero,
            salvo requerimiento legal.
          </p>
        </Bloque>

        <Bloque icon="cookie" titulo="Cookies y analítica">
          <p>
            Usamos cookies y herramientas de analítica (como Google Analytics) para entender cómo se usa el sitio y
            mejorarlo. Esta información se trata de forma agregada y no identifica a personas de forma directa. Podés
            bloquear o borrar las cookies desde la configuración de tu navegador.
          </p>
        </Bloque>

        <Bloque icon="verified_user" titulo="Tus derechos (acceso, rectificación, supresión)">
          <p>
            Como titular de los datos, tenés derecho a acceder a tus datos, rectificarlos, actualizarlos y pedir su
            supresión. Para ejercerlos, escribinos a {mail} y lo resolvemos a la brevedad. También podés pedir en
            cualquier momento que dejemos de contactarte o que demos de baja tu alerta.
          </p>
          <p className="text-[13px]">
            La <strong className="text-primary">Agencia de Acceso a la Información Pública (AAIP)</strong>, órgano de
            control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos respecto del incumplimiento de
            las normas sobre protección de datos personales.
          </p>
        </Bloque>

        <Bloque icon="lock" titulo="Conservación y seguridad">
          <p>
            Conservamos tus datos solo durante el tiempo necesario para la finalidad para la que los diste y aplicamos
            medidas razonables para protegerlos. Si pedís la baja, los eliminamos de nuestros registros activos.
          </p>
        </Bloque>

        <p className="text-[13px] text-on-surface-variant max-w-[70ch]">
          Esta política puede actualizarse; la versión vigente es siempre la publicada en esta página. Última
          actualización: octubre 2026. Para conocer de dónde provienen las imágenes y los datos de los proyectos, visitá{" "}
          <Link href="/creditos-y-fuentes/" className="text-secondary hover:underline">Créditos y fuentes</Link>.
        </p>

        <div className="pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver al inicio
          </Link>
        </div>
      </Container>
    </article>
  );
}
