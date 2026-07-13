/** app/feed/route.js — RSS 2.0 real en /feed/ (reemplaza el feed del WordPress viejo).
 *  Sirve los últimos 20 posts. Compila igual con export estático (process.env.EXPORT):
 *  al ser dynamic='force-static', Next lo pre-renderiza en build.
 */
import { getPosts, stripHtml, SITE, BRAND } from '../../lib/wp';

export const dynamic = 'force-static';
export const revalidate = 300;

// Escapa caracteres reservados de XML.
function xmlEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = (await getPosts(20)) || [];
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const title = stripHtml(p?.title?.rendered) || 'Sin título';
      const link = `${SITE}/${p?.slug || ''}/`;
      const desc = stripHtml(p?.excerpt?.rendered);
      const pubDate = p?.date ? new Date(p.date).toUTCString() : buildDate;
      return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xmlEscape(desc)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(BRAND)}</title>
    <link>${xmlEscape(SITE + '/')}</link>
    <atom:link href="${xmlEscape(SITE + '/feed/')}" rel="self" type="application/rss+xml" />
    <description>Novedades de ${xmlEscape(BRAND)} — inversión en departamentos en pozo en Buenos Aires.</description>
    <language>es-AR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
