import {
  isEmptyValue,
  isObject,
  type MethodologyField,
  type MethodologySchema,
} from "@/lib/methodology-schema";

function Value({ field, value }: { field: MethodologyField; value: unknown }) {
  if (field.type === "checkbox") return <>{value === true ? "Yes" : "No"}</>;
  if (field.type === "multiselect" && Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={String(v)} className="badge bg-gray-100 text-gray-700">{String(v)}</span>
        ))}
      </span>
    );
  }
  if (field.type === "rating") return <>{`${Number(value)} / 5`}</>;
  if (field.type === "url" && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 underline underline-offset-2">
        {value}
      </a>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function FieldList({ fields, data }: { fields: MethodologyField[]; data: Record<string, unknown> }) {
  // A "No" for an unticked box is noise unless the field asked for it.
  const shown = fields.filter((f) => !isEmptyValue(data[f.key]) || (f.type === "checkbox" && f.required));
  if (shown.length === 0) return null;
  return (
    <dl className="space-y-2">
      {shown.map((f) => (
        <div key={f.key}>
          <dt className="text-xs font-medium text-gray-500">{f.label}</dt>
          <dd className="text-sm text-gray-900">
            <Value field={f} value={data[f.key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EntryView({ schema, data }: { schema: MethodologySchema; data: unknown }) {
  const src = isObject(data) ? data : {};
  const known = new Set<string>();

  const blocks = schema.sections.map((section) => {
    if (section.repeatable) {
      known.add(section.key);
      const rows = Array.isArray(src[section.key]) ? (src[section.key] as unknown[]).filter(isObject) : [];
      if (rows.length === 0) return null;
      return (
        <div key={section.key}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {section.title} ({rows.length})
          </h4>
          <ol className="space-y-2">
            {rows.map((row, i) => (
              <li key={i} className="rounded-md border border-gray-100 bg-gray-50/60 p-2.5">
                <FieldList fields={section.fields} data={row} />
              </li>
            ))}
          </ol>
        </div>
      );
    }
    section.fields.forEach((f) => known.add(f.key));
    const list = <FieldList fields={section.fields} data={src} />;
    if (!section.fields.some((f) => !isEmptyValue(src[f.key]))) return null;
    return (
      <div key={section.key}>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</h4>
        {list}
      </div>
    );
  });

  // Data saved before the schema changed: still show it rather than hide it.
  const extras = Object.entries(src).filter(([k, v]) => !known.has(k) && !isEmptyValue(v) && !isObject(v));

  if (blocks.every((b) => b === null) && extras.length === 0) {
    return <p className="text-sm text-gray-400">No details recorded.</p>;
  }

  return (
    <div className="space-y-4">
      {blocks}
      {extras.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Other</h4>
          <dl className="space-y-2">
            {extras.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-medium text-gray-500">{k}</dt>
                <dd className="whitespace-pre-wrap break-words text-sm text-gray-900">
                  {Array.isArray(v) ? v.map(String).join(", ") : String(v)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
