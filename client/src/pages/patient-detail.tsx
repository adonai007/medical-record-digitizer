import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Droplets,
  AlertTriangle,
  FileText,
  Upload,
  Edit3,
  Loader2,
  Stethoscope,
  Pill,
  FlaskConical,
} from "lucide-react";

interface PatientDetail {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  bloodType: string | null;
  allergies: string | null;
  notes: string | null;
  lastVisit: string | null;
  recordCount: number;
  documentCount: number;
  createdAt: string;
}

interface MedicalRecord {
  id: number;
  documentType: string | null;
  documentDate: string | null;
  provider: string | null;
  summary: string | null;
  diagnoses: Array<{ code: string; description: string }> | null;
  medications: Array<{ name: string }> | null;
  labResults: Array<{ test: string }> | null;
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

export default function PatientDetailPage() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;
  const [, navigate] = useLocation();

  const { data: patient, isLoading: loadingPatient } = useQuery<PatientDetail>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: records, isLoading: loadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: [`/api/patients/${patientId}/records`],
    enabled: !!patientId,
  });

  if (loadingPatient) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-20">Paciente no encontrado</div>;
  }

  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patients" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground text-sm">
            {patient.recordCount} registro(s) - {patient.documentCount} documento(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/patients/${patientId}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-muted"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Link>
          <Link
            href={`/upload?patientId=${patientId}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Subir documento
          </Link>
        </div>
      </div>

      {/* Patient info card */}
      <div className="border rounded-xl p-5 bg-card">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {patient.dateOfBirth && (
              <InfoItem icon={Calendar} label="Fecha de nacimiento" value={`${patient.dateOfBirth}${age !== null ? ` (${age} anos)` : ""}`} />
            )}
            {patient.gender && (
              <InfoItem icon={User} label="Genero" value={patient.gender} />
            )}
            {patient.phone && (
              <InfoItem icon={Phone} label="Telefono" value={patient.phone} />
            )}
            {patient.bloodType && (
              <InfoItem icon={Droplets} label="Tipo de sangre" value={patient.bloodType} />
            )}
          </div>
        </div>

        {patient.allergies && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alergias: {patient.allergies}
            </p>
          </div>
        )}

        {patient.notes && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Medical history */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Historial medico
        </h2>

        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : records && records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => {
              const typeInfo = typeLabels[record.documentType || "otro"] || typeLabels.otro;
              return (
                <Link key={record.id} href={`/records/${record.id}`}>
                  <div className="border rounded-xl p-4 bg-card hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {record.documentDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {record.documentDate}
                          </span>
                        )}
                      </div>
                      {record.provider && (
                        <span className="text-xs text-muted-foreground">{record.provider}</span>
                      )}
                    </div>

                    {record.summary && (
                      <p className="text-sm text-foreground mb-2 line-clamp-2">{record.summary}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {record.diagnoses && record.diagnoses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {record.diagnoses.length} diagnostico(s)
                        </span>
                      )}
                      {record.medications && record.medications.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {record.medications.length} medicamento(s)
                        </span>
                      )}
                      {record.labResults && record.labResults.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FlaskConical className="h-3 w-3" />
                          {record.labResults.length} resultado(s)
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">Sin registros medicos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sube un documento para este paciente
            </p>
            <Link
              href={`/upload?patientId=${patientId}`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              Subir documento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-medium capitalize mt-0.5">{value}</p>
    </div>
  );
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
