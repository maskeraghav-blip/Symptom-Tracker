const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/meddemo_db';

let isMongoConnected = false;

// 1. Patient Schema & Model
const PatientSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    patientName: { type: String, required: true },
    contactNumber: { type: String, default: null },
  },
  { timestamps: true }
);

const PatientModel = mongoose.model('Patient', PatientSchema);

// 2. Patient Log Schema & Model
const PatientLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    logType: { type: String, default: 'symptom' },
    eventDateTime: { type: Date, required: true },
    logData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const PatientLogModel = mongoose.model('PatientLog', PatientLogSchema);

async function initMongo() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(`Successfully connected to MongoDB database at '${mongoUri}'`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.warn(`⚠️ Backend will continue serving MySQL & API requests while MongoDB is pending.`);
    isMongoConnected = false;
  }
}

async function syncPatientToMongo({ userId, patientName, contactNumber }) {
  if (!isMongoConnected) return null;
  try {
    const updated = await PatientModel.findOneAndUpdate(
      { userId },
      { userId, patientName, contactNumber: contactNumber || null },
      { upsert: true, new: true }
    );
    return updated;
  } catch (err) {
    console.error('Error syncing patient to MongoDB:', err.message);
    return null;
  }
}

async function getPatientLogsFromMongo(userId) {
  if (!isMongoConnected) return null;
  try {
    const rows = await PatientLogModel.find({ userId }).sort({ eventDateTime: -1 }).lean();
    return rows.map((row) => ({
      ...row.logData,
      id: row.id,
      createdAt: row.createdAt,
      eventDateTime: row.eventDateTime,
      type: row.logType,
    }));
  } catch (err) {
    console.error('Error fetching patient logs from MongoDB:', err.message);
    return null;
  }
}

async function savePatientLogToMongo(userId, log) {
  if (!isMongoConnected) return null;
  try {
    const logId = log.id || Math.random().toString(36).substring(7);
    const logType = log.type || 'symptom';
    const eventDateTime = log.eventDateTime ? new Date(log.eventDateTime) : new Date();

    const saved = await PatientLogModel.findOneAndUpdate(
      { id: logId, userId },
      { id: logId, userId, logType, eventDateTime, logData: log },
      { upsert: true, new: true }
    );
    return saved;
  } catch (err) {
    console.error('Error saving log to MongoDB:', err.message);
    return null;
  }
}

async function deletePatientLogFromMongo(userId, logId) {
  if (!isMongoConnected) return false;
  try {
    await PatientLogModel.deleteOne({ userId, id: logId });
    return true;
  } catch (err) {
    console.error('Error deleting log from MongoDB:', err.message);
    return false;
  }
}

module.exports = {
  initMongo,
  syncPatientToMongo,
  getPatientLogsFromMongo,
  savePatientLogToMongo,
  deletePatientLogFromMongo,
};
