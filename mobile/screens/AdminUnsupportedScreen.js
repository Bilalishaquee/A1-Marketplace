import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AdminUnsupportedScreen() {
  const { logout } = useAuth();
  return <View style={s.screen}><Text style={s.h1}>Admin is web-only</Text><Text style={s.body}>Use the A-1 Renovations web admin panel to manage users, projects, pricing, and model training.</Text><Pressable style={s.button} onPress={logout}><Text style={s.buttonText}>Sign out</Text></Pressable></View>;
}
const s = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' }, h1: { fontSize: 24, fontWeight: '800', color: '#0f172a' }, body: { color: '#64748b', lineHeight: 21, marginTop: 10 }, button: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 24 }, buttonText: { color: '#fff', fontWeight: '800' } });
