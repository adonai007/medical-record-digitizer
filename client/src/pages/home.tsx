import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: stats, isLoading } = useQuery<{
    totalDocuments: number;
    completed: number;
    processing: number;
    failed: number;
    totalRecords: number;
    documentTypes: Record<string, number>;
  }>({ queryKey: ["/api/stats"] });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Digitaliza tu <span className="text-primary">Historial Medico</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
          Escanea tus documentos medicos fisicos y extrae datos estructurados automaticamente con IA Vision
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Escanear documentos
          </Link>
          <Link
            href="/records"
            className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            <FileText className="h-5 w-5" />
            Ver historial
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total documentos" value={stats.totalDocuments} icon={FileText} />
          <StatCard label="Procesados" value={stats.completed} icon={CheckCircle} color="text-green-600" />
          <StatCard label="En proceso" value={stats.processing} icon={Loader2} color="text-blue-600" />
          <StatCard label="Fallidos" value={stats.failed} icon={AlertCircle} color="text-red-600" />
        </div>
      ) : null}

      {/* Document types */}
      {stats && Object.keys(stats.documentTypes).length > 0 && (
        <div className="border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Tipos de documentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats.documentTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="capitalize font-medium">{type}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Step num={1} title="Sube tu documento" desc="Arrastra imagenes o PDFs de tus documentos medicos escaneados" />
          <Step num={2} title="IA extrae los datos" desc="Claude Vision o GPT-4o analizan la imagen y extraen datos estructurados" />
          <Step num={3} title="Revisa tu historial" desc="Los datos se organizan automaticamente: diagnosticos, medicamentos, resultados" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="border rounded-xl p-5 bg-card">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color || "text-muted-foreground"}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {num}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
  );
}
