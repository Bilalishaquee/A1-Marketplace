import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myBids, dollars } from '../lib/api';
import { Loading, Empty, StatusPill } from '../components/ui';

export default function ProviderBidsScreen() {
  const [bids, setBids] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [detailId, setDetailId] = useState(null);
  const load = useCallback(() => { myBids().then(setBids).catch(() => setBids([])); }, []);
  useFocusEffect(load);
  const onRefresh = () => { setRefreshing(true); myBids().then(setBids).catch(() => setBids([])).finally(() => setRefreshing(false)); };

  const list = (bids || []).filter((bid) => filter === 'ALL' || bid.status === filter);
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.h1}>My Quotes</Text>
      <View style={s.filters}>{['ALL', 'PENDING', 'ACCEPTED', 'DECLINED'].map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[s.filter, filter === value && s.filterOn]}><Text style={[s.filterText, filter === value && s.filterTextOn]}>{value === 'ALL' ? 'All' : value[0] + value.slice(1).toLowerCase()}</Text></Pressable>)}</View>
      {bids === null ? <Loading />
        : list.length === 0 ? <Empty title="No bids yet" hint="Submit a quote from the Jobs tab." />
        : list.map((b) => (
          <Pressable key={b.id} style={s.card} onPress={() => setDetailId(detailId === b.id ? null : b.id)}>
            <View style={s.row}>
              <Text style={s.title}>{b.project?.scopeEstimate?.categoryLabel || b.project?.categoryKey || 'Project'}</Text>
              <StatusPill status={b.status} />
            </View>
            <Text style={s.amt}>{dollars(b.amount)}{b.estimatedDurationDays ? ` · ${b.estimatedDurationDays} days` : ''}</Text>
            {!!b.message && <Text style={s.msg}>{b.message}</Text>}
            {detailId === b.id && <View style={s.detail}><Text style={s.detailText}>Location: {b.project?.location?.region || 'Unavailable'}</Text><Text style={s.detailText}>Duration: {b.estimatedDurationDays ? `${b.estimatedDurationDays} days` : 'Not specified'}</Text><Text style={s.detailText}>{b.siteVisitRequested ? 'Site visit requested' : 'No site visit requested'}</Text></View>}
          </Pressable>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  filters: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 11, padding: 3, marginBottom: 14 },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9 }, filterOn: { backgroundColor: '#fff' },
  filterText: { color: '#64748b', fontSize: 10, fontWeight: '700' }, filterTextOn: { color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  amt: { fontSize: 14, fontWeight: '700', color: '#0f766e', marginTop: 6 },
  msg: { fontSize: 13, color: '#64748b', marginTop: 4 },
  detail: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 10, paddingTop: 8, gap: 3 }, detailText: { color: '#64748b', fontSize: 12 },
});
