/**
 * Minimal reader for phpMyAdmin / mysqldump SQL exports: CREATE TABLE column lists and
 * INSERT INTO … VALUES (…),(…); rows. No MySQL server is needed for the migration.
 */

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

/** Splits the dump into statements, respecting quotes and comments. */
function* statements(sql: string): Generator<string> {
  let start = 0;
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < n) {
        if (sql[i] === '\\' && q !== '`') i += 2;
        else if (sql[i] === q) {
          if (sql[i + 1] === q) i += 2; // doubled quote
          else break;
        } else i++;
      }
      i++;
      continue;
    }
    if (c === '-' && sql[i + 1] === '-' && (sql[i + 2] === ' ' || sql[i + 2] === '\n' || sql[i + 2] === '\r')) {
      const end = sql.indexOf('\n', i);
      i = end < 0 ? n : end + 1;
      if (sql.slice(start, i).trim().startsWith('--')) start = i;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === ';') {
      const stmt = sql.slice(start, i).trim();
      if (stmt) yield stmt;
      start = i + 1;
    }
    i++;
  }
  const tail = sql.slice(start).trim();
  if (tail) yield tail;
}

const ESCAPES: Record<string, string> = { n: '\n', r: '\r', t: '\t', '0': '\0', b: '\b', Z: '\x1a' };

/** Parses "(1,'a\'b',NULL),(2,…)" into value arrays. */
export function parseTuples(text: string): SqlValue[][] {
  const rows: SqlValue[][] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    while (i < n && text[i] !== '(') i++;
    if (i >= n) break;
    i++;
    const row: SqlValue[] = [];
    for (;;) {
      while (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t') i++;
      if (text[i] === "'" || text[i] === '"') {
        const q = text[i++];
        let s = '';
        while (i < n) {
          const ch = text[i] as string;
          if (ch === '\\') {
            const nx = text[i + 1] as string;
            s += ESCAPES[nx] ?? nx;
            i += 2;
          } else if (ch === q) {
            if (text[i + 1] === q) {
              s += q;
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            s += ch;
            i++;
          }
        }
        row.push(s);
      } else {
        let j = i;
        while (j < n && text[j] !== ',' && text[j] !== ')') j++;
        const raw = text.slice(i, j).trim();
        i = j;
        if (/^null$/i.test(raw)) row.push(null);
        else if (/^-?\d+(\.\d+)?(e[-+]?\d+)?$/i.test(raw)) row.push(Number(raw));
        else row.push(raw.replace(/^_binary\s*/i, ''));
      }
      while (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t') i++;
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === ')') {
        i++;
        break;
      }
      throw new Error(`Unexpected character "${text[i]}" at ${i} while reading a row`);
    }
    rows.push(row);
  }
  return rows;
}

const unquote = (s: string) => s.trim().replace(/^[`"]|[`"]$/g, '');

/** All tables of a dump: name → rows (objects keyed by column name). */
export function readDump(sql: string): Map<string, Row[]> {
  const columns = new Map<string, string[]>();
  const tables = new Map<string, Row[]>();
  for (const stmt of statements(sql)) {
    const create = stmt.match(/^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]*)\)[^)]*$/i);
    if (create) {
      // Column definitions start (after "(" or ",") with a quoted name and a type; keys
      // ("PRIMARY KEY (`id`)") and "decimal(10,2)" commas don't match.
      const cols = [...(create[2] as string).matchAll(/(?:^|,)\s*[`"](\w+)[`"]\s+[a-z]/gi)].map((m) => m[1] as string);
      columns.set(create[1] as string, cols);
      continue;
    }
    const insert = stmt.match(/^INSERT\s+(?:IGNORE\s+)?INTO\s+[`"]?(\w+)[`"]?\s*(\(([^)]*)\))?\s*VALUES\s*([\s\S]*)$/i);
    if (!insert) continue;
    const table = insert[1] as string;
    const cols = insert[3] ? insert[3].split(',').map(unquote) : columns.get(table);
    if (!cols) throw new Error(`INSERT into ${table} without a column list and no CREATE TABLE before it`);
    const list = tables.get(table) ?? [];
    for (const values of parseTuples(insert[4] as string)) {
      list.push(Object.fromEntries(cols.map((c, k) => [c, values[k] ?? null])));
    }
    tables.set(table, list);
  }
  for (const name of columns.keys()) if (!tables.has(name)) tables.set(name, []);
  return tables;
}
