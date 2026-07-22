import React, { useEffect, useMemo, useState } from 'react';
import { GestureResponderEvent, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { BODY_REGIONS } from '../data/bodyParts';
import { HealthLog } from '../state/HealthContext';
import { COLORS } from '../theme/theme';

interface BodySilhouetteProps {
  selectedRegions: string[];
  onSelectRegion: (id: string) => void;
  onSelectMultiple?: (ids: string[]) => void;
  isHeatmap?: boolean;
  logs?: HealthLog[];
  heatmapFilterDays?: number;
  zoomEnabled?: boolean;
  isFront?: boolean;
  onIsFrontChange?: (isFront: boolean) => void;
  manualZoom?: number;
  onManualZoomChange?: (zoom: number) => void;
  hideInternalControls?: boolean;
}

type RegionId = 
  | 'head' 
  | 'neck' 
  | 'chest' 
  | 'back' 
  | 'abdomen' 
  | 'left_upper_arm' 
  | 'left_forearm' 
  | 'right_upper_arm' 
  | 'right_forearm' 
  | 'left_thigh' 
  | 'left_calf' 
  | 'right_thigh' 
  | 'right_calf';

const frontPaths: Record<RegionId, string> = {
  head: 'M120 18 C103 18 95 31 96 51 C97 67 103 78 112 83 C116 83 124 83 128 83 C137 78 143 67 144 51 C145 31 137 18 120 18 Z',
  neck: 'M112 83 C112 90 110 96 110 103 L130 103 C130 96 128 90 128 83 Z',
  chest: 'M75 104 C87 96 101 92 120 92 C139 92 153 96 165 104 C172 116 171 139 164 151 C150 156 137 157 120 157 C103 157 90 156 76 151 C69 139 68 116 75 104 Z',
  back: 'M75 104 C88 96 102 92 120 92 C138 92 152 96 165 104 C171 124 171 150 163 172 C158 189 151 205 144 221 L120 229 L96 221 C89 205 82 189 77 172 C69 150 69 124 75 104 Z',
  abdomen: 'M76 151 C90 156 103 157 120 157 C137 157 150 156 164 151 C162 174 154 203 144 221 C136 228 129 232 120 233 C111 232 104 228 96 221 C86 203 78 174 76 151 Z',
  left_upper_arm: 'M75 104 C62 107 52 119 48 138 C44 154 40 176 37 190 C45 187 53 186 61 185 C65 172 70 151 74 134 C77 119 75 104 75 104 Z',
  left_forearm: 'M37 190 C35 198 31 217 36 249 C33 260 31 271 34 279 C37 283 42 279 43 271 C44 263 47 254 50 246 C54 235 55 225 57 211 C60 191 61 185 61 185 C53 186 45 187 37 190 Z',
  right_upper_arm: 'M165 104 C178 107 188 119 192 138 C196 154 200 176 203 190 C195 187 187 186 179 185 C180 191 175 172 170 151 C166 134 163 119 165 104 Z',
  right_forearm: 'M203 190 C205 198 209 217 204 249 C207 260 209 271 206 279 C203 283 198 279 197 271 C196 263 193 254 190 246 C186 235 185 225 183 211 C180 191 179 185 179 185 C187 186 195 187 203 190 Z',
  left_thigh: 'M96 221 C87 245 82 273 82 307 C82 333 84 340 84 340 C94 342 104 342 114 340 C114 340 113 318 117 289 C119 267 121 247 120 233 C111 232 104 228 96 221 Z',
  left_calf: 'M84 340 C84 350 86 360 88 370 C90 382 89 394 86 410 C84 425 83 443 88 456 C80 462 74 469 75 475 C83 480 96 479 103 473 C102 455 105 435 109 418 C112 400 114 384 113 370 C113 360 113 350 114 340 C104 342 94 342 84 340 Z',
  right_thigh: 'M144 221 C153 245 158 273 158 307 C158 333 156 340 156 340 C146 342 136 342 126 340 C126 340 127 318 123 289 C121 267 119 247 120 233 C129 232 136 228 144 221 Z',
  right_calf: 'M156 340 C156 350 154 360 152 370 C150 382 151 394 154 410 C156 425 157 443 152 456 C160 462 166 469 165 475 C157 480 144 479 137 473 C138 455 135 435 131 418 C128 400 126 384 127 370 C127 360 127 350 126 340 C136 342 146 342 156 340 Z',
};

const backPaths: Record<RegionId, string> = {
  ...frontPaths,
  chest: frontPaths.chest,
  abdomen: frontPaths.abdomen,
  back: 'M75 104 C88 96 102 92 120 92 C138 92 152 96 165 104 C172 128 170 155 161 183 C157 198 151 212 144 224 L120 233 L96 224 C89 212 83 198 79 183 C70 155 68 128 75 104 Z',
};

const meshLines = [
  'M103 31 C112 27 128 27 137 31',
  'M99 43 C111 39 129 39 141 43',
  'M99 55 C111 52 129 52 141 55',
  'M102 68 C112 66 128 66 138 68',
  'M83 113 C100 109 140 109 157 113',
  'M76 129 C96 126 144 126 164 129',
  'M75 146 C95 145 145 145 165 146',
  'M78 166 C98 170 142 170 162 166',
  'M83 188 C101 194 139 194 157 188',
  'M91 210 C107 218 133 218 149 210',
  'M52 137 C61 142 68 146 72 151',
  'M45 166 C55 171 63 176 67 182',
  'M38 202 C49 205 56 209 60 215',
  'M188 137 C179 142 172 146 168 151',
  'M195 166 C185 171 177 176 173 182',
  'M202 202 C191 205 184 209 180 215',
  'M86 259 C96 264 109 265 118 260',
  'M83 292 C94 298 107 298 116 292',
  'M84 329 C94 336 106 336 113 329',
  'M89 369 C96 374 106 374 113 369',
  'M122 260 C131 265 144 264 154 259',
  'M124 292 C133 298 146 298 157 292',
  'M127 329 C134 336 146 336 156 329',
  'M127 369 C134 374 144 374 151 369',
];

const verticalMeshLines = [
  'M120 19 L120 103',
  'M111 25 C108 45 108 70 112 102',
  'M129 25 C132 45 132 70 128 102',
  'M99 99 C94 135 94 184 101 222',
  'M120 93 L120 233',
  'M141 99 C146 135 146 184 139 222',
  'M63 116 C60 150 54 185 43 244',
  'M177 116 C180 150 186 185 197 244',
  'M101 225 C98 270 98 334 103 473',
  'M139 225 C142 270 142 334 137 473',
];

export const BodySilhouette: React.FC<BodySilhouetteProps> = ({
  selectedRegions,
  onSelectRegion,
  onSelectMultiple,
  isHeatmap = false,
  logs = [],
  heatmapFilterDays = 30,
  zoomEnabled = false,
  isFront: propIsFront,
  onIsFrontChange,
  manualZoom: propManualZoom,
  onManualZoomChange,
  hideInternalControls = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [draggedRegions, setDraggedRegions] = useState<string[]>([]);
  const [layout, setLayout] = useState({ width: 240, height: 500 });
  
  const [localIsFront, setLocalIsFront] = useState(true);
  const isFront = propIsFront !== undefined ? propIsFront : localIsFront;

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [webScale, setWebScale] = useState(1);
  const [webTranslateX, setWebTranslateX] = useState(0);
  const [webTranslateY, setWebTranslateY] = useState(0);
  const [webFlip, setWebFlip] = useState(1);
  const [isTurning, setIsTurning] = useState(false);

  const [localManualZoom, setLocalManualZoom] = useState(1.0);
  const manualZoom = propManualZoom !== undefined ? propManualZoom : localManualZoom;

  const setManualZoom = (zoom: number) => {
    if (onManualZoomChange) {
      onManualZoomChange(zoom);
    } else {
      setLocalManualZoom(zoom);
    }
  };

  const zoomScale = useSharedValue(1);
  const zoomTranslateX = useSharedValue(0);
  const zoomTranslateY = useSharedValue(0);
  const flipScale = useSharedValue(1);

  const activePaths = isFront ? frontPaths : backPaths;

  const availableRegions = useMemo(() => (
    BODY_REGIONS.filter((region) => {
      if (isFront && region.id === 'back') return false;
      if (!isFront && (region.id === 'chest' || region.id === 'abdomen')) return false;
      return true;
    })
  ), [isFront]);

  useEffect(() => {
    if (zoomEnabled && selectedRegions.length > 0) {
      const targetRegionId = selectedRegions[0];
      const regionData = BODY_REGIONS.find((r) => r.id === targetRegionId);

      if (regionData) {
        let scaleFactor = 1.85;
        if (targetRegionId === 'head' || targetRegionId === 'neck') {
          scaleFactor = 2.45;
        } else if (targetRegionId.includes('arm') || targetRegionId.includes('forearm')) {
          scaleFactor = 2.05;
        } else if (targetRegionId.includes('thigh') || targetRegionId.includes('calf') || targetRegionId.includes('leg')) {
          scaleFactor = 1.65;
        }

        const ratioX = layout.width / 240;
        const ratioY = layout.height / 500;
        const cx = regionData.cx * ratioX;
        const cy = regionData.cy * ratioY;
        const targetX = (layout.width / 2 - cx) * scaleFactor;

        // Anchor vertical coordinates to the center of the TOP 46% of the screen (approx 0.22)
        // so that the active body part is clearly visible (shifts ABOVE the bottom questionnaire card).
        const verticalAnchorPct = (targetRegionId.includes('thigh') || targetRegionId.includes('calf') || targetRegionId.includes('leg')) 
          ? 0.25 
          : 0.22;
        const targetY = (layout.height * verticalAnchorPct - cy) * scaleFactor;

        if (Platform.OS === 'web') {
          setWebScale(scaleFactor);
          setWebTranslateX(targetX);
          setWebTranslateY(targetY);
        } else {
          zoomScale.value = withTiming(scaleFactor, { duration: 420 });
          zoomTranslateX.value = withTiming(targetX, { duration: 420 });
          zoomTranslateY.value = withTiming(targetY, { duration: 420 });
        }
      }
    } else {
      // Manual Zoom Mode
      if (Platform.OS === 'web') {
        setWebScale(manualZoom);
        setWebTranslateX(0);
        setWebTranslateY(0);
      } else {
        zoomScale.value = withTiming(manualZoom, { duration: 340 });
        zoomTranslateX.value = withTiming(0, { duration: 340 });
        zoomTranslateY.value = withTiming(0, { duration: 340 });
      }
    }
  }, [layout, selectedRegions, zoomEnabled, manualZoom, zoomScale, zoomTranslateX, zoomTranslateY]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: zoomTranslateX.value },
      { translateY: zoomTranslateY.value },
      { perspective: 800 },
      { scale: zoomScale.value },
      { scaleX: flipScale.value },
    ],
  }));

  const webBodyStyle = Platform.OS === 'web'
    ? {
        cursor: 'pointer',
        transform: `translate(${webTranslateX}px, ${webTranslateY}px) scale(${webScale}) scaleX(${webFlip})`,
        transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        transformOrigin: 'center center',
      }
    : {};

  const getRegionHeatWeight = (regionId: string) => {
    if (!isHeatmap || !logs.length) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - heatmapFilterDays);

    const count = logs.filter((log) => {
      const isDateMatch = new Date(log.createdAt) >= cutoffDate;
      const isRegionMatch = log.regions ? log.regions.includes(regionId) : false;
      return isDateMatch && isRegionMatch;
    }).length;

    if (count === 0) return 0;
    if (count === 1) return 0.3;
    if (count <= 3) return 0.6;
    return 1.0;
  };

  const getNearestRegion = (touchX: number, touchY: number): string | null => {
    const relativeX = (touchX / layout.width) * 240;
    const relativeY = (touchY / layout.height) * 500;
    let nearestRegion: string | null = null;
    let minDistance = 54;

    availableRegions.forEach((region) => {
      const dx = relativeX - region.cx;
      const dy = relativeY - region.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        nearestRegion = region.id;
      }
    });

    return nearestRegion;
  };

  const handleTouchStart = (e: GestureResponderEvent) => {
    if (Platform.OS === 'web') return;
    const { locationX, locationY } = e.nativeEvent;
    const regionId = getNearestRegion(locationX, locationY);
    setDraggedRegions(regionId ? [regionId] : []);
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (Platform.OS === 'web') return;
    const { locationX, locationY } = e.nativeEvent;
    const regionId = getNearestRegion(locationX, locationY);

    if (regionId) {
      setDraggedRegions((prev) => (prev.includes(regionId) ? prev : [...prev, regionId]));
    }
  };

  const handleTouchEnd = () => {
    if (Platform.OS === 'web') return;
    if (draggedRegions.length > 1 && onSelectMultiple) {
      onSelectMultiple(draggedRegions);
    } else if (draggedRegions.length > 0) {
      onSelectRegion(draggedRegions[0]);
    }
    setDraggedRegions([]);
  };

  const toggleSides = (nextIsFront: boolean) => {
    if (nextIsFront === isFront || isTurning) return;
    setIsTurning(true);
    setHoveredRegion(null);

    if (Platform.OS === 'web') {
      setWebFlip(0.04);
    } else {
      flipScale.value = withSequence(withTiming(0.04, { duration: 170 }), withTiming(1, { duration: 260 }));
    }

    setTimeout(() => {
      if (onIsFrontChange) {
        onIsFrontChange(nextIsFront);
      } else {
        setLocalIsFront(nextIsFront);
      }
      if (Platform.OS === 'web') {
        setWebFlip(1);
      }
    }, 170);

    setTimeout(() => setIsTurning(false), 460);
  };

  const renderRegionPath = (regionId: RegionId) => {
    const isSelected = selectedRegions.includes(regionId) || draggedRegions.includes(regionId);
    const isHovered = hoveredRegion === regionId;
    const hasSelection = selectedRegions.length > 0;
    const heatWeight = getRegionHeatWeight(regionId);

    let backingFill = 'none';
    if (isSelected) {
      backingFill = 'url(#activeGradient)';
    } else if (isHovered) {
      backingFill = 'url(#hoverGradient)';
    } else if (isHeatmap && heatWeight > 0) {
      backingFill = heatWeight === 1 ? 'url(#heatHighGrad)' : heatWeight > 0.4 ? 'url(#heatMedGrad)' : 'url(#heatLowGrad)';
    }

    const strokeColor = isSelected ? COLORS.primary : isHovered ? COLORS.highlight : 'rgba(15, 23, 42, 0.44)';
    const strokeWidth = isSelected ? 2.5 : isHovered ? 2.3 : 1.25;
    const opacity = isSelected ? 1 : isHovered ? 1.0 : hasSelection ? 0.42 : 1;

    return (
      <G key={regionId} pointerEvents="none">
        {backingFill !== 'none' && <Path d={activePaths[regionId]} fill={backingFill} opacity={isSelected ? 1 : 0.9} />}
        <Path d={activePaths[regionId]} fill="url(#bodyGradient)" stroke={strokeColor} strokeWidth={strokeWidth} opacity={opacity} />
      </G>
    );
  };

  // Zoom Slider layout constants
  const minZoom = 1.0;
  const maxZoom = 2.5;
  const sliderPercentage = (manualZoom - minZoom) / (maxZoom - minZoom);

  return (
    <View style={styles.container}>
      {!hideInternalControls && selectedRegions.length === 0 && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, isFront && styles.toggleActive]} onPress={() => toggleSides(true)} activeOpacity={0.8}>
            <Text style={[styles.toggleText, isFront && styles.toggleTextActive]}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, !isFront && styles.toggleActive]} onPress={() => toggleSides(false)} activeOpacity={0.8}>
            <Text style={[styles.toggleText, !isFront && styles.toggleTextActive]}>Posterior</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.bodyWrapper,
          { width: Math.min(windowWidth * 0.72, 292) },
          Platform.OS === 'web' ? (webBodyStyle as any) : animatedBodyStyle,
        ]}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...(Platform.OS === 'web' && {
          onMouseDown: (e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const localX = (e.clientX - rect.left) / webScale;
            const localY = (e.clientY - rect.top) / webScale;
            const regionId = getNearestRegion(localX, localY);
            if (regionId) onSelectRegion(regionId);
          },
          onMouseMove: (e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const localX = (e.clientX - rect.left) / webScale;
            const localY = (e.clientY - rect.top) / webScale;
            setHoveredRegion(getNearestRegion(localX, localY));
          },
          onMouseLeave: () => setHoveredRegion(null),
        })}
      >
        <Svg viewBox="0 0 240 500" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.99} />
              <Stop offset="100%" stopColor="#D9E6F2" stopOpacity={0.92} />
            </LinearGradient>
            <RadialGradient id="activeGradient" cx="50%" cy="48%" rx="56%" ry="56%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.42} />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
            </RadialGradient>
            <RadialGradient id="hoverGradient" cx="50%" cy="48%" rx="56%" ry="56%">
              <Stop offset="0%" stopColor={COLORS.highlight} stopOpacity={0.48} />
              <Stop offset="100%" stopColor={COLORS.highlight} stopOpacity={0.03} />
            </RadialGradient>
            <RadialGradient id="heatLowGrad" cx="50%" cy="50%" rx="58%" ry="58%">
              <Stop offset="0%" stopColor={COLORS.severity.low} stopOpacity={0.42} />
              <Stop offset="100%" stopColor={COLORS.severity.low} stopOpacity={0.02} />
            </RadialGradient>
            <RadialGradient id="heatMedGrad" cx="50%" cy="50%" rx="58%" ry="58%">
              <Stop offset="0%" stopColor={COLORS.severity.medium} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={COLORS.severity.medium} stopOpacity={0.02} />
            </RadialGradient>
            <RadialGradient id="heatHighGrad" cx="50%" cy="50%" rx="58%" ry="58%">
              <Stop offset="0%" stopColor={COLORS.severity.high} stopOpacity={0.56} />
              <Stop offset="100%" stopColor={COLORS.severity.high} stopOpacity={0.02} />
            </RadialGradient>
          </Defs>

          <G>
            {renderRegionPath('head')}
            {renderRegionPath('neck')}
            {isFront ? renderRegionPath('chest') : renderRegionPath('back')}
            {isFront && renderRegionPath('abdomen')}
            {renderRegionPath('left_upper_arm')}
            {renderRegionPath('left_forearm')}
            {renderRegionPath('right_upper_arm')}
            {renderRegionPath('right_forearm')}
            {renderRegionPath('left_thigh')}
            {renderRegionPath('left_calf')}
            {renderRegionPath('right_thigh')}
            {renderRegionPath('right_calf')}

            <G pointerEvents="none" opacity={selectedRegions.length > 0 ? 0.05 : 0.16}>
              {meshLines.map((d) => (
                <Path key={d} d={d} fill="none" stroke={COLORS.highlight} strokeWidth={0.38} />
              ))}
              {verticalMeshLines.map((d) => (
                <Path key={d} d={d} fill="none" stroke={COLORS.highlight} strokeWidth={0.28} />
              ))}
            </G>

            <G pointerEvents="none" opacity={selectedRegions.length > 0 ? 0.08 : 0.22}>
              {isFront ? (
                <>
                  <Path d="M120 106 C110 102 96 102 85 107 M120 106 C130 102 144 102 155 107" fill="none" stroke="rgba(37, 99, 235, 0.36)" strokeWidth={0.7} />
                  <Path d="M120 111 L120 225 M99 178 H141 M102 201 H138" fill="none" stroke="rgba(37, 99, 235, 0.32)" strokeWidth={0.6} />
                  <Path d="M89 371 C91 363 103 363 105 371 C103 379 91 379 89 371 Z M135 371 C137 363 149 363 151 371 C149 379 137 379 135 371 Z" fill="none" stroke="rgba(37, 99, 235, 0.32)" strokeWidth={0.6} />
                </>
              ) : (
                <>
                  <Path d="M120 100 L120 226 M117 116 H123 M117 135 H123 M117 154 H123 M117 173 H123 M117 192 H123" fill="none" stroke="rgba(37, 99, 235, 0.36)" strokeWidth={0.6} />
                  <Path d="M112 115 C101 118 94 128 96 140 C104 140 112 134 114 124 M128 115 C139 118 146 128 144 140 C136 140 128 134 126 124" fill="none" stroke="rgba(37, 99, 235, 0.28)" strokeWidth={0.6} />
                </>
              )}
            </G>
          </G>
        </Svg>
      </Animated.View>

      {/* Modern Horizontal Magnification Slider */}
      {!hideInternalControls && selectedRegions.length === 0 && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>－</Text>
          {Platform.OS === 'web' ? (
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.02}
              value={manualZoom}
              onChange={(e) => setManualZoom(parseFloat(e.target.value))}
              style={{
                width: 140,
                cursor: 'pointer',
                accentColor: COLORS.primary,
                margin: '0 8px',
                height: 4,
                borderRadius: 2,
                outline: 'none',
                border: 'none',
                background: '#E2E8F0',
              }}
            />
          ) : (
            <View 
              style={styles.sliderTrackWrapper}
              onTouchStart={(e) => {
                const { locationX } = e.nativeEvent;
                const pct = Math.max(0, Math.min(1, locationX / 140));
                setManualZoom(minZoom + pct * (maxZoom - minZoom));
              }}
              onTouchMove={(e) => {
                const { locationX } = e.nativeEvent;
                const pct = Math.max(0, Math.min(1, locationX / 140));
                setManualZoom(minZoom + pct * (maxZoom - minZoom));
              }}
            >
              <View style={styles.sliderTrack} />
              <View style={[styles.sliderTrackActive, { width: `${sliderPercentage * 100}%` }]} />
              <View style={[styles.sliderThumb, { left: `${sliderPercentage * 100}%` }]} />
            </View>
          )}
          <Text style={styles.sliderLabel}>＋</Text>
          {manualZoom > 1.0 && (
            <TouchableOpacity style={styles.resetBadge} onPress={() => setManualZoom(1.0)} activeOpacity={0.7}>
              <Text style={styles.resetBadgeText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!hideInternalControls && selectedRegions.length === 0 && (
        <Text style={styles.dragHint}>
          {isHeatmap ? 'Hover or select a region for trend detail' : 'Tap a region, or drag/zoom to capture specific areas'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: Platform.OS === 'web' ? 12 : 18,
    zIndex: 100,
  },
  toggleBtn: {
    minWidth: 88,
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  toggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  bodyWrapper: {
    maxWidth: 292,
    maxHeight: 500,
    aspectRatio: 240 / 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 6 : 10,
    paddingHorizontal: 32,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: Platform.OS === 'web' ? 12 : 18,
    zIndex: 110,
    height: 38,
  },
  sliderTrackWrapper: {
    width: 140,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,
    cursor: 'pointer' as any,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginLeft: -7,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  resetBadge: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  resetBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default BodySilhouette;
