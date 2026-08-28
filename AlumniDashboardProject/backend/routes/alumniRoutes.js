import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `
               SELECT DISTINCT
    ranked.*,
    ranked.salary_STRING AS salary
FROM (
    SELECT
        a.*,

        ad.degree_type,
        ad.survey_time_raw,
        ad.raw_degree_code,

        p.department_id,
        p.program_name,
        d.department_name,

        er.employer_name,
        e.alt_employer_name,
        e.salary_STRING,

        ROW_NUMBER() OVER (
            PARTITION BY a.alumni_id
            ORDER BY
                CASE ad.degree_type
                    WHEN 'MS' THEN 4
                    WHEN 'MSCE' THEN 4
                    WHEN 'MSSE' THEN 4
                    WHEN 'BS' THEN 3
                    WHEN 'AAS' THEN 2
                    WHEN 'APE' THEN 2
                    WHEN 'CP' THEN 1
                    ELSE 0
                END DESC,

                ad.survey_time_raw DESC
        ) AS rn

    FROM alumni a

    -- Degree / major
    LEFT JOIN alumni_degrees ad
        ON ad.alumni_id = a.alumni_id

    LEFT JOIN program_of_study p
        ON ad.program_id = p.program_id

    LEFT JOIN department d
        ON p.department_id = d.department_id

    -- Employment, if they have one
    LEFT JOIN employment e
        ON a.alumni_id = e.alumni_id

    LEFT JOIN employer er
        ON e.employer_id = er.employer_id

) ranked

WHERE ranked.rn = 1

ORDER BY ranked.last_name, ranked.first_name;`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const alumniId = req.params.id;

        const [alumniRows] = await pool.query(
            `SELECT
                a.*,
                YEAR(CURDATE()) -
                MIN(
                    COALESCE(
                        CAST(ad.survey_year AS UNSIGNED),
                        YEAR(STR_TO_DATE(a.graduation_date, '%m/%d/%Y'))
                    )
                ) AS alumni_duration
            FROM alumni a
            LEFT JOIN alumni_degrees ad
                ON a.alumni_id = ad.alumni_id
            WHERE a.alumni_id = ?
            GROUP BY a.alumni_id;`,
            [alumniId]
        );

        if (!alumniRows.length) {
            return res.status(404).json({ error: "Alumni not found" });
        }

        const [surveyAttempts] = await pool.query(
            `SELECT sa.*, sv.version_name
       FROM survey_attempt sa
       JOIN survey_version sv ON sa.survey_version_id = sv.survey_version_id
       WHERE sa.alumni_id = ?
       ORDER BY sa.survey_attempt_id `,
            [alumniId]
        );

        const [surveyQuestionAnswers] = await pool.query(`
            SELECT sa.*, r.value_text, q.question_code, q.question_text, q.question_id, sv.version_name
       FROM survey_attempt sa
       JOIN survey_version sv ON sa.survey_version_id = sv.survey_version_id
       join response r 
       on sa.survey_attempt_id = r.survey_attempt_id
       join question q
       on r.question_id = q.question_id
       WHERE sa.alumni_id = ?
       AND q.question_code IN ('plans', 'plans_13_text', 'meaningful', 'two_things', 'two_challenges', 'cw_startbachelors', 'cw_rankeffective', 'cw_easteffective', 'soc_selfpreparedness', 'ps_competions', 'ps_salesmodel', 'me_industries', 'mse_depteqpt', 'eece_progselection', 'cbs_competitions', 'cbs_industskills', 'auto_servicetools', 'auto_industries', 'auto_industries_6_text')
       ORDER BY survey_version_id, sa.survey_attempt_id, q.question_id
       AND
                    CASE r.value_text
                    WHEN 'Extremely effective (1)' THEN 1
                    WHEN 'Somewhat effective (2)' THEN 2
                    WHEN 'Moderately effective (3)' THEN 3
                    WHEN 'Slightly effective (4)' THEN 4
                      WHEN 'Not at all effective (5)' THEN 5
                      WHEN 'Not Applicable (6)' THEN 6
                    ELSE 0
                END ASC
       `,
            [alumniId]
        );

        const [degreeRows] = await pool.query(
            `SELECT
        ad.*,
        p.program_name,
        d.department_name
     FROM alumni_degrees ad

     LEFT JOIN program_of_study p
        ON ad.program_id = p.program_id

     LEFT JOIN department d
        ON p.department_id = d.department_id

     WHERE ad.alumni_id = ?

     ORDER BY ad.survey_time_raw DESC`,
            [alumniId]
        );

        const [currentDegree] = await pool.query(
            `SELECT 
            a.alumni_id,

            COALESCE( NULLIF(CONCAT(ad.survey_term, ' ', ad.survey_year), ' '), a.graduation_date ) AS graduation_term,

            p.program_name,
            d.department_name

           

            FROM alumni a

            JOIN alumni_degrees ad
                ON ad.alumni_id = a.alumni_id

            LEFT JOIN program_of_study p
                ON ad.program_id = p.program_id

            LEFT JOIN department d
                ON p.department_id = d.department_id

            WHERE a.alumni_id = ?

                    ORDER BY
                CAST(ad.survey_year AS UNSIGNED) DESC,
                    CASE ad.survey_term
                    WHEN 'Spring' THEN 1
                    WHEN 'Summer' THEN 2
                    WHEN 'Fall' THEN 3
                    ELSE 0
                END DESC

            LIMIT 1;`, [alumniId]);

        const [internshipRows] = await pool.query(
            `SELECT *
            FROM internship
            WHERE alumni_id = ?`,
            [alumniId]
        );

        const [employmentRows] = await pool.query(
            `SELECT e.*, er.employer_name 
            FROM employment e
            left join employer er
            on e.employer_id = er.employer_id
            WHERE alumni_id = ?`,
            [alumniId]
        );

        const [employmentQuestions] = await pool.query(
            `SELECT *
            FROM employment_questions
            WHERE alumni_id = ?`,
            [alumniId]
        );

        const [employerRepresent] = await pool.query(
            `select value_text
                from question q 
                join response r 
                on q.question_id = r.question_id
                join survey_attempt sa 
                on r.survey_attempt_id = sa.survey_attempt_id
                join alumni a 
                on sa.alumni_id = a.alumni_id
                where question_code LIKE 'cw_representemployer'
                and a.alumni_id = ?
                `, [alumniId]
        )

        res.json({
            alumni: alumniRows[0],
            attempts: surveyAttempts,
            surveyQuestionAnswers: surveyQuestionAnswers,
            degrees: degreeRows,
            currentDegree: currentDegree[0] || null,
            internships: internshipRows,
            employment: employmentRows,
            employmentQuestions: employmentQuestions,
            employerRepresent: employerRepresent
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id/alumniProfile", async (req, res) => {
    try {
        const alumniId = req.params.id;

        const [alumniDetails] = await pool.query(
            ` SELECT
    a.alumni_id,
        a.first_name,
        a.last_name,

        ad.degree_type,
        ad.survey_term,
        ad.survey_year,
        ad.survey_time_raw,

        CONCAT(ad.survey_term, ' ', ad.survey_year) AS graduation_term,

        p.program_name,
        d.department_name

FROM alumni a

JOIN alumni_degrees ad
    ON ad.alumni_id = a.alumni_id

LEFT JOIN program_of_study p
    ON ad.program_id = p.program_id

LEFT JOIN department d
    ON p.department_id = d.department_id

WHERE a.alumni_id = ?

        ORDER BY
    CAST(ad.survey_year AS UNSIGNED) DESC,
        CASE ad.survey_term
        WHEN 'Spring' THEN 1
        WHEN 'Summer' THEN 2
        WHEN 'Fall' THEN 3
        ELSE 0
    END DESC

LIMIT 1;`, [alumniId]
        );

        res.json(alumniDetails[0] || null);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.get("/get", async (req, res) => {
    const survey_attempt_id = req.params.id;
    try {
        const [alumni] = await Connection.query(`
        SELECT * FROM alumni a
        join survey_attempt sa
        on a.alumni_id = sa.alumni_id
        where
        sa.survey_attempt_id = ?`,
            [survey_attempt_id]);

        res.json(alumni || null);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default router;