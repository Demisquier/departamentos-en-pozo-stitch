// app/_ui/JsonLd.jsx — Helper para los <script type="application/ld+json"> (Server Component).
// Reemplaza los 11 usos inline repartidos en 7 archivos. Acepta un objeto (un solo schema)
// o un array de objetos (varios schemas → varios <script>). Los valores falsy se ignoran.
// El HTML de salida es idéntico al inline: <script type="application/ld+json">{JSON}</script>.
export default function JsonLd({ data }) {
  const arr = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (arr.length === 0) return null;
  return arr.map((d, i) => (
    <script
      key={i}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
    />
  ));
}
