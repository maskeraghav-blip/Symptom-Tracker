import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme/theme';

interface EntryModeSelectorProps {
  activeMode: 'body' | 'system';
  onModeChange: (mode: 'body' | 'system') => void;
}

export const EntryModeSelector: React.FC<EntryModeSelectorProps> = ({
  activeMode,
  onModeChange,
}) => {
  return (
    <View style={styles.selectorContainer}>
      <View style={styles.segmentedBg}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeMode === 'body' && styles.segmentActive]}
          onPress={() => onModeChange('body')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeMode === 'body' && styles.segmentTextActive]}>
            By Location
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeMode === 'system' && styles.segmentActive]}
          onPress={() => onModeChange('system')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeMode === 'system' && styles.segmentTextActive]}>
            By System
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  segmentedBg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 20,
    padding: 3,
    width: '84%',
    maxWidth: 320,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
