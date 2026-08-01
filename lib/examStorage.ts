/**
 * Claves de sessionStorage usadas para pasar el examen recién generado
 * desde la landing hacia el editor. Es un handoff transitorio entre páginas,
 * no persistencia de datos: el PDF nunca se almacena en el servidor.
 */
export const EXAM_STORAGE_KEY = "copiloto:exam:questions";
export const EXAM_SOURCE_KEY = "copiloto:exam:source";

/** Datos de origen guardados junto al examen, para regenerar preguntas. */
export interface ExamSource {
  fullText: string;
  prompt: string;
  template?: string;
  filename?: string;
}
