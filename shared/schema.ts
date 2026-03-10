import { pgTable, serial, text, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Patients
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"), // YYYY-MM-DD
  gender: text("gender"), // masculino | femenino | otro
  phone: text("phone"),
  email: text("email"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medical documents (scanned images/PDFs)
export const medicalDocuments = pgTable("medical_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  originalFilename: text("original_filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count").default(1),
  status: text("status").notNull().default("uploaded"), // uploaded | processing | completed | failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Extracted medical records
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => medicalDocuments.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id),
  rawText: text("raw_text"),
  documentType: text("document_type"), // receta, laboratorio, radiografia, consulta, hospitalizacion, otro
  documentDate: text("document_date"),
  provider: text("provider"),
  diagnoses: jsonb("diagnoses").$type<Array<{ code: string; description: string }>>(),
  medications: jsonb("medications").$type<Array<{ name: string; dose: string; frequency: string; duration: string; route: string }>>(),
  labResults: jsonb("lab_results").$type<Array<{ test: string; value: string; unit: string; referenceRange: string; flag: string }>>(),
  vitalSigns: jsonb("vital_signs").$type<Array<{ type: string; value: string; unit: string }>>(),
  procedures: jsonb("procedures").$type<Array<{ name: string; date: string; notes: string }>>(),
  notes: text("notes"),
  summary: text("summary"),
  rawAiResponse: jsonb("raw_ai_response"),
  aiModel: text("ai_model"),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Doctor settings
export const doctorSettings = pgTable("doctor_settings", {
  id: serial("id").primaryKey(),
  doctorName: text("doctor_name"),
  specialty: text("specialty"),
  licenseNumber: text("license_number"), // cedula profesional
  clinicName: text("clinic_name"),
  preferredAiModel: text("preferred_ai_model").default("claude"), // claude | gpt4o
  extractionLanguage: text("extraction_language").default("es"), // es | en
  defaultExportFormat: text("default_export_format").default("json"), // json | pdf
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastVisit: true,
});

export const selectPatientSchema = createSelectSchema(patients);

export const insertDocumentSchema = createInsertSchema(medicalDocuments).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const selectDocumentSchema = createSelectSchema(medicalDocuments);

export const insertRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
});

export const selectRecordSchema = createSelectSchema(medicalRecords);

export const insertSettingsSchema = createInsertSchema(doctorSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectSettingsSchema = createSelectSchema(doctorSettings);

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;
export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = typeof medicalDocuments.$inferInsert;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = typeof medicalRecords.$inferInsert;
export type DoctorSettings = typeof doctorSettings.$inferSelect;
export type InsertDoctorSettings = typeof doctorSettings.$inferInsert;

// AI extraction result schema
export const extractionResultSchema = z.object({
  documentType: z.string().nullable(),
  documentDate: z.string().nullable(),
  provider: z.string().nullable(),
  diagnoses: z.array(z.object({ code: z.string(), description: z.string() })).default([]),
  medications: z.array(z.object({ name: z.string(), dose: z.string(), frequency: z.string(), duration: z.string(), route: z.string() })).default([]),
  labResults: z.array(z.object({ test: z.string(), value: z.string(), unit: z.string(), referenceRange: z.string(), flag: z.string() })).default([]),
  vitalSigns: z.array(z.object({ type: z.string(), value: z.string(), unit: z.string() })).default([]),
  procedures: z.array(z.object({ name: z.string(), date: z.string(), notes: z.string() })).default([]),
  notes: z.string().nullable(),
  summary: z.string().nullable(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
