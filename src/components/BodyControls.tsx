import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { COLORS } from '../theme/theme';

interface BodyControlsProps {
  isFront: boolean;
  onIsFrontChange: (isFront: boolean) => void;
  manualZoom: number;
  onManualZoomChange: (zoom: number) => void;
  showHint: boolean;
}

export const BodyControls: React.FC<BodyControlsProps> = ({
  isFront,
  onIsFrontChange,
  manualZoom,
  onManualZoomChange,
  showHint,
}) => {
  const minZoom = 1.0;
  const maxZoom = 2.5;
  const sliderPercentage = (manualZoom - minZoom) / (maxZoom - minZoom);

  return (
    <View style={styles.controlsContainer}>
      {/* 1. Anterior / Posterior toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, isFront && styles.toggleActive]}
          onPress={() => onIsFrontChange(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, isFront && styles.toggleTextActive]}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !isFront && styles.toggleActive]}
          onPress={() => onIsFrontChange(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, !isFront && styles.toggleTextActive]}>Posterior</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Compact Zoom Slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>－</Text>
        {Platform.OS === 'web' ? (
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.02}
            value={manualZoom}
            onChange={(e) => onManualZoomChange(parseFloat(e.target.value))}
            style={{
              width: 120,
              cursor: 'pointer',
              accentColor: COLORS.primary,
              margin: '0 8px',
              height: 3,
              borderRadius: 1.5,
              outline: 'none',
              border: 'none',
              background: 'rgba(15, 23, 42, 0.1)',
            }}
          />
        ) : (
          <View
            style={styles.sliderTrackWrapper}
            onTouchStart={(e) => {
              const { locationX } = e.nativeEvent;
              const pct = Math.max(0, Math.min(1, locationX / 120));
              onManualZoomChange(minZoom + pct * (maxZoom - minZoom));
            }}
            onTouchMove={(e) => {
              const { locationX } = e.nativeEvent;
              const pct = Math.max(0, Math.min(1, locationX / 120));
              onManualZoomChange(minZoom + pct * (maxZoom - minZoom));
            }}
          >
            <View style={styles.sliderTrack} />
            <View style={[styles.sliderTrackActive, { width: `${sliderPercentage * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${sliderPercentage * 100}%` }]} />
          </View>
        )}
        <Text style={styles.sliderLabel}>＋</Text>
        {manualZoom > 1.0 && (
          <TouchableOpacity
            style={styles.resetBadge}
            onPress={() => onManualZoomChange(1.0)}
            activeOpacity={0.7}
          >
            <Text style={styles.resetBadgeText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Interaction hint */}
      {showHint && (
        <Text style={styles.hintText}>
          Tap directly on a body region or drag/zoom to capture specific areas.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  toggleBtn: {
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  toggleText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  sliderTrackWrapper: {
    width: 120,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,
  },
  sliderTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    width: '100%',
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginLeft: -6,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  resetBadge: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  resetBadgeText: {
    color: COLORS.primary,
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 36,
    lineHeight: 14,
  },
});
