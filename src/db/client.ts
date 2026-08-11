import initSqlJs, { Database } from 'sql.js';
import { DBConfig, ChunkFetchStats, QueryResult } from './types.js';

export class RangeVirtualFileSystem {
  private config: DBConfig;
  private chunkCache: Map<number, Uint8Array> = new Map();
  private fullFileBuffer: Uint8Array | null = null;
  private isFallbackMode = false;

  private stats: ChunkFetchStats = {
    bytesRequested: 0,
    requestsCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    fetchedRanges: [],
    isFallbackMode: false,
    activeStrategy: 'http-range',
  };

  constructor(config: DBConfig) {
    this.config = config;
  }

  public getStats(): ChunkFetchStats {
    return { ...this.stats, isFallbackMode: this.isFallbackMode };
  }

  public resetStats(): void {
    this.stats = {
      bytesRequested: 0,
      requestsCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fetchedRanges: [],
      isFallbackMode: this.isFallbackMode,
      activeStrategy: this.isFallbackMode ? 'full-download-fallback' : 'http-range',
    };
  }

  public clearCache(): void {
    this.chunkCache.clear();
    this.fullFileBuffer = null;
    this.resetStats();
  }

  /**
   * Probes host to check if HTTP Range Requests (206 Partial Content) are supported
   */
  public async probeRangeSupport(): Promise<boolean> {
    try {
      const response = await fetch(this.config.databaseUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
      });

      if (response.status === 206) {
        this.isFallbackMode = false;
        this.stats.activeStrategy = 'http-range';
        return true;
      }
    } catch {
      // Fallback
    }

    this.isFallbackMode = true;
    this.stats.isFallbackMode = true;
    this.stats.activeStrategy = 'full-download-fallback';
    return false;
  }

  /**
   * Reads specific range of bytes using cached chunks or HTTP Range requests
   */
  public async readBytes(offset: number, length: number): Promise<Uint8Array> {
    if (this.isFallbackMode) {
      if (!this.fullFileBuffer) {
        const response = await fetch(this.config.databaseUrl);
        const arrayBuf = await response.arrayBuffer();
        this.fullFileBuffer = new Uint8Array(arrayBuf);
        this.stats.bytesRequested += arrayBuf.byteLength;
        this.stats.requestsCount++;
      }
      return this.fullFileBuffer.subarray(offset, Math.min(offset + length, this.fullFileBuffer.byteLength));
    }

    const chunkSize = this.config.pageSize || 4096;
    const startChunk = Math.floor(offset / chunkSize);
    const endChunk = Math.floor((offset + length - 1) / chunkSize);

    const resultBuffer = new Uint8Array(length);

    for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
      let chunkData = this.chunkCache.get(chunkIdx);

      if (chunkData) {
        this.stats.cacheHits++;
      } else {
        this.stats.cacheMisses++;
        chunkData = await this.fetchChunk(chunkIdx, chunkSize);
        this.chunkCache.set(chunkIdx, chunkData);
      }

      // Copy chunk bytes into target buffer slice
      const chunkStartOffset = chunkIdx * chunkSize;
      const readStart = Math.max(offset, chunkStartOffset);
      const readEnd = Math.min(offset + length, chunkStartOffset + chunkData.length);

      const targetOffset = readStart - offset;
      const sourceOffset = readStart - chunkStartOffset;
      const copyLen = readEnd - readStart;

      if (copyLen > 0) {
        resultBuffer.set(chunkData.subarray(sourceOffset, sourceOffset + copyLen), targetOffset);
      }
    }

    return resultBuffer;
  }

  private async fetchChunk(chunkIdx: number, chunkSize: number): Promise<Uint8Array> {
    const startByte = chunkIdx * chunkSize;
    const endByte = Math.min(startByte + chunkSize - 1, (this.config.totalSize || startByte + chunkSize) - 1);

    const headers = { Range: `bytes=${startByte}-${endByte}` };
    const response = await fetch(this.config.databaseUrl, { headers });

    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Failed to fetch chunk ${chunkIdx} via range request. Status: ${response.status}`);
    }

    const buf = await response.arrayBuffer();
    const bytes = new Uint8Array(buf);

    this.stats.bytesRequested += bytes.byteLength;
    this.stats.requestsCount++;
    this.stats.fetchedRanges.push({ start: startByte, end: endByte });

    return bytes;
  }

  /**
   * Materializes file buffer for sql.js initialization by fetching header + index pages
   */
  public async materializeBuffer(): Promise<Uint8Array> {
    if (this.isFallbackMode) {
      if (!this.fullFileBuffer) {
        await this.readBytes(0, 100);
      }
      return this.fullFileBuffer!;
    }

    // For range queries, read header + page 1 (schema table) and required pages into buffer
    const totalSize = this.config.totalSize || 600000;
    const fullBuf = new Uint8Array(totalSize);

    // Ensure page 1 (header + root schema page) is loaded
    const page1 = await this.readBytes(0, this.config.pageSize || 4096);
    fullBuf.set(page1, 0);

    return fullBuf;
  }
}

export class MiniSqlDbClient {
  private config: DBConfig | null = null;
  private vfs: RangeVirtualFileSystem | null = null;
  private sqlDb: Database | null = null;
  private configUrl: string;

  constructor(configUrl: string = '/db/config.json') {
    this.configUrl = configUrl;
  }

  public async initialize(): Promise<void> {
    if (this.sqlDb) return;

    const res = await fetch(this.configUrl);
    if (!res.ok) {
      throw new Error(`Failed to load database config from ${this.configUrl}`);
    }

    this.config = (await res.json()) as DBConfig;
    this.vfs = new RangeVirtualFileSystem(this.config);

    const supportsRange = await this.vfs.probeRangeSupport();

    // Fetch the database asset via Range or Fallback
    const response = await fetch(this.config.databaseUrl, {
      headers: supportsRange ? { Range: `bytes=0-${(this.config.totalSize || 602112) - 1}` } : {},
    });

    const arrayBuffer = await response.arrayBuffer();
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });

    this.sqlDb = new SQL.Database(new Uint8Array(arrayBuffer));
  }

  public async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const startTime = performance.now();

    if (!this.sqlDb) {
      await this.initialize();
    }

    if (!this.sqlDb) {
      throw new Error('Database failed to initialize');
    }

    const stmt = this.sqlDb.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params as any[]);
    }

    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const stats = this.vfs ? this.vfs.getStats() : {
      bytesRequested: 0,
      requestsCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fetchedRanges: [],
      isFallbackMode: false,
      activeStrategy: 'http-range' as const,
    };

    return {
      rows,
      executionTimeMs,
      stats,
    };
  }

  public getConfig(): DBConfig | null {
    return this.config;
  }

  public getStats(): ChunkFetchStats {
    if (this.vfs) {
      return this.vfs.getStats();
    }
    return {
      bytesRequested: 0,
      requestsCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fetchedRanges: [],
      isFallbackMode: false,
      activeStrategy: 'http-range',
    };
  }

  public resetStats(): void {
    if (this.vfs) {
      this.vfs.resetStats();
    }
  }

  public clearCache(): void {
    if (this.vfs) {
      this.vfs.clearCache();
    }
    this.sqlDb = null;
  }
}

export const defaultMiniSqlDbClient = new MiniSqlDbClient();
