// components/DreamList.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function DreamList() {
  const [dreams, setDreams] = useState<DreamData[]>([]);
  const router = useRouter();

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
      return () => {};
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

  const handleDeleteById = async (id: string) => {
    try {
      const next = dreams.filter((d) => d.id !== id);
      await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, next);
      setDreams(next);
    } catch (e) {
      console.error('Suppression impossible:', e);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Supprimer ce rêve ?', 'Action irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => handleDeleteById(id) },
    ]);
  };

  // [CHANGED] mapping lisible avec émojis
  const typeLabel = (d: DreamData) => {
    if (d.isLucidDream) return '🌙 Rêve lucide';
    if (d.isNightmare) return '😱 Cauchemar';
    if (d.isNormalDream) return '💤 Rêve normal';
    return '';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌙 Liste des Rêves :</Text> {/* [CHANGED] titre avec emoji */}

      {dreams.length > 0 ? (
        dreams.map((dream) => (
          <Card key={dream.id} style={styles.card}>
            <Card.Content>
              <Text style={styles.dreamText}>{dream.dreamText}</Text>

              <Text style={styles.lucid}>
                {typeLabel(dream)} {/* [UNCHANGED] */}
              </Text>

              {dream.sleepDate && (
                <Text style={styles.detail}>
                  🕰️ Heure du coucher :{' '}
                  {format(new Date(dream.sleepDate), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </Text>
              )}

              {dream.todayDate && (
                <Text style={styles.detail}>
                  📅 Date d’enregistrement :{' '}
                  {format(new Date(dream.todayDate), 'dd MMMM yyyy', { locale: fr })}
                </Text>
              )}

              {dream.characters?.length > 0 && (
                <Text style={styles.detail}>👥 Personnages : {dream.characters.join(', ')}</Text>
              )}

              {dream.location && <Text style={styles.detail}>📍 Lieu : {dream.location}</Text>}

              {dream.personalMeaning && (
                <Text style={styles.detail}>
                  💭 Signification personnelle : {dream.personalMeaning}
                </Text>
              )}

              <Text style={styles.detail}>
                😵 Intensité émotionnelle : {dream.emotionalIntensity ?? '-'} / 10
              </Text>

              <Text style={styles.detail}>
                🛌 Qualité du sommeil : {dream.sleepQuality ?? '-'} / 10
              </Text>

              {(dream.hashtags?.hashtag1?.label ||
                dream.hashtags?.hashtag2?.label ||
                dream.hashtags?.hashtag3?.label) && (
                <Text style={styles.detail}>
                  🏷️ Hashtags :{' '}
                  {[dream.hashtags?.hashtag1?.label, dream.hashtags?.hashtag2?.label, dream.hashtags?.hashtag3?.label]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}

              {dream.tone && <Text style={styles.detail}>🎛️ Tonalité : {dream.tone}</Text>}

              {dream.clarity !== undefined && (
                <Text style={styles.detail}>🔎 Clarté : {dream.clarity}/10</Text>
              )}

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

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => router.push({ pathname: '/modal', params: { id: dream.id } })}
                  style={styles.actionBtn}
                >
                  ✏️ Éditer
                </Button>
                <Button mode="contained" onPress={() => confirmDelete(dream.id)} style={styles.actionBtn}>
                  🗑️ Supprimer
                </Button>
              </View>
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: '#f8f8f8', elevation: 2 },
  dreamText: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  lucid: { fontSize: 14, marginBottom: 4 },
  detail: { fontSize: 14, color: '#333', marginTop: 2 },
  noDream: { fontSize: 16, textAlign: 'center', color: '#777', marginTop: 20 },
  button: { marginTop: 20, alignSelf: 'center', width: '70%' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  actionBtn: { marginLeft: 8 },
});
