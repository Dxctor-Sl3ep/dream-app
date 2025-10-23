// components/DreamForm.tsx

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { Hashtag } from '@/interfaces/DreamData';

const { width } = Dimensions.get('window');

export default function DreamForm() {
  const [dreamText, setDreamText] = useState<string>('');
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [isNightmare, setIsNightmare] = useState<boolean>(false);
  const [isNormalDream, setIsNormalDream] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('')
  const [tags, setTags] = useState<string[]>([]);
  const [hashtag1, setHashtag1] = useState<Hashtag>({label: '', id: ''});
  const [hashtag2, setHashtag2] = useState<Hashtag>({label: '', id: ''});
  const [hashtag3, setHashtag3] = useState<Hashtag>({label: '', id: ''});


  
  const handleDreamSubmission = async (): Promise<void> => {
    try {

      const formDataArray: DreamData[] = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);

      // Ajouter le nouveau rêve
      formDataArray.push({ dreamText, isLucidDream, hashtag1, hashtag2, hashtag3 });

      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, formDataArray);

      console.log(
        'AsyncStorage: ',
        await AsyncStorage.getItem(AsyncStorageConfig.keys.dreamsArrayKey)
      );

      try {
      // Récupérer le tableau actuel depuis AsyncStorage
      const existingData = await AsyncStorage.getItem('dreamFormDataArray');
      const formDataArray = existingData ? JSON.parse(existingData) : [];

      // Trouver les IDs des hashtags
      const hashtag1Id = await findHashtagIdByLabel(hashtag1);
      const hashtag2Id = await findHashtagIdByLabel(hashtag2);
      const hashtag3Id = await findHashtagIdByLabel(hashtag3);

      // Ajouter le nouveau formulaire au tableau
      formDataArray.push({
        dreamText: dreamText,
        isLucidDream: isLucidDream,
        todayDate: new Date(),
        hashtags: {
          hashtag1: { id: hashtag1Id, label: hashtag1 },
          hashtag2: { id: hashtag2Id, label: hashtag2 },
          hashtag3: { id: hashtag3Id, label: hashtag3 },
        },
      });

      // Sauvegarder le tableau mis à jour dans AsyncStorage
      await AsyncStorage.setItem('dreamFormDataArray', JSON.stringify(formDataArray));

      // Réinitialiser les champs du formulaire
      setDreamText('');
      setIsLucidDream(false);
      setHashtag1('');
      setHashtag2('');
      setHashtag3('');

    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    };


    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }

    setDreamText('');
    setIsLucidDream(false);
  };
  // components/DreamForm.tsx

/**
 * Fonction asynchrone qui cherche l'ID d'un hashtag donné en parcourant
 * les rêves stockés dans AsyncStorage.
 * Si le hashtag est trouvé dans les rêves existants, retourne son ID.
 * Sinon, crée un nouvel ID unique pour ce hashtag et le retourne.
 */
const findHashtagIdByLabel = async (hashtag: string): Promise<string | null> => {
  try {
    // Récupère les données des rêves stockées dans le AsyncStorage
    const existingDreams = await AsyncStorage.getItem('dreamFormDataArray');
    const dreamsData: any[] = existingDreams ? JSON.parse(existingDreams) : [];

    // Parcours tous les rêves pour trouver un hashtag existant
    for (const dream of dreamsData) {
      const hashtags = (dream.hashtags ?? {}) as Record<string, any>;
      for (const hashtagKey in hashtags) {
        const hashtagStored = hashtags[hashtagKey]; // Récupère l'objet du hashtag stocké

        if (hashtagStored?.label === hashtag) {
          // Si le hashtag est trouvé, renvoie son ID
          return hashtagStored.id;
        }
      }
    }

    // Si le hashtag n'existe pas, crée un nouvel ID
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
        value={hashtag1.label}
        onChangeText={(hashtag1) => setHashtag1(hashtag1)}
        mode="outlined"
        style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
      />

      <TextInput
        label="Hashtag 2"
        value={hashtag2}
        onChangeText={(hashtag2) => setHashtag2(hashtag2)}
        mode="outlined"
        style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
      />

      <TextInput
        label="Hashtag 3"
        value={hashtag3}
        onChangeText={(hashtag3) => setHashtag3(hashtag3)}
        mode="outlined"
        style={[styles.input, { width: width * 0.8, alignSelf: 'center' }]}
      />

          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Rêve Lucide"
              status={isLucidDream ? 'checked' : 'unchecked'}
              onPress={() => setIsLucidDream(!isLucidDream)}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Cauchemar"
              status={isNightmare ? 'checked' : 'unchecked'}
              onPress={() => setIsNightmare(!isNightmare)}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Rêve Normal"
              status={isNormalDream ? 'checked' : 'unchecked'}
              onPress={() => setIsNormalDream(!isNormalDream)}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
})