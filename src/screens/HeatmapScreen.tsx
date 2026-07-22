import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useHealth, HealthLog } from '../state/HealthContext';
import { BODY_REGIONS } from '../data/bodyParts';
import { COLORS } from '../theme/theme';
import { BodySilhouette } from '../components/BodySilhouette';
import { GlassContainer } from '../components/GlassContainer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type FilterType = 7 | 30 | 90 | 365;

export const HeatmapScreen: React.FC = () => {
  const { logs, triggerHaptic } = useHealth();
  const [filterDays, setFilterDays] = useState<FilterType>(30);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Compute stats for the selected region
  const getRegionStats = (regionId: string) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterDays);

    const regionLogs = logs.filter((log) => {
      if (log.type === 'vital') return false;
      const isDateMatch = new Date(log.createdAt) >= cutoffDate;
      const isRegionMatch = log.regions ? log.regions.includes(regionId) : false;
      return isDateMatch && isRegionMatch;
    });

    if (regionLogs.length === 0) return null;

    const totalLogs = regionLogs.length;

    // Severity average
    const totalSeverity = regionLogs.reduce((sum, log) => sum + (log.severity ?? 0), 0);
    const avgSeverity = (totalSeverity / totalLogs).toFixed(1);

    // Common symptoms occurrence
    const symptomMap: { [key: string]: number } = {};
    regionLogs.forEach((log) => {
      const sym = log.symptom || 'Symptom';
      symptomMap[sym] = (symptomMap[sym] || 0) + 1;
    });
    const topSymptom = Object.keys(symptomMap).reduce((a, b) =>
      symptomMap[a] > symptomMap[b] ? a : b,
      'Symptom'
    );

    // Common descriptor
    const descMap: { [key: string]: number } = {};
    regionLogs.forEach((log) => {
      const desc = log.descriptor || 'Descriptor';
      descMap[desc] = (descMap[desc] || 0) + 1;
    });
    const topDescriptor = Object.keys(descMap).reduce(
      (a, b) => (descMap[a] > descMap[b] ? a : b),
      'Unknown'
    );

    // Medication effectiveness
    const medsTaken = regionLogs.filter((l) => l.takenMedication);
    const resolvedCount = medsTaken.filter((l) => l.medicationEffect === 'Better').length;
    const medEffectiveness = medsTaken.length 
      ? `${Math.round((resolvedCount / medsTaken.length) * 100)}% relieved` 
      : 'No medication logged';

    return {
      totalLogs,
      avgSeverity,
      topSymptom,
      topDescriptor,
      medEffectiveness,
    };
  };

  const handleSelectRegion = (regionId: string) => {
    triggerHaptic('light');
    setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
  };

  const activeRegionData = BODY_REGIONS.find((r) => r.id === selectedRegionId);
  const stats = selectedRegionId ? getRegionStats(selectedRegionId) : null;

  return (
    <View style={styles.container}>
      {/* Timeframe Filter Tabs */}
      <View style={styles.header}>
        <Text style={styles.title}>Body Heatmap</Text>
        <Text style={styles.subtitle}>Insightful overview of your logged physical zones</Text>
        
        <View style={styles.filterRow}>
          {([7, 30, 90, 365] as FilterType[]).map((days) => {
            const isSelected = filterDays === days;
            return (
              <TouchableOpacity
                key={days}
                style={[styles.filterBtn, isSelected && styles.filterBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilterDays(days);
                }}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {days === 365 ? '1 Year' : `${days} Days`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Body Heatmap Silhouette */}
      <View style={styles.bodyWrapper}>
        <BodySilhouette
          selectedRegions={selectedRegionId ? [selectedRegionId] : []}
          onSelectRegion={handleSelectRegion}
          isHeatmap={true}
          logs={logs}
          heatmapFilterDays={filterDays}
        />
      </View>

      {/* Stats Summary Modal Container */}
      {selectedRegionId && activeRegionData && (
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={styles.statsContainer}
        >
          <GlassContainer style={styles.statsCard} intensity={60}>
            <View style={styles.statsHeader}>
              <View>
                <Text style={styles.regionLabel}>REGION ANALYSIS</Text>
                <Text style={styles.regionName}>{activeRegionData.name}</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeBtn}
                onPress={() => setSelectedRegionId(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {stats ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsGrid}
              >
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.totalLogs}</Text>
                  <Text style={styles.statLabel}>Logs Recorded</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#B91C1C' }]}>
                    {stats.avgSeverity}
                  </Text>
                  <Text style={styles.statLabel}>Avg Severity</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#1D4ED8' }]} numberOfLines={1}>
                    {stats.topSymptom}
                  </Text>
                  <Text style={styles.statLabel}>Common Type</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statVal} numberOfLines={1}>
                    {stats.topDescriptor}
                  </Text>
                  <Text style={styles.statLabel}>Common Feel</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#047857' }]} numberOfLines={1}>
                    {stats.medEffectiveness}
                  </Text>
                  <Text style={styles.statLabel}>Treatment Success</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyStats}>
                <Text style={styles.emptyStatsText}>
                  No entries logged for {activeRegionData.name} within the last {filterDays} days.
                </Text>
              </View>
            )}
          </GlassContainer>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 20,
    alignItems: 'center',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryGlow,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  bodyWrapper: {
    flex: 1,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    zIndex: 60,
  },
  statsCard: {
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  regionLabel: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  regionName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    width: 110,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.16)',
  },
  statVal: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  emptyStats: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyStatsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
export default HeatmapScreen;
