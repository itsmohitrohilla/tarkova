// Tarkova: the admin dashboard for Tarkova and Crowkis, for one person, run in Expo Go.
// This file holds the whole flow: read the keychain, sign in, load the feed, show the dashboard, sign out.
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import { ApiError, Creds, Feed, getFeed, signOut } from './src/api'
import Dashboard from './src/Dashboard'
import SignIn, { Notice } from './src/SignIn'
import { useTheme } from './src/theme'

// The four sign-in fields, in the iPhone keychain. Never fatal: without them the app just asks again.
const SLOT = 'tarkova.signin'
const remember = (c: Creds) => SecureStore.setItemAsync(SLOT, JSON.stringify(c)).catch(() => {})
const recall = async (): Promise<Creds | null> => {
  try { return JSON.parse((await SecureStore.getItemAsync(SLOT)) || 'null') } catch { return null }
}

export default function App() {
  const t = useTheme()
  const [saved, setSaved] = useState<Creds | null | undefined>(undefined) // undefined: the keychain has not answered yet
  const [signedIn, setSignedIn] = useState(false)
  const [feed, setFeed] = useState<Feed | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (c: Creds) => {
    setLoading(true)
    try {
      setFeed(await getFeed(c))
      setError('')
    } catch (e) {
      // 401: the 30-day session ran out. Back to the form, already filled in, for one tap; never an automatic retry.
      if (e instanceof ApiError && e.status === 401) leave('Your session has ended. Sign in again.')
      else setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }
  const enter = (c: Creds) => { setSaved(c); setSignedIn(true); setNotice(''); load(c) }
  const leave = (why = '') => { setSignedIn(false); setFeed(null); setError(''); setNotice(why) }

  useEffect(() => {
    recall().then((c) => (c?.password ? enter(c) : setSaved(c)))
  }, [])

  // Signing out ends the session on the server and forgets the password here; the server and key stay filled in.
  const confirmSignOut = () => Alert.alert('Sign out?', 'You will need your password to sign in again.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => {
      if (!saved) return
      const kept = { ...saved, password: '' }
      signOut(saved).catch(() => {})
      remember(kept)
      setSaved(kept)
      leave()
    } },
  ])

  let screen
  if (saved === undefined) screen = <View style={[s.center, { backgroundColor: t.bg }]} />
  else if (!signedIn) screen = <SignIn key={notice} t={t} saved={saved} notice={notice} onSignedIn={(c) => { remember(c); enter(c) }} />
  else if (feed) screen = <Dashboard t={t} feed={feed} error={error} refreshing={loading} onRefresh={() => load(saved!)} onSignOut={confirmSignOut} />
  else screen = (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      {loading ? <ActivityIndicator size="large" color={t.ink2} /> : (
        <View style={s.stack}>
          <Notice t={t} text={error} action="Try again" onPress={() => load(saved!)} />
          <Pressable onPress={confirmSignOut} hitSlop={12} accessibilityRole="button" style={s.link}><Text style={[s.linkText, { color: t.ink2 }]}>Sign out</Text></Pressable>
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {screen}
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  stack: { gap: 16 },
  link: { alignSelf: 'center' },
  linkText: { fontSize: 15, lineHeight: 20 },
})
