// components/DreamForm.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

// ✅ Import web-only date picker
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const { width } = Dimensions.get('window');

export default function DreamForm() {
  // Champs principaux
  const [dreamText, setDreamText] = useState('');
  const [isLucidDream, setIsLucidDream] = useState(false);
  const [isNightmare, setIsNightmare] = useState(false);
  const [isNormalDream, setIsNormalDream] = useState(false);
  const [charactersInput, setCharactersInput] = useState('');
  const [location, setLocation] = useState('');
  const [personalMeaning, setPersonalMeaning] = useState('');
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [sleepDate, setSleepDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Champs additionnels
  const [tone, setTone] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [clarity, setClarity] = useState(5);
  const [emotionBefore, setEmotionBefore] = useState(5);
  const [emotionAfter, setEmotionAfter] = useState(5);
  const [hashtag1, setHashtag1] = useState('');
  const [hashtag2, setHashtag2] = useState('');
  const [hashtag3, setHashtag3] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ✅ Exclusivité des 3 types
  const selectType = (type: 'lucid' | 'nightmare' | 'normal') => {
    setIsLucidDream(type === 'lucid');
    setIsNightmare(type === 'nightmare');
    setIsNormalDream(type === 'normal');
  };

  const handleDreamSubmission = async (): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const formDataArray: DreamData[] =
        (await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey)) || [];

      const characters = charactersInput
        .split(',')
        .map((char) => char.trim())
        .filter((char) => char.length > 0);

      const newDream: DreamData = {
        id: `dream_${Date.now()}`,
        dreamText,
        isLucidDream,
        isNightmare,
        isNormalDream,
        tone,
        clarity,
        emotionBefore,
        emotionAfter,
        hashtags: {
          hashtag1: { id: `h1-${Date.now()}`, label: hashtag1 },
          hashtag2: { id: `h2-${Date.now()}`, label: hashtag2 },
          hashtag3: { id: `h3-${Date.now()}`, label: hashtag3 },
        },
        todayDate: new Date().toISOString(),
        characters,
        location,
        personalMeaning,
        emotionalIntensity,
        sleepQuality,
        sleepDate: sleepDate.toISOString(),
      };

      formDataArray.push(newDream);
      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      // reset
      setDreamText('');
      setIsLucidDream(false);
      setIsNightmare(false);
      setIsNormalDream(false);
      setTone(null);
      setClarity(5);
      setEmotionBefore(5);
      setEmotionAfter(5);
      setHashtag1('');
      setHashtag2('');
      setHashtag3('');
      setCharactersInput('');
      setLocation('');
      setPersonalMeaning('');
      setEmotionalIntensity(5);
      setSleepQuality(5);
      setSleepDate(new Date());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Texte du rêve */}
        <TextInput
          label="📝 Rêve"
          value={dreamText}
          onChangeText={setDreamText}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={[styles.input, { width: width * 0.8 }]}
          autoFocus
        />

        {/* Types de rêve */}
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="🌙 Rêve lucide"
            status={isLucidDream ? 'checked' : 'unchecked'}
            onPress={() => selectType('lucid')}
          />
          <Checkbox.Item
            label="😱 Cauchemar"
            status={isNightmare ? 'checked' : 'unchecked'}
            onPress={() => selectType('nightmare')}
          />
          <Checkbox.Item
            label="💤 Rêve normal"
            status={isNormalDream ? 'checked' : 'unchecked'}
            onPress={() => selectType('normal')}
          />
        </View>

        {/* Hashtags */}
        <TextInput label="🏷️ Hashtag 1" value={hashtag1} onChangeText={setHashtag1} mode="outlined" style={styles.input} />
        <TextInput label="🏷️ Hashtag 2" value={hashtag2} onChangeText={setHashtag2} mode="outlined" style={styles.input} />
        <TextInput label="🏷️ Hashtag 3" value={hashtag3} onChangeText={setHashtag3} mode="outlined" style={styles.input} />

        {/* Tonalité */}
        <View style={styles.checkboxContainer}>
          <Checkbox.Item
            label="😊 Tonalité positive"
            status={tone === 'positive' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'positive' ? null : 'positive')}
          />
          <Checkbox.Item
            label="☹️ Tonalité négative"
            status={tone === 'negative' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'negative' ? null : 'negative')}
          />
          <Checkbox.Item
            label="😐 Tonalité neutre"
            status={tone === 'neutral' ? 'checked' : 'unchecked'}
            onPress={() => setTone(tone === 'neutral' ? null : 'neutral')}
          />
        </View>

        {/* Personnages / lieu / signification */}
        <TextInput label="👤 Personnages (séparés par des virgules)" value={charactersInput} onChangeText={setCharactersInput} mode="outlined" style={styles.input} />
        <TextInput label="📍 Lieu du rêve" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
        <TextInput label="💭 Signification personnelle" value={personalMeaning} onChangeText={setPersonalMeaning} mode="outlined" multiline numberOfLines={3} style={styles.input} />

        {/* --- Sélecteur de date et heure du sommeil --- */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.sliderLabel}>🕰️ Heure du coucher :</Text>

          {Platform.OS === 'web' ? (
            // ✅ Version Web : ReactDatePicker interactif
            <ReactDatePicker
              selected={sleepDate}
              onChange={(date: Date) => setSleepDate(date)}
              showTimeSelect
              dateFormat="dd/MM/yyyy à HH:mm"
              timeIntervals={15}
              className="react-datepicker-input"
            />
          ) : (
            // ✅ Version native : DateTimePicker
            <>
              <Button mode="outlined" onPress={() => setShowPicker(true)}>
                Choisir : {format(sleepDate, "dd/MM/yyyy 'à' HH:mm")}
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
            </>
          )}
        </View>

        {/* Sliders */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>😵 Intensité émotionnelle : {emotionalIntensity}/10</Text>
          <Slider value={emotionalIntensity} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionalIntensity} />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>🛌 Qualité du sommeil : {sleepQuality}/10</Text>
          <Slider value={sleepQuality} minimumValue={0} maximumValue={10} step={1} onValueChange={setSleepQuality} />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>🔎 Clarté du rêve : {clarity}/10</Text>
          <Slider value={clarity} minimumValue={0} maximumValue={10} step={1} onValueChange={setClarity} />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>⬅️ Émotion avant : {emotionBefore}/10</Text>
          <Slider value={emotionBefore} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionBefore} />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>➡️ Émotion après : {emotionAfter}/10</Text>
          <Slider value={emotionAfter} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionAfter} />
        </View>

        <Button mode="contained" onPress={handleDreamSubmission} style={styles.button}>
          Enregistrer le rêve
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  input: { width: width * 0.8, marginBottom: 16 },
  checkboxContainer: { flexDirection: 'column', marginBottom: 12, width: width * 0.8 },
  button: { marginTop: 20, width: '60%', alignSelf: 'center' },
  sliderContainer: { marginVertical: 10, width: width * 0.8 },
  sliderLabel: { fontSize: 14, marginBottom: 4 },
  dateTimeContainer: { marginVertical: 12, width: width * 0.8 },
});
