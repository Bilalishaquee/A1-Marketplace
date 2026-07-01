import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { providerFeed, placeBid, dollars } from '../lib/api';
import { Loading, Empty } from '../components/ui';

export default function ProviderJobsScreen() {
  const [jobs, setJobs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [note, setNote] = useState('');
  const [siteVisitRequested, setSiteVisitRequested] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { providerFeed().then(setJobs).catch(() => setJobs([])); }, []);
  useFocusEffect(load);
  const onRefresh = () => { setRefreshing(true); providerFeed().then(setJobs).catch(() => setJobs([])).finally(() => setRefreshing(false)); };

  const openForm = (id) => { setOpenId(id); setAmount(''); setDays(''); setNote(''); setSiteVisitRequested(false); };

  const submit = async (id) => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) { Alert.alert('Enter a bid amount'); return; }
    setBusy(true);
    try {
      await placeBid(id, {
        amountCents: cents,
        message: note || undefined,
        estimatedDurationDays: days ? parseInt(days, 10) : undefined,
        siteVisitRequested,
      });
      setOpenId(null);
      Alert.alert('Bid submitted', 'The homeowner will see your quote.');
      load();
    } catch (e) { Alert.alert('Could not submit bid', e.message); } finally { setBusy(false); }
  };

  const list = jobs || [];
  const locationLabel = (l) => {
    if (!l) return '';
    if (l.city && l.state) return `${l.city}, ${l.state}`;
    return l.region || l.city || l.zip || '';
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.h1}>Available Jobs</Text>
      {jobs === null ? <Loading />
        : list.length === 0 ? <Empty title="No jobs nearby yet" hint="New posted projects in your trades and area will appear here." />
        : list.map((p) => (
          <View key={p.id} style={s.card}>
            <Text style={s.title}>{p.scopeEstimate?.categoryLabel || p.categoryKey || 'Project'}</Text>
            <Text style={s.client}>{p.client?.firstName ? `Posted by ${p.client.firstName}` : 'Open project'}</Text>
            <Text style={s.meta}>
              {p.scopeEstimate ? `Est. ${dollars(p.scopeEstimate.priceLow)} – ${dollars(p.scopeEstimate.priceHigh)}` : 'No estimate'}
              {locationLabel(p.location) ? ` · ${locationLabel(p.location)}` : ''}{p.distanceMiles != null ? ` · ${p.distanceMiles} mi` : ''}
            </Text>
            {!!p.description && <Text style={s.desc} numberOfLines={3}>{p.description}</Text>}
            <Text style={s.bids}>{p.bidCount ?? 0} bid{(p.bidCount ?? 0) === 1 ? '' : 's'} so far</Text>

            {openId === p.id ? (
              <View style={s.form}>
                <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="Preliminary bid ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" />
                <TextInput style={s.input} value={days} onChangeText={setDays} placeholder="Est. days (optional)" placeholderTextColor="#94a3b8" keyboardType="numeric" />
                <TextInput style={[s.input, { height: 64 }]} value={note} onChangeText={setNote} placeholder="Message (optional)" placeholderTextColor="#94a3b8" multiline />
                <Pressable
                  style={[s.visitToggle, siteVisitRequested && s.visitToggleOn]}
                  onPress={() => setSiteVisitRequested((v) => !v)}
                >
                  <View style={[s.checkbox, siteVisitRequested && s.checkboxOn]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitTitle}>Request a site visit</Text>
                    <Text style={s.visitHint}>Use this before confirming the final budget.</Text>
                  </View>
                </Pressable>
                <View style={s.formRow}>
                  <Pressable style={s.cancel} onPress={() => setOpenId(null)}><Text style={s.cancelText}>Cancel</Text></Pressable>
                  <Pressable style={[s.submit, busy && s.dim]} disabled={busy} onPress={() => submit(p.id)}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit bid</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={s.bidBtn} onPress={() => openForm(p.id)}><Text style={s.bidBtnText}>Place a bid</Text></Pressable>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  client: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '700' },
  meta: { fontSize: 12, color: '#0f766e', marginTop: 4, fontWeight: '600' },
  desc: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },
  bids: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  bidBtn: { backgroundColor: '#0ea5a4', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  bidBtnText: { color: '#fff', fontWeight: '700' },
  form: { marginTop: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  visitToggle: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  visitToggleOn: { borderColor: '#5eead4', backgroundColor: '#f0fdfa' },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 1 },
  checkboxOn: { backgroundColor: '#0ea5a4', borderColor: '#0ea5a4' },
  visitTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  visitHint: { fontSize: 11, color: '#64748b', marginTop: 2 },
  formRow: { flexDirection: 'row', gap: 8 },
  cancel: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '600' },
  submit: { flex: 1, backgroundColor: '#0ea5a4', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
  dim: { opacity: 0.5 },
});
