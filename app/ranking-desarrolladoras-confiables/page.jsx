import RankingDevsView from "../_views/RankingDevsView";
import { SITE } from "../../lib/constants";

export const revalidate = 86400;
const PATH = "/ranking-desarrolladoras-confiables/";

export const metadata = {
  title: "Desarrolladoras Inmobiliarias Confiables en CABA: Ranking Verificado 2026",
  description: "Ranking de desarrolladoras con datos verificados: obras entregadas confirmadas, premios y situación en el BCRA. Fuentes citadas y revisión cada 6 meses. Sin pauta.",
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ["¿Cuáles son las desarrolladoras inmobiliarias más confiables de CABA?", "Las que pueden demostrar obras terminadas y entregadas, una sociedad identificable sin alertas financieras y, idealmente, reconocimientos de terceros. En este ranking solo figuran desarrolladoras que cumplen al menos uno de esos criterios con fuentes públicas verificables, citadas en cada caso."],
  ["¿Cómo sé si una desarrolladora es confiable antes de comprar en pozo?", "Pedí la lista de obras entregadas con fecha y dirección y visitá alguna, consultá la situación de la sociedad en la Central de Deudores del BCRA con su CUIT, revisá que el terreno esté a nombre del fideicomiso y leé el boleto completo (precio, ajuste, plazo y penalidades)."],
  ["¿Por qué una desarrolladora conocida no aparece en el ranking?", "Porque todavía no pudimos verificar sus datos con fuentes independientes. No figurar no implica nada negativo. Si sos parte de la empresa, podés enviarnos la información y la revisamos."],
  ["¿Las desarrolladoras pagan por aparecer?", "No. Los sellos no se venden ni dependen de ninguna relación comercial. Se otorgan solo con evidencia pública y se revalidan cada 6 meses."],
];

export default function Page() {
  return (
    <RankingDevsView
      path={PATH}
      h1="Ranking de desarrolladoras inmobiliarias confiables en CABA (2026)"
      faq={FAQ}
      intro={<>
        <p>Comprar en pozo es comprar algo que todavía no existe: por eso la pregunta más importante es <strong>quién construye</strong>. Este ranking reúne a las desarrolladoras que pudimos verificar con fuentes públicas e independientes en tres dimensiones: <strong>trayectoria comprobada</strong> (obras entregadas), <strong>reconocimientos</strong> (premios a obra construida) y <strong>solidez financiera</strong> (situación normal en el BCRA).</p>
        <p>Cada sello muestra su evidencia y su fuente. Ordenamos por cantidad de sellos y de evidencias verificadas.</p>
      </>}
    />
  );
}
