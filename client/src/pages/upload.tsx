import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import DocumentUpload from "../components/DocumentUpload";

export default function UploadPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const patientId = params.get("patientId") ? parseInt(params.get("patientId")!) : null;

  const { data: patient } = useQuery<{ firstName: string; lastName: string }>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Patient context banner */}
      {patientId && patient && (
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Subiendo documentos para:</p>
            <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
          </div>
          <Link
            href={`/patients/${patientId}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al paciente
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Escanear documentos medicos</h1>
        <p className="text-muted-foreground mt-1">
          Sube imagenes o PDFs de documentos medicos para extraer datos con IA
          {patientId && patient && (
            <span className="font-medium text-foreground">
              {" "}— se guardaran en el historial de {patient.firstName}
            </span>
          )}
        </p>
      </div>

      <DocumentUpload patientId={patientId} />
    </div>
  );
}
