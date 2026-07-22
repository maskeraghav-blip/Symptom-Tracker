import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useHealth, HealthLog } from '../state/HealthContext';
import { COLORS } from '../theme/theme';
import { GlassContainer } from '../components/GlassContainer';
import { BODY_REGIONS } from '../data/bodyParts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ReportScreen: React.FC = () => {
  const { logs: allLogs, triggerHaptic } = useHealth();

  type SymptomLog = HealthLog & {
    regions?: string[];
    bodyRegion?: string;
    bodySystem?: string;
    symptom: string;
    descriptor: string;
    severity: number;
    worseTriggers: string[];
    betterTriggers: string[];
    takenMedication: boolean;
  };

  const logs = allLogs.filter((log) => log.type !== 'vital') as SymptomLog[];
  const [isExporting, setIsExporting] = useState(false);

  const getVitalsSummary = () => {
    const vitalLogs = allLogs.filter((l) => l.type === 'vital' && l.vitals);
    if (vitalLogs.length === 0) return null;

    const latestVital = [...vitalLogs].sort(
      (a, b) => new Date(b.eventDateTime || b.createdAt).getTime() - new Date(a.eventDateTime || a.createdAt).getTime()
    )[0];

    let totalSys = 0, sysCount = 0;
    let totalDia = 0, diaCount = 0;
    let totalHr = 0, hrCount = 0;
    let totalTemp = 0, tempCount = 0;
    let totalSpO2 = 0, spo2Count = 0;

    vitalLogs.forEach((log) => {
      const v = log.vitals!;
      if (v.systolic) { totalSys += v.systolic; sysCount++; }
      if (v.diastolic) { totalDia += v.diastolic; diaCount++; }
      if (v.heartRate) { totalHr += v.heartRate; hrCount++; }
      if (v.temperature) { totalTemp += v.temperature; tempCount++; }
      if (v.oxygenSaturation) { totalSpO2 += v.oxygenSaturation; spo2Count++; }
    });

    return {
      latest: latestVital.vitals!,
      latestDate: latestVital.eventDateTime || latestVital.createdAt,
      averages: {
        systolic: sysCount ? Math.round(totalSys / sysCount) : null,
        diastolic: diaCount ? Math.round(totalDia / diaCount) : null,
        heartRate: hrCount ? Math.round(totalHr / hrCount) : null,
        temperature: tempCount ? (totalTemp / tempCount).toFixed(1) : null,
        oxygenSaturation: spo2Count ? Math.round(totalSpO2 / spo2Count) : null,
      }
    };
  };

  const vitalsSummary = getVitalsSummary();

  const getReportSummary = () => {
    if (!logs.length) return null;

    // 1. Chief Complaint calculation
    // Aggregate by region/symptom combo
    const complaints: { [key: string]: { count: number; maxSeverity: number; region: string; symptom: string } } = {};
    logs.forEach((log) => {
      const region = log.bodySystem || (log.regions && log.regions[0]) || 'Body';
      const key = `${region}-${log.symptom}`;
      
      if (!complaints[key]) {
        complaints[key] = {
          count: 0,
          maxSeverity: 0,
          region,
          symptom: log.symptom,
        };
      }
      complaints[key].count += 1;
      if (log.severity > complaints[key].maxSeverity) {
        complaints[key].maxSeverity = log.severity;
      }
    });

    const topComplaintKey = Object.keys(complaints).reduce((a, b) =>
      complaints[a].count * complaints[a].maxSeverity > complaints[b].count * complaints[b].maxSeverity ? a : b
    );
    const chiefComplaint = complaints[topComplaintKey];

    // 2. Triggers consolidated
    const allTriggers: { [key: string]: number } = {};
    logs.forEach((log) => {
      log.worseTriggers.forEach((t) => {
        allTriggers[t] = (allTriggers[t] || 0) + 1;
      });
    });
    const sortedTriggers = Object.entries(allTriggers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // 3. Relivers consolidated
    const allRelievers: { [key: string]: number } = {};
    logs.forEach((log) => {
      log.betterTriggers.forEach((r) => {
        allRelievers[r] = (allRelievers[r] || 0) + 1;
      });
    });
    const sortedRelievers = Object.entries(allRelievers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // 4. Medications history list
    const medsList = Array.from(
      new Set(
        logs
          .filter((log) => log.takenMedication && log.medicationName)
          .map((log) => log.medicationName as string)
      )
    ).slice(0, 3);

    // 5. Associated symptoms
    const allAssoc: { [key: string]: number } = {};
    logs.forEach((log) => {
      log.associatedSymptoms?.forEach((a) => {
        allAssoc[a] = (allAssoc[a] || 0) + 1;
      });
    });
    const sortedAssoc = Object.entries(allAssoc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      chiefComplaint,
      triggers: sortedTriggers.length > 0 ? sortedTriggers : ['None logged'],
      relievers: sortedRelievers.length > 0 ? sortedRelievers : ['None logged'],
      medications: medsList.length > 0 ? medsList : ['None logged'],
      associated: sortedAssoc.length > 0 ? sortedAssoc : ['None'],
    };
  };

  // Generate coordinates for Custom Reanimated SVG Chart
  // Displays severity points chronological order (oldest to newest)
  const renderSeverityGraph = () => {
    if (logs.length < 2) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Need at least 2 entries to plot timeline trend</Text>
        </View>
      );
    }

    const plotLogs = [...logs]
      .sort((a, b) => new Date(a.eventDateTime || a.createdAt).getTime() - new Date(b.eventDateTime || b.createdAt).getTime())
      .slice(-7); // Keep up to 7 recent entries

    const width = SCREEN_WIDTH - 72; // Padding container
    const height = 110;
    const paddingX = 20;
    const paddingY = 15;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const points = plotLogs.map((log, index) => {
      const x = paddingX + (index / (plotLogs.length - 1)) * chartWidth;
      // Flip severity so height 10 is at the top (lowest y value)
      const y = paddingY + chartHeight - (log.severity / 10) * chartHeight;
      return { x, y, severity: log.severity, date: new Date(log.eventDateTime || log.createdAt) };
    });

    // Create Path String
    let linePath = `M ${points[0].x} ${points[0].y}`;
    let fillPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
      fillPath += ` L ${points[i].x} ${points[i].y}`;
    }
    // Complete fill path to bottom of chart
    fillPath += ` L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return (
      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={fillPath} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <Path d={linePath} fill="none" stroke={COLORS.primary} strokeWidth={3} />

          {/* Bullet points mapping */}
          {points.map((p, idx) => (
            <G key={idx}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={6}
                fill="#0A0A14"
                stroke={COLORS.primary}
                strokeWidth={2}
              />
              <Circle
                cx={p.x}
                cy={p.y}
                r={2}
                fill={COLORS.primary}
              />
            </G>
          ))}
        </Svg>

        {/* Labels below */}
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabelText}>
            {new Date(plotLogs[0].eventDateTime || plotLogs[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.chartLabelText}>Severity Trend (Last {plotLogs.length} logs)</Text>
          <Text style={styles.chartLabelText}>
            {new Date(plotLogs[plotLogs.length - 1].eventDateTime || plotLogs[plotLogs.length - 1].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  const handleExport = async () => {
    triggerHaptic('success');
    setIsExporting(true);

    try {
      const summary = getReportSummary();
      const getRegionName = (id: string) => {
        const match = BODY_REGIONS.find((r) => r.id === id);
        return match ? match.name : id;
      };
      
      const content = `Clinical Symptom Report Summary\n` +
        `Generated: ${new Date().toLocaleDateString()}\n\n` +
        `Chief Complaint: ${summary?.chiefComplaint.symptom} in ${getRegionName(summary?.chiefComplaint.region || '')} (Max Severity: ${summary?.chiefComplaint.maxSeverity})\n` +
        `Associated: ${summary?.associated.join(', ')}\n` +
        `Primary Triggers: ${summary?.triggers.join(', ')}\n` +
        `Primary Relievers: ${summary?.relievers.join(', ')}\n` +
        `Medication History: ${summary?.medications.join(', ')}\n\n` +
        `Report generated via premium Health Check-In.`;

      if (Platform.OS === 'web') {
        alert('Clinician Report Copied! ready for export.');
      } else {
        await Share.share({
          message: content,
          title: 'Clinician Symptom Report',
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsExporting(false);
    }
  };

  const summary = getReportSummary();

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>Clinician Report</Text>
        <Text style={styles.subtitle}>Aggregated analytics structured for medical review</Text>
      </View>

      {summary ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          {/* Main Paper Outline Container */}
          <GlassContainer style={styles.reportPaper} intensity={30}>
            {/* Header medical stamp */}
            <View style={styles.paperHeader}>
              <View>
                <Text style={styles.clinicLogo}>HEALTH DASHBOARD</Text>
                <Text style={styles.patientName}>Subject Patient Summary</Text>
              </View>
              <Text style={styles.dateStamp}>
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Part 1: Chief Complaint */}
            <View style={styles.sectionDivider} />
            <View style={styles.reportSection}>
              <Text style={styles.sectionLabel}>CHIEF COMPLAINT</Text>
              <Text style={styles.complaintValue}>
                {summary.chiefComplaint.symptom}
              </Text>
              <Text style={styles.complaintSub}>
                Primary Area: {(() => {
                  const match = BODY_REGIONS.find((r) => r.id === summary.chiefComplaint.region);
                  return match ? match.name.toUpperCase() : summary.chiefComplaint.region.toUpperCase();
                })()} • Severity ceiling of {summary.chiefComplaint.maxSeverity}/10
              </Text>
            </View>

            {/* Part 2: Severity Timeline line graph */}
            <View style={styles.sectionDivider} />
            <View style={styles.reportSection}>
              <Text style={styles.sectionLabel}>SEVERITY TREND</Text>
              {renderSeverityGraph()}
            </View>

            {/* Part 3: Treatment history, triggers & symptoms */}
            <View style={styles.sectionDivider} />
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>PRIMARY TRIGGERS</Text>
                {summary.triggers.map((t, i) => (
                  <Text key={i} style={styles.bulletText}>• {t}</Text>
                ))}
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>PRIMARY RELIEVERS</Text>
                {summary.relievers.map((r, i) => (
                  <Text key={i} style={styles.bulletText}>• {r}</Text>
                ))}
              </View>
            </View>

            <View style={styles.sectionDivider} />
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>MEDICATION RECORD</Text>
                {summary.medications.map((m, i) => (
                  <Text key={i} style={styles.bulletText}>• {m}</Text>
                ))}
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>ASSOCIATED EFFECTS</Text>
                {summary.associated.map((a, i) => (
                  <Text key={i} style={styles.bulletText}>• {a}</Text>
                ))}
              </View>
            </View>

            {/* Mock clinical notes */}
            {vitalsSummary && (
              <>
                <View style={styles.sectionDivider} />
                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>PHYSIOLOGICAL VITALS SIGN SUMMARY</Text>
                  
                  <View style={styles.vitalsSummaryGrid}>
                    {vitalsSummary.averages.systolic && vitalsSummary.averages.diastolic && (
                      <View style={styles.vitalsSummaryCard}>
                        <Text style={styles.vitalsSummaryTitle}>Blood Pressure</Text>
                        <Text style={styles.vitalsSummaryVal}>
                          {vitalsSummary.latest.systolic}/{vitalsSummary.latest.diastolic} <Text style={styles.vitalsSummaryUnit}>mmHg</Text>
                        </Text>
                        <Text style={styles.vitalsSummaryAvg}>Avg: {vitalsSummary.averages.systolic}/{vitalsSummary.averages.diastolic}</Text>
                      </View>
                    )}

                    {vitalsSummary.averages.heartRate && (
                      <View style={styles.vitalsSummaryCard}>
                        <Text style={styles.vitalsSummaryTitle}>Heart Rate</Text>
                        <Text style={styles.vitalsSummaryVal}>
                          {vitalsSummary.latest.heartRate} <Text style={styles.vitalsSummaryUnit}>bpm</Text>
                        </Text>
                        <Text style={styles.vitalsSummaryAvg}>Avg: {vitalsSummary.averages.heartRate} bpm</Text>
                      </View>
                    )}

                    {vitalsSummary.averages.temperature && (
                      <View style={styles.vitalsSummaryCard}>
                        <Text style={styles.vitalsSummaryTitle}>Temperature</Text>
                        <Text style={styles.vitalsSummaryVal}>
                          {vitalsSummary.latest.temperature?.toFixed(1)} <Text style={styles.vitalsSummaryUnit}>°F</Text>
                        </Text>
                        <Text style={styles.vitalsSummaryAvg}>Avg: {vitalsSummary.averages.temperature}°F</Text>
                      </View>
                    )}

                    {vitalsSummary.averages.oxygenSaturation && (
                      <View style={styles.vitalsSummaryCard}>
                        <Text style={styles.vitalsSummaryTitle}>Oxygen Saturation</Text>
                        <Text style={styles.vitalsSummaryVal}>
                          {vitalsSummary.latest.oxygenSaturation}% <Text style={styles.vitalsSummaryUnit}>SpO2</Text>
                        </Text>
                        <Text style={styles.vitalsSummaryAvg}>Avg: {vitalsSummary.averages.oxygenSaturation}%</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.vitalsStampText}>
                    Latest timestamp: {new Date(vitalsSummary.latestDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.sectionDivider} />
            <View style={styles.reportSection}>
              <Text style={styles.sectionLabel}>OTHER INFORMATION</Text>
              <View style={styles.tagGroup}>
                <View style={styles.tagItem}><Text style={styles.tagText}>Allergies: NKDA (No Known Drug Allergies)</Text></View>
                <View style={styles.tagItem}><Text style={styles.tagText}>Condition: Ambulatory Care</Text></View>
              </View>
            </View>
          </GlassContainer>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={isExporting}>
            <Text style={styles.exportBtnText}>
              {isExporting ? 'Preparing Document...' : 'Export Clinician PDF Report'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Empty Medical Transcript</Text>
          <Text style={styles.emptySubText}>
            We generate summaries after gather logs history data. Record a few physical symptom logs to compile a clinician report.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  titleWrapper: {
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: 40,
  },
  reportPaper: {
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicLogo: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  patientName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  dateStamp: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 14,
  },
  reportSection: {
    paddingVertical: 2,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  complaintValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  complaintSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  bulletText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '500',
  },
  chartWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  chartLabelText: {
    color: COLORS.textMuted,
    fontSize: 8.5,
    fontWeight: '600',
  },
  emptyChart: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(15, 23, 42, 0.16)',
    borderRadius: 12,
  },
  emptyChartText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  exportBtn: {
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  exportBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 16,
  },
  vitalsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  vitalsSummaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(22, 35, 58, 0.05)',
  },
  vitalsSummaryTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8391A5',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  vitalsSummaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  vitalsSummaryUnit: {
    fontSize: 10,
    color: '#8391A5',
    fontWeight: 'normal',
  },
  vitalsSummaryAvg: {
    fontSize: 9,
    color: '#55657A',
    marginTop: 2,
    fontWeight: '500',
  },
  vitalsStampText: {
    fontSize: 9,
    color: '#8391A5',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
export default ReportScreen;
