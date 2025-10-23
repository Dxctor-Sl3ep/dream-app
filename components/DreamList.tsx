import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

export default function DreamList() {
    const [dreams, setDreams] = useState<DreamData[]>([]);

    const fetchData = async () => {
        try {
            const formDataArray: DreamData[] =
                await AsyncStorageService.getData(AsyncStorageConfig.keys.dreamsArrayKey);
            setDreams(formDataArray);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            await AsyncStorage.setItem(AsyncStorageConfig.keys.dreamsArrayKey, JSON.stringify([]));
            setDreams([]);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation des données:', error);
        }
    };

    return (
        <View style={{ padding: 16 }}>
            <Text style={styles.title}>Liste des Rêves :</Text>

            {dreams.length > 0 ? (
                dreams.map((dream, index) => (
                    <View key={index} style={styles.dreamItem}>
                        <Text style={styles.dreamText}>
                            {dream.dreamText} - {dream.isLucidDream ? 'Lucide' : 'Non Lucide'}
                        </Text>

                        {dream.location && (
                            <Text style={styles.locationText}>📍 Lieu : {dream.location}</Text>
                        )}

                        {dream.characters && dream.characters.length > 0 && (
                            <Text style={styles.characterText}>
                                👥 Personnages : {dream.characters.join(', ')}
                            </Text>
                        )}

                        {dream.personalMeaning && (
                            <Text style={styles.meaningText}>
                                💭 Signification : {dream.personalMeaning}
                            </Text>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.dreamText}>Aucun rêve enregistré</Text>
            )}

            <Button
                mode="contained"
                onPress={handleResetDreams}
                style={styles.button}
            >
                Reset Dreams
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dreamItem: {
        marginBottom: 12,
    },
    dreamText: {
        fontSize: 16,
    },
    locationText: {
        fontSize: 14,
        color: '#333',
        marginTop: 2,
    },
    characterText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#555',
    },
    meaningText: {
        fontSize: 14,
        color: '#333',
        marginTop: 4,
    },
    button: {
        marginTop: 8,
    },
});
