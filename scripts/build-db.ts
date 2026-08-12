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

  // Create Wiki Pages Table
  db.run(`
    CREATE TABLE IF NOT EXISTS wiki_pages (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      creator_email TEXT,
      updated_at TEXT
    );
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_wiki_pages_category ON wiki_pages(category);');

  console.log('📦 Resolving source dataset...');
  const sourcePath = path.join(process.cwd(), 'example', 'source-data.json');
  let seedData: DailyRecordInput[];
  if (fs.existsSync(sourcePath)) {
    console.log(`📦 Loading existing source records from ${sourcePath}...`);
    seedData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  } else {
    console.log('📦 File example/source-data.json not found. Generating initial seed dataset...');
    seedData = generateSeedData();
    const sourceDir = path.dirname(sourcePath);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    fs.writeFileSync(sourcePath, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log(`📦 Saved initial seed dataset to ${sourcePath}`);
  }

  console.log('📦 Resolving wiki pages source dataset...');
  const pagesSourcePath = path.join(process.cwd(), 'example', 'source-pages.json');
  let wikiPages: any[] = [];
  if (fs.existsSync(pagesSourcePath)) {
    console.log(`📦 Loading existing wiki pages from ${pagesSourcePath}...`);
    try {
      wikiPages = JSON.parse(fs.readFileSync(pagesSourcePath, 'utf-8'));
    } catch (err) {
      console.error('⚠️ Error parsing source-pages.json, resetting to empty array:', err);
      wikiPages = [];
    }
  } else {
    console.log('📦 File example/source-pages.json not found. Checking src/db/wiki.sqlite for extraction...');
    const wikiSqlitePath = path.join(process.cwd(), 'src', 'db', 'wiki.sqlite');
    if (fs.existsSync(wikiSqlitePath)) {
      try {
        const fileBuffer = fs.readFileSync(wikiSqlitePath);
        const sourceSqlDb = new SQL.Database(fileBuffer);
        const sourceStmt = sourceSqlDb.prepare('SELECT id, category, title, data, creator_email, updated_at FROM wiki_pages');
        while (sourceStmt.step()) {
          const row = sourceStmt.getAsObject();
          if (row.data) {
            try {
              wikiPages.push(JSON.parse(row.data as string));
            } catch {
              wikiPages.push({
                id: row.id,
                category: row.category,
                title: row.title,
                creatorEmail: row.creator_email,
                lastUpdated: row.updated_at
              });
            }
          }
        }
        sourceStmt.free();
        sourceSqlDb.close();
        console.log(`✅ Extracted ${wikiPages.length} wiki pages from src/db/wiki.sqlite`);
      } catch (err) {
        console.warn('⚠️ Could not extract wiki pages from src/db/wiki.sqlite:', err);
      }
    }
    // Save extracted pages (or empty array) to source-pages.json
    const pagesDir = path.dirname(pagesSourcePath);
    if (!fs.existsSync(pagesDir)) {
      fs.mkdirSync(pagesDir, { recursive: true });
    }
    fs.writeFileSync(pagesSourcePath, JSON.stringify(wikiPages, null, 2) + '\n', 'utf-8');
    console.log(`📦 Saved source pages to ${pagesSourcePath}`);
  }

  db.run('BEGIN TRANSACTION;');
  const stmt = db.prepare(`
    INSERT INTO daily_records (id, date, metric_name, value, category, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);

  for (const row of seedData) {
    stmt.run([row.id, row.date, row.metric_name, row.value, row.category, row.notes, row.created_at]);
  }
  stmt.free();

  const pageStmt = db.prepare(`
    INSERT INTO wiki_pages (id, category, title, data, creator_email, updated_at)
    VALUES (?, ?, ?, ?, ?, ?);
  `);

  for (const page of wikiPages) {
    const creatorEmail = page.creatorEmail || page.authorEmail || 'ruanpablolopesbritor@gmail.com';
    const lastUpdated = page.lastUpdated || new Date().toISOString();
    pageStmt.run([
      page.id,
      page.category || 'uncategorized',
      page.title || page.id,
      JSON.stringify(page),
      creatorEmail,
      lastUpdated
    ]);
  }
  pageStmt.free();
  db.run('COMMIT;');

  console.log(`✅ Successfully inserted ${seedData.length} records.`);
  console.log(`✅ Successfully inserted ${wikiPages.length} wiki pages.`);

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
    recordCount: seedData.length + wikiPages.length,
    tables: ['daily_records', 'wiki_pages'],
    indexes: ['idx_daily_records_date', 'idx_daily_records_category', 'idx_daily_records_date_category', 'idx_wiki_pages_category'],
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
