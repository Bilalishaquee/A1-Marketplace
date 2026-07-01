import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { providerFeed, myBids, dollars } from '../lib/api';
import { summarizeBids } from '../lib/format';
import { Loading, Empty, StatusPill } from '../components/ui';

export default function ProviderHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const [jobs, bids] = await Promise.all([providerFeed(), myBids()]);
      setData({ jobs, bids });
    } catch (error) { setData({ jobs: [], bids: [], error: error.message }); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = () => { setRefreshing(true); load().finally(() => setRefreshing(false)); };
  if (!data) return <Loading />;
  const { pending, accepted } = summarizeBids(data.bids);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.wrap} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={s.hero}>
        <Text style={s.welcome}>Welcome back,</Text><Text style={s.name}>{user?.name?.split(' ')[0] || 'Provider'}</Text>
        <View style={s.metrics}>
          {[[data.jobs.length, 'Available'], [pending.length, 'Pending'], [accepted.length, 'Awarded']].map(([value, label]) => (
            <View key={label} style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>
          ))}
        </View>
      </View>
      {data.error ? <Text style={s.error}>{data.error}</Text> : null}
      <View style={s.sectionHead}><Text style={s.section}>Available jobs</Text><Pressable onPress={() => navigation.navigate('Jobs')}><Text style={s.link}>View all</Text></Pressable></View>
      {data.jobs.length === 0 ? <Empty title="No available jobs" hint="New projects matching your services will appear here." /> : data.jobs.slice(0, 3).map((job) => (
        <Pressable key={job.id} style={s.card} onPress={() => navigation.navigate('Jobs')}>
          <Text style={s.cardTitle}>{job.scopeEstimate?.categoryLabel || job.categoryKey || 'Project'}</Text>
          <Text style={s.meta}>{job.scopeEstimate ? `${dollars(job.scopeEstimate.priceLow)} – ${dollars(job.scopeEstimate.priceHigh)}` : 'Estimate unavailable'}</Text>
        </Pressable>
      ))}
      <View style={s.sectionHead}><Text style={s.section}>Recent quotes</Text><Pressable onPress={() => navigation.navigate('Quotes')}><Text style={s.link}>View all</Text></Pressable></View>
      {data.bids.slice(0, 3).map((bid) => <View key={bid.id} style={s.cardRow}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{bid.project?.scopeEstimate?.categoryLabel || bid.project?.categoryKey || 'Project'}</Text><Text style={s.meta}>{dollars(bid.amount)}</Text></View><StatusPill status={bid.status} /></View>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, wrap: { paddingBottom: 40 },
  hero: { backgroundColor: '#0f172a', padding: 18, paddingBottom: 24 }, welcome: { color: '#94a3b8', fontSize: 12 }, name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 18 }, metric: { flex: 1, backgroundColor: '#ffffff14', borderRadius: 12, padding: 10, alignItems: 'center' },
  metricValue: { color: '#5eead4', fontWeight: '800', fontSize: 18 }, metricLabel: { color: '#cbd5e1', fontSize: 10 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: '800', color: '#0f172a' }, link: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  card: { marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14 },
  cardRow: { marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' }, meta: { color: '#64748b', fontSize: 12, marginTop: 3 },
  error: { color: '#b91c1c', margin: 16, padding: 10, backgroundColor: '#fef2f2', borderRadius: 10 },
});
