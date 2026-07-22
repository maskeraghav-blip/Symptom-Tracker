const mysql = require('mysql2/promise');
require('dotenv').config();
const {
  initMongo,
  syncPatientToMongo,
  getPatientLogsFromMongo,
  savePatientLogToMongo,
  deletePatientLogFromMongo,
} = require('./mongo');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'meddemo_db';

let pool = null;
let isMySqlConnected = false;

// In-memory fallback if needed
const memoryStore = {
  patients: new Map(),
  logs: new Map(),
};

async function initDatabase() {
  // Initialize MongoDB first
  await initMongo();

  // Initialize MySQL
  try {
    const rootConnection = await mysql.createConnection(dbConfig);
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await rootConnection.end();

    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        user_id VARCHAR(100) PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Structured patient_logs table for clean SQL viewing by admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        log_type VARCHAR(50) DEFAULT 'symptom',
        event_date_time DATETIME NOT NULL,
        symptom VARCHAR(255) DEFAULT NULL,
        descriptor VARCHAR(255) DEFAULT NULL,
        body_region VARCHAR(255) DEFAULT NULL,
        sub_regions VARCHAR(500) DEFAULT NULL,
        body_system VARCHAR(255) DEFAULT NULL,
        severity INT DEFAULT NULL,
        began VARCHAR(100) DEFAULT NULL,
        frequency VARCHAR(100) DEFAULT NULL,
        duration VARCHAR(100) DEFAULT NULL,
        worse_triggers VARCHAR(500) DEFAULT NULL,
        better_triggers VARCHAR(500) DEFAULT NULL,
        medication_taken VARCHAR(10) DEFAULT 'No',
        medication_name VARCHAR(255) DEFAULT NULL,
        medication_effect VARCHAR(100) DEFAULT NULL,
        associated_symptoms VARCHAR(500) DEFAULT NULL,
        vitals_bp VARCHAR(50) DEFAULT NULL,
        vitals_heart_rate INT DEFAULT NULL,
        vitals_temperature DECIMAL(5,2) DEFAULT NULL,
        vitals_spo2 INT DEFAULT NULL,
        vitals_notes TEXT DEFAULT NULL,
        log_data JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES patients(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safely migrate existing tables by inspecting columns
    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM patient_logs');
      const colNames = cols.map((c) => c.Field);

      const requiredColumns = [
        { name: 'symptom', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'descriptor', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'body_region', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'sub_regions', type: 'VARCHAR(500) DEFAULT NULL' },
        { name: 'body_system', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'severity', type: 'INT DEFAULT NULL' },
        { name: 'began', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'frequency', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'duration', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'worse_triggers', type: 'VARCHAR(500) DEFAULT NULL' },
        { name: 'better_triggers', type: 'VARCHAR(500) DEFAULT NULL' },
        { name: 'medication_taken', type: "VARCHAR(10) DEFAULT 'No'" },
        { name: 'medication_name', type: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'medication_effect', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'associated_symptoms', type: 'VARCHAR(500) DEFAULT NULL' },
        { name: 'vitals_bp', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'vitals_heart_rate', type: 'INT DEFAULT NULL' },
        { name: 'vitals_temperature', type: 'DECIMAL(5,2) DEFAULT NULL' },
        { name: 'vitals_spo2', type: 'INT DEFAULT NULL' },
        { name: 'vitals_notes', type: 'TEXT DEFAULT NULL' },
      ];

      for (const col of requiredColumns) {
        if (!colNames.includes(col.name)) {
          await pool.query(`ALTER TABLE patient_logs ADD COLUMN \`${col.name}\` ${col.type};`);
        }
      }
    } catch (migErr) {
      console.warn('Migration column check notice:', migErr.message);
    }

    isMySqlConnected = true;
    console.log(`Successfully connected to MySQL database '${dbName}' at ${dbConfig.host}:${dbConfig.port}`);
  } catch (error) {
    console.warn(`⚠️ MySQL Connection Warning: ${error.message}`);
    isMySqlConnected = false;
  }
}

// Dual-Database Patient Authentication (MySQL + MongoDB)
async function findOrCreatePatient({ userId, patientName, contactNumber }) {
  let result = null;

  if (pool && isMySqlConnected) {
    try {
      const [existing] = await pool.query('SELECT * FROM patients WHERE user_id = ?', [userId]);
      if (existing.length > 0) {
        await pool.query(
          'UPDATE patients SET patient_name = ?, contact_number = ? WHERE user_id = ?',
          [patientName, contactNumber || null, userId]
        );
        result = {
          userId: existing[0].user_id,
          patientName: patientName,
          contactNumber: contactNumber || existing[0].contact_number,
        };
      } else {
        await pool.query(
          'INSERT INTO patients (user_id, patient_name, contact_number) VALUES (?, ?, ?)',
          [userId, patientName, contactNumber || null]
        );
        result = { userId, patientName, contactNumber: contactNumber || null };
      }
    } catch (err) {
      console.error('Error in MySQL findOrCreatePatient:', err.message);
    }
  }

  await syncPatientToMongo({ userId, patientName, contactNumber });

  if (result) return result;

  const existing = memoryStore.patients.get(userId);
  const patient = {
    userId,
    patientName,
    contactNumber: contactNumber || (existing ? existing.contactNumber : null),
  };
  memoryStore.patients.set(userId, patient);
  if (!memoryStore.logs.has(userId)) {
    memoryStore.logs.set(userId, []);
  }
  return patient;
}

// Fetch logs from MySQL or MongoDB
async function getPatientLogs(userId) {
  if (pool && isMySqlConnected) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM patient_logs WHERE user_id = ? ORDER BY event_date_time DESC',
        [userId]
      );
      return rows.map((row) => {
        let data = {};
        if (row.log_data) {
          data = typeof row.log_data === 'string' ? JSON.parse(row.log_data) : row.log_data;
        }
        return {
          ...data,
          id: row.id,
          createdAt: row.created_at,
          eventDateTime: row.event_date_time,
          type: row.log_type,
          symptom: row.symptom || data.symptom,
          descriptor: row.descriptor || data.descriptor,
          bodyRegion: row.body_region || data.bodyRegion,
          bodySystem: row.body_system || data.bodySystem,
          subRegions: row.sub_regions ? row.sub_regions.split(', ') : data.subRegions,
          severity: row.severity !== null ? row.severity : data.severity,
          began: row.began || data.began,
          frequency: row.frequency || data.frequency,
          duration: row.duration || data.duration,
          worseTriggers: row.worse_triggers ? row.worse_triggers.split(', ') : data.worseTriggers,
          betterTriggers: row.better_triggers ? row.better_triggers.split(', ') : data.betterTriggers,
          takenMedication: row.medication_taken === 'Yes' || data.takenMedication,
          medicationName: row.medication_name || data.medicationName,
          medicationEffect: row.medication_effect || data.medicationEffect,
          associatedSymptoms: row.associated_symptoms ? row.associated_symptoms.split(', ') : data.associatedSymptoms,
          vitals: (row.vitals_bp || row.vitals_heart_rate || row.vitals_temperature || row.vitals_spo2 || row.vitals_notes) ? {
            systolic: row.vitals_bp ? parseInt(row.vitals_bp.split('/')[0]) : data.vitals?.systolic,
            diastolic: row.vitals_bp ? parseInt(row.vitals_bp.split('/')[1]) : data.vitals?.diastolic,
            heartRate: row.vitals_heart_rate || data.vitals?.heartRate,
            temperature: row.vitals_temperature || data.vitals?.temperature,
            oxygenSaturation: row.vitals_spo2 || data.vitals?.oxygenSaturation,
            notes: row.vitals_notes || data.vitals?.notes,
          } : data.vitals,
        };
      });
    } catch (err) {
      console.error('Error in MySQL getPatientLogs:', err.message);
    }
  }

  const mongoLogs = await getPatientLogsFromMongo(userId);
  if (mongoLogs && mongoLogs.length > 0) {
    return mongoLogs;
  }

  return memoryStore.logs.get(userId) || [];
}

// Save log to both MySQL AND MongoDB in clean individual columns
async function savePatientLog(userId, log) {
  const logId = log.id || Math.random().toString(36).substring(7);
  const logType = log.type || 'symptom';
  const eventDateTime = log.eventDateTime ? new Date(log.eventDateTime) : new Date();
  const fullLog = { ...log, id: logId, eventDateTime };

  const subRegionsStr = Array.isArray(log.subRegions) ? log.subRegions.join(', ') : (log.subRegions || null);
  const worseTriggersStr = Array.isArray(log.worseTriggers) ? log.worseTriggers.join(', ') : (log.worseTriggers || null);
  const betterTriggersStr = Array.isArray(log.betterTriggers) ? log.betterTriggers.join(', ') : (log.betterTriggers || null);
  const assocSymptomsStr = Array.isArray(log.associatedSymptoms) ? log.associatedSymptoms.join(', ') : (log.associatedSymptoms || null);
  const medTakenStr = log.takenMedication ? 'Yes' : 'No';
  const bpStr = log.vitals?.systolic && log.vitals?.diastolic ? `${log.vitals.systolic}/${log.vitals.diastolic} mmHg` : null;

  // 1. MySQL Clean Column Save
  if (pool && isMySqlConnected) {
    try {
      const sqlQuery = `
        INSERT INTO patient_logs (
          id, user_id, log_type, event_date_time,
          symptom, descriptor, body_region, sub_regions, body_system, severity,
          began, frequency, duration, worse_triggers, better_triggers,
          medication_taken, medication_name, medication_effect, associated_symptoms,
          vitals_bp, vitals_heart_rate, vitals_temperature, vitals_spo2, vitals_notes,
          log_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          log_type = VALUES(log_type),
          event_date_time = VALUES(event_date_time),
          symptom = VALUES(symptom),
          descriptor = VALUES(descriptor),
          body_region = VALUES(body_region),
          sub_regions = VALUES(sub_regions),
          body_system = VALUES(body_system),
          severity = VALUES(severity),
          began = VALUES(began),
          frequency = VALUES(frequency),
          duration = VALUES(duration),
          worse_triggers = VALUES(worse_triggers),
          better_triggers = VALUES(better_triggers),
          medication_taken = VALUES(medication_taken),
          medication_name = VALUES(medication_name),
          medication_effect = VALUES(medication_effect),
          associated_symptoms = VALUES(associated_symptoms),
          vitals_bp = VALUES(vitals_bp),
          vitals_heart_rate = VALUES(vitals_heart_rate),
          vitals_temperature = VALUES(vitals_temperature),
          vitals_spo2 = VALUES(vitals_spo2),
          vitals_notes = VALUES(vitals_notes),
          log_data = VALUES(log_data)
      `;

      const values = [
        logId,
        userId,
        logType,
        eventDateTime,
        log.symptom || null,
        log.descriptor || null,
        log.bodyRegion || null,
        subRegionsStr,
        log.bodySystem || null,
        log.severity !== undefined ? log.severity : null,
        log.began || null,
        log.frequency || null,
        log.duration || null,
        worseTriggersStr,
        betterTriggersStr,
        medTakenStr,
        log.medicationName || null,
        log.medicationEffect || null,
        assocSymptomsStr,
        bpStr,
        log.vitals?.heartRate || null,
        log.vitals?.temperature || null,
        log.vitals?.oxygenSaturation || null,
        log.vitals?.notes || null,
        JSON.stringify(fullLog),
      ];

      await pool.query(sqlQuery, values);
    } catch (err) {
      console.error('Error in MySQL savePatientLog:', err.message);
    }
  }

  // 2. MongoDB Save
  await savePatientLogToMongo(userId, fullLog);

  // In-memory update
  const userLogs = memoryStore.logs.get(userId) || [];
  const existingIdx = userLogs.findIndex((l) => l.id === logId);
  if (existingIdx >= 0) {
    userLogs[existingIdx] = fullLog;
  } else {
    userLogs.unshift(fullLog);
  }
  memoryStore.logs.set(userId, userLogs);

  return fullLog;
}

// Delete log from both MySQL AND MongoDB
async function deletePatientLog(userId, logId) {
  if (pool && isMySqlConnected) {
    try {
      await pool.query('DELETE FROM patient_logs WHERE user_id = ? AND id = ?', [userId, logId]);
    } catch (err) {
      console.error('Error in MySQL deletePatientLog:', err.message);
    }
  }

  await deletePatientLogFromMongo(userId, logId);

  const userLogs = memoryStore.logs.get(userId) || [];
  memoryStore.logs.set(userId, userLogs.filter((l) => l.id !== logId));
  return true;
}

module.exports = {
  initDatabase,
  findOrCreatePatient,
  getPatientLogs,
  savePatientLog,
  deletePatientLog,
};
