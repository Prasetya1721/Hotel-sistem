export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  NEW: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["INVESTIGATING", "FALSE_POSITIVE"],
  INVESTIGATING: ["RESOLVED", "FALSE_POSITIVE"],
  RESOLVED: ["CLOSED", "REOPENED"],
  FALSE_POSITIVE: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ACKNOWLEDGED", "INVESTIGATING"],
};

export function canTransition(from: string, to: string): boolean {
  return (INCIDENT_TRANSITIONS[from] ?? []).includes(to);
}
