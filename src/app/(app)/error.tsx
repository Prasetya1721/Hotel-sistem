"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-border bg-surface px-6 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-warning" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-theta-navy">Halaman gagal dimuat</h2>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        Terjadi kendala saat mengambil data. Coba muat ulang; bila tetap gagal, hubungi admin
        dengan kode referensi di bawah.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[12px] text-text-muted">{error.digest}</p>
      )}
      <Button onClick={reset} className="mt-5">
        Coba lagi
      </Button>
    </div>
  );
}