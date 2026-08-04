import Link from "next/link";

// Banner reusable para captar suscriptores a las alertas de lanzamientos.
// Dropear al final de guias y fichas. Props opcionales para contextualizar el copy.
export default function AlertaCTA({ titulo = "No te pierdas el proximo lanzamiento", texto = "Recibi por email los nuevos proyectos en pozo que encajan con tu busqueda. Antes de que salgan a los portales.", cta = "Activar mi alerta" } = {}) {
  return (
    <div className="my-10 rounded-lg bg-primary-container text-white p-7 md:p-9 flex flex-col md:flex-row md:items-center gap-6 justify-between not-prose">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary-fixed text-[32px] shrink-0">notifications_active</span>
        <div>
          <p className="font-bold text-body-lg mb-1">{titulo}</p>
          <p className="text-white/85 text-body-md max-w-xl">{texto}</p>
        </div>
      </div>
      <Link href="/alertas-de-lanzamientos-en-pozo/"
        className="shrink-0 inline-flex items-center justify-center gap-2 bg-secondary-fixed text-primary font-label-caps uppercase tracking-widest text-[13px] px-7 py-4 rounded hover:opacity-90 transition-all">
        {cta}<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}
