import { SimulatedSmartLockProvider } from "@/lib/doors/simulated-provider";
import type { SmartLockProvider } from "@/lib/doors/types";

let provider: SmartLockProvider | null = null;

/**
 * Provider pintu aktif. Simulator hanya boleh hidup di luar production dan
 * hanya bila ENABLE_SIMULATOR="true".
 */
export function getDoorProvider(): SmartLockProvider {
  if (!provider) {
    const allowed =
      process.env.NODE_ENV !== "production" && process.env.ENABLE_SIMULATOR === "true";
    if (!allowed) {
      throw new Error(
        "Provider perangkat pintu belum dikonfigurasi. Isi adapter vendor sebelum mengaktifkan integrasi hardware.",
      );
    }
    provider = new SimulatedSmartLockProvider();
  }
  return provider;
}

export function isSimulatorEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_SIMULATOR === "true";
}
