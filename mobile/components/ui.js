import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';

export function Loading() {
  return <View style={s.center}><ActivityIndicator size="large" color="#0ea5a4" /></View>;
}

export function Empty({ title, hint }) {
  return (
    <View style={s.center}>
      <Text style={s.title}>{title}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return <View style={s.center}><Text style={s.errorTitle}>Could not load</Text><Text style={s.hint}>{message}</Text>{onRetry ? <Pressable style={s.retry} onPress={onRetry}><Text style={s.retryText}>Try again</Text></Pressable> : null}</View>;
}

export function StatusPill({ status }) {
  const c = COLORS[status] || COLORS.DEFAULT;
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillText, { color: c.fg }]}>{LABEL[status] || status}</Text>
    </View>
  );
}

const LABEL = {
  DRAFT: 'Draft', ANALYZING: 'Analyzing', ESTIMATED: 'Estimated', POSTED: 'Posted',
  MATCHED: 'Matched', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', FAILED: 'Failed',
  PENDING: 'Pending', ACCEPTED: 'Accepted', DECLINED: 'Declined',
};
const COLORS = {
  POSTED: { bg: '#dbeafe', fg: '#1d4ed8' }, MATCHED: { bg: '#dbeafe', fg: '#1d4ed8' },
  SCHEDULED: { bg: '#ccfbf1', fg: '#0f766e' }, IN_PROGRESS: { bg: '#ccfbf1', fg: '#0f766e' },
  COMPLETED: { bg: '#dcfce7', fg: '#15803d' }, ACCEPTED: { bg: '#dcfce7', fg: '#15803d' },
  FAILED: { bg: '#fee2e2', fg: '#b91c1c' }, DECLINED: { bg: '#fee2e2', fg: '#b91c1c' },
  DEFAULT: { bg: '#f1f5f9', fg: '#475569' },
};

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 220 },
  title: { fontSize: 15, fontWeight: '700', color: '#475569' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  errorTitle: { fontSize: 15, fontWeight: '800', color: '#b91c1c' },
  retry: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 }, retryText: { color: '#fff', fontWeight: '700' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },
});
