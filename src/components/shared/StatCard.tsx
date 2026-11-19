import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}

export default function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-[13px] font-medium text-text-muted">{label}</p>
        <p
          className={cn(
            "mt-2 text-[28px] font-bold leading-tight tabular-nums text-theta-navy",
            tone === "warning" && "text-warning",
            tone === "danger" && "text-danger",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-[13px] text-text-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}
