import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { TaskTypeForm } from "./task-type-form";

export const dynamic = "force-dynamic";

export default async function NewTaskTypePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New task type" description="Configure the work category and the inputs requestors must provide." />
      <TaskTypeForm />
    </div>
  );
}
