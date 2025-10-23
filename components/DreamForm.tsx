// components/DreamForm.tsx

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
  View
} from 'react-native';
import { Button, Checkbox, TextInput } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [isNightmare, setIsNightmare] = useState<boolean>(false);
  const [isNormalDream, setIsNormalDream] = useState<boolean>(false);
  const [hashtag1, setHashtag1] = useState('');
  const [hashtag2, setHashtag2] = useState('');
  const [hashtag3, setHashtag3] = useState('');

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

  const handleDreamSubmission = async (): Promise<void> => {
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

      setDreamText('');
      setIsLucidDream(false);
      setIsNightmare(false);
      setIsNormalDream(false);
      setHashtag1('');
      setHashtag2('');
      setHashtag3('');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };

  const findHashtagIdByLabel = async (hashtag) => {
    try {
      const existingDreams = await AsyncStorage.getItem('dreamFormDataArray');
      let dreamsData = existingDreams ? JSON.parse(existingDreams) : [];

      for (let dream of dreamsData) {
        for (let hashtagKey in dream.hashtags) {
          const hashtagStored = dream.hashtags[hashtagKey];
          if (hashtagStored.label === hashtag) {
            return hashtagStored.id;
          }
        }
      }

      const newId = `hashtag-${Math.random().toString(36).substr(2, 9)}`;
      return newId;
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

          <TextInput
            label="Hashtag 1"
            value={hashtag1}
            onChangeText={setHashtag1}
            mode="outlined"
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />
          <TextInput
            label="Hashtag 2"
            value={hashtag2}
            onChangeText={setHashtag2}
            mode="outlined"
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />
          <TextInput
            label="Hashtag 3"
            value={hashtag3}
            onChangeText={setHashtag3}
            mode="outlined"
            style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
          />

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
    flexDirection: 'column',
    gap: 4,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
