/**
 * Dedicated database health check utility
 */
export interface HealthCheckResult {
  success: boolean;
  integrityOk: boolean;
  schemaOk: boolean;
  countOk: boolean;
  trace: {
    integrity: any;
    schema: any;
    count: any;
  };
}

export async function runDatabaseHealthCheck(
  queryFn: <T>(sql: string, params?: unknown[]) => Promise<T[]>
): Promise<HealthCheckResult> {
  let integrityOk = false;
  let schemaOk = false;
  let countOk = false;
  let integrityResults: any = null;
  let schemaResults: any = null;
  let countResults: any = null;

  // 1. PRAGMA integrity_check
  try {
    integrityResults = await queryFn<any>('PRAGMA integrity_check;');
    integrityOk = !!(
      integrityResults &&
      integrityResults.length > 0 &&
      integrityResults[0].integrity_check === 'ok'
    );
  } catch (err) {
    integrityOk = false;
  }

  // 2. Schema check (sqlite_master)
  try {
    schemaResults = await queryFn<any>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_records';"
    );
    schemaOk = !!(
      schemaResults &&
      schemaResults.length > 0 &&
      schemaResults[0].name === 'daily_records'
    );
  } catch (err) {
    schemaOk = false;
  }

  // 3. COUNT(*) check on daily_records
  try {
    countResults = await queryFn<any>('SELECT COUNT(*) as count FROM daily_records;');
    countOk = !!(
      countResults &&
      countResults.length > 0 &&
      typeof countResults[0].count === 'number' &&
      countResults[0].count > 0
    );
  } catch (err) {
    countOk = false;
  }

  return {
    success: integrityOk && schemaOk && countOk,
    integrityOk,
    schemaOk,
    countOk,
    trace: {
      integrity: integrityResults,
      schema: schemaResults,
      count: countResults,
    },
  };
}
