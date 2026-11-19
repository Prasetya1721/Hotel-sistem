import { redirect } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { auth } from "@/auth";
import LoginForm from "@/app/login/LoginForm";

export const metadata = { title: "Masuk" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-theta-navy text-white shadow-[0_4px_14px_rgba(16,42,67,0.18)]">
            <DoorOpen className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-theta-navy">HotelOps Guard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sistem manajemen hotel &amp; monitoring akses kamar
          </p>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-6 shadow-[0_2px_10px_rgba(16,42,67,0.06)]">
          <LoginForm />
        </div>

        <details className="mt-5 rounded-[12px] border border-dashed border-border bg-surface/60 px-4 py-3 text-[13px] text-text-muted">
          <summary className="cursor-pointer select-none font-semibold text-text">
            Akun demo (development)
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-[12px]">
            <li>owner@hotelops.test</li>
            <li>receptionist@hotelops.test</li>
            <li>security@hotelops.test</li>
            <li>housekeeping@hotelops.test</li>
          </ul>
          <p className="mt-2">
            Kata sandi: <span className="font-mono text-[12px]">rahasia1234</span>
          </p>
        </details>
      </div>
    </main>
  );
}