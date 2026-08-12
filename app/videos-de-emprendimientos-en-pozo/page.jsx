import Link from "next/link";
import { SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import { barrioNombre } from "../../lib/barrios";
import reelsData from "../../data/reels.json";
import ReelsGrid from "../reels/ReelsGrid";

const REELS = Array.isArray(reelsData?.reels) ? reelsData.reels : [];
const URL_PATH = "/videos-de-emprendimientos-en-pozo/";

export const metadata = {
  title: "Videos de emprendimientos en pozo en CABA | Avance de obra",
  description:
    "Mirá videos de emprendimientos en pozo en CABA por barrio: recorridos, avances de obra y renders 3D de desarrollos en Palermo, Belgrano, Puerto Madero y más.",
  alternates: { canonical: `${SITE}${URL_PATH}` },
};

const FAQ = [
  ["¿Se puede ver la obra antes de comprar un departamento en pozo?", "Sí. Muchas desarrolladoras publican avances de obra en video mes a mes, recorridos del emprendimiento y renders 3D, y en varios proyectos hay departamento pilot o visita a obra. Este directorio reúne esos videos por barrio para que veas cómo avanza un proyecto antes de decidir."],
  ["¿Cómo es un departamento en pozo por dentro?", "Antes de la entrega lo ves de tres formas: renders 3D (cómo va a quedar), recorridos o tours del proyecto, y —si existe— el departamento pilot. El render muestra la expectativa; el avance de obra en video muestra la realidad. Conviene mirar ambos."],
  ["¿Qué es un \"avance de obra\" y cada cuánto se publica?", "Es un reporte periódico —en general mensual— que muestra cómo progresa la construcción. Que una desarrolladora publique avances de obra regularmente es una buena señal de transparencia y seriedad."],
  ["¿Cuál es la diferencia entre un render y un video real de obra?", "El render es una imagen o animación 3D de cómo va a quedar la unidad terminada; el video de obra muestra el estado real de la construcción hoy. Cruzar los dos te ayuda a calibrar expectativa contra realidad."],
  ["¿Los videos son de Departamentos en Pozo?", "No. Somos un portal de análisis independiente: no producimos ni somos dueños de estos videos. Los reunimos como referencia y siempre enlazamos a la cuenta original (YouTube, Instagram o TikTok) que los publicó."],
  ["¿Cómo sumo el video de mi emprendimiento?", "Si sos desarrolladora o broker y querés que sumemos el video de tu proyecto en pozo, escribinos desde la sección de contacto con el link y el barrio."],
];

export default function VideosPage() {
  const zonasConVideo = [...new Set(REELS.map((r) => barrioNombre(r.barrio)))];

  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Videos de emprendimientos en pozo", item: `${SITE}${URL_PATH}` },
    ]},
    { "@context": "https://schema.org", "@type": "CollectionPage",
      name: "Videos de emprendimientos en pozo en CABA",
      description: "Videos de desarrollos en pozo en CABA, filtrables por barrio: avances de obra, recorridos y renders.",
      url: `${SITE}${URL_PATH}`,
      hasPart: REELS.map((r) => ({
        "@type": "VideoObject",
        name: r.title,
        embedUrl: r.platform === "youtube" ? `https://www.youtube.com/embed/${r.videoId}` : r.url,
        contentUrl: r.url,
        thumbnailUrl: r.platform === "youtube" ? `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg` : undefined,
        ...(r.proyecto ? { about: r.proyecto } : {}),
      })),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <article>
      <JsonLd data={schema} />
      <PageHeader>
        <p className="font-label-caps text-label-caps text-link-gold mb-3">VIDEOS · POR BARRIO</p>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Videos de emprendimientos en pozo en CABA
        </h1>
        <p className="text-on-primary-fixed-variant text-body-lg mt-4 max-w-2xl">
          Recorridos, avances de obra y renders de desarrollos en preventa. Filtrá por barrio y mirá el video directo, sin salir del sitio.
        </p>
      </PageHeader>

      <Container className="py-12">
        <ReelsGrid reels={REELS} />

        <div className="wp-content mt-14 max-w-3xl">
          <h2 id="videos-por-barrio">Videos por barrio</h2>
          <p>
            Reunimos videos públicos de <strong>emprendimientos en pozo</strong> (preventa) en la Ciudad de Buenos Aires y los ordenamos por barrio para que compares proyectos rápido. Usá los chips de arriba para ver sólo la zona que te interesa
            {zonasConVideo.length > 0 ? <> —hoy hay material de {zonasConVideo.join(", ")}—</> : null} y hacé click en cualquier card para reproducir el video embebido. Cada uno enlaza a la cuenta original que lo publicó.
          </p>

          <h2 id="avance-de-obra">Avance de obra: cómo seguir tu inversión mes a mes</h2>
          <p>
            El <strong>avance de obra</strong> es el reporte periódico con el que una desarrolladora muestra cómo progresa la construcción. Seguir estos videos te sirve para dos cosas: antes de comprar, para ver si un proyecto avanza en serio; y después de comprar, para monitorear tu inversión. Que una empresa publique avances de obra de forma regular es una señal de transparencia. Cruzá lo que ves con la etapa declarada en el <Link href="/desarrollos-inmobiliarios/">catálogo de desarrollos</Link> y con la trayectoria de la <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/">desarrolladora</Link>.
          </p>

          <h2 id="recorridos-y-renders">Recorridos y renders 3D: cómo se ve el departamento antes de la entrega</h2>
          <p>
            Antes de la entrega, un departamento en pozo se conoce por <strong>renders 3D</strong> (cómo va a quedar), <strong>recorridos o tours</strong> del proyecto y, cuando existe, el <strong>departamento pilot</strong>. El render muestra la expectativa; el video de obra, la realidad. Mirar ambos te da una lectura más honesta del proyecto.
          </p>

          <h2 id="como-usar">Cómo usar estos videos para decidir</h2>
          <p>
            Los videos son una primera aproximación: para decidir, cruzalos con el <Link href="/desarrollos-inmobiliarios/">catálogo de desarrollos</Link> (precio, tipologías y etapa de obra), revisá cómo evaluar la solidez de una <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/">desarrolladora</Link>, estimá tu cuota con el <Link href="/simulador-cuota-cac-pozo/">simulador de ajuste CAC</Link> y, si estás empezando, leé la guía <Link href="/que-es-un-departamento-en-pozo-guia-completa/">qué es un departamento en pozo</Link>. Si querés que te avisemos de nuevos lanzamientos, sumate a las <Link href="/alertas-de-lanzamientos-en-pozo/">alertas de lanzamientos</Link>.
          </p>
          <p className="text-[13px] text-on-surface-variant">
            <strong>Nota:</strong> no producimos estos videos ni representamos a los proyectos. Es contenido informativo de terceros, embebido desde su plataforma original. No constituye asesoramiento financiero ni una oferta.
          </p>

          <h2 id="faq">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl">
          <Faq items={FAQ} />
        </div>
      </Container>
    </article>
  );
}
