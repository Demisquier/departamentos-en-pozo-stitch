"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Página de Contacto — diseño Stitch portado fielmente (hero + bloque 2 columnas).
// Client component: el formulario maneja estado y hace POST a /api/contacto.
export default function ContactoPage() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    whatsapp: "",
    mensaje: "",
    proyecto: "",
    origen: "web",
    _gotcha: "", // honeypot anti-spam (debe quedar vacío)
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  // Captura el proyecto desde la URL (?proyecto=slug) que pasan los CTA de las fichas.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("proyecto");
      if (p) setForm((prev) => ({ ...prev, proyecto: p, origen: "ficha:" + p }));
    } catch {}
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      // TODO: endpoint real de leads (WP CPT lead o form service).
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad response");
      setStatus("sent");
      setForm((prev) => ({ nombre: "", apellido: "", email: "", whatsapp: "", mensaje: "", proyecto: prev.proyecto, origen: prev.origen, _gotcha: "" }));
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-primary-container brightness-50" />
        </div>
        <div className="relative z-10 text-center px-margin-mobile">
          <span className="font-label-caps text-secondary-fixed tracking-widest block mb-4 uppercase">
            Tu próxima inversión comienza aquí
          </span>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-white max-w-2xl mx-auto">
            Hablemos de su futuro patrimonio
          </h2>
        </div>
      </section>

      {/* Contact Block */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white p-8 md:p-12 shadow-sm rounded-lg border border-outline-variant">
            <div className="mb-10">
              <h3 className="text-headline-sm font-headline-sm text-primary mb-2">
                Solicitar Asesoramiento Personalizado
              </h3>
              <p className="text-on-surface-variant text-body-md">
                Complete el formulario y un especialista Senior se contactará con usted en menos de 24hs.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot: oculto para humanos, los bots lo rellenan */}
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                value={form._gotcha}
                onChange={handleChange}
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-on-surface-variant uppercase" htmlFor="nombre">
                    Nombre
                  </label>
                  <input
                    className="w-full border-outline-variant rounded-lg p-3 focus:ring-1 focus:ring-link-gold focus:border-link-gold transition-all"
                    id="nombre"
                    name="nombre"
                    placeholder="Ej: Juan"
                    required
                    type="text"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-on-surface-variant uppercase" htmlFor="apellido">
                    Apellido
                  </label>
                  <input
                    className="w-full border-outline-variant rounded-lg p-3 focus:ring-1 focus:ring-link-gold focus:border-link-gold transition-all"
                    id="apellido"
                    name="apellido"
                    placeholder="Ej: Perez"
                    required
                    type="text"
                    value={form.apellido}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-on-surface-variant uppercase" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full border-outline-variant rounded-lg p-3 focus:ring-1 focus:ring-link-gold focus:border-link-gold transition-all"
                  id="email"
                  name="email"
                  placeholder="juan.perez@email.com"
                  required
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-on-surface-variant uppercase" htmlFor="whatsapp">
                  WhatsApp
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low text-on-surface-variant">
                    +54
                  </span>
                  <input
                    className="w-full border-outline-variant rounded-r-lg p-3 focus:ring-1 focus:ring-link-gold focus:border-link-gold transition-all"
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="11 1234 5678"
                    required
                    type="tel"
                    value={form.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-on-surface-variant uppercase" htmlFor="mensaje">
                  Mensaje
                </label>
                <textarea
                  className="w-full border-outline-variant rounded-lg p-3 focus:ring-1 focus:ring-link-gold focus:border-link-gold transition-all"
                  id="mensaje"
                  name="mensaje"
                  placeholder="Contanos qué tipo de inversión estás buscando..."
                  rows={4}
                  value={form.mensaje}
                  onChange={handleChange}
                />
              </div>
              <div className="pt-4">
                <button
                  className="w-full py-5 rounded-lg font-label-caps text-[14px] tracking-widest uppercase shadow-md flex justify-center items-center gap-2 bg-link-gold text-white hover:bg-secondary transition-all disabled:opacity-70"
                  type="submit"
                  disabled={status === "sending"}
                >
                  {status === "sending" && (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Enviando...
                    </>
                  )}
                  {status === "sent" && (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Recibido
                    </>
                  )}
                  {(status === "idle" || status === "error") && (
                    <>
                      Enviar Consulta <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
                {status === "error" && (
                  <p className="text-center text-[12px] text-error mt-3">
                    Hubo un problema al enviar. Por favor, intentá de nuevo.
                  </p>
                )}
              </div>
              <p className="text-center text-[12px] text-on-surface-variant italic">
                Garantizamos la confidencialidad absoluta de sus datos bajo normativas de privacidad internacionales.
              </p>
            </form>
            <div className="mt-12 pt-8 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">chat</span>
                </div>
                <div>
                  <p className="text-label-caps text-on-surface-variant">Respuesta inmediata</p>
                  <p className="font-bold text-primary">Chat vía WhatsApp</p>
                </div>
              </div>
              <a className="inline-flex items-center gap-2 text-link-gold font-bold hover:underline" href="#">
                Contactar por WhatsApp Directo
                <span className="material-symbols-outlined">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Trust Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-primary-container p-10 text-white rounded-lg shadow-sm h-full flex flex-col justify-between">
              <div>
                <h4 className="text-headline-sm font-headline-sm mb-8 text-on-primary-fixed">
                  Por qué elegirnos
                </h4>
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <span className="material-symbols-outlined text-secondary-fixed text-[32px]">payments</span>
                    <div>
                      <h5 className="font-bold text-body-lg mb-2">Sin costo para el comprador</h5>
                      <p className="text-on-primary-container text-body-md">
                        Nuestros honorarios los cubren los desarrolladores. Usted recibe asesoría experta sin sobrecostos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <span className="material-symbols-outlined text-secondary-fixed text-[32px]">verified_user</span>
                    <div>
                      <h5 className="font-bold text-body-lg mb-2">Análisis independiente</h5>
                      <p className="text-on-primary-container text-body-md">
                        25+ proyectos analizados en 9 barrios de CABA, con criterio propio y sin ataduras a una sola marca.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <span className="material-symbols-outlined text-secondary-fixed text-[32px]">timeline</span>
                    <div>
                      <h5 className="font-bold text-body-lg mb-2">Foco en pozo y pre-construcción</h5>
                      <ul className="text-on-primary-container text-body-md space-y-2 mt-2">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-link-gold" /> Entrevista de perfil inversor
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-link-gold" /> Selección curada de proyectos
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-link-gold" /> Visita presencial o virtual
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-link-gold" /> Firma y gestión administrativa
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-surface-container-low py-20 border-t border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h2 className="text-headline-md font-headline-md text-primary mb-6">
            Explore nuestra colección de oportunidades
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              className="px-8 py-3 bg-primary text-white font-label-caps uppercase tracking-widest hover:bg-on-primary-fixed-variant transition-all"
              href="/desarrollos-inmobiliarios"
            >
              Ver Proyectos
            </Link>
            <Link
              className="px-8 py-3 border border-primary text-primary font-label-caps uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
              href="/sobre-nosotros"
            >
              Conocé al equipo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
