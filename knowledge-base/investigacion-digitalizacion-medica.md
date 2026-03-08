# Investigacion: Digitalizacion de Historial Medico con IA

> Fecha: 2026-03-07
> Proyecto: Medical Record Digitizer (MVP)
> Ubicacion: c:\PRODUCTION\54_mvp_ocr_medicProfile\

---

## 1. Contexto y Objetivo

Digitalizar historiales medicos fisicos (documentos en papel) escaneados como imagenes o PDFs, extrayendo datos estructurados automaticamente usando OCR + IA Vision.

**Flujo**:
```
Documento fisico → Escaner/Foto → Imagen digital → IA Vision (OCR + comprension)
    → Datos estructurados (JSON) → Base de datos PostgreSQL
```

---

## 2. Tecnologias OCR Investigadas

### 2.1 Cloud APIs

| Servicio | Precision | Costo/1K paginas | Notas |
|----------|-----------|-------------------|-------|
| Google Document AI | 98% | $1.50 | Mayor precision general, 100+ idiomas |
| AWS Textract | 95-99% | $1.50 | Buena integracion AWS, async para PDFs grandes |
| Azure Document Intelligence | 96% | $1.50 | Opcion on-premises con contenedores |
| Mistral OCR 3 Batch | 95%+ | $1.00 | El mas barato en cloud |

### 2.2 Open Source Local

| Motor | Precision | Costo | Requisitos | Notas |
|-------|-----------|-------|------------|-------|
| Surya OCR | 97.70% | $0 | GPU recomendada | Mejor open-source general, detecta tablas |
| PaddleOCR v3 (PP-OCRv5) | 95% | $0 | CPU viable, GPU ideal | Mayo 2025, 13 puntos mejora sobre v4, <10MB |
| PaddleOCR-VL-0.9B | 95%+ | $0 | Ligero | Ultra-ligero, 109 idiomas |
| DeepSeek-OCR2 (3B) | 97% | $0 | GPU 8GB+ | MIT license, 200K+ pags/dia/GPU, 93% manuscrito |
| Chandra-OCR-8B | 83.1 olmOCR-Bench | $0 | GPU 16GB+ | Mejor score en olmOCR-Bench |
| EasyOCR | 90%+ | $0 | CPU/GPU | Facil de usar, 80+ idiomas, PyTorch |
| Tesseract | 90-95% | $0 | Solo CPU | El clasico, 100+ idiomas, malo en tablas |

### 2.3 Node.js Especifico

| Paquete NPM | Precision | Ventaja |
|-------------|-----------|---------|
| Zerox | Depende del VLM | Wrapper multi-proveedor (Claude, GPT-4, Gemini), MEJOR opcion |
| Scribe.js (scribe.js-ocr) | > Tesseract.js | PDF nativo, mas moderno |
| Tesseract.js | 70-85% | Gratuito, solo CPU, fallback basico |

---

## 3. Modelos de Vision IA (VLMs) - State of the Art 2025-2026

### 3.1 APIs Cloud

| Modelo | Texto Impreso | Manuscrito | Tablas | Costo |
|--------|---------------|------------|--------|-------|
| Claude Opus 4.6 Vision | 97% | 85-90% | 95% | ~$15/$75 por M tokens in/out |
| Claude Sonnet 4 Vision | 95% | 85% | 93% | Mas economico |
| GPT-4o Vision | 98% | 85-91% | 93% | ~$2.50/$10 por M tokens |
| GPT-4o-mini Vision | 92% | 80% | 85% | ~$0.15/$0.60 por M tokens |
| Gemini 2.5 Pro | 94% | 85% | 90% | Competitivo, 1M+ contexto |

### 3.2 Modelos Locales (Ollama / HuggingFace)

| Modelo | Precision | RAM/VRAM | Notas |
|--------|-----------|----------|-------|
| Qwen3-VL | 95%+ | 16-64GB | Flagship, rivaliza GPT-5 |
| Llama 3.2 Vision 90B | 90% | 64GB+ RAM | 100% offline |
| Llama 3.2 Vision 11B | 85% | 16GB RAM | Viable en hardware modesto |
| Qwen2-VL | 93% | 16GB+ | OCR + layout + traduccion |
| Florence-2 (Microsoft) | 88% | 8GB VRAM | Compacto y eficiente |

### 3.3 Limitacion Critica para Uso Clinico

Los modelos de IA generales muestran **15-16% de tasa de alucinacion** y carecen de validacion medica. No deben usarse para atencion al paciente sin validacion adicional humana.

---

## 4. IA Medica Especializada

### 4.1 NLP Medico

| Herramienta | Tipo | Licencia | Capacidad |
|-------------|------|----------|-----------|
| MedGemma (Google) | LLM medico | Gratis comercial | 4B/27B params, FHIR, 87.7% MedQA |
| OpenMed NER | NER | Apache 2.0 | 380+ modelos, SOTA en 10/12 benchmarks |
| medspaCy | NLP pipeline | Open source | Entidades medicas, negacion, temporalidad |
| Med7 | NER medicamentos | Open source | 7 conceptos: dosificacion, nombre, duracion, forma, frecuencia, via, potencia |
| CliNER | NER clinico | Open source | Problema, Prueba, Tratamiento |
| scispaCy | NER biomedico | Open source | PubMed, 4409 quimicos, 5818 enfermedades |
| John Snow Labs | NLP completo | Licenciado | 2,500+ modelos, de-identificacion |

### 4.2 medspaCy - Detalle

Biblioteca NLP medica sobre spaCy para procesar texto clinico:
- **TargetRule matching**: reglas para entidades medicas
- **ConText algorithm**: detecta negacion ("no tiene diabetes"), temporalidad ("historial de")
- **Section detection**: identifica secciones del documento
- **Pre-procesamiento**: limpieza de texto clinico
- Se puede usar como capa adicional de validacion despues del OCR con IA Vision

---

## 5. RAG Multimodal (Busqueda en Documentos)

| Herramienta | Innovacion | Notas |
|-------------|-----------|-------|
| ColPali/ColQwen | Busca en imagenes SIN OCR previo | Revolucionario: indexa paginas como imagenes |
| Nemotron ColEmbed V2 (NVIDIA) | SOTA busqueda visual | Mejor precision que ColPali |
| M3DocRAG (Bloomberg) | RAG multi-pagina/documento | Para consultar multiples documentos |
| Byaldi | Wrapper facil sobre ColPali | Simplifica implementacion |

**Caso de uso**: "buscar resultados de laboratorio de marzo" → encuentra la pagina exacta del historial escaneado sin necesidad de OCR previo.

---

## 6. Pipelines Open Source Completos

| Pipeline | Stars | Velocidad | Notas |
|----------|-------|-----------|-------|
| Zerox (getomni-ai) | Alto | Depende VLM | npm + Python, MIT, multi-proveedor |
| Marker (Datalab) | 30.7K | 20-120 pags/seg H100 | LLM-boosted, markdown/JSON/HTML |
| Docling (IBM) | Alto | 0.49 seg/pag | Red Hat AI, LangChain/LlamaIndex |
| olmOCR (Allen AI) | Alto | Medio | Mejor para docs escaneados antiguos |
| Unstructured.io | Alto | Medio | Pre-procesamiento universal |

---

## 7. Analisis de Costos Detallado

### 7.1 Para 1,000 Documentos (5,000 paginas)

| Solucion | Costo Total | Tiempo | Privacidad |
|----------|------------|--------|-----------|
| PaddleOCR-VL local | $0.45-$3.50 | 2-4 horas | Total |
| Tesseract.js local | $0 (solo CPU) | 8-10 horas | Total |
| Zerox + GPT-4o-mini batch | $3.75 | 24 horas | Cloud |
| Zerox + Claude Sonnet batch | $7.50 | 24 horas | Cloud |
| Mistral OCR 3 batch | $5.00 | 2-6 horas | Cloud |
| AWS Textract | $7.50 | 1-2 horas | Cloud |
| Google Document AI | $7.50 | 1-2 horas | Cloud |

### 7.2 Economias de Escala

- A **10M paginas/mes**: Cloud = $15,000 vs Auto-hospedado = <$1,000
- **Punto equilibrio**: ~100K paginas/mes favorece auto-hospedado
- **Open source vs cloud**: 100-10,000x mas barato
- **Batch APIs** (OpenAI/Anthropic): 50% descuento, 24h turnaround
- **Prompt caching** (Anthropic): 90% ahorro en contexto repetido

---

## 8. Privacidad y Cumplimiento

### 8.1 HIPAA

- **BAA (Business Associate Agreement)** requerido antes de usar cloud con PHI
- Sin BAA = ilegal usar OCR cloud para datos medicos en EE.UU.
- **Procesamiento local** elimina requisitos de cumplimiento de proveedor

### 8.2 GDPR 2025

- Anonimizacion es proceso **continuo**, no un checkbox
- Base legal separada para entrenamiento vs. despliegue
- **Siempre de-identificar** antes de enviar a APIs cloud

### 8.3 Stack Privado Recomendado

```
PaddleOCR-VL (local) → PyDeID (de-identificacion, F1 87.9%) → MedGemma 4B (local) → PostgreSQL local
```

### 8.4 Mejores Practicas

- Encriptacion en reposo y en transito
- Controles de acceso basados en roles
- Autenticacion multi-factor
- Registro de auditoria completo
- APIs gratuitas = RIESGO (datos pueden almacenarse en servidores de terceros)

---

## 9. Estandares de Datos Medicos

### 9.1 FHIR (Fast Healthcare Interoperability Resources)

- Estandar REST moderno para datos de salud
- JSON, XML o RDF
- ~150 recursos estandar (Patient, Observation, Medication, Encounter)
- **Regulatorio** en EE.UU. (21st Century Cures Act)
- Mas simple que HL7 legacy

### 9.2 Herramientas de Conversion

- **FHIR Converter**: formato legacy → FHIR
- **Metriport**: API universal, C-CDA → FHIR R4
- **Framework REMOTE**: notas clinicas → recursos FHIR automaticamente

### 9.3 CIE-10 (ICD-10)

- Codigos de diagnostico internacionales
- Ya soportado en DiarioMed
- DeepSeek-OCR sugiere codigos CIE-10 directamente del texto

---

## 10. Sistemas EHR Open Source

| Sistema | Descripcion |
|---------|------------|
| OpenEMR | EHR mas popular, gestion de practica integrada |
| LibreHealth EHR | Gratuito, enfocado en acceso global |
| OpenMRS | Plataforma EMR empresarial |
| GNU Health | EHR + gestion hospitalaria |
| HospitalRun | Para entornos con recursos limitados |
| OCEMR | Ligero, para clinicas pequenas |

---

## 11. Proyectos GitHub Relevantes

### OCR Medico
- `Tanguy9862/Medical-OCR-Data-Extraction` - Python, 2000+ docs procesados
- `JonSnow1807/Medical-Prescription-OCR` - Donut transformer, recetas manuscritas
- `Shriram2005/MediScribe-OCR` - OCR recetas medicas
- `xuewenyuan/OCR-for-Medical-Laboratory-Reports` - Deep learning lab reports
- `Soma4141/MedExtract` - OCR inteligente con clasificacion

### Pipelines
- `getomni-ai/zerox` - Vision OCR a markdown, multi-proveedor
- `PaddlePaddle/PaddleOCR` - OCR completo, v3 con PP-OCRv5
- `VikParuchuri/marker` - PDF a markdown, 30K+ stars
- `DS4SD/docling` - IBM, conversion de documentos
- `clovaai/donut` - Document Understanding Transformer

### IA Medica
- `epfLLM/meditron` - LLMs medicos open source (7B, 70B)
- `AI-in-Health/MedLLMsPracticalGuide` - Recursos LLMs medicos
- `kakoni/awesome-healthcare` - Catalogo software de salud

---

## 12. Tendencias 2025-2026

1. **VLMs reemplazan OCR tradicional**: modelos end-to-end superan pipelines
2. **Octubre 2025**: 6 modelos OCR open-source lanzados en un solo mes
3. **Modelos locales**: ya alcanzan calidad comparable a APIs cloud
4. **FHIR**: se consolida como estandar universal
5. **Procesamiento local**: gana terreno por privacidad y costo
6. **Escritura manuscrita medica**: ya no es insuperable (93% con DeepSeek-OCR)
7. **Pipelines hibridos**: OCR local + LLM cloud = mejor balance
8. **ColPali**: busqueda en documentos sin OCR (revolucionario)

---

## 13. NotebookLM Generado

- **URL**: https://notebooklm.google.com/notebook/f5a36180-44d0-4787-b052-1df43c94dae8
- **Fuentes**: 9 documentos de investigacion
- **Audio 1**: "IA para descifrar letra de medico" (podcast deep dive en espanol)
- **Audio 2**: Deep dive con investigacion state-of-the-art completa
- **Video 1**: "Digitalizacion Medica con IA" (explainer)
- **Video 2**: Video con hallazgos de vanguardia 2025-2026

---

## 14. Decision de Implementacion: MVP

### Stack Elegido
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui + wouter
- **Backend**: Express.js + TypeScript + Multer
- **Base de datos**: PostgreSQL (Neon serverless) + Drizzle ORM
- **OCR/IA**: Claude Vision API (primario) + GPT-4o Vision (fallback)
- **Preprocesamiento**: Sharp (grayscale, normalize, resize)

### Pipeline Implementado
```
Upload imagen/PDF → Sharp preprocesamiento → Claude Vision API
    → fallback GPT-4o Vision → JSON estructurado → PostgreSQL
```

### Datos Extraidos
- Tipo de documento (receta, laboratorio, radiografia, consulta, hospitalizacion)
- Fecha del documento
- Proveedor (medico/institucion)
- Diagnosticos con codigos CIE-10
- Medicamentos (nombre, dosis, frecuencia, duracion, via)
- Resultados de laboratorio (prueba, valor, unidad, rango referencia, flag)
- Signos vitales
- Procedimientos
- Notas y resumen generado por IA
- Nivel de confianza (0-1)

### Hoja de Ruta Futura

**Fase 2 (Mes 1-3): Produccion**
- Mistral OCR 3 Batch ($1/1K paginas)
- OpenMed NER para entidades medicas
- medspaCy como capa de validacion
- UI para revisar/corregir extracciones
- Cola de trabajos para procesamiento en lote

**Fase 3 (Mes 3-6): Privacidad Total**
- PaddleOCR-VL auto-hospedado
- MedGemma 4B local
- ColPali para busqueda visual sin OCR
- VPC privado, datos nunca salen del servidor
