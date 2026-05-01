import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

/** Tables that can be queued for offline mutation sync */
export type OfflineQueueTable = 'schools' | 'contacts' | 'conversations' | 'actions' | 'school_prices' | 'system_events' | 'schoolplan_analyses' | 'planned_touchpoints';

export interface PendingMutation {
  id: string;
  table: OfflineQueueTable;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  conflicted?: boolean;
  conflictReason?: string;
}

interface OfflineQueueState {
  mutations: PendingMutation[];
  addMutation: (mutation: Omit<PendingMutation, 'id' | 'timestamp'>) => void;
  removeMutation: (id: string) => void;
  clearAll: () => void;
  syncAll: () => Promise<{ synced: number; conflicts: number }>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      mutations: [],

      addMutation: (mutation) => {
        const entry: PendingMutation = {
          ...mutation,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({ mutations: [...state.mutations, entry] }));
      },

      removeMutation: (id) => {
        set((state) => ({ mutations: state.mutations.filter((m) => m.id !== id) }));
      },

      clearAll: () => set({ mutations: [] }),

      syncAll: async () => {
        const { mutations } = get();
        if (mutations.length === 0) return { synced: 0, conflicts: 0 };

        let synced = 0;
        let conflicts = 0;

        for (const mutation of mutations) {
          try {
            // --- CONFLICT DETECTION ---
            // For updates: check if server record was modified after our mutation was queued
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table from queue
            const tbl = mutation.table as any;
            if (mutation.operation === 'update' && mutation.payload.id) {
              const { data: serverRow } = await supabase
                .from(tbl)
                .select('updated_at')
                .eq('id', mutation.payload.id as string)
                .single();

              const row = serverRow as Record<string, unknown> | null;
              if (row?.updated_at) {
                const serverUpdatedAt = new Date(row.updated_at as string).getTime();
                if (serverUpdatedAt > mutation.timestamp) {
                  // SERVER WINS: mark as conflicted, do NOT apply the mutation
                  set((state) => ({
                    mutations: state.mutations.map((m) =>
                      m.id === mutation.id
                        ? { ...m, conflicted: true, conflictReason: `Server bijgewerkt op ${new Date(serverUpdatedAt).toLocaleString('nl-NL')}` }
                        : m,
                    ),
                  }));
                  conflicts++;
                  continue; // Skip this mutation
                }
              }
            }

            // --- APPLY MUTATION ---
             
            switch (mutation.operation) {
              case 'insert':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload shape varies per dynamic table; supabase generics don't accept Record<string, unknown>
                await supabase.from(tbl).insert(mutation.payload as any);
                break;
              case 'update': {
                const { id: rowId, ...rest } = mutation.payload;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- update payload shape varies per dynamic table; supabase generics don't accept Record<string, unknown>
                await supabase.from(tbl).update(rest as any).eq('id', rowId as string);
                break;
              }
              case 'delete':
                await supabase.from(tbl).delete().eq('id', mutation.payload.id as string);
                break;
            }
            // Remove successful mutation
            set((state) => ({
              mutations: state.mutations.filter((m) => m.id !== mutation.id),
            }));
            synced++;
          } catch (error) {
            console.error(`Sync failed for mutation ${mutation.id}:`, error);
            // Keep failed mutations in queue for retry
          }
        }
        return { synced, conflicts };
      },
    }),
    { name: 'offline-queue' },
  ),
);
