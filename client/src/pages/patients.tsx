import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Search,
  Plus,
  Clock,
  Phone,
  Calendar,
  ChevronRight,
  Loader2,
  UserPlus,
} from "lucide-react";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  lastVisit: string | null;
  createdAt: string;
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");

  const { data: recentPatients, isLoading: loadingRecent } = useQuery<Patient[]>({
    queryKey: ["/api/patients/recent"],
  });

  const { data: allPatients, isLoading: loadingAll } = useQuery<Patient[]>({
    queryKey: ["/api/patients", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/patients${params}`);
      if (!res.ok) throw new Error("Error fetching patients");
      return res.json();
    },
  });

  const { data: stats } = useQuery<{ totalPatients: number; totalRecords: number }>({
    queryKey: ["/api/patients/stats"],
  });

  const isLoading = loadingRecent || loadingAll;
  const patients = allPatients || [];
  const showRecent = !search && recentPatients && recentPatients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats ? `${stats.totalPatients} pacientes registrados` : "Administra tus pacientes"}
          </p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o telefono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Recent patients */}
      {showRecent && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            PACIENTES RECIENTES
          </h2>
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

      {/* All patients list */}
      <div>
        {!showRecent && !search && (
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            TODOS LOS PACIENTES
          </h2>
        )}
        {search && (
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {patients.length} resultado(s) para "{search}"
          </h2>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : patients.length > 0 ? (
          <div className="border rounded-xl divide-y bg-card">
            {patients.map((patient) => (
              <PatientRow key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-xl">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">
              {search ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </h3>
            <p className="text-muted-foreground mt-1">
              {search
                ? "Intenta con otro termino de busqueda"
                : "Registra tu primer paciente para comenzar"}
            </p>
            {!search && (
              <Link
                href="/patients/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Registrar paciente
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient }: { patient: Patient }) {
  const genderIcon = patient.gender === "masculino" ? "M" : patient.gender === "femenino" ? "F" : "";

  return (
    <Link href={`/patients/${patient.id}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {patient.firstName} {patient.lastName}
            {genderIcon && (
              <span className="ml-2 text-xs text-muted-foreground">({genderIcon})</span>
            )}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </span>
            )}
            {patient.dateOfBirth && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {patient.dateOfBirth}
              </span>
            )}
          </div>
        </div>

        {/* Last visit */}
        {patient.lastVisit && (
          <div className="text-right text-xs text-muted-foreground shrink-0 hidden sm:block">
            <p>Ultima visita</p>
            <p className="font-medium text-foreground">
              {new Date(patient.lastVisit).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
