import express from "express";
import multer from "multer";
import fs from "fs";
import { importEmploymentCSV, importRESPONSECsvFile, importOriginalAlumniList } from "../services/mainImportService.js";

const router = express.Router();

// route to handle Response CSV uploads
const uploadResponses = multer({ dest: "response-uploads/" });

router.post("/upload-responses", uploadResponses.single("file"), async (req, res) => {
    try {
        const surveyVersionId = Number(req.body.surveyVersionId);

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

router.post("/admin/upload-legacy-responses", uploadResponses.single("file"), async (req, res) => {
    try {
        const surveyVersionId = Number(req.body.surveyVersionId);

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
            true
        );

        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        console.error("Error importing RESPONSE CSV file:", error);
        res.status(500).json({ error: error.message });
    }
});

// // route to handle CSV Question uploads
// const uploadQuestions = multer({ dest: "question-uploads/" });

// router.post("/admin/upload-questions", uploadQuestions.single("file"), async (req, res) => {
//     try {
//         const surveyVersionId = Number(req.body.surveyVersionId);

//         console.log("SurveyVersion ID: ", surveyVersionId);

//         if (!surveyVersionId) {
//             return res.status(400).json({ error: "surveyVersionId is required" });
//         }

//         if (!req.file) {
//             return res.status(400).json({ error: "CSV file is required" });
//         }

//         const result = await importQUESTIONCsvFile(
//             req.file.path,
//             surveyVersionId,
//         );

//         fs.unlinkSync(req.file.path);

//         res.json(result);
//     } catch (error) {
//         console.error("Error importing QUESTION CSV file:", error);
//         res.status(500).json({ error: error.message });
//     }
// });

const uploadEmployment = multer({ dest: "employment-uploads/" });

router.post("/admin/employment-upload", uploadEmployment.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "EMPLOYMENT CSV file is required" });
        }

        const result = await importEmploymentCSV(
            req.file.path,
            req.file.filename
        );

        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        console.error("Error importing EMPLOYMENT CSV file:", error);
        res.status(500).json({ error: error.message });
    }

});

const uploadList = multer({ dest: "list-uploads/" });

router.post("/admin/list-upload", uploadList.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "LIST CSV file is required" });
        }

        const result = await importOriginalAlumniList(
            req.file.path,
            req.file.filename
        );

        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        console.error("Error importing LIST CSV file:", error);
        res.status(500).json({ error: error.message });
    }

});
export default router;