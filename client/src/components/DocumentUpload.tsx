import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadedDoc {
  id: number;
  originalFilename: string;
  status: string;
}

interface DocumentUploadProps {
  patientId?: number | null;
}

export default function DocumentUpload({ patientId }: DocumentUploadProps) {
  const queryClient = useQueryClient();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (patientId) {
        formData.append("patientId", patientId.toString());
      }
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (doc) => {
      setUploadedDocs((prev) => [...prev, doc]);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const processMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await fetch(`/api/documents/${docId}/process`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/records`] });
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      }
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  });

  const handleProcess = async (docId: number) => {
    setUploadedDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "processing" } : d)));
    try {
      await processMutation.mutateAsync(docId);
      setUploadedDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "completed" } : d)));
    } catch {
      setUploadedDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "failed" } : d)));
    }
  };

  const handleProcessAll = () => {
    for (const doc of uploadedDocs) {
      if (doc.status === "uploaded") {
        handleProcess(doc.id);
      }
    }
  };

  const removeDoc = (id: number) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {uploadMutation.isPending ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground" />
          )}
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "Suelta los archivos aqui" : "Arrastra tus documentos medicos"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPEG, PNG, WebP, PDF - Maximo 20MB por archivo
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded files list */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Documentos subidos ({uploadedDocs.length})</h3>
            {uploadedDocs.some((d) => d.status === "uploaded") && (
              <button
                onClick={handleProcessAll}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Procesar todos con IA
              </button>
            )}
          </div>

          {uploadedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <FileImage className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.originalFilename}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.status === "uploaded" && "Listo para procesar"}
                  {doc.status === "processing" && "Procesando con IA..."}
                  {doc.status === "completed" && "Procesado exitosamente"}
                  {doc.status === "failed" && "Error al procesar"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.status === "uploaded" && (
                  <button
                    onClick={() => handleProcess(doc.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
                  >
                    Procesar
                  </button>
                )}
                {doc.status === "processing" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                {doc.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {doc.status === "failed" && <AlertCircle className="h-5 w-5 text-destructive" />}
                <button onClick={() => removeDoc(doc.id)} className="p-1 hover:bg-muted rounded">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
