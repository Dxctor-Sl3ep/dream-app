// app/modal.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function ModalEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [all, setAll] = useState<DreamData[] | null>(null);
  const current = useMemo(() => all?.find((d) => d.id === id) ?? null, [all, id]);

  // Form state
  const [dreamText, setDreamText] = useState('');
  const [isLucidDream, setIsLucidDream] = useState(false);
  const [isNightmare, setIsNightmare] = useState(false);
  const [isNormalDream, setIsNormalDream] = useState(false);
  const [charactersInput, setCharactersInput] = useState('');
  const [location, setLocation] = useState('');
  const [personalMeaning, setPersonalMeaning] = useState('');
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [tone, setTone] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [clarity, setClarity] = useState(5);
  const [emotionBefore, setEmotionBefore] = useState(5);
  const [emotionAfter, setEmotionAfter] = useState(5);
  const [hashtag1, setHashtag1] = useState('');
  const [hashtag2, setHashtag2] = useState('');
  const [hashtag3, setHashtag3] = useState('');
  const [sleepDate, setSleepDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // [ADDED] Exclusivité des 3 types
  const selectType = (type: 'lucid' | 'nightmare' | 'normal') => {
    setIsLucidDream(type === 'lucid');
    setIsNightmare(type === 'nightmare');
    setIsNormalDream(type === 'normal');
  };

  useEffect(() => {
    (async () => {
      const arr: DreamData[] =
        (await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey)) || [];
      setAll(arr);
    })();
  }, []);

  // Hydrate form when current is available
  useEffect(() => {
    if (!current) return;
    setDreamText(current.dreamText);
    setIsLucidDream(current.isLucidDream);
    setIsNightmare(current.isNightmare);
    setIsNormalDream(current.isNormalDream);
    setTone(current.tone ?? null);
    setClarity(current.clarity ?? 5);
    setEmotionBefore(current.emotionBefore ?? 5);
    setEmotionAfter(current.emotionAfter ?? 5);
    setHashtag1(current.hashtags?.hashtag1?.label ?? '');
    setHashtag2(current.hashtags?.hashtag2?.label ?? '');
    setHashtag3(current.hashtags?.hashtag3?.label ?? '');
    setLocation(current.location ?? '');
    setPersonalMeaning(current.personalMeaning ?? '');
    setEmotionalIntensity(current.emotionalIntensity ?? 5);
    setSleepQuality(current.sleepQuality ?? 5);
    setCharactersInput((current.characters ?? []).join(', '));
    setSleepDate(new Date(current.sleepDate));
  }, [current]);

  const save = async () => {
    if (!all || !current) return;
    const idx = all.findIndex((d) => d.id === current.id);
    if (idx < 0) return;

    const updated: DreamData = {
      ...current,
      dreamText,
      isLucidDream,
      isNightmare,
      isNormalDream,
      tone,
      clarity,
      emotionBefore,
      emotionAfter,
      hashtags: {
        hashtag1: { id: current.hashtags?.hashtag1?.id ?? `h1-${current.id}`, label: hashtag1 },
        hashtag2: { id: current.hashtags?.hashtag2?.id ?? `h2-${current.id}`, label: hashtag2 },
        hashtag3: { id: current.hashtags?.hashtag3?.id ?? `h3-${current.id}`, label: hashtag3 },
      },
      characters: charactersInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      location,
      personalMeaning,
      emotionalIntensity,
      sleepQuality,
      sleepDate: sleepDate.toISOString(),
    };

    const next = [...all];
    next[idx] = updated;
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, next);
    router.back();
  };

  const remove = async () => {
    if (!all || !current) return;
    const next = all.filter((d) => d.id !== current.id);
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, next);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* [CHANGED] garder le focus sur champ: keyboardShouldPersistTaps="always" */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <TextInput label="📝 Rêve" value={dreamText} onChangeText={setDreamText} mode="outlined" multiline style={styles.input} />

        <View style={{ marginBottom: 12 }}>
          <Checkbox.Item label="🌙 Rêve lucide" status={isLucidDream ? 'checked' : 'unchecked'} onPress={() => selectType('lucid')} />
          <Checkbox.Item label="😱 Cauchemar" status={isNightmare ? 'checked' : 'unchecked'} onPress={() => selectType('nightmare')} />
          <Checkbox.Item label="💤 Rêve normal" status={isNormalDream ? 'checked' : 'unchecked'} onPress={() => selectType('normal')} />
        </View>

        <TextInput label="🏷️ Hashtag 1" value={hashtag1} onChangeText={setHashtag1} mode="outlined" style={styles.input} />
        <TextInput label="🏷️ Hashtag 2" value={hashtag2} onChangeText={setHashtag2} mode="outlined" style={styles.input} />
        <TextInput label="🏷️ Hashtag 3" value={hashtag3} onChangeText={setHashtag3} mode="outlined" style={styles.input} />

        <View style={{ marginBottom: 12 }}>
          <Checkbox.Item label="😊 Tonalité positive" status={tone === 'positive' ? 'checked' : 'unchecked'} onPress={() => setTone(tone === 'positive' ? null : 'positive')} />
          <Checkbox.Item label="☹️ Tonalité négative" status={tone === 'negative' ? 'checked' : 'unchecked'} onPress={() => setTone(tone === 'negative' ? null : 'negative')} />
          <Checkbox.Item label="😐 Tonalité neutre" status={tone === 'neutral' ? 'checked' : 'unchecked'} onPress={() => setTone(tone === 'neutral' ? null : 'neutral')} />
        </View>

        <TextInput label="👤 Personnages (séparés par des virgules)" value={charactersInput} onChangeText={setCharactersInput} mode="outlined" style={styles.input} />
        <TextInput label="📍 Lieu du rêve" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
        <TextInput label="💭 Signification personnelle" value={personalMeaning} onChangeText={setPersonalMeaning} mode="outlined" multiline style={styles.input} />

        <View style={{ marginBottom: 12 }}>
          <Button mode="outlined" onPress={() => setShowPicker(true)}>
            🕰️ Choisir l’heure du coucher: {format(sleepDate, "dd/MM/yyyy 'à' HH:mm")}
          </Button>
          {showPicker && (
            <DateTimePicker
              value={sleepDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) setSleepDate(selectedDate);
              }}
            />
          )}
        </View>

        <TextInput label="😵 Intensité émotionnelle (0-10)" value={String(emotionalIntensity)} onChangeText={(t) => setEmotionalIntensity(Number(t) || 0)} mode="outlined" keyboardType="numeric" style={styles.input} />
        <TextInput label="🛌 Qualité du sommeil (0-10)" value={String(sleepQuality)} onChangeText={(t) => setSleepQuality(Number(t) || 0)} mode="outlined" keyboardType="numeric" style={styles.input} />
        <TextInput label="🔎 Clarté (0-10)" value={String(clarity)} onChangeText={(t) => setClarity(Number(t) || 0)} mode="outlined" keyboardType="numeric" style={styles.input} />
        <TextInput label="⬅️ Émotion avant (0-10)" value={String(emotionBefore)} onChangeText={(t) => setEmotionBefore(Number(t) || 0)} mode="outlined" keyboardType="numeric" style={styles.input} />
        <TextInput label="➡️ Émotion après (0-10)" value={String(emotionAfter)} onChangeText={(t) => setEmotionAfter(Number(t) || 0)} mode="outlined" keyboardType="numeric" style={styles.input} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button mode="outlined" onPress={() => router.back()}>Annuler</Button>
          <Button mode="contained" onPress={save}>Enregistrer</Button>
          <Button mode="contained" onPress={remove}>Supprimer</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 12 },
});
