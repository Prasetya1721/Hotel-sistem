import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/design";

const toneToVariant: Record<Tone, "neutral" | "info" | "teal" | "success" | "warning" | "danger" | "purple"> = {
  neutral: "neutral",
  info: "info",
  teal: "teal",
  success: "success",
  warning: "warning",
  danger: "danger",
  purple: "purple",
};

export default function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={toneToVariant[tone]}>{label}</Badge>;
}
