import express from "express";
import pool from "../db/pool.js";
import { findEmployer } from "../services/helpers.js";

const router = express.Router();


/**
 * Looks up a department by name, creating it if it doesn't exist yet.
 * Used so admins can type a department name freely in the edit form
 * without needing to know its internal ID.
 */
async function findOrCreateDepartment(connection, departmentName) {
    if (!departmentName?.trim()) return null;

    const name = departmentName.trim();

    const [rows] = await connection.query(
        `SELECT department_id FROM department WHERE department_name = ?`,
        [name]
    );

    if (rows.length) return rows[0].department_id;

    const [result] = await connection.query(
        `INSERT INTO department (department_name) VALUES (?)`,
        [name]
    );

    return result.insertId;
}

/**
 * Same idea as findOrCreateDepartment, but for program_of_study.
 * Creates the department first if needed, then the program.
 */
async function findOrCreateProgram(connection, programName, departmentName) {
    if (!programName?.trim()) return null;

    const name = programName.trim();

    const [rows] = await connection.query(
        `SELECT program_id FROM program_of_study WHERE program_name = ?`,
        [name]
    );

    if (rows.length) return rows[0].program_id;

    const departmentId = await findOrCreateDepartment(connection, departmentName);

    const [result] = await connection.query(
        `INSERT INTO program_of_study (program_name, department_id) VALUES (?, ?)`,
        [name, departmentId]
    );

    return result.insertId;
}

/**
 * Handles inserting/updating/deleting an alumni's degrees, employment,
 * and internship records, given the full arrays from the edit form.
 * Items with an existing *_id are updated; items without one are new
 * and get inserted. Shared by both the create and update routes below.
 *
 * NOTE: your employment/internship tables also have a survey_attempt_id
 * column (used when this data comes from a CSV import). Manually-added
 * records from this admin form aren't tied to a survey attempt, so this
 * assumes that column is nullable. If it's NOT NULL in your live schema,
 * you'll need to relax that constraint for manual entries to save.
 */
async function saveAlumniSubRecords(connection, alumniId, payload) {
    const {
        degrees = [],
        employment = [],
        internships = [],
        deletedDegreeIds = [],
        deletedEmploymentIds = [],
        deletedInternshipIds = [],
    } = payload;

    for (const degreeId of deletedDegreeIds) {
        await connection.query(
            `DELETE FROM alumni_degrees WHERE alumni_degree_id = ? AND alumni_id = ?`,
            [degreeId, alumniId]
        );
    }

    for (const employmentId of deletedEmploymentIds) {
        await connection.query(
            `DELETE FROM employment WHERE employment_id = ? AND alumni_id = ?`,
            [employmentId, alumniId]
        );
    }

    for (const internshipId of deletedInternshipIds) {
        await connection.query(
            `DELETE FROM internship WHERE internship_id = ? AND alumni_id = ?`,
            [internshipId, alumniId]
        );
    }

    for (const degree of degrees) {
        const programId = await findOrCreateProgram(
            connection,
            degree.program_name,
            degree.department_name
        );

        if (degree.alumni_degree_id) {
            await connection.query(
                `UPDATE alumni_degrees
                 SET degree_type = ?, program_id = ?, survey_term = ?, survey_year = ?, minor = ?, gpa = ?
                 WHERE alumni_degree_id = ? AND alumni_id = ?`,
                [
                    degree.degree_type || null,
                    programId,
                    degree.survey_term || null,
                    degree.survey_year || null,
                    degree.minor || null,
                    degree.gpa || null,
                    degree.alumni_degree_id,
                    alumniId,
                ]
            );
        } else {
            await connection.query(
                `INSERT INTO alumni_degrees (alumni_id, degree_type, program_id, survey_term, survey_year, minor, gpa)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    alumniId,
                    degree.degree_type || null,
                    programId,
                    degree.survey_term || null,
                    degree.survey_year || null,
                    degree.minor || null,
                    degree.gpa || null,
                ]
            );
        }
    }

    for (const job of employment) {
        const { employerId, altEmployerName } = await findEmployer(connection, job.employer_name);

        if (job.employment_id) {
            await connection.query(
                `UPDATE employment
                 SET employer_id = ?, alt_employer_name = ?, job_position = ?, salary = ?,
                     city = ?, state = ?, country = ?, yrs_exp = ?, is_current = ?
                 WHERE employment_id = ? AND alumni_id = ?`,
                [
                    employerId,
                    altEmployerName,
                    job.job_position || null,
                    job.salary || null,
                    job.city || null,
                    job.state || null,
                    job.country || null,
                    job.yrs_exp || null,
                    job.is_current ? 1 : 0,
                    job.employment_id,
                    alumniId,
                ]
            );
        } else {
            await connection.query(
                `INSERT INTO employment
                 (alumni_id, employer_id, alt_employer_name, job_position, salary_STRING, city, state, country, yrs_exp, is_current)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    alumniId,
                    employerId,
                    altEmployerName,
                    job.job_position || null,
                    job.salary || null,
                    job.city || null,
                    job.state || null,
                    job.country || null,
                    job.yrs_exp || null,
                    job.is_current ? 1 : 0,
                ]
            );
        }
    }

    for (const internship of internships) {
        if (internship.internship_id) {
            await connection.query(
                `UPDATE internship
                 SET intern_business = ?, intern_city = ?, for_credit = ?, not_for_credit = ?, n_a = ?, start_date = ?, end_date = ?
                 WHERE internship_id = ? AND alumni_id = ?`,
                [
                    internship.intern_business || null,
                    internship.intern_city || null,
                    internship.for_credit ? 1 : 0,
                    internship.not_for_credit ? 1 : 0,
                    internship.n_a ? 1 : 0,
                    internship.start_date || null,
                    internship.end_date || null,
                    internship.internship_id,
                    alumniId,
                ]
            );
        } else {
            await connection.query(
                `INSERT INTO internship
                 (alumni_id, intern_business, intern_city, for_credit, not_for_credit, n_a, start_date, end_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    alumniId,
                    internship.intern_business || null,
                    internship.intern_city || null,
                    internship.for_credit ? 1 : 0,
                    internship.not_for_credit ? 1 : 0,
                    internship.n_a ? 1 : 0,
                    internship.start_date || null,
                    internship.end_date || null,
                ]
            );
        }
    }
}

/**
 * Update an existing alumni's demographic info and all sub-records in
 * one call. Everything happens in a single transaction -- if anything
 * fails, nothing is saved, keeping the record consistent.
 */
router.put("/:id", async (req, res) => {
    const alumniId = req.params.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { first_name, last_name, email, phone, wildcat_id, graduation_date } = req.body;

        if (!email?.trim()) {
            throw new Error("Email is required.");
        }

        const [result] = await connection.query(
            `UPDATE alumni
             SET first_name = ?, last_name = ?, email = ?, phone = ?, wildcat_id = ?, graduation_date = ?
             WHERE alumni_id = ?`,
            [
                first_name || null,
                last_name || null,
                email.trim(),
                phone || null,
                wildcat_id || null,
                graduation_date || null,
                alumniId,
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error("Alumni not found.");
        }

        await saveAlumniSubRecords(connection, alumniId, req.body);

        await connection.commit();

        res.json({ success: true, alumni_id: Number(alumniId) });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating alumni record:", error);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

/**
 * Create a brand new alumni record, plus any degrees/employment/
 * internships submitted alongside it.
 */
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { first_name, last_name, email, phone, wildcat_id, graduation_date } = req.body;

        if (!email?.trim()) {
            throw new Error("Email is required to create a new alumni record.");
        }

        const [result] = await connection.query(
            `INSERT INTO alumni (first_name, last_name, email, phone, wildcat_id, graduation_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                first_name || null,
                last_name || null,
                email.trim(),
                phone || null,
                wildcat_id || null,
                graduation_date || null,
            ]
        );

        const alumniId = result.insertId;

        await saveAlumniSubRecords(connection, alumniId, req.body);

        await connection.commit();

        res.json({ success: true, alumni_id: alumniId });
    } catch (error) {
        await connection.rollback();
        console.error("Error creating alumni record:", error);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});



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

        if (!alumniRows?.length) {
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