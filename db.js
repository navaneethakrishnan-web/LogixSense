/**
 * LogixSense Database Manager (db.js)
 * Supports:
 *   1. Oracle Database (via `oracledb`)
 *   2. SQLite (via `sqlite3` or `better-sqlite3`)
 *   3. Embedded Zero-Dependency JSON SQL Engine (Default Fallback)
 */

const fs = require('fs');
const path = require('path');

let oracledb = null;
try {
  oracledb = require('oracledb');
  if (oracledb) oracledb.autoCommit = true;
} catch (e) {}

let sqlite3 = null;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {}

const JSON_DB_FILE = path.join(__dirname, 'logixsense_db.json');

let dbDriver = 'json'; // 'oracle', 'sqlite', or 'json'
let oraclePool = null;
let sqliteDb = null;

// In-Memory JSON Database store
let jsonDb = {
  companies: [
    { id: 'comp_01', name: 'Express Logistics India', code: 'ELI-01', created_at: new Date().toISOString() },
    { id: 'comp_02', name: 'Southern Freight Lines', code: 'SFL-02', created_at: new Date().toISOString() }
  ],
  users: [
    { id: 'usr_admin', email: 'admin@logixsense.com', name: 'System Admin', role: 'admin', company_id: 'comp_01', preferred_language: 'en' },
    { id: 'usr_driver1', email: 'arun@logixsense.com', name: 'Arun Kumar', role: 'driver', company_id: 'comp_01', preferred_language: 'ta' },
    { id: 'usr_driver2', email: 'rahul@logixsense.com', name: 'Rahul Sharma', role: 'driver', company_id: 'comp_01', preferred_language: 'hi' }
  ],
  shipments: [
    { id: 'SHP1001', shipment_number: 'SHP-2026-001', company_id: 'comp_01', driver_id: 'usr_driver1', origin: 'Chennai Port, TN', destination: 'Bengaluru Hub, KA', status: 'in_transit', risk_level: 'low', eta: '4 hours', created_at: new Date().toISOString() },
    { id: 'SHP1002', shipment_number: 'SHP-2026-002', company_id: 'comp_01', driver_id: 'usr_driver2', origin: 'Mumbai JNPT, MH', destination: 'Pune Industrial Zone, MH', status: 'in_transit', risk_level: 'high', eta: '2 hours', created_at: new Date().toISOString() },
    { id: 'SHP1003', shipment_number: 'SHP-2026-003', company_id: 'comp_01', driver_id: 'usr_driver1', origin: 'Delhi NCR Cargo Term', destination: 'Agra Freight Depot, UP', status: 'pending', risk_level: 'medium', eta: '3 hours', created_at: new Date().toISOString() }
  ],
  routes: [
    { id: 'ROT001', shipment_id: 'SHP1001', origin: 'Chennai Port, TN', destination: 'Bengaluru Hub, KA', distance_km: 346.5, est_time_mins: 360, time_saved_mins: 45, risk_score: 12 },
    { id: 'ROT002', shipment_id: 'SHP1002', origin: 'Mumbai JNPT, MH', destination: 'Pune Industrial Zone, MH', distance_km: 148.0, est_time_mins: 180, time_saved_mins: 15, risk_score: 82 }
  ],
  alerts: [
    { id: 'ALT001', shipment_id: 'SHP1002', route_info: 'Mumbai to Pune via NH48', risk_score: 82, explanation: 'Heavy congestion at Khopoli ghat. Monsoon-related road damage detected.', status: 'active', created_at: new Date().toISOString() },
    { id: 'ALT002', shipment_id: 'SHP1003', route_info: 'Delhi to Agra via NH19', risk_score: 55, explanation: 'Toll plaza congestion near Mathura. Moderate delay expected.', status: 'active', created_at: new Date().toISOString() }
  ],
  stoppages: [
    { id: 'STP001', shipment_id: 'SHP1001', driver_id: 'usr_driver1', location: 'Vellore Toll Plaza, TN', duration_mins: 25, reason: 'Scheduled mandatory driver break & rest', created_at: new Date().toISOString() },
    { id: 'STP002', shipment_id: 'SHP1002', driver_id: 'usr_driver2', location: 'Lonavala Expressway Rest Area', duration_mins: 40, reason: 'Vehicle tire inspection & refueling', created_at: new Date().toISOString() }
  ],
  assignments: [
    { id: 'ASN001', shipment_id: 'SHP1001', driver_uid: 'usr_driver1', company_id: 'comp_01', status: 'assigned', assigned_at: new Date().toISOString() }
  ],
  notifications: [
    { id: 'NOT001', user_id: 'usr_driver1', driver_uid: 'usr_driver1', company_id: 'comp_01', title: 'Route Alert', message: 'Heavy rain predicted on NH48', is_read: 0, created_at: new Date().toISOString() }
  ],
  trip_logs: [
    { id: 'LOG001', driver_id: 'usr_driver1', month: '2026-08', co2_emitted_kg: 420.5, co2_saved_kg: 68.0, fuel_consumed_l: 155.2 },
    { id: 'LOG002', driver_id: 'usr_driver2', month: '2026-08', co2_emitted_kg: 510.0, co2_saved_kg: 42.5, fuel_consumed_l: 188.0 }
  ],
  behavior_events: [
    { id: 'EVT001', driver_id: 'usr_driver1', shipment_id: 'SHP1001', event_type: 'harsh_braking', severity: 'low', detected_at: new Date().toISOString() }
  ],
  driver_scores: [
    { driver_id: 'usr_driver1', driver_name: 'Arun Kumar', safety_score: 94, eco_score: 91, total_trips: 142, updated_at: new Date().toISOString() },
    { driver_id: 'usr_driver2', driver_name: 'Rahul Sharma', safety_score: 87, eco_score: 85, total_trips: 98, updated_at: new Date().toISOString() }
  ],
  sos_alerts: []
};

function saveJsonDb() {
  try {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(jsonDb, null, 2), 'utf8');
  } catch (e) {}
}

function loadJsonDb() {
  if (fs.existsSync(JSON_DB_FILE)) {
    try {
      jsonDb = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf8'));
    } catch(e) {}
  } else {
    saveJsonDb();
  }
}

/**
 * Initialize Database connection
 */
async function initDatabase() {
  // 1. Try Oracle Database
  if (oracledb && process.env.USE_ORACLE === 'true') {
    try {
      oraclePool = await oracledb.createPool({
        user: process.env.ORACLE_USER || 'system',
        password: process.env.ORACLE_PASSWORD || 'oracle',
        connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/xe'
      });
      dbDriver = 'oracle';
      console.log('LogixSense DB: Connected to Oracle Database successfully!');
      return true;
    } catch (e) {
      console.warn('LogixSense DB: Could not connect to Oracle DB, trying SQLite fallback:', e.message);
    }
  }

  // 2. Try SQLite
  if (sqlite3) {
    try {
      const DB_FILE = path.join(__dirname, 'logixsense.db');
      sqliteDb = new sqlite3.Database(DB_FILE);
      dbDriver = 'sqlite';
      console.log(`LogixSense DB: SQLite Database connected at ${DB_FILE}`);
      return true;
    } catch (e) {}
  }

  // 3. Zero-dependency JSON Database Fallback
  loadJsonDb();
  dbDriver = 'json';
  console.log(`LogixSense DB: Embedded SQL/JSON Database initialized at ${JSON_DB_FILE}`);
  return true;
}

/**
 * Execute SELECT queries
 */
async function query(sql, params = []) {
  if (dbDriver === 'oracle' && oraclePool) {
    const conn = await oraclePool.getConnection();
    try {
      const result = await conn.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      conn.close();
      return result.rows || [];
    } catch (e) {
      conn.close();
      throw e;
    }
  }

  if (dbDriver === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Basic JSON SQL parser fallback for SELECT * FROM table
  const match = sql.match(/SELECT\s+.*?\s+FROM\s+([a-zA-Z0-9_]+)/i);
  if (match) {
    const tableName = match[1].toLowerCase();
    return jsonDb[tableName] ? [...jsonDb[tableName]] : [];
  }
  return [];
}

/**
 * Execute INSERT / UPDATE / DELETE queries
 */
async function execute(sql, params = []) {
  if (dbDriver === 'oracle' && oraclePool) {
    const conn = await oraclePool.getConnection();
    try {
      const res = await conn.execute(sql, params, { autoCommit: true });
      conn.close();
      return res;
    } catch (e) {
      conn.close();
      throw e;
    }
  }

  if (dbDriver === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // Simple insert helper for JSON engine
  const insertMatch = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
  if (insertMatch && params && typeof params === 'object') {
    const tableName = insertMatch[1].toLowerCase();
    if (!jsonDb[tableName]) jsonDb[tableName] = [];
    jsonDb[tableName].push(params);
    saveJsonDb();
  }
  return { success: true };
}

/**
 * Get all tables & row counts for Database Inspector UI
 */
async function getTables() {
  const tableNames = [
    'shipments', 'alerts', 'stoppages', 'users', 'companies',
    'routes', 'assignments', 'notifications', 'trip_logs',
    'behavior_events', 'driver_scores', 'sos_alerts'
  ];

  const results = [];
  for (const table of tableNames) {
    let count = 0;
    if (jsonDb[table]) {
      count = jsonDb[table].length;
    } else {
      try {
        const rows = await query(`SELECT COUNT(*) as count FROM ${table}`);
        count = rows[0] ? (rows[0].count || rows[0].COUNT || 0) : 0;
      } catch(e) {}
    }
    results.push({ table, count, status: 'Active' });
  }

  return { driver: dbDriver.toUpperCase() + ' Engine', tables: results };
}

/**
 * Get rows for a table (for Database Inspector UI)
 */
async function getTableData(tableName) {
  const safeName = tableName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
  if (jsonDb[safeName]) {
    return { table: safeName, count: jsonDb[safeName].length, rows: jsonDb[safeName] };
  }
  try {
    const rows = await query(`SELECT * FROM ${safeName}`);
    return { table: safeName, count: rows.length, rows };
  } catch (e) {
    return { table: safeName, count: 0, rows: [], error: e.message };
  }
}

/**
 * Insert helper for API routes
 */
async function insertRecord(tableName, record) {
  const safeName = tableName.toLowerCase();
  if (!jsonDb[safeName]) jsonDb[safeName] = [];
  if (!record.id) record.id = 'ID_' + Date.now();
  record.created_at = new Date().toISOString();
  jsonDb[safeName].unshift(record);
  saveJsonDb();
  return record;
}

module.exports = {
  initDatabase,
  query,
  execute,
  getTables,
  getTableData,
  insertRecord,
  get jsonDb() { return jsonDb; }
};
