import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [charactersInput, setCharactersInput] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [personalMeaning, setPersonalMeaning] = useState<string>('');
  const [emotionalIntensity, setEmotionalIntensity] = useState<number>(5);
  const [sleepQuality, setSleepQuality] = useState<number>(5);

  const handleDreamSubmission = async (): Promise<void> => {
    try {
      const formDataArray: DreamData[] =
        await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      const characters = charactersInput
        .split(',')
        .map((char) => char.trim())
        .filter((char) => char.length > 0);

      const newDream: DreamData = {
        dreamText,
        isLucidDream,
        hashtag1: null as any,
        hashtag2: null as any,
        hashtag3: null as any,
        characters,
        location,
        personalMeaning,
        emotionalIntensity,
        sleepQuality,
      };

      formDataArray.push(newDream);

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      console.log(
        'AsyncStorage: ',
        await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey)
      );

      // reset du formulaire
      setDreamText('');
      setIsLucidDream(false);
      setCharactersInput('');
      setLocation('');
      setPersonalMeaning('');
      setEmotionalIntensity(5);
      setSleepQuality(5);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <TextInput
              label="Rêve"
              value={dreamText}
              onChangeText={setDreamText}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
            />

            <View style={styles.checkboxContainer}>
              <Checkbox.Item
                label="Rêve Lucide"
                status={isLucidDream ? 'checked' : 'unchecked'}
                onPress={() => setIsLucidDream(!isLucidDream)}
              />
            </View>

            <TextInput
              label="Personnages présents (séparés par des virgules)"
              value={charactersInput}
              onChangeText={setCharactersInput}
              mode="outlined"
              style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
            />

            <TextInput
              label="Lieu du rêve"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
            />

            <TextInput
              label="Signification personnelle du rêve"
              value={personalMeaning}
              onChangeText={setPersonalMeaning}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
            />

            {/* --- Barre : Intensité émotionnelle --- */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Intensité émotionnelle : {emotionalIntensity}/10
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={emotionalIntensity}
                onValueChange={setEmotionalIntensity}
                minimumTrackTintColor="#6200ee"
                maximumTrackTintColor="#ccc"
              />
            </View>

            {/* --- Barre : Qualité du sommeil --- */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Qualité du sommeil ressentie : {sleepQuality}/10
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={sleepQuality}
                onValueChange={setSleepQuality}
                minimumTrackTintColor="#03dac5"
                maximumTrackTintColor="#ccc"
              />
            </View>

            <Button
              mode="contained"
              onPress={handleDreamSubmission}
              style={styles.button}
            >
              Soumettre
            </Button>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingVertical: 20,
    flex: 1,
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 20,
    alignSelf: 'center',
    width: '60%',
  },
  sliderContainer: {
    marginVertical: 12,
    width: width * 0.8,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
