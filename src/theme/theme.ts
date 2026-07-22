export const COLORS = {
  background: '#F4F7FB',
  cardBg: 'rgba(255, 255, 255, 0.94)',
  cardBorder: 'rgba(22, 35, 58, 0.08)',
  text: '#172033',
  textSecondary: '#55657A',
  textMuted: '#8391A5',
  
  // Accents matching premium health apps
  primary: '#2563EB',
  primaryGlow: 'rgba(37, 99, 235, 0.12)',
  secondary: '#0F9F6E',
  accent: '#D97706',
  highlight: '#0891B2',
  
  // Severity colors
  severity: {
    low: '#10B981',         // 0-3
    medium: '#F59E0B',      // 4-6
    high: '#EF4444',        // 7-10
  },

  // Heatmap gradients
  heatLow: 'rgba(14, 165, 233, 0.26)',
  heatMedium: 'rgba(245, 158, 11, 0.36)',
  heatHigh: 'rgba(239, 68, 68, 0.46)',
};

export const GRADIENTS = {
  background: ['#F8FAFC', '#EEF4FA', '#F7FBFF'],
  primary: ['#2563EB', '#0EA5E9'],
  card: ['rgba(255, 255, 255, 0.98)', 'rgba(247, 250, 253, 0.94)'],
  selectedBodyPart: ['rgba(37, 99, 235, 0.22)', 'rgba(14, 165, 233, 0.06)'],
  heatmapLow: ['rgba(14, 165, 233, 0.28)', 'rgba(14, 165, 233, 0.04)'],
  heatmapMed: ['rgba(245, 158, 11, 0.34)', 'rgba(245, 158, 11, 0.06)'],
  heatmapHigh: ['rgba(239, 68, 68, 0.42)', 'rgba(239, 68, 68, 0.07)'],
  success: ['#10B981', '#059669'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  // Use system fonts that look exceptionally sharp
  light: 'System',
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};
