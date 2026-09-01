import { normalizeCompanyName } from "./Maps for Normalizing/employerNameNormalizer.js";

export async function findEmployer(connection, employerName) {
    if (!employerName) {
        return {
            employerId: null,
            altEmployerName: null
        };
    }

    const normalizedEmployer =
        normalizeCompanyName(employerName);

    const [rows] = await connection.query(
        `SELECT employer_id
         FROM employer
         WHERE employer_name = ?`,
        [normalizedEmployer]
    );

    if (rows?.length) {
        return {
            employerId: rows[0].employer_id,
            altEmployerName: null
        };
    }

    return {
        employerId: null,
        altEmployerName: employerName
    };
}


// export async function parseSalary(input) {
//     if (!input) return null;

//     const text = input.toLowerCase().trim();

//     if (
//         text.includes("no answer") ||
//         text === "" ||
//         text === "n/a"
//     ) {
//         return null;
//     }

//     // hourly rate
//     const hourlyMatch = text.match(/(\d+(?:\.\d+)?)\s*\/?\s*hr/);

//     if (hourlyMatch) {
//         const annual = Number(hourlyMatch[1]) * 2080;

//         return {
//             minSalary: annual,
//             maxSalary: annual,
//             estimatedSalary: annual,
//             confidence: "hourly"
//         };
//     }

//     // ranges like 60-80k
//     const rangeMatch = text.match(
//         /(\d+(?:,\d+)?)\s*k?\s*-\s*(\d+(?:,\d+)?)\s*k?/
//     );

//     if (rangeMatch) {
//         const min = Number(rangeMatch[1].replace(/,/g, "")) * 1000;
//         const max = Number(rangeMatch[2].replace(/,/g, "")) * 1000;

//         return {
//             minSalary: min,
//             maxSalary: max,
//             estimatedSalary: (min + max) / 2,
//             confidence: "range"
//         };
//     }

//     // typos like $96,000k
//     if (text.includes(",") && text.includes("k")) {
//         const value = Number(text.replace(/[^\d]/g, ""));

//         return {
//             minSalary: value,
//             maxSalary: value,
//             estimatedSalary: value,
//             confidence: "estimate"
//         };
//     }

//     // open-ended
//     const overMatch = text.match(
//         /(over|>|>=)?\s*\$?(\d+(?:,\d+)?)k?\+?/
//     );

//     if (overMatch) {
//         let value = Number(overMatch[2].replace(/,/g, ""));

//         if (
//             text.includes("k") ||
//             value < 1000
//         ) {
//             value *= 1000;
//         }

//         return {
//             minSalary: value,
//             maxSalary: value,
//             estimatedSalary: value,
//             confidence: text.includes("+") ||
//                 text.includes(">") ||
//                 text.includes("over")
//                 ? "estimate"
//                 : "exact"
//         };
//     }

//     return null;
// }