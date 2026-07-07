/**
 * PWA write outbox — the only mutation path from the client (ADR-0002; docs/08 §7.2).
 * Every mutation gets a UUIDv7 Idempotency-Key, is applied optimistically to local UI
 * state, and is replayed in recorded order via POST /v1/sync/batch on reconnect.
 * Server warnings (e.g. INSUFFICIENT_STOCK discovered at sync) surface as a review
 * list — never silent failure (docs/08 §7.3).
 */
import { openDB, type IDBPDatabase } from 'idb';
import { v7 as uuidv7 } from 'uuid';

export type OutboxStatus = 'queued' | 'syncing' | 'applied' | 'warning' | 'failed';

export interface OutboxEntry {
  idempotencyKey: string;
  method: 'POST' | 'PUT';
  path: string; // /v1/... endpoint per docs/05 §6.2
  payload: unknown;
  recordedAt: string; // client clock; server timestamp authoritative (PRD §9)
  status: OutboxStatus;
  warning?: string;
  error?: { status: string; message: string };
}

const DB_NAME = 'swasthyaops-outbox';
const STORE = 'mutations';
const BATCH_LIMIT = 200; // matches SyncBatchIn max (docs/05 §6.2)

async function dbp(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'idempotencyKey' });
      store.createIndex('by-status', 'status');
      store.createIndex('by-recordedAt', 'recordedAt');
    },
  });
}

export async function enqueue(
  method: OutboxEntry['method'],
  path: string,
  payload: unknown,
): Promise<OutboxEntry> {
  const entry: OutboxEntry = {
    idempotencyKey: uuidv7(),
    method,
    path,
    payload,
    recordedAt: new Date().toISOString(),
    status: 'queued',
  };
  await (await dbp()).put(STORE, entry);
  void requestSync();
  return entry;
}

export async function pending(): Promise<OutboxEntry[]> {
  const all = await (await dbp()).getAllFromIndex(STORE, 'by-status', 'queued');
  return all.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/** Replay queued mutations in recorded order. Called by the service worker's sync
 * event and by a foreground reconnect listener (Background Sync fallback). */
export async function drain(getToken: () => Promise<string>): Promise<void> {
  const queue = await pending();
  if (queue.length === 0) return;
  const db = await dbp();

  for (let i = 0; i < queue.length; i += BATCH_LIMIT) {
    const batch = queue.slice(i, i + BATCH_LIMIT);
    await Promise.all(batch.map((e) => db.put(STORE, { ...e, status: 'syncing' })));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/sync/batch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({
        mutations: batch.map((e) => ({
          idempotency_key: e.idempotencyKey,
          method: e.method,
          path: e.path,
          payload: e.payload,
        })),
      }),
    });

    if (!res.ok) {
      // Whole-batch transport failure: requeue; retry on next sync trigger.
      await Promise.all(batch.map((e) => db.put(STORE, { ...e, status: 'queued' })));
      return;
    }
    const { results } = (await res.json()) as {
      results: { idempotency_key: string; status_code: number; warning?: string; error?: OutboxEntry['error'] }[];
    };
    for (const r of results) {
      const entry = batch.find((e) => e.idempotencyKey === r.idempotency_key)!;
      const status: OutboxStatus =
        r.status_code < 300 ? (r.warning ? 'warning' : 'applied') : 'failed';
      await db.put(STORE, { ...entry, status, warning: r.warning, error: r.error });
    }
  }
}

/** Items needing user review after sync (warnings + failures) — rendered on S8. */
export async function reviewList(): Promise<OutboxEntry[]> {
  const db = await dbp();
  const warned = await db.getAllFromIndex(STORE, 'by-status', 'warning');
  const failed = await db.getAllFromIndex(STORE, 'by-status', 'failed');
  return [...warned, ...failed];
}

async function requestSync(): Promise<void> {
  const reg = await navigator.serviceWorker?.ready;
  // Background Sync where available (Chromium); foreground drain() otherwise.
  await (reg as unknown as { sync?: { register(tag: string): Promise<void> } }).sync
    ?.register('outbox-drain')
    .catch(() => undefined);
}
