import { Injectable } from '@nestjs/common';
import { FirestoreClient } from './firestore.client';
import { CheckResult, MonitoredTarget, TargetState } from 'src/core/types';
import { randomUUID } from 'crypto';

@Injectable()
export class FirestoreStorage {
  constructor(private readonly fs: FirestoreClient) {}

  async listEnabledTargets(): Promise<MonitoredTarget[]> {
    const snap = await this.fs
      .db()
      .collection('targets')
      .where('enabled', '==', true)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async getTargetState(targetId: string): Promise<TargetState | null> {
    const doc = await this.fs
      .db()
      .collection('targetStates')
      .doc(targetId)
      .get();
    if (!doc.exists) return null;
    const data = doc.data() as any;

    return {
      targetId,
      lastStatus: data.lastStatus,
      lastChangedAt:
        data.lastChangedAt?.toDate?.() ?? new Date(data.lastChangedAt),
      lastCheckedAt: data.lastCheckedAt
        ? (data.lastCheckedAt.toDate?.() ?? new Date(data.lastCheckedAt))
        : null,
      lastLatencyMs: data.lastLatencyMs ?? null,
      lastStatusCode: data.lastStatusCode ?? null,
      lastError: data.lastError ?? null,
      consecutiveFailures: data.consecutiveFailures ?? 0,
      lastAlertAt: data.lastAlertAt
        ? (data.lastAlertAt.toDate?.() ?? new Date(data.lastAlertAt))
        : null,
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }

  async upsertTargetState(state: TargetState): Promise<void> {
    await this.fs
      .db()
      .collection('targetStates')
      .doc(state.targetId)
      .set(
        {
          ...state,
        },
        { merge: true },
      );
  }

  async setLastAlertAt(targetId: string, at: Date): Promise<void> {
    await this.fs
      .db()
      .collection('targetStates')
      .doc(targetId)
      .set({ lastAlertAt: at, updatedAt: new Date() }, { merge: true });
  }

  async insertCheckResult(result: CheckResult): Promise<void> {
    await this.fs
      .db()
      .collection('checkResults')
      .add({
        ...result,
      });
  }

  async getResultsForTargetSince(
    targetId: string,
    since: Date,
  ): Promise<CheckResult[]> {
    const snap = await this.fs
      .db()
      .collection('checkResults')
      .where('targetId', '==', targetId)
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'asc')
      .get();

    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        targetId: data.targetId,
        timestamp: data.ts?.toDate?.() ?? new Date(data.ts),
        status: data.status,
        latencyMs: data.latencyMs,
        statusCode: data.statusCode ?? null,
        error: data.error ?? null,
        meta: data.meta ?? undefined,
      };
    });
  }

  async listTargetsAll(): Promise<MonitoredTarget[]> {
    const snap = await this.fs.db().collection('targets').get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async getTarget(id: string): Promise<MonitoredTarget | null> {
    const doc = await this.fs.db().collection('targets').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as any) };
  }

  async createTarget(input: any): Promise<MonitoredTarget> {
    const id =
      input.id && String(input.id).trim().length > 0
        ? String(input.id)
        : randomUUID();
    const data = {
      ...input,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    delete data.id;

    await this.fs
      .db()
      .collection('targets')
      .doc(id)
      .set(data, { merge: false });
    const created = await this.getTarget(id);
    if (!created) throw new Error('Failed to create target');
    return created;
  }

  async updateTarget(id: string, patch: any): Promise<MonitoredTarget> {
    const data = {
      ...patch,
      updatedAt: new Date(),
    };
    delete data.id;

    await this.fs.db().collection('targets').doc(id).set(data, { merge: true });
    const updated = await this.getTarget(id);
    if (!updated) throw new Error('Target not found after update');
    return updated;
  }

  async deleteTarget(id: string): Promise<void> {
    await this.fs.db().collection('targets').doc(id).delete();
    await this.fs.db().collection('targetStates').doc(id).delete();
  }

  async updateTargetStateFields(targetId: string, patch: any): Promise<void> {
    await this.fs
      .db()
      .collection('targetStates')
      .doc(targetId)
      .set({ ...patch, updatedAt: new Date() }, { merge: true });
  }

  async deleteCheckResultsBefore(cutoff: Date): Promise<number> {
    const db = this.fs.db();
    let total = 0;

    while (true) {
      const snap = await db
        .collection('checkResults')
        .where('timestamp', '<', cutoff)
        .orderBy('timestamp', 'asc')
        .limit(450)
        .get();

      if (snap.empty) break;

      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      total += snap.size;
    }

    return total;
  }
}
