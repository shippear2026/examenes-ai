import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Question } from "@/lib/types";
import type { ExamMeta, ExamTema } from "@/lib/mockExam";
import type { TemplateStyle } from "./ExamPreview";

const OPTION_LABELS = ["a", "b", "c", "d", "e"];

type Palette = {
  accent: string;
  headerBorder: number;
  headerBorderColor: string;
  serif: boolean;
  institutionColor: string;
  titleColor: string;
  sectionColor: string;
  numberColor: string;
  optionLabelColor: string;
};

function getPalette(template: TemplateStyle): Palette {
  switch (template) {
    case "secondary":
      return {
        accent: "#1d4ed8",
        headerBorder: 4,
        headerBorderColor: "#1d4ed8",
        serif: true,
        institutionColor: "#1d4ed8",
        titleColor: "#111827",
        sectionColor: "#1d4ed8",
        numberColor: "#1d4ed8",
        optionLabelColor: "#2563eb",
      };
    case "minimal":
      return {
        accent: "#111827",
        headerBorder: 0,
        headerBorderColor: "#ffffff",
        serif: false,
        institutionColor: "#9ca3af",
        titleColor: "#111827",
        sectionColor: "#9ca3af",
        numberColor: "#9ca3af",
        optionLabelColor: "#9ca3af",
      };
    case "university":
    default:
      return {
        accent: "#111827",
        headerBorder: 2,
        headerBorderColor: "#1f2937",
        serif: true,
        institutionColor: "#6b7280",
        titleColor: "#111827",
        sectionColor: "#374151",
        numberColor: "#111827",
        optionLabelColor: "#374151",
      };
  }
}

function buildStyles(template: TemplateStyle) {
  const p = getPalette(template);
  const fontFamily = p.serif ? "Times-Roman" : "Helvetica";
  const fontBold = p.serif ? "Times-Bold" : "Helvetica-Bold";

  return {
    p,
    fontBold,
    styles: StyleSheet.create({
      page: {
        paddingVertical: 42,
        paddingHorizontal: 46,
        fontFamily,
        fontSize: 11,
        color: "#111827",
        lineHeight: 1.5,
      },
      header: {
        borderBottomWidth: p.headerBorder,
        borderBottomColor: p.headerBorderColor,
        paddingBottom: 12,
        marginBottom: 18,
      },
      headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
      },
      institution: {
        fontSize: 8,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: p.institutionColor,
        marginBottom: 3,
      },
      title: {
        fontSize: 18,
        fontFamily: fontBold,
        color: p.titleColor,
        marginBottom: 2,
      },
      subtitle: { fontSize: 10, color: "#4b5563" },
      temaChip: {
        fontSize: 9,
        fontFamily: fontBold,
        color: "#ffffff",
        backgroundColor: p.accent,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 3,
      },
      metaGrid: { flexDirection: "row", gap: 18, marginTop: 14 },
      metaCell: { flex: 1 },
      metaLabel: { fontSize: 9, fontFamily: fontBold, color: "#1f2937" },
      metaValue: { fontSize: 10, color: "#4b5563", marginTop: 1 },
      metaBlank: {
        borderBottomWidth: 1,
        borderBottomColor: "#9ca3af",
        marginTop: 8,
        height: 1,
      },
      signRow: { marginTop: 10 },
      instructions: {
        fontSize: 9,
        fontStyle: "italic",
        color: "#6b7280",
        marginBottom: 16,
      },
      sectionTitle: {
        fontSize: 10,
        fontFamily: fontBold,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: p.sectionColor,
        borderBottomWidth: template === "minimal" ? 0 : 1,
        borderBottomColor: "#d1d5db",
        paddingBottom: 4,
        marginBottom: 14,
      },
      question: { flexDirection: "row", marginBottom: 16 },
      qNumber: {
        fontFamily: fontBold,
        color: p.numberColor,
        marginRight: 6,
        width: 18,
      },
      qBody: { flex: 1 },
      qText: { color: "#111827" },
      optionRow: { flexDirection: "row", marginTop: 5, paddingLeft: 4 },
      optionLabel: {
        fontFamily: fontBold,
        color: p.optionLabelColor,
        marginRight: 5,
        width: 12,
      },
      optionText: { color: "#1f2937", flex: 1 },
      devLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        borderStyle: "dashed",
        marginTop: 14,
        height: 1,
      },
      footer: {
        position: "absolute",
        bottom: 28,
        left: 46,
        right: 46,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 6,
        fontSize: 8,
        color: "#9ca3af",
      },
      // answer key
      keyHeader: {
        fontSize: 16,
        fontFamily: fontBold,
        color: p.titleColor,
        marginBottom: 4,
      },
      keySub: { fontSize: 10, color: "#6b7280", marginBottom: 18 },
      keyTemaTitle: {
        fontSize: 11,
        fontFamily: fontBold,
        color: p.accent,
        marginTop: 14,
        marginBottom: 6,
      },
      keyRow: { flexDirection: "row", marginBottom: 3 },
      keyNum: { fontFamily: fontBold, width: 20, color: "#111827" },
      keyAns: { color: "#1f2937", flex: 1 },
    }),
  };
}

function ExamPage({
  tema,
  questions,
  meta,
  template,
}: {
  tema: ExamTema;
  questions: Question[];
  meta: ExamMeta;
  template: TemplateStyle;
}) {
  const { styles } = buildStyles(template);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.institution}>{meta.institution}</Text>
            <Text style={styles.title}>{meta.subject}</Text>
            <Text style={styles.subtitle}>{meta.course}</Text>
          </View>
          <Text style={styles.temaChip}>TEMA {tema}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{meta.date}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Duracion</Text>
            <Text style={styles.metaValue}>{meta.duration}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Alumno/a</Text>
            <View style={styles.metaBlank} />
          </View>
        </View>

        <View style={styles.signRow}>
          <Text style={styles.metaLabel}>Firma / DNI</Text>
          <View style={[styles.metaBlank, { width: 180 }]} />
        </View>
      </View>

      <Text style={styles.instructions}>
        Lee cada pregunta con atencion antes de responder. No se permite el uso
        de material de apoyo.
      </Text>

      <Text style={styles.sectionTitle}>
        Preguntas — {questions.length} en total
      </Text>

      {questions.map((q, idx) => (
        <View key={q.id} style={styles.question} wrap={false}>
          <Text style={styles.qNumber}>{idx + 1}.</Text>
          <View style={styles.qBody}>
            <Text style={styles.qText}>{q.text}</Text>

            {q.options && q.options.length > 0
              ? q.options.map((opt, oi) => (
                  <View key={oi} style={styles.optionRow}>
                    <Text style={styles.optionLabel}>
                      {q.type === "true_false" ? "" : `${OPTION_LABELS[oi]})`}
                    </Text>
                    <Text style={styles.optionText}>{opt}</Text>
                  </View>
                ))
              : null}

            {q.type === "development"
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.devLine} />
                ))
              : null}
          </View>
        </View>
      ))}

      <View style={styles.footer} fixed>
        <Text>Copiloto de Examenes — generado con IA</Text>
        <Text>
          {meta.subject} · Tema {tema}
        </Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Pagina ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

function AnswerKeyPage({
  temas,
  meta,
  template,
}: {
  temas: Record<ExamTema, Question[]>;
  meta: ExamMeta;
  template: TemplateStyle;
}) {
  const { styles } = buildStyles(template);
  const order: ExamTema[] = ["A", "B", "C"];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.keyHeader}>Clave de respuestas</Text>
      <Text style={styles.keySub}>
        {meta.subject} · {meta.course} — uso exclusivo del docente
      </Text>

      {order.map((tema) => (
        <View key={tema} wrap={false}>
          <Text style={styles.keyTemaTitle}>Tema {tema}</Text>
          {temas[tema].map((q, idx) => {
            let answer = "Desarrollo — correccion manual";
            if (q.type === "true_false") {
              answer = q.correctAnswer ?? "—";
            } else if (q.type === "multiple_choice" && q.correctAnswer) {
              const oi = (q.options ?? []).indexOf(q.correctAnswer);
              const label = oi >= 0 ? `${OPTION_LABELS[oi]}) ` : "";
              answer = `${label}${q.correctAnswer}`;
            }
            return (
              <View key={q.id} style={styles.keyRow}>
                <Text style={styles.keyNum}>{idx + 1}.</Text>
                <Text style={styles.keyAns}>{answer}</Text>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.footer} fixed>
        <Text>Copiloto de Examenes — clave de respuestas</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Pagina ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

export function ExamDocument({
  temas,
  meta,
  template,
  includeKey,
}: {
  temas: Record<ExamTema, Question[]>;
  meta: ExamMeta;
  template: TemplateStyle;
  includeKey: boolean;
}) {
  const order: ExamTema[] = ["A", "B", "C"];
  return (
    <Document
      title={`${meta.subject} — Examen`}
      author="Copiloto de Examenes"
    >
      {order.map((tema) => (
        <ExamPage
          key={tema}
          tema={tema}
          questions={temas[tema]}
          meta={meta}
          template={template}
        />
      ))}
      {includeKey ? (
        <AnswerKeyPage temas={temas} meta={meta} template={template} />
      ) : null}
    </Document>
  );
}
