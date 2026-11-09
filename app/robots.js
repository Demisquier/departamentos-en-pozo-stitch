import { SITE } from "../lib/constants";

// Robots: todo indexable salvo APIs y páginas privadas. Los crawlers de IA (ChatGPT, Claude,
// Perplexity, Gemini, etc.) están permitidos explícitamente → visibilidad en respuestas de IA (GEO).
const PRIVADAS = ["/api/", "/mi-seleccion/"];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot", "DuckAssistBot", "Meta-ExternalAgent", "MistralAI-User", "cohere-ai"];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADAS },
      { userAgent: AI_BOTS, allow: "/", disallow: ["/api/", "/mi-seleccion/"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
