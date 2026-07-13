import Link from "next/link";
import { getPageBySlug } from "../../lib/wp";

export const metadata = {
  title: "Nosotros | Departamentos en Pozo",
  description:
    "Análisis independiente de inversión en departamentos en pozo. Conocé nuestra metodología, criterios y compromiso con el inversor.",
};

export default async function SobreNosotrosPage() {
  const page = await getPageBySlug("sobre-nosotros");
  const titulo = page?.title?.rendered || "Sobre nosotros";

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative h-[70vh] flex items-center overflow-hidden">
        {/* TODO imagen real de marca */}
        <div className="absolute inset-0 z-0 bg-primary-container" />
        <div className="absolute inset-0 hero-gradient z-10" />
        <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-2xl">
            <span className="text-secondary-fixed font-label-caps tracking-[0.2em] mb-4 block">
              INDEPENDENCIA &amp; CRITERIO
            </span>
            <h1
              className="text-white font-display-lg text-display-lg mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: titulo }}
            />
            <p className="text-on-primary-container font-body-lg text-body-lg max-w-xl">
              Análisis independiente de inversión en departamentos en pozo y pre-construcción en CABA. Sin costo para
              el comprador, con criterio propio y foco en la letra chica.
            </p>
          </div>
        </div>
      </header>

      {/* Trust Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <div className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-link-gold font-display-lg text-display-lg mb-2">25+</span>
              <span className="font-label-caps text-on-surface-variant">PROYECTOS ANALIZADOS</span>
            </div>
            <div className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-link-gold font-display-lg text-display-lg mb-2">9</span>
              <span className="font-label-caps text-on-surface-variant">BARRIOS DE CABA</span>
            </div>
            <div className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-link-gold font-display-lg text-display-lg mb-2">$0</span>
              <span className="font-label-caps text-on-surface-variant">COSTO PARA EL COMPRADOR</span>
            </div>
            <div className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-link-gold font-display-lg text-display-lg mb-2">100%</span>
              <span className="font-label-caps text-on-surface-variant">INDEPENDIENTE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ADN / Quiénes somos */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1">
              <div className="aspect-[4/5] relative bg-primary-container rounded-lg overflow-hidden border border-outline-variant">
                {/* TODO imagen real de marca */}
                <img
                  className="object-cover w-full h-full opacity-90"
                  alt="Equipo de análisis de inversión inmobiliaria"
                  src="https://placehold.co/600x750/0c1b35/ffffff?text=Departamentos+en+Pozo"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-white font-headline-sm text-headline-sm italic">
                    "La seguridad jurídica es el cimiento de cada proyecto que recomendamos."
                  </h3>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <span className="text-link-gold font-label-caps tracking-widest">NUESTRO ADN</span>
              <h2 className="text-primary font-headline-md text-headline-md">
                Un portal de análisis, no una inmobiliaria más.
              </h2>
              <p className="text-on-surface-variant text-body-lg">
                Departamentos en Pozo nació para profesionalizar la selección de proyectos en preventa: comparar
                desarrolladoras, precios y potencial de ganancia barrio por barrio, con criterio independiente y sin
                costo para el comprador.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Análisis independiente</h4>
                    <p className="text-on-surface-variant">
                      Evaluamos cada desarrollo con criterio propio, sin ataduras a una sola marca.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">query_stats</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Foco en pozo y pre-construcción</h4>
                    <p className="text-on-surface-variant">
                      Especializados en la etapa temprana: fideicomiso, boleto, anticipo y proyección de plusvalía.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="py-24 bg-primary-container text-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-secondary-fixed font-label-caps tracking-widest block mb-4">
              METODOLOGÍA DE ANÁLISIS
            </span>
            <h2 className="font-display-lg text-display-lg">
              Analizamos cada proyecto con los mismos tres criterios.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">01</span>
              <h3 className="font-headline-sm text-headline-sm">Trayectoria y entregas</h3>
              <p className="text-on-primary-container">
                Revisamos el historial de la desarrolladora: obras entregadas, cumplimiento de plazos y reputación en
                el mercado.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">02</span>
              <h3 className="font-headline-sm text-headline-sm">Estructura legal (fideicomiso)</h3>
              <p className="text-on-primary-container">
                Analizamos la letra chica: tipo de fideicomiso, boleto, anticipo y las garantías que protegen al
                inversor.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">03</span>
              <h3 className="font-headline-sm text-headline-sm">Precio y rentabilidad</h3>
              <p className="text-on-primary-container">
                Comparamos precio por m² contra el barrio y proyectamos el potencial de ganancia entre pozo y
                terminación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromiso */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-primary font-display-lg text-display-lg">
              Nuestro compromiso es su tranquilidad.
            </h2>
            <p className="text-on-surface-variant text-body-lg">
              No somos simples comercializadores; buscamos que cada inversor tome una decisión informada. Nuestro
              modelo prioriza la transparencia absoluta y el asesoramiento independiente.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Comparación objetiva de desarrolladoras, precios y potencial de ganancia.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Revisión de la estructura legal del proyecto antes de recomendarlo.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Acompañamiento sin costo para el comprador, desde la consulta hasta la firma.</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary-container rounded-full mix-blend-multiply opacity-30 blur-3xl" />
              <div className="border border-outline-variant p-2 rounded-lg bg-surface">
                {/* TODO imagen real de marca */}
                <img
                  className="rounded-lg w-full"
                  alt="Llaves y documentación de una inversión inmobiliaria"
                  src="https://placehold.co/600x450/f8f9fa/0c1b35?text=Inversi%C3%B3n+Segura"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="bg-primary-container p-12 md:p-20 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-white font-display-lg text-display-lg mb-4">
                ¿Hablamos sobre su próxima inversión?
              </h2>
              <p className="text-on-primary-container text-body-lg">
                Contanos tu perfil y te ayudamos a encontrar la oportunidad ideal, sin costo para el comprador.
              </p>
            </div>
            <div className="relative z-10">
              <Link
                className="inline-block bg-link-gold text-white px-10 py-5 rounded-lg font-bold text-body-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                href="/contacto"
              >
                Contactar a un Experto
              </Link>
            </div>
            {/* Elemento decorativo de fondo */}
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
              <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                apartment
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
