import { Link } from "wouter";
import { FileText, Calendar, Stethoscope, Pill, FlaskConical, ArrowRight } from "lucide-react";

interface MedicalRecord {
  id: number;
  documentId: number;
  documentType: string | null;
  documentDate: string | null;
  provider: string | null;
  summary: string | null;
  diagnoses: Array<{ code: string; description: string }> | null;
  medications: Array<{ name: string; dose: string; frequency: string; duration: string; route: string }> | null;
  labResults: Array<{ test: string; value: string; unit: string; referenceRange: string; flag: string }> | null;
  confidence: number | null;
  aiModel: string | null;
  createdAt: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  receta: { label: "Receta", color: "bg-blue-100 text-blue-700" },
  laboratorio: { label: "Laboratorio", color: "bg-purple-100 text-purple-700" },
  radiografia: { label: "Radiografia", color: "bg-amber-100 text-amber-700" },
  consulta: { label: "Consulta", color: "bg-green-100 text-green-700" },
  hospitalizacion: { label: "Hospitalizacion", color: "bg-red-100 text-red-700" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-700" },
};

export default function RecordCard({ record }: { record: MedicalRecord }) {
  const typeInfo = typeLabels[record.documentType || "otro"] || typeLabels.otro;

  return (
    <Link href={`/records/${record.id}`}>
      <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {record.summary && (
          <p className="text-sm text-foreground mb-3 line-clamp-2">{record.summary}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {record.documentDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {record.documentDate}
            </span>
          )}
          {record.provider && (
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3.5 w-3.5" />
              {record.provider}
            </span>
          )}
          {record.diagnoses && record.diagnoses.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {record.diagnoses.length} diagnostico(s)
            </span>
          )}
          {record.medications && record.medications.length > 0 && (
            <span className="flex items-center gap-1">
              <Pill className="h-3.5 w-3.5" />
              {record.medications.length} medicamento(s)
            </span>
          )}
          {record.labResults && record.labResults.length > 0 && (
            <span className="flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" />
              {record.labResults.length} resultado(s)
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Modelo: {record.aiModel || "N/A"}</span>
          {record.confidence != null && (
            <span>Confianza: {Math.round(record.confidence * 100)}%</span>
          )}
        </div>
      </div>
    </Link>
  );
}
