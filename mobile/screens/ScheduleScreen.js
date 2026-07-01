import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myAppointments, confirmAppointment } from '../lib/api';
import { Loading, Empty, StatusPill } from '../components/ui';

const dateLabel = (value) => new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const timeLabel = (value) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function ScheduleScreen({ navigation }) {
  const [appointments, setAppointments] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setAppointments(await myAppointments()); setError(''); }
    catch (e) { setAppointments([]); setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = () => { setRefreshing(true); load().finally(() => setRefreshing(false)); };
  const confirm = async (id) => {
    setBusyId(id);
    try { await confirmAppointment(id); await load(); }
    catch (e) { Alert.alert('Could not confirm', e.message); }
    finally { setBusyId(null); }
  };
  if (appointments === null) return <Loading />;
  const sorted = [...appointments].sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.wrap} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Pressable style={s.create} onPress={() => navigation.navigate('AppointmentForm')}><Text style={s.createText}>Request an appointment</Text></Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Text style={s.section}>Upcoming appointments</Text>
      {sorted.length === 0 ? <Empty title="No appointments" hint="After a bid is accepted, request a project appointment here." /> : sorted.map((appointment) => (
        <View key={appointment.id} style={s.card}>
          <View style={s.row}><Text style={s.title}>{appointment.projectCategory || 'Project appointment'}</Text><StatusPill status={appointment.status} /></View>
          <Text style={s.when}>{dateLabel(appointment.scheduledFor)} · {timeLabel(appointment.scheduledFor)}</Text>
          {appointment.notes ? <Text style={s.notes}>{appointment.notes}</Text> : null}
          {appointment.status === 'REQUESTED' ? (
            <Pressable style={s.confirm} disabled={busyId === appointment.id} onPress={() => confirm(appointment.id)}>
              {busyId === appointment.id ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmText}>Confirm appointment</Text>}
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, wrap: { padding: 16, paddingBottom: 40 },
  create: { backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, createText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { flex: 1, marginRight: 8, fontWeight: '800', color: '#0f172a' },
  when: { color: '#0f766e', fontSize: 13, fontWeight: '700', marginTop: 8 }, notes: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 5 },
  confirm: { backgroundColor: '#0f172a', borderRadius: 11, paddingVertical: 11, alignItems: 'center', marginTop: 12 }, confirmText: { color: '#fff', fontWeight: '700' },
  error: { color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginTop: 12 },
});
