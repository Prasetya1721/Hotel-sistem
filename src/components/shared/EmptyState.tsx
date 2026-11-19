import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <Inbox className="h-10 w-10 text-text-muted/40" />
      <h3 className="mt-4 text-base font-semibold text-theta-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
