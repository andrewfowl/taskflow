"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Settings2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FIELD_TYPES,
  parseSchema,
  splitOptions,
  typeHasOptions,
  type EntryData,
  type FieldType,
  type MethodologyField,
  type MethodologySchema,
  type MethodologySection,
} from "@/lib/methodology-schema";
import { METHODOLOGY_TEMPLATES } from "@/lib/methodology-templates";
import type { MethodologyFormState } from "@/server/methodologies";
import { EntryFields } from "@/components/app/methodology-entry-fields";

type BuilderField = Omit<MethodologyField, "options"> & { id: string; optionsText: string };
type BuilderSection = Omit<MethodologySection, "fields"> & { id: string; fields: BuilderField[] };

let uid = 0;
const nextId = () => `b${++uid}-${Math.random().toString(36).slice(2, 7)}`;

function fromSchema(schema: MethodologySchema, keepKeys: boolean): BuilderSection[] {
  return schema.sections.map(({ fields, ...s }) => ({
    ...s,
    key: keepKeys ? s.key : "",
    id: nextId(),
    fields: fields.map(({ options, ...f }) => ({
      ...f,
      key: keepKeys ? f.key : "",
      id: nextId(),
      optionsText: (options ?? []).join("\n"),
    })),
  }));
}

function toSchema(sections: BuilderSection[]): MethodologySchema {
  return {
    sections: sections.map(({ id: _sid, fields, ...s }) => ({
      ...s,
      fields: fields.map(({ id: _fid, optionsText, ...f }) =>
        typeHasOptions(f.type) ? { ...f, options: splitOptions(optionsText) } : f,
      ),
    })),
  };
}

function findIssues(name: string, sections: BuilderSection[]) {
  const issues: string[] = [];
  if (!name.trim()) issues.push("Name the methodology.");
  if (sections.length === 0) issues.push("Add at least one section.");
  sections.forEach((s, si) => {
    const where = s.title.trim() || `Section ${si + 1}`;
    if (!s.title.trim()) issues.push(`Section ${si + 1} needs a title.`);
    if (s.fields.length === 0) issues.push(`"${where}" needs at least one field.`);
    s.fields.forEach((f, fi) => {
      if (!f.label.trim()) issues.push(`"${where}": field ${fi + 1} needs a label.`);
      if (typeHasOptions(f.type) && splitOptions(f.optionsText).length < 2) {
        issues.push(`"${f.label.trim() || `Field ${fi + 1}`}" needs at least two options.`);
      }
    });
  });
  return issues;
}

function move<T>(list: T[], index: number, dir: -1 | 1) {
  const j = index + dir;
  if (index < 0 || j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[j]] = [copy[j], copy[index]];
  return copy;
}

const newField = (type: FieldType = "text"): BuilderField => ({ id: nextId(), key: "", label: "", type, optionsText: "" });
const newSection = (): BuilderSection => ({ id: nextId(), key: "", title: "", fields: [newField()] });

export type BuilderInitial = {
  name: string;
  description: string;
  taskTypeId: string;
  teamId: string;
  isPublished: boolean;
  schema: MethodologySchema | null;
};

export function MethodologyBuilder({
  action,
  initial,
  taskTypes,
  teams,
  methodologyId,
  submitLabel,
}: {
  action: (prev: MethodologyFormState, formData: FormData) => Promise<MethodologyFormState>;
  initial: BuilderInitial;
  taskTypes: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  methodologyId?: string;
  submitLabel: string;
}) {
  const isNew = !methodologyId;
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [taskTypeId, setTaskTypeId] = useState(initial.taskTypeId);
  const [teamId, setTeamId] = useState(initial.teamId);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [templateId, setTemplateId] = useState<string | null>(isNew ? "research" : null);
  const [sections, setSections] = useState<BuilderSection[]>(() =>
    initial.schema ? fromSchema(initial.schema, true) : fromSchema(METHODOLOGY_TEMPLATES[0].schema, false),
  );
  const [openField, setOpenField] = useState<string | null>(null);
  const [preview, setPreview] = useState<EntryData>({});

  const schema = useMemo(() => toSchema(sections), [sections]);
  const previewSchema = useMemo(() => parseSchema(schema), [schema]);
  const issues = useMemo(() => findIssues(name, sections), [name, sections]);
  const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0);

  function applyTemplate(id: string) {
    const template = METHODOLOGY_TEMPLATES.find((t) => t.id === id);
    if (!template || id === templateId) return;
    if (templateId === null && !window.confirm("Replace the current sections with this template?")) return;
    setSections(fromSchema(template.schema, false));
    setTemplateId(id);
    setPreview({});
    setOpenField(null);
    const fromTemplate = METHODOLOGY_TEMPLATES.some((t) => t.description === description || t.name === name);
    if (!name.trim() || fromTemplate) setName(template.id === "blank" ? "" : template.name);
    if (!description.trim() || fromTemplate) setDescription(template.description);
  }

  // Any manual edit means a template switch would discard work.
  function editSections(update: (s: BuilderSection[]) => BuilderSection[]) {
    setSections(update);
    setTemplateId(null);
  }

  const updateSection = (id: string, patch: Partial<BuilderSection>) =>
    editSections((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const updateField = (sectionId: string, fieldId: string, patch: Partial<BuilderField>) =>
    editSections((list) =>
      list.map((s) =>
        s.id === sectionId ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) } : s,
      ),
    );
  const mapFields = (sectionId: string, fn: (fields: BuilderField[]) => BuilderField[]) =>
    editSections((list) => list.map((s) => (s.id === sectionId ? { ...s, fields: fn(s.fields) } : s)));

  function addField(sectionId: string) {
    const field = newField();
    mapFields(sectionId, (fields) => [...fields, field]);
    setOpenField(null);
  }

  return (
    <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      {methodologyId && <input type="hidden" name="id" value={methodologyId} />}
      <input type="hidden" name="schema" value={JSON.stringify(schema)} />

      <div className="min-w-0 space-y-6">
        {isNew && (
          <section className="card p-5" aria-labelledby="templates-heading">
            <h2 id="templates-heading" className="font-medium text-ink">Start from a template</h2>
            <p className="mt-1 text-sm text-gray-600">Pick the closest one, then adapt the sections and fields below.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {METHODOLOGY_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={templateId === t.id}
                  onClick={() => applyTemplate(t.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    templateId === t.id ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{t.summary}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="card space-y-4 p-5" aria-labelledby="details-heading">
          <h2 id="details-heading" className="font-medium text-ink">Details</h2>
          <div>
            <label className="label" htmlFor="m-name">Name</label>
            <input id="m-name" name="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Market research report" />
          </div>
          <div>
            <label className="label" htmlFor="m-description">Description</label>
            <textarea id="m-description" name="description" rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When should taskers use this?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m-type">For task type</label>
              <select id="m-type" name="taskTypeId" className="input" value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)}>
                <option value="">Any task type</option>
                {taskTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-team">Share with team</label>
              <select id="m-team" name="teamId" className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Just me</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isPublished" className="h-4 w-4 rounded border-gray-300 text-brand-600" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Publish so other taskers can use it
          </label>
        </section>

        <section aria-labelledby="structure-heading" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="structure-heading" className="font-medium text-ink">Structure</h2>
              <p className="text-sm text-gray-600">
                {sections.length} {sections.length === 1 ? "section" : "sections"} · {fieldCount} {fieldCount === 1 ? "field" : "fields"}
              </p>
            </div>
          </div>

          {sections.map((section, si) => (
            <div key={section.id} className="card p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    aria-label={`Section ${si + 1} title`}
                    className="input font-semibold"
                    placeholder="Section title, e.g. Findings"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  />
                  <input
                    aria-label={`Section ${si + 1} instructions`}
                    className="input text-gray-600"
                    placeholder="Instructions for this section (optional)"
                    value={section.description ?? ""}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                  />
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <IconButton label="Move section up" disabled={si === 0} onClick={() => editSections((l) => move(l, si, -1))}><ArrowUp /></IconButton>
                  <IconButton label="Move section down" disabled={si === sections.length - 1} onClick={() => editSections((l) => move(l, si, 1))}><ArrowDown /></IconButton>
                  <IconButton
                    label="Duplicate section"
                    onClick={() =>
                      editSections((l) => [
                        ...l.slice(0, si + 1),
                        { ...section, id: nextId(), key: "", title: `${section.title} (copy)`, fields: section.fields.map((f) => ({ ...f, id: nextId(), key: "" })) },
                        ...l.slice(si + 1),
                      ])
                    }
                  >
                    <Copy />
                  </IconButton>
                  <IconButton label="Delete section" onClick={() => editSections((l) => l.filter((s) => s.id !== section.id))}><Trash2 /></IconButton>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                    checked={section.repeatable === true}
                    onChange={(e) => updateSection(section.id, { repeatable: e.target.checked })}
                  />
                  Repeatable
                  <span className="text-gray-500">— fill in several times, e.g. one per source</span>
                </label>
                {section.repeatable && (
                  <input
                    aria-label="Name of each item"
                    className="input w-40 py-1"
                    placeholder="Item name, e.g. Source"
                    value={section.itemLabel ?? ""}
                    onChange={(e) => updateSection(section.id, { itemLabel: e.target.value })}
                  />
                )}
              </div>

              <ul className="mt-3 space-y-2">
                {section.fields.map((field, fi) => {
                  const open = openField === field.id;
                  return (
                    <li key={field.id} className={cn("rounded-lg border", open ? "border-brand-200 bg-brand-50/30" : "border-gray-200")}>
                      <div className="flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap">
                        <input
                          aria-label={`Field ${fi + 1} label`}
                          className="input min-w-0 flex-1"
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                        />
                        <select
                          aria-label={`Field ${fi + 1} type`}
                          className="input w-auto"
                          value={field.type}
                          onChange={(e) => {
                            const type = e.target.value as FieldType;
                            updateField(section.id, field.id, { type });
                            if (typeHasOptions(type) && !field.optionsText.trim()) setOpenField(field.id);
                          }}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 whitespace-nowrap px-1 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-brand-600"
                            checked={field.required === true}
                            onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                          />
                          Required
                        </label>
                        <div className="flex gap-0.5">
                          <IconButton label={open ? "Hide field settings" : "Field settings"} pressed={open} onClick={() => setOpenField(open ? null : field.id)}><Settings2 /></IconButton>
                          <IconButton label="Move field up" disabled={fi === 0} onClick={() => mapFields(section.id, (f) => move(f, fi, -1))}><ArrowUp /></IconButton>
                          <IconButton label="Move field down" disabled={fi === section.fields.length - 1} onClick={() => mapFields(section.id, (f) => move(f, fi, 1))}><ArrowDown /></IconButton>
                          <IconButton label="Delete field" onClick={() => mapFields(section.id, (f) => f.filter((x) => x.id !== field.id))}><Trash2 /></IconButton>
                        </div>
                      </div>
                      {open && (
                        <div className="grid gap-3 border-t border-brand-100 p-3 sm:grid-cols-2">
                          <div className={cn(!typeHasOptions(field.type) && "sm:col-span-2")}>
                            <label className="label" htmlFor={`${field.id}-help`}>Help text</label>
                            <input
                              id={`${field.id}-help`}
                              className="input"
                              placeholder="Shown under the field"
                              value={field.help ?? ""}
                              onChange={(e) => updateField(section.id, field.id, { help: e.target.value })}
                            />
                          </div>
                          {typeHasOptions(field.type) && (
                            <div>
                              <label className="label" htmlFor={`${field.id}-options`}>Options</label>
                              <textarea
                                id={`${field.id}-options`}
                                rows={4}
                                className="input"
                                placeholder={"One per line\nHigh\nMedium\nLow"}
                                value={field.optionsText}
                                onChange={(e) => updateField(section.id, field.id, { optionsText: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="btn-ghost mt-2 px-2 py-1 text-brand-700" onClick={() => addField(section.id)}>
                <Plus className="h-4 w-4" /> Add field
              </button>
            </div>
          ))}

          <button type="button" className="btn-secondary w-full border-dashed" onClick={() => editSections((l) => [...l, newSection()])}>
            <Plus className="h-4 w-4" /> Add section
          </button>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="card p-5" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="font-medium text-ink">Live preview</h2>
          <p className="mb-4 mt-1 text-xs text-gray-500">The form taskers fill in on each task. Try it, nothing is saved.</p>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <EntryFields schema={previewSchema} value={preview} onChange={setPreview} idPrefix="preview" />
          </div>
        </section>

        <div className="card space-y-3 p-5">
          {issues.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900">Before saving:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-600">
                {issues.slice(0, 5).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          )}
          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={pending || issues.length > 0}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </aside>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-30 [&>svg]:h-4 [&>svg]:w-4",
        pressed && "bg-gray-100 text-gray-700",
      )}
    >
      {children}
    </button>
  );
}
