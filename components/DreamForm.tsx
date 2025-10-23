import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';
import  Slider  from '@react-native-community/slider';


const { width } = Dimensions.get('window');

export default function DreamForm() {
  // [UNCHANGED] core fields
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [isNightmare, setIsNightmare] = useState<boolean>(false);
  const [isNormalDream, setIsNormalDream] = useState<boolean>(false);

  // [UNCHANGED] hashtags inputs
  const [hashtag1, setHashtag1] = useState('');
  const [hashtag2, setHashtag2] = useState('');
  const [hashtag3, setHashtag3] = useState('');

  // [NEW] tone (exclusive)
  const [tone, setTone] = useState<'positive' | 'negative' | 'neutral' | null>(null);

  // [NEW] Clarity (exclusive)
  const [clarity, setClarity] = useState<number>(5);

  // [NEW] sliders for emotional state
  const [emotionBefore, setEmotionBefore] = useState<number>(5);
const [emotionAfter, setEmotionAfter] = useState<number>(5);


  // [UNCHANGED] exclusive toggles for nightmare/normal
  const toggleNightmare = () => {
    const next = !isNightmare;
    setIsNightmare(next);
    if (next) setIsNormalDream(false);
  };
  const [submitting, setSubmitting] = useState(false);
  const toggleNormal = () => {
    const next = !isNormalDream;
    setIsNormalDream(next);
    if (next) setIsNightmare(false);
  };

  // [UNCHANGED] submit handler (augmented with tone)
  const handleDreamSubmission = async (): Promise<void> => {
  if (submitting) return;
  setSubmitting(true);
    try {
      const formDataArray: DreamData[] =
        await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      const hashtag1Id = await findHashtagIdByLabel(hashtag1);
      const hashtag2Id = await findHashtagIdByLabel(hashtag2);
      const hashtag3Id = await findHashtagIdByLabel(hashtag3);

      const newEntry: DreamData = {
        dreamText,
        isLucidDream,
        isNightmare,
        isNormalDream,
        tone, // [NEW]
        clarity, // [NEW]
        emotionBefore, // [NEW]
        emotionAfter, // [NEW]
        todayDate: new Date(),
      } as DreamData;

      const newEntryWithTags = {
        ...newEntry,
        hashtags: {
          hashtag1: { id: hashtag1Id, label: hashtag1 },
          hashtag2: { id: hashtag2Id, label: hashtag2 },
          hashtag3: { id: hashtag3Id, label: hashtag3 },
        },
      };

      formDataArray.push(newEntryWithTags as unknown as DreamData);
      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      const existing = await AsyncStorage.getItem('dreamFormDataArray');
      const rawArray = existing ? JSON.parse(existing) : [];
      rawArray.push(newEntryWithTags);
      await AsyncStorage.setItem('dreamFormDataArray', JSON.stringify(rawArray));

      // reset form
      setDreamText('');
      setIsLucidDream(false);
      setIsNightmare(false);
      setIsNormalDream(false);
      setHashtag1('');
      setHashtag2('');
      setHashtag3('');
      setTone(null); // [NEW]
      setClarity(5); // [NEW]
      setEmotionBefore(5); // [NEW]
      setEmotionAfter(5); // [NEW]
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };

  // [UNCHANGED] reuse hashtag id if already seen
  const findHashtagIdByLabel = async (hashtag: string) => {
    try {
      const existingDreams = await AsyncStorage.getItem('dreamFormDataArray');
      let dreamsData = existingDreams ? JSON.parse(existingDreams) : [];

      for (let dream of dreamsData) {
        for (let hashtagKey in dream.hashtags ?? {}) {
          const hashtagStored = dream.hashtags[hashtagKey];
          if (hashtagStored?.label === hashtag) {
            return hashtagStored.id;
          }
        }
      }
      return `hashtag-${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      console.error('Erreur lors de la gestion des hashtags:', error);
      return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* [CHANGED] Use ScrollView and let taps reach inputs */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // [NEW] fixes “need to long-press to type”
      >
        <TextInput
          label="Rêve"
          value={dreamText}
          onChangeText={setDreamText}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          returnKeyType="done"
        />

        {/* [UNCHANGED] hashtags */}
        <TextInput
          label="Hashtag 1"
          value={hashtag1}
          onChangeText={setHashtag1}
          mode="outlined"
          style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          returnKeyType="next"
        />
        <TextInput
          label="Hashtag 2"
          value={hashtag2}
          onChangeText={setHashtag2}
          mode="outlined"
          style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          returnKeyType="next"
        />
        <TextInput
          label="Hashtag 3"
          value={hashtag3}
          onChangeText={setHashtag3}
          mode="outlined"
          style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          returnKeyType="done"
        />

        {/* [UNCHANGED] type of dream */}
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="Rêve lucide"
            status={isLucidDream ? 'checked' : 'unchecked'}
            onPress={() => setIsLucidDream(!isLucidDream)}
            position="leading"
          />
          <Checkbox.Item
            label="Cauchemar"
            status={isNightmare ? 'checked' : 'unchecked'}
            onPress={toggleNightmare}
            position="leading"
          />
          <Checkbox.Item
            label="Rêve normal"
            status={isNormalDream ? 'checked' : 'unchecked'}
            onPress={toggleNormal}
            position="leading"
          />
        </View>

        {/* [NEW] tone (exclusive by single state) */}
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="Tonalité positive"
            status={tone === 'positive' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'positive' ? null : 'positive')}
            position="leading"
          />
          <Checkbox.Item
            label="Tonalité négative"
            status={tone === 'negative' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'negative' ? null : 'negative')}
            position="leading"
          />
          <Checkbox.Item
            label="Tonalité neutre"
            status={tone === 'neutral' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'neutral' ? null : 'neutral')}
            position="leading"
          />
        </View>

        <View style={styles.sliderContainer}>
  <Text style={styles.sliderLabel}>
    Clarté du rêve : {clarity}/10
  </Text>
  <Slider
    style={styles.slider}
    minimumValue={0}
    maximumValue={10}
    step={1}
    value={clarity}
    onValueChange={setClarity}
    minimumTrackTintColor="#03dac5"
    maximumTrackTintColor="#ccc"
    thumbTintColor="#6200ee"
  />
</View>
        <View style={styles.sliderContainer}>
  <Text style={styles.sliderLabel}>
    État émotionnel avant le rêve : {emotionBefore}/10
  </Text>
  <Slider
    style={styles.slider}
    minimumValue={1}
    maximumValue={10}
    step={1}
    value={emotionBefore}
    onValueChange={setEmotionBefore}
    minimumTrackTintColor="#03da39ff"
    maximumTrackTintColor="#ccc"
    thumbTintColor="#be00eeff"
  />
</View>

<View style={styles.sliderContainer}>
  <Text style={styles.sliderLabel}>
    État émotionnel après le rêve : {emotionAfter}/10
  </Text>
  <Slider
    style={styles.slider}
    minimumValue={1}
    maximumValue={10}
    step={1}
    value={emotionAfter}
    onValueChange={setEmotionAfter}
    minimumTrackTintColor="#6003daff"
    maximumTrackTintColor="#ccc"
    thumbTintColor="#00eee2ff"
  />
</View>

        <Button
          mode="contained"
          onPress={handleDreamSubmission}
          style={styles.button}
        >
          Soumettre
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  // [CHANGED] flexGrow + paddingBottom for safe scrolling
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    alignSelf: 'center',
  },
  sliderContainer: {
  marginVertical: 16,
  alignItems: 'center',
},
sliderLabel: {
  fontSize: 16,
  fontWeight: '500',
  marginBottom: 8,
},
slider: {
  width: '80%',
  height: 40,
},
});