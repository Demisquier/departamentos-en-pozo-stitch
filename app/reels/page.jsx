import Link from "next/link";
import { SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import { barrioNombre } from "../../lib/barrios";
import reelsData from "../../data/reels.json";
import ReelsGrid from "./ReelsGrid";

const REELS = Array.isArray(reelsData?.reels) ? reelsData.reels : [];

export const metadata = {
  title: "Reels de emprendimientos en pozo por barrio | Departamentos en Pozo",
  description:
    "Videos y reels de desarrollos en pozo en CABA, filtrables por barrio: recorridos, avances de obra y renders de emprendimientos en Palermo, Belgrano, Caballito, Puerto Madero y más.",
  alternates: { canonical: `${SITE}/reels/` },
};

const FAQ = [
  ["¿Qué son estos reels?", "Es un directorio curado de videos públicos de emprendimientos en pozo (preventa) en la Ciudad de Buenos Aires: recorridos, avances de obra y renders publicados por desarrolladoras y brokers. Cada video se embebe desde su plataforma original (YouTube, Instagram o TikTok) y enlaza a la fuente."],
  ["¿Puedo filtrar por barrio?", "Sí. Los chips de arriba filtran los videos por barrio. Si elegís, por ejemplo, Villa Urquiza, vas a ver sólo emprendimientos de esa zona. Sólo aparecen los barrios que tienen al menos un video cargado."],
  ["¿Los videos son de Departamentos en Pozo?", "No. Somos un portal de análisis independiente: no producimos ni somos dueños de estos videos. Los reunimos como referencia y siempre linkeamos a la cuenta original que los publicó."],
  ["¿Cómo sumo un emprendimiento?", "Si sos desarrolladora o broker y querés que sumemos el video de tu proyecto en pozo, escribinos desde la sección de contacto con el link y el barrio."],
];

export default function ReelsPage() {
  const zonasConVideo = [...new Set(REELS.map((r) => barrioNombre(r.barrio)))];

  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Reels de emprendimientos", item: `${SITE}/reels/` },
    ]},
    { "@context": "https://schema.org", "@type": "CollectionPage",
      name: "Reels de emprendimientos en pozo por barrio",
      description: "Videos de desarrollos en pozo en CABA, filtrables por barrio.",
      url: `${SITE}/reels/`,
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
          Reels de emprendimientos en pozo
        </h1>
        <p className="text-on-primary-fixed-variant text-body-lg mt-4 max-w-2xl">
          Recorridos, avances de obra y renders de desarrollos en pozo en CABA. Filtrá por barrio y mirá el video directo, sin salir del sitio.
        </p>
      </PageHeader>

      <Container className="py-12">
        <ReelsGrid reels={REELS} />

        <div className="wp-content mt-14 max-w-3xl">
          <h2 id="como-usar">Cómo usar esta sección</h2>
          <p>
            Reunimos videos públicos de <strong>emprendimientos en pozo</strong> (preventa) en la Ciudad de Buenos Aires y los ordenamos por barrio para que compares proyectos rápido. Usá los chips de arriba para ver sólo la zona que te interesa
            {zonasConVideo.length > 0 ? <> —hoy hay material de {zonasConVideo.join(", ")}—</> : null} y hacé click en cualquier card para reproducir el video embebido. Cada uno enlaza a la cuenta original que lo publicó.
          </p>
          <p>
            Los videos son una primera aproximación: para decidir, cruzalos con el <Link href="/desarrollos-inmobiliarios/">catálogo de desarrollos</Link> (precio, tipologías y etapa de obra), revisá cómo evalúan la solidez de una <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/">desarrolladora</Link> y estimá tu cuota con el <Link href="/simulador-cuota-cac-pozo/">simulador de ajuste CAC</Link>. Si querés que te avisemos de nuevos lanzamientos, sumate a las <Link href="/alertas-de-lanzamientos-en-pozo/">alertas de lanzamientos</Link>.
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
