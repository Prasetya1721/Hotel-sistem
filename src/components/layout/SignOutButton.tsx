import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label="Keluar"
        className="flex h-9 items-center gap-2 rounded-[10px] border border-border px-3 text-sm text-text hover:bg-surface-muted"
        title="Keluar"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Keluar</span>
      </button>
    </form>
  );
}
