// Sheets: a project holds any number of drawing sheets. Each sheet is one page of a PDF
// (several sheets can share one PDF), with its own scale and its own rooms.
// Coordinates on a sheet are PDF points of that page, so a room never needs converting.
import type { Room } from '../rooms';
import { scaleFeetPerPoint } from '../geometry';

export type SheetData = {
  id: string;
  name: string;
  pdfId: string | null;      // which stored PDF this sheet shows (null = no background)
  page: number;              // 1-based page of that PDF
  scale: string;             // a value from geometry `scales`, or 'custom'
  customFeetPerPoint: number | null;
  rooms: Room[];
};

export type SavedPdf = { id: string; name: string; base64: string };

export const sheetFeetPerPoint = (s: { scale: string; customFeetPerPoint: number | null }): number | null =>
  s.scale === 'custom' ? s.customFeetPerPoint : scaleFeetPerPoint(s.scale);

// "Plan.pdf" + page 3 of 12 -> "Plan p3"; single-page PDFs keep the file name.
export function sheetNameFor(fileName: string, page: number, numPages: number): string {
  const base = fileName.replace(/\.pdf$/i, '');
  return numPages > 1 ? `${base} p${page}` : base;
}

// Parse a page list typed by the user: "all", "3", "1-4, 7". Returns sorted unique pages, or null if invalid.
export function parsePages(text: string, numPages: number): number[] | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (t === 'all' || t === '*') return Array.from({ length: numPages }, (_, i) => i + 1);
  const out = new Set<number>();
  for (const part of t.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > numPages) return null;
    for (let p = a; p <= b; p++) out.add(p);
  }
  return out.size ? [...out].sort((x, y) => x - y) : null;
}
