"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isObject,
  type EntryData,
  type EntryRow,
  type FieldValue,
  type MethodologyField,
  type MethodologySection,
  type MethodologySchema,
} from "@/lib/methodology-schema";

const CHOICE_PILL =
  "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 border-gray-300 text-gray-700 hover:bg-gray-50";

export function EntryFields({
  schema,
  value,
  onChange,
  idPrefix,
}: {
  schema: MethodologySchema;
  value: EntryData;
  onChange: (next: EntryData) => void;
  idPrefix: string;
}) {
  if (schema.sections.length === 0) {
    return <p className="text-sm text-gray-400">Add a section to see the form.</p>;
  }
  return (
    <div className="space-y-6">
      {schema.sections.map((section) => (
        <fieldset key={section.key} className="min-w-0">
          <legend className="text-sm font-semibold text-gray-900">{section.title}</legend>
          {section.description && <p className="mt-0.5 text-xs text-gray-500">{section.description}</p>}
          <div className="mt-3 space-y-4">
            {section.repeatable ? (
              <RepeatableRows section={section} value={value} onChange={onChange} idPrefix={idPrefix} />
            ) : (
              section.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  id={`${idPrefix}-${field.key}`}
                  field={field}
                  value={(value[field.key] as FieldValue) ?? null}
                  onChange={(v) => onChange({ ...value, [field.key]: v })}
                />
              ))
            )}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function RepeatableRows({
  section,
  value,
  onChange,
  idPrefix,
}: {
  section: MethodologySection;
  value: EntryData;
  onChange: (next: EntryData) => void;
  idPrefix: string;
}) {
  const stored = value[section.key];
  const rows: EntryRow[] = Array.isArray(stored) && stored.length > 0 && stored.every(isObject) ? (stored as EntryRow[]) : [{}];
  const itemLabel = section.itemLabel || "Item";
  const setRows = (next: EntryRow[]) => onChange({ ...value, [section.key]: next });

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {itemLabel} {i + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {section.fields.map((field) => (
              <FieldInput
                key={field.key}
                id={`${idPrefix}-${section.key}-${i}-${field.key}`}
                field={field}
                value={row[field.key] ?? null}
                onChange={(v) => setRows(rows.map((r, j) => (j === i ? { ...r, [field.key]: v } : r)))}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn-ghost px-2 py-1 text-brand-700" onClick={() => setRows([...rows, {}])}>
        <Plus className="h-4 w-4" /> Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function FieldLabel({ field, htmlFor, as = "label" }: { field: MethodologyField; htmlFor?: string; as?: "label" | "span" }) {
  const Tag = as;
  return (
    <Tag className="label" {...(as === "label" ? { htmlFor } : {})}>
      {field.label}
      {field.required && (
        <span className="text-red-600" aria-hidden="true">
          {" *"}
        </span>
      )}
      {field.required && <span className="sr-only"> (required)</span>}
    </Tag>
  );
}

function Help({ field, id }: { field: MethodologyField; id: string }) {
  if (!field.help) return null;
  return (
    <p id={id} className="mt-1 text-xs text-gray-500">
      {field.help}
    </p>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  id,
}: {
  field: MethodologyField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  id: string;
}) {
  const helpId = field.help ? `${id}-help` : undefined;
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";

  switch (field.type) {
    case "textarea":
      return (
        <div>
          <FieldLabel field={field} htmlFor={id} />
          <textarea id={id} rows={3} className="input" value={text} aria-describedby={helpId} onChange={(e) => onChange(e.target.value)} />
          <Help field={field} id={`${id}-help`} />
        </div>
      );
    case "checkbox":
      return (
        <div>
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              id={id}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600"
              checked={value === true}
              aria-describedby={helpId}
              onChange={(e) => onChange(e.target.checked)}
            />
            {field.label}
            {field.required && <span className="text-red-600" aria-hidden="true">*</span>}
          </label>
          <Help field={field} id={`${id}-help`} />
        </div>
      );
    case "select": {
      const options = field.options ?? [];
      if (options.length > 5) {
        return (
          <div>
            <FieldLabel field={field} htmlFor={id} />
            <select id={id} className="input" value={text} aria-describedby={helpId} onChange={(e) => onChange(e.target.value)}>
              <option value="">Select…</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <Help field={field} id={`${id}-help`} />
          </div>
        );
      }
      return (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={helpId}>
          <span id={`${id}-label`}>
            <FieldLabel field={field} as="span" />
          </span>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <label key={o} className={CHOICE_PILL}>
                <input
                  type="radio"
                  name={id}
                  className="sr-only"
                  checked={text === o}
                  onChange={() => onChange(o)}
                  onClick={() => text === o && onChange("")}
                />
                {o}
              </label>
            ))}
          </div>
          <Help field={field} id={`${id}-help`} />
        </div>
      );
    }
    case "multiselect": {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div role="group" aria-labelledby={`${id}-label`} aria-describedby={helpId}>
          <span id={`${id}-label`}>
            <FieldLabel field={field} as="span" />
          </span>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((o) => (
              <label key={o} className={CHOICE_PILL}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={picked.includes(o)}
                  onChange={(e) => onChange(e.target.checked ? [...picked, o] : picked.filter((p) => p !== o))}
                />
                {o}
              </label>
            ))}
          </div>
          <Help field={field} id={`${id}-help`} />
        </div>
      );
    }
    case "rating": {
      const current = typeof value === "number" ? value : Number(value) || 0;
      return (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={helpId}>
          <span id={`${id}-label`}>
            <FieldLabel field={field} as="span" />
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className={cn(
                  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                  n <= current ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50",
                )}
              >
                <input
                  type="radio"
                  name={id}
                  className="sr-only"
                  checked={current === n}
                  onChange={() => onChange(n)}
                  onClick={() => current === n && onChange(null)}
                  aria-label={`${n} out of 5`}
                />
                {n}
              </label>
            ))}
          </div>
          <Help field={field} id={`${id}-help`} />
        </div>
      );
    }
    default:
      return (
        <div>
          <FieldLabel field={field} htmlFor={id} />
          <input
            id={id}
            className="input"
            type={field.type === "url" ? "url" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
            step={field.type === "number" ? "any" : undefined}
            placeholder={field.type === "url" ? "https://" : undefined}
            value={text}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value)}
          />
          <Help field={field} id={`${id}-help`} />
        </div>
      );
  }
}
