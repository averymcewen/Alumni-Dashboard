import fs from "fs";
import csv from "csv-parser";
import pool from "../db/pool.js";
import crypto from "crypto";
import normalizeString from "../utils/normalizeHeader.js";
import { findOrCreateAlumni, findOrCreateAlumniFromEmploymentCSV, findOrCreateAlumniOriginalList, createSurveyAttempt, createEmploymentFromRow, createInternshipFromRow, insertAlumniDegree, insertEmploymentDegreeFromEmploymentCSV, insertDegreeOriginalList } from "./createAlumniRecords.js";
import { getMappings, getOptionText, ensureQuestionExists, ensureOptionExists, ensureMappingsForCsvHeaders, getQuestionId, getOptionId, processRowResponses } from "./csvImportHelpers.js"
import { detectMapping, shouldIgnoreHeader, buildRuntimeMappings, detectDelimiter, splitQuestionAndSubquestion, parseResponseCsv, parseEmploymentCsv, parseAlumniOriginalFile } from "./csvParsers.js";

/*
 * Optional escape hatch: dualRoleHeaders lets a specific survey version flag
 * ADDITIONAL headers as dual-role (write to alumni table AND question table)
 * on top of whatever's always dual-role globally (see
 * ALWAYS_DUAL_ROLE_HEADERS in csvParsers.js — that's where cw_eastmajor
 * lives now, since it should behave this way for every survey version, not
 * just one). Leave this empty unless you have a genuinely one-off case.
 */
const DUAL_ROLE_HEADERS_BY_SURVEY_VERSION = {
    // "<survey_version_id>": ["some_header_unique_to_this_version"],
};

function getDualRoleHeaders(surveyVersionId) {
    return DUAL_ROLE_HEADERS_BY_SURVEY_VERSION[surveyVersionId] || [];
}

/*
* creates a has of any uploaded CSV files to avoid identical files being uploaded multiple times.
*/
async function computeFileHash(filePath) {
    return await new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);

        stream.on("data", chunk => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });
}

/* 
* Extracts the response ID from a data row based on the provided mappings.
*/
function getSourceResponseId(row, mappings) {
    for (const [column, value] of Object.entries(row)) {
        const normalizedColumn = normalizeString(column);
        const mapping = mappings[normalizedColumn];

        if (
            mapping &&
            mapping.field_role === "metadata" &&
            mapping.target_column === "responseID"
        ) {
            return value?.trim() || null;
        }
    }

    return null;
}


/**
 * Save unknown or auto-detected header for review.
 * You can use this later to let the user refine mappings.
 */
async function savePendingMapping(connection, surveyVersionId, rawColumnName, sampleValue) {
    const normalizedColumnName = normalizeString(rawColumnName);

    try {
        const [existing] = await connection.query(
            `SELECT pending_mapping_id
         FROM pending_mapping_review
         WHERE survey_version_id = ? AND raw_column_name = ?`,
            [surveyVersionId, rawColumnName]
        );

        if (!existing?.length) {
            await connection.query(
                `INSERT INTO pending_mapping_review
             (survey_version_id, raw_column_name, normalized_column_name, sample_value, status)
             VALUES (?, ?, ?, ?, 'pending')`,
                [surveyVersionId, rawColumnName, normalizedColumnName, sampleValue || null]
            );
        }
    }
    catch (error) {
        //await connection.rollback();
    }
}


/**
 * Main import function for response data CSV files. Allows user to upload a CSV containing a normal header with question desc codes (i.e. plans, engagement, etc). Also allows
 * users to upload a CSV containing two header rows - first being a machine readable header with the question codes, the second being actual question text. 
 */
export async function importRESPONSECsvFile(filePath, surveyVersionId, originalFileName, fromAdminPage) {
    const {
        rows,
        machineHeaders,
        questionHeaderMap
    } = await parseResponseCsv(
        filePath,
        fromAdminPage
    );

    if (!rows?.length) {
        throw new Error("The uploaded CSV contains no data rows.");
    }

    const connection = await pool.getConnection();

    const fileHash = await computeFileHash(filePath);


    const [existingBatch] = await connection.query(
        `SELECT import_batch_id
     FROM import_batch
     WHERE survey_version_id = ? AND file_hash = ?`,
        [surveyVersionId, fileHash]
    );

    if (existingBatch?.length > 0) {
        throw new Error("This CSV file has already been uploaded for this survey version.");
    }

    try {
        await connection.beginTransaction();

        const [batchResult] = await connection.query(
            `INSERT INTO import_batch (survey_version_id, file_name, file_hash, import_status)
     VALUES (?, ?, ?, 'processing')`,
            [surveyVersionId, originalFileName, fileHash]
        );

        const warnings = []; // this will be used to return all warning messages after an import.

        const importBatchId = batchResult.insertId;

        console.log("BatchResult:" + batchResult);

        console.log("Imported Batch ID:" + importBatchId);

        const [batchCheck] = await connection.query(
            "SELECT * FROM import_batch WHERE import_batch_id = ?",
            [importBatchId]
        );

        console.log(batchCheck);

        await ensureMappingsForCsvHeaders(
            connection,
            surveyVersionId,
            machineHeaders,
            rows[0],
            questionHeaderMap
        );

        console.log("Mappings are ensured.");

        const dbMappings = await getMappings(connection, surveyVersionId);

        // THE FIX: buildRuntimeMappings needs to know which headers are
        // dual-role for THIS survey version, or mapping.also_question is
        // always null and findOrCreateAlumni's also_question check never
        // fires — no error, it just silently has nothing to do.
        const dualRoleHeaders = getDualRoleHeaders(surveyVersionId);
        const runtimeMappings = buildRuntimeMappings(machineHeaders, questionHeaderMap, { dualRoleHeaders });

        const mappings = {};
        for (const key of Object.keys(runtimeMappings)) {
            mappings[key] = {
                ...(dbMappings[key] || {}),
                ...runtimeMappings[key]
            };
        }

        let importedCount = 0;
        let skippedCount = 0;


        for (let i = 0; i < rows?.length; i++) {
            const row = rows[i];

            const sourceResponseId = getSourceResponseId(row, mappings);

            if (sourceResponseId) {
                const [existingAttempt] = await connection.query(
                    `SELECT survey_attempt_id
             FROM survey_attempt
             WHERE survey_version_id = ? AND source_response_id = ?`,
                    [surveyVersionId, sourceResponseId]
                );

                if (existingAttempt?.length > 0) {
                    warnings.push(`Skipping duplicate row with ResponseId: ${sourceResponseId}`);
                    skippedCount++;
                    continue;
                }
            }

            await connection.query(
                `INSERT INTO raw_import_row (import_batch_id, source_row_number, raw_payload_json)
         VALUES (?, ?, ?)`,
                [importBatchId, i + 1, JSON.stringify(row)]
            );
            ;

            let alumniData;

            try {
                alumniData = await findOrCreateAlumni(
                    connection,
                    row,
                    mappings,
                    surveyVersionId
                );
                console.log("Inserting alumni...");
            }
            catch (err) {
                console.error("findOrCreateAlumni failed on row", i + 1);
                console.error(row);
                throw err;
            }

            // still continue insert even all alumni are null
            if (!alumniData?.alumniId) {
                warnings.push("Skipping row due to missing alumni identifier");
                skippedCount++;
                continue;
            }


            // console.log("inserting alumni: " + alumniData.alumniId);

            try {
                await insertAlumniDegree(
                    connection,
                    mappings,
                    alumniData.alumniId,
                    alumniData.raw_degree_code,
                    alumniData.survey_time,
                    alumniData.degree_code
                );
            }
            catch (err) {
                console.error("InsertAlumniDegree failed on row", i + 1);
                console.error(row);
                throw err;
            }

            let surveyAttemptId;

            try {

                surveyAttemptId = await createSurveyAttempt(
                    connection,
                    alumniData.alumniId,
                    surveyVersionId,
                    i + 1,
                    sourceResponseId,
                    alumniData.survey_time
                );
            }
            catch (err) {
                console.error("createSurveyAttempt failed on row", i + 1);
                console.error(row);
                throw err;
            }

            try {
                await processRowResponses(
                    connection,
                    row,
                    mappings,
                    surveyVersionId,
                    surveyAttemptId
                );
            } catch (err) {
                console.error("processRowResponses failed on row", i + 1);
                console.error(row);
                throw err;
            }

            try {
                await createEmploymentFromRow(
                    connection,
                    row,
                    mappings,
                    surveyAttemptId,
                    alumniData.alumniId
                );
                console.log("INSERTING EMPLOYMENT");
            }
            catch (err) {
                console.error("createEmploymentFromRow failed on row", i + 1);
                console.error(row);
                throw err;
            }

            try {
                await createInternshipFromRow(
                    connection,
                    row,
                    mappings,
                    surveyAttemptId,
                    alumniData.alumniId
                );
            }
            catch (err) {
                console.error("createInternshipFromRow failed on row", i + 1);
                console.error(row);
                throw err;
            }

            importedCount++;

        }

        await connection.query(
            `UPDATE import_batch
             SET import_status = 'completed'
             WHERE import_batch_id = ?`,
            [importBatchId]
        );

        console.log("Attempting to commit...");
        await connection.commit();
        console.log("Commit Successful.");




        return {
            success: true,
            message: "Import completed successfully.",
            rowsRead: rows?.length,
            rowsImported: importedCount,
            rowsSkipped: skippedCount,
            importBatchId,
            warnings
        };
    } catch (error) {
        // await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


/*
A function to handle uploads of Employment CSV
*/

export async function importEmploymentCSV(
    filePath,
    originalFileName
) {
    const { rows } =
        await parseEmploymentCsv(filePath);

    console.log("Parsing " + rows?.length + " rows");

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let importedCount = 0;
        let skipped = null;
        let id = null;

        for (const row of rows) {

            try {
                const alumniData =
                    await findOrCreateAlumniFromEmploymentCSV(
                        connection,
                        row
                    );

                if (!alumniData) {
                    console.log("Alumni data not found");
                    continue;
                }

                if (alumniData) {
                    id = alumniData.alumniId;
                }

                console.log(
                    "Processed:",
                    alumniData?.alumniId
                );
            } catch (err) {
                console.error(
                    "Failed row:",
                    row,
                    err
                );
                throw err;
            }

            try {
                const alumniDegree =
                    await insertEmploymentDegreeFromEmploymentCSV(
                        connection,
                        id,
                        row
                    );

                if (!alumniDegree) {
                    continue;
                }

                console.log("Degree for " + id + " " + alumniDegree);
            }
            catch (err) {
                console.error(
                    "Failed degree insert for:",
                    row,
                    err
                );
                throw err;
            }

            importedCount++;
        }

        await connection.commit();

        return {
            success: true,
            rowsImported: importedCount,
            rowsSkipped: skipped
        };
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
}




/*
A function to handle the Alumni ORIGINAL LIST CSV
*/

export async function importOriginalAlumniList(
    filePath,
    originalFileName
) {
    const { rows } =
        await parseAlumniOriginalFile(filePath);

    console.log("Parsing " + rows?.length + " rows");

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let importedCount = 0;
        let skipped = null;
        let id = null;

        for (const row of rows) {

            try {
                const alumniData =
                    await findOrCreateAlumniOriginalList(
                        connection,
                        row
                    );

                if (!alumniData) {
                    console.log("Alumni data not found");
                    continue;
                }

                if (alumniData) {
                    id = alumniData.alumniId;
                }

                console.log(
                    "Processed:",
                    alumniData?.alumniId
                );
            } catch (err) {
                console.error(
                    "Failed row:",
                    row,
                    err
                );
                throw err;
            }

            try {
                const alumniDegree =
                    await insertDegreeOriginalList(
                        connection,
                        id,
                        row
                    );

                if (!alumniDegree) {
                    continue;
                }

                console.log("Degree for " + id + " " + alumniDegree);
            }
            catch (err) {
                console.error(
                    "Failed degree insert for:",
                    row,
                    err
                );
                throw err;
            }

            importedCount++;
        }

        await connection.commit();

        return {
            success: true,
            rowsImported: importedCount,
            rowsSkipped: skipped
        };
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
}