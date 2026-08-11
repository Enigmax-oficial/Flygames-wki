export interface DailyRecord {
  id: string;
  date: string;
  metric_name: string;
  value: number;
  category: string;
  notes?: string;
  created_at: string;
}

export interface RecordSummary {
  totalCount: number;
  totalValue: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  categories: string[];
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export interface DBConfig {
  serverMode: string;
  databaseUrl: string;
  pageSize: number;
  requestChunkSize: number;
  totalSize: number;
  recordCount?: number;
  tables: string[];
  indexes: string[];
  generatedAt: string;
}

export interface ChunkFetchStats {
  bytesRequested: number;
  requestsCount: number;
  cacheHits: number;
  cacheMisses: number;
  fetchedRanges: Array<{ start: number; end: number }>;
  isFallbackMode: boolean;
  activeStrategy: 'http-range' | 'full-download-fallback';
}

export interface QueryResult<T> {
  rows: T[];
  executionTimeMs: number;
  stats: ChunkFetchStats;
}
