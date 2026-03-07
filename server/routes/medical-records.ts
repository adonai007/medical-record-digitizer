import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { medicalDocuments, medicalRecords } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { processDocument } from "../services/ocr.js";

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}. Use JPEG, PNG, WebP, GIF o PDF.`));
    }
  },
});

// POST /api/documents/upload - Upload a document
router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo" });
    }

    const [doc] = await db.insert(medicalDocuments).values({
      originalFilename: req.file.originalname,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: "uploaded",
    }).returning();

    res.json(doc);
  } catch (error) {
    console.error("[Upload] Error:", error);
    res.status(500).json({ error: "Error al subir archivo" });
  }
});

// POST /api/documents/:id/process - Process document with AI OCR
router.post("/documents/:id/process", async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const [doc] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, docId));

    if (!doc) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    if (doc.status === "processing") {
      return res.status(409).json({ error: "Documento ya está siendo procesado" });
    }

    // Update status to processing
    await db.update(medicalDocuments).set({ status: "processing" }).where(eq(medicalDocuments.id, docId));

    try {
      const result = await processDocument(doc.storagePath, doc.mimeType);

      // Save extraction results
      const [record] = await db.insert(medicalRecords).values({
        documentId: docId,
        rawText: result.extraction.summary || "",
        documentType: result.extraction.documentType,
        documentDate: result.extraction.documentDate,
        provider: result.extraction.provider,
        diagnoses: result.extraction.diagnoses,
        medications: result.extraction.medications,
        labResults: result.extraction.labResults,
        vitalSigns: result.extraction.vitalSigns,
        procedures: result.extraction.procedures,
        notes: result.extraction.notes,
        summary: result.extraction.summary,
        rawAiResponse: result.rawResponse as any,
        aiModel: result.model,
        confidence: result.extraction.confidence,
      }).returning();

      // Update document status
      await db.update(medicalDocuments).set({
        status: "completed",
        processedAt: new Date(),
      }).where(eq(medicalDocuments.id, docId));

      res.json({ document: { ...doc, status: "completed" }, record });
    } catch (ocrError) {
      await db.update(medicalDocuments).set({
        status: "failed",
        errorMessage: ocrError instanceof Error ? ocrError.message : "Error desconocido",
      }).where(eq(medicalDocuments.id, docId));

      res.status(500).json({ error: ocrError instanceof Error ? ocrError.message : "Error al procesar documento" });
    }
  } catch (error) {
    console.error("[Process] Error:", error);
    res.status(500).json({ error: "Error al procesar documento" });
  }
});

// GET /api/documents - List all documents
router.get("/documents", async (_req, res) => {
  try {
    const docs = await db.select().from(medicalDocuments).orderBy(desc(medicalDocuments.createdAt));
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener documentos" });
  }
});

// GET /api/documents/:id - Get single document
router.get("/documents/:id", async (req, res) => {
  try {
    const [doc] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, parseInt(req.params.id)));
    if (!doc) return res.status(404).json({ error: "No encontrado" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener documento" });
  }
});

// GET /api/records - List all medical records
router.get("/records", async (_req, res) => {
  try {
    const records = await db.select().from(medicalRecords).orderBy(desc(medicalRecords.createdAt));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener registros" });
  }
});

// GET /api/records/:id - Get single record with document
router.get("/records/:id", async (req, res) => {
  try {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, parseInt(req.params.id)));
    if (!record) return res.status(404).json({ error: "No encontrado" });

    const [doc] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, record.documentId));
    res.json({ record, document: doc });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener registro" });
  }
});

// PUT /api/records/:id - Update record (manual correction)
router.put("/records/:id", async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const updates = req.body;

    const [updated] = await db.update(medicalRecords).set(updates).where(eq(medicalRecords.id, recordId)).returning();
    if (!updated) return res.status(404).json({ error: "No encontrado" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar registro" });
  }
});

// DELETE /api/documents/:id - Delete document and its records
router.delete("/documents/:id", async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const [doc] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, docId));
    if (!doc) return res.status(404).json({ error: "No encontrado" });

    // Delete associated records
    await db.delete(medicalRecords).where(eq(medicalRecords.documentId, docId));
    // Delete document
    await db.delete(medicalDocuments).where(eq(medicalDocuments.id, docId));

    // Delete file from disk
    if (fs.existsSync(doc.storagePath)) {
      fs.unlinkSync(doc.storagePath);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar documento" });
  }
});

// GET /api/documents/:id/image - Serve document image
router.get("/documents/:id/image", async (req, res) => {
  try {
    const [doc] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, parseInt(req.params.id)));
    if (!doc) return res.status(404).json({ error: "No encontrado" });

    if (!fs.existsSync(doc.storagePath)) {
      return res.status(404).json({ error: "Archivo no encontrado en disco" });
    }

    res.setHeader("Content-Type", doc.mimeType);
    res.sendFile(path.resolve(doc.storagePath));
  } catch (error) {
    res.status(500).json({ error: "Error al servir imagen" });
  }
});

// GET /api/stats - Dashboard stats
router.get("/stats", async (_req, res) => {
  try {
    const allDocs = await db.select().from(medicalDocuments);
    const allRecords = await db.select().from(medicalRecords);

    const stats = {
      totalDocuments: allDocs.length,
      completed: allDocs.filter((d) => d.status === "completed").length,
      processing: allDocs.filter((d) => d.status === "processing").length,
      failed: allDocs.filter((d) => d.status === "failed").length,
      totalRecords: allRecords.length,
      documentTypes: {} as Record<string, number>,
    };

    for (const r of allRecords) {
      const type = r.documentType || "otro";
      stats.documentTypes[type] = (stats.documentTypes[type] || 0) + 1;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;
