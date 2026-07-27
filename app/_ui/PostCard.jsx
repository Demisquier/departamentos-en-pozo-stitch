// app/_ui/PostCard.jsx — Card de post / novedad (Server Component). UNA versión con `variant`
// que reproduce byte-idéntico las 3 cards que estaban a mano en /novedades:
//   - "featured": card principal grande (aspect 16:9, chip de categoría sobre la imagen, H2,
//                 meta fecha·min ARRIBA del título, excerpt line-clamp-3).
//   - "standard": card de sidebar (H3, categoría como texto, meta ABAJO, sin excerpt).
//   - "compact":  card de grilla (igual que standard + excerpt de 2 líneas).
// Los datos se pasan ya calculados por props (href, img, category, date, minutes, excerpt, titleHtml)
// para no acoplar la card a la capa de datos y poder usarla en Server Components sin arrastrar fs.
//   - as/className: etiqueta y clases de grilla del wrapper (md:col-span-8 / md:col-span-4 mt-8…).
// Las cards de /category y de relacionados en [slug] NO usan este componente (usan otros helpers de
// fecha/categoría y otra estructura) → siguen inline.
import Link from "next/link";

// Placeholder branded (idéntico al <Ph/> de novedades, siempre sin label en estos usos).
function Ph() {
  return (
    <div className="w-full h-full bg-primary-container flex flex-col items-center justify-center gap-2 text-on-primary">
      <span className="material-symbols-outlined text-secondary-fixed text-4xl">apartment</span>
    </div>
  );
}

function Meta({ date, minutes, className }) {
  return (
    <div className={className}>
      <time>{date}</time>
      {minutes && (<><span aria-hidden="true">·</span><span>{minutes} MIN</span></>)}
    </div>
  );
}

export default function PostCard({
  variant = "standard",
  as: Root = "article",
  className = "",
  href,
  img,
  imgAlt,
  category,
  titleHtml,
  date,
  minutes,
  excerpt,
}) {
  const rootClass = [className, "group"].filter(Boolean).join(" ");

  if (variant === "featured") {
    return (
      <Root className={rootClass}>
        <Link href={href} className="block cursor-pointer">
          <div className="relative overflow-hidden aspect-[16/9] mb-6">
            {img ? (
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={img} alt={imgAlt} loading="eager" />
            ) : (<Ph />)}
            {category && (
              <div className="absolute top-4 left-4">
                <span className="bg-secondary text-on-secondary px-3 py-1 font-label-caps text-label-caps tracking-widest">{category}</span>
              </div>
            )}
          </div>
          <div>
            <Meta date={date} minutes={minutes} className="flex flex-wrap items-center gap-x-2 gap-y-1 font-label-caps text-label-caps text-on-surface-variant mb-3" />
            <h2 className="font-headline-md text-headline-md text-primary mb-4 group-hover:text-secondary transition-colors" dangerouslySetInnerHTML={{ __html: titleHtml }} />
            <p className="text-on-surface-variant font-body-md text-body-md line-clamp-3">{excerpt}</p>
          </div>
        </Link>
      </Root>
    );
  }

  // standard + compact comparten estructura; compact agrega el excerpt de 2 líneas.
  return (
    <Root className={rootClass}>
      <Link href={href} className="block cursor-pointer">
        <div className="aspect-[16/9] overflow-hidden mb-4">
          {img ? (
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={img} alt={imgAlt} loading="lazy" />
          ) : (<Ph />)}
        </div>
        {category && (
          <span className="text-secondary font-label-caps text-label-caps mb-2 block">{category}</span>
        )}
        <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors mb-2" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        {variant === "compact" && (
          <p className="text-on-surface-variant font-body-md text-[15px] line-clamp-2 mb-2.5">{excerpt}</p>
        )}
        <Meta date={date} minutes={minutes} className="flex flex-wrap items-center gap-x-2 font-label-caps text-label-caps text-on-surface-variant" />
      </Link>
    </Root>
  );
}
