import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setError(''); setBusy(true);
    try { await login(email.trim(), password); } // AuthContext switches the navigator on success
    catch (e) { setError(e.message || 'Could not sign in.'); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>A-1 Renovations</Text>
        <Text style={s.h1}>Sign in</Text>
        <Text style={s.sub}>Welcome back — manage your projects, quotes and messages.</Text>

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com"
          placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Your password"
          placeholderTextColor="#94a3b8" secureTextEntry />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Pressable style={[s.btn, busy && s.btnDisabled]} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={s.linkRow}>
          <Text style={s.linkMuted}>No account? </Text><Text style={s.link}>Create one free</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 24, paddingTop: 80, flexGrow: 1 },
  brand: { fontSize: 16, fontWeight: '800', color: '#0f766e', marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 14 },
  btn: { backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: '#64748b', fontSize: 14 },
  link: { color: '#0ea5a4', fontWeight: '700', fontSize: 14 },
});
