const express = require('express');
const cors = require('cors');
const {
  initDatabase,
  findOrCreatePatient,
  getPatientLogs,
  savePatientLog,
  deletePatientLog,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MedDemo MySQL Backend API is running' });
});

// Patient login endpoint
// Body: { userId, patientName, contactNumber }
app.post('/api/patients/login', async (req, res) => {
  try {
    const { userId, patientName, contactNumber } = req.body;

    if (!userId || !userId.trim()) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!patientName || !patientName.trim()) {
      return res.status(400).json({ error: 'Patient Name is required' });
    }

    const patient = await findOrCreatePatient({
      userId: userId.trim(),
      patientName: patientName.trim(),
      contactNumber: contactNumber ? contactNumber.trim() : null,
    });

    console.log(`👤 Patient authenticated: ${patient.patientName} (${patient.userId})`);
    res.json({ success: true, patient });
  } catch (error) {
    console.error('Error logging in patient:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get patient logs endpoint
app.get('/api/patients/:userId/logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await getPatientLogs(userId);
    res.json({ success: true, logs });
  } catch (error) {
    console.error(`Error fetching logs for patient ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create/Update patient log endpoint
app.post('/api/patients/:userId/logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const logData = req.body;

    if (!logData) {
      return res.status(400).json({ error: 'Log content is required' });
    }

    const savedLog = await savePatientLog(userId, logData);
    console.log(`📝 Saved log for patient ${userId}: ${savedLog.id}`);
    res.json({ success: true, log: savedLog });
  } catch (error) {
    console.error(`Error saving log for patient ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// Delete patient log endpoint
app.delete('/api/patients/:userId/logs/:logId', async (req, res) => {
  try {
    const { userId, logId } = req.params;
    await deletePatientLog(userId, logId);
    console.log(`🗑️ Deleted log ${logId} for patient ${userId}`);
    res.json({ success: true, logId });
  } catch (error) {
    console.error(`Error deleting log ${req.params.logId} for patient ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// Start database and server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 MedDemo Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
