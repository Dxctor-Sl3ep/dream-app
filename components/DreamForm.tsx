import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
  const [personalMeaning, setPersonalMeaning] = useState<string>(''); // 👈 nouveau champ

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
        personalMeaning, // 👈 ajouté ici
      };

      formDataArray.push(newDream);

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      console.log(
        'AsyncStorage: ',
        await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey)
      );

      // Reset du formulaire
      setDreamText('');
      setIsLucidDream(false);
      setCharactersInput('');
      setLocation('');
      setPersonalMeaning('');

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

          {/* Nouveau champ : Signification personnelle */}
          <TextInput
            label="Signification personnelle du rêve"
            value={personalMeaning}
            onChangeText={setPersonalMeaning}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

          <Button
            mode="contained"
            onPress={handleDreamSubmission}
            style={styles.button}
          >
            Soumettre
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
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
    marginTop: 8,
  },
});
