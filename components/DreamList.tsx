// components/DreamList.tsx
import { AsyncStorageConfig } from '@/constants/AsyncStorageConfig';
import { DreamData } from '@/interfaces/DreamData';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import 'expo-standard-web-crypto'; // WebCrypto polyfill Expo
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';

const FORCE_ENCRYPTED_EXPORT = true as const; // sécurité compile-time

export default function DreamList() {
  const [dreams, setDreams] = useState<DreamData[]>([]);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ===== Prompt mot de passe =====
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdLabel, setPwdLabel] = useState('Mot de passe');
  const [pwdValue, setPwdValue] = useState('');
  const pwdResolveRef = useRef<null | ((v: string | null) => void)>(null);

  const promptPassword = (label: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      const v = window.prompt(label);
      return Promise.resolve(v ?? null);
    }
    setPwdLabel(label);
    setPwdValue('');
    setPwdVisible(true);
    return new Promise((resolve) => (pwdResolveRef.current = resolve));
  };
  const closePwd = (val: string | null) => {
    setPwdVisible(false);
    const r = pwdResolveRef.current;
    pwdResolveRef.current = null;
    r && r(val);
  };

  // ===== Data =====
  const fetchData = async () => {
    try {
      const arr: DreamData[] = await AsyncStorageService.getData(
        AsyncStorageConfig.keys.dreamsArrayKey
      );
      setDreams(arr || []);
    } catch (e) {
      console.error(e);
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

  const handleResetDreams = async () => await persist([]);
  const handleDeleteById = async (id: string) => {
    await persist(dreams.filter((d) => d.id !== id));
  };
  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm('Supprimer ce rêve ?')) handleDeleteById(id);
      return;
    }
    Alert.alert('Supprimer ce rêve ?', 'Action irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => handleDeleteById(id) },
    ]);
  };

  // ===== Encodage =====
  const te = new TextEncoder();
  // @ts-ignore
  const td = typeof TextDecoder !== 'undefined' ? new TextDecoder() : undefined;
  const utf8Decode = (b: Uint8Array) =>
    td ? td.decode(b) : String.fromCharCode(...b);
  const toHex = (u8: Uint8Array) =>
    Array.from(u8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  const fromHex = (hex: string) => {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++)
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  };

  // ===== AES-GCM (Expo WebCrypto) =====
  const subtle = () => {
    const s = (globalThis as any).crypto?.subtle;
    if (!s) throw new Error('WebCrypto indisponible');
    return s;
  };
  const rand = (n: number) => {
    const a = new Uint8Array(n);
    // @ts-ignore
    (globalThis.crypto as any).getRandomValues(a);
    return a;
  };
  const deriveKey = async (pwd: string, salt: Uint8Array) => {
    const base = await subtle().importKey('raw', te.encode(pwd), { name: 'PBKDF2' }, false, [
      'deriveKey',
    ]);
    return subtle().deriveKey(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };
  const encryptPayload = async (plaintext: string, pwd: string) => {
    const salt = rand(16);
    const iv = rand(12);
    const key = await deriveKey(pwd, salt);
    const ctBuf = await subtle().encrypt({ name: 'AES-GCM', iv }, key, te.encode(plaintext));
    return JSON.stringify({
      _enc: 'AESGCMv1',
      s: toHex(salt),
      iv: toHex(iv),
      ct: toHex(new Uint8Array(ctBuf)),
    });
  };
  const decryptPayload = async (packet: any, pwd: string) => {
    if (!packet || packet._enc !== 'AESGCMv1') throw new Error('Format inconnu');
    const key = await deriveKey(pwd, fromHex(packet.s));
    const pt = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromHex(packet.iv) },
      key,
      fromHex(packet.ct)
    );
    return utf8Decode(new Uint8Array(pt as ArrayBuffer));
  };

  // ===== Export chiffré (obligatoire) =====
  const shareDreamEncrypted = async (dream: DreamData) => {
    if (!FORCE_ENCRYPTED_EXPORT)
      throw new Error('Export non chiffré interdit');

    const pwd = await promptPassword('Mot de passe pour chiffrer ce rêve');
    if (!pwd) return;

    const packet = await encryptPayload(JSON.stringify(dream), pwd);

    // Validation stricte
    let parsed: any = null;
    try {
      parsed = JSON.parse(packet);
    } catch {}
    if (!parsed || parsed._enc !== 'AESGCMv1') {
      throw new Error('Paquet non chiffré détecté');
    }

    const filename = `${dream.id || 'dream'}.enc.json`;
    if (Platform.OS === 'web') {
      const blob = new Blob([JSON.stringify(parsed)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ message: JSON.stringify(parsed) });
    }
  };

  // ===== Import clair ou chiffré =====
  const triggerImport = () => {
    if (Platform.OS === 'web') fileInputRef.current?.click();
    else Alert.alert('Import', 'Disponible sur la cible web.');
  };
  const normalizeDream = (raw: any): DreamData | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id =
      raw.id || `dream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      dreamText: String(raw.dreamText ?? ''),
      isLucidDream: !!raw.isLucidDream,
      isNightmare: !!raw.isNightmare,
      isNormalDream: !!raw.isNormalDream,
      tone: raw.tone ?? null,
      clarity: Number.isFinite(raw.clarity) ? Number(raw.clarity) : undefined,
      emotionBefore: Number.isFinite(raw.emotionBefore)
        ? Number(raw.emotionBefore)
        : undefined,
      emotionAfter: Number.isFinite(raw.emotionAfter)
        ? Number(raw.emotionAfter)
        : undefined,
      hashtags: raw.hashtags ?? undefined,
      todayDate: raw.todayDate ?? new Date().toISOString(),
      characters: Array.isArray(raw.characters)
        ? raw.characters.map(String)
        : [],
      location: raw.location ?? '',
      personalMeaning: raw.personalMeaning ?? '',
      emotionalIntensity: Number.isFinite(raw.emotionalIntensity)
        ? Number(raw.emotionalIntensity)
        : undefined,
      sleepQuality: Number.isFinite(raw.sleepQuality)
        ? Number(raw.sleepQuality)
        : undefined,
      sleepDate: raw.sleepDate ?? new Date().toISOString(),
    };
  };
  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    try {
      const file = ev.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      let data: any;
      try {
        const maybe = JSON.parse(text);
        if (maybe && maybe._enc === 'AESGCMv1') {
          const pwd = await promptPassword('Mot de passe du fichier chiffré');
          if (!pwd) return;
          const clear = await decryptPayload(maybe, pwd);
          data = JSON.parse(clear);
        } else data = maybe;
      } catch {
        data = JSON.parse(text);
      }

      const incoming: DreamData[] = Array.isArray(data)
        ? (data.map(normalizeDream).filter(Boolean) as DreamData[])
        : ([normalizeDream(data)].filter(Boolean) as DreamData[]);
      if (incoming.length === 0) {
        Alert.alert('Import', 'Fichier sans rêve valide.');
        ev.target.value = '';
        return;
      }

      const map = new Map<string, DreamData>(dreams.map((d) => [d.id, d]));
      incoming.forEach((d) => map.set(d.id, d));
      await persist(Array.from(map.values()));
      if (Platform.OS === 'web')
        alert(`Import terminé: ${incoming.length} rêve(s).`);
    } catch (e) {
      console.error('Import échoué:', e);
      Alert.alert('Import', 'Impossible de lire le fichier.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const typeLabel = (d: DreamData) =>
    d.isLucidDream
      ? '🌙 Rêve lucide'
      : d.isNightmare
      ? '😱 Cauchemar'
      : d.isNormalDream
      ? '💤 Rêve normal'
      : '';

  // ===== Render =====
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
                  {format(new Date(dream.sleepDate), "dd MMMM yyyy 'à' HH:mm", {
                    locale: fr,
                  })}
                </Text>
              )}
              {dream.todayDate && (
                <Text style={styles.detail}>
                  📅 Date d’enregistrement :{' '}
                  {format(new Date(dream.todayDate), 'dd MMMM yyyy', {
                    locale: fr,
                  })}
                </Text>
              )}
              {dream.characters?.length > 0 && (
                <Text style={styles.detail}>
                  👥 Personnages : {dream.characters.join(', ')}
                </Text>
              )}
              {dream.location && (
                <Text style={styles.detail}>📍 Lieu : {dream.location}</Text>
              )}
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

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() =>
                    router.push({ pathname: '/modal', params: { id: dream.id } })
                  }
                  style={styles.actionBtn}
                >
                  ✏️ Éditer
                </Button>

                {/* unique export chiffré */}
                <Button
                  mode="outlined"
                  onPress={() => shareDreamEncrypted(dream)}
                  style={styles.actionBtn}
                >
                  🔐 Partager (chiffré)
                </Button>

                <Button
                  mode="contained"
                  onPress={() => confirmDelete(dream.id)}
                  style={styles.actionBtn}
                >
                  🗑️ Supprimer
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.noDream}>Aucun rêve enregistré</Text>
      )}

      <View style={styles.bottomActions}>
        <Button mode="contained" onPress={handleResetDreams} style={styles.bottomBtn}>
          Réinitialiser les rêves
        </Button>
        <Button mode="outlined" onPress={triggerImport} style={styles.bottomBtn}>
          📥 Importer un rêve
        </Button>
      </View>

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onFileSelected}
        />
      )}

      {/* Modal mot de passe mobile */}
      <Modal
        transparent
        visible={pwdVisible}
        animationType="fade"
        onRequestClose={() => closePwd(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pwdLabel}</Text>
            <TextInput
              mode="outlined"
              secureTextEntry
              value={pwdValue}
              onChangeText={setPwdValue}
              placeholder="Mot de passe"
            />
            <View
              style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}
            >
              <Button onPress={() => closePwd(null)} style={{ marginRight: 8 }}>
                Annuler
              </Button>
              <Button mode="contained" onPress={() => closePwd(pwdValue || '')}>
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  dreamText: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  lucid: { fontSize: 14, marginBottom: 4 },
  detail: { fontSize: 14, color: '#333', marginTop: 2 },
  noDream: { fontSize: 16, textAlign: 'center', color: '#777', marginTop: 20 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: { marginLeft: 8, marginTop: 6 },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  bottomBtn: { alignSelf: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});
