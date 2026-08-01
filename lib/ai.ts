import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Proveedor de Google Gemini usando la API key directa del proyecto
 * (GEMINI_API_KEY). Evitamos el AI Gateway de Vercel porque requiere
 * una tarjeta de crédito en el equipo; la API key de Gemini funciona
 * sin ese requisito.
 */
const apiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY_2;

const google = createGoogleGenerativeAI({ apiKey });

/** Modelo compartido por los agentes generador y supervisor.
 * Usamos "gemini-flash-latest" porque los modelos con versión fija
 * (ej. gemini-2.5-flash) ya no están disponibles para API keys nuevas. */
export const examModel = google("gemini-flash-latest");
