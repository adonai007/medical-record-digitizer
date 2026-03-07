import DocumentUpload from "../components/DocumentUpload";

export default function UploadPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Escanear documentos medicos</h1>
        <p className="text-muted-foreground mt-1">
          Sube imagenes o PDFs de tus documentos medicos para extraer datos con IA
        </p>
      </div>

      <DocumentUpload />
    </div>
  );
}
