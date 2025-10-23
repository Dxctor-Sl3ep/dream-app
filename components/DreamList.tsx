// components/DreamList.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function DreamList() {
  const [dreams, setDreams] = useState<DreamData[]>([]);

  const fetchData = async () => {
    try {
      const formDataArray: DreamData[] = await AsyncStorageService.getData(
        AsyncStorageConfig.keys.dreamsArrayKey
      );
      setDreams(formDataArray || []);
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
      return () => console.log('DreamList unfocused');
    }, [])
  );

  const handleResetDreams = async (): Promise<void> => {
    try {
      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, []);
      setDreams([]);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des données:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌙 Liste des Rêves :</Text>

      {dreams.length > 0 ? (
        dreams.map((dream, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              {/* 💤 Texte principal */}
              <Text style={styles.dreamText}>{dream.dreamText}</Text>

              {/* 💡 Type de rêve */}
              <Text style={styles.lucid}>
                {dream.isLucidDream
                  ? '💡 Rêve Lucide'
                  : dream.isNightmare
                  ? '😱 Cauchemar'
                  : dream.isNormalDream
                  ? '💤 Rêve Normal'
                  : ''}
              </Text>

              {/* 🕓 Heure du coucher */}
              {dream.sleepDate && (
                <Text style={styles.detail}>
                  🕓 Heure du coucher :{' '}
                  {format(new Date(dream.sleepDate), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </Text>
              )}

              {/* 📅 Date d’enregistrement */}
              {dream.todayDate && (
                <Text style={styles.detail}>
                  📅 Date d’enregistrement :{' '}
                  {format(new Date(dream.todayDate), 'dd MMMM yyyy', { locale: fr })}
                </Text>
              )}

              {/* 👥 Personnages */}
              {dream.characters?.length > 0 && (
                <Text style={styles.detail}>👥 Personnages : {dream.characters.join(', ')}</Text>
              )}

              {/* 📍 Lieu */}
              {dream.location && <Text style={styles.detail}>📍 Lieu : {dream.location}</Text>}

              {/* 💭 Signification personnelle */}
              {dream.personalMeaning && (
                <Text style={styles.detail}>
                  💭 Signification personnelle : {dream.personalMeaning}
                </Text>
              )}

              {/* 🌡️ Intensité émotionnelle */}
              <Text style={styles.detail}>
                🌡️ Intensité émotionnelle : {dream.emotionalIntensity ?? '-'} /10
              </Text>

              {/* 💤 Qualité du sommeil */}
              <Text style={styles.detail}>
                😴 Qualité du sommeil : {dream.sleepQuality ?? '-'} /10
              </Text>

              {/* 🔖 Hashtags */}
              {(dream.hashtags?.hashtag1?.label ||
                dream.hashtags?.hashtag2?.label ||
                dream.hashtags?.hashtag3?.label) && (
                <Text style={styles.detail}>
                  🔖 Hashtags :{' '}
                  {[dream.hashtags?.hashtag1?.label, dream.hashtags?.hashtag2?.label, dream.hashtags?.hashtag3?.label]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}

              {/* 🎭 Tonalité */}
              {dream.tone && <Text style={styles.detail}>🎭 Tonalité : {dream.tone}</Text>}

              {/* 🌫️ Clarté */}
              {dream.clarity !== undefined && (
                <Text style={styles.detail}>🌫️ Clarté : {dream.clarity}/10</Text>
              )}

              {/* ❤️ Émotions avant/après */}
              {(dream.emotionBefore !== undefined || dream.emotionAfter !== undefined) && (
                <>
                  {dream.emotionBefore !== undefined && (
                    <Text style={styles.detail}>💗 Émotion avant : {dream.emotionBefore}/10</Text>
                  )}
                  {dream.emotionAfter !== undefined && (
                    <Text style={styles.detail}>💖 Émotion après : {dream.emotionAfter}/10</Text>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.noDream}>Aucun rêve enregistré</Text>
      )}

      <Button mode="contained" onPress={handleResetDreams} style={styles.button}>
        Réinitialiser les rêves
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    elevation: 2,
  },
  dreamText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  lucid: {
    fontSize: 14,
    color: '#6200ee',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  noDream: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    alignSelf: 'center',
    width: '70%',
  },
});
