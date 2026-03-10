import { Router } from "express";
import { db } from "../db.js";
import { patients, medicalDocuments, medicalRecords } from "@shared/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

const router = Router();

// GET /api/patients - List all patients (with optional search)
router.get("/patients", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let query = db.select().from(patients).where(eq(patients.isActive, true));

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = db
        .select()
        .from(patients)
        .where(
          sql`${patients.isActive} = true AND (
            ${patients.firstName} ILIKE ${term} OR
            ${patients.lastName} ILIKE ${term} OR
            ${patients.phone} ILIKE ${term} OR
            CONCAT(${patients.firstName}, ' ', ${patients.lastName}) ILIKE ${term}
          )`
        );
    }

    const result = await query
      .orderBy(desc(patients.lastVisit), desc(patients.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(result);
  } catch (error) {
    console.error("[Patients] List error:", error);
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
});

// GET /api/patients/recent - Get recently visited patients
router.get("/patients/recent", async (_req, res) => {
  try {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.isActive, true))
      .orderBy(desc(patients.lastVisit))
      .limit(5);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pacientes recientes" });
  }
});

// GET /api/patients/stats - Patient statistics
router.get("/patients/stats", async (_req, res) => {
  try {
    const allPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.isActive, true));

    const allRecords = await db.select().from(medicalRecords);

    res.json({
      totalPatients: allPatients.length,
      totalRecords: allRecords.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadisticas" });
  }
});

// GET /api/patients/:id - Get single patient with record counts
router.get("/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId));

    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Get record count for this patient
    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId));

    const documents = await db
      .select()
      .from(medicalDocuments)
      .where(eq(medicalDocuments.patientId, patientId));

    res.json({
      ...patient,
      recordCount: records.length,
      documentCount: documents.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener paciente" });
  }
});

// POST /api/patients - Create a new patient
router.post("/patients", async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, bloodType, allergies, notes } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "Nombre y apellido son requeridos" });
    }

    const [patient] = await db
      .insert(patients)
      .values({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        phone: phone || null,
        email: email || null,
        bloodType: bloodType || null,
        allergies: allergies || null,
        notes: notes || null,
      })
      .returning();

    res.json(patient);
  } catch (error) {
    console.error("[Patients] Create error:", error);
    res.status(500).json({ error: "Error al crear paciente" });
  }
});

// PUT /api/patients/:id - Update patient
router.put("/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const updates = req.body;

    const [updated] = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, patientId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
});

// DELETE /api/patients/:id - Soft delete (deactivate) patient
router.delete("/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    const [updated] = await db
      .update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, patientId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar paciente" });
  }
});

// GET /api/patients/:id/records - Get all records for a specific patient
router.get("/patients/:id/records", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.createdAt));

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener registros del paciente" });
  }
});

// GET /api/patients/:id/documents - Get all documents for a specific patient
router.get("/patients/:id/documents", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    const docs = await db
      .select()
      .from(medicalDocuments)
      .where(eq(medicalDocuments.patientId, patientId))
      .orderBy(desc(medicalDocuments.createdAt));

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener documentos del paciente" });
  }
});

export default router;
