import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-border bg-surface px-6 py-16 text-center">
      <FileQuestion className="h-10 w-10 text-text-muted/50" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-theta-navy">Data tidak ditemukan</h2>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        Halaman atau data yang Anda cari sudah tidak tersedia atau milik properti lain.
      </p>
      <Link href="/dashboard" className={`${buttonVariants()} mt-5`}>
        Kembali ke ringkasan
      </Link>
    </div>
  );
}