import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme/theme';

interface HealthHeaderProps {
  onLogVitalsPress: () => void;
  showVitalsBtn: boolean;
}

export const HealthHeader: React.FC<HealthHeaderProps> = ({
  onLogVitalsPress,
  showVitalsBtn,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.textWrapper}>
        <Text style={styles.accentText}>HEALTH CHECK-IN</Text>
        <Text style={styles.titleText}>How are you feeling today?</Text>
      </View>
      {showVitalsBtn && (
        <TouchableOpacity
          style={styles.vitalsBtn}
          onPress={onLogVitalsPress}
          activeOpacity={0.8}
        >
          <Text style={styles.vitalsBtnText}>Log Vitals</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  textWrapper: {
    flex: 1,
  },
  accentText: {
    color: COLORS.primary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 4,
  },
  titleText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  vitalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  vitalsBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
