export type ProbeOutcome = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
  bodySnippet?: string;
};
