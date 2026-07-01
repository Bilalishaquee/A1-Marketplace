// A-1 Renovations — AI estimate flow (Expo / React Native, marketplace model).
//   describe (+ keyboard dictation) + photos + device location
//   → AI scope of work + Low/Med/High range + duration/permits/trades
//   → Post for nearby providers.

import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, Image, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { runEstimation, getDeviceLocation, postProject, transcribeAudio, API_BASE } from '../lib/api';

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();

export default function QuoteFlow() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [locOn, setLocOn] = useState(false);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [refObject, setRefObject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageMsg, setStageMsg] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [posted, setPosted] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;
    getDeviceLocation().then((l) => { if (alive && l) { setLocation(l); setLocOn(true); } });
    return () => { alive = false; };
  }, []);

  const addPhoto = async (useCamera) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('Permission is needed to add a photo.'); return; }
      const res = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ['images'] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ['images'] });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const maxSide = Math.max(a.width || 0, a.height || 0);
        const context = ImageManipulator.manipulate(a.uri);
        if (maxSide > 1800) {
          if ((a.width || 0) >= (a.height || 0)) context.resize({ width: 1800, height: null });
          else context.resize({ width: null, height: 1800 });
        }
        const normalized = await (await context.renderAsync()).saveAsync({ compress: 0.78, format: SaveFormat.JPEG });
        const file = new File(normalized.uri);
        setError('');
        setFiles((p) => [...p, {
          uri: normalized.uri, width: normalized.width, height: normalized.height,
          fileSize: file.size ?? undefined, mimeType: 'image/jpeg',
        }].slice(0, 8));
      }
    } catch { setError('Could not open the camera/gallery.'); }
  };
  const removePhoto = (uri) => setFiles((f) => f.filter((x) => x.uri !== uri));

  // ── Voice dictation: record audio → transcribe on the server → append text ──
  const [recState, setRecState] = useState('idle'); // idle | recording | transcribing

  const startRec = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { setError('Microphone permission is needed to dictate.'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setError('');
      setRecState('recording');
    } catch {
      setRecState('idle');
      setError('Could not start recording — check microphone access.');
    }
  };

  const stopRecAndTranscribe = async () => {
    if (!recorder) { setRecState('idle'); return; }
    setRecState('transcribing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('The recording could not be saved.');
      const mimeType = uri.toLowerCase().endsWith('.m4a') ? 'audio/mp4' : 'audio/m4a';
      const text = await transcribeAudio(uri, mimeType);
      if (text) setDesc((d) => (d ? d.trim() + ' ' : '') + text.trim());
      setRecState('idle');
    } catch (e) {
      setRecState('idle');
      setError(e.message || 'Could not transcribe your voice — please try again or type.');
    } finally { setAudioModeAsync({ allowsRecording: false }).catch(() => {}); }
  };

  const toggleMic = () => {
    if (recState === 'recording') stopRecAndTranscribe();
    else if (recState === 'idle') startRec();
  };

  const canSubmit = desc.trim().length >= 8 || files.length > 0;

  const runAI = async () => {
    if (!canSubmit) { setError('Add a short description or a photo so the AI can estimate your project.'); return; }
    setError(''); setLoading(true); setStageMsg('Starting…');
    try {
      const l = parseFloat(length), w = parseFloat(width);
      const measuredAreaSqft = l > 0 && w > 0 ? Math.round(l * w) : undefined;
      const quote = await runEstimation(
        { files, description: desc, location, measuredAreaSqft, referenceObject: refObject },
        { onStage: (m) => setStageMsg(m) },
      );
      setResult(quote);
      setPosted(quote.status === 'posted');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not generate the estimate. Please try again.');
    }
  };

  const post = async () => {
    if (!result) return;
    setPosting(true);
    try { await postProject(result.id); setPosted(true); }
    catch (e) { setError(e.message || 'Could not post the project.'); }
    finally { setPosting(false); }
  };

  const reset = () => { setResult(null); setFiles([]); setDesc(''); setError(''); setPosted(false); };

  const s = result?.scopeEstimate;

  // The navigator provides the screen title; keep just a short context subtitle.
  const Header = () => (
    <View style={st.header}>
      <Text style={st.brandSub}>{result ? 'Your scope & price range' : 'Describe your project — the AI does the rest'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={st.screen}>
        <Header />
        <View style={st.loadingWrap}>
          <ActivityIndicator size="large" color="#0ea5a4" />
          <Text style={st.loadingTitle}>Analyzing your project…</Text>
          <Text style={st.loadingMsg}>{stageMsg}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={st.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <Header />

      {/* Form */}
      {!result && (
        <View style={st.body}>
          <Text style={st.h1}>What do you need done?</Text>
          <Text style={st.muted}>Describe it — type or tap the mic to dictate — and add photos. The AI does the rest.</Text>

          <View style={st.textareaWrap}>
            <TextInput
              value={desc} onChangeText={setDesc} multiline numberOfLines={5}
              placeholder="e.g. Replace my tub with a walk-in shower, new tile floor and vanity. Bathroom is about 60 sq ft and dated."
              placeholderTextColor="#94a3b8"
              style={[st.input, st.textarea]}
            />
            <Pressable
              onPress={toggleMic}
              disabled={recState === 'transcribing'}
              style={[st.micBtn, recState === 'recording' && st.micBtnRec]}
            >
              {recState === 'transcribing'
                ? <ActivityIndicator size="small" color="#0ea5a4" />
                : <Text style={st.micIcon}>{recState === 'recording' ? '■' : '🎤'}</Text>}
            </Pressable>
          </View>
          {recState === 'recording' && <Text style={st.micRecHint}>● Recording… tap ■ to stop & transcribe</Text>}
          {recState === 'transcribing' && <Text style={st.micHint}>Transcribing your voice…</Text>}

          <Text style={st.fieldLabel}>Photos (optional)</Text>
          <View style={st.photoBtnRow}>
            <Pressable onPress={() => addPhoto(true)} style={st.photoBtn}><Text style={st.photoBtnText}>📷 Camera</Text></Pressable>
            <Pressable onPress={() => addPhoto(false)} style={st.photoBtn}><Text style={st.photoBtnText}>🖼️ Gallery</Text></Pressable>
          </View>
          {files.length > 0 && (
            <View style={st.thumbGrid}>
              {files.map((f) => (
                <Pressable key={f.uri} onPress={() => removePhoto(f.uri)} style={st.photoThumbWrap}>
                  <Image source={{ uri: f.uri }} style={st.photoThumb} />
                  <View style={st.removeBadge}><Text style={st.removeBadgeText}>✕</Text></View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Optional accuracy aids */}
          <View style={st.accBox}>
            <Text style={st.accTitle}>Improve accuracy (optional)</Text>
            <Text style={st.accHint}>Dimensions or a reference object give a tighter estimate.</Text>
            <View style={st.dimRow}>
              <TextInput style={[st.input, st.dimInput]} value={length} onChangeText={setLength} placeholder="Length ft" placeholderTextColor="#94a3b8" keyboardType="numeric" />
              <Text style={st.times}>×</Text>
              <TextInput style={[st.input, st.dimInput]} value={width} onChangeText={setWidth} placeholder="Width ft" placeholderTextColor="#94a3b8" keyboardType="numeric" />
              {parseFloat(length) > 0 && parseFloat(width) > 0 && (
                <Text style={st.areaCalc}>{Math.round(parseFloat(length) * parseFloat(width))} ft²</Text>
              )}
            </View>
            <Pressable style={st.refRow} onPress={() => setRefObject((v) => !v)}>
              <View style={[st.checkbox, refObject && st.checkboxOn]}>{refObject ? <Text style={st.tick}>✓</Text> : null}</View>
              <Text style={st.refText}>📏 A credit card/paper is in one photo for scale</Text>
            </Pressable>
          </View>

          <Text style={st.locText}>📍 {locOn ? `${location?.region || 'Location on'} · matches nearby pros` : 'Location off — estimate still works'}</Text>

          {error ? <Text style={st.errorBox}>{error}</Text> : null}

          <Pressable disabled={!canSubmit} onPress={runAI} style={[st.primaryBtn, !canSubmit && st.btnDisabled]}>
            <Text style={st.primaryBtnText}>✨ Get AI Estimate</Text>
          </Pressable>
        </View>
      )}

      {/* Result */}
      {result && s && (
        <View style={st.body}>
          <View style={st.rangeCard}>
            <Text style={st.rangeLabel}>{s.categoryLabel}</Text>
            <Text style={st.rangeValue}>{money(s.priceLow)} – {money(s.priceHigh)}</Text>
            <Text style={st.rangeMeta}>typical {money(s.priceMed)} · {s.estimatedDuration.minDays}–{s.estimatedDuration.maxDays} days · {Math.round((s.confidence || 0) * 100)}% confidence</Text>
          </View>

          <View style={st.lmhRow}>
            {[['Budget', s.priceLow], ['Typical', s.priceMed], ['Premium', s.priceHigh]].map(([l, v], i) => (
              <View key={l} style={[st.lmhCard, i === 1 && st.lmhCardActive]}>
                <Text style={st.lmhLabel}>{l}</Text><Text style={st.lmhVal}>{money(v)}</Text>
              </View>
            ))}
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>Scope of work</Text>
            {s.scopeOfWork.map((t, i) => (
              <View key={i} style={st.scopeRow}>
                <Text style={st.scopeBullet}>✓</Text>
                <Text style={st.scopeText}><Text style={st.scopeStrong}>{t.title}</Text>{t.detail ? ` — ${t.detail}` : ''}</Text>
              </View>
            ))}
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>Suggested pros</Text>
            <View style={st.chipWrap}>{s.suggestedTrades.map((t) => <Text key={t} style={st.chip}>{t}</Text>)}</View>
            {s.permitsRequired.length > 0 && (
              <>
                <Text style={[st.cardTitle, { marginTop: 12 }]}>Permits likely</Text>
                <Text style={st.permitText}>{s.permitsRequired.join(' · ')}</Text>
              </>
            )}
          </View>

          <View style={st.framingBox}><Text style={st.framingText}>{s.framing}</Text></View>

          {posted ? (
            <View style={st.postedBox}><Text style={st.postedText}>✓ Posted! Nearby pros can now send you quotes.</Text></View>
          ) : (
            <Pressable onPress={post} disabled={posting} style={[st.primaryBtn, posting && st.btnDisabled]}>
              {posting ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryBtnText}>Post my project</Text>}
            </Pressable>
          )}
          {error ? <Text style={st.errorBox}>{error}</Text> : null}
          <Pressable onPress={reset} style={st.linkBtn}><Text style={st.linkText}>Start a New Estimate</Text></Pressable>
        </View>
      )}

      <Text style={st.apiNote}>Engine: {API_BASE}</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  brand: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  brandSub: { fontSize: 11, color: '#94a3b8' },
  body: { padding: 16 },
  h1: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  muted: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a' },
  textarea: { height: 120, textAlignVertical: 'top', paddingRight: 52 },
  textareaWrap: { position: 'relative' },
  micBtn: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  micBtnRec: { backgroundColor: '#ef4444' },
  micIcon: { fontSize: 16 },
  micRecHint: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 6 },
  micHint: { fontSize: 11, color: '#0ea5a4', fontWeight: '600', marginTop: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 16, marginBottom: 8 },
  photoBtnRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', backgroundColor: '#fff' },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: '#0f766e' },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoThumbWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  photoThumb: { width: '100%', height: '100%' },
  removeBadge: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  removeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  locText: { fontSize: 12, color: '#64748b', marginTop: 14 },
  accBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#f8fafc', padding: 12, marginTop: 16 },
  accTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
  accHint: { fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 10 },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimInput: { flex: 1, paddingVertical: 9, backgroundColor: '#fff' },
  times: { color: '#94a3b8', fontSize: 14 },
  areaCalc: { fontSize: 11, fontWeight: '700', color: '#0f766e' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#0ea5a4', borderColor: '#0ea5a4' },
  tick: { color: '#fff', fontSize: 12, fontWeight: '800' },
  refText: { flex: 1, fontSize: 12, color: '#475569' },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginTop: 14, color: '#b91c1c', fontSize: 12 },
  primaryBtn: { backgroundColor: '#0ea5a4', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  linkBtn: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 320 },
  loadingTitle: { fontWeight: '800', color: '#0f172a', fontSize: 16, marginTop: 16 },
  loadingMsg: { fontSize: 12, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  rangeCard: { backgroundColor: '#0f766e', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 14 },
  rangeLabel: { color: '#99f6e4', fontSize: 12 },
  rangeValue: { color: '#fff', fontWeight: '800', fontSize: 26, marginTop: 4 },
  rangeMeta: { color: '#99f6e4', fontSize: 11, marginTop: 8, textAlign: 'center' },
  lmhRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  lmhCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, alignItems: 'center' },
  lmhCardActive: { borderColor: '#0ea5a4', borderWidth: 2 },
  lmhLabel: { fontSize: 10, color: '#94a3b8' },
  lmhVal: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scopeBullet: { color: '#0ea5a4', fontWeight: '800', fontSize: 13 },
  scopeText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  scopeStrong: { color: '#1e293b', fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { fontSize: 11, backgroundColor: '#ecfeff', color: '#0f766e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  permitText: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  framingBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14, marginBottom: 8 },
  framingText: { fontSize: 11, color: '#92400e', lineHeight: 16 },
  postedBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, padding: 14, marginTop: 20, alignItems: 'center' },
  postedText: { color: '#15803d', fontWeight: '700', fontSize: 13 },
  apiNote: { textAlign: 'center', fontSize: 10, color: '#cbd5e1', marginTop: 16 },
});
