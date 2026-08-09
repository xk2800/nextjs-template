function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(cell === null || cell === undefined ? '' : String(cell))).join(',')
  )
  // Prefix with a UTF-8 BOM so Excel detects the encoding correctly.
  return '﻿' + lines.join('\r\n')
}
