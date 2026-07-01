import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Platform, Alert, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { myProjects, myBids, createAppointment } from '../lib/api';
import { eligibleClientProjects, eligibleProviderProjects } from '../lib/format';

export default function AppointmentFormScreen({ navigation }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [picker, setPicker] = useState(null);
  const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');

  useEffect(() => {
    const request = user?.role === 'provider'
      ? myBids().then(eligibleProviderProjects)
      : myProjects().then(eligibleClientProjects);
    request.then((items) => { setProjects(items); if (items[0]) setProjectId(items[0].id); }).catch((e) => { setProjects([]); setError(e.message); });
  }, [user?.role]);

  const changeDate = (_, selected) => {
    if (Platform.OS === 'android') setPicker(null);
    if (selected) setDate(selected);
  };
  const submit = async () => {
    if (!projectId) { setError('Select a matched project first.'); return; }
    if (date <= new Date()) { setError('Choose a future appointment time.'); return; }
    setBusy(true); setError('');
    try {
      await createAppointment({ projectId, scheduledFor: date.toISOString(), notes: notes.trim() || undefined });
      Alert.alert('Appointment requested', 'The other party can now confirm this appointment.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>Matched project</Text>
      {projects === null ? <ActivityIndicator color="#0ea5a4" /> : projects.length === 0 ? <Text style={s.empty}>No matched projects are eligible yet. A homeowner must accept a bid first.</Text> : projects.map((project) => (
        <Pressable key={project.id} onPress={() => setProjectId(project.id)} style={[s.project, projectId === project.id && s.projectOn]}>
          <Text style={[s.projectTitle, projectId === project.id && s.projectTitleOn]}>{project.scopeEstimate?.categoryLabel || project.categoryKey || 'Project'}</Text>
          <Text style={s.projectMeta}>{project.location?.region || project.status}</Text>
        </Pressable>
      ))}
      <Text style={s.label}>Date and time</Text>
      <View style={s.dateRow}>
        <Pressable style={s.dateButton} onPress={() => setPicker('date')}><Text style={s.dateText}>{date.toLocaleDateString()}</Text></Pressable>
        <Pressable style={s.dateButton} onPress={() => setPicker('time')}><Text style={s.dateText}>{date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></Pressable>
      </View>
      {picker ? <DateTimePicker value={date} mode={picker} minimumDate={new Date()} onChange={changeDate} /> : null}
      <Text style={s.label}>Notes (optional)</Text>
      <TextInput style={s.notes} value={notes} onChangeText={setNotes} maxLength={1000} multiline placeholder="Access details or topics to discuss" placeholderTextColor="#94a3b8" />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable style={[s.submit, (busy || !projectId) && s.dim]} disabled={busy || !projectId} onPress={submit}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Send request</Text>}
      </Pressable>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, wrap: { padding: 16, paddingBottom: 40 }, label: { fontSize: 13, fontWeight: '800', color: '#475569', marginTop: 12, marginBottom: 8 },
  project: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 8 }, projectOn: { borderColor: '#0ea5a4', backgroundColor: '#f0fdfa' },
  projectTitle: { color: '#0f172a', fontWeight: '700' }, projectTitleOn: { color: '#0f766e' }, projectMeta: { color: '#64748b', fontSize: 11, marginTop: 3 },
  dateRow: { flexDirection: 'row', gap: 8 }, dateButton: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', borderRadius: 12, padding: 13, alignItems: 'center' }, dateText: { color: '#0f172a', fontWeight: '700' },
  notes: { minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', borderRadius: 12, padding: 12, color: '#0f172a' },
  submit: { marginTop: 20, backgroundColor: '#0ea5a4', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, submitText: { color: '#fff', fontWeight: '800' }, dim: { opacity: 0.5 },
  error: { color: '#b91c1c', marginTop: 12 }, empty: { color: '#64748b', lineHeight: 19, backgroundColor: '#fff', padding: 14, borderRadius: 12 },
});
