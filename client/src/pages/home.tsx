import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Users, Plus, Clock } from "lucide-react";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  lastVisit: string | null;
}

export default function HomePage() {
  const { data: stats, isLoading } = useQuery<{
    totalDocuments: number;
    completed: number;
    processing: number;
    failed: number;
    totalRecords: number;
    documentTypes: Record<string, number>;
  }>({ queryKey: ["/api/stats"] });

  const { data: recentPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients/recent"],
  });

  const { data: patientStats } = useQuery<{ totalPatients: number }>({
    queryKey: ["/api/patients/stats"],
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenido a <span className="text-primary">DiarioMed</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
          Administra pacientes, digitaliza documentos medicos y mantiene un historial organizado con IA
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Users className="h-5 w-5" />
            Ver pacientes
          </Link>
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nuevo paciente
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Pacientes" value={patientStats?.totalPatients || 0} icon={Users} color="text-primary" />
          <StatCard label="Total documentos" value={stats?.totalDocuments || 0} icon={FileText} />
          <StatCard label="Procesados" value={stats?.completed || 0} icon={CheckCircle} color="text-green-600" />
          <StatCard label="En proceso" value={stats?.processing || 0} icon={Loader2} color="text-blue-600" />
          <StatCard label="Fallidos" value={stats?.failed || 0} icon={AlertCircle} color="text-red-600" />
        </div>
      )}

      {/* Recent patients */}
      {recentPatients && recentPatients.length > 0 && (
        <div className="border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Pacientes recientes
            </h2>
            <Link href="/patients" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {recentPatients.map((patient) => (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <div className="border rounded-xl p-4 bg-card hover:shadow-md transition-all cursor-pointer text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <p className="font-medium text-sm truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  {patient.lastVisit && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(patient.lastVisit).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Como funciona</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Step num={1} title="Registra pacientes" desc="Crea un perfil para cada paciente con su informacion basica" />
          <Step num={2} title="Selecciona un paciente" desc="Elige el paciente al que vas a subir documentos o grabar consulta" />
          <Step num={3} title="Sube documentos" desc="Escanea recetas, laboratorios, radiografias u otros documentos" />
          <Step num={4} title="IA extrae los datos" desc="La informacion se estructura y guarda en el historial del paciente" />
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
