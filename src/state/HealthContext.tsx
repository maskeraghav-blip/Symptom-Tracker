import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Patient,
  loginPatientApi,
  fetchPatientLogsApi,
  savePatientLogApi,
  deletePatientLogApi,
} from '../services/api';

export interface HealthLog {
  id: string;
  createdAt: Date;
  eventDateTime: Date;
  regions?: string[];
  subRegions?: string[];
  bodyRegion?: string;
  bodySystem?: string;
  symptom?: string;
  descriptor?: string;
  severity?: number;
  began?: string;
  frequency?: string;
  duration?: string;
  worseTriggers?: string[];
  betterTriggers?: string[];
  takenMedication?: boolean;
  medicationName?: string;
  medicationEffect?: 'Better' | 'Same' | 'Worse';
  associatedSymptoms?: string[];
  type?: 'symptom' | 'vital';
  vitals?: {
    systolic?: number;
    diastolic?: number;
    temperature?: number;
    heartRate?: number;
    oxygenSaturation?: number;
    notes?: string;
  };
}

interface NewCheckInState {
  regions: string[];
  subRegions: string[];
  bodyRegion?: string;
  bodySystem?: string;
  symptom?: string;
  descriptor?: string;
  severity?: number;
  began?: string;
  frequency?: string;
  duration?: string;
  worseTriggers: string[];
  betterTriggers: string[];
  takenMedication?: boolean;
  medicationName?: string;
  medicationEffect?: 'Better' | 'Same' | 'Worse';
  associatedSymptoms: string[];
  step: number;
  eventDateTime: Date;
}

interface HealthContextType {
  currentPatient: Patient | null;
  loginPatient: (userId: string, patientName: string, contactNumber?: string) => Promise<void>;
  logoutPatient: () => void;
  logs: HealthLog[];
  isLoadingLogs: boolean;
  currentCheckIn: NewCheckInState | null;
  addLog: (log: Omit<HealthLog, 'id' | 'createdAt'>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  updateLog: (id: string, updates: Partial<HealthLog>) => Promise<void>;
  startCheckIn: (regions: string[], bodySystem?: string) => void;
  updateCheckIn: (updates: Partial<NewCheckInState>) => void;
  cancelCheckIn: () => void;
  completeCheckIn: () => Promise<void>;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
  addVitalLog: (vitals: NonNullable<HealthLog['vitals']>, eventDateTime?: Date) => Promise<void>;
  isVitalsOpen: boolean;
  setVitalsOpen: (open: boolean) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

const PATIENT_STORAGE_KEY = 'meddemo_active_patient';

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [currentCheckIn, setCurrentCheckIn] = useState<NewCheckInState | null>(null);
  const [isVitalsOpen, setVitalsOpen] = useState(false);

  // Restore cached patient session on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(PATIENT_STORAGE_KEY);
        if (saved) {
          const patient: Patient = JSON.parse(saved);
          setCurrentPatient(patient);
          loadPatientLogs(patient.userId);
        }
      }
    } catch (e) {
      console.warn('Failed to restore patient session:', e);
    }
  }, []);

  const loadPatientLogs = async (userId: string) => {
    setIsLoadingLogs(true);
    try {
      const fetched = await fetchPatientLogsApi(userId);
      setLogs(fetched);
    } catch (err) {
      console.error('Failed loading patient logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const loginPatient = async (userId: string, patientName: string, contactNumber?: string) => {
    const patient = await loginPatientApi(userId, patientName, contactNumber);
    setCurrentPatient(patient);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patient));
    }
    await loadPatientLogs(patient.userId);
    triggerHaptic('success');
  };

  const logoutPatient = () => {
    triggerHaptic('medium');
    setCurrentPatient(null);
    setLogs([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PATIENT_STORAGE_KEY);
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' = 'light') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Haptics fallback
    }
  };

  const addLog = async (log: Omit<HealthLog, 'id' | 'createdAt'>) => {
    const logId = Math.random().toString(36).substring(7);
    const newLog: HealthLog = {
      ...log,
      id: logId,
      createdAt: new Date(),
      eventDateTime: log.eventDateTime || new Date(),
    };

    // Optimistic UI update
    setLogs((prev) => [newLog, ...prev]);

    if (currentPatient) {
      try {
        const saved = await savePatientLogApi(currentPatient.userId, newLog);
        setLogs((prev) => prev.map((l) => (l.id === logId ? saved : l)));
      } catch (err) {
        console.error('Failed to sync new log with MySQL database:', err);
      }
    }
  };

  const addVitalLog = async (vitals: NonNullable<HealthLog['vitals']>, eventDateTime?: Date) => {
    const logId = Math.random().toString(36).substring(7);
    const newLog: HealthLog = {
      type: 'vital',
      vitals,
      id: logId,
      createdAt: new Date(),
      eventDateTime: eventDateTime || new Date(),
    };

    setLogs((prev) => [newLog, ...prev]);
    triggerHaptic('success');

    if (currentPatient) {
      try {
        const saved = await savePatientLogApi(currentPatient.userId, newLog);
        setLogs((prev) => prev.map((l) => (l.id === logId ? saved : l)));
      } catch (err) {
        console.error('Failed to sync vital log with MySQL database:', err);
      }
    }
  };

  const deleteLog = async (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    triggerHaptic('medium');

    if (currentPatient) {
      try {
        await deletePatientLogApi(currentPatient.userId, id);
      } catch (err) {
        console.error('Failed deleting log from MySQL database:', err);
      }
    }
  };

  const updateLog = async (id: string, updates: Partial<HealthLog>) => {
    setLogs((prev) => {
      const target = prev.find((l) => l.id === id);
      if (!target) return prev;
      const updatedLog = { ...target, ...updates };

      if (currentPatient) {
        savePatientLogApi(currentPatient.userId, updatedLog).catch(console.error);
      }

      return prev.map((l) => (l.id === id ? updatedLog : l));
    });
    triggerHaptic('success');
  };

  const startCheckIn = (regions: string[], bodySystem?: string) => {
    triggerHaptic('medium');
    setCurrentCheckIn({
      regions,
      subRegions: [],
      bodyRegion: regions[0] || undefined,
      bodySystem,
      worseTriggers: [],
      betterTriggers: [],
      associatedSymptoms: [],
      step: bodySystem ? 2 : 1,
      eventDateTime: new Date(),
    });
  };

  const updateCheckIn = (updates: Partial<NewCheckInState>) => {
    triggerHaptic('selection');
    setCurrentCheckIn((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const cancelCheckIn = () => {
    triggerHaptic('light');
    setCurrentCheckIn(null);
  };

  const completeCheckIn = async () => {
    if (!currentCheckIn || !currentCheckIn.symptom) return;

    await addLog({
      regions: currentCheckIn.regions.length > 0 ? currentCheckIn.regions : undefined,
      subRegions: currentCheckIn.subRegions.length > 0 ? currentCheckIn.subRegions : undefined,
      bodyRegion: currentCheckIn.bodyRegion || (currentCheckIn.regions.length > 0 ? currentCheckIn.regions[0] : undefined),
      bodySystem: currentCheckIn.bodySystem,
      symptom: currentCheckIn.symptom,
      descriptor: currentCheckIn.descriptor || 'Soreness',
      severity: currentCheckIn.severity ?? 5,
      began: currentCheckIn.began || 'Today',
      frequency: currentCheckIn.frequency || 'Constant',
      duration: currentCheckIn.duration || 'Minutes',
      worseTriggers: currentCheckIn.worseTriggers,
      betterTriggers: currentCheckIn.betterTriggers,
      takenMedication: currentCheckIn.takenMedication || false,
      medicationName: currentCheckIn.medicationName,
      medicationEffect: currentCheckIn.medicationEffect,
      associatedSymptoms: currentCheckIn.associatedSymptoms,
      eventDateTime: currentCheckIn.eventDateTime || new Date(),
    });

    triggerHaptic('success');
    setCurrentCheckIn(null);
  };

  return (
    <HealthContext.Provider
      value={{
        currentPatient,
        loginPatient,
        logoutPatient,
        logs,
        isLoadingLogs,
        currentCheckIn,
        addLog,
        deleteLog,
        updateLog,
        startCheckIn,
        updateCheckIn,
        cancelCheckIn,
        completeCheckIn,
        triggerHaptic,
        addVitalLog,
        isVitalsOpen,
        setVitalsOpen,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
