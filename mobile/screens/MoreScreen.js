import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function MoreScreen({ navigation }) {
  const { user } = useAuth();
  const provider = user?.role === 'provider';
  const rows = [
    ['Schedule', 'View and confirm appointments', 'Schedule'],
    ...(provider ? [['Awarded Value', 'Review accepted bid totals', 'ProviderEarnings']] : []),
    ['Profile', 'Account and provider information', 'Profile'],
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.wrap}>
      <Text style={s.h1}>More</Text>
      <Text style={s.sub}>{provider ? 'Provider tools and account' : 'Appointments and account'}</Text>
      <View style={s.list}>
        {rows.map(([title, hint, route]) => (
          <Pressable key={route} style={s.row} onPress={() => navigation.navigate(route)}>
            <View style={{ flex: 1 }}><Text style={s.title}>{title}</Text><Text style={s.hint}>{hint}</Text></View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, wrap: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' }, sub: { color: '#64748b', marginTop: 3, marginBottom: 16 },
  list: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' }, hint: { color: '#64748b', fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 28, color: '#94a3b8' },
});
