import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { myProjects, dollars } from '../lib/api';
import { Loading, Empty, ErrorState, StatusPill } from '../components/ui';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => { myProjects().then((items) => { setProjects(items); setError(''); }).catch((e) => { setProjects([]); setError(e.message); }); }, []);
  useFocusEffect(load);
  const onRefresh = () => { setRefreshing(true); myProjects().then(setProjects).catch(() => setProjects([])).finally(() => setRefreshing(false)); };

  const list = projects || [];
  const active = list.filter((p) => ['POSTED', 'MATCHED', 'SCHEDULED', 'IN_PROGRESS'].includes(p.status)).length;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.hi}>Hello, {user?.name?.split(' ')[0] || 'there'}</Text>
      <Text style={s.sub}>{list.length === 0 ? 'Start by getting a free AI quote.' : `${active} active project${active === 1 ? '' : 's'}.`}</Text>

      <Pressable style={s.cta} onPress={() => navigation.navigate('Quote')}>
        <Text style={s.ctaText}>✨ Get an AI Quote</Text>
      </Pressable>

      <Text style={s.section}>My projects</Text>
      {projects === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : list.length === 0 ? <Empty title="No projects yet" hint="Tap “Get an AI Quote” to start your first project." />
        : list.slice(0, 8).map((p) => (
          <Pressable key={p.id} style={s.card} onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}>
            <View style={s.cardTop}>
              <Text style={s.cardTitle}>{p.scopeEstimate?.categoryLabel || p.categoryKey || 'Project'}</Text>
              <StatusPill status={p.status} />
            </View>
            <Text style={s.cardMeta}>
              {p.scopeEstimate ? `${dollars(p.scopeEstimate.priceLow)} – ${dollars(p.scopeEstimate.priceHigh)}` : 'Estimate pending'} · {p.bidCount ?? 0} bid{(p.bidCount ?? 0) === 1 ? '' : 's'}
            </Text>
          </Pressable>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  hi: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  cta: { backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
});
