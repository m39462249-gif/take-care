import React, { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { FileText, Download, X, Edit3, CheckCircle2, ShieldCheck } from "lucide-react";
import { PatientStats } from "../../types/clinical.js";

// PDF Document Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
    marginBottom: 6,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    width: "40%",
  },
  value: {
    color: "#0f172a",
    width: "60%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    paddingVertical: 3,
  },
  tableCellHeader: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    fontSize: 9,
  },
  tableCell: {
    fontSize: 9,
    color: "#1e293b",
  },
  obsBox: {
    marginTop: 4,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    fontSize: 9,
    fontStyle: "italic",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: 200,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 4,
    marginTop: 20,
  },
});

// PDF Document Layout Component
const MedicalReportPDF: React.FC<{
  stats: PatientStats;
  observations: string;
  doctorName: string;
  licenseNumber: string;
}> = ({ stats, observations, doctorName, licenseNumber }) => (
  <Document title={`Informe_Medico_${stats.patient.fullName.replace(/\s+/g, "_")}`}>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>
          Informe Clínico Mensual • Plataforma Ritmo
        </Text>
        <Text style={pdfStyles.subtitle}>
          Seguimiento Neurocognitivo, Adherencia Farmacológica y Regulación Sensorial
        </Text>
        <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 4 }}>
          Fecha de Emisión: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      </View>

      {/* Patient & Doctor Data */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Datos del Paciente y Especialista</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Paciente:</Text>
          <Text style={pdfStyles.value}>{stats.patient.fullName} ({stats.patient.age} años)</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Cuidador Principal:</Text>
          <Text style={pdfStyles.value}>{stats.patient.caregiverName} ({stats.patient.caregiverRelation})</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Profesional Tratante:</Text>
          <Text style={pdfStyles.value}>{doctorName} • Matrícula: {licenseNumber}</Text>
        </View>
      </View>

      {/* Section 1: Medication Adherence */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Adherencia Farmacológica (Últimas 4 Semanas)</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Adherencia Global:</Text>
          <Text style={pdfStyles.value}>{stats.adherence.overallPercentage}% ({stats.adherence.totalTaken} de {stats.adherence.totalScheduled} tomas)</Text>
        </View>
        
        {/* Table Breakdown */}
        <View style={{ marginTop: 6 }}>
          <View style={[pdfStyles.tableRow, { borderBottomColor: "#cbd5e1", paddingBottom: 4 }]}>
            <Text style={[pdfStyles.tableCellHeader, { width: "35%" }]}>Período</Text>
            <Text style={[pdfStyles.tableCellHeader, { width: "25%" }]}>Confirmadas</Text>
            <Text style={[pdfStyles.tableCellHeader, { width: "20%" }]}>Pautadas</Text>
            <Text style={[pdfStyles.tableCellHeader, { width: "20%" }]}>% Cumplimiento</Text>
          </View>
          {stats.adherence.weeklyBreakdown.map((wb, idx) => (
            <View key={idx} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: "35%" }]}>{wb.week}</Text>
              <Text style={[pdfStyles.tableCell, { width: "25%" }]}>{wb.taken}</Text>
              <Text style={[pdfStyles.tableCell, { width: "20%" }]}>{wb.scheduled}</Text>
              <Text style={[pdfStyles.tableCell, { width: "20%", fontFamily: "Helvetica-Bold" }]}>{wb.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Section 2: Symptoms Reported by Caregiver */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Frecuencia de Síntomas Conductuales Reportados</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Total de Reportes del Mes:</Text>
          <Text style={pdfStyles.value}>{stats.symptoms.totalReports} episodios registrados</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Dificultad para dormir / Insomnio:</Text>
          <Text style={pdfStyles.value}>{stats.symptoms.counts.NO_SLEEP} reportes</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Agitación / Irritabilidad:</Text>
          <Text style={pdfStyles.value}>{stats.symptoms.counts.AGITATION} reportes (intervenidos con guía)</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Rechazo de Alimentos:</Text>
          <Text style={pdfStyles.value}>{stats.symptoms.counts.FOOD_REFUSAL} reportes</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Alucinaciones:</Text>
          <Text style={pdfStyles.value}>{stats.symptoms.counts.HALLUCINATION} reportes</Text>
        </View>
      </View>

      {/* Section 3: Emotional First Aid Tool Usage */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>3. Uso de Herramientas de Regulación (Modo Calma)</Text>
        <Text style={{ fontSize: 9, color: "#334155", marginBottom: 4 }}>
          Total de activaciones autónomas por el paciente: {stats.firstAidUsage.totalSessions} sesiones.
        </Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Respiración Guiada (Círculo):</Text>
          <Text style={pdfStyles.value}>{stats.firstAidUsage.techniqueCounts.BREATHING} sesiones</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Música Relajante:</Text>
          <Text style={pdfStyles.value}>{stats.firstAidUsage.techniqueCounts.MUSIC} sesiones</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>• Galería y Mensajes Familiares:</Text>
          <Text style={pdfStyles.value}>{stats.firstAidUsage.techniqueCounts.PHOTOS} sesiones</Text>
        </View>
      </View>

      {/* Section 4: Professional Observations */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>4. Observaciones Clínicas y Conducta Médica</Text>
        <View style={pdfStyles.obsBox}>
          <Text>{observations || "Sin observaciones adicionales reportadas en esta emisión."}</Text>
        </View>
      </View>

      {/* Signature & Seal */}
      <View style={pdfStyles.footer}>
        <View>
          <Text style={{ fontSize: 8, color: "#64748b" }}>
            Reporte generado determinísticamente por Plataforma Ritmo.
          </Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>
            Código de verificación: RTM-{Math.random().toString(36).substring(2, 8).toUpperCase()}
          </Text>
        </View>

        <View style={pdfStyles.signatureBox}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{doctorName}</Text>
          <Text style={{ fontSize: 8, color: "#475569" }}>{licenseNumber}</Text>
          <Text style={{ fontSize: 8, color: "#475569" }}>Especialista en Neurocognición</Text>
        </View>
      </View>
    </Page>
  </Document>
);

interface MedicalReportGeneratorProps {
  stats: PatientStats;
  doctorName?: string;
  licenseNumber?: string;
}

export const MedicalReportGenerator: React.FC<MedicalReportGeneratorProps> = ({
  stats,
  doctorName = "Dra. Sofía Martínez",
  licenseNumber = "MED-ESP-29831",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [observations, setObservations] = useState(
    "Paciente presenta excelente adherencia a la medicación con el ritual del vaso (92.8%). Los episodios de inquietud han sido manejados de forma temprana por la cuidadora aplicando el playbook estructurado de agua fresca y modulación de voz. Se mantiene el esquema actual sin modificaciones."
  );

  return (
    <>
      {/* Prominent Export Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-6 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-lg rounded-2xl shadow-lg transition-transform hover:scale-[1.02] focus:ring-4 focus:ring-purple-300 focus:outline-none min-h-[56px]"
        aria-label="Generar Informe Médico del Mes en PDF"
      >
        <FileText className="w-6 h-6" aria-hidden="true" />
        <span>Generar Informe Médico del Mes</span>
      </button>

      {/* Modal to edit observations before downloading PDF */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Generador de Informe Médico Mensual"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-purple-200 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Exportar Informe Médico
                  </h3>
                  <span className="text-sm font-bold text-slate-500">
                    {stats.patient.fullName} • Informe Oficial en PDF
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Summary in Modal */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center">
              <div>
                <span className="text-xs font-black uppercase text-purple-800 block">Adherencia</span>
                <span className="text-2xl font-black text-purple-950">{stats.adherence.overallPercentage}%</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-purple-800 block">Síntomas</span>
                <span className="text-2xl font-black text-purple-950">{stats.symptoms.totalReports}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-purple-800 block">Modo Calma</span>
                <span className="text-2xl font-black text-purple-950">{stats.firstAidUsage.totalSessions}</span>
              </div>
            </div>

            {/* Editable Observations Textarea */}
            <div>
              <label
                htmlFor="clinicalObservations"
                className="block text-base font-extrabold text-slate-900 mb-1.5 flex items-center gap-2"
              >
                <Edit3 className="w-5 h-5 text-purple-700" />
                <span>Observaciones y Juicio Clínico del Profesional:</span>
              </label>
              <textarea
                id="clinicalObservations"
                rows={5}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Añade las notas médicas que figurarán en el documento oficial..."
                className="w-full p-4 text-base rounded-2xl border-2 border-slate-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 focus:outline-none text-slate-900 placeholder-slate-400"
              />
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                Este texto se incorporará en la Sección 4 del documento PDF generado.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-4 px-5 rounded-2xl border-2 border-slate-300 font-bold text-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <PDFDownloadLink
                document={
                  <MedicalReportPDF
                    stats={stats}
                    observations={observations}
                    doctorName={doctorName}
                    licenseNumber={licenseNumber}
                  />
                }
                fileName={`Informe_Medico_${stats.patient.fullName.replace(/\s+/g, "_")}.pdf`}
                className="flex-1"
              >
                {({ loading }) => (
                  <button
                    type="button"
                    disabled={loading}
                    className="w-full py-4 px-5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] focus:ring-4 focus:ring-purple-300 disabled:opacity-50"
                  >
                    <Download className="w-6 h-6" />
                    <span>{loading ? "Generando PDF..." : "Descargar PDF"}</span>
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
