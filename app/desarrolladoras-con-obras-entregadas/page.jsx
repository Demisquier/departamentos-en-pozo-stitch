import RankingDevsView from "../_views/RankingDevsView";
import { SITE } from "../../lib/constants";

export const revalidate = 86400;
const PATH = "/desarrolladoras-con-obras-entregadas/";

export const metadata = {
  title: "Desarrolladoras con Obras Entregadas en CABA: Trayectoria Verificada (2026)",
  description: "Constructoras y desarrolladoras con obras terminadas y entregadas, confirmadas por prensa o publicaciones de arquitectura. Edificios, direcciones y fuentes de cada obra.",
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ["¿Por qué importa que una desarrolladora tenga obras entregadas?", "Porque al comprar en pozo el principal riesgo es que la obra no se termine o se atrase. Una desarrolladora que ya entregó edificios demuestra capacidad de ejecución, y podés visitar esas obras y hablar con sus propietarios."],
  ["¿Cómo verifican que una obra está entregada?", "Además de la web de la empresa, buscamos una fuente independiente que confirme que el edificio está terminado: notas de prensa de entrega o inauguración, o publicaciones de arquitectura con la obra construida. Si solo lo dice la empresa, no alcanza para el sello."],
  ["¿Qué constructoras de departamentos tienen mejor cumplimiento de plazos?", "No existe un dato público confiable de plazos para todo el mercado. Lo verificable es que la empresa haya entregado obras: con esa lista, pedí la fecha prometida y la fecha real de entrega de cada una antes de firmar."],
];

export default function Page() {
  return (
    <RankingDevsView
      tipo="trayectoria"
      path={PATH}
      h1="Desarrolladoras con obras entregadas en CABA"
      faq={FAQ}
      intro={<>
        <p>Listado de desarrolladoras y constructoras con <strong>trayectoria comprobada</strong>: informan al menos 3 obras terminadas y al menos una de ellas está confirmada como entregada por una fuente independiente. Abajo de cada una figuran los edificios verificados y las fuentes.</p>
      </>}
    />
  );
}
