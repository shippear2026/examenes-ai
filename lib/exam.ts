// Contrato del examen — acordado con el equipo (tareas 2-3 devuelven este shape)

export type TipoPregunta = "multiple_choice" | "verdadero_falso" | "desarrollo"

export interface PreguntaBase {
  id: number
  tipo: TipoPregunta
  enunciado: string
  puntaje?: number
}

export interface PreguntaMultipleChoice extends PreguntaBase {
  tipo: "multiple_choice"
  opciones: string[]
  respuestaCorrecta: number // índice en "opciones"
}

export interface PreguntaVerdaderoFalso extends PreguntaBase {
  tipo: "verdadero_falso"
  respuestaCorrecta: boolean
}

export interface PreguntaDesarrollo extends PreguntaBase {
  tipo: "desarrollo"
}

export type Pregunta = PreguntaMultipleChoice | PreguntaVerdaderoFalso | PreguntaDesarrollo

export interface Examen {
  titulo: string
  materia: string
  preguntas: Pregunta[]
}

export type Plantilla = "clasica" | "moderna" | "compacta"
export type Version = "A" | "B" | "C"

export const PLANTILLAS: { id: Plantilla; nombre: string; descripcion: string }[] = [
  { id: "clasica", nombre: "Clásica", descripcion: "Serif formal, líneas separadoras, estilo examen tradicional." },
  { id: "moderna", nombre: "Moderna", descripcion: "Sans-serif, color de acento y preguntas en tarjetas." },
  { id: "compacta", nombre: "Compacta", descripcion: "Alta densidad, ideal para exámenes largos en pocas hojas." },
]

export const VERSIONES: Version[] = ["A", "B", "C"]

// ---------------------------------------------------------------------------
// Barajado determinístico con semilla (mulberry32). Misma versión => mismo orden.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SEMILLA_VERSION: Record<Version, number> = {
  A: 101,
  B: 202,
  C: 303,
}

// Devuelve una copia del examen con preguntas (y opciones de MC) barajadas
// según la versión. La versión "A" con semilla fija sigue siendo reproducible.
export function generarVersion(examen: Examen, version: Version): Examen {
  const rand = mulberry32(SEMILLA_VERSION[version])

  const preguntasBarajadas = shuffle(examen.preguntas, rand).map((pregunta, index) => {
    const nuevoId = index + 1

    if (pregunta.tipo === "multiple_choice") {
      const opcionCorrectaTexto = pregunta.opciones[pregunta.respuestaCorrecta]
      const opcionesBarajadas = shuffle(pregunta.opciones, rand)
      return {
        ...pregunta,
        id: nuevoId,
        opciones: opcionesBarajadas,
        respuestaCorrecta: opcionesBarajadas.indexOf(opcionCorrectaTexto),
      }
    }

    return { ...pregunta, id: nuevoId }
  })

  return { ...examen, preguntas: preguntasBarajadas }
}

export function puntajeTotal(examen: Examen): number {
  return examen.preguntas.reduce((acc, p) => acc + (p.puntaje ?? 0), 0)
}

// ---------------------------------------------------------------------------
// Examen de ejemplo pre-cargado (para demo y para probar el export sin backend)
// ---------------------------------------------------------------------------

export const EXAMEN_EJEMPLO: Examen = {
  titulo: "Examen — Revolución de Mayo",
  materia: "Historia Argentina",
  preguntas: [
    {
      id: 1,
      tipo: "multiple_choice",
      enunciado: "¿En qué año tuvo lugar la Revolución de Mayo?",
      opciones: ["1806", "1810", "1816", "1852"],
      respuestaCorrecta: 1,
      puntaje: 10,
    },
    {
      id: 2,
      tipo: "multiple_choice",
      enunciado: "¿Quién fue designado presidente de la Primera Junta?",
      opciones: ["Mariano Moreno", "Manuel Belgrano", "Cornelio Saavedra", "Juan José Castelli"],
      respuestaCorrecta: 2,
      puntaje: 10,
    },
    {
      id: 3,
      tipo: "verdadero_falso",
      enunciado: "La Primera Junta se formó tras la destitución del virrey Cisneros.",
      respuestaCorrecta: true,
      puntaje: 5,
    },
    {
      id: 4,
      tipo: "verdadero_falso",
      enunciado: "La Revolución de Mayo declaró formalmente la independencia de las Provincias Unidas.",
      respuestaCorrecta: false,
      puntaje: 5,
    },
    {
      id: 5,
      tipo: "desarrollo",
      enunciado:
        "Explique el rol de la Semana de Mayo en el proceso revolucionario, mencionando al menos dos hechos clave.",
      puntaje: 20,
    },
    {
      id: 6,
      tipo: "desarrollo",
      enunciado: "Describa las diferencias políticas entre Mariano Moreno y Cornelio Saavedra.",
      puntaje: 20,
    },
  ],
}
