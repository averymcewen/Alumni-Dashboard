import fs from "fs";
import csv from "csv-parser";
import pool from "../db/pool.js";
import normalizeString from "../utils/normalizeHeader.js";
import { normalizeSalary } from "./Maps for Normalizing/salaryNormalizer.js";
import { detectMapping } from "./csvParsers.js";
import { ensureQuestionExists } from "./csvImportHelpers.js";
import { getProgramOfStudy, normalizeDepartment, normalizeInconsistentDepartment, parseSurveyTime } from "./Maps for Normalizing/normalizers.js";
import { normalizeCompanyName } from "./Maps for Normalizing/employerNameNormalizer.js";
import { findEmployer } from "./helpers.js";
import { parse } from "path";
import e from "express";






/**
 * Find existing alumni by email or create a new one.
 * Returns null if email is missing.
 *
 * NOTE: surveyVersionId is required now — it's needed to ensure the
 * question-table row exists for any dual-role mapping (mapping.also_question).
 * Every call site of findOrCreateAlumni needs to pass it through.
 */
export async function findOrCreateAlumni(connection, row, mappings, surveyVersionId) {
    let email = null;
    let alt_email = null;
    let firstName = null;
    let lastName = null;
    let wildcatId = null;
    let temp_name = null;
    let raw_degree_code = null;
    let survey_time = null;
    let degree_code = null;

    try {
        for (const [column, value] of Object.entries(row)) {
            const normalizedColumn = normalizeString(column);
            const mapping = mappings[normalizedColumn];

            if (!mapping) continue;

            // We have to pull surveytime separately here, to use later on in the insertAlumniDegrees. It is NOT stored in the alumni table
            if (mapping.target_column === "survey_time") survey_time = value?.trim() || null;
            if (mapping.target_column === "degree_type") degree_code = value?.trim() || null;

            if (mapping.field_role !== "alumni_field") continue;

            if (mapping.also_question) {
                await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.also_question.question_code,
                    mapping.also_question.question_type,
                    mapping.also_question.question_text,
                    mapping.also_question.subquestion_text
                );
            }

            if (mapping.target_column === "email") email = value?.trim() || null;
            if (mapping.target_column === "alt_email") alt_email = value?.trim() || null;
            if (mapping.target_column === "first_name") firstName = value?.trim() || null;
            if (mapping.target_column === "last_name") lastName = value?.trim() || null;
            if (mapping.target_column === "wildcat_id") wildcatId = value?.trim() || null;
            if (mapping.target_column === "program_of_study") raw_degree_code = value?.trim() || null;

        }


        // Then try email
        if (email) {
            const [existingByEmail] = await connection.query(
                `SELECT alumni_id FROM alumni WHERE email = ?`,
                [email]
            );

            if (existingByEmail.length) {
                const alumniId = existingByEmail[0].alumni_id;

                await connection.query(
                    `UPDATE alumni
                 SET wildcat_id = COALESCE(?, wildcat_id),
                     first_name = COALESCE(?, first_name),
                     last_name = COALESCE(?, last_name),
                     alt_email = COALESCE(?, alt_email)
                 WHERE alumni_id = ?`,
                    [wildcatId, firstName, lastName, alt_email, alumniId]
                );

                return {
                    alumniId,
                    raw_degree_code,
                    survey_time,
                    degree_code
                };
            }
        }

        if (!email && !wildcatId) {
            console.warn("Skipping row because neither email nor wildcat_id exists:", row);
            return null;
        }

        // creates a temp name from email if no first and last were provided
        if (!firstName && !lastName) {
            temp_name = temp_name = email.match(/^[^@]*/)[0];
            temp_name = temp_name[0].toUpperCase() + temp_name.slice(1);
        }

        const [result] = await connection.query(
            `INSERT INTO alumni (email, alt_email, first_name, last_name, wildcat_id, temp_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [email, alt_email, firstName, lastName, wildcatId, temp_name]
        );

        return {
            alumniId: result.insertId,
            raw_degree_code,
            survey_time,
            degree_code
        };
    }
    catch (error) {
        // TODO: put this back to a silent swallow once dual-role questions are
        // confirmed working end-to-end. An empty catch here is exactly why the
        // surveyVersionId / ensureQuestionExists issues went unnoticed —
        // findOrCreateAlumni was silently returning undefined for every row
        // that hit the also_question branch.
        console.error("findOrCreateAlumni failed:", error);
        // await connection.rollback();
    }
}


/* Create Alumni for the Original Alumni List */

export async function findOrCreateAlumniOriginalList(connection, row) {
    let email = null;
    let alt_email = null;
    let firstName = null;
    let lastName = null;
    let wildcatId = null;
    let major = null;
    let gradDate = null;


    try {
        for (const [column, value] of Object.entries(row)) {
            const normalizedColumn = normalizeString(column);

            if (normalizedColumn === "wildcatid") wildcatId = value?.trim() || null;
            if (normalizedColumn === "lastname") lastName = value?.trim() || null;
            if (normalizedColumn === "firstname") firstName = value?.trim() || null;
            if (normalizedColumn === "graduationdate") gradDate = value?.trim() || null;
            if (normalizedColumn === "major") major = value?.trim() || null;

            if (normalizedColumn === "email" && !value.includes("mail.weber.edu")) {
                alt_email = value?.trim() || null;
                email = value?.trim() || null;
            }
            else {
                email = value?.trim() || null;
                alt_email = null;
            }

        }

        if (!email) {
            console.log("Skipping row because email is not present," + row);
            return null
        }

        // Then try email
        if (email) {
            const [existingByEmail] = await connection.query(
                `SELECT alumni_id FROM alumni WHERE email = ?`,
                [email]
            );

            if (existingByEmail.length) {
                const alumniId = existingByEmail[0].alumni_id;

                await connection.query(
                    `UPDATE alumni
                 SET wildcat_id = COALESCE(?, wildcat_id),
                     first_name = COALESCE(?, first_name),
                     last_name = COALESCE(?, last_name)
                 WHERE alumni_id = ?`,
                    [wildcatId, firstName, lastName, alumniId]
                );

                return {
                    alumniId,
                    email
                };
            }
        }

        if (!email && !wildcatId) {
            console.warn("Skipping row because neither email nor wildcat_id exists:", row);
            return null;
        }


        const [result] = await connection.query(
            `INSERT INTO alumni (email, alt_email, first_name, last_name, wildcat_id, graduation_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [email, alt_email, firstName, lastName, wildcatId, gradDate]
        );

        return {
            alumniId: result.insertId,
            email
        };
    }
    catch (error) {
        console.error("findOrCreateAlumniOriginalList failed:", error);
    }
}




/* Dedicated find or create alumni for employment uploads*/
export async function findOrCreateAlumniFromEmploymentCSV(
    connection,
    row
) {
    const normalizedRow = {};

    try {
        for (const [key, value] of Object.entries(row)) {
            normalizedRow[normalizeString(key)] = value;
        }

        const email = normalizedRow.studentemail?.trim() || null;
        const firstName = normalizedRow.firstname;
        const lastName = normalizedRow.lastname;
        const wildcatId = normalizedRow.wnum;
        const phone = normalizedRow.phonecell;
        const graduation = normalizedRow.graduationdate;
        const degreeType = normalizedRow.degreetypecode;
        let job_position = null;
        let employerId = null;
        let altEmployerName = null;
        let minSalary = null;
        let maxSalary = null;
        let estimatedSalary = null;
        let confidence = null;
        let is_current = 0;

        let rowsSkipped = 0;

        // these will be used for storing EMPLOYMENT QUESTIONS
        const Q1 = normalizedRow.whatwasyoufirstemploymentpositionaftergraduationandwhowastheemployer || null;
        const Q2 = normalizedRow.howlongdidittakeyoutofindemploymentstateifbeforegraduation || null;
        const Q3 = normalizedRow.whatisyourcurrentemploymentstatus || null;

        // We're using Q4 as the current job and employer and inserting it into employment_questions
        const Q4 = normalizedRow.whatisyourcurrentjobtitleandemployer || null;

        const Q5 = normalizedRow.whatisyourcurrentsalaryrangeifuncomfortable || null;
        const Q6 = normalizedRow.wouldyoubewillingtomentorcurrentstudentsorparticipateinalumnievents || null;
        const Q7 = normalizedRow.wouldyoubeopentofurthercontactforanyfollowupquestions || null;


        if (!email) {
            console.warn(
                `Skipping row because email is missing: ${firstName} ${lastName}`,
                rowsSkipped++
            );
            return null;
        }

        // salary questions
        if (Q5) {
            estimatedSalary = normalizeSalary(Q5);
        }

        let tempCompanyName = null;

        if (Q4 || Q1) {
            let temp = Q1 && !Q4 ? Q1 : Q4;

            // if we are using their PAST employer experience, set is_current to false
            if (temp === Q1) {
                is_current = 0;
            }
            else {
                is_current = 1;
            }

            // some people put the answer "same" to question 4, saying they work at the same employer
            // that they started at. Q1 contains the information of their first employment position, so we want to use that data instead.
            if (temp.trim().toLowerCase() === "same") {
                temp = Q1;
                console.log("TEMP IS NOW: " + temp);
            }

            const parts = temp.split("," || ".");

            if (parts.length >= 2) {
                tempCompanyName = parts[1].trim();

                // handles extra commas in title
                job_position = parts.slice(0).join(",").trim();
            } else {
                tempCompanyName = temp.trim();
            }
        }

        console.log("TEMPCOMPANYNAME: " + tempCompanyName);

        // Check if the "job position" is actually a company (swapped in the CSV)
        if (job_position) {
            const firstPartIsEmployer =
                (await findEmployer(connection, tempCompanyName)).employerId;

            const secondPartIsEmployer =
                job_position
                    ? (await findEmployer(connection, job_position)).employerId
                    : null;

            if (!firstPartIsEmployer && secondPartIsEmployer) {
                [tempCompanyName, job_position] =
                    [job_position, tempCompanyName];
            }
        }


        const [existingByEmail] = await connection.query(
            `SELECT alumni_id FROM alumni WHERE email = ?`,
            [email]
        );

        if (existingByEmail.length) {
            const alumniId = existingByEmail[0].alumni_id;

            await connection.query(
                `UPDATE alumni
                 SET wildcat_id = COALESCE(?, wildcat_id),
                     first_name = COALESCE(?, first_name),
                     last_name = COALESCE(?, last_name),
                     graduation_date = COALESCE(?, graduation_date),
                     phone = COALESCE(?, phone)
                 WHERE alumni_id = ?`,
                [wildcatId, firstName, lastName, graduation, phone, alumniId]
            );

            if (Q4 || Q1) {
                ({
                    employerId,
                    altEmployerName
                } = await findEmployer(connection, tempCompanyName));

                if (employerId) {

                    const [existingEmploymentRecord] = await connection.query(`
                select * from employment
                where employer_id = ?
                AND alumni_id = ?`,
                        [employerId, alumniId]);

                    if (existingEmploymentRecord.length > 0) {
                        return;
                    }

                    await connection.query(`
                INSERT INTO employment
                (
                    alumni_id,
                    employer_id,
                    alt_employer_name,
                    job_position,
                    salary,
                    is_current
                )
                VALUES (?, ?, ?, ?, ?,?)`,
                        [alumniId, employerId, altEmployerName, job_position, estimatedSalary, is_current]);

                    return;
                }

                // still insert employment, just without employer_id
                await connection.query(`
                INSERT INTO employment
                (
                    alumni_id,
                    alt_employer_name,
                    job_position,
                    salary,
                    is_current
                )
                VALUES (?, ?, ?, ?, ?)`,
                    [alumniId, altEmployerName, job_position, estimatedSalary, is_current]);

            }

            return {
                alumniId,
                degreeType
            };
        }

        // creates a temp name from email if no first and last were provided
        if (!firstName && !lastName) {
            let temp_name = email.match(/^[^@]*/)[0];
            temp_name =
                temp_name[0].toUpperCase() +
                temp_name.slice(1);
        }

        // create alumni record
        const [result] = await connection.query(
            `INSERT INTO alumni (email, first_name, last_name, wildcat_id, graduation_date, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [email, firstName, lastName, wildcatId, graduation, phone]
        );

        const alumniId = result.insertId;

        console.log(
            "Inserted alumni_id: " + alumniId + " for " + firstName + " " + lastName
        );

        // Create employment
        if (Q4 || Q1) {
            ({
                employerId,
                altEmployerName
            } = await findEmployer(connection, tempCompanyName));

            // console.log({
            //     tempCompanyName,
            //     employerId,
            //     altEmployerName
            // });

            if (employerId) {

                const [employmentResult] = await connection.query(
                    `INSERT INTO employment (
            alumni_id,
            employer_id,
            alt_employer_name,
            job_position,
            salary,
            is_current
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                    [alumniId, employerId, altEmployerName, job_position, estimatedSalary, is_current]
                );

                const employmentId = employmentResult.insertId;

                await connection.query(
                    `INSERT INTO employment_questions (alumni_id, employment_id, q1, q2, q3, q4, q5, q6, q7)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [alumniId, employmentId, Q1, Q2, Q3, Q4, Q5, Q6, Q7]
                );

                return {
                    alumniId,
                    degreeType,
                    rowsSkipped
                };
            }

            // still insert employment, just without employer_id
            const [employmentResult] = await connection.query(`
                INSERT INTO employment
                (
                    alumni_id,
                    alt_employer_name,
                    job_position,
                    salary,
                    is_current
                )
                VALUES (?, ?, ?, ?, ?)`,
                [alumniId, altEmployerName, job_position, estimatedSalary, is_current]);

            const employmentId = employmentResult.insertId;

            await connection.query(
                `INSERT INTO employment_questions (alumni_id, employment_id, q1, q2, q3, q4, q5, q6, q7)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [alumniId, employmentId, Q1, Q2, Q3, Q4, Q5, Q6, Q7]
            );

            // console.log({
            //     Q5,
            //     estimatedSalary,
            //     employerId,
            //     job_position
            // });

        }


        console.log("Finished employment and alumni creation for " + alumniId);

        return {
            alumniId,
            degreeType,
            rowsSkipped
        };

    }
    catch (error) {
        //await connection.rollback();
    }
}


// used for MAIN RESPONSE uploads to insert/create alumni degrees per survey response import
export async function insertAlumniDegree(
    connection,
    mappings,
    alumniId,
    rawCode,
    survey_time,
    degree_code
) {
    if (!rawCode && !degree_code) return;

    let departmentName = null;
    let program_of_study = rawCode || null;
    let program_id = null;
    let degreeType = null;
    let department_id = null;
    let tempDeptCode = null;

    // CONVERT program CODES to the correct data
    let programData = null;

    try {
        if (rawCode && degreeType) {
            const normalizedCode = rawCode.toUpperCase();
            programData = getProgramOfStudy(normalizedCode);
        }

        if (programData) {
            departmentName = programData.department;
            program_of_study = programData.program;
            degreeType = programData.degree;
        }

        if (program_of_study === rawCode && program_of_study) {
            // This separates unnormalized program_of_study fields like: "CS : Programming Essentials - CP"
            // FORMAT: "CS: Computer Science-BS"
            let match = program_of_study.match(
                /^([^:]+)\s*:\s*(.+?)\s*-\s*([A-Za-z0-9]+)$/
            );

            if (match) {
                tempDeptCode = match[1].trim();
                program_of_study = match[2].trim();
                degreeType = match[3].trim().toUpperCase();
            }
            else {
                // FORMAT: "MSCS: Computer Science"
                match = program_of_study.match(
                    /^([^:]+)\s*:\s*(.+)$/
                );

                if (match) {
                    tempDeptCode = match[1].trim();
                    program_of_study = match[2].trim();
                }
            }
            // pass the separated deptartment code (CS) into DEPARTMENT_MAP 
            if (tempDeptCode) {
                departmentName = normalizeDepartment(tempDeptCode);
            }

            // should be received if its cw_eastmajor

            if (rawCode && !degree_code) {
                console.log("assumed cw_eastmajor");
                let spaceIndex = rawCode.indexOf(' ');
                degreeType = rawCode.slice(0, spaceIndex);
                program_of_study = rawCode.slice(spaceIndex + 1);

                console.log("Derived program and degreeType from cw_eastmajor: " + degreeType + " " + program_of_study);
            }
        }
        // console.log("Corrected DEPARTMENT name: " + departmentName);

        const [departmentRows] = await connection.query(
            `SELECT department_id
         FROM department
         WHERE department_name = ?`,
            [departmentName]
        );

        const normalizedProgram = normalizeInconsistentDepartment(program_of_study);

        const [programRows] = await connection.query(
            `SELECT program_id
     FROM program_of_study
     WHERE LOWER(TRIM(REPLACE(program_name, '  ', ' '))) = ?`,
            [normalizedProgram]
        );


        if (departmentRows.length > 0) {
            department_id = departmentRows[0].department_id;
        }
        if (programRows.length > 0) {
            program_id = programRows[0].program_id;
        }

        // CSV degree code overrides derived value
        if (degree_code && !degreeType) {
            degreeType = degree_code.toUpperCase();
        }

        // console.log("Department_id for " + departmentName + " is " + department_id);
        // console.log("found PROGRAM_id for " + program_of_study + " is " + program_id);

        // FIRST: check if this alumni already has this degree
        const [existingDegree] = await connection.query(
            `SELECT alumni_degree_id, survey_time_raw
         FROM alumni_degrees
         WHERE alumni_id = ?
         AND raw_degree_code = ?`,
            [alumniId, rawCode]
        );

        // Degree already exists
        if (existingDegree.length > 0) {

            await connection.query(
                `UPDATE alumni_degrees
         SET
            program_id = COALESCE(?, program_id),
            degree_type = COALESCE(?, degree_type),
            survey_time_raw = COALESCE(?, survey_time_raw)
         WHERE alumni_degree_id = ?`,
                [
                    program_id,
                    degreeType,
                    survey_time,
                    existingDegree[0].alumni_degree_id
                ]
            );

            return;
        }

        const [survey_term, survey_year] = parseSurveyTime(survey_time);

        // console.log("parsed TERM: " + survey_term + " and year: " + survey_year);

        await connection.query(
            `INSERT INTO alumni_degrees (
            alumni_id,
            raw_degree_code,
            program_id,
            degree_type,
            survey_time_raw,
            survey_term,
            survey_year
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                alumniId,
                rawCode,
                program_id,
                degreeType,
                survey_time,
                survey_term,
                survey_year
            ]
        );
    }
    catch (error) {
        //await connection.rollback();
    }
}


export async function insertEmploymentDegreeFromEmploymentCSV(
    connection,
    alumniId,
    row
) {
    if (!row) {
        throw new Error(
            "insertEmploymentDegree received undefined row"
        );
    }

    console.log("INSERTING DEGREE FOR ALUMNIID " + alumniId);

    try {
        const normalizedRow = {};

        for (const [key, value] of Object.entries(row)) {
            normalizedRow[normalizeString(key)] = value;
        }

        const major = normalizedRow.major1description?.trim() || null;

        // IMPORTANT:
        // Do not create a degree record if there is no major.
        // This prevents GPA-only rows from creating blank degrees.
        if (!major) {
            console.log(
                `Skipping degree for alumni ${alumniId}: no major listed`
            );
            return;
        }

        const degreecode =
            normalizedRow.degreetypecode?.trim() || null;

        const firstyear =
            normalizedRow.firstacademicyearattended?.trim() || null;

        const gpa =
            normalizedRow.major1gpa?.trim() || null;

        const minor =
            normalizedRow.minor1description?.trim() || null;

        const normalizedProgram =
            normalizeInconsistentDepartment(major);

        const [programRows] = await connection.query(
            `
            SELECT program_id
            FROM program_of_study
            WHERE LOWER(TRIM(REPLACE(program_name, '  ', ' '))) = ?
            `,
            [normalizedProgram]
        );

        // Major exists, but doesn't correspond to a known program.
        if (programRows.length === 0) {
            console.log(
                `Skipping degree for alumni ${alumniId}: ` +
                `major "${major}" did not match a program`
            );
            return;
        }

        // THIS WAS MISSING
        const programID = programRows[0].program_id;

        console.log(
            `Found PROGRAM_id for ${major} is ${programID}`
        );

        // Check whether this alumni already has this program
        const [existingDegree] = await connection.query(
            `
            SELECT alumni_degree_id
            FROM alumni_degrees
            WHERE alumni_id = ?
            AND program_id = ?
            `,
            [alumniId, programID]
        );

        // Degree already exists
        if (existingDegree.length > 0) {
            await connection.query(
                `
                UPDATE alumni_degrees
                SET
                    degree_type = COALESCE(?, degree_type),
                    first_year_attended = COALESCE(?, first_year_attended),
                    minor = COALESCE(?, minor),
                    gpa = COALESCE(?, gpa)
                WHERE alumni_degree_id = ?
                `,
                [
                    degreecode,
                    firstyear,
                    minor,
                    gpa,
                    existingDegree[0].alumni_degree_id
                ]
            );

            console.log(
                `Updated existing degree ${existingDegree[0].alumni_degree_id} ` +
                `for alumni ${alumniId}`
            );

            return;
        }

        // Create new degree
        await connection.query(
            `
            INSERT INTO alumni_degrees (
                alumni_id,
                program_id,
                degree_type,
                first_year_attended,
                minor,
                gpa
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                alumniId,
                programID,
                degreecode,
                firstyear,
                minor,
                gpa
            ]
        );

        console.log(
            `Inserted new degree for alumni ${alumniId}: ${major}`
        );

        return {
            alumniId
        };

    } catch (error) {
        console.error(
            "insertEmploymentDegreeFromEmploymentCSV failed:",
            error
        );
    }
}


export async function insertDegreeOriginalList(
    connection,
    alumniId,
    row
) {
    if (!row) {
        throw new Error(
            "insertDegreeOriginalList received undefined row"
        );
    }

    console.log("INSERTING DEGREE FOR ALUMNIID " + alumniId);

    try {
        const normalizedRow = {};

        for (const [key, value] of Object.entries(row)) {
            normalizedRow[normalizeString(key)] = value;
        }

        const major = normalizedRow.major?.trim() || null;

        // -----------------------------------------
        // 1. Don't create a degree without a major
        // -----------------------------------------
        if (!major) {
            console.log(
                `Skipping degree for alumni ${alumniId}: no major listed`
            );
            return;
        }

        // Normalize major
        const normalizedProgram =
            normalizeInconsistentDepartment(major);

        // Find program
        const [programRows] = await connection.query(
            `SELECT program_id
             FROM program_of_study
             WHERE LOWER(TRIM(REPLACE(program_name, '  ', ' '))) = ?`,
            [normalizedProgram]
        );

        // -----------------------------------------
        // 2. Don't create a degree if major isn't
        //    mapped to a program
        // -----------------------------------------
        if (programRows.length === 0) {
            console.log(
                `Skipping degree for alumni ${alumniId}: ` +
                `major "${major}" did not match a program`
            );
            return;
        }

        const programID = programRows[0].program_id;

        console.log(
            `Found PROGRAM_id for ${major} is ${programID}`
        );

        // -----------------------------------------
        // Check whether degree already exists
        // -----------------------------------------
        const [existingDegree] = await connection.query(
            `SELECT alumni_degree_id
             FROM alumni_degrees
             WHERE alumni_id = ?
             AND program_id = ?`,
            [alumniId, programID]
        );

        // Degree already exists
        if (existingDegree.length > 0) {
            await connection.query(
                `UPDATE alumni_degrees
                 SET program_id = COALESCE(?, program_id)
                 WHERE alumni_degree_id = ?`,
                [
                    programID,
                    existingDegree[0].alumni_degree_id
                ]
            );

            return;
        }

        // -----------------------------------------
        // Insert degree
        // -----------------------------------------
        await connection.query(
            `INSERT INTO alumni_degrees (
                alumni_id,
                program_id
            )
            VALUES (?, ?)`,
            [
                alumniId,
                programID
            ]
        );

        return {
            alumniId
        };

    } catch (error) {
        console.error(
            "insertDegreeOriginalList failed:",
            error
        );
    }
}




export async function createInternshipFromRow(
    connection,
    row,
    mappings,
    surveyAttemptId,
    alumniId
) {
    let internshipTypes = [];
    let intern_business = null;
    let intern_city = null;

    try {
        for (const [column, value] of Object.entries(row)) {
            const normalizedColumn = normalizeString(column);
            const mapping = mappings[normalizedColumn];

            if (!mapping) continue;

            // Multi-select internships
            if (mapping.question_code === "internships") {
                if (value && value.trim() !== "") {
                    internshipTypes.push(value.trim());
                }
            }

            if (mapping.question_code === "intern_business") {
                intern_business = value || null;
            }

            if (mapping.question_code === "city_intern") {
                intern_city = value || null;
            }
        }

        const intern_for_credit = internshipTypes.includes("For credit internship");
        const intern_no_credit = internshipTypes.includes("Not for credit internship");
        const intern_na = internshipTypes.includes("N/A");
        const intern_none = internshipTypes.includes("I did not participate in an internship");

        if (intern_none) {
            return;
        }

        if (!intern_business && internshipTypes.length === 0) return;

        await connection.query(
            `INSERT INTO internship (
            alumni_id,
            survey_attempt_id,
            for_credit,
            not_for_credit,
            n_a,
            intern_business,
            intern_city
        )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                alumniId,
                surveyAttemptId,
                intern_for_credit,
                intern_no_credit,
                intern_na,
                intern_business,
                intern_city
            ]
        );
    }
    catch (error) {
        // await connection.rollback();
    }
}

export async function createEmploymentFromRow(
    connection,
    row,
    mappings,
    surveyAttemptId,
    alumniId
) {
    let employerId = null;
    let altEmployerName = null;
    let job_position = null;
    let salary = null;
    let country = null;
    let state = null;
    let city = null;
    let years_exp = null;
    let major_match = null;

    try {
        for (const [column, value] of Object.entries(row)) {
            const normalizedColumn = normalizeString(column);
            const mapping = mappings[normalizedColumn];

            if (!mapping) continue;

            if (
                mapping.question_code === "job_position" ||
                mapping.question_code === "cw_employer_2"
            ) {
                if (value?.trim()) {
                    job_position = value.trim();
                }
            }

            if (
                (mapping.question_code === "employer" ||
                    mapping.question_code === "cw_employer_1") &&
                value?.trim()
            ) {
                ({
                    employerId,
                    altEmployerName
                } = await findEmployer(connection, value.trim()));
            }


            if ((mapping.question_code === "income") || (mapping.question_code === "cw_salary")) {
                salary = normalizeSalary(value);
                console.log("new Salary is: " + salary);
            }

            if (mapping.question_code === "country") {
                country = value || null;

                if (!country && employerId) {
                    const [employerMatch] = await connection.query(`
                    select employer_country
                    from employer
                    where employer_id= ? `,
                        [employerId]);

                    if (employerMatch.length > 0) {
                        country = employerMatch[0].country;
                    }
                }
            }

            if (mapping.question_code === "city") {
                city = value || null;
            }

            if (mapping.question_code === "state") {
                state = value || null;
            }

            if (mapping.question_code === "yrs_exp") {
                years_exp = value || null;
            }

            if ((mapping.question_code === "employ_major") || (mapping.question_code === "cw_eastmajor")) {
                major_match = value;
            }
        }


        if (!country && employerId) {
            const [employerMatch] = await connection.query(`
                    select employer_country
                    from employer
                    where employer_id= ? `,
                [employerId]);

            if (employerMatch.length > 0) {
                country = employerMatch[0].employer_country;
            }
        }

        // check for existing employment
        const [existingEmployment] = await connection.query(
            `SELECT employment_id
     FROM employment
     WHERE alumni_id = ?
     AND (
         (? IS NOT NULL AND employer_id = ?)
         OR
         (? IS NOT NULL AND alt_employer_name = ?)
     )
     LIMIT 1`,
            [
                alumniId,
                employerId,
                employerId,
                altEmployerName,
                altEmployerName
            ]
        );


        if (existingEmployment.length > 0) {
            await connection.query(
                `UPDATE employment
         SET
             alt_employer_name = COALESCE(?, alt_employer_name),
             job_position = COALESCE(?, job_position),
             salary_STRING = COALESCE(?, salary_STRING),
             country = COALESCE(?, country),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             yrs_exp = COALESCE(?, yrs_exp),
             major_match = COALESCE(?, major_match)
         WHERE employment_id = ?`,
                [
                    altEmployerName,
                    job_position,
                    salary,
                    country,
                    city,
                    state,
                    years_exp,
                    major_match,
                    existingEmployment[0].employment_id
                ]
            );

            console.log(
                `Updated existing employment for alumni ${alumniId}`
            );

            return;
        }


        await connection.query(
            `INSERT INTO employment (
            alumni_id,
            employer_id,
            alt_employer_name,
            survey_attempt_id,
            job_position,
            salary_STRING,
            country,
            city,
            state,
            yrs_exp,
            major_match,
            is_current
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [alumniId, employerId, altEmployerName, surveyAttemptId, job_position, salary, country, city, state, years_exp, major_match, null]
        );

        console.log("Inserted for : " + alumniId + " employer: " + employerId + " " + altEmployerName);

    }
    catch (error) {

        console.error("createEmploymentFromRow FAILED:", error);
        console.error("alumniId:", alumniId);
        console.error("row:", row);

    }
}

/**
 * Create one survey attempt per alumni response row.
 */
export async function createSurveyAttempt(connection, alumniId, surveyVersionId, rowNumber, sourceResponseId, surveyTime) {
    try {
        if (alumniId, surveyVersionId, surveyTime) {
            const [existing] = await connection.query(
                `SELECT survey_attempt_id
             FROM survey_attempt
             WHERE alumni_id = ? 
             AND survey_version_id = ?
             and survey_time = ?`,
                [alumniId, surveyVersionId, surveyTime]
            );

            if (existing.length) {
                return existing[0].survey_attempt_id;
            }
        }

        const [result] = await connection.query(
            `INSERT INTO survey_attempt (alumni_id, survey_version_id, source_row_number, source_response_id, survey_time)
         VALUES (?, ?, ?, ?, ?)`,
            [alumniId, surveyVersionId, rowNumber, sourceResponseId, surveyTime]
        );

        return result.insertId;
    }
    catch (error) {
        //await connection.rollback();
    }
}


export async function createEmploymentRecord(connection, alumniID) {
    for (const [column, rawValue] of Object.entries(row)) {
        const normalizedColumn = normalizeString(column);
        const mapping = mappings[normalizedColumn];

        if (!mapping) continue;

    }
}