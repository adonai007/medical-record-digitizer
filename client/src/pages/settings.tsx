import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Loader2, User, Stethoscope, Brain, Globe, FileDown } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface DoctorSettings {
  id: number;
  doctorName: string | null;
  specialty: string | null;
  licenseNumber: string | null;
  clinicName: string | null;
  preferredAiModel: string | null;
  extractionLanguage: string | null;
  defaultExportFormat: string | null;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<DoctorSettings>({
    queryKey: ["/api/settings"],
  });

  const [form, setForm] = useState({
    doctorName: "",
    specialty: "",
    licenseNumber: "",
    clinicName: "",
    preferredAiModel: "claude",
    extractionLanguage: "es",
    defaultExportFormat: "json",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        doctorName: settings.doctorName || "",
        specialty: settings.specialty || "",
        licenseNumber: settings.licenseNumber || "",
        clinicName: settings.clinicName || "",
        preferredAiModel: settings.preferredAiModel || "claude",
        extractionLanguage: settings.extractionLanguage || "es",
        defaultExportFormat: settings.defaultExportFormat || "json",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("PUT", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Configuracion
        </h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu perfil y preferencias de la aplicacion
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor profile */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Perfil del doctor
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={form.doctorName}
                onChange={(e) => handleChange("doctorName", e.target.value)}
                placeholder="Dr. Juan Perez"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Especialidad</label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) => handleChange("specialty", e.target.value)}
                placeholder="Medicina General"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Cedula profesional</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => handleChange("licenseNumber", e.target.value)}
                placeholder="12345678"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Clinica / Consultorio</label>
              <input
                type="text"
                value={form.clinicName}
                onChange={(e) => handleChange("clinicName", e.target.value)}
                placeholder="Clinica San Jose"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* AI preferences */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Preferencias de IA
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Modelo de IA preferido</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  form.preferredAiModel === "claude"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="aiModel"
                  value="claude"
                  checked={form.preferredAiModel === "claude"}
                  onChange={(e) => handleChange("preferredAiModel", e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  form.preferredAiModel === "claude" ? "border-primary" : "border-muted-foreground"
                }`}>
                  {form.preferredAiModel === "claude" && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Claude Vision</p>
                  <p className="text-xs text-muted-foreground">Anthropic - Recomendado</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  form.preferredAiModel === "gpt4o"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="aiModel"
                  value="gpt4o"
                  checked={form.preferredAiModel === "gpt4o"}
                  onChange={(e) => handleChange("preferredAiModel", e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  form.preferredAiModel === "gpt4o" ? "border-primary" : "border-muted-foreground"
                }`}>
                  {form.preferredAiModel === "gpt4o" && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">GPT-4o Vision</p>
                  <p className="text-xs text-muted-foreground">OpenAI - Alternativa</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                Idioma de extraccion
              </label>
              <select
                value={form.extractionLanguage}
                onChange={(e) => handleChange("extractionLanguage", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="es">Espanol</option>
                <option value="en">Ingles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                <FileDown className="h-3.5 w-3.5" />
                Formato de exportacion
              </label>
              <select
                value={form.defaultExportFormat}
                onChange={(e) => handleChange("defaultExportFormat", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              Configuracion guardada
            </span>
          )}
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar configuracion
          </button>
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
