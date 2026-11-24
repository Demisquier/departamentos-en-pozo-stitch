// Endpoint de prueba de envío desactivado (QA nov-2026): permitía mandar un mail a cualquier
// destinatario con una clave fija en el código. Se deja respondiendo 404.
export const dynamic = "force-dynamic";
export async function GET() { return new Response("Not found", { status: 404 }); }
