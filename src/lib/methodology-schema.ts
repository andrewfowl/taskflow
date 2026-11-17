// Shared (client + server) model for methodology schemas and the entries
// filled in against them. Stored as JSON on Methodology.schema /
// MethodologyEntry.data; everything read from the DB goes through
// parseSchema so older or hand-written schemas keep working.

export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Single choice" },
  { value: "multiselect", label: "Multiple choice" },
  { value: "checkbox", label: "Yes / no" },
  { value: "rating", label: "Rating (1–5)" },
  { value: "date", label: "Date" },
  { value: "url", label: "Link" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];

const FIELD_TYPE_SET = new Set<string>(FIELD_TYPES.map((t) => t.value));

export function fieldTypeLabel(type: FieldType) {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function typeHasOptions(type: FieldType) {
  return type === "select" || type === "multiselect";
}

export type MethodologyField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: string[];
};

export type MethodologySection = {
  key: string;
  title: string;
  description?: string;
  // Repeatable sections collect a list of rows (e.g. one per source or issue).
  repeatable?: boolean;
  itemLabel?: string;
  fields: MethodologyField[];
};

export type MethodologySchema = { sections: MethodologySection[] };

export type FieldValue = string | number | boolean | string[] | null;
export type EntryRow = Record<string, FieldValue>;
export type EntryData = Record<string, FieldValue | EntryRow[]>;

const LIMITS = { sections: 30, fields: 40, options: 50, rows: 100, label: 200, help: 500, shortText: 2000, longText: 20000 };

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, max = LIMITS.label) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function toKey(label: string) {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .slice(0, 48);
}

function uniqueKey(base: string, used: Set<string>, fallback: string) {
  const root = base || fallback;
  let key = root;
  let n = 2;
  while (used.has(key)) key = `${root}_${n++}`;
  used.add(key);
  return key;
}

export function splitOptions(text: string) {
  return [...new Set(text.split("\n").map((o) => o.trim()).filter(Boolean))].slice(0, LIMITS.options);
}

// Lenient: normalises any stored or submitted value into a usable schema,
// filling in missing keys/labels. Entry data keys (flat fields and repeatable
// section keys) share one namespace so they never collide.
export function parseSchema(raw: unknown): MethodologySchema {
  const sectionsRaw = isObject(raw) && Array.isArray(raw.sections) ? raw.sections : [];
  const used = new Set<string>();

  const sections = sectionsRaw
    .filter(isObject)
    .slice(0, LIMITS.sections)
    .map((s, si): MethodologySection => {
      const title = str(s.title) || `Section ${si + 1}`;
      const repeatable = s.repeatable === true;
      const rowKeys = new Set<string>();
      const fields = (Array.isArray(s.fields) ? s.fields : [])
        .filter(isObject)
        .slice(0, LIMITS.fields)
        .map((f, fi): MethodologyField => {
          const label = str(f.label) || `Field ${fi + 1}`;
          const type = (FIELD_TYPE_SET.has(f.type as string) ? f.type : "text") as FieldType;
          const field: MethodologyField = {
            key: uniqueKey(toKey(str(f.key) || label), repeatable ? rowKeys : used, `field_${fi + 1}`),
            label,
            type,
          };
          if (f.required === true) field.required = true;
          const help = str(f.help, LIMITS.help);
          if (help) field.help = help;
          if (typeHasOptions(type)) {
            field.options = Array.isArray(f.options)
              ? [...new Set(f.options.map((o) => str(o)).filter(Boolean))].slice(0, LIMITS.options)
              : [];
          }
          return field;
        });

      const section: MethodologySection = {
        key: uniqueKey(toKey(str(s.key) || title), used, `section_${si + 1}`),
        title,
        fields,
      };
      const description = str(s.description, LIMITS.help);
      if (description) section.description = description;
      if (repeatable) {
        section.repeatable = true;
        const itemLabel = str(s.itemLabel, 60);
        if (itemLabel) section.itemLabel = itemLabel;
      }
      return section;
    });

  return { sections };
}

// Strict: used before saving a methodology.
export function validateSchema(raw: unknown): { schema: MethodologySchema } | { error: string } {
  const schema = parseSchema(raw);
  if (schema.sections.length === 0) return { error: "Add at least one section." };
  for (const section of schema.sections) {
    if (section.fields.length === 0) return { error: `"${section.title}" needs at least one field.` };
    for (const field of section.fields) {
      if (typeHasOptions(field.type) && (field.options?.length ?? 0) < 2) {
        return { error: `"${field.label}" needs at least two options.` };
      }
    }
  }
  return { schema };
}

export function isEmptyValue(v: unknown) {
  return v === null || v === undefined || v === "" || v === false || (Array.isArray(v) && v.length === 0);
}

function coerce(field: MethodologyField, v: unknown): { value: FieldValue; error?: string } {
  switch (field.type) {
    case "text":
      return { value: str(v, LIMITS.shortText) };
    case "textarea":
      return { value: str(v, LIMITS.longText) };
    case "url": {
      const s = str(v, LIMITS.shortText);
      if (!s) return { value: "" };
      try {
        const url = new URL(s);
        if (url.protocol === "http:" || url.protocol === "https:") return { value: url.toString() };
      } catch {}
      return { value: s, error: "must be a link starting with http:// or https://" };
    }
    case "date": {
      const s = str(v, 10);
      if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) return { value: s, error: "must be a date" };
      return { value: s };
    }
    case "number": {
      if (v === null || v === undefined || v === "") return { value: null };
      const n = typeof v === "number" ? v : Number(String(v).trim());
      return Number.isFinite(n) ? { value: n } : { value: null, error: "must be a number" };
    }
    case "checkbox":
      return { value: v === true || v === "true" || v === "on" };
    case "rating": {
      const n = Number(v);
      return { value: Number.isInteger(n) && n >= 1 && n <= 5 ? n : null };
    }
    case "select": {
      const s = str(v);
      return { value: field.options?.includes(s) ? s : "" };
    }
    case "multiselect": {
      const picked = Array.isArray(v) ? v.map((o) => str(o)) : [];
      return { value: (field.options ?? []).filter((o) => picked.includes(o)) };
    }
  }
}

// Validates submitted entry data against the schema and drops anything the
// schema doesn't define.
export function sanitizeEntry(schema: MethodologySchema, raw: unknown): { data: EntryData; errors: string[] } {
  const src = isObject(raw) ? raw : {};
  const data: EntryData = {};
  const errors: string[] = [];

  const readFields = (section: MethodologySection, rowSrc: Record<string, unknown>, where: string) => {
    const row: EntryRow = {};
    for (const field of section.fields) {
      const { value, error } = coerce(field, rowSrc[field.key]);
      row[field.key] = value;
      if (error) errors.push(`${where}"${field.label}" ${error}`);
    }
    return row;
  };

  for (const section of schema.sections) {
    if (section.repeatable) {
      const rowsRaw = Array.isArray(src[section.key]) ? (src[section.key] as unknown[]) : [];
      const rows = rowsRaw
        .slice(0, LIMITS.rows)
        .map((r, i) => readFields(section, isObject(r) ? r : {}, `${section.itemLabel || section.title} ${i + 1}: `))
        .filter((row) => Object.values(row).some((v) => !isEmptyValue(v)));
      rows.forEach((row, i) => {
        for (const field of section.fields) {
          if (field.required && isEmptyValue(row[field.key])) {
            errors.push(`${section.itemLabel || section.title} ${i + 1}: "${field.label}" is required`);
          }
        }
      });
      data[section.key] = rows;
    } else {
      const row = readFields(section, src, "");
      for (const field of section.fields) {
        if (field.required && isEmptyValue(row[field.key])) errors.push(`"${field.label}" is required`);
      }
      Object.assign(data, row);
    }
  }

  return { data, errors };
}

export function entryHasContent(data: EntryData) {
  return Object.values(data).some((v) =>
    Array.isArray(v) && v.length > 0 && isObject(v[0]) ? true : !isEmptyValue(v),
  );
}
