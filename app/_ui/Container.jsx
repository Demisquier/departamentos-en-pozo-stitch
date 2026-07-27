// app/_ui/Container.jsx — Contenedor central del sitio (Server Component puro).
// Encapsula el patrón repetido "max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop"
// (aparecía 34× en 16 archivos). Cambiar el ancho o el padding lateral del sitio = editar
// SOLO este archivo.
//   - as:        etiqueta a renderizar (div | section | main | header | article | footer | aside…). Default "div".
//   - className: clases extra (padding vertical, bg, grid, id-less utils). Se concatenan DESPUÉS
//                del base → el set de clases efectivas es idéntico al markup original.
//   - ...rest:   id, aria-*, style, etc. pasan tal cual.
const BASE = "max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop";

export default function Container({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={className ? `${BASE} ${className}` : BASE} {...rest}>
      {children}
    </Tag>
  );
}
