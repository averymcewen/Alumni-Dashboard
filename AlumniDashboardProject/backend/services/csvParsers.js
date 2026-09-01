import fs from "fs";
import csv from "csv-parser";
import pool from "../db/pool.js";
import normalizeString from "../utils/normalizeHeader.js";

/* =============================================================================
 * WHY THIS WAS REWORKED
 * -----------------------------------------------------------------------------
 * The old detectMapping() only recognized a header as "grouped with a parent
 * question" if it ended in a plain numeric suffix (`/^(.+)_([0-9]+)$/i`).
 * That misses:
 *   - Qualtrics rank-order questions:      cw_rankeffective_0_1_RANK
 *   - Qualtrics rank group columns:        cw_rankeffective_0_GROUP
 *   - "Other"/choice-specific text boxes:  cw_recommend_1_TEXT ("... - Yes - Text")
 *
 * And even when a numeric suffix WAS present (matrix rows like
 * cw_easteffective_3), the branch that was supposed to mark it as a
 * "subquestion" of the parent question never actually returned anything
 * (dead code path), so every matrix row silently became its OWN top-level
 * question instead of being grouped under its parent.
 *
 * This version strips suffixes by *pattern* first (rank / rank-group /
 * conditional-text / plain-numbered), derives the parent question_code from
 * whatever's left, and only then decides field_role using the human-readable
 * question text row. It also assigns a question_type so downstream code
 * knows how to render/store answers (single_select, multi_select,
 * multi_select_list, matrix, ranking, conditional_text, text_open).
 * ========================================================================== */

export function buildRuntimeMappings(machineHeaders, questionHeaderMap = {}, options = {}) {
    const dualRoleHeaders = normalizeDualRoleHeaders(options.dualRoleHeaders);
    const byColumn = {};

    for (const header of machineHeaders) {
        const mapping = detectMapping(header, questionHeaderMap, dualRoleHeaders);
        if (!mapping) continue;

        const normalized = normalizeString(header);
        byColumn[normalized] = mapping;
    }

    return byColumn;
}

/**
 * Normalizes a caller-supplied list of "dual role" header codes (headers that
 * should be written to BOTH their normal alumni_field/alumni_degree target
 * AND stored as a row in the question table) into a Set keyed the same way
 * detectMapping keys everything else.
 *
 * This is intentionally survey-agnostic — the caller decides which headers
 * are dual-role for a given import (e.g. only for one specific
 * survey_version_id), rather than this module hardcoding survey-version
 * knowledge it has no other reason to know about.
 */
function normalizeDualRoleHeaders(dualRoleHeaders) {
    const set = new Set();
    for (const h of dualRoleHeaders || []) {
        set.add(normalizeString(h));
    }
    return set;
}

/**
 * Ignore obvious junk / duplicate columns from legacy exports.
 */
export function shouldIgnoreHeader(header) {
    if (!header) return true;

    const trimmed = header.trim();

    if (/^unnamed/i.test(trimmed)) return true; // Unnamed: 9
    if (/\.\d+$/.test(trimmed)) return true;    // DEGREECODE.1

    return false;
}

/* -----------------------------------------------------------------------
 * Fixed field / metadata targets. Adjust freely — these are just lookup
 * tables now instead of a long chain of if-statements, so adding a new
 * direct-mapped column is a one-line change.
 * --------------------------------------------------------------------- */

const DIRECT_FIELD_MAP = {
    recipientemail: ["alumni", "email"],
    email: ["alumni", "email"],
    alumni_more_info_1: ["alumni", "alt_email"],
    cw_contactinfo_1: ["alumni", "alt_email"],
    recipientfirstname: ["alumni", "first_name"],
    firstname: ["alumni", "first_name"],
    recipientlastname: ["alumni", "last_name"],
    lastname: ["alumni", "last_name"],
    wildcat_id: ["alumni", "wildcat_id"],
    programofstudy: ["alumni", "program_of_study"],
    cw_eastmajor: ["alumni", "program_of_study"],
    department: ["alumni", "department"],
};

const DEGREE_FIELD_MAP = {
    surveytime: ["alumni_degrees", "survey_time"],
    degreecode: ["alumni_degrees", "degree_type"],
};

/**
 * Headers that are dual-role for EVERY survey version — past, current, and
 * future — as opposed to the caller-supplied `dualRoleHeaders` option on
 * buildRuntimeMappings(), which scopes a header to specific survey versions.
 *
 * cw_eastmajor lives here because no legacy survey version ever used this
 * header (so there's nothing to protect by scoping it), and every survey
 * version going forward should treat it as dual-role by default: write to
 * alumni.program_of_study AND get its own question/answer row.
 */
const ALWAYS_DUAL_ROLE_HEADERS = new Set([
    "cw_eastmajor",
]);

const METADATA_KEYS = new Set([
    "userlanguage", "distributionchannel", "locationlongitude", "locationlatitude",
    "externalreference", "responseid", "recordeddate", "finished", "durationinseconds",
    "progress", "ipaddress", "status", "enddate", "startdate", "college1",
    "reg_status_code", "term_code", "term_desc", "username", "department_desc",
    "major1_cipcode", "q_recaptchascore", "lastseenquestionids", "lastseenflowelementid", "RecordedDate", "Q_RecaptchaScore", "lastseenquestionids",
]);

/* -----------------------------------------------------------------------
 * Suffix parent-detection. Order matters — most specific first, so
 * "cw_rankeffective_0_1_RANK" hits the rank pattern before the generic
 * numbered pattern would greedily (and wrongly) match it as "..._1_RANK".
 * --------------------------------------------------------------------- */

const SUFFIX_PATTERNS = [
    { type: "rank", re: /^(.+)_(\d+)_(\d+)_RANK$/i },
    { type: "rank_group", re: /^(.+)_(\d+)_GROUP$/i },
    { type: "other_text", re: /^(.+)_(\d+)_TEXT$/i },
    { type: "numbered", re: /^(.+)_(\d+)$/i },
];

function splitSuffix(header) {
    for (const { type, re } of SUFFIX_PATTERNS) {
        const m = header.match(re);
        if (m) return { type, parentRaw: m[1] };
    }
    return { type: null, parentRaw: header };
}

/**
 * Core classifier: given a question code (may or may not carry a Qualtrics-style
 * suffix) and its human-readable text, works out field_role/question_type/
 * question_text/subquestion_text/option info. Shared by:
 *   - detectMapping()          — parsing response CSV headers
 *   - classifyStandaloneQuestion() — parsing a standalone questions CSV
 *     (question_code, question_text, question_type columns), used when the
 *     response CSV itself has no embedded question-text row.
 */
function classifySuffixedQuestion(code, rawText) {
    const { type, parentRaw } = splitSuffix(code);
    const meta = parseQuestionTextMetadata(code, rawText);
    const normalized = normalizeString(code);
    const parentCode = normalizeString(parentRaw);

    if (type === "other_text") {
        return {
            field_role: meta.isOtherText ? "other_text" : "conditional_text",
            question_code: normalized,
            question_group_code: parentCode,
            option_code: null,
            question_type: "conditional_text",
            question_text: meta.questionText,
            option_text: null,
            subquestion_text: meta.subquestionText,
        };
    }

    if (type === "rank") {
        return {
            field_role: "subquestion",
            question_code: normalized,
            question_group_code: parentCode,
            option_code: null,
            question_type: "ranking",
            question_text: meta.questionText,
            option_text: null,
            subquestion_text: meta.subquestionText,
        };
    }

    if (type === "rank_group") {
        return {
            field_role: "subquestion",
            question_code: normalized,
            question_group_code: parentCode,
            option_code: null,
            question_type: "ranking",
            question_text: meta.questionText,
            option_text: null,
            subquestion_text: meta.subquestionText || "Group",
        };
    }

    if (type === "numbered") {
        if (/-\s*Selected Choice\s*-/i.test(rawText || "")) {
            return {
                field_role: "option",
                question_code: parentCode,
                question_group_code: parentCode,
                option_code: normalized,
                question_type: "multi_select",
                question_text: meta.questionText,
                option_text: meta.optionText || normalized,
                subquestion_text: null,
            };
        }

        return {
            field_role: "subquestion",
            question_code: normalized,
            question_group_code: parentCode,
            option_code: null,
            question_type: "matrix",
            question_text: meta.questionText,
            option_text: null,
            subquestion_text: meta.subquestionText,
        };
    }

    const looksMultiSelect = /select all that apply/i.test(rawText || "");

    return {
        field_role: "question",
        question_code: normalized,
        question_group_code: normalized,
        option_code: null,
        question_type: looksMultiSelect ? "multi_select_list" : "single_select_or_text",
        question_text: meta.questionText,
        option_text: null,
        subquestion_text: meta.subquestionText,
    };
}

/**
 * Classifies a row from a standalone questions CSV (question_code,
 * question_text, question_type columns) — used by importQUESTIONCsvFile
 * to backfill question_text/subquestion_text/question_type for response
 * CSVs that don't carry an embedded question-text row of their own.
 *
 * explicitType, if provided and non-empty, wins over the inferred type
 * (the CSV author may know something the suffix pattern can't express).
 * Otherwise the type is inferred the same way detectMapping() infers it,
 * so both import paths classify e.g. "Plans_13_TEXT" or "engagement_3"
 * identically.
 */
export function classifyStandaloneQuestion(rawCode, rawText, explicitType) {
    // Strip stray Qualtrics/export annotations like a trailing "*" (required-field
    // marker) that sometimes rides along in header exports (e.g. "MAJOR1_CIPCODE*").
    const code = String(rawCode || "").trim().replace(/\*+$/, "");
    const classified = classifySuffixedQuestion(code, rawText);

    const cleanExplicitType = String(explicitType || "").trim();

    return {
        ...classified,
        question_type: cleanExplicitType || classified.question_type,
    };
}

/**
 * Takes a normalized header and the raw Qualtrics question-text row and maps
 * it to the appropriate table/column, or to a question/subquestion/option
 * within the dynamic survey-response schema.
 */
export function detectMapping(header, questionHeaderMap = {}, dualRoleHeaders = new Set()) {
    if (shouldIgnoreHeader(header)) return null;

    const normalized = normalizeString(header);
    const rawText = questionHeaderMap[header];
    const isDualRole = ALWAYS_DUAL_ROLE_HEADERS.has(normalized) || dualRoleHeaders.has(normalized);

    if (DIRECT_FIELD_MAP[normalized]) {
        const [target_table, target_column] = DIRECT_FIELD_MAP[normalized];
        return buildMapping({
            header, normalized, field_role: "alumni_field", target_table, target_column,
            also_question: isDualRole ? buildQuestionSubMapping(header, normalized, rawText) : null,
        });
    }

    if (DEGREE_FIELD_MAP[normalized]) {
        const [target_table, target_column] = DEGREE_FIELD_MAP[normalized];
        return buildMapping({
            header, normalized, field_role: "alumni_degree", target_table, target_column,
            also_question: isDualRole ? buildQuestionSubMapping(header, normalized, rawText) : null,
        });
    }

    if (METADATA_KEYS.has(normalized)) {
        return buildMapping({
            header, normalized, field_role: "metadata",
            target_table: "metadata", target_column: "metadata",
        });
    }

    const classified = classifySuffixedQuestion(header, rawText);

    return buildMapping({ header, normalized, ...classified });
}

/**
 * Builds the "also store this as a question too" sub-mapping for dual-role
 * headers (e.g. cw_eastmajor: goes to alumni.program_of_study for every
 * survey version, but ALSO needs its own question/answer row for the one
 * survey version where its values are a distinct, front-end-facing list of
 * programs rather than just a normalization target).
 */
function buildQuestionSubMapping(header, normalized, rawText) {
    const classified = classifySuffixedQuestion(header, rawText);
    return buildMapping({ header, normalized, ...classified });
}

function buildMapping({
    header, normalized, field_role,
    question_code = null, question_group_code = null, option_code = null,
    target_table = null, target_column = null,
    question_text = null, option_text = null, subquestion_text = null,
    question_type = null,
    also_question = null,
}) {
    return {
        raw_column_name: header,
        normalized_column_name: normalized,
        field_role,
        question_code,
        // question_group_code: shared key across a matrix/rank/conditional-text
        // group's sibling columns, for display/reporting grouping ONLY. It is
        // NOT unique and must never be used as a DB primary/unique key —
        // that's exactly what caused the data loss. If your `questions` table
        // doesn't have this column yet, it's safe to drop this field before
        // inserting, or add a nullable `question_group_code` column to use it.
        question_group_code,
        option_code,
        target_table,
        target_column,
        question_text,
        option_text,
        subquestion_text,
        question_type,
        // also_question: set ONLY for dual-role headers (see buildRuntimeMappings'
        // dualRoleHeaders option). When present, your import code needs to do
        // TWO writes for this column instead of one: the normal write implied by
        // field_role/target_table/target_column (e.g. alumni.program_of_study),
        // PLUS an upsert into the question table using this sub-mapping's own
        // question_code/question_text/question_type/subquestion_text — exactly
        // like any other field_role: "question" mapping. also_question is never
        // itself dual-role (no infinite nesting).
        also_question,
    };
}

/* -----------------------------------------------------------------------
 * Parses the human-readable Qualtrics question-text row into structured
 * pieces. Patterns are checked from most-specific to least-specific;
 * the final fallback just splits on the last " - ", which correctly
 * handles plain matrix rows and multi-field questions.
 * --------------------------------------------------------------------- */

function parseQuestionTextMetadata(rawHeader, questionHeaderText) {
    const header = String(rawHeader || "").trim();
    const fullText = String(questionHeaderText || "").trim();

    if (!fullText) {
        return {
            questionText: null,
            optionText: null,
            subquestionText: null,
            isOtherText: /_TEXT$/i.test(header),
        };
    }

    // "<question> - Selected Choice - <option>"  (one-hot recoded multi-select)
    const selectedChoiceMatch = fullText.match(/^(.*)\s-\sSelected Choice\s-\s(.*)$/i);
    if (selectedChoiceMatch) {
        return {
            questionText: selectedChoiceMatch[1].trim(),
            optionText: selectedChoiceMatch[2].trim(),
            subquestionText: null,
            isOtherText: false,
        };
    }

    // "<question> - <trigger choice> - Text"  — generalized, NOT hardcoded to "Other".
    // Covers "... - Other - Text", "... - Yes - Text", "... - No - Text", etc.
    const conditionalTextMatch = fullText.match(/^(.*)\s-\s([^-]+?)\s-\sText$/i);
    if (conditionalTextMatch) {
        const trigger = conditionalTextMatch[2].trim();
        return {
            questionText: conditionalTextMatch[1].trim(),
            optionText: null,
            subquestionText: trigger,
            isOtherText: /^other$/i.test(trigger),
        };
    }

    // "<question> - Ranks - <group label> - <item> - Rank"
    const rankItemMatch = fullText.match(/^(.*)\s-\sRanks\s-\s.*\s-\s(.*)\s-\sRank$/i);
    if (rankItemMatch) {
        return {
            questionText: rankItemMatch[1].trim(),
            optionText: null,
            subquestionText: rankItemMatch[2].trim(),
            isOtherText: false,
        };
    }

    // "<question> - Groups - <group label>"  (rank group-assignment column)
    const rankGroupMatch = fullText.match(/^(.*)\s-\sGroups\s-\s(.*)$/i);
    if (rankGroupMatch) {
        return {
            questionText: rankGroupMatch[1].trim(),
            optionText: null,
            subquestionText: rankGroupMatch[2].trim(),
            isOtherText: false,
        };
    }

    // "<question> - Selected Choice"  (bare — single delimited-string column)
    const bareSelectedChoiceMatch = fullText.match(/^(.*)\s-\sSelected Choice$/i);
    if (bareSelectedChoiceMatch) {
        return {
            questionText: bareSelectedChoiceMatch[1].trim(),
            optionText: null,
            subquestionText: null,
            isOtherText: false,
        };
    }

    // Fallback: split on the LAST " - " (plain matrix rows / multi-field questions)
    const { questionText, subquestionText } = splitQuestionAndSubquestion(fullText);

    return {
        questionText,
        optionText: null,
        subquestionText,
        isOtherText: /_TEXT$/i.test(header),
    };
}

/*
 * Splits a full question into the main parent question and subquestion text
 * for matrix, multi-field, and ranking questions.
 */
export function splitQuestionAndSubquestion(fullText) {
    const text = String(fullText || "").trim();

    if (!text) {
        return { questionText: null, subquestionText: null };
    }

    // Don't split special formats already handled by dedicated patterns above.
    if (/ - Selected Choice( - |$)/i.test(text) || / - Other - Text$/i.test(text)) {
        return { questionText: text, subquestionText: null };
    }

    const lastDashIndex = text.lastIndexOf(" - ");
    if (lastDashIndex === -1) {
        return { questionText: text, subquestionText: null };
    }

    const stem = text.slice(0, lastDashIndex).trim();
    const sub = text.slice(lastDashIndex + 3).trim();

    if (!stem || !sub) {
        return { questionText: text, subquestionText: null };
    }

    return { questionText: stem, subquestionText: sub };
}

export function detectDelimiter(line) {
    const tabCount = (line.match(/\t/g) || [])?.length;
    const commaCount = (line.match(/,/g) || [])?.length;

    if (tabCount > 0) return "\t";
    return commaCount > 0 ? "," : ",";
}

export async function parseResponseCsv(filePath, fromAdminPage) {
    const firstChunk = await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath, { encoding: "utf8" });
        let buffer = "";

        stream.on("data", (chunk) => {
            buffer += chunk;
            const firstNewline = buffer.indexOf("\n");
            if (firstNewline !== -1) {
                stream.destroy();
                resolve(buffer.slice(0, firstNewline).replace(/\r$/, ""));
            }
        });

        stream.on("error", reject);
        stream.on("close", () => {
            if (buffer?.length > 0) {
                resolve(buffer.replace(/\r$/, ""));
            }
        });
    });

    const firstLine = String(firstChunk || "").replace(/^\uFEFF/, "");
    const delimiter = detectDelimiter(firstLine);

    const previewRows = await new Promise((resolve, reject) => {
        const parsedRows = [];

        fs.createReadStream(filePath)
            .pipe(csv({ separator: delimiter, headers: false, strict: false }))
            .on("data", (data) => {
                parsedRows.push(data);
                if (parsedRows?.length === 2) resolve(parsedRows);
            })
            .on("end", () => resolve(parsedRows))
            .on("error", reject);
    });

    if (!previewRows?.length) {
        throw new Error("Uploaded CSV is empty.");
    }

    const machineHeaders = Object.values(previewRows[0])?.map((v) =>
        String(v || "").replace(/^\uFEFF/, "").trim()
    );

    const questionHeaderMap = {};

    if (fromAdminPage) {
        for (const header of machineHeaders) {
            questionHeaderMap[header] = header;
        }
    }

    if (!fromAdminPage) {
        if (previewRows?.length < 2) {
            throw new Error("CSV must contain both machine headers and question text headers.");
        }

        const secondPhysicalRowValues = Object.values(previewRows[1])?.map((v) =>
            String(v || "").trim()
        );

        for (let i = 0; i < machineHeaders?.length; i++) {
            questionHeaderMap[machineHeaders[i]] = secondPhysicalRowValues[i] || "";
        }

        const qualtricsMetadataHeaders = {
            StartDate: "Start Date",
            EndDate: "End Date",
            ResponseId: "Response ID",
            UserLanguage: "User Language",
        };

        let matches = 0;

        for (const [machineHeader, displayHeader] of Object.entries(qualtricsMetadataHeaders)) {
            const idx = machineHeaders.indexOf(machineHeader);

            if (idx >= 0) {
                const value = (secondPhysicalRowValues[idx] || "").trim();
                if (value === displayHeader) matches++;
            }
        }

        if (matches < 3) {
            throw new Error("CSV appears to be missing the Qualtrics question header row.");
        }
    }

    const rows = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({ separator: delimiter, headers: machineHeaders, skipLines: 2, strict: false }))
            .on("data", (data) => rows.push(data))
            .on("end", resolve)
            .on("error", reject);
    });

    return { rows, machineHeaders, questionHeaderMap, delimiter };
}

export async function parseEmploymentCsv(filePath) {
    const rows = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", resolve)
            .on("error", reject);
    });

    if (!rows?.length) {
        throw new Error("Uploaded CSV is empty.");
    }

    const headers = Object.keys(rows[0]);

    return { rows, headers };
}


export async function parseAlumniOriginalFile(filePath) {
    const rows = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", resolve)
            .on("error", reject);
    });

    if (!rows?.length) {
        throw new Error("Uploaded CSV is empty.");
    }

    const headers = Object.keys(rows[0]);

    return { rows, headers };
}

/*
 * Imports a standalone "questions" CSV (question_code, question_text,
 * question_type columns) — used AFTER a response CSV has already been
 * uploaded, for response CSVs that don't carry an embedded question-text
 * row of their own (so question_text/subquestion_text/question_type have
 * to be backfilled from this companion file instead).
 *
 * NOTE: This reuses classifyStandaloneQuestion(), the same suffix-aware
 * classifier detectMapping() uses for header-embedded question text, so a
 * code like "Plans_13_TEXT" or "engagement_3" gets the same question_text /
 * subquestion_text / question_type split and the same "matrix" / "ranking" /
 * "conditional_text" inference regardless of which import path it came
 * through. The CSV's own question_type column still wins when provided —
 * inference only fills the gap when that column is blank.
 *
 * ------------------------------------------------------------
 * NOTE: This function only controls the uploading of a CSV
 * containing question details AFTER the responses have already been
 * uploaded
 * ------------------------------------------------------------
 */
export async function importQUESTIONCsvFile(filePath, surveyVersionId) {
    const rows = [];

    if (!surveyVersionId) {
        throw new Error("surveyVersionId is required to import questions.");
    }

    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", resolve)
            .on("error", reject);
    });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const row of rows) {
            const raw_question_code = row.question_code?.trim();
            const raw_question_text = row.question_text?.trim();
            const raw_question_type = row.question_type?.trim();

            if (!raw_question_code || !raw_question_text) {
                console.log("Skipping row because required fields are missing:", row);
                continue;
            }

            // classifyStandaloneQuestion() handles suffix stripping (incl. a
            // stray trailing "*") and lowercasing internally via
            // normalizeString — no need to .toLowerCase() here separately.
            const {
                question_code,
                question_group_code,
                question_text,
                subquestion_text,
                question_type,
                field_role,
            } = classifyStandaloneQuestion(raw_question_code, raw_question_text, raw_question_type);

            const [existingRows] = await connection.query(`
                    SELECT question_id
                    FROM question
                    WHERE survey_version_id = ?
                    AND question_code = ?
                `, [surveyVersionId, question_code]);

            if (existingRows?.length > 0) {
                await connection.query(`
                    UPDATE question
                    SET
                        question_text = COALESCE(?, question_text),
                        subquestion_text = COALESCE(?, subquestion_text),
                        question_type = COALESCE(?, question_type)
                    WHERE question_code = ?
                    AND survey_version_id = ?
                `, [
                    question_text,
                    subquestion_text,
                    question_type,
                    question_code,
                    surveyVersionId
                ]);
            }
            // else {
            //     await connection.query(
            //         `INSERT INTO question (
            //         survey_version_id,
            //         question_code,
            //         question_text,
            //         subquestion_text,
            //         question_category,
            //         question_type
            //     )
            //      VALUES (?, ?, ?, ?, ?, ?)`,
            //         [
            //             surveyVersionId,
            //             question_code,
            //             question_text,
            //             subquestion_text,
            //             "Uncategorized",
            //             question_type
            //         ]
            //     );
            // }
            //
            // NOTE: field_role / question_group_code are also available here
            // (from classifyStandaloneQuestion) if you want to persist them
            // once the `question` table has columns for them — same caveat
            // as before: question_group_code is a shared, NON-unique key for
            // display/reporting grouping only, never a lookup/unique key.

        }

        await connection.commit();

        return {
            success: true,
            rowsImported: rows?.length
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}