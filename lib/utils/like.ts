// Pattern for ILIKE "contains": escapes \ % _ so user input matches literally
// (Postgres' default LIKE escape character is the backslash).
export const containsPattern = (search: string) => `%${search.replace(/[\\%_]/g, "\\$&")}%`
