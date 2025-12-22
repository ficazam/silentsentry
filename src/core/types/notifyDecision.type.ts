export type NotifyDecision =
  | { should: false }
  | {
      should: true;
      kind: "DOWN" | "RECOVERY" | "DEGRADED";
      transition: string;
    };
