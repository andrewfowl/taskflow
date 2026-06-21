import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { RubricForm } from "../rubric-form";

export const dynamic = "force-dynamic";

export default async function NewRubricPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New rubric"
        description="Define the data contract for a class of work."
      />
      <RubricForm />
    </div>
  );
}
