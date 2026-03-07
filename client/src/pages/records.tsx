import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText } from "lucide-react";
import RecordCard from "../components/RecordCard";
import { Link } from "wouter";

export default function RecordsPage() {
  const { data: records, isLoading } = useQuery<any[]>({ queryKey: ["/api/records"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial medico</h1>
          <p className="text-muted-foreground mt-1">
            Todos tus registros medicos extraidos por IA
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          + Nuevo escaneo
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : records && records.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record: any) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay registros aun</h3>
          <p className="text-muted-foreground mt-1">Sube y procesa documentos medicos para ver tus registros aqui</p>
          <Link
            href="/upload"
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Escanear primer documento
          </Link>
        </div>
      )}
    </div>
  );
}
