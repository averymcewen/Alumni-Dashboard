import express from "express";
import multer from "multer";
import fs from "fs";
import { importEmploymentCSV, importRESPONSECsvFile, importOriginalAlumniList } from "../services/mainImportService.js";

const router = express.Router();

// route to handle Response CSV uploads
const uploadResponses = multer({ dest: "response-uploads/" });

router.post("/upload-responses", uploadResponses.single("file"), async (req, res) => {
    try {
        const surveyVersionId = Number(req.body.survey_version_id);

        if (!surveyVersionId) {
            return res.status(400).json({ error: "surveyVersionId is required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "CSV file is required" });
        }

        const result = await importRESPONSECsvFile(
            req.file.path,
            surveyVersionId,
            req.file.originalname,
            false
        );

        console.log(result);

        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        console.error("Error importing RESPONSE CSV file:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;