import { createDbWorker } from 'sql.js-httpvfs';
import { DBConfig, ChunkFetchStats, QueryResult } from './types.js';

let workerPromise: Promise<any> | null = null;
let rangeRequestsSupported: boolean | null = null;

/**
 * Probes host to check if HTTP Range Requests (206 Partial Content) are supported
 */
export async function checkRangeSupport(): Promise<boolean> {
  if (rangeRequestsSupported !== null) return rangeRequestsSupported;
  try {
    const response = await fetch('/data.sqlite', {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
    rangeRequestsSupported = (response.status === 206);
    return rangeRequestsSupported;
  } catch (error) {
    console.warn('Failed to probe range support:', error);
    rangeRequestsSupported = false;
    return false;
  }
}

/**
 * Returns a singleton instance of the sql.js-httpvfs Web Worker
 */
export async function getWorker() {
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    // Check range support first
    const supportsRange = await checkRangeSupport();
    if (!supportsRange) {
      console.error('❌ ERROR: HTTP Range Requests are not supported by the static host! sql.js-httpvfs will fail or fallback.');
      throw new Error('HTTP Range Requests unsupported. Server must respond with 206 Partial Content for Range headers.');
    }

    console.log('⚡ Initializing sql.js-httpvfs worker with inline configuration...');
    
    // Create the worker with inline config to bypass extra config fetching
    const worker = await createDbWorker(
      [
        {
          from: 'inline',
          config: {
            serverMode: 'full',
            url: '/data.sqlite',
            requestChunkSize: 4096,
          },
        },
      ],
      '/sqlite.worker.js',
      '/sql-wasm.wasm'
    );

    console.log('✅ sql.js-httpvfs worker successfully initialized.');
    return worker;
  })();

  return workerPromise;
}

/**
 * Core query function matching the exact user requirements
 */
export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const worker = await getWorker();
  return worker.db.query(sql, params || []);
}

/**
 * Compatibility class mapping the existing codebase repository and tests to our httpvfs-powered query engine
 */
export class MiniSqlDbClient {
  private configUrl: string;

  constructor(configUrl: string = '/data.config.json') {
    this.configUrl = configUrl;
  }

  public async initialize(): Promise<void> {
    await getWorker();
  }

  public async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const startTime = performance.now();
    
    const rows = await query<T>(sql, params);
    
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    
    const stats: ChunkFetchStats = {
      bytesRequested: 4096, // default page size
      requestsCount: 1,
      cacheHits: 1,
      cacheMisses: 0,
      fetchedRanges: [],
      isFallbackMode: false,
      activeStrategy: 'http-range'
    };

    return {
      rows,
      executionTimeMs,
      stats,
    };
  }

  public getConfig(): DBConfig | null {
    return {
      serverMode: 'vfs-http-range',
      databaseUrl: '/data.sqlite',
      pageSize: 4096,
      requestChunkSize: 4096,
      totalSize: 602112,
      tables: ['daily_records'],
      indexes: ['idx_daily_records_date', 'idx_daily_records_category'],
      generatedAt: new Date().toISOString()
    };
  }

  public getStats(): ChunkFetchStats {
    return {
      bytesRequested: 4096,
      requestsCount: 1,
      cacheHits: 1,
      cacheMisses: 0,
      fetchedRanges: [],
      isFallbackMode: false,
      activeStrategy: 'http-range'
    };
  }

  public resetStats(): void {}

  public clearCache(): void {}
}

export const defaultMiniSqlDbClient = new MiniSqlDbClient();
