import { jest, describe, it, expect } from '@jest/globals';
import { runDatabaseHealthCheck } from './health.js';

describe('Database Health Check (Self-Check)', () => {
  it('correctly reports success on a fully healthy database', async () => {
    // Mock query function for a known-good database
    const mockQuery = jest.fn<any>().mockImplementation(async (sql: string) => {
      if (sql.includes('PRAGMA integrity_check')) {
        return [{ integrity_check: 'ok' }];
      }
      if (sql.includes('sqlite_master')) {
        return [{ name: 'daily_records' }];
      }
      if (sql.includes('COUNT(*)')) {
        return [{ count: 2000 }];
      }
      return [];
    });

    const result = await runDatabaseHealthCheck(mockQuery as any);

    console.log('🧪 [Test Run: Healthy DB] Full health check result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.integrityOk).toBe(true);
    expect(result.schemaOk).toBe(true);
    expect(result.countOk).toBe(true);
    expect(result.trace.integrity).toEqual([{ integrity_check: 'ok' }]);
    expect(result.trace.schema).toEqual([{ name: 'daily_records' }]);
    expect(result.trace.count).toEqual([{ count: 2000 }]);
  });

  it('correctly reports failure if integrity check is corrupted', async () => {
    // Mock query function for a corrupted database
    const mockQuery = jest.fn<any>().mockImplementation(async (sql: string) => {
      if (sql.includes('PRAGMA integrity_check')) {
        return [{ integrity_check: 'corrupted' }]; // Not "ok"
      }
      if (sql.includes('sqlite_master')) {
        return [{ name: 'daily_records' }];
      }
      if (sql.includes('COUNT(*)')) {
        return [{ count: 2000 }];
      }
      return [];
    });

    const result = await runDatabaseHealthCheck(mockQuery as any);

    console.log('🧪 [Test Run: Corrupted Integrity] Full health check result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(false);
    expect(result.integrityOk).toBe(false);
    expect(result.schemaOk).toBe(true);
    expect(result.countOk).toBe(true);
  });

  it('correctly reports failure on an empty database (no tables)', async () => {
    // Mock query function for an empty database (such as fallback or uninitialized DB)
    const mockQuery = jest.fn<any>().mockImplementation(async (sql: string) => {
      if (sql.includes('PRAGMA integrity_check')) {
        return [{ integrity_check: 'ok' }]; // PRAGMA on empty is ok
      }
      if (sql.includes('sqlite_master')) {
        return []; // No daily_records table found!
      }
      if (sql.includes('COUNT(*)')) {
        // COUNT(*) query on non-existing table will throw an error
        throw new Error('no such table: daily_records');
      }
      return [];
    });

    const result = await runDatabaseHealthCheck(mockQuery as any);

    console.log('🧪 [Test Run: Empty DB] Full health check result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(false);
    expect(result.integrityOk).toBe(true);
    expect(result.schemaOk).toBe(false);
    expect(result.countOk).toBe(false);
  });

  it('correctly reports failure if daily_records has 0 rows', async () => {
    // Mock query function for database with schema but 0 records
    const mockQuery = jest.fn<any>().mockImplementation(async (sql: string) => {
      if (sql.includes('PRAGMA integrity_check')) {
        return [{ integrity_check: 'ok' }];
      }
      if (sql.includes('sqlite_master')) {
        return [{ name: 'daily_records' }];
      }
      if (sql.includes('COUNT(*)')) {
        return [{ count: 0 }]; // Empty table!
      }
      return [];
    });

    const result = await runDatabaseHealthCheck(mockQuery as any);

    console.log('🧪 [Test Run: Zero Rows DB] Full health check result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(false);
    expect(result.integrityOk).toBe(true);
    expect(result.schemaOk).toBe(true);
    expect(result.countOk).toBe(false);
  });
});
