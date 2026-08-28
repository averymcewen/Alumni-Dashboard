import normalizeString from "../utils/normalizeHeader.js";
import { detectMapping } from "./csvParsers.js";
import { questionCategories } from "./Maps for Normalizing/QuestionCategory.js"


export async function getMappings(connection, surveyVersionId) {
    const [rows] = await connection.query(
        `SELECT * 
         FROM import_column_mapping
         WHERE survey_version_id = ? AND is_active = TRUE`,
        [surveyVersionId]
    );

    const byColumn = {};

    for (const row of rows) {
        const normalized = normalizeString(row.raw_column_name);
        byColumn[normalized] = row;
    }

    return byColumn;
}


export async function getOptionText(connection, questionId, optionCode) {
    const [rows] = await connection.query(
        `SELECT option_text
         FROM question_option
         WHERE question_id = ? AND option_code = ?`,
        [questionId, optionCode]
    );

    if (!rows.length) {
        return optionCode;
    }

    return rows[0].option_text || optionCode;
}





export async function ensureQuestionExists(
    connection,
    surveyVersionId,
    questionCode,
    questionType = "text",
    questionText,
    subQuestionText
) {
    try {

        // console.log("ensureQuestionExists", {
        //     questionCode,
        //     questionType,
        //     questionText
        // });


        const [rows] = await connection.query(
            `SELECT question_id, question_text
         FROM question
         WHERE survey_version_id = ? AND question_code = ?`,
            [surveyVersionId, questionCode]
        );

        if (rows.length > 0) {
            const questionId = rows[0].question_id;

            if (questionText && rows[0].question_text !== questionText) {
                await connection.query(
                    `UPDATE question
                 SET question_text = ?
                 WHERE question_id = ?`,
                    [questionText, questionId]
                );
            }

            // derive question category 
            const question_abbr = questionCode.split("_")[0].toLowerCase();

            // console.log("Derived cat abbr: " + question_abbr);

            const question_category = questionCategories[question_abbr] ?? null;

            // console.log("Category is: " + question_category);

            return questionId;

        }

        // console.log("Subquestion: " + subQuestionText);

        // derive question category 

        const question_abbr = questionCode.split('_')[0];
        // console.log("Derived cat abbr: " + question_abbr);

        const question_category = questionCategories[question_abbr] || "Uncategorized";

        // console.log("Category is: " + question_category);


        const [result] = await connection.query(
            `INSERT INTO question (
            survey_version_id,
            question_code,
            question_text,
            question_cat_abbr,
            question_category,
            question_type,
            subquestion_text
        )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                surveyVersionId,
                questionCode,
                questionText,
                question_abbr,
                question_category,
                questionType,
                subQuestionText
            ]
        );

        return result.insertId;
    }
    catch (error) {
        console.log("Issue in ensureQuestionExists" + error);
    }
}

export async function ensureOptionExists(connection, questionId, optionCode, optionText = null) {
    try {
        const [rows] = await connection.query(
            `SELECT option_id, option_text
         FROM question_option
         WHERE question_id = ? AND option_code = ?`,
            [questionId, optionCode]
        );

        if (rows.length > 0) {
            const optionId = rows[0].option_id;

            if (optionText && rows[0].option_text !== optionText) {
                await connection.query(
                    `UPDATE question_option
                 SET option_text = ?
                 WHERE option_id = ?`,
                    [optionText, optionId]
                );
            }

            return optionId;
        }

        const [result] = await connection.query(
            `INSERT INTO question_option (question_id, option_code, option_text, display_order)
         VALUES (?, ?, ?, ?)`,
            [questionId, optionCode, optionText || optionCode, 0]
        );

        return result.insertId;
    }
    catch (error) {
        console.log("issue in ensureOptionsExist");
    }
}


/**
 * Scan CSV headers and auto-create any missing mappings.
 * Also ensures placeholder question / option metadata exists.
 */
export async function ensureMappingsForCsvHeaders(connection, surveyVersionId, headers, sampleRow = {}, questionHeaderMap = {}) {
    try {
        const [existingRows] = await connection.query(
            `SELECT raw_column_name
         FROM import_column_mapping
         WHERE survey_version_id = ?`,
            [surveyVersionId]
        );

        const existingSet = new Set(existingRows.map(r => normalizeString(r.raw_column_name)));

        for (const header of headers) {
            const normalizedHeader = normalizeString(header);

            if (existingSet.has(normalizedHeader)) {
                continue;
            }

            const mapping = detectMapping(header, questionHeaderMap);

            // console.log("Mapping found: " + mapping.question_text + " and subquestion: " + mapping.subquestion_text);

            if (!mapping) {
                continue;
            }

            if (mapping.field_role === "question") {
                await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.question_code,
                    mapping.question_type,
                    mapping.question_text,
                    mapping.subquestion_text
                );
            }

            if (mapping.field_role === "other_text") {
                await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.question_code,
                    mapping.question_type,
                    mapping.question_text,
                    mapping.subquestion_text
                );
            }

            if (mapping.field_role === "subquestion") {
                //console.log("IS subquestion " + mapping.subquestion_text);
                await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.question_code,
                    mapping.question_type,
                    mapping.question_text,
                    mapping.subquestion_text
                );
            }

            if (mapping.field_role === "option") {
                const questionId = await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.question_code,
                    mapping.question_type,
                    mapping.question_text,
                    mapping.subquestion_text
                );

                await ensureOptionExists(
                    connection,
                    questionId,
                    mapping.question_type,
                    mapping.option_code,
                    mapping.option_text,
                );
            }

            // Dual-role headers (e.g. cw_eastmajor): field_role is "alumni_field"
            // here, so none of the branches above fire — but the question
            // definition still needs to exist. findOrCreateAlumni() also calls
            // ensureQuestionExists for these per-row via mapping.also_question,
            // so this isn't strictly required for correctness, but doing it here
            // too means the question row (and its category/type) exists right
            // away rather than only after the first alumni row is processed.
            if (mapping.field_role === "alumni_field" && mapping.also_question) {
                await ensureQuestionExists(
                    connection,
                    surveyVersionId,
                    mapping.also_question.question_code,
                    mapping.also_question.question_type,
                    mapping.also_question.question_text,
                    mapping.also_question.subquestion_text
                );
            }


            const [existingQuestion] = await connection.query(`
                select * from import_column_mapping 
                where raw_column_name = ?
                AND survey_version_id = ?`,
                [mapping.raw_column_name, surveyVersionId]);

            if (existingQuestion.length > 0) {
                console.log("Duplicate key detected for: " + mapping.quesion_code + " " + mapping.question_text + " Conflicts with: " + existingQuestion.question_code + existingQuestion.question_text)
            }

            await connection.query(
                `INSERT INTO import_column_mapping
             (survey_version_id, raw_column_name, normalized_column_name, field_role, question_code, option_code, target_table, target_column)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    surveyVersionId,
                    mapping.raw_column_name,
                    mapping.normalized_column_name,
                    mapping.field_role,
                    mapping.question_code,
                    mapping.option_code,
                    mapping.target_table,
                    mapping.target_column
                ]
            );
        }
    }
    catch (err) {
        console.log("issue in ensureMappingsForCSVheaders");
        throw err;
    }
}


export async function getQuestionId(connection, surveyVersionId, questionCode) {
    const [rows] = await connection.query(
        `SELECT question_id
         FROM question
         WHERE survey_version_id = ? AND question_code = ?`,
        [surveyVersionId, questionCode]
    );

    if (!rows.length) {
        throw new Error(`Question not found for code: ${questionCode}`);
    }

    return rows[0].question_id;
}

export async function getOptionId(connection, questionId, optionCode) {
    const [rows] = await connection.query(
        `SELECT option_id
         FROM question_option
         WHERE question_id = ? AND option_code = ?`,
        [questionId, optionCode]
    );

    if (!rows.length) {
        throw new Error(`Option not found for code: ${optionCode}`);
    }

    return rows[0].option_id;
}


/**
 * Read each mapped response column from the row and insert normalized answers.
 */
export async function processRowResponses(connection, row, mappings, surveyVersionId, surveyAttemptId) {
    try {
        const metadata = [];
        for (const [column, rawValue] of Object.entries(row)) {
            const normalizedColumn = normalizeString(column);
            const mapping = mappings[normalizedColumn];


            if (!mapping) continue;

            const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

            if (value === "" || value === null || value === undefined) {
                continue;
            }

            if (mapping.field_role === "metadata") {
                metadata.push({
                    field_name: normalizedColumn,
                    field_value: value
                });
                continue;
            }

            // Regular question or other-text field
            if (mapping.field_role === "question" || mapping.field_role === "other_text") {
                const questionId = await getQuestionId(connection, surveyVersionId, mapping.question_code);

                await connection.query(
                    `INSERT INTO response (
            survey_attempt_id,
            question_id,
            value_text,
            raw_value,
            option_code,
            option_text,
            subquestion_text
        )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        surveyAttemptId,
                        questionId,
                        value,
                        value,
                        null,
                        null,
                        null
                    ]
                );
            }

            // for sub questions
            if (mapping.field_role === "subquestion") {
                const questionId = await getQuestionId(connection, surveyVersionId, mapping.question_code);

                await connection.query(
                    `INSERT INTO response (
            survey_attempt_id,
            question_id,
            value_text,
            raw_value,
            option_code,
            option_text,
            subquestion_text
        )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        surveyAttemptId,
                        questionId,
                        value,
                        value,
                        null,
                        null,
                        mapping.subquestion_text || null
                    ]
                );
            }

            // Multi-select option field
            if (mapping.field_role === "option") {
                const normalizedValue = String(value).trim().toLowerCase();

                const falsyValues = ["", "0", "false", "no", "not selected", "unselected", "null", "n/a"];
                const genericTruthyValues = ["1", "true", "yes", "selected", "checked", "y", "x"];

                if (!falsyValues.includes(normalizedValue)) {
                    const questionId = await getQuestionId(connection, surveyVersionId, mapping.question_code);

                    let displayText;

                    if (!genericTruthyValues.includes(normalizedValue)) {
                        displayText = String(value).trim();
                    } else {
                        displayText = await getOptionText(connection, questionId, mapping.option_code);
                    }

                    await connection.query(
                        `INSERT INTO response (
                survey_attempt_id,
                question_id,
                value_text,
                raw_value,
                option_code,
                option_text,
                subquestion_text
            )
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            surveyAttemptId,
                            questionId,
                            displayText,
                            value,
                            mapping.option_code,
                            displayText,
                            null
                        ]
                    );
                }
            }

            // Dual-role field: writes to an alumni-table column elsewhere
            // (findOrCreateAlumni), but ALSO needs its answer recorded as a
            // normal response row here — same as any field_role: "question"
            // column — using the also_question sub-mapping's question_code
            // (NOT mapping.question_code, which is null on the outer
            // alumni_field mapping).
            if (mapping.field_role === "alumni_field" && mapping.also_question) {
                const questionId = await getQuestionId(
                    connection,
                    surveyVersionId,
                    mapping.also_question.question_code
                );

                await connection.query(
                    `INSERT INTO response (
            survey_attempt_id,
            question_id,
            value_text,
            raw_value,
            option_code,
            option_text,
            subquestion_text
        )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        surveyAttemptId,
                        questionId,
                        value,
                        value,
                        null,
                        null,
                        mapping.also_question.subquestion_text || null
                    ]
                );
            }
        }

        // Insert metadata once after processing every column
        if (metadata.length > 0) {
            await connection.query(
                `INSERT INTO metadata (
                    survey_version_id,
                    survey_attempt_id,
                    metadata
                )
                VALUES (?, ?, ?)`,
                [
                    surveyVersionId,
                    surveyAttemptId,
                    JSON.stringify(metadata)
                ]
            );
        }
    }
    catch (error) {
        console.error("Issue processing row:", error);
    }
}