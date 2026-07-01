import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myProjects, dollars } from '../lib/api';
import { Loading, Empty, ErrorState, StatusPill } from '../components/ui';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => { myProjects().then((items) => { setProjects(items); setError(''); }).catch((e) => { setProjects([]); setError(e.message); }); }, []);
  useFocusEffect(load);
  const onRefresh = () => { setRefreshing(true); myProjects().then(setProjects).catch(() => setProjects([])).finally(() => setRefreshing(false)); };

  const list = projects || [];
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.h1}>My Projects</Text>
      {projects === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : list.length === 0 ? <Empty title="No projects yet" hint="Create one from the Quote tab." />
        : list.map((p) => (
          <Pressable key={p.id} style={s.card} onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}>
            <View style={s.cardTop}>
              <Text style={s.cardTitle}>{p.scopeEstimate?.categoryLabel || p.categoryKey || 'Project'}</Text>
              <StatusPill status={p.status} />
            </View>
            {!!p.description && <Text style={s.desc} numberOfLines={2}>{p.description}</Text>}
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
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  desc: { fontSize: 12, color: '#64748b', marginTop: 6 },
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
});
