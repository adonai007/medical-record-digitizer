import { Router } from "express";
import { db } from "../db.js";
import { doctorSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/settings - Get doctor settings (creates default if none exist)
router.get("/settings", async (_req, res) => {
  try {
    const all = await db.select().from(doctorSettings);

    if (all.length === 0) {
      // Create default settings
      const [settings] = await db
        .insert(doctorSettings)
        .values({})
        .returning();
      return res.json(settings);
    }

    res.json(all[0]);
  } catch (error) {
    console.error("[Settings] Get error:", error);
    res.status(500).json({ error: "Error al obtener configuracion" });
  }
});

// PUT /api/settings - Update doctor settings
router.put("/settings", async (req, res) => {
  try {
    const updates = req.body;
    const all = await db.select().from(doctorSettings);

    let result;
    if (all.length === 0) {
      [result] = await db
        .insert(doctorSettings)
        .values({ ...updates })
        .returning();
    } else {
      [result] = await db
        .update(doctorSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(doctorSettings.id, all[0].id))
        .returning();
    }

    res.json(result);
  } catch (error) {
    console.error("[Settings] Update error:", error);
    res.status(500).json({ error: "Error al guardar configuracion" });
  }
});

export default router;
