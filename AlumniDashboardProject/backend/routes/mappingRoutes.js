import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/pending", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM pending_mapping_review ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            survey_version_id,
            raw_column_name,
            normalized_column_name,
            field_role,
            question_code,
            option_code,
            target_table,
            target_column,
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO import_column_mapping
      (survey_version_id, raw_column_name, normalized_column_name, field_role, question_code, option_code, target_table, target_column)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                survey_version_id,
                raw_column_name,
                normalized_column_name,
                field_role,
                question_code || null,
                option_code || null,
                target_table || null,
                target_column || null,
            ]
        );

        res.status(201).json({ mappingId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;