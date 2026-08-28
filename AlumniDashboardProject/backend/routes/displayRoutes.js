import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/dashboardStats", async (req, res) => {
    try {
        const [alumniResult] = await pool.query(
            "SELECT COUNT(*) as count FROM alumni"
        );

        const totalAlumni = alumniResult[0].count;

        // This query pulls a breakdown of the number of alumni PER each department only. There are separate queries for pulling per specific program -- only pulls the numbers of the alumni who answered 'yes' to the question about graduating this semester (cw_graduationconfirm)
        const [overviewPerDept] = await pool.query(`
       SELECT
    d.department_name AS name,
    COUNT(*) AS numAlum
FROM question q
JOIN response r
    ON q.question_id = r.question_id
JOIN survey_attempt sa
    ON r.survey_attempt_id = sa.survey_attempt_id
JOIN alumni a
    ON sa.alumni_id = a.alumni_id
JOIN alumni_degrees ad
    ON a.alumni_id = ad.alumni_id
JOIN program_of_study p
    ON ad.program_id = p.program_id
JOIN department d
    ON p.department_id = d.department_id
JOIN response r2
    ON r2.survey_attempt_id = sa.survey_attempt_id
JOIN question q2
    ON q2.question_id = r2.question_id
    AND q2.question_code LIKE 'cw_graduationconfirm'
WHERE q.question_code LIKE 'cw_eastmajor'
    AND r2.value_text LIKE 'Yes'
GROUP BY d.department_name
ORDER BY d.department_name;
`);

        const [alumniPerProgram] = await pool.query(`
     SELECT DISTINCT
          d.department_id,
          d.department_name,
          value_text AS name,
          COUNT(*) AS numAlum
      FROM alumni_degrees ad
      JOIN program_of_study p
          ON ad.program_id = p.program_id
      join department d 
      on p.department_id = d.department_id
      join alumni a 
      on ad.alumni_id = a.alumni_id
      join survey_attempt sa 
      on a.alumni_id = sa.alumni_id
      join response r 
      on sa.survey_attempt_id = r.survey_attempt_id
      join question q 
      on r.question_id = q.question_id
      WHERE q.question_code LIKE 'cw_eastmajor'
      GROUP BY d.department_id, name, department_name
      ORDER BY d.department_id, name;
        `);

        /*
        The query below pulls ALL alumni and corresponding programs of study -- can be used if we want legacy data included

            SELECT DISTINCT
                    d.department_id,
                    d.department_name,
                    program_name AS name,
                    COUNT(*) AS numAlum
                FROM alumni_degrees a
                JOIN program_of_study p
                    ON a.program_id = p.program_id
                join department d 
                on p.department_id = d.department_id
                GROUP BY d.department_id, a.program_id, program_name, department_name
                ORDER BY d.department_id, program_name;
        */



        const [careerOutlook] = await pool.query(`
      SELECT
    value_text,
    COUNT(*) AS numAnswers,
    CAST(ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 0) AS FLOAT) AS numAnswers
FROM response r
JOIN question q
    ON r.question_id = q.question_id
WHERE question_code = 'cw_careeroutlook'
GROUP BY value_text
ORDER BY
    CASE value_text
        WHEN 'Sunny' THEN 1
        WHEN 'Partly Sunny' THEN 2
        WHEN 'Fair' THEN 3
        WHEN 'Partly Cloudy' THEN 4
        WHEN 'Stormy' THEN 5
        ELSE 6
    END ASC;`);

        const [postGradData] = await pool.query(`
     SELECT 
    CASE value_text 
        WHEN 'Attend graduate/professional school (grad/professional school)' THEN 'GradSchool'
        WHEN 'Secured private industry employment' THEN 'Employed'
        WHEN 'Secured government employment' THEN 'Employed'
        WHEN 'Search for employment' THEN 'Finding employment'
        ELSE 'Unknown'
    END AS destination_group,
    COUNT(*) AS total_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_of_total
FROM response r
JOIN question q 
    ON r.question_id = q.question_id
WHERE q.question_code LIKE 'cw_postgraduation'
GROUP BY destination_group
ORDER BY total_count DESC;`);

        const [gradSchools] = await pool.query(
            `select distinct value_text, count(*) as numStudentsPerSchool from response r
          join question q 
          on r.question_id = q.question_id 
          where question_code LIKE 'cw_gradprofschool_1'
          group by value_text
          LIMIT 5;`
        );

        const [averageSalaryPerTerm] = await pool.query(
            `
SELECT value_text, COUNT(*) AS numAlum 
FROM question q 
JOIN response r 
    ON q.question_id = r.question_id
WHERE question_code LIKE 'cw_salary'
GROUP BY value_text
ORDER BY 
    CASE value_text
        WHEN 'Under $30,000' THEN 1
        WHEN '$30,000 - $39,999' THEN 2
        WHEN '$40,000 - $49,999' THEN 3
        WHEN '$50,000 - $59,999' THEN 4
        WHEN '$60,000 - $69,999' THEN 5
        WHEN '$70,000 - $79,999' THEN 6
        WHEN '$80,000 - $89,999' THEN 7
        WHEN '$90,000 - $99,999' THEN 8
        WHEN '$100,000+' THEN 9
        ELSE 0 
    END ASC`
        );

        const [primaryClassFormat] = await pool.query(`
      select r.subquestion_text, value_text, ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY r.subquestion_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_classformat'
group by value_text, r.subquestion_text
order by percentage desc`);

        const [top5Employers] = await pool.query(`
  select value_text, count(*) as numAlum from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_employer_1'group by value_text
order by numAlum desc
limit 5`);

        const [employerByCounty] = await pool.query(`
  select value_text, count(*) as numAlum from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_county'group by value_text
order by numAlum desc
limit 5`);


        const [top5InternshipCo] = await pool.query(`
  select value_text, count(*) as numAlum from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_internship_employ_1'group by value_text
order by numAlum desc
limit 5`);

        const [internshipByLocation] = await pool.query(`
  select value_text, count(*) as numAlum from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_internship_employ_2'group by value_text
order by numAlum desc
limit 5`);

        const [programOfStudyApproval] = await pool.query(`
  select value_text, ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY r.subquestion_text
        ),
        2
    ) AS percentage from question q 
join response r 
on q.question_id = r.question_id 
where question_code LIKE 'cw_recommend'
group by value_text, r.subquestion_text
order by percentage desc`);

        const [programOfStudyImprovements] = await pool.query(`
  SELECT
    q.question_text,
    value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'cw_careerready%'
GROUP BY q.question_text, value_text
ORDER BY percentage desc;`);

        const [workExperience] = await pool.query(`
    select q.question_text, 
CASE value_text
	WHEN '1-3 years' THEN '1-3'
    WHEN '4-6 years' THEN '4-6'
    WHEN '7-9 years' THEN '7-9'
    WHEN 'I do not have any work experience related to my field of study' THEN 'None'
 END AS value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_workexperience'
group by value_text, q.question_text
order by percentage desc`);

        const [hoursWorked] = await pool.query(`
   
    select q.question_text, value_text, ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
    from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_hrsworkedinschool'
group by q.question_text, value_text
order by 
CASE value_text
    WHEN 'Under 10 hours per week' THEN 1
    WHEN '10-14 hours per week' THEN 2
    WHEN '15-19 hours per week' THEN 3
    WHEN '20-29 hours per week' THEN 4
    WHEN '30+ hours per week' THEN 5
    WHEN 'Did not work during schooling' THEN 6
    ELSE 0 
end asc

`);

        const [gradDegreePursue] = await pool.query(`
    select q.question_text, value_text, ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_gradprofschool_2'
group by q.question_text, value_text
order by percentage desc`);

        res.json({
            totalAlumni,
            overviewPerDept,
            alumniPerProgram,
            careerOutlook,
            postGradData,
            gradSchools,
            averageSalaryPerTerm,
            primaryClassFormat,
            top5Employers,
            employerByCounty,
            top5InternshipCo,
            internshipByLocation,
            programOfStudyApproval,
            programOfStudyImprovements,
            workExperience,
            hoursWorked,
            gradDegreePursue
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/eastInsights", async (req, res) => {
    try {
        const [effectivefactors] = await pool.query(
            `SELECT
    r.subquestion_text,
    ROUND(SUM(CASE WHEN r.value_text = 'Not effective at all' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS not_at_all_effective_pct,
    ROUND(SUM(CASE WHEN r.value_text = 'Slightly effective'   THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS slightly_effective_pct,
    ROUND(SUM(CASE WHEN r.value_text = 'Moderately effective' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS moderately_effective_pct,
    ROUND(SUM(CASE WHEN r.value_text = 'Very effective'            THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS effective_pct,
    ROUND(SUM(CASE WHEN r.value_text = 'Extremely effective'       THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS very_effective_pct,
    COUNT(*) AS totalAnswers
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'cw_easteffective%'
GROUP BY r.subquestion_text
ORDER BY r.subquestion_text;`
        );

        const [topEffectiveFactors] = await pool.query(`
      WITH rank_counts AS (
    SELECT
        r.subquestion_text,

        SUM(CASE WHEN r.value_text = '1' THEN 1 ELSE 0 END) AS rank1_count,
        SUM(CASE WHEN r.value_text = '2' THEN 1 ELSE 0 END) AS rank2_count,
        SUM(CASE WHEN r.value_text = '3' THEN 1 ELSE 0 END) AS rank3_count,

        COUNT(*) AS total_rankings

    FROM question q
    JOIN response r
        ON q.question_id = r.question_id

    WHERE q.question_code LIKE 'cw_rankeffective_0_%_rank'

    GROUP BY r.subquestion_text
),

rank_percentages AS (
    SELECT
        subquestion_text,

        ROUND(
            rank1_count * 100.0 / total_rankings,
            2
        ) AS rank1_pct,

        ROUND(
            rank2_count * 100.0 / total_rankings,
            2
        ) AS rank2_pct,

        ROUND(
            rank3_count * 100.0 / total_rankings,
            2
        ) AS rank3_pct,

        ROUND(
            (
                rank1_count * 3 +
                rank2_count * 2 +
                rank3_count
            ) / total_rankings,
            2
        ) AS weighted_rank

    FROM rank_counts
),

effective_counts AS (
    SELECT
        r.subquestion_text,
        ROUND(
        COUNT(*) * 100.0 /
        (SELECT COUNT(DISTINCT sa2.survey_attempt_id)
         FROM response r2
         JOIN question q2 ON q2.question_id = r2.question_id
         JOIN survey_attempt sa2 ON sa2.survey_attempt_id = r2.survey_attempt_id
         WHERE q2.question_code LIKE 'cw_rankeffective%'
           AND q2.question_code NOT LIKE 'cw_rankeffective_0_GROUP'),
        2
    ) AS extremely_effective_pct

    FROM question q
    JOIN response r
        ON q.question_id = r.question_id

    WHERE q.question_code LIKE 'cw_easteffective%'
      AND r.value_text = 'Extremely effective'

    GROUP BY r.subquestion_text
)

SELECT
    rp.subquestion_text,

    rp.rank1_pct,
    rp.rank2_pct,
    rp.rank3_pct,

    rp.weighted_rank,

    ec.extremely_effective_pct

FROM rank_percentages rp

JOIN effective_counts ec
    ON ec.subquestion_text = rp.subquestion_text

ORDER BY rp.weighted_rank DESC
LIMIT 3;`);

        const [rankEffective] = await pool.query(`
SELECT
    r.subquestion_text,
    COUNT(*) AS timesChosenInTop3,
    ROUND(
        COUNT(*) * 100.0 /
        (SELECT COUNT(DISTINCT sa2.survey_attempt_id)
         FROM response r2
         JOIN question q2 ON q2.question_id = r2.question_id
         JOIN survey_attempt sa2 ON sa2.survey_attempt_id = r2.survey_attempt_id
         WHERE q2.question_code LIKE 'cw_rankeffective%'
           AND q2.question_code NOT LIKE 'cw_rankeffective_0_GROUP'),
        2
    ) AS pctOfRespondents
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'cw_rankeffective%'
    AND q.question_code NOT LIKE 'cw_rankeffective_0_GROUP'
GROUP BY r.subquestion_text
ORDER BY pctOfRespondents DESC
Limit 3;`);

        const [eastStudentServices] = await pool.query(`
    
 select q.question_text, value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_eastservices%'
group by value_text, q.question_text
order by percentage desc`);

        const [engagedLearning] = await pool.query(`
     select q.question_text, value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_engagedlearning%'
group by value_text, q.question_text
order by percentage desc`);

        const [studentConfidence] = await pool.query(`
    SELECT
    q.subquestion_text,
    ROUND(AVG(CAST(r.value_text AS DECIMAL(10,2))), 2) AS average
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'cw_confidence%'
GROUP BY q.subquestion_text
ORDER BY average DESC;`);

        const [age] = await pool.query(`
             select q.question_text, value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_age'
group by value_text,  q.question_text
order by percentage desc`);

        const [gender] = await pool.query(`
     select q.question_text, value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_gender'
group by value_text,  q.question_text
order by percentage desc`);

        const [veteran] = await pool.query(`
     select q.question_text, value_text,
 ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
from question q 
join response r 
on q.question_id = r.question_id
where question_code LIKE 'cw_vetstatus'
group by value_text,  q.question_text
order by percentage desc
`);


        res.json({
            effectivefactors,
            topEffectiveFactors,
            rankEffective,
            eastStudentServices,
            engagedLearning,
            studentConfidence,
            age,
            gender,
            veteran
        })

    } catch (error) {
        console.error("East INSIGHTS error:", error);
        res.status(500).json({ error: error.message });
    }
})

router.get("/gradPrograms", async (req, res) => {
    try {
        const [gradStudentEffective] = await pool.query(`
    SELECT
          r.subquestion_text,
          ROUND(SUM(CASE WHEN r.value_text = 'Not effective at all' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS not_at_all_effective_pct,
          ROUND(SUM(CASE WHEN r.value_text = 'Slightly effective'   THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS slightly_effective_pct,
          ROUND(SUM(CASE WHEN r.value_text = 'Moderately effective' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS moderately_effective_pct,
          ROUND(SUM(CASE WHEN r.value_text = 'Very effective'            THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS effective_pct,
          ROUND(SUM(CASE WHEN r.value_text = 'Extremely effective'       THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS very_effective_pct,
          COUNT(*) AS totalAnswers
      FROM question q
      JOIN response r
          ON q.question_id = r.question_id
      WHERE q.question_code LIKE 'gradschool_factors%'
      GROUP BY r.subquestion_text
      ORDER BY r.subquestion_text;`);

        const [overallQuality] = await pool.query(`
        select q.question_text, value_text, ROUND(
                    COUNT(*) * 100.0 /
                    SUM(COUNT(*)) OVER (
                        PARTITION BY q.question_text
                    ),
                    2
                ) AS percentage
            from question q 
            join response r 
            on q.question_id = r.question_id 
            where question_code LIKE 'gradschool_quality'
            group by value_text, q.question_text`);

        const [gradSchoolRecommend] = await pool.query(`
                SELECT question_text, value_text, percentage
FROM (
    SELECT
        q2.question_text,
        r2.value_text,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY q2.question_text),
            2
        ) AS percentage
    FROM response r2
    JOIN question q2
        ON q2.question_id = r2.question_id
    WHERE q2.question_code LIKE 'gradschool_recommend'
    GROUP BY q2.question_text, r2.value_text
) sub
WHERE value_text LIKE 'Yes';`);

        const [gradschoolEffective] = await pool.query(`
    SELECT
    q.question_code,
    r.subquestion_text,
    ROUND(SUM(CASE WHEN r.value_text = 'Very effective' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS very_effective_pct,
    ROUND(SUM(CASE WHEN r.value_text = 'Extremely effective' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS extreme_effective_pct
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'gradschool_effective%'
GROUP BY q.question_code, r.subquestion_text
ORDER BY q.question_code, r.subquestion_text;`);



        res.json({
            gradStudentEffective,
            overallQuality,
            gradSchoolRecommend,
            gradschoolEffective
        })
    }
    catch (error) {
        console.error("East INSIGHTS error:", error);
        res.status(500).json({ error: error.message });
    }


})

router.get("/deptSpecific", async (req, res) => {
    try {
        const departmentId = Number(req.query.department_id);

        const [getApproval] = await pool.query(`
            
SELECT DISTINCT
          d.department_id,
          d.department_name,
          value_text AS name,
          ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  d.department_name
        ),
        2
    ) AS percentage
      FROM alumni_degrees ad
      JOIN program_of_study p
          ON ad.program_id = p.program_id
      join department d 
      on p.department_id = d.department_id
      join alumni a 
      on ad.alumni_id = a.alumni_id
      join survey_attempt sa 
      on a.alumni_id = sa.alumni_id
      join response r 
      on sa.survey_attempt_id = r.survey_attempt_id
      join question q 
      on r.question_id = q.question_id
      WHERE q.question_code LIKE 'cw_recommend'
      AND d.department_id = ?
      GROUP BY d.department_id, name, department_name
      ORDER BY percentage desc, d.department_id, name;
        `, [departmentId]);


        const [ECELicensure] = await pool.query(`
            select 
                q.question_text,
                r.value_text,
                COUNT(*) AS numAnswers,
                ROUND(
                    COUNT(*) * 100.0 /
                    SUM(COUNT(*)) OVER (
                        PARTITION BY q.question_text
                    ),
                    2
                ) AS percentage
            FROM question q
            JOIN response r
                ON q.question_id = r.question_id
            WHERE q.question_code LIKE 'ece_licensure_1'
            group by q.question_text, r.value_text
            order by value_text, percentage desc
            ;
`);

        const [MSETools] = await pool.query(`
                select distinct value_text from response r
            join question q
            on r.question_id = q.question_id
            where question_code LIKE 'auto_depteqpt'`);

        const [ECEFactors] = await pool.query(`
                SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'ece_progselection%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text`);

        const [MSEFactors] = await pool.query(`
                SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'mse_progselection%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
    order by percentage desc`);

        const [MEIndustries] = await pool.query(`
        SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'me_industries%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
    ORDER BY percentage desc`);

        const [MELicensure] = await pool.query(`
        SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'me_licensure%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
    order by percentage desc
`);


        const [PSModel] = await pool.query(`
    
SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'ps_salesmodel%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
    ORDER BY percentage`);

        const [PSdeca] = await pool.query(`
        select distinct value_text from response r
join question q
on r.question_id = q.question_id
where question_code LIKE 'ps_competions'`);


        const [SOCCert] = await pool.query(`
    
SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'soc_certification%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text`);

        const [SOCAI] = await pool.query(`
        
SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'soc_ai%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
`);


        const [AUTOIndustry] = await pool.query(
            `
    SELECT 
    q.question_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'auto_industries%'
GROUP BY 
    q.question_text,
    r.value_text`
        );


        const [AUTOCert] = await pool.query(`
            SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY  q.question_text
        ),
        2
    ) AS percentage
FROM question q
JOIN response r
    ON q.question_id = r.question_id
WHERE q.question_code LIKE 'auto_certification%'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text`);

        const [CBScomps] = await pool.query(`
        select distinct value_text from response r
join question q
on r.question_id = q.question_id
where question_code LIKE 'cbs_competitions'`);

        const [CBSConfidence] = await pool.query(`
                SELECT 
    q.question_text,
    r.subquestion_text,
    r.value_text,
    ROUND(
        COUNT(*) * 100.0 /
        SUM(COUNT(*)) OVER (
            PARTITION BY q.question_text
        ),
        2
    ) AS percentage
FROM response r
JOIN question q
    ON q.question_id = r.question_id
JOIN survey_attempt sa
    ON sa.survey_attempt_id = r.survey_attempt_id
JOIN alumni_degrees ad
    ON ad.alumni_id = sa.alumni_id             
JOIN program_of_study p
    ON p.program_id = ad.program_id
JOIN department d
    ON d.department_id = p.department_id
WHERE q.question_code LIKE 'cbs_industskills%'
    AND d.department_name = 'Construction & Building Sciences'
GROUP BY 
    q.question_text,
    r.subquestion_text,
    r.value_text
ORDER BY percentage DESC`);

        const [CBSLicensure] = await pool.query(`
             select 
                q.question_text,
                r.value_text,
                COUNT(*) AS numAnswers,
                ROUND(
                    COUNT(*) * 100.0 /
                    SUM(COUNT(*)) OVER (
                        PARTITION BY q.question_text
                    ),
                    2
                ) AS percentage
            FROM question q
            JOIN response r
                ON q.question_id = r.question_id
            WHERE q.question_code LIKE 'cbs_certlicensure'
            group by q.question_text, r.value_text
            order by value_text, percentage desc
            ;
`);


        res.json({
            getApproval: getApproval,
            ECELicensure: ECELicensure,
            ECEFactors: ECEFactors,
            MSETools: MSETools,
            MSEFactors: MSEFactors,
            MEIndustries: MEIndustries,
            MELicensure: MELicensure,
            PSModel: PSModel,
            PSdeca: PSdeca,
            SOCCert: SOCCert,
            SOCAI: SOCAI,
            AUTOIndustry: AUTOIndustry,
            AUTOCert: AUTOCert,
            CBScomps: CBScomps,
            CBSConfidence: CBSConfidence,
            CBSLicensure: CBSLicensure
        });

    } catch (error) {
        console.error("Error getting department info:", error);
        res.status(500).json({ error: "Failed to get department info" });
    }
});


export default router;