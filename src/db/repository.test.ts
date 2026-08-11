import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DailyRecordRepository } from './repository.js';
import { MiniSqlDbClient } from './client.js';

describe('DailyRecordRepository', () => {
  let mockClient: jest.Mocked<MiniSqlDbClient>;
  let repository: DailyRecordRepository;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      getStats: jest.fn(),
      resetStats: jest.fn(),
      clearCache: jest.fn(),
      initialize: jest.fn(),
      getConfig: jest.fn(),
    } as unknown as jest.Mocked<MiniSqlDbClient>;

    repository = new DailyRecordRepository(mockClient);
  });

  it('queries records by date', async () => {
    const mockRecord = {
      id: 'rec-2026-02-15-pageviews',
      date: '2026-02-15',
      metric_name: 'PageViews_DailyCount',
      value: 2850,
      category: 'PageViews',
      notes: 'Recorded metrics',
      created_at: '2026-02-15T12:00:00.000Z',
    };

    mockClient.query.mockResolvedValueOnce({
      rows: [mockRecord],
      executionTimeMs: 1.2,
      stats: {
        bytesRequested: 4096,
        requestsCount: 1,
        cacheHits: 0,
        cacheMisses: 1,
        fetchedRanges: [{ start: 0, end: 4095 }],
        isFallbackMode: false,
        activeStrategy: 'http-range',
      },
    });

    const result = await repository.getRecordsByDate('2026-02-15');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe('2026-02-15');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE date = ?'),
      ['2026-02-15']
    );
  });

  it('queries category breakdown correctly', async () => {
    const mockBreakdown = [
      { category: 'PageViews', count: 400, totalValue: 1000000, avgValue: 2500 },
      { category: 'APIRequests', count: 400, totalValue: 6000000, avgValue: 15000 },
    ];

    mockClient.query.mockResolvedValueOnce({
      rows: mockBreakdown,
      executionTimeMs: 2.1,
      stats: {
        bytesRequested: 8192,
        requestsCount: 2,
        cacheHits: 1,
        cacheMisses: 1,
        fetchedRanges: [{ start: 0, end: 8191 }],
        isFallbackMode: false,
        activeStrategy: 'http-range',
      },
    });

    const result = await repository.getCategoryBreakdown();

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].category).toBe('PageViews');
    expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('GROUP BY category'));
  });
});
