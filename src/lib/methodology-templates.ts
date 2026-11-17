import type { MethodologySchema } from "@/lib/methodology-schema";

export type MethodologyTemplate = {
  id: string;
  name: string;
  summary: string;
  description: string;
  schema: MethodologySchema;
};

export const METHODOLOGY_TEMPLATES: MethodologyTemplate[] = [
  {
    id: "research",
    name: "Research report",
    summary: "Question, sources, findings, conclusion",
    description: "Desk research documented with the sources consulted and the confidence behind each finding.",
    schema: {
      sections: [
        {
          key: "scope",
          title: "Scope",
          fields: [
            { key: "research_question", label: "Research question", type: "textarea", required: true },
            { key: "out_of_scope", label: "Explicitly out of scope", type: "textarea" },
          ],
        },
        {
          key: "sources",
          title: "Sources",
          description: "Every source you relied on, so the work can be re-checked.",
          repeatable: true,
          itemLabel: "Source",
          fields: [
            { key: "title", label: "Title", type: "text", required: true },
            { key: "link", label: "Link", type: "url" },
            { key: "reliability", label: "Reliability", type: "select", options: ["Primary", "Reputable secondary", "Unverified"] },
          ],
        },
        {
          key: "findings",
          title: "Findings",
          repeatable: true,
          itemLabel: "Finding",
          fields: [
            { key: "finding", label: "Finding", type: "textarea", required: true },
            { key: "confidence", label: "Confidence", type: "select", options: ["High", "Medium", "Low"] },
          ],
        },
        {
          key: "conclusion",
          title: "Conclusion",
          fields: [
            { key: "summary", label: "Summary for the requestor", type: "textarea", required: true },
            { key: "overall_confidence", label: "Overall confidence", type: "rating" },
          ],
        },
      ],
    },
  },
  {
    id: "annotation-qa",
    name: "Annotation QA",
    summary: "Batch details, issues found, sign-off",
    description: "Quality review of a batch of labelled or generated data items.",
    schema: {
      sections: [
        {
          key: "batch",
          title: "Batch",
          fields: [
            { key: "batch_id", label: "Batch ID", type: "text", required: true },
            { key: "items_reviewed", label: "Items reviewed", type: "number", required: true },
            { key: "guideline_version", label: "Guideline version", type: "text" },
          ],
        },
        {
          key: "issues",
          title: "Issues found",
          description: "Leave empty if the batch was clean.",
          repeatable: true,
          itemLabel: "Issue",
          fields: [
            { key: "item_id", label: "Item ID", type: "text", required: true },
            {
              key: "issue_type",
              label: "Issue type",
              type: "select",
              options: ["Wrong label", "Guideline violation", "Factual error", "Formatting", "Other"],
            },
            { key: "note", label: "Note", type: "textarea" },
          ],
        },
        {
          key: "sign_off",
          title: "Sign-off",
          fields: [
            {
              key: "checks",
              label: "Checks completed",
              type: "multiselect",
              options: ["Random sample reviewed", "Edge cases reviewed", "Guidelines re-read", "Second pass done"],
            },
            { key: "batch_quality", label: "Batch quality", type: "rating", required: true },
            { key: "ready_to_ship", label: "Ready to deliver", type: "checkbox" },
          ],
        },
      ],
    },
  },
  {
    id: "bug-investigation",
    name: "Bug investigation",
    summary: "Reproduction, root cause, fix, verification",
    description: "How a defect was reproduced, diagnosed, fixed and verified.",
    schema: {
      sections: [
        {
          key: "reproduction",
          title: "Reproduction",
          fields: [
            { key: "steps", label: "Steps to reproduce", type: "textarea", required: true },
            { key: "environment", label: "Environment", type: "text", help: "Browser, OS, app version…" },
            { key: "reproducible", label: "Reproducible", type: "select", options: ["Always", "Sometimes", "Could not reproduce"] },
          ],
        },
        {
          key: "diagnosis",
          title: "Diagnosis",
          fields: [
            { key: "root_cause", label: "Root cause", type: "textarea", required: true },
            { key: "severity", label: "Severity", type: "select", options: ["Critical", "High", "Medium", "Low"] },
          ],
        },
        {
          key: "resolution",
          title: "Fix & verification",
          fields: [
            { key: "fix", label: "What changed", type: "textarea" },
            { key: "pull_request", label: "Pull request", type: "url" },
            { key: "verification", label: "Verification", type: "multiselect", options: ["Test added", "Manually verified", "Regression checked"] },
          ],
        },
      ],
    },
  },
  {
    id: "blank",
    name: "Blank",
    summary: "Start from scratch",
    description: "",
    schema: {
      sections: [{ key: "", title: "Work notes", fields: [{ key: "", label: "Notes", type: "textarea" }] }],
    },
  },
];
