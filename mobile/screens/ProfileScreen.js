import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const pp = user?.providerProfile;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.card}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.initials || '?'}</Text></View>
        <Text style={s.name}>{user?.name || 'Your account'}</Text>
        <Text style={s.role}>{user?.role === 'provider' ? 'Service Provider' : 'Homeowner'}</Text>
      </View>

      <Text style={s.section}>Account</Text>
      <View style={s.list}>
        <Row label="Email" value={user?.email} />
        {user?.phone ? <Row label="Phone" value={user.phone} /> : null}
        {pp?.businessName ? <Row label="Business" value={pp.businessName} /> : null}
        {pp ? <Row label="Verified" value={pp.verified ? 'Yes' : 'Pending review'} /> : null}
        {pp ? <Row label="Rating" value={pp.ratingCount ? `${pp.ratingAvg.toFixed(1)} (${pp.ratingCount})` : 'No reviews yet'} /> : null}
      </View>

      {pp?.trades?.length ? (
        <>
          <Text style={s.section}>Services offered</Text>
          <View style={s.chipWrap}>{pp.trades.map((t) => <Text key={t} style={s.chip}>{t.replace(/_/g, ' ')}</Text>)}</View>
        </>
      ) : null}

      <Pressable style={s.logout} onPress={logout}>
        <Text style={s.logoutText}>Sign out</Text>
      </Pressable>
      <Text style={s.version}>A-1 Renovations · {API_BASE}</Text>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 22, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  name: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 12 },
  role: { fontSize: 13, color: '#64748b', marginTop: 2 },
  section: { fontSize: 13, fontWeight: '800', color: '#475569', marginTop: 22, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  list: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ecfeff', color: '#0f766e', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  logout: { borderWidth: 1, borderColor: '#fecaca', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 16 },
});
