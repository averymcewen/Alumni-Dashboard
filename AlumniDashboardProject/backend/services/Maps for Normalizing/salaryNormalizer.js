// salaryNormalizer.js

// Canonical bucket labels, in order — used both for output and for building ranges.
const SALARY_BUCKETS = [
    { label: '< $30,000', min: 0, max: 29999 },
    { label: '$30,000 - $39,999', min: 30000, max: 39999 },
    { label: '$40,000 - $49,999', min: 40000, max: 49999 },
    { label: '$50,000 - $59,999', min: 50000, max: 59999 },
    { label: '$60,000 - $69,999', min: 60000, max: 69999 },
    { label: '$70,000 - $79,999', min: 70000, max: 79999 },
    { label: '$80,000 - $89,999', min: 80000, max: 89999 },
    { label: '$90,000+', min: 90000, max: Infinity },
];

// Direct lookup for survey responses that are ALREADY pre-bucketed strings
// (e.g. the cw_salary column). Keys are normalized (trimmed, no commas)
// to make matching resilient to minor formatting differences across sources.
const bucketedStringMap = {
    '< $30,000': '< $30,000',
    '$30,000 - $39,999': '$30,000 - $39,999',
    '$40,000 - $49,999': '$40,000 - $49,999',
    '$50,000 - $59,999': '$50,000 - $59,999',
    '$60,000 - $69,999': '$60,000 - $69,999',
    '$70,000 - $79,999': '$70,000 - $79,999',
    '$80,000 - $89,999': '$80,000 - $89,999',
    '$90,000+': '$90,000+',
    // Legacy/alternate phrasings some older survey versions might use —
    // add more as you encounter them in older source columns.
    'Under $30,000': '< $30,000',
    '$90,000 or more': '$90,000+',
    '$90,000 and above': '$90,000+',
};

/**
 * Buckets a raw numeric income into one of the canonical salary ranges.
 */
function bucketNumericIncome(num) {
    const bucket = SALARY_BUCKETS.find(b => num >= b.min && num <= b.max);
    return bucket ? bucket.label : null;
}

/**
 * Normalizes a single salary/income value, regardless of which source
 * column format it came from, into one of the 8 canonical buckets.
 *
 * Handles:
 *  - Pre-bucketed strings (e.g. "$40,000 - $49,999") — direct lookup
 *  - Raw numeric strings/numbers (e.g. "32760", 100000) — bucketed by range
 *  - Ambiguous small numbers (e.g. "50", "25") — assumed to be entered
 *    in thousands, per SHORTHAND_THRESHOLD below. Flag these for review.
 *
 * @param {string|number} salary
 * @param {object} [options]
 * @param {number} [options.shorthandThreshold=1000] - raw values below this
 *   are treated as "entered in thousands" (e.g. 50 -> 50000). Set to 0 to
 *   disable this heuristic entirely if you'd rather leave ambiguous values
 *   as-is (they'll bucket into "< $30,000").
 * @returns {string|null} one of the 8 canonical bucket labels, or null
 */
export function normalizeSalary(salary, options = {}) {
    const { shorthandThreshold = 1000 } = options;

    if (salary === null || salary === undefined) return null;

    const cleaned = String(salary).trim();
    if (!cleaned) return null;

    // 1. Try direct match against known pre-bucketed strings first.
    if (bucketedStringMap[cleaned]) {
        return bucketedStringMap[cleaned];
    }

    // 2. Otherwise, treat it as a raw number. Strip $ and commas so
    //    "$32,760" and "32760" both parse the same way.
    const numeric = Number(cleaned.replace(/[$,]/g, ''));

    if (Number.isNaN(numeric)) {
        // Unrecognized format — couldn't match a string or parse a number.
        console.warn(`normalizeSalary: unrecognized value "${salary}"`);
        return null;
    }

    // 3. Apply shorthand heuristic for suspiciously small raw numbers
    //    (e.g. someone typed "50" meaning $50,000).
    const adjusted =
        shorthandThreshold > 0 && numeric > 0 && numeric < shorthandThreshold
            ? numeric * 1000
            : numeric;

    return bucketNumericIncome(adjusted);
}

export function getNormalizedSalary(row) {
    // Prefer the pre-bucketed survey column if present; fall back to raw income.
    return normalizeSalary(row.cw_salary) ?? normalizeSalary(row.income);
}

export default normalizeSalary;