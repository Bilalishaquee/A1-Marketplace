import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getTaxonomy } from '../lib/api';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [trades, setTrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { getTaxonomy().then((d) => setCategories(d.categories || [])).catch(() => {}); }, []);
  const toggleTrade = (k) => setTrades((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) { setError('Enter your name, email, and a password of at least 8 characters.'); return; }
    if (role === 'provider' && !form.businessName.trim()) { setError('Enter your business name.'); return; }
    setError(''); setBusy(true);
    try {
      await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password, role,
        ...(role === 'provider' ? { businessName: form.businessName.trim(), trades } : {}),
      });
    } catch (e) { setError(e.message || 'Could not create your account.'); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>A-1 Renovations</Text>
        <Text style={s.h1}>Create account</Text>

        <View style={s.roleRow}>
          {[{ id: 'client', label: '🏠 Homeowner' }, { id: 'provider', label: '🔧 Provider' }].map((r) => (
            <Pressable key={r.id} onPress={() => setRole(r.id)} style={[s.roleBtn, role === r.id && s.roleBtnActive]}>
              <Text style={[s.roleText, role === r.id && s.roleTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Full name</Text>
        <TextInput style={s.input} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Jane Smith" placeholderTextColor="#94a3b8" />

        {role === 'provider' && (
          <>
            <Text style={s.label}>Business name</Text>
            <TextInput style={s.input} value={form.businessName} onChangeText={(v) => set('businessName', v)} placeholder="Smith Renovations LLC" placeholderTextColor="#94a3b8" />
            <Text style={s.label}>Services you offer</Text>
            <View style={s.chipWrap}>
              {categories.map((c) => (
                <Pressable key={c.key} onPress={() => toggleTrade(c.key)} style={[s.chip, trades.includes(c.key) && s.chipActive]}>
                  <Text style={[s.chipText, trades.includes(c.key) && s.chipTextActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} value={form.email} onChangeText={(v) => set('email', v)} placeholder="you@example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} value={form.password} onChangeText={(v) => set('password', v)} placeholder="Min. 8 characters" placeholderTextColor="#94a3b8" secureTextEntry />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Pressable style={[s.btn, busy && s.btnDisabled]} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create account</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={s.linkRow}>
          <Text style={s.linkMuted}>Already have an account? </Text><Text style={s.link}>Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrap: { padding: 24, paddingTop: 70, flexGrow: 1 },
  brand: { fontSize: 16, fontWeight: '800', color: '#0f766e', marginBottom: 18 },
  h1: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  roleBtn: { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  roleBtnActive: { borderColor: '#0ea5a4', backgroundColor: '#ecfeff' },
  roleText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  roleTextActive: { color: '#0f766e' },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#0ea5a4', borderColor: '#0ea5a4' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#fff' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 14 },
  btn: { backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 20 },
  linkMuted: { color: '#64748b', fontSize: 14 },
  link: { color: '#0ea5a4', fontWeight: '700', fontSize: 14 },
});
