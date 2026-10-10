// The sign-in form, and the small message card (Notice) the other screens use for errors too.
import { useRef, useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ApiError, Creds, signIn, tidy } from './api'
import type { Theme } from './theme'

export const TARKOVA = '#5856d6'
export const DEFAULT_SERVER = 'https://www.tarkova.com'

const FIELDS = [
  { name: 'server', label: 'Server', placeholder: DEFAULT_SERVER, keyboardType: 'url', secure: false, content: 'URL' },
  { name: 'key', label: 'Admin key', placeholder: 'From your admin address', keyboardType: 'default', secure: true, content: 'none' },
  { name: 'username', label: 'Username', placeholder: 'Username', keyboardType: 'default', secure: false, content: 'username' },
  { name: 'password', label: 'Password', placeholder: 'Password', keyboardType: 'default', secure: true, content: 'password' },
] as const

type Props = { t: Theme; saved: Creds | null; notice: string; onSignedIn: (creds: Creds) => void }

export default function SignIn({ t, saved, notice, onSignedIn }: Props) {
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState<Creds>(saved ?? { server: DEFAULT_SERVER, key: '', username: '', password: '' })
  const [error, setError] = useState(notice)
  const [busy, setBusy] = useState(false)
  const inputs = useRef<(TextInput | null)[]>([])
  const ready = FIELDS.every((f) => form[f.name].trim())

  // One request per tap, and the button is off while it runs: the server allows five tries in ten minutes.
  const submit = async () => {
    if (!ready || busy) return
    const creds = tidy(form)
    setBusy(true)
    setError('')
    try {
      await signIn(creds)
      onSignedIn(creds)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={[s.fill, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.page, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Image source={require('../assets/icon.png')} style={s.mark} accessibilityLabel="Tarkova" />
        <Text style={[s.title, { color: t.ink }]} accessibilityRole="header">Tarkova</Text>
        <Text style={[s.sub, { color: t.ink2 }]}>Sign in to your dashboard</Text>

        <View style={[s.group, { backgroundColor: t.card }]}>
          {FIELDS.map((f, i) => (
            <View key={f.name} style={[s.field, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
              <Text style={[s.label, { color: t.ink }]}>{f.label}</Text>
              <TextInput
                ref={(el) => { inputs.current[i] = el }}
                style={[s.input, { color: t.ink }]}
                value={form[f.name]}
                onChangeText={(text) => setForm({ ...form, [f.name]: text })}
                placeholder={f.placeholder}
                placeholderTextColor={t.ink3}
                accessibilityLabel={f.label}
                keyboardType={f.keyboardType}
                secureTextEntry={f.secure}
                textContentType={f.content}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                clearButtonMode="while-editing"
                selectionColor={TARKOVA}
                returnKeyType={i < FIELDS.length - 1 ? 'next' : 'go'}
                submitBehavior={i < FIELDS.length - 1 ? 'submit' : 'blurAndSubmit'}
                onSubmitEditing={() => (i < FIELDS.length - 1 ? inputs.current[i + 1]?.focus() : submit())}
              />
            </View>
          ))}
        </View>
        <Text style={[s.help, { color: t.ink2 }]}>The admin key is the long part of your dashboard address, after /admin/. Your details are kept in this iPhone's keychain.</Text>

        {error ? <Notice t={t} text={error} /> : null}

        <Pressable onPress={submit} disabled={!ready || busy} accessibilityRole="button" accessibilityLabel="Sign in" accessibilityState={{ disabled: !ready || busy, busy }}
          style={({ pressed }) => [s.button, { backgroundColor: TARKOVA, opacity: !ready || busy ? 0.45 : pressed ? 0.75 : 1 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonLabel}>Sign in</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function Notice({ t, text, action, onPress }: { t: Theme; text: string; action?: string; onPress?: () => void }) {
  return (
    <View style={[s.notice, { backgroundColor: t.card }]} accessibilityRole="alert">
      <View style={s.noticeRow}>
        <Ionicons name="alert-circle" size={20} color={t.down} />
        <Text style={[s.noticeText, s.fill, { color: t.ink }]}>{text}</Text>
      </View>
      {action ? (
        <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.5 }}>
          <Text style={[s.noticeText, s.action, { color: t.ink }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  page: { flexGrow: 1, paddingHorizontal: 16, gap: 12 },
  mark: { width: 84, height: 84, borderRadius: 19, borderCurve: 'continuous', alignSelf: 'center' },
  title: { fontSize: 34, lineHeight: 41, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 17, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  group: { borderRadius: 16, borderCurve: 'continuous', paddingLeft: 16 },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 50 },
  label: { width: 98, fontSize: 17 },
  input: { flex: 1, fontSize: 17, paddingVertical: 14, paddingRight: 12 },
  help: { fontSize: 13, lineHeight: 18, paddingHorizontal: 16 },
  button: { height: 52, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonLabel: { color: '#fff', fontSize: 17, fontWeight: '600' },
  notice: { borderRadius: 16, borderCurve: 'continuous', padding: 16, gap: 10 },
  noticeRow: { flexDirection: 'row', gap: 8 },
  noticeText: { fontSize: 15, lineHeight: 20 },
  action: { fontWeight: '600', textDecorationLine: 'underline' },
})
