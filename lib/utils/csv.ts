function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Spreadsheets run cells starting with = + - @ tab or CR as formulas. A leading
// ' makes them text. Strings only, so numbers (incl. negatives) stay numbers.
function neutralizeFormula(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'string' && /^[=+\-@\t\r]/.test(cell)) return `'${cell}`
  return String(cell)
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(neutralizeFormula(cell))).join(',')
  )
  // Prefix with a UTF-8 BOM so Excel detects the encoding correctly.
  return '﻿' + lines.join('\r\n')
}
