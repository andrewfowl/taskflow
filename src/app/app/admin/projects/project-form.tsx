"use client";

import { createProject } from "@/server/projects";
import { SubmitButton } from "@/components/app/submit-button";

export function ProjectForm() {
  return (
    <form action={createProject} className="card space-y-4 p-5">
      <div>
        <label className="label">Project name</label>
        <input name="name" required className="input" placeholder="Q3 launch" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={2} className="input" />
      </div>
      <SubmitButton className="btn-primary">Create project</SubmitButton>
    </form>
  );
}
