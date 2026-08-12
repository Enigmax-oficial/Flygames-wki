import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import crypto from 'crypto';

interface DailyRecordInput {
  id: string;
  date: string;
  metric_name: string;
  value: number;
  category: string;
  notes: string;
  created_at: string;
}

function generateSeedData(): DailyRecordInput[] {
  const categories = ['PageViews', 'CraftingEvents', 'UserRegistrations', 'WikiEdits', 'APIRequests'];
  const records: DailyRecordInput[] = [];

  const startDate = new Date('2025-01-01');
  const totalDays = 400; // Over 1 year of daily records

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const category of categories) {
      let baseVal = 100;
      if (category === 'PageViews') baseVal = 2500;
      if (category === 'CraftingEvents') baseVal = 850;
      if (category === 'UserRegistrations') baseVal = 45;
      if (category === 'WikiEdits') baseVal = 120;
      if (category === 'APIRequests') baseVal = 15000;

      // Add pseudo-random fluctuation and weekend variance
      const dayOfWeek = currentDate.getDay();
      const multiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
      const randomFactor = 0.8 + Math.random() * 0.4;
      const value = Math.round(baseVal * multiplier * randomFactor * 100) / 100;

      records.push({
        id: `rec-${dateStr}-${category.toLowerCase()}`,
        date: dateStr,
        metric_name: `${category}_DailyCount`,
        value,
        category,
        notes: `Recorded metrics for ${category} on ${dateStr}`,
        created_at: new Date(currentDate.getTime() + 3600000 * 12).toISOString(),
      });
    }
  }

  return records;
}

async function buildDatabase() {
  console.log('🚀 Starting SQLite HTTP Range Request database compilation...');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Configure SQLite Page Size and Journal Mode
  db.run('PRAGMA page_size = 4096;');
  db.run('PRAGMA journal_mode = DELETE;');

  // Create Table
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Create Indexes for optimal Range Request lookup
  db.run('CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);');
  db.run('CREATE INDEX IF NOT EXISTS idx_daily_records_category ON daily_records(category);');
  db.run('CREATE INDEX IF NOT EXISTS idx_daily_records_date_category ON daily_records(date, category);');

  console.log('📦 Inserting seed records into database...');
  const seedData = generateSeedData();

  db.run('BEGIN TRANSACTION;');
  const stmt = db.prepare(`
    INSERT INTO daily_records (id, date, metric_name, value, category, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);

  for (const row of seedData) {
    stmt.run([row.id, row.date, row.metric_name, row.value, row.category, row.notes, row.created_at]);
  }
  stmt.free();
  db.run('COMMIT;');

  console.log(`✅ Successfully inserted ${seedData.length} records.`);

  // Export DB binary
  const binaryData = db.export();
  const buffer = Buffer.from(binaryData);

  // Calculate SHA-256 content hash of the DB buffer (first 8 characters)
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 8);
  console.log(`🔑 Computed database SHA-256 build hash: ${hash}`);

  // Clean up obsolete hashed databases in public/
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const existingFiles = fs.readdirSync(publicDir);
    for (const file of existingFiles) {
      if (/^data\.[a-f0-9]+\.sqlite$/.test(file)) {
        try {
          fs.unlinkSync(path.join(publicDir, file));
          console.log(`🧹 Deleted stale compiled database: ${file}`);
        } catch (e) {
          console.warn(`Failed to clean up old DB file: ${file}`, e);
        }
      }
    }
  }

  const outputDir = path.join(process.cwd(), 'public', 'db');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dbPath = path.join(outputDir, 'dataset.sqlite');
  fs.writeFileSync(dbPath, buffer);
  console.log(`📄 Wrote ${buffer.byteLength} bytes to ${dbPath}`);

  // Write to public/data.sqlite as fallback
  const dataDbPath = path.join(process.cwd(), 'public', 'data.sqlite');
  fs.writeFileSync(dataDbPath, buffer);
  console.log(`📄 Wrote ${buffer.byteLength} bytes to ${dataDbPath}`);

  // Write content-hashed database to public/data.[hash].sqlite
  const hashedDbPath = path.join(publicDir, `data.${hash}.sqlite`);
  fs.writeFileSync(hashedDbPath, buffer);
  console.log(`📄 Wrote content-hashed database: ${hashedDbPath}`);

  // Auto-generate config.json describing database URL, page size, chunk size
  const config = {
    serverMode: 'full',
    url: '/db/dataset.sqlite',
    pageSize: 4096,
    requestChunkSize: 4096,
    databaseLengthBytes: buffer.byteLength,
    recordCount: seedData.length,
    tables: ['daily_records'],
    indexes: ['idx_daily_records_date', 'idx_daily_records_category', 'idx_daily_records_date_category'],
    generatedAt: new Date().toISOString(),
    buildHash: hash
  };

  const configPath = path.join(outputDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`⚙️ Wrote config file to ${configPath}`);

  // Generate data.config.json pointing to /data.[hash].sqlite
  const dataConfig = {
    ...config,
    url: `/data.${hash}.sqlite`,
  };
  const dataConfigPath = path.join(process.cwd(), 'public', 'data.config.json');
  fs.writeFileSync(dataConfigPath, JSON.stringify(dataConfig, null, 2), 'utf-8');
  console.log(`⚙️ Wrote data config file with hash mapping to ${dataConfigPath}`);

  db.close();
  console.log('🎉 Database build complete!');
}

buildDatabase().catch((err) => {
  console.error('❌ Failed to build database:', err);
  process.exit(1);
});
