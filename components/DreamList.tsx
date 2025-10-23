// components/DreamList.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Button } from 'react-native-paper';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';


export default function DreamList() {
    const [dreams, setDreams] = useState<DreamData[]>([]);

    const fetchData = async () => {
        try {
            const formDataArray: DreamData[] = await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
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
        <View>
      <Text style={styles.title}>Liste des Rêves :</Text>
      {dreams.map((dream, index) => (
        <Text key={index} style={styles.dreamText}>
	      {dream.dreamText} - {dream.isLucidDream ? 'Lucide' : 'Non Lucide'} - {dream.isNightmare ? 'Cauchemar' : 'Non Cauchemar'} - {dream.isNormalDream ? 'Rêve Normal' : 'Non Rêve Normal'} - {dream.todayDate}
	      {'\n'}Hashtags:{'\n'}
	      1. {dream.hashtag1.id} - {dream.hashtag1.label}{'\n'}
	      2. {dream.hashtag2.id} - {dream.hashtag2.label}{'\n'}
	      3. {dream.hashtag3.id} - {dream.hashtag3.label}
	    </Text>
      ))}
    </View>
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
