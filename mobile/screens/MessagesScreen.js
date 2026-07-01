import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myThreads } from '../lib/api';
import { Loading, Empty, ErrorState } from '../components/ui';

export default function MessagesScreen({ navigation }) {
  const [threads, setThreads] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => { myThreads().then((items) => { setThreads(items); setError(''); }).catch((e) => { setThreads([]); setError(e.message); }); }, []);
  useFocusEffect(load);
  const onRefresh = () => { setRefreshing(true); myThreads().then(setThreads).catch(() => setThreads([])).finally(() => setRefreshing(false)); };

  const list = threads || [];
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.h1}>Messages</Text>
      {threads === null ? <Loading />
        : error ? <ErrorState message={error} onRetry={load} />
        : list.length === 0 ? <Empty title="No messages yet" hint="Conversations appear after a bid is accepted." />
        : list.map((t) => (
          <Pressable key={t.id} style={s.row} onPress={() => navigation.navigate('Chat', { threadId: t.id, title: t.otherParty?.name || 'Conversation' })}>
            <View style={s.avatar}><Text style={s.avatarText}>{(t.otherParty?.name || '?').slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{t.otherParty?.name || 'Conversation'}</Text>
              <Text style={s.preview} numberOfLines={1}>{t.lastMessage?.body || 'No messages yet'}</Text>
            </View>
          </Pressable>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0ea5a4', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  preview: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
