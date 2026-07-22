import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { useHealth, HealthLog } from '../state/HealthContext';
import { COLORS } from '../theme/theme';
import { GlassContainer } from '../components/GlassContainer';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDateTimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yr = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const dy = pad(d.getDate());
  const hr = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yr}-${mo}-${dy}T${hr}:${min}`;
};

const webInputStyle = {
  position: 'absolute' as const,
  opacity: 0,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
};

const getBPCategory = (sys: number, dia: number) => {
  if (sys > 180 || dia > 120) return { label: 'Hypertensive Crisis', color: '#991B1B', bg: 'rgba(153, 27, 27, 0.12)' };
  if (sys >= 140 || dia >= 90) return { label: 'Hypertension Stage 2', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return { label: 'Hypertension Stage 1', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' };
  if (sys >= 120 && sys <= 129 && dia < 80) return { label: 'Elevated BP', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  return { label: 'Normal BP', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
};

const getHRCategory = (hr: number) => {
  if (hr < 60) return { label: 'Bradycardia (Low)', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
  if (hr <= 100) return { label: 'Normal HR', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  return { label: 'Tachycardia (High)', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
};

const getTempCategory = (temp: number, unit: 'F' | 'C') => {
  const tempF = unit === 'F' ? temp : (temp * 9) / 5 + 32;
  if (tempF < 95.0) return { label: 'Hypothermia (Low)', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
  if (tempF <= 99.0) return { label: 'Normal Temp', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  if (tempF <= 100.4) return { label: 'Low-grade Fever', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  return { label: 'High Fever', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
};

const getSpO2Category = (spo2: number) => {
  if (spo2 >= 95) return { label: 'Optimal SpO2', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  if (spo2 >= 90) return { label: 'Mild Hypoxia', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' };
  return { label: 'Severe Hypoxia', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
};

export const TimelineScreen: React.FC = () => {
  const { logs, deleteLog, updateLog, triggerHaptic, setVitalsOpen } = useHealth();
  const [editingItem, setEditingItem] = useState<HealthLog | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<HealthLog | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hoveredEditBtnId, setHoveredEditBtnId] = useState<string | null>(null);

  // Group logs by date
  const getGroupTitle = (date: Date) => {
    const logDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (logDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (logDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return logDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getSeverityColor = (sev: number) => {
    if (sev <= 3) return COLORS.severity.low;
    if (sev <= 6) return COLORS.severity.medium;
    return COLORS.severity.high;
  };

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.eventDateTime || b.createdAt).getTime() - new Date(a.eventDateTime || a.createdAt).getTime()
  );

  const openItemDetails = (item: HealthLog) => {
    triggerHaptic('light');
    setSelectedDetailItem(item);
  };

  const renderVitalItem = (
    item: HealthLog,
    index: number,
    isFirst: boolean,
    isLast: boolean,
    showDateHeader: boolean,
    dateTitle: string,
    formattedTime: string
  ) => {
    const vitals = item.vitals!;
    
    const bpCell = vitals.systolic && vitals.diastolic ? getBPCategory(vitals.systolic, vitals.diastolic) : null;
    const hrCell = vitals.heartRate ? getHRCategory(vitals.heartRate) : null;
    const tempCell = vitals.temperature ? getTempCategory(vitals.temperature, 'F') : null;
    const spo2Cell = vitals.oxygenSaturation ? getSpO2Category(vitals.oxygenSaturation) : null;

    const getWorstColor = () => {
      const colors = [
        bpCell?.color,
        hrCell?.color,
        tempCell?.color,
        spo2Cell?.color
      ].filter(Boolean) as string[];

      if (colors.includes('#991B1B') || colors.includes('#EF4444')) return '#EF4444';
      if (colors.includes('#D97706') || colors.includes('#F59E0B') || colors.includes('#3B82F6')) return '#F59E0B';
      return '#10B981';
    };

    const bulletColor = getWorstColor();

    return (
      <View style={styles.timelineRow}>
        <View style={styles.lineColumn}>
          <View style={[styles.verticalLine, isFirst && styles.lineFirst, isLast && styles.lineLast]} />
          <View style={[styles.bulletNode, { backgroundColor: bulletColor, shadowColor: bulletColor }]} />
        </View>

        <Animated.View 
          entering={FadeInUp.delay(index * 100).springify().damping(18)}
          layout={Layout.springify()}
          style={styles.cardColumn}
        >
          {showDateHeader && <Text style={styles.dateHeader}>{dateTitle}</Text>}

          <TouchableOpacity activeOpacity={0.92} onPress={() => openItemDetails(item)}>
            <GlassContainer style={styles.logCard} intensity={40}>
              <View style={styles.logCardHeader}>
                <View>
                  <Text style={styles.logTime}>{formattedTime}</Text>
                  <Text style={[styles.logRegions, { color: COLORS.primary }]}>Vitals Logged</Text>
                </View>
                <View style={styles.tapPromptBadge}>
                  <Text style={styles.tapPromptText}>Tap for details ➔</Text>
                </View>
              </View>

              <View style={styles.vitalsBadgeGrid}>
                {vitals.systolic && vitals.diastolic && bpCell && (
                  <View style={[styles.vitalTimelineBadge, { borderColor: `${bpCell.color}35` }]}>
                    <Text style={styles.vitalTimelineLabel}>Blood Pressure</Text>
                    <Text style={styles.vitalTimelineVal}>
                      {vitals.systolic}/{vitals.diastolic} <Text style={styles.vitalTimelineUnit}>mmHg</Text>
                    </Text>
                    <Text style={[styles.vitalTimelineStatus, { color: bpCell.color }]}>
                      {bpCell.label}
                    </Text>
                  </View>
                )}

                {vitals.heartRate && hrCell && (
                  <View style={[styles.vitalTimelineBadge, { borderColor: `${hrCell.color}35` }]}>
                    <Text style={styles.vitalTimelineLabel}>Heart Rate</Text>
                    <Text style={styles.vitalTimelineVal}>
                      {vitals.heartRate} <Text style={styles.vitalTimelineUnit}>bpm</Text>
                    </Text>
                    <Text style={[styles.vitalTimelineStatus, { color: hrCell.color }]}>
                      {hrCell.label}
                    </Text>
                  </View>
                )}

                {vitals.temperature && tempCell && (
                  <View style={[styles.vitalTimelineBadge, { borderColor: `${tempCell.color}35` }]}>
                    <Text style={styles.vitalTimelineLabel}>Temp</Text>
                    <Text style={styles.vitalTimelineVal}>
                      {vitals.temperature.toFixed(1)} <Text style={styles.vitalTimelineUnit}>°F</Text>
                    </Text>
                    <Text style={[styles.vitalTimelineStatus, { color: tempCell.color }]}>
                      {tempCell.label}
                    </Text>
                  </View>
                )}

                {vitals.oxygenSaturation && spo2Cell && (
                  <View style={[styles.vitalTimelineBadge, { borderColor: `${spo2Cell.color}35` }]}>
                    <Text style={styles.vitalTimelineLabel}>Oxygen Sat</Text>
                    <Text style={styles.vitalTimelineVal}>
                      {vitals.oxygenSaturation} <Text style={styles.vitalTimelineUnit}>%</Text>
                    </Text>
                    <Text style={[styles.vitalTimelineStatus, { color: spo2Cell.color }]}>
                      {spo2Cell.label}
                    </Text>
                  </View>
                )}
              </View>

              {vitals.notes ? (
                <View style={styles.vitalsNotesBar}>
                  <Text style={styles.vitalsNotesText}>Note: "{vitals.notes}"</Text>
                </View>
              ) : null}

              <View style={styles.logCardFooter}>
                <View style={styles.footerActionRow}>
                  <TouchableOpacity
                    onPress={(e) => {
                      if (Platform.OS !== 'web') {
                        setEditingItem(item);
                        setShowDatePicker(true);
                      } else {
                        try {
                          const input = (e.currentTarget as any).querySelector('input');
                          if (input) {
                            if (typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        } catch (err) {
                          console.log('web vitals edit picker error:', err);
                        }
                      }
                    }}
                    style={[
                      styles.editBtn,
                      hoveredEditBtnId === item.id && styles.editBtnHovered
                    ]}
                    {...({
                      onMouseEnter: () => setHoveredEditBtnId(item.id),
                      onMouseLeave: () => setHoveredEditBtnId(null)
                    } as any)}
                  >
                    <Text style={styles.editBtnText}>Edit Date</Text>
                    {Platform.OS === 'web' && (
                      <input
                        type="datetime-local"
                        max={formatDateTimeLocal(new Date())}
                        value={formatDateTimeLocal(new Date(item.eventDateTime || item.createdAt))}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const date = new Date(val);
                            if (date <= new Date()) {
                              updateLog(item.id, { eventDateTime: date });
                            }
                          }
                        }}
                        style={webInputStyle}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('medium');
                      deleteLog(item.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassContainer>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderTimelineItem = ({ item, index }: { item: HealthLog; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === sortedLogs.length - 1;
    const displayDate = new Date(item.eventDateTime || item.createdAt);
    const dateTitle = getGroupTitle(displayDate);
    const prevDisplayDate = index > 0 ? new Date(sortedLogs[index - 1].eventDateTime || sortedLogs[index - 1].createdAt) : null;
    const showDateHeader = isFirst || !prevDisplayDate || getGroupTitle(prevDisplayDate) !== dateTitle;

    const formattedTime = displayDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (item.type === 'vital' && item.vitals) {
      return renderVitalItem(item, index, isFirst, isLast, showDateHeader, dateTitle, formattedTime);
    }

    const severityVal = item.severity ?? 0;
    const regionsText = item.bodySystem || item.subRegions?.join(', ') || item.bodyRegion || 'Symptom Check-In';

    return (
      <View style={styles.timelineRow}>
        <View style={styles.lineColumn}>
          <View style={[styles.verticalLine, isFirst && styles.lineFirst, isLast && styles.lineLast]} />
          <View
            style={[
              styles.bulletNode,
              { backgroundColor: getSeverityColor(severityVal), shadowColor: getSeverityColor(severityVal) },
            ]}
          />
        </View>

        <Animated.View 
          entering={FadeInUp.delay(index * 100).springify().damping(18)}
          layout={Layout.springify()}
          style={styles.cardColumn}
        >
          {showDateHeader && <Text style={styles.dateHeader}>{dateTitle}</Text>}
          
          <TouchableOpacity activeOpacity={0.92} onPress={() => openItemDetails(item)}>
            <GlassContainer style={styles.logCard} intensity={40}>
              <View style={styles.logCardHeader}>
                <View>
                  <Text style={styles.logTime}>{formattedTime}</Text>
                  <Text style={styles.logRegions}>{regionsText}</Text>
                </View>

                <View style={styles.headerRightGroup}>
                  <View
                    style={[
                      styles.severityPill,
                      { backgroundColor: `${getSeverityColor(severityVal)}20`, borderColor: getSeverityColor(severityVal) },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: getSeverityColor(severityVal) }]}>
                      Sev {severityVal}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.symptomRow}>
                <Text style={styles.symptomTitle}>
                  {item.symptom || 'Symptom'} <Text style={styles.descriptorText}>({item.descriptor || 'Descriptor'})</Text>
                </Text>
                <Text style={styles.clickForDetailsHint}>Tap to view full details ➔</Text>
              </View>

              {item.worseTriggers && item.betterTriggers && (item.worseTriggers.length > 0 || item.betterTriggers.length > 0) ? (
                <View style={styles.factorsRow}>
                  {item.worseTriggers.slice(0, 2).map((t) => (
                    <View key={t} style={[styles.factorBadge, styles.triggerBadge]}>
                      <Text style={styles.factorText}>⚡ {t}</Text>
                    </View>
                  ))}
                  {item.betterTriggers.slice(0, 2).map((b) => (
                    <View key={b} style={[styles.factorBadge, styles.relieverBadge]}>
                      <Text style={styles.factorText}>🌱 {b}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {item.takenMedication && (
                <View style={styles.medicationBar}>
                  <Text style={styles.medText}>
                    Took <Text style={styles.boldText}>{item.medicationName || 'medication'}</Text>
                    {item.medicationEffect && (
                      <Text>
                        {' '}→{' '}
                        <Text
                          style={[
                            styles.medEffectText,
                            item.medicationEffect === 'Better' && { color: COLORS.severity.low },
                            item.medicationEffect === 'Worse' && { color: COLORS.severity.high },
                            item.medicationEffect === 'Same' && { color: COLORS.severity.medium },
                          ]}
                        >
                          {item.medicationEffect}
                        </Text>
                      </Text>
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.logCardFooter}>
                {item.associatedSymptoms && item.associatedSymptoms.length > 0 && (
                  <Text style={styles.assocText}>
                    Also: {item.associatedSymptoms.join(', ')}
                  </Text>
                )}
                
                <View style={styles.footerActionRow}>
                  <TouchableOpacity
                    onPress={(e) => {
                      if (Platform.OS !== 'web') {
                        setEditingItem(item);
                        setShowDatePicker(true);
                      } else {
                        try {
                          const input = (e.currentTarget as any).querySelector('input');
                          if (input) {
                            if (typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        } catch (err) {
                          console.log('web symptom edit picker error:', err);
                        }
                      }
                    }}
                    style={[
                      styles.editBtn,
                      hoveredEditBtnId === item.id && styles.editBtnHovered
                    ]}
                    {...({
                      onMouseEnter: () => setHoveredEditBtnId(item.id),
                      onMouseLeave: () => setHoveredEditBtnId(null)
                    } as any)}
                  >
                    <Text style={styles.editBtnText}>Edit Date</Text>
                    {Platform.OS === 'web' && (
                      <input
                        type="datetime-local"
                        max={formatDateTimeLocal(new Date())}
                        value={formatDateTimeLocal(new Date(item.eventDateTime || item.createdAt))}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const date = new Date(val);
                            if (date <= new Date()) {
                              updateLog(item.id, { eventDateTime: date });
                            }
                          }
                        }}
                        style={webInputStyle}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('medium');
                      deleteLog(item.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassContainer>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderDetailModalContent = () => {
    if (!selectedDetailItem) return null;
    const item = selectedDetailItem;
    const isVital = item.type === 'vital' && item.vitals;
    const dateObj = new Date(item.eventDateTime || item.createdAt);
    const fullDateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const fullTimeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return (
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => setSelectedDetailItem(null)}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.modalCardWrapper}>
          <GlassContainer style={styles.modalCard} intensity={90} borderRadius={24}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalCategoryBadge}>
                  {isVital ? '🩺 Vitals Log Details' : '📋 Symptom Report Details'}
                </Text>
                <Text style={styles.modalTitle}>
                  {isVital ? 'Vitals Recording' : `${item.symptom || 'Symptom'} Check-In`}
                </Text>
                <Text style={styles.modalTimeText}>📅 {fullDateStr} at {fullTimeStr}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedDetailItem(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {isVital ? (
                /* Vitals Log Details */
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeaderTitle}>Recorded Vital Signs</Text>
                  
                  {item.vitals?.systolic && item.vitals?.diastolic ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Blood Pressure</Text>
                      <View style={styles.detailValGroup}>
                        <Text style={styles.detailValueBold}>{item.vitals.systolic} / {item.vitals.diastolic} mmHg</Text>
                        <Text style={[styles.detailStatusPill, { color: getBPCategory(item.vitals.systolic, item.vitals.diastolic).color }]}>
                          {getBPCategory(item.vitals.systolic, item.vitals.diastolic).label}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {item.vitals?.heartRate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Heart Rate</Text>
                      <View style={styles.detailValGroup}>
                        <Text style={styles.detailValueBold}>{item.vitals.heartRate} bpm</Text>
                        <Text style={[styles.detailStatusPill, { color: getHRCategory(item.vitals.heartRate).color }]}>
                          {getHRCategory(item.vitals.heartRate).label}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {item.vitals?.temperature ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Body Temperature</Text>
                      <View style={styles.detailValGroup}>
                        <Text style={styles.detailValueBold}>{item.vitals.temperature.toFixed(1)} °F</Text>
                        <Text style={[styles.detailStatusPill, { color: getTempCategory(item.vitals.temperature, 'F').color }]}>
                          {getTempCategory(item.vitals.temperature, 'F').label}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {item.vitals?.oxygenSaturation ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Oxygen Saturation (SpO2)</Text>
                      <View style={styles.detailValGroup}>
                        <Text style={styles.detailValueBold}>{item.vitals.oxygenSaturation} %</Text>
                        <Text style={[styles.detailStatusPill, { color: getSpO2Category(item.vitals.oxygenSaturation).color }]}>
                          {getSpO2Category(item.vitals.oxygenSaturation).label}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {item.vitals?.notes ? (
                    <View style={styles.modalNotesBox}>
                      <Text style={styles.modalNotesLabel}>Clinical Notes & Comments:</Text>
                      <Text style={styles.modalNotesText}>"{item.vitals.notes}"</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                /* Symptom Log Details */
                <View style={styles.modalSection}>
                  {/* Primary Overview */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Primary Symptom</Text>
                    <Text style={styles.detailValueHighlight}>{item.symptom || 'N/A'}</Text>
                  </View>

                  {item.descriptor ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Symptom Feeling</Text>
                      <Text style={styles.detailValue}>{item.descriptor}</Text>
                    </View>
                  ) : null}

                  {/* Body Locations */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Body Region / System</Text>
                    <Text style={styles.detailValue}>
                      {item.bodySystem || item.bodyRegion || item.regions?.join(', ') || 'Not specified'}
                    </Text>
                  </View>

                  {item.subRegions && item.subRegions.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Specific Sub-locations</Text>
                      <Text style={styles.detailValue}>{item.subRegions.join(', ')}</Text>
                    </View>
                  ) : null}

                  {/* Severity Breakdown */}
                  {item.severity !== undefined ? (
                    <View style={styles.severityBox}>
                      <View style={styles.severityLabelRow}>
                        <Text style={styles.detailLabel}>Pain / Severity Rating</Text>
                        <Text style={[styles.severityNum, { color: getSeverityColor(item.severity) }]}>
                          {item.severity} / 10
                        </Text>
                      </View>
                      <View style={styles.severityBarTrack}>
                        <View
                          style={[
                            styles.severityBarFill,
                            {
                              width: `${(item.severity / 10) * 100}%`,
                              backgroundColor: getSeverityColor(item.severity),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ) : null}

                  {/* Onset & Timing */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Began / Onset</Text>
                    <Text style={styles.detailValue}>{item.began || 'Not recorded'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Frequency</Text>
                    <Text style={styles.detailValue}>{item.frequency || 'Not recorded'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{item.duration || 'Not recorded'}</Text>
                  </View>

                  {/* Aggravating Factors */}
                  {item.worseTriggers && item.worseTriggers.length > 0 ? (
                    <View style={styles.tagSection}>
                      <Text style={styles.tagSectionTitle}>⚡ Aggravating Triggers (Made Worse)</Text>
                      <View style={styles.tagWrap}>
                        {item.worseTriggers.map((trig) => (
                          <View key={trig} style={[styles.modalTag, styles.modalTriggerTag]}>
                            <Text style={styles.modalTriggerText}>{trig}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Relieving Factors */}
                  {item.betterTriggers && item.betterTriggers.length > 0 ? (
                    <View style={styles.tagSection}>
                      <Text style={styles.tagSectionTitle}>🌱 Relieving Factors (Made Better)</Text>
                      <View style={styles.tagWrap}>
                        {item.betterTriggers.map((rel) => (
                          <View key={rel} style={[styles.modalTag, styles.modalRelieverTag]}>
                            <Text style={styles.modalRelieverText}>{rel}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Medication & Treatment */}
                  <View style={styles.tagSection}>
                    <Text style={styles.tagSectionTitle}>💊 Medication & Treatment Taken</Text>
                    <View style={styles.medCardBox}>
                      <Text style={styles.medCardTitle}>
                        {item.takenMedication ? `Taken: ${item.medicationName || 'Medication'}` : 'No medication taken'}
                      </Text>
                      {item.takenMedication && item.medicationEffect ? (
                        <Text style={styles.medCardSub}>
                          Effect on symptom:{' '}
                          <Text
                            style={{
                              fontWeight: '700',
                              color:
                                item.medicationEffect === 'Better'
                                  ? COLORS.severity.low
                                  : item.medicationEffect === 'Worse'
                                  ? COLORS.severity.high
                                  : COLORS.severity.medium,
                            }}
                          >
                            {item.medicationEffect}
                          </Text>
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Associated Symptoms */}
                  {item.associatedSymptoms && item.associatedSymptoms.length > 0 ? (
                    <View style={styles.tagSection}>
                      <Text style={styles.tagSectionTitle}>🔗 Associated Symptoms</Text>
                      <Text style={styles.detailValue}>{item.associatedSymptoms.join(', ')}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => {
                  triggerHaptic('medium');
                  deleteLog(item.id);
                  setSelectedDetailItem(null);
                }}
              >
                <Text style={styles.modalDeleteText}>Delete Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setSelectedDetailItem(null)}
              >
                <Text style={styles.modalDoneText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <View style={styles.titleRow}>
          <View style={styles.textColumn}>
            <Text style={styles.title}>Activity Timeline</Text>
            <Text style={styles.subtitle}>Historical trajectory of physical reports & events</Text>
          </View>
          <TouchableOpacity 
            style={styles.vitalsBtn} 
            onPress={() => {
              triggerHaptic('light');
              setVitalsOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.vitalsBtnText}>+ Vitals</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortedLogs.length > 0 ? (
        <FlatList
          data={sortedLogs}
          renderItem={renderTimelineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your symptom activity timeline is clean.</Text>
          <Text style={styles.emptySubText}>Logs will appear here once you record your first physical check-in.</Text>
        </View>
      )}

      {/* Activity Details Modal */}
      <Modal
        visible={!!selectedDetailItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDetailItem(null)}
      >
        {renderDetailModalContent()}
      </Modal>

      {/* Mobile-only editing pickers */}
      {Platform.OS !== 'web' && showDatePicker && editingItem && (
        <DateTimePicker
          value={new Date(editingItem.eventDateTime || editingItem.createdAt)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const current = new Date(editingItem.eventDateTime || editingItem.createdAt);
              selectedDate.setHours(current.getHours(), current.getMinutes(), 0, 0);
              setEditingItem(prev => prev ? { ...prev, eventDateTime: selectedDate } : null);
              setShowTimePicker(true);
            } else {
              setEditingItem(null);
            }
          }}
        />
      )}

      {Platform.OS !== 'web' && showTimePicker && editingItem && (
        <DateTimePicker
          value={new Date(editingItem.eventDateTime || editingItem.createdAt)}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const current = new Date(editingItem.eventDateTime || editingItem.createdAt);
              current.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              if (current <= new Date()) {
                updateLog(editingItem.id, { eventDateTime: current });
              }
            }
            setEditingItem(null);
          }}
        />
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
  listContainer: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  lineColumn: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  lineFirst: {
    top: 24,
  },
  lineLast: {
    bottom: '80%',
  },
  bulletNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  cardColumn: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 24,
  },
  dateHeader: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  logCard: {
    padding: 16,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  logRegions: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  severityPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tapPromptBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tapPromptText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  symptomRow: {
    marginVertical: 4,
  },
  symptomTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  descriptorText: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  clickForDetailsHint: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  factorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  triggerBadge: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  relieverBadge: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  factorText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  medicationBar: {
    backgroundColor: 'rgba(248, 250, 252, 0.88)',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  medText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
  },
  boldText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  medEffectText: {
    fontWeight: '700',
  },
  logCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 8,
  },
  assocText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  deleteBtn: {
    padding: 4,
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  deleteBtnText: {
    color: 'rgba(239, 68, 68, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  vitalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vitalsBtnText: {
    color: '#2563EB',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  vitalsBadgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  vitalTimelineBadge: {
    flex: 1,
    minWidth: '45%',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  vitalTimelineLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8391A5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vitalTimelineVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172033',
  },
  vitalTimelineUnit: {
    fontSize: 9,
    color: '#8391A5',
    fontWeight: 'normal',
  },
  vitalTimelineStatus: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  vitalsNotesBar: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(24, 32, 51, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(24, 32, 51, 0.04)',
  },
  vitalsNotesText: {
    fontSize: 10,
    color: '#55657A',
    fontStyle: 'italic',
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.08)',
    backgroundColor: 'rgba(9, 30, 66, 0.02)',
    position: 'relative',
    overflow: 'hidden',
  },
  editBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  editBtnHovered: {
    backgroundColor: 'rgba(9, 30, 66, 0.08)',
    borderColor: 'rgba(9, 30, 66, 0.15)',
  },

  /* Modal Details Styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
  },
  modalCard: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalTitleBox: {
    flex: 1,
    paddingRight: 10,
  },
  modalCategoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  modalTimeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalScroll: {
    flexGrow: 1,
    marginBottom: 16,
  },
  modalSection: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  detailValGroup: {
    alignItems: 'flex-end',
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailStatusPill: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  severityBox: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 4,
  },
  severityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  severityNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  severityBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  severityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tagSection: {
    marginTop: 8,
  },
  tagSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalTriggerTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
  },
  modalTriggerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  modalRelieverTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
  },
  modalRelieverText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  medCardBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  medCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  medCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalNotesBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  modalNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalNotesText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  modalDeleteText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  modalDoneBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TimelineScreen;
