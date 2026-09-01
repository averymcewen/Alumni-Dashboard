import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

// Get all survey versions with their associated survey names
router.get("/versions", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT sv.survey_version_id AS surveyVersionId, sv.version_name, sv.term_label , s.survey_name
       FROM survey_version sv
       JOIN survey s ON sv.survey_id = s.survey_id
       ORDER BY sv.created_at DESC`
        );

        const [dbCheck] = await pool.query("SELECT DATABASE() AS db");
        console.log("Connected database:", dbCheck[0].db);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit survey version information

router.post("/submit-survey-version", async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { surveyName, version, surveyDate } = req.body;

        // make sure all fields are filled out
        if (!surveyName || !version || !surveyDate) {
            return res.status(400).json({ error: "All fields are required." });
        }

        let surveyId;

        await connection.beginTransaction();

        // Check if the survey already exists
        const [surveyRows] = await pool.query(
            `SELECT survey_id FROM survey WHERE survey_name = ?`,
            [surveyName]
        );

        if (surveyRows?.length > 0) {
            surveyId = surveyRows[0].survey_id;

            // check if that version and name already exist 
            const [surveyAlreadyExists] = await pool.query(
                `SELECT s.survey_id, version_name FROM survey s
            JOIN survey_version sv 
            on s.survey_id = sv.survey_id
            WHERE survey_name = ?
            AND version_name = ?`,
                [surveyName, version]
            );

            if (surveyAlreadyExists?.length > 0) {
                return res.status(500).json({ error: "Survey Already Exists." });
            }


        } else {
            const [surveyResult] = await connection.query(
                `INSERT INTO survey (survey_name) VALUES (?)`,
                [surveyName]
            );

            surveyId = surveyResult.insertId;
        }

        // Insert survey version
        const [versionResult] = await connection.query(
            `INSERT INTO survey_version (survey_id, version_name, term_label) VALUES (?, ?, ?)`,
            [surveyId, version, surveyDate]
        );

        const [dbCheck] = await pool.query("SELECT DATABASE() AS db");
        console.log("Connected database:", dbCheck[0].db);

        await connection.commit();

        res.status(201).json({
            message: "Survey version submitted successfully.",
            survey_version_id: versionResult.insertId
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});


router.get("/attempt/:attemptId/responses", async (req, res) => {
    try {
        const attemptId = req.params.attemptId;

        const [rows] = await pool.query(
            `SELECT
                r.response_id,
                q.question_code,
                q.question_text,
                q.question_type,
                r.value_text,
                r.option_code,
                r.option_text,
                r.raw_value
             FROM response r
             JOIN question q ON r.question_id = q.question_id
             WHERE r.survey_attempt_id = ?
             ORDER BY q.display_order, r.response_id`,
            [attemptId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get("/surveyManager/getSurveys", async (req, res) => {
    try {
        const [surveys] = await pool.query(`
        SELECT
    survey_id,
    survey_name,
    version_name,
    t1.survey_version_id,
    COUNT(*) AS responseCount,
    ROUND(completion_rate, 2) AS completion_rate
FROM
(
    SELECT
        s.survey_id,
        s.survey_name,
        sv.version_name,
        sa.survey_version_id
    FROM survey_attempt sa
    JOIN survey_version sv
        ON sa.survey_version_id = sv.survey_version_id
    JOIN survey s
        ON sv.survey_id = s.survey_id
) t1
LEFT JOIN
(
    SELECT
        m.survey_version_id,
        AVG(CAST(jt.field_value AS DECIMAL(5,2))) AS completion_rate
    FROM metadata m
    CROSS JOIN JSON_TABLE(
        m.metadata,
        '$[*]'
        COLUMNS (
            field_name VARCHAR(100) PATH '$.field_name',
            field_value VARCHAR(100) PATH '$.field_value'
        )
    ) AS jt
    WHERE jt.field_name = 'progress'
    GROUP BY m.survey_version_id
) t2
    ON t1.survey_version_id = t2.survey_version_id
GROUP BY
    survey_id,
    survey_name,
    version_name,
    t1.survey_version_id,
    completion_rate;
                

        `);

        res.json(surveys);

    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/surveyManager/getQuestions/:survey_version_id", async (req, res) => {
    try {
        const surveyId = req.params.survey_version_id;

        const [questions] = await pool.query(`
            SELECT
            q.survey_version_id,
            q.question_id,
            q.question_code,
            q.question_text,
            q.question_category,
            q.subquestion_text,
            COUNT(DISTINCT r.survey_attempt_id) AS respondents
        FROM question q
        LEFT JOIN response r
            ON q.question_id = r.question_id
        WHERE q.survey_version_id = ?
        GROUP BY
            q.survey_version_id,
            q.question_id,
            q.question_code,
            q.question_text,
            q.question_category,
            q.subquestion_text
        ORDER BY
        respondents,
            q.survey_version_id`,
            [surveyId]);

        res.json(questions)

    }
    catch (error) {

    }
})


router.get("/surveyManager/getSurveyResponses/:surveyVersionId", async (req, res) => {
    try {
        const { surveyVersionId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                sa.survey_attempt_id,
                a.alumni_id,
                a.first_name,
                a.last_name,
                a.temp_name,
                q.question_id,
                q.question_text,
                COALESCE(
                    r.option_text,
                    r.value_text
                ) AS answer

            FROM survey_attempt sa

            JOIN alumni a
                ON sa.alumni_id = a.alumni_id

            LEFT JOIN response r
                ON sa.survey_attempt_id = r.survey_attempt_id

            LEFT JOIN question q
                ON r.question_id = q.question_id

            WHERE sa.survey_version_id = ?

            ORDER BY
                sa.survey_attempt_id;`, [surveyVersionId]);

        const attempts = {};

        rows.forEach(row => {
            if (!attempts[row.survey_attempt_id]) {
                attempts[row.survey_attempt_id] = {
                    survey_attempt_id: row.survey_attempt_id,
                    alumni_id: row.alumni_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    responses: {}
                };
            }

            attempts[row.survey_attempt_id].responses[row.question_text] = row.answer;
        });

        res.json(Object.values(attempts));

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});


router.get("/surveyManager/getQuestionEdit/:surveyVersionId/:questionId", async (req, res) => {
    const { surveyVersionId, questionId } = req.params;

    const [question] = await pool.query(
        `
        SELECT
            question_id,
            question_text,
            question_code,
            subquestion_text,
            s.survey_version_id
        FROM question q
        JOIN survey_version s
            ON q.survey_version_id = s.survey_version_id
        WHERE question_id = ?
          AND s.survey_version_id = ?
        `,
        [questionId, surveyVersionId]
    );

    const [survey] = await pool.query(
        `SELECT 
            survey_id,
            survey_version_id,
            version_name
        FROM survey_version
        WHERE survey_version_id = ?`,
        [surveyVersionId]
    );

    res.json({
        question: question[0],
        survey: survey[0],
    });
});


router.post("/surveyManager/submitQuestionChanges/:id", async (req, res) => {
    try {
        const questionId = req.params.id;
        const { questionText } = req.body;

        const [existingQuestion] = await pool.query(
            `select question_text from question
            where question_id = ? `,
            [questionId]
        );


        const updatedQuestion = await pool.query(`
        UPDATE question
        SET question_text = ?
        where question_id = ?`,
            [questionText, questionId]);

        console.log("Updated question: " + updatedQuestion);

        res.json({
            message: "Updated successfully",
            oldText: existingQuestion[0].question_text,
            newText: questionText
        });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
})

export default router;