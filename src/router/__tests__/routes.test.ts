import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from '../routes';

describe('Route tree', () => {
  it('contains all expected route paths', () => {
    const router = createRouter({ routeTree });
    const paths = Object.keys(router.routesByPath);

    expect(paths).toContain('/');
    expect(paths).toContain('/scholen');
    expect(paths).toContain('/scholen/$slug');
    expect(paths).toContain('/scholen/$slug/wizard/$step');
    expect(paths).toContain('/scholen/$slug/vergelijking');
    expect(paths).toContain('/scholen/$slug/huidig-vs-cito');
    expect(paths).toContain('/scholen/$slug/migratie');
    expect(paths).toContain('/review');
  });
});
