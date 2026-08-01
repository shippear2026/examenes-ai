import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { Examen, Pregunta, Plantilla, Version } from "@/lib/exam"
import { puntajeTotal } from "@/lib/exam"

interface ExamPDFProps {
  examen: Examen
  plantilla: Plantilla
  version: Version
  incluirClave?: boolean // hoja de respuestas al final
}

const LETRAS = ["a", "b", "c", "d", "e", "f"]

// ---------------------------------------------------------------------------
// Estilos por plantilla
// ---------------------------------------------------------------------------

const clasica = StyleSheet.create({
  page: { padding: 48, fontFamily: "Times-Roman", fontSize: 11, color: "#1a1a1a", lineHeight: 1.5 },
  header: { borderBottom: "2 solid #1a1a1a", paddingBottom: 10, marginBottom: 16 },
  titulo: { fontSize: 18, fontFamily: "Times-Bold", textAlign: "center" },
  materia: { fontSize: 11, textAlign: "center", marginTop: 4, fontFamily: "Times-Italic" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, fontSize: 10 },
  datosBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18, fontSize: 10 },
  pregunta: { marginBottom: 14 },
  enunciado: { fontFamily: "Times-Bold" },
  opcion: { marginLeft: 16, marginTop: 3, flexDirection: "row" },
  opcionLetra: { fontFamily: "Times-Bold", marginRight: 6 },
  vfRow: { flexDirection: "row", gap: 24, marginLeft: 16, marginTop: 3 },
  lineas: { marginTop: 6, marginLeft: 16 },
  linea: { borderBottom: "1 solid #999", height: 16 },
  chip: { fontSize: 9, color: "#555" },
})

const moderna = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1c2733", lineHeight: 1.5 },
  header: { backgroundColor: "#0f766e", padding: 16, borderRadius: 6, marginBottom: 18 },
  titulo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  materia: { fontSize: 11, color: "#c9efe9", marginTop: 3 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, fontSize: 9, color: "#c9efe9" },
  datosBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    fontSize: 10,
    backgroundColor: "#f0fdfa",
    padding: 10,
    borderRadius: 4,
  },
  pregunta: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    border: "1 solid #e2e8f0",
    borderLeft: "3 solid #0f766e",
  },
  enunciadoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  enunciado: { fontFamily: "Helvetica-Bold", flex: 1, paddingRight: 8 },
  opcion: { marginLeft: 10, marginTop: 3, flexDirection: "row" },
  opcionLetra: { fontFamily: "Helvetica-Bold", marginRight: 6, color: "#0f766e" },
  vfRow: { flexDirection: "row", gap: 24, marginLeft: 10, marginTop: 3 },
  lineas: { marginTop: 6 },
  linea: { borderBottom: "1 solid #cbd5e1", height: 16 },
  chip: { fontSize: 9, color: "#0f766e", fontFamily: "Helvetica-Bold" },
})

const compacta = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 9.5, color: "#111827", lineHeight: 1.35 },
  header: { borderBottom: "1 solid #111827", paddingBottom: 6, marginBottom: 10 },
  titulo: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  materia: { fontSize: 9, color: "#4b5563", marginTop: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, fontSize: 8 },
  datosBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, fontSize: 8 },
  pregunta: { marginBottom: 8 },
  enunciado: { fontFamily: "Helvetica-Bold" },
  opcion: { marginLeft: 12, flexDirection: "row" },
  opcionLetra: { fontFamily: "Helvetica-Bold", marginRight: 4 },
  vfRow: { flexDirection: "row", gap: 18, marginLeft: 12 },
  lineas: { marginTop: 4, marginLeft: 12 },
  linea: { borderBottom: "1 solid #9ca3af", height: 13 },
  chip: { fontSize: 8, color: "#6b7280" },
})

const ESTILOS: Record<Plantilla, ReturnType<typeof StyleSheet.create>> = {
  clasica,
  moderna,
  compacta,
}

// ---------------------------------------------------------------------------
// Render de una pregunta
// ---------------------------------------------------------------------------

function PreguntaView({
  pregunta,
  s,
  plantilla,
}: {
  pregunta: Pregunta
  s: ReturnType<typeof StyleSheet.create>
  plantilla: Plantilla
}) {
  const chip = pregunta.puntaje != null ? <Text style={s.chip}>{pregunta.puntaje} pts</Text> : null

  const cabecera =
    plantilla === "moderna" ? (
      <View style={s.enunciadoRow}>
        <Text style={s.enunciado}>
          {pregunta.id}. {pregunta.enunciado}
        </Text>
        {chip}
      </View>
    ) : (
      <Text style={s.enunciado}>
        {pregunta.id}. {pregunta.enunciado} {pregunta.puntaje != null ? `(${pregunta.puntaje} pts)` : ""}
      </Text>
    )

  return (
    <View style={s.pregunta} wrap={false}>
      {cabecera}

      {pregunta.tipo === "multiple_choice" &&
        pregunta.opciones.map((op, i) => (
          <View key={i} style={s.opcion}>
            <Text style={s.opcionLetra}>{LETRAS[i]})</Text>
            <Text>{op}</Text>
          </View>
        ))}

      {pregunta.tipo === "verdadero_falso" && (
        <View style={s.vfRow}>
          <Text>{"[ ]  Verdadero"}</Text>
          <Text>{"[ ]  Falso"}</Text>
        </View>
      )}

      {pregunta.tipo === "desarrollo" && (
        <View style={s.lineas}>
          <View style={s.linea} />
          <View style={s.linea} />
          <View style={s.linea} />
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

export function ExamPDF({ examen, plantilla, version, incluirClave = false }: ExamPDFProps) {
  const s = ESTILOS[plantilla]
  const total = puntajeTotal(examen)

  return (
    <Document title={`${examen.titulo} — Versión ${version}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.titulo}>{examen.titulo}</Text>
          <Text style={s.materia}>{examen.materia}</Text>
          <View style={s.metaRow}>
            <Text>Versión {version}</Text>
            <Text>{total > 0 ? `Puntaje total: ${total} pts` : `Preguntas: ${examen.preguntas.length}`}</Text>
          </View>
        </View>

        <View style={s.datosBox}>
          <Text>Apellido y nombre: ______________________________</Text>
          <Text>Fecha: ____________</Text>
        </View>

        {examen.preguntas.map((p) => (
          <PreguntaView key={p.id} pregunta={p} s={s} plantilla={plantilla} />
        ))}
      </Page>

      {incluirClave && (
        <Page size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={s.titulo}>Clave de corrección — Versión {version}</Text>
            <Text style={s.materia}>{examen.titulo}</Text>
          </View>
          {examen.preguntas.map((p) => (
            <View key={p.id} style={{ marginBottom: 5, flexDirection: "row" }}>
              <Text style={{ fontFamily: plantilla === "clasica" ? "Times-Bold" : "Helvetica-Bold", width: 28 }}>
                {p.id}.
              </Text>
              <Text>
                {p.tipo === "multiple_choice"
                  ? `${LETRAS[p.respuestaCorrecta]}) ${p.opciones[p.respuestaCorrecta]}`
                  : p.tipo === "verdadero_falso"
                    ? p.respuestaCorrecta
                      ? "Verdadero"
                      : "Falso"
                    : "Desarrollo — corrección manual"}
              </Text>
            </View>
          ))}
        </Page>
      )}
    </Document>
  )
}
