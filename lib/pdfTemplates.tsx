import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Question } from "./types";

export type TemplateId = "university" | "secondary" | "minimal";

interface ExamDocProps {
  questions: Question[];
  subject: string;
  tema: "A" | "B" | "C";
  template: TemplateId;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function renderOptions(q: Question, styles: ReturnType<typeof StyleSheet.create>) {
  if (!q.options?.length) return null;
  const letters = ["a", "b", "c", "d", "e"];
  return (
    <View style={styles.optionList}>
      {q.options.map((opt, i) => (
        <Text key={i} style={styles.option}>
          {letters[i] ?? i + 1}) {opt}
        </Text>
      ))}
    </View>
  );
}

function renderDevLines(styles: ReturnType<typeof StyleSheet.create>) {
  return (
    <View style={styles.devLines}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.devLine} />
      ))}
    </View>
  );
}

// ─── UNIVERSITARIA ───────────────────────────────────────────────────────────

const uniStyles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Times-Roman", fontSize: 11, color: "#111" },
  headerBox: {
    borderWidth: 1.5,
    borderColor: "#111",
    padding: 10,
    marginBottom: 16,
  },
  institution: { fontSize: 13, fontFamily: "Times-Bold", textAlign: "center", marginBottom: 2 },
  subject: { fontSize: 11, textAlign: "center", marginBottom: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  metaLabel: { fontSize: 9, color: "#444" },
  temaBox: {
    position: "absolute",
    top: 6,
    right: 8,
    borderWidth: 1,
    borderColor: "#111",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  temaText: { fontSize: 12, fontFamily: "Times-Bold" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#111", marginBottom: 14 },
  questionWrap: { marginBottom: 14 },
  questionText: { fontFamily: "Times-Bold", fontSize: 11, marginBottom: 4 },
  optionList: { paddingLeft: 12 },
  option: { fontSize: 10, marginBottom: 2 },
  devLines: { paddingLeft: 12, marginTop: 4 },
  devLine: { borderBottomWidth: 0.5, borderBottomColor: "#aaa", marginBottom: 10 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#888" },
});

export function UniversityDoc({ questions, subject, tema }: ExamDocProps) {
  const today = new Date().toLocaleDateString("es-AR");
  return (
    <Document>
      <Page size="A4" style={uniStyles.page}>
        <View style={uniStyles.headerBox}>
          <Text style={uniStyles.temaBox}>
            <Text style={uniStyles.temaText}>Tema {tema}</Text>
          </Text>
          <Text style={uniStyles.institution}>Universidad Nacional</Text>
          <Text style={uniStyles.subject}>{subject}</Text>
          <View style={uniStyles.metaRow}>
            <Text style={uniStyles.metaLabel}>Fecha: {today}</Text>
            <Text style={uniStyles.metaLabel}>Duración: 90 min</Text>
          </View>
          <View style={uniStyles.metaRow}>
            <Text style={uniStyles.metaLabel}>Apellido y nombre: ___________________________</Text>
            <Text style={uniStyles.metaLabel}>Legajo: ________</Text>
          </View>
        </View>
        <View style={uniStyles.divider} />
        {questions.map((q, i) => (
          <View key={q.id} style={uniStyles.questionWrap}>
            <Text style={uniStyles.questionText}>{i + 1}. {q.text}</Text>
            {q.type !== "development" ? renderOptions(q, uniStyles) : renderDevLines(uniStyles)}
          </View>
        ))}
        <View style={uniStyles.footer}>
          <Text style={uniStyles.footerText}>Copiloto de Exámenes — generado con IA</Text>
          <Text style={uniStyles.footerText}>Tema {tema} — {today}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── SECUNDARIA ──────────────────────────────────────────────────────────────

const secStyles = StyleSheet.create({
  page: { padding: 44, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a2e" },
  headerBg: { backgroundColor: "#1a3a6b", padding: 12, marginBottom: 14, borderRadius: 2 },
  institution: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "center", marginBottom: 2 },
  subject: { fontSize: 11, color: "#ccd6f6", textAlign: "center", marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 9, color: "#a8b8d8" },
  temaTag: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-end",
    marginTop: -20,
    marginBottom: 8,
  },
  temaText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  questionWrap: { marginBottom: 14 },
  questionText: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4, color: "#1a3a6b" },
  optionList: { paddingLeft: 10 },
  option: { fontSize: 10, marginBottom: 2, color: "#333" },
  devLines: { paddingLeft: 10, marginTop: 4 },
  devLine: { borderBottomWidth: 0.5, borderBottomColor: "#bbb", marginBottom: 10 },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44 },
  footerLine: { borderTopWidth: 1, borderTopColor: "#1a3a6b", marginBottom: 4 },
  footerText: { fontSize: 8, color: "#888", textAlign: "center" },
  alumnoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  alumnoLabel: { fontSize: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingBottom: 2, flex: 1, marginRight: 12 },
});

export function SecondaryDoc({ questions, subject, tema }: ExamDocProps) {
  const today = new Date().toLocaleDateString("es-AR");
  return (
    <Document>
      <Page size="A4" style={secStyles.page}>
        <View style={secStyles.headerBg}>
          <Text style={secStyles.institution}>Colegio</Text>
          <Text style={secStyles.subject}>{subject}</Text>
          <View style={secStyles.metaRow}>
            <Text style={secStyles.metaLabel}>Fecha: {today}</Text>
            <Text style={secStyles.metaLabel}>Duración: 60 min</Text>
          </View>
        </View>
        <View style={secStyles.temaTag}>
          <Text style={secStyles.temaText}>Tema {tema}</Text>
        </View>
        <View style={secStyles.alumnoRow}>
          <Text style={secStyles.alumnoLabel}>Nombre: ________________________________</Text>
          <Text style={secStyles.alumnoLabel}>Año/Div: ________</Text>
        </View>
        {questions.map((q, i) => (
          <View key={q.id} style={secStyles.questionWrap}>
            <Text style={secStyles.questionText}>{i + 1}. {q.text}</Text>
            {q.type !== "development" ? renderOptions(q, secStyles) : renderDevLines(secStyles)}
          </View>
        ))}
        <View style={secStyles.footer}>
          <View style={secStyles.footerLine} />
          <Text style={secStyles.footerText}>Copiloto de Exámenes — Tema {tema}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── MINIMALISTA ─────────────────────────────────────────────────────────────

const minStyles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Helvetica", fontSize: 11, color: "#222" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  subject: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#222" },
  tema: { fontSize: 11, color: "#888" },
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 4 },
  metaText: { fontSize: 9, color: "#666" },
  alumnoLine: { borderBottomWidth: 0.5, borderBottomColor: "#ccc", marginBottom: 20, paddingBottom: 2 },
  alumnoLabel: { fontSize: 9, color: "#999" },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#ddd", marginBottom: 18 },
  questionWrap: { marginBottom: 16 },
  questionText: { fontSize: 11, color: "#222", marginBottom: 5, lineHeight: 1.4 },
  questionNum: { fontFamily: "Helvetica-Bold" },
  optionList: { paddingLeft: 14 },
  option: { fontSize: 10, marginBottom: 2, color: "#444" },
  devLines: { paddingLeft: 0, marginTop: 6 },
  devLine: { borderBottomWidth: 0.3, borderBottomColor: "#ccc", marginBottom: 12 },
  footer: { position: "absolute", bottom: 24, left: 56, right: 56 },
  footerText: { fontSize: 8, color: "#bbb" },
});

export function MinimalDoc({ questions, subject, tema }: ExamDocProps) {
  const today = new Date().toLocaleDateString("es-AR");
  return (
    <Document>
      <Page size="A4" style={minStyles.page}>
        <View style={minStyles.topRow}>
          <Text style={minStyles.subject}>{subject}</Text>
          <Text style={minStyles.tema}>Tema {tema}</Text>
        </View>
        <View style={minStyles.metaRow}>
          <Text style={minStyles.metaText}>{today}</Text>
          <Text style={minStyles.metaText}>90 min</Text>
        </View>
        <View style={minStyles.alumnoLine}>
          <Text style={minStyles.alumnoLabel}>Nombre: _________________________________________</Text>
        </View>
        <View style={minStyles.divider} />
        {questions.map((q, i) => (
          <View key={q.id} style={minStyles.questionWrap}>
            <Text style={minStyles.questionText}>
              <Text style={minStyles.questionNum}>{i + 1}.  </Text>
              {q.text}
            </Text>
            {q.type !== "development" ? renderOptions(q, minStyles) : renderDevLines(minStyles)}
          </View>
        ))}
        <View style={minStyles.footer}>
          <Text style={minStyles.footerText}>Copiloto de Exámenes · Tema {tema}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function buildDocument(props: ExamDocProps) {
  switch (props.template) {
    case "secondary": return <SecondaryDoc {...props} />;
    case "minimal": return <MinimalDoc {...props} />;
    default: return <UniversityDoc {...props} />;
  }
}
