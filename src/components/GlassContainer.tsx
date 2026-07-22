import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme/theme';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  intensity = 55,
  borderRadius = 24,
}) => {
  if (Platform.OS === 'web') {
    // Web CSS blur fallback for standard performance and styling
    return (
      <View
        style={[
          styles.webContainer,
          { borderRadius },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.containerShadow, { borderRadius }, style]}>
      <BlurView
        intensity={intensity}
        tint="light"
        blurMethod="dimezisBlurView" // smooth Android blur
        style={[
          styles.blur,
          { borderRadius },
        ]}
      >
        <View style={[styles.innerContent, { borderRadius }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerShadow: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  blur: {
    width: '100%',
    height: '100%',
  },
  innerContent: {
    padding: 20,
    width: '100%',
    height: '100%',
  },
  webContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  } as any,
});
