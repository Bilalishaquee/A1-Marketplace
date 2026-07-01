import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProject, projectBids, acceptBid, declineBid, askProjectQuestion, postProject, updateProjectBudget, dollars } from '../lib/api';
import { Loading, ErrorState, StatusPill } from '../components/ui';

export default function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [busy, setBusy] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [question, setQuestion] = useState('');
  const [qa, setQa] = useState([]);
  const [qaBusy, setQaBusy] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    getProject(id).then((p) => {
      setLoadError('');
      setProject(p);
      const value = p?.selectedBudget ?? (p?.selectedBudgetCents != null ? p.selectedBudgetCents / 100 : '');
      setBudgetAmount(value ? String(Math.round(value)) : '');
    }).catch((e) => { setProject(null); setLoadError(e.message); });
    projectBids(id).then(setBids).catch(() => setBids([]));
  }, [id]);
  useFocusEffect(load);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!project) return <Loading />;
  const s2 = project.scopeEstimate;
  const selectedBudget = project.selectedBudget ?? (project.selectedBudgetCents != null ? project.selectedBudgetCents / 100 : null);

  const accept = async (bidId) => {
    setBusy(true);
    try {
      const { threadId } = await acceptBid(bidId);
      load();
      if (threadId) navigation.navigate('Chat', { threadId, title: 'Provider' });
    } catch (e) { Alert.alert('Could not accept', e.message); } finally { setBusy(false); }
  };

  const post = async () => {
    setBusy(true);
    try { await postProject(id); load(); } catch (e) { Alert.alert('Could not post', e.message); } finally { setBusy(false); }
  };

  const saveBudget = async () => {
    setBusy(true);
    try {
      const cents = budgetAmount === '' ? null : Math.max(0, Math.round(Number(budgetAmount) * 100));
      const updated = await updateProjectBudget(id, cents);
      setProject(updated);
      setBudgetOpen(false);
    } catch (e) { Alert.alert('Could not update budget', e.message); } finally { setBusy(false); }
  };

  const reviewProvider = (b) => {
    const provider = b.provider || {};
    const rating = provider.ratingCount ? `${provider.ratingAvg.toFixed(1)} stars from ${provider.ratingCount} reviews` : 'No reviews yet';
    Alert.alert(
      provider.businessName || provider.name || 'Provider profile',
      `${provider.verified ? 'Verified provider\n' : ''}${rating}${b.message ? `\n\nBid note: ${b.message}` : ''}`,
    );
  };

  const decline = (bidId) => Alert.alert('Decline this bid?', 'The provider will be notified.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Decline', style: 'destructive', onPress: async () => {
      setBusy(true);
      try { await declineBid(bidId); load(); } catch (e) { Alert.alert('Could not decline', e.message); } finally { setBusy(false); }
    } },
  ]);

  const ask = async () => {
    const message = question.trim();
    if (!message || qaBusy) return;
    setQuestion(''); setQa((items) => [...items, { from: 'user', text: message }]); setQaBusy(true);
    try {
      const { answer } = await askProjectQuestion(id, message);
      setQa((items) => [...items, { from: 'ai', text: answer }]);
    } catch (e) { setQa((items) => [...items, { from: 'ai', text: e.message || 'Could not answer right now.' }]); }
    finally { setQaBusy(false); }
  };

  return (
    <ScrollView style={st.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={st.row}>
        <Text style={st.h1}>{s2?.categoryLabel || project.categoryKey || 'Project'}</Text>
        <StatusPill status={project.status} />
      </View>
      {!!project.description && <Text style={st.desc}>{project.description}</Text>}

      {s2 && (
        <View style={st.card}>
          <Text style={st.range}>{dollars(s2.priceLow)} – {dollars(s2.priceHigh)}</Text>
          <Text style={st.meta}>typical {dollars(s2.priceMed)} · {s2.estimatedDuration?.minDays}–{s2.estimatedDuration?.maxDays} days</Text>
          <View style={st.budgetRow}>
            <View>
              <Text style={st.cardTitle}>Selected budget</Text>
              <Text style={st.budgetText}>{selectedBudget != null ? dollars(selectedBudget) : 'Not set yet'}</Text>
            </View>
            <Pressable style={st.smallBtn} onPress={() => setBudgetOpen((v) => !v)}>
              <Text style={st.smallBtnText}>Adjust</Text>
            </Pressable>
          </View>
          {budgetOpen && (
            <View style={st.budgetForm}>
              <TextInput style={[st.input, { flex: 1 }]} value={budgetAmount} onChangeText={setBudgetAmount} placeholder="Budget ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" />
              <Pressable style={[st.saveBtn, busy && st.dim]} disabled={busy} onPress={saveBudget}>
                <Text style={st.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          )}
          {(s2.scopeOfWork || []).length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={st.cardTitle}>Scope of work</Text>
              {s2.scopeOfWork.map((t, i) => <Text key={i} style={st.scope}>• {t.title}</Text>)}
            </View>
          )}
        </View>
      )}

      {project.status === 'ESTIMATED' && (
        <Pressable style={[st.btn, busy && st.dim]} disabled={busy} onPress={post}>
          <Text style={st.btnText}>Post for providers</Text>
        </Pressable>
      )}

      {s2 && (
        <View style={st.card}>
          <Text style={st.cardTitle}>Ask about this estimate</Text>
          <Text style={st.muted}>Ask about scope, assumptions, permits, timing, or budget options.</Text>
          {qa.map((item, index) => <View key={`${item.from}-${index}`} style={[st.qaBubble, item.from === 'user' ? st.qaUser : st.qaAi]}><Text style={item.from === 'user' ? st.qaUserText : st.qaAiText}>{item.text}</Text></View>)}
          <View style={st.qaRow}>
            <TextInput style={[st.input, { flex: 1 }]} value={question} onChangeText={setQuestion} placeholder="Ask a question…" placeholderTextColor="#94a3b8" />
            <Pressable style={[st.saveBtn, (!question.trim() || qaBusy) && st.dim]} disabled={!question.trim() || qaBusy} onPress={ask}><Text style={st.saveBtnText}>{qaBusy ? '…' : 'Ask'}</Text></Pressable>
          </View>
        </View>
      )}

      <Text style={st.section}>Bids ({bids.length})</Text>
      {bids.length === 0 ? <Text style={st.muted}>No bids yet. Providers near you will send quotes once posted.</Text>
        : bids.map((b) => (
          <View key={b.id} style={st.bid}>
            <View style={st.row}>
              <Text style={st.bidName}>{b.provider?.businessName || b.provider?.name || 'Provider'}</Text>
              <StatusPill status={b.status} />
            </View>
            <Text style={st.bidAmt}>{dollars(b.amount)}{b.estimatedDurationDays ? ` · ${b.estimatedDurationDays} days` : ''}</Text>
            {b.siteVisitRequested && <Text style={st.visit}>Site visit requested for accurate budget</Text>}
            {!!b.message && <Text style={st.bidMsg}>{b.message}</Text>}
            {b.status === 'PENDING' && ['POSTED', 'MATCHED'].includes(project.status) && (
              <View>
                <Pressable style={st.profileBtn} onPress={() => reviewProvider(b)}>
                  <Text style={st.profileBtnText}>Review profile first</Text>
                </Pressable>
                <Pressable style={[st.accept, busy && st.dim]} disabled={busy} onPress={() => accept(b.id)}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={st.acceptText}>Accept & message</Text>}
                </Pressable>
                <Pressable style={[st.decline, busy && st.dim]} disabled={busy} onPress={() => decline(b.id)}><Text style={st.declineText}>Decline bid</Text></Pressable>
              </View>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 20, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  desc: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 14 },
  range: { fontSize: 22, fontWeight: '800', color: '#0f766e' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  budgetRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  budgetForm: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  smallBtn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  smallBtnText: { color: '#475569', fontWeight: '800', fontSize: 12 },
  saveBtn: { backgroundColor: '#0ea5a4', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  scope: { fontSize: 13, color: '#475569', marginBottom: 4 },
  btn: { backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  dim: { opacity: 0.5 },
  section: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 24, marginBottom: 10 },
  muted: { fontSize: 13, color: '#94a3b8' },
  bid: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  bidName: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  bidAmt: { fontSize: 14, fontWeight: '700', color: '#0f766e', marginTop: 6 },
  visit: { fontSize: 12, color: '#1d4ed8', backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginTop: 8, fontWeight: '700' },
  bidMsg: { fontSize: 13, color: '#64748b', marginTop: 4 },
  profileBtn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  profileBtnText: { color: '#475569', fontWeight: '800', fontSize: 13 },
  accept: { backgroundColor: '#0ea5a4', borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  decline: { borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  declineText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  qaBubble: { borderRadius: 12, padding: 10, marginTop: 8, maxWidth: '88%' },
  qaUser: { backgroundColor: '#0ea5a4', alignSelf: 'flex-end' }, qaAi: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start' },
  qaUserText: { color: '#fff', fontSize: 13, lineHeight: 18 }, qaAiText: { color: '#334155', fontSize: 13, lineHeight: 18 },
  qaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
