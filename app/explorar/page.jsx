// app/explorar/page.jsx — Modo CONVERSAR full-screen (tipo Roomix). El "otro modo" de
// navegar el sitio: en vez de filtros + listado, describís qué buscás y la IA te arma la
// lista. Env-gated (force-dynamic). Noindex por ahora (beta) para no competir con /buscar.
import { SITE } from "../../lib/wp";
import ExplorarConversacional from "./ExplorarConversacional";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explorar conversando · Departamentos en Pozo",
  description: "Encontrá tu departamento en pozo conversando: describí qué buscás y la IA te arma una lista de proyectos en pozo de CABA y GBA, con precios y riesgos a mirar.",
  alternates: { canonical: `${SITE}/explorar/` },
  robots: { index: false, follow: false },
};

export default function ExplorarPage() {
  return (
    <main className="h-[calc(100dvh-60px)] md:h-[calc(100dvh-72px)] min-h-[520px] flex flex-col">
      <div className="shrink-0 px-4 md:px-6 pt-3 md:pt-4 pb-2 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-label-caps uppercase tracking-wider text-secondary border border-outline-variant rounded-full px-2.5 py-0.5"><span className="material-symbols-outlined text-[15px]">auto_awesome</span> Modo conversar</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-4 md:px-6 pb-4 max-w-6xl mx-auto w-full">
        <ExplorarConversacional />
      </div>
    </main>
  );
}
