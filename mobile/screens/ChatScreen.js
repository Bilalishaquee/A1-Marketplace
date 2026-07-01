import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, AppState } from 'react-native';
import { threadMessages, sendMessage } from '../lib/api';
import { Loading } from '../components/ui';

export default function ChatScreen({ route }) {
  const { threadId } = route.params;
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const load = () => threadMessages(threadId).then(setMessages).catch(() => setMessages([]));
  useEffect(() => {
    load();
    let timer = setInterval(load, 5000);
    const subscription = AppState.addEventListener('change', (state) => {
      clearInterval(timer);
      if (state === 'active') { load(); timer = setInterval(load, 5000); }
    });
    return () => { clearInterval(timer); subscription.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText(''); setSending(true);
    try {
      const msg = await sendMessage(threadId, body);
      setMessages((m) => [...(m || []), msg]);
      setError('');
    } catch (e) { setText(body); setError(e.message || 'Message was not sent.'); } finally { setSending(false); }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      {messages === null ? <Loading /> : (
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 && <Text style={s.empty}>No messages yet. Say hello 👋</Text>}
          {messages.map((m) => (
            <View key={m.id} style={[s.bubbleRow, m.mine ? s.right : s.left]}>
              <View style={[s.bubble, m.mine ? s.mine : s.theirs]}>
                <Text style={m.mine ? s.mineText : s.theirsText}>{m.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.inputRow}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Type a message…" placeholderTextColor="#94a3b8" />
        <Pressable style={[s.send, (!text.trim() || sending) && s.dim]} disabled={!text.trim() || sending} onPress={send}>
          <Text style={s.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 30 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  left: { justifyContent: 'flex-start' }, right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  mine: { backgroundColor: '#0ea5a4', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  mineText: { color: '#fff', fontSize: 14 }, theirsText: { color: '#1e293b', fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  send: { backgroundColor: '#0ea5a4', borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center' },
  dim: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
  error: { color: '#b91c1c', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 7, fontSize: 12 },
});
