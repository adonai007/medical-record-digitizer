# Arquitectura del MVP - Medical Record Digitizer

> Fecha: 2026-03-07
> Version: 1.0.0

---

## Estructura del Proyecto

```
54_mvp_ocr_medicProfile/
├── knowledge-base/                  # Documentacion y conocimiento
│   ├── investigacion-digitalizacion-medica.md
│   └── arquitectura-mvp.md
├── client/                          # Frontend React SPA
│   ├── index.html                   # HTML entry point
│   └── src/
│       ├── main.tsx                 # React entry + QueryClientProvider
│       ├── App.tsx                  # Router (wouter) + layout
│       ├── index.css                # Tailwind + CSS variables (tema teal medico)
│       ├── lib/
│       │   ├── queryClient.ts       # TanStack Query config + apiRequest helper
│       │   └── utils.ts             # cn() utility (clsx + tailwind-merge)
│       ├── components/
│       │   ├── Navigation.tsx       # Header con links (Inicio, Escanear, Historial)
│       │   ├── DocumentUpload.tsx   # Drag-drop con react-dropzone, upload + process
│       │   └── RecordCard.tsx       # Card de registro medico con badges de tipo
│       └── pages/
│           ├── home.tsx             # Dashboard: stats + como funciona
│           ├── upload.tsx           # Pagina de upload de documentos
│           ├── records.tsx          # Lista de registros medicos
│           └── record-detail.tsx    # Vista detallada: imagen | datos extraidos
├── server/                          # Backend Express API
│   ├── index.ts                     # Express app + Vite dev server
│   ├── db.ts                        # Drizzle + PostgreSQL (Neon/local)
│   ├── vite.ts                      # Vite middleware (dev) / static (prod)
│   ├── routes/
│   │   └── medical-records.ts       # Todos los endpoints API
│   └── services/
│       └── ocr.ts                   # Claude Vision + GPT-4o fallback + Sharp
├── shared/
│   └── schema.ts                    # Drizzle schema + Zod validaciones + tipos
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # TypeScript config (target ES2022)
├── vite.config.ts                   # Vite + React + path aliases
├── tailwind.config.ts               # Tailwind + shadcn/ui theme
├── drizzle.config.ts                # Drizzle Kit config
├── components.json                  # shadcn/ui config (new-york style)
├── postcss.config.js                # PostCSS + autoprefixer
├── .gitignore
└── .env.example                     # Variables de entorno necesarias
```

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UPLOAD                                                    │
│                                                              │
│ Usuario arrastra imagen/PDF                                  │
│     ↓                                                        │
│ DocumentUpload.tsx → POST /api/documents/upload              │
│     ↓                                                        │
│ Multer guarda archivo en /uploads/                           │
│     ↓                                                        │
│ Registro en tabla medical_documents (status: uploaded)       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PROCESAMIENTO                                             │
│                                                              │
│ Usuario click "Procesar con IA"                              │
│     ↓                                                        │
│ POST /api/documents/:id/process                              │
│     ↓                                                        │
│ Sharp preprocesa imagen:                                     │
│   - Resize (max 2000px ancho)                                │
│   - Grayscale                                                │
│   - Normalize contraste                                      │
│   - Convertir a JPEG 90%                                     │
│     ↓                                                        │
│ Imagen → base64                                              │
│     ↓                                                        │
│ Intentar Claude Vision API (claude-sonnet-4)                 │
│   - Prompt medico especializado en espanol                   │
│   - Pide JSON estructurado                                   │
│     ↓ (si falla)                                             │
│ Fallback a GPT-4o Vision                                     │
│   - Mismo prompt                                             │
│   - Misma estructura JSON                                    │
│     ↓                                                        │
│ Validar respuesta con Zod (extractionResultSchema)           │
│     ↓                                                        │
│ Guardar en medical_records + actualizar medical_documents    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VISUALIZACION                                             │
│                                                              │
│ records.tsx → GET /api/records → RecordCard grid             │
│     ↓                                                        │
│ record-detail.tsx → GET /api/records/:id                     │
│     ↓                                                        │
│ Vista lado a lado:                                           │
│   [Imagen original]  |  [Datos extraidos]                    │
│                      |  - Resumen                            │
│                      |  - Diagnosticos (CIE-10)              │
│                      |  - Medicamentos                       │
│                      |  - Resultados lab (tabla)             │
│                      |  - Signos vitales                     │
│                      |  - Notas                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Tabla: medical_documents
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | serial PK | ID auto-incremental |
| original_filename | text | Nombre original del archivo |
| storage_path | text | Ruta en disco del archivo |
| mime_type | text | image/jpeg, image/png, application/pdf |
| file_size | integer | Tamano en bytes |
| page_count | integer | Numero de paginas (default 1) |
| status | text | uploaded, processing, completed, failed |
| error_message | text | Mensaje de error si fallo |
| created_at | timestamp | Fecha de subida |
| processed_at | timestamp | Fecha de procesamiento |

### Tabla: medical_records
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | serial PK | ID auto-incremental |
| document_id | FK → medical_documents | Documento fuente |
| raw_text | text | Texto crudo extraido |
| document_type | text | receta, laboratorio, radiografia, consulta, hospitalizacion, otro |
| document_date | text | Fecha del documento (YYYY-MM-DD) |
| provider | text | Medico o institucion |
| diagnoses | jsonb | [{code, description}] |
| medications | jsonb | [{name, dose, frequency, duration, route}] |
| lab_results | jsonb | [{test, value, unit, referenceRange, flag}] |
| vital_signs | jsonb | [{type, value, unit}] |
| procedures | jsonb | [{name, date, notes}] |
| notes | text | Notas adicionales |
| summary | text | Resumen generado por IA |
| raw_ai_response | jsonb | Respuesta completa del LLM |
| ai_model | text | claude-sonnet-4 o gpt-4o |
| confidence | real | 0.0 a 1.0 |
| created_at | timestamp | Fecha de creacion |

---

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/documents/upload | Subir imagen/PDF (multipart, max 20MB) |
| POST | /api/documents/:id/process | Procesar con IA (Claude → fallback GPT-4o) |
| GET | /api/documents | Listar todos los documentos |
| GET | /api/documents/:id | Obtener un documento |
| GET | /api/documents/:id/image | Servir imagen del documento |
| DELETE | /api/documents/:id | Eliminar documento + registros asociados |
| GET | /api/records | Listar todos los registros medicos |
| GET | /api/records/:id | Obtener registro con documento asociado |
| PUT | /api/records/:id | Editar registro (correccion manual) |
| GET | /api/stats | Dashboard stats (totales, tipos, estados) |
| GET | /api/health | Health check |

---

## Prompt de Extraccion Medica

```
Eres un asistente medico especializado en extraccion de datos de documentos clinicos.
Analiza la imagen del documento medico y extrae TODOS los datos que puedas identificar.

Responde SOLO con JSON valido (sin markdown, sin backticks) con esta estructura exacta:
{
  "documentType": "receta|laboratorio|radiografia|consulta|hospitalizacion|otro",
  "documentDate": "YYYY-MM-DD o null",
  "provider": "nombre del medico o institucion o null",
  "diagnoses": [{"code": "CIE-10", "description": "diagnostico"}],
  "medications": [{"name": "", "dose": "", "frequency": "", "duration": "", "route": ""}],
  "labResults": [{"test": "", "value": "", "unit": "", "referenceRange": "", "flag": "normal|alto|bajo"}],
  "vitalSigns": [{"type": "", "value": "", "unit": ""}],
  "procedures": [{"name": "", "date": "", "notes": ""}],
  "notes": "notas adicionales",
  "summary": "resumen en 2-3 oraciones",
  "confidence": 0.0-1.0
}
```

---

## Dependencias Clave

### Backend
- `@anthropic-ai/sdk` - Claude Vision API
- `openai` - GPT-4o Vision API (fallback)
- `sharp` - Preprocesamiento de imagenes
- `multer` - Upload de archivos multipart
- `express` - Servidor HTTP
- `drizzle-orm` + `@neondatabase/serverless` + `pg` - ORM + PostgreSQL
- `zod` - Validacion de schemas

### Frontend
- `react` + `react-dom` - UI framework
- `@tanstack/react-query` - Data fetching + cache
- `wouter` - Routing ligero
- `react-dropzone` - Drag-drop upload
- `lucide-react` - Iconos
- `tailwindcss` + `tailwind-merge` + `clsx` - Estilos
- `tailwindcss-animate` - Animaciones

---

## Variables de Entorno

```bash
DATABASE_URL=postgresql://user:password@host:5432/medical_records
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PORT=5001
```

---

## Comandos

```bash
npm run dev       # Desarrollo (backend + frontend con HMR)
npm run build     # Build produccion
npm run start     # Ejecutar build
npm run check     # Verificar tipos TypeScript
npm run db:push   # Crear/actualizar tablas en PostgreSQL
```

---

## Patron de Referencia: DiarioMed

Este MVP sigue los mismos patrones de DiarioMed (c:\PRODUCTION\42_diariomed_git\diariomed\):
- Misma estructura client/server/shared
- Mismos path aliases (@/, @shared/)
- Mismo patron apiRequest + TanStack Query
- Mismo Drizzle ORM + Neon/local PostgreSQL
- Mismo shadcn/ui (new-york style)
- Mismo wouter routing
