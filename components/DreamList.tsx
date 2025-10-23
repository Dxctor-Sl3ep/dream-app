// components/DreamList.tsx

import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';

export default function DreamList() {
    const [dreams, setDreams] = useState<DreamData[]>([]);

    const fetchData = async () => {
  try {
    const raw = await AsyncStorage.getItem('dreamFormDataArray');
    const formDataArray: DreamData[] = raw ? JSON.parse(raw) : [];
    setDreams(formDataArray);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
  }
};

    // Chargement initial
    useEffect(() => {
        fetchData();
    }, []);

    // Rechargement quand on revient sur l’écran
    useFocusEffect(
        useCallback(() => {
            fetchData();
            return () => {
                console.log('This route is now unfocused.');
            };
        }, [])
    );

    const handleResetDreams = async (): Promise<void> => {
        try {
            await AsyncStorage.setItem('dreamFormDataArray', JSON.stringify([]));

            const emptyDreamsData: DreamData[] = [];

            await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, emptyDreamsData);

            setDreams(emptyDreamsData);

        } catch (error) {
            console.error('Erreur lors de la réinitialisation des données:', error);
        }
    };

    return (
        <ScrollView>
      <Text style={styles.title}>Liste des Rêves :</Text>
      {dreams.map((dream, index) => (
        <Text key={index} style={styles.dreamText}>
  {dream.dreamText} - {dream.isLucidDream ? 'Lucide' : 'Non Lucide'} {dream.isNightmare ? 'Cauchemar' : 'Rêve Normal'} {dream.isNormalDream ? '(Normal)' : ''} - {dream.todayDate?.toString()}
  {'\n'}
  Hashtags:
  {'\n'}
  1. {dream.hashtags?.hashtag1?.label ?? '-'}
  {'\n'}
  2. {dream.hashtags?.hashtag2?.label ?? '-'}
  {'\n'}
  3. {dream.hashtags?.hashtag3?.label ?? '-'}
{'\n'}
  Tonalité: {dream.tone ?? '-'}
  {'\n'}
  Clarté: {typeof dream.clarity === 'number' ? `${dream.clarity}/10` : '-'}
  {'\n'}
  État émotionnel avant: {typeof dream.emotionBefore === 'number' ? `${dream.emotionBefore}/10` : '-'}
  {'\n'}
  État émotionnel après: {typeof dream.emotionAfter === 'number' ? `${dream.emotionAfter}/10` : '-'}
</Text>



      ))}
      <Button mode="contained" onPress={handleResetDreams} style={styles.button}>
        Réinitialiser les rêves
      </Button>
    </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dreamText: {
        fontSize: 16,
        marginBottom: 4,
    },
    button: {
        marginTop: 8,
    },
});
