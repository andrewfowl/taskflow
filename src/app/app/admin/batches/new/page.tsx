import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { BatchForm } from "../batch-form";

export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New data batch"
        description="Define the governing rubric and the batch parameters."
      />
      <BatchForm />
    </div>
  );
}
