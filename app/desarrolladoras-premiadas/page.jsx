import RankingDevsView from "../_views/RankingDevsView";
import { SITE } from "../../lib/constants";

export const revalidate = 86400;
const PATH = "/desarrolladoras-premiadas/";

export const metadata = {
  title: "Desarrolladoras Premiadas en Argentina: Edificios con Premios Verificados (2026)",
  description: "Desarrolladoras y estudios con premios de arquitectura a obras construidas, verificados con el organizador o la prensa. Premio, año, edificio y fuente.",
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ["¿Qué premios cuentan para el sello?", "Premios o distinciones a una obra construida (arquitectura, diseño o desarrollo), confirmados en el sitio del organizador o en la prensa. No contamos premios que solo aparecen en la web de la propia empresa ni concursos de anteproyecto."],
  ["¿Un edificio premiado es mejor inversión?", "No necesariamente. Un premio habla de la calidad del diseño y la obra, no del precio ni de la rentabilidad. Es una señal más de calidad para sumar a la trayectoria y al análisis de precio por m² del barrio."],
];

export default function Page() {
  return (
    <RankingDevsView
      tipo="premiada"
      path={PATH}
      h1="Desarrolladoras premiadas: edificios con premios verificados"
      faq={FAQ}
      intro={<>
        <p>Desarrolladoras y estudios cuyas obras construidas recibieron premios de arquitectura o diseño, verificados con el organizador o con prensa. Para cada uno mostramos el premio, el año, el edificio y la fuente.</p>
      </>}
    />
  );
}
