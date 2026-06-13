import { cn } from "@/lib/utils";

// A lightweight typographic wrapper (we avoid the typography plugin to keep the
// dependency surface small). Styles headings, paragraphs, lists and code.
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-gray-700",
        "[&_h1]:mb-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_p]:my-4",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul>li]:my-1",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:my-1",
        "[&_a]:font-medium [&_a]:text-brand-600 hover:[&_a]:underline",
        "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-gray-800",
        "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-gray-100",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        className,
      )}
    >
      {children}
    </div>
  );
}
