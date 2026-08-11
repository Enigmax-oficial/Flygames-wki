import { MiniSqlDbClient, defaultMiniSqlDbClient } from './client.js';
import { DailyRecord, RecordSummary, CategoryBreakdown, QueryResult, ChunkFetchStats } from './types.js';

export class DailyRecordRepository {
  private client: MiniSqlDbClient;

  constructor(client: MiniSqlDbClient = defaultMiniSqlDbClient) {
    this.client = client;
  }

  /**
   * Fetch daily records for a specific date (uses idx_daily_records_date)
   */
  async getRecordsByDate(date: string): Promise<QueryResult<DailyRecord>> {
    const sql = `
      SELECT id, date, metric_name, value, category, notes, created_at
      FROM daily_records
      WHERE date = ?
      ORDER BY category ASC;
    `;
    return this.client.query<DailyRecord>(sql, [date]);
  }

  /**
   * Fetch daily records within a date range (uses idx_daily_records_date)
   */
  async getRecordsByDateRange(startDate: string, endDate: string): Promise<QueryResult<DailyRecord>> {
    const sql = `
      SELECT id, date, metric_name, value, category, notes, created_at
      FROM daily_records
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC, category ASC;
    `;
    return this.client.query<DailyRecord>(sql, [startDate, endDate]);
  }

  /**
   * Fetch daily records for a specific category (uses idx_daily_records_category)
   */
  async getRecordsByCategory(category: string, limit: number = 50): Promise<QueryResult<DailyRecord>> {
    const sql = `
      SELECT id, date, metric_name, value, category, notes, created_at
      FROM daily_records
      WHERE category = ?
      ORDER BY date DESC
      LIMIT ?;
    `;
    return this.client.query<DailyRecord>(sql, [category, limit]);
  }

  /**
   * Get aggregate summary statistics across all records
   */
  async getSummaryStats(): Promise<QueryResult<RecordSummary>> {
    const sql = `
      SELECT 
        COUNT(*) as totalCount,
        ROUND(SUM(value), 2) as totalValue,
        ROUND(AVG(value), 2) as avgValue,
        ROUND(MIN(value), 2) as minValue,
        ROUND(MAX(value), 2) as maxValue
      FROM daily_records;
    `;
    
    const categoriesResult = await this.client.query<{ category: string }>(
      'SELECT DISTINCT category FROM daily_records ORDER BY category;'
    );

    const statsResult = await this.client.query<{
      totalCount: number;
      totalValue: number;
      avgValue: number;
      minValue: number;
      maxValue: number;
    }>(sql);

    const summary: RecordSummary = {
      totalCount: statsResult.rows[0]?.totalCount || 0,
      totalValue: statsResult.rows[0]?.totalValue || 0,
      avgValue: statsResult.rows[0]?.avgValue || 0,
      minValue: statsResult.rows[0]?.minValue || 0,
      maxValue: statsResult.rows[0]?.maxValue || 0,
      categories: categoriesResult.rows.map((r) => r.category),
    };

    return {
      rows: [summary],
      executionTimeMs: statsResult.executionTimeMs + categoriesResult.executionTimeMs,
      stats: statsResult.stats,
    };
  }

  /**
   * Get breakdown grouped by category
   */
  async getCategoryBreakdown(): Promise<QueryResult<CategoryBreakdown>> {
    const sql = `
      SELECT 
        category,
        COUNT(*) as count,
        ROUND(SUM(value), 2) as totalValue,
        ROUND(AVG(value), 2) as avgValue
      FROM daily_records
      GROUP BY category
      ORDER BY totalValue DESC;
    `;
    return this.client.query<CategoryBreakdown>(sql);
  }

  /**
   * Execute custom read-only SQL queries
   */
  async executeCustomQuery<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    return this.client.query<T>(sql, params);
  }

  getStats(): ChunkFetchStats {
    return this.client.getStats();
  }

  resetStats(): void {
    this.client.resetStats();
  }

  clearCache(): void {
    this.client.clearCache();
  }
}

export const defaultDailyRecordRepository = new DailyRecordRepository();
