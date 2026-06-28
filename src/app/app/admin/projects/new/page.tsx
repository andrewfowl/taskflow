import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { ProjectForm } from "../project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <div className="max-w-xl">
      <PageHeader
        title="New project"
        description="Group related tasks under one project."
      />
      <ProjectForm />
    </div>
  );
}
