import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { GlassContainer } from '../components/GlassContainer';
import { COLORS } from '../theme/theme';
import { useHealth } from '../state/HealthContext';

export const LoginScreen: React.FC = () => {
  const { loginPatient, triggerHaptic } = useHealth();
  const [userId, setUserId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');

    if (!userId.trim()) {
      triggerHaptic('heavy');
      setErrorMsg('User ID is required.');
      return;
    }

    if (!patientName.trim()) {
      triggerHaptic('heavy');
      setErrorMsg('Patient Name is required.');
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    try {
      await loginPatient(userId.trim(), patientName.trim(), contactNumber.trim() || undefined);
    } catch (err: any) {
      triggerHaptic('heavy');
      setErrorMsg(err.message || 'Login failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (id: string, name: string, contact?: string) => {
    triggerHaptic('light');
    setUserId(id);
    setPatientName(name);
    setContactNumber(contact || '');
    setErrorMsg('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.centerCardContainer}>
          <GlassContainer style={styles.card} intensity={85} borderRadius={24}>
            {/* Header / Logo */}
            <View style={styles.header}>
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeText}>⚕️</Text>
              </View>
              <Text style={styles.title}>Patient Portal</Text>
              <Text style={styles.subtitle}>Enter your details to access your personal health record</Text>
            </View>

            {errorMsg ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </Animated.View>
            ) : null}

            {/* Input Form */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>User ID</Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. PAT-90210"
                placeholderTextColor={COLORS.textMuted}
                value={userId}
                onChangeText={(text) => {
                  setUserId(text);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Patient Name</Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sarah Jenkins"
                placeholderTextColor={COLORS.textMuted}
                value={patientName}
                onChangeText={(text) => {
                  setPatientName(text);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contact Number</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. +1 (555) 234-5678"
                placeholderTextColor={COLORS.textMuted}
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Access Health Portal →</Text>
              )}
            </TouchableOpacity>

            {/* Quick Demo Selector */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Quick Select Demo Patients:</Text>
              <View style={styles.demoChips}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => fillQuickDemo('P-101', 'Alice Vance', '555-0192')}
                >
                  <Text style={styles.chipText}>Alice (P-101)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => fillQuickDemo('P-102', 'Bob Miller', '555-0843')}
                >
                  <Text style={styles.chipText}>Bob (P-102)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassContainer>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  centerCardContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  card: {
    padding: 24,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  badgeText: {
    fontSize: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 16,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  demoChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
