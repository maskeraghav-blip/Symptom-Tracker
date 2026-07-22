import { HealthLog } from '../state/HealthContext';

const API_BASE_URL = 'http://localhost:5000/api';

export interface Patient {
  userId: string;
  patientName: string;
  contactNumber?: string;
}

export async function loginPatientApi(
  userId: string,
  patientName: string,
  contactNumber?: string
): Promise<Patient> {
  const response = await fetch(`${API_BASE_URL}/patients/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, patientName, contactNumber }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to authenticate patient');
  }

  return data.patient;
}

export async function fetchPatientLogsApi(userId: string): Promise<HealthLog[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(userId)}/logs`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch patient logs');
    }

    return (data.logs || []).map((log: any) => ({
      ...log,
      createdAt: new Date(log.createdAt || log.eventDateTime),
      eventDateTime: new Date(log.eventDateTime),
    }));
  } catch (err) {
    console.warn('Backend API fetch logs error:', err);
    return [];
  }
}

export async function savePatientLogApi(userId: string, log: HealthLog): Promise<HealthLog> {
  const response = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(userId)}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to save patient log');
  }

  return {
    ...data.log,
    createdAt: new Date(data.log.createdAt || data.log.eventDateTime),
    eventDateTime: new Date(data.log.eventDateTime),
  };
}

export async function deletePatientLogApi(userId: string, logId: string): Promise<boolean> {
  const response = await fetch(
    `${API_BASE_URL}/patients/${encodeURIComponent(userId)}/logs/${encodeURIComponent(logId)}`,
    {
      method: 'DELETE',
    }
  );

  const data = await response.json();
  return response.ok && data.success;
}
