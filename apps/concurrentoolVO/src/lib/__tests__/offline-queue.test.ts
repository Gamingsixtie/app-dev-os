import { describe, it, expect, beforeEach } from 'vitest';
import { useOfflineQueue } from '../offline-queue';

describe('offline-queue store', () => {
  beforeEach(() => {
    // Reset the store between tests
    useOfflineQueue.setState({ mutations: [] });
  });

  it('starts with an empty mutations array', () => {
    expect(useOfflineQueue.getState().mutations).toEqual([]);
  });

  it('addMutation adds a mutation with auto-generated id and timestamp', () => {
    useOfflineQueue.getState().addMutation({
      table: 'schools',
      operation: 'update',
      payload: { id: '123', name: 'Test' },
    });

    const { mutations } = useOfflineQueue.getState();
    expect(mutations).toHaveLength(1);
    expect(mutations[0].table).toBe('schools');
    expect(mutations[0].operation).toBe('update');
    expect(mutations[0].payload).toEqual({ id: '123', name: 'Test' });
    expect(mutations[0].id).toBeDefined();
    expect(typeof mutations[0].id).toBe('string');
    expect(mutations[0].timestamp).toBeDefined();
    expect(typeof mutations[0].timestamp).toBe('number');
  });

  it('removeMutation removes by id', () => {
    useOfflineQueue.getState().addMutation({
      table: 'contacts',
      operation: 'insert',
      payload: { name: 'Jan' },
    });

    const { mutations } = useOfflineQueue.getState();
    expect(mutations).toHaveLength(1);

    useOfflineQueue.getState().removeMutation(mutations[0].id);
    expect(useOfflineQueue.getState().mutations).toEqual([]);
  });

  it('addMutation followed by removeMutation leaves empty array', () => {
    useOfflineQueue.getState().addMutation({
      table: 'schools',
      operation: 'delete',
      payload: { id: 'abc' },
    });

    const id = useOfflineQueue.getState().mutations[0].id;
    useOfflineQueue.getState().removeMutation(id);

    expect(useOfflineQueue.getState().mutations).toEqual([]);
  });

  it('multiple addMutation calls accumulate in order', () => {
    useOfflineQueue.getState().addMutation({
      table: 'schools',
      operation: 'update',
      payload: { id: '1' },
    });
    useOfflineQueue.getState().addMutation({
      table: 'contacts',
      operation: 'insert',
      payload: { name: 'Piet' },
    });
    useOfflineQueue.getState().addMutation({
      table: 'actions',
      operation: 'delete',
      payload: { id: '3' },
    });

    const { mutations } = useOfflineQueue.getState();
    expect(mutations).toHaveLength(3);
    expect(mutations[0].table).toBe('schools');
    expect(mutations[1].table).toBe('contacts');
    expect(mutations[2].table).toBe('actions');
  });

  it('clearAll empties the mutations array', () => {
    useOfflineQueue.getState().addMutation({
      table: 'schools',
      operation: 'update',
      payload: { id: '1' },
    });
    useOfflineQueue.getState().addMutation({
      table: 'contacts',
      operation: 'insert',
      payload: { name: 'Jan' },
    });

    expect(useOfflineQueue.getState().mutations).toHaveLength(2);

    useOfflineQueue.getState().clearAll();
    expect(useOfflineQueue.getState().mutations).toEqual([]);
  });

  it('conflicted field defaults to undefined', () => {
    useOfflineQueue.getState().addMutation({
      table: 'schools',
      operation: 'update',
      payload: { id: '1' },
    });

    const mutation = useOfflineQueue.getState().mutations[0];
    expect(mutation.conflicted).toBeUndefined();
    expect(mutation.conflictReason).toBeUndefined();
  });
});
