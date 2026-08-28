import { DEGREE_CODE_MAP } from "./degreeCodes.js";
import { DEPARTMENT_ABBR_MAP } from "./departmentABBRMap.js";
import { CORRECT_PROGRAM_NAMES } from "./correctProgramNames.js";
import { normalizeCompanyName } from "./employerNameNormalizer.js";

export function getProgramOfStudy(code) {
    return DEGREE_CODE_MAP[code] || null;
}

export function normalizeDepartment(deptCode) {
    if (!deptCode) return null;

    const cleaned = deptCode.trim().toUpperCase();

    return DEPARTMENT_ABBR_MAP[cleaned] || deptCode;
}

export function normalizeInconsistentDepartment(deptCode) {
    if (!deptCode) return null;

    return CORRECT_PROGRAM_NAMES[deptCode] || deptCode;
}

export function parseSurveyTime(value) {
    if (!value) return [null, null];

    let [term, year] = [];

    if (value.includes(" ")) {
        [term, year] = value.trim().split(/\s+/);
    }
    // for survey_times like "Spring2024"
    else {
        [term, year] = value.trim().split(/(\d+)/);
    }

    return [
        term || null,
        year ? parseInt(year) : null
    ];
}

