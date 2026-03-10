import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string;
  notes: string;
}

const emptyForm: PatientFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  bloodType: "",
  allergies: "",
  notes: "",
};

export default function PatientFormPage() {
  const [matchNew] = useRoute("/patients/new");
  const [matchEdit, editParams] = useRoute("/patients/:id/edit");
  const isEdit = !!matchEdit;
  const patientId = editParams?.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PatientFormData>(emptyForm);

  // Load existing patient data for editing
  const { data: existingPatient } = useQuery<any>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: isEdit && !!patientId,
  });

  useEffect(() => {
    if (existingPatient && isEdit) {
      setForm({
        firstName: existingPatient.firstName || "",
        lastName: existingPatient.lastName || "",
        dateOfBirth: existingPatient.dateOfBirth || "",
        gender: existingPatient.gender || "",
        phone: existingPatient.phone || "",
        email: existingPatient.email || "",
        bloodType: existingPatient.bloodType || "",
        allergies: existingPatient.allergies || "",
        notes: existingPatient.notes || "",
      });
    }
  }, [existingPatient, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (isEdit) {
        const res = await apiRequest("PUT", `/api/patients/${patientId}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/patients", data);
        return res.json();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/stats"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      }
      navigate(`/patients/${result.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      navigate("/patients");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    saveMutation.mutate(form);
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/patients/${patientId}` : "/patients"} className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Editar paciente" : "Nuevo paciente"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <h2 className="font-semibold">Informacion basica</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Juan"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Perez"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha de nacimiento</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Genero</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <h2 className="font-semibold">Contacto</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Telefono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="paciente@email.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Medical info */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <h2 className="font-semibold">Informacion medica</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tipo de sangre</label>
              <select
                value={form.bloodType}
                onChange={(e) => handleChange("bloodType", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Alergias</label>
            <input
              type="text"
              value={form.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              placeholder="Penicilina, Aspirina, etc."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas adicionales sobre el paciente..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {isEdit && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Estas seguro de eliminar este paciente?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          )}

          <div className={!isEdit ? "ml-auto" : ""}>
            <button
              type="submit"
              disabled={saveMutation.isPending || !form.firstName.trim() || !form.lastName.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Guardar cambios" : "Registrar paciente"}
            </button>
          </div>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-red-600">
            Error: {saveMutation.error?.message || "No se pudo guardar"}
          </p>
        )}
      </form>
    </div>
  );
}
