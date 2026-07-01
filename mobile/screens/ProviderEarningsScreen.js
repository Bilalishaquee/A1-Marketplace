import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myBids, dollars } from '../lib/api';
import { summarizeBids } from '../lib/format';
import { Loading, Empty } from '../components/ui';

export default function ProviderEarningsScreen() {
  const [bids, setBids] = useState(null); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => myBids().then(setBids).catch(() => setBids([])), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = () => { setRefreshing(true); load().finally(() => setRefreshing(false)); };
  if (!bids) return <Loading />;
  const { accepted, awardedValue: total } = summarizeBids(bids);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.wrap} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={s.note}><Text style={s.noteText}>These totals are accepted bid values, not tracked payouts or completed payments.</Text></View>
      <View style={s.total}><Text style={s.totalValue}>{dollars(total)}</Text><Text style={s.totalLabel}>Awarded value across {accepted.length} job{accepted.length === 1 ? '' : 's'}</Text></View>
      <Text style={s.section}>Awarded jobs</Text>
      {accepted.length === 0 ? <Empty title="No awarded jobs" hint="Accepted quotes will appear here." /> : accepted.map((bid) => (
        <View key={bid.id} style={s.card}><View style={{ flex: 1 }}><Text style={s.title}>{bid.project?.scopeEstimate?.categoryLabel || bid.project?.categoryKey || 'Project'}</Text><Text style={s.meta}>{bid.project?.location?.region || 'Location unavailable'}</Text></View><Text style={s.amount}>{dollars(bid.amount)}</Text></View>
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, wrap: { padding: 16, paddingBottom: 40 },
  note: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 14, padding: 13 }, noteText: { color: '#1d4ed8', fontSize: 12, lineHeight: 18 },
  total: { backgroundColor: '#0f766e', borderRadius: 16, padding: 20, marginTop: 14 }, totalValue: { color: '#fff', fontSize: 28, fontWeight: '800' }, totalLabel: { color: '#99f6e4', marginTop: 3 },
  section: { fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 10, color: '#0f172a' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 9 },
  title: { fontWeight: '700', color: '#0f172a' }, meta: { color: '#64748b', fontSize: 11, marginTop: 3 }, amount: { color: '#15803d', fontWeight: '800' },
});
