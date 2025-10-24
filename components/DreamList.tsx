// components/DreamList.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react'; // [CHANGED] +useRef
import {
  Alert,
  Platform,
  ScrollView,
  Share, // [ADDED]
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function DreamList() {
  const [dreams, setDreams] = useState<DreamData[]>([]);
  const router = useRouter();

  // [ADDED] input fichier caché (web)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const persist = async (arr: DreamData[]) => {
    await AsyncStorageService.setData(AsyncStorageConfig.keys.dreamsArrayKey, arr);
    setDreams(arr);
  };

  const handleResetDreams = async (): Promise<void> => {
    try {
      await persist([]);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des données:', error);
    }
  };

  const handleDeleteById = async (id: string) => {
    try {
      const next = dreams.filter((d) => d.id !== id);
      await persist(next);
    } catch (e) {
      console.error('Suppression impossible:', e);
    }
  };

  // Confirmation cross-platform
  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Supprimer ce rêve ? Action irréversible.');
      if (ok) handleDeleteById(id);
      return;
    }
    Alert.alert('Supprimer ce rêve ?', 'Action irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => handleDeleteById(id) },
    ]);
  };

  // [ADDED] Export/partage d’un rêve (JSON)
  const shareDream = async (dream: DreamData) => {
    try {
      const payload = JSON.stringify(dream, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dream.id || 'dream'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: payload }); // simple, universel
      }
    } catch (e) {
      console.error('Partage/export impossible:', e);
    }
  };

  // [ADDED] Import .json (web). Accepte un objet DreamData ou un tableau d’objets.
  const triggerImport = () => {
    if (Platform.OS === 'web') fileInputRef.current?.click();
    else Alert.alert('Import', 'Import JSON disponible sur la cible web dans cette version.');
  };

  // [ADDED] Normalisation + merge
  const normalizeDream = (raw: any): DreamData | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id || `dream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dream: DreamData = {
      id,
      dreamText: String(raw.dreamText ?? ''),
      isLucidDream: !!raw.isLucidDream,
      isNightmare: !!raw.isNightmare,
      isNormalDream: !!raw.isNormalDream,
      tone: raw.tone ?? null,
      clarity: Number.isFinite(raw.clarity) ? Number(raw.clarity) : undefined,
      emotionBefore: Number.isFinite(raw.emotionBefore) ? Number(raw.emotionBefore) : undefined,
      emotionAfter: Number.isFinite(raw.emotionAfter) ? Number(raw.emotionAfter) : undefined,
      hashtags: raw.hashtags ?? undefined,
      todayDate: raw.todayDate ?? new Date().toISOString(),
      characters: Array.isArray(raw.characters) ? raw.characters.map(String) : [],
      location: raw.location ?? '',
      personalMeaning: raw.personalMeaning ?? '',
      emotionalIntensity: Number.isFinite(raw.emotionalIntensity) ? Number(raw.emotionalIntensity) : undefined,
      sleepQuality: Number.isFinite(raw.sleepQuality) ? Number(raw.sleepQuality) : undefined,
      sleepDate: raw.sleepDate ?? new Date().toISOString(),
    };
    return dream;
  };

  // [ADDED] Handler changement de fichier (web)
  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    try {
      const file = ev.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const json = JSON.parse(text);

      const incoming: DreamData[] = Array.isArray(json)
        ? json.map(normalizeDream).filter(Boolean) as DreamData[]
        : [normalizeDream(json)].filter(Boolean) as DreamData[];

      if (incoming.length === 0) {
        Alert.alert('Import', 'Fichier sans rêve valide.');
        ev.target.value = '';
        return;
      }

      // fusion par id (remplace si id identique)
      const map = new Map<string, DreamData>(dreams.map((d) => [d.id, d]));
      incoming.forEach((d) => map.set(d.id, d));
      const merged = Array.from(map.values());

      await persist(merged);
      if (Platform.OS === 'web') alert(`Import terminé: ${incoming.length} rêve(s).`);
    } catch (e) {
      console.error('Import échoué:', e);
      Alert.alert('Import', 'Impossible de lire le fichier JSON.');
    } finally {
      // reset pour permettre ré-import du même fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const typeLabel = (d: DreamData) => {
    if (d.isLucidDream) return '🌙 Rêve lucide';
    if (d.isNightmare) return '😱 Cauchemar';
    if (d.isNormalDream) return '💤 Rêve normal';
    return '';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌙 Liste des Rêves :</Text>

      {dreams.length > 0 ? (
        dreams.map((dream) => (
          <Card key={dream.id} style={styles.card}>
            <Card.Content>
              <Text style={styles.dreamText}>{dream.dreamText}</Text>

              <Text style={styles.lucid}>{typeLabel(dream)}</Text>

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

                <Button
                  mode="outlined"
                  onPress={() => shareDream(dream)} // [ADDED] bouton partage/export JSON
                  style={styles.actionBtn}
                >
                  📤 Partager
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

      {/* Zone actions bas de page */}
      <View style={styles.bottomActions}>
        <Button mode="contained" onPress={handleResetDreams} style={styles.bottomBtn}>
          Réinitialiser les rêves
        </Button>

        <Button mode="outlined" onPress={triggerImport} style={styles.bottomBtn}>
          📥 Importer un rêve
        </Button>
      </View>

      {/* [ADDED] input fichier caché pour web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onFileSelected}
        />
      )}
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  actionBtn: { marginLeft: 8 },
  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 },
  bottomBtn: { alignSelf: 'center' },
});
