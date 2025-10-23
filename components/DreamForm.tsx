// components/DreamForm.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

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

  // Nouveaux champs
  const [tone, setTone] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [clarity, setClarity] = useState(5);
  const [emotionBefore, setEmotionBefore] = useState(5);
  const [emotionAfter, setEmotionAfter] = useState(5);
  const [hashtag1, setHashtag1] = useState('');
  const [hashtag2, setHashtag2] = useState('');
  const [hashtag3, setHashtag3] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Sélection exclusive cauchemar / normal
  const toggleNightmare = () => {
    const next = !isNightmare;
    setIsNightmare(next);
    if (next) setIsNormalDream(false);
  };
  const toggleNormal = () => {
    const next = !isNormalDream;
    setIsNormalDream(next);
    if (next) setIsNightmare(false);
  };

  // Soumission
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
        id: `dream_${Date.now()}`, // [ADDED]
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
        todayDate: new Date().toISOString(),      // [CHANGED]
        characters,
        location,
        personalMeaning,
        emotionalIntensity,
        sleepQuality,
        sleepDate: sleepDate.toISOString(),       // [CHANGED]
      };

      formDataArray.push(newDream);
      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      // reset du formulaire
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Texte du rêve */}
          <TextInput
            label="Rêve"
            value={dreamText}
            onChangeText={setDreamText}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={[styles.input, { width: width * 0.8 }]}
          />

          {/* Types de rêve */}
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Rêve lucide"
              status={isLucidDream ? 'checked' : 'unchecked'}
              onPress={() => setIsLucidDream(!isLucidDream)}
            />
            <Checkbox.Item
              label="Cauchemar"
              status={isNightmare ? 'checked' : 'unchecked'}
              onPress={toggleNightmare}
            />
            <Checkbox.Item
              label="Rêve normal"
              status={isNormalDream ? 'checked' : 'unchecked'}
              onPress={toggleNormal}
            />
          </View>

          {/* Hashtags */}
          <TextInput label="Hashtag 1" value={hashtag1} onChangeText={setHashtag1} mode="outlined" style={styles.input} />
          <TextInput label="Hashtag 2" value={hashtag2} onChangeText={setHashtag2} mode="outlined" style={styles.input} />
          <TextInput label="Hashtag 3" value={hashtag3} onChangeText={setHashtag3} mode="outlined" style={styles.input} />

          {/* Tonalité */}
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Tonalité positive"
              status={tone === 'positive' ? 'checked' : 'unchecked'}
              onPress={() => setTone(tone === 'positive' ? null : 'positive')}
            />
            <Checkbox.Item
              label="Tonalité négative"
              status={tone === 'negative' ? 'checked' : 'unchecked'}
              onPress={() => setTone(tone === 'negative' ? null : 'negative')}
            />
            <Checkbox.Item
              label="Tonalité neutre"
              status={tone === 'neutral' ? 'checked' : 'unchecked'}
              onPress={() => setTone(tone === 'neutral' ? null : 'neutral')}
            />
          </View>

          {/* Personnages / lieu / signification */}
          <TextInput label="Personnages (séparés par des virgules)" value={charactersInput} onChangeText={setCharactersInput} mode="outlined" style={styles.input} />
          <TextInput label="Lieu du rêve" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
          <TextInput label="Signification personnelle" value={personalMeaning} onChangeText={setPersonalMeaning} mode="outlined" multiline numberOfLines={3} style={styles.input} />

          {/* Date du sommeil */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.sliderLabel}>Heure du coucher :</Text>
            {Platform.OS === 'web' ? (
              <ReactDatePicker
                selected={sleepDate}
                onChange={(date: Date) => setSleepDate(date)}
                showTimeSelect
                dateFormat="dd/MM/yyyy à HH:mm"
                timeIntervals={15}
              />
            ) : (
              <>
                <Pressable onPress={() => setShowPicker(true)} style={styles.dateDisplay}>
                  <Text style={styles.dateText}>
                    {format(sleepDate, "dd/MM/yyyy 'à' HH:mm")}
                  </Text>
                </Pressable>
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
            <Text style={styles.sliderLabel}>Intensité émotionnelle : {emotionalIntensity}/10</Text>
            <Slider value={emotionalIntensity} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionalIntensity} />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Qualité du sommeil : {sleepQuality}/10</Text>
            <Slider value={sleepQuality} minimumValue={0} maximumValue={10} step={1} onValueChange={setSleepQuality} />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Clarté du rêve : {clarity}/10</Text>
            <Slider value={clarity} minimumValue={0} maximumValue={10} step={1} onValueChange={setClarity} />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Émotion avant : {emotionBefore}/10</Text>
            <Slider value={emotionBefore} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionBefore} />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Émotion après : {emotionAfter}/10</Text>
            <Slider value={emotionAfter} minimumValue={0} maximumValue={10} step={1} onValueChange={setEmotionAfter} />
          </View>

          <Button mode="contained" onPress={handleDreamSubmission} style={styles.button}>
            Soumettre
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  input: { width: width * 0.8, marginBottom: 16 },
  checkboxContainer: { flexDirection: 'column', marginBottom: 12 },
  button: { marginTop: 20, width: '60%', alignSelf: 'center' },
  sliderContainer: { marginVertical: 10, width: width * 0.8 },
  sliderLabel: { fontSize: 14, marginBottom: 4 },
  dateTimeContainer: { marginVertical: 12, width: width * 0.8 },
  dateDisplay: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 6 },
  dateText: { fontSize: 16, color: '#333' },
});
