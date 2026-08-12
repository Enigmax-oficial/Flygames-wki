import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

export interface DailyRecord {
  id: string;
  date: string;
  metric_name: string;
  value: number;
  category: string;
  notes?: string;
  created_at: string;
}

const sourcePath = path.join(process.cwd(), 'example', 'source-data.json');
const lockPath = path.join(process.cwd(), 'example', 'source-data.json.lock');

// 1. Lock acquisition helper (idempotency & safety)
async function acquireLock(timeoutMs = 15000, pollIntervalMs = 100): Promise<void> {
  const start = Date.now();
  const sourceDir = path.dirname(sourcePath);
  if (!fs.existsSync(sourceDir)) {
    fs.mkdirSync(sourceDir, { recursive: true });
  }

  while (true) {
    try {
      // Create the lock file using 'wx' flag (fails if file already exists)
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return; // Lock successfully acquired
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Lock acquisition timed out on ${lockPath}. Another process is holding the file lock.`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
}

// 2. Lock release helper
function releaseLock(): void {
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  } catch (err) {
    console.error(`Failed to release lock file at ${lockPath}:`, err);
  }
}

// 3. Core record append function
export async function appendRecord(record: Omit<DailyRecord, 'id'>): Promise<void> {
  // Validation
  if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    throw new Error(`Validation Error: 'date' must be in YYYY-MM-DD format. Got: "${record.date}"`);
  }
  if (!record.category || typeof record.category !== 'string' || record.category.trim() === '') {
    throw new Error("Validation Error: 'category' must be a non-empty string.");
  }
  if (!record.metric_name || typeof record.metric_name !== 'string' || record.metric_name.trim() === '') {
    throw new Error("Validation Error: 'metric_name' must be a non-empty string.");
  }
  if (typeof record.value !== 'number' || isNaN(record.value)) {
    throw new Error(`Validation Error: 'value' must be a valid number. Got: ${record.value}`);
  }

  console.log('🔒 Acquiring source dataset file lock...');
  await acquireLock();

  try {
    // Read current source dataset
    let dataset: DailyRecord[] = [];
    if (fs.existsSync(sourcePath)) {
      const content = fs.readFileSync(sourcePath, 'utf-8');
      dataset = JSON.parse(content);
    }

    // Check for duplicate key
    const uniqueSuffix = crypto.randomBytes(3).toString('hex');
    const id = `rec-${record.date}-${record.category.toLowerCase()}-${uniqueSuffix}`;

    const newRecord: DailyRecord = {
      id,
      date: record.date,
      metric_name: record.metric_name,
      value: record.value,
      category: record.category,
      notes: record.notes || '',
      created_at: record.created_at || new Date().toISOString(),
    };

    dataset.push(newRecord);

    // Save with clean layout and trailing newline
    fs.writeFileSync(sourcePath, JSON.stringify(dataset, null, 2) + '\n', 'utf-8');
    console.log(`📝 Appended record ${id} to source dataset.`);

  } finally {
    console.log('🔓 Releasing source dataset file lock...');
    releaseLock();
  }

  // 4. Rebuild trigger (executes npm run build:db)
  console.log('🛠️ Rebuilding static SQLite database files...');
  try {
    execSync('npm run build:db', { stdio: 'inherit' });
  } catch (err: any) {
    console.error('❌ Rebuild failed with errors.');
    throw new Error(`Rebuild step failed: ${err.message}`);
  }

  // 5. Deploy trigger
  console.log('🌐 Executing static deployment step...');
  const deployCommand = process.env.DEPLOY_COMMAND;
  if (deployCommand) {
    console.log(`🚀 Shelling out to DEPLOY_COMMAND: ${deployCommand}`);
    try {
      execSync(deployCommand, { stdio: 'inherit' });
    } catch (err: any) {
      console.error('❌ Deployment shell command execution failed!');
      throw new Error(`Deploy step failed: ${err.message}`);
    }
  } else {
    // Simulated/Log-based deployment step
    console.log('📤 [Simulated Deploy] Syncing changed SQLite assets to static storage bucket/CDN...');
    console.log('📤 [Simulated Deploy] Uploaded: public/data.sqlite -> Static CDN');
    console.log('📤 [Simulated Deploy] Uploaded: public/data.config.json -> Static CDN');
    console.log('✅ [Simulated Deploy] CDN cache-busting successfully completed.');
  }

  // 6. User Verification & Cache-Busting Feedback
  try {
    const configContent = fs.readFileSync(path.join(process.cwd(), 'public', 'data.config.json'), 'utf-8');
    const configObj = JSON.parse(configContent);
    console.log('\n======================================================');
    console.log('🎉 SUCCESSFUL WRITE-THROUGH PROCESS COMPLETED!');
    console.log(`📅 Timestamp:     ${configObj.generatedAt}`);
    console.log(`📦 Records:       ${configObj.recordCount}`);
    console.log(`🔑 Build Hash:     ${configObj.buildHash}`);
    console.log(`🔗 Deployed URL:   /data.${configObj.buildHash}.sqlite`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.warn('⚠️ Warning: Could not read verified data.config.json after deployment.', err);
  }
}

// CLI Execution Handler
async function runCLI() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const parts = arg.substring(2).split('=');
      if (parts.length === 2) {
        params[parts[0]] = parts[1];
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          params[parts[0]] = next;
          i++;
        }
      }
    }
  }

  // Fallback default value parser
  const date = params.date || new Date().toISOString().split('T')[0];
  const category = params.category;
  const valueStr = params.value;
  const metric_name = params.metric_name || (category ? `${category}_DailyCount` : '');
  const notes = params.notes || `Manually recorded via CLI on ${new Date().toLocaleDateString()}`;

  if (!category || !valueStr) {
    console.error('❌ Missing required parameters.');
    console.log('Usage: npm run record -- --category=<category> --value=<value> [--date=YYYY-MM-DD] [--metric_name=<name>] [--notes="..."]');
    process.exit(1);
  }

  const value = parseFloat(valueStr);
  if (isNaN(value)) {
    console.error(`❌ Invalid value parameter: "${valueStr}" must be a number.`);
    process.exit(1);
  }

  try {
    await appendRecord({
      date,
      category,
      value,
      metric_name,
      notes,
      created_at: new Date().toISOString(),
    });
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error writing record:', err.message);
    process.exit(1);
  }
}

// Run CLI directly if called from command line
const isMain = process.argv[1] && (process.argv[1].endsWith('record.ts') || process.argv[1].endsWith('record.js'));
if (isMain) {
  runCLI();
}
