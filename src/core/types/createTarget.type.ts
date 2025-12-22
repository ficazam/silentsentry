import { z } from 'zod';

export const CreateTargetSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  type: z.enum(['HTTP', 'HEARTBEAT']).default('HTTP'),
  enabled: z.boolean().default(true),

  intervalSeconds: z.number().int().min(15).max(86400).default(60),
  lastDownAlertDate: z.string().optional(),
  lastStatusAlertDate: z.string().optional(),
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  timeoutMs: z.number().int().min(1000).max(30000).default(5000),
  headers: z.record(z.string(), z.string()).optional(),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  bodyContains: z.string().min(1).optional(),
  latencyDegradedMs: z.number().int().min(1).max(60000).optional(),

  alertCooldownSeconds: z.number().int().min(0).max(86400).default(900),
  notifyOnDegraded: z.boolean().default(true),
  notifyOnRecovery: z.boolean().default(true),
});

export type CreateTargetInput = z.infer<typeof CreateTargetSchema>;
