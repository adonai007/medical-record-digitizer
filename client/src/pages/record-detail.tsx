import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, Stethoscope, Pill, FlaskConical, FileText, Activity, Loader2, Clipboard } from "lucide-react";

export default function RecordDetailPage() {
  const [, params] = useRoute("/records/:id");
  const recordId = params?.id;

  const { data, isLoading } = useQuery<{ record: any; document: any }>({
    queryKey: [`/api/records/${recordId}`],
    enabled: !!recordId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20">Registro no encontrado</div>;
  }

  const { record, document: doc } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/records" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Detalle del registro</h1>
          <p className="text-muted-foreground text-sm">
            {doc?.originalFilename} - Modelo: {record.aiModel}
            {record.confidence != null && ` - Confianza: ${Math.round(record.confidence * 100)}%`}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Document image */}
        <div className="border rounded-xl overflow-hidden bg-muted/30">
          <div className="p-3 border-b bg-card">
            <h3 className="font-medium text-sm">Documento original</h3>
          </div>
          {doc && (
            <div className="p-4">
              {doc.mimeType.startsWith("image/") ? (
                <img
                  src={`/api/documents/${doc.id}/image`}
                  alt={doc.originalFilename}
                  className="w-full rounded-lg shadow-sm"
                />
              ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <FileText className="h-16 w-16" />
                  <p className="ml-4">PDF: {doc.originalFilename}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Extracted data */}
        <div className="space-y-4">
          {/* Summary */}
          {record.summary && (
            <Section title="Resumen" icon={Clipboard}>
              <p className="text-sm">{record.summary}</p>
            </Section>
          )}

          {/* General info */}
          <Section title="Informacion general" icon={FileText}>
            <InfoRow label="Tipo" value={record.documentType} />
            <InfoRow label="Fecha" value={record.documentDate} />
            <InfoRow label="Proveedor" value={record.provider} />
          </Section>

          {/* Diagnoses */}
          {record.diagnoses?.length > 0 && (
            <Section title="Diagnosticos" icon={Stethoscope}>
              {record.diagnoses.map((d: any, i: number) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                  {d.code && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">{d.code}</span>}
                  <span className="text-sm">{d.description}</span>
                </div>
              ))}
            </Section>
          )}

          {/* Medications */}
          {record.medications?.length > 0 && (
            <Section title="Medicamentos" icon={Pill}>
              {record.medications.map((m: any, i: number) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.dose, m.frequency, m.duration, m.route].filter(Boolean).join(" - ")}
                  </p>
                </div>
              ))}
            </Section>
          )}

          {/* Lab Results */}
          {record.labResults?.length > 0 && (
            <Section title="Resultados de laboratorio" icon={FlaskConical}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs border-b">
                      <th className="pb-2">Prueba</th>
                      <th className="pb-2">Valor</th>
                      <th className="pb-2">Ref.</th>
                      <th className="pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.labResults.map((r: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 font-medium">{r.test}</td>
                        <td className="py-1.5">{r.value} {r.unit}</td>
                        <td className="py-1.5 text-muted-foreground">{r.referenceRange}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            r.flag === "alto" ? "bg-red-100 text-red-700" :
                            r.flag === "bajo" ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {r.flag || "normal"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Vital Signs */}
          {record.vitalSigns?.length > 0 && (
            <Section title="Signos vitales" icon={Activity}>
              <div className="grid grid-cols-2 gap-2">
                {record.vitalSigns.map((v: any, i: number) => (
                  <div key={i} className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">{v.type}</p>
                    <p className="font-medium">{v.value} {v.unit}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {record.notes && (
            <Section title="Notas" icon={FileText}>
              <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-card border-b flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}
