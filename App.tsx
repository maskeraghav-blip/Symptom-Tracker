import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HealthProvider, useHealth } from './src/state/HealthContext';
import { LogScreen } from './src/screens/LogScreen';
import { HeatmapScreen } from './src/screens/HeatmapScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { COLORS, GRADIENTS } from './src/theme/theme';
import { GlassContainer } from './src/components/GlassContainer';
import { VitalsModal } from './src/components/VitalsModal';

type TabType = 'LOG' | 'HEATMAP' | 'TIMELINE' | 'REPORT';

function MainAppShell() {
  const [activeTab, setActiveTab] = useState<TabType>('LOG');
  const { currentPatient, logoutPatient, triggerHaptic, currentCheckIn } = useHealth();

  if (!currentPatient) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.background as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <LoginScreen />
        </SafeAreaView>
      </View>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'LOG':
        return <LogScreen />;
      case 'HEATMAP':
        return <HeatmapScreen />;
      case 'TIMELINE':
        return <TimelineScreen />;
      case 'REPORT':
        return <ReportScreen />;
      default:
        return <LogScreen />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'LOG':
        return { label: 'Check-In', symbol: '⊙' };
      case 'HEATMAP':
        return { label: 'Body Map', symbol: '✱' };
      case 'TIMELINE':
        return { label: 'Timeline', symbol: '⎋' };
      case 'REPORT':
        return { label: 'Report', symbol: '▤' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic linear background gradient */}
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Active Patient Header */}
        {!currentCheckIn && (
          <View style={styles.headerBar}>
            <View style={styles.patientInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{currentPatient.patientName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.patientName}>{currentPatient.patientName}</Text>
                <Text style={styles.patientSubDetails}>
                  ID: {currentPatient.userId} {currentPatient.contactNumber ? `• 📞 ${currentPatient.contactNumber}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                triggerHaptic('medium');
                logoutPatient();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Swapped content area */}
        <View style={styles.screenWrapper}>
          <Animated.View key={activeTab} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.screenContent}>
            {renderActiveScreen()}
          </Animated.View>
        </View>

        {/* Custom Glassmorphic tab bar */}
        {!currentCheckIn && (
          <Animated.View style={styles.tabBarContainer}>
            <GlassContainer style={styles.tabGlass} intensity={70} borderRadius={28}>
              <View style={styles.tabInner}>
                {(['LOG', 'HEATMAP', 'TIMELINE', 'REPORT'] as TabType[]).map((tab) => {
                  const isSelected = activeTab === tab;
                  const config = getTabLabel(tab);

                  return (
                    <TouchableOpacity
                      key={tab}
                      style={styles.tabButton}
                      onPress={() => {
                        if (activeTab !== tab) {
                          triggerHaptic('light');
                          setActiveTab(tab);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tabSymbol,
                          isSelected && { color: COLORS.primary, transform: [{ scale: 1.2 }] },
                        ]}
                      >
                        {config.symbol}
                      </Text>
                      <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassContainer>
          </Animated.View>
        )}
      </SafeAreaView>
      <VitalsModal />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <MainAppShell />
      </HealthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  patientSubDetails: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  screenWrapper: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    height: 64,
    zIndex: 100,
  },
  tabGlass: {
    padding: 0,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    borderColor: COLORS.cardBorder,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabSymbol: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
});
