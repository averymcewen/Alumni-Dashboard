export default function normalizeString(header) {
    return String(header || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w]/g, "")
        .replace(/-/g, "")
        .replace(/,/g, '');
}