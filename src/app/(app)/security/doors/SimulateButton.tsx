"use client";

import * as React from "react";
import { toast } from "sonner";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateDoorEventAction } from "@/app/(app)/security/doors/actions";

export default function SimulateButton() {
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    setPending(true);
    const result = await simulateDoorEventAction();
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={pending}>
      <Radio />
      {pending ? "Mengirim…" : "Kirim event simulasi"}
    </Button>
  );
}