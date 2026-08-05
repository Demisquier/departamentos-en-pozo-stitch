"use client";
import { useState } from "react";

// Avatar de la tarjeta de directorio: intenta mostrar el LOGO real de la empresa
// (favicon de alta resolución por dominio, servicio de Google) y cae a las INICIALES
// si no hay web o el logo falla. Uniforme para desarrolladoras, inmobiliarias y corralones.
function domainOf(web) {
  try {
    const u = new URL(web.startsWith("http") ? web : `https://${web}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function LogoAvatar({ web = "", iniciales = "", size = 44 }) {
  const dom = web ? domainOf(web) : "";
  const [ok, setOk] = useState(!!dom);
  const box = "shrink-0 rounded-lg overflow-hidden flex items-center justify-center";
  const style = { width: size, height: size };

  if (ok) {
    return (
      <span className={`${box} bg-white border border-outline-variant`} style={style}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${dom}&sz=128`}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-1"
          onError={() => setOk(false)}
        />
      </span>
    );
  }
  if (!iniciales) return null;
  return (
    <span className={`${box} bg-primary-container text-on-primary font-headline-sm text-[15px] tracking-wide`} style={style}>
      {iniciales}
    </span>
  );
}
