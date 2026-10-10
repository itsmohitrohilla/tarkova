// Site switch and period picker on top, the chosen section's blocks in the middle, the site's sections as tabs below.
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Feed } from './api'
import { BlockView, Heading, glyph } from './Blocks'
import { Notice } from './SignIn'
import type { Theme } from './theme'

type Props = { t: Theme; feed: Feed; error: string; refreshing: boolean; onRefresh: () => void; onSignOut: () => void }

export default function Dashboard({ t, feed, error, refreshing, onRefresh, onSignOut }: Props) {
  const insets = useSafeAreaInsets()
  const [siteId, setSiteId] = useState(feed.sites[0].id)
  const [sectionId, setSectionId] = useState('')
  const [periodKey, setPeriodKey] = useState(feed.defaultPeriod)

  // Looked up by id on every draw, so a refreshed feed (or the other site, which lacks this section) still lands somewhere.
  const site = feed.sites.find((x) => x.id === siteId) ?? feed.sites[0]
  const section = site.sections.find((x) => x.id === sectionId) ?? site.sections[0]
  const period = feed.periods.find((p) => p.key === periodKey) ?? feed.periods[0]
  const blocks = section?.blocks?.[period?.key] ?? []

  return (
    <View style={[s.fill, { backgroundColor: t.bg }]}>
      <View style={[s.top, { paddingTop: insets.top + 6 }]}>
        <View style={s.topRow}>
          <View style={s.fill}>
            <Segmented t={t} value={site.id} onChange={setSiteId} options={feed.sites.map((x) => ({ key: x.id, label: x.name, hint: x.name, dot: x.color }))} />
          </View>
          <Pressable onPress={onSignOut} hitSlop={8} accessibilityRole="button" accessibilityLabel="Sign out" style={({ pressed }) => [s.out, pressed && s.pressed]}>
            <Ionicons name="log-out-outline" size={24} color={t.ink2} />
          </Pressable>
        </View>
        <Segmented t={t} value={period?.key} onChange={setPeriodKey} options={feed.periods.map((p) => ({ key: p.key, label: p.label, hint: p.name }))} />
      </View>

      {/* The key starts each site and section at the top; changing the period keeps your place. */}
      <ScrollView key={`${site.id}/${section?.id}`} style={s.fill} contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.ink2} />}>
        {error ? <Notice t={t} text={error} action="Try again" onPress={onRefresh} /> : null}
        {blocks[0]?.type !== 'hero' && section ? <Heading t={t} eyebrow={site.name} title={section.title} line={period?.name ?? ''} /> : null}
        {blocks.map((block, i) => <BlockView key={`${period?.key}/${i}`} t={t} accent={site.color} feed={feed} block={block} />)}
        <Text style={[s.foot, { color: t.ink3 }]}>Loaded {feed.loaded} · pull down to refresh</Text>
      </ScrollView>

      <View style={[s.tabs, { backgroundColor: t.card, borderTopColor: t.line, paddingBottom: insets.bottom }]} accessibilityRole="tablist">
        {site.sections.map((x) => {
          const on = x.id === section.id
          return (
            <Pressable key={x.id} onPress={() => setSectionId(x.id)} style={({ pressed }) => [s.tab, pressed && s.pressed]}
              accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={x.title}>
              <Ionicons name={on ? glyph(x.symbol) : glyph(`${x.symbol}-outline`, glyph(x.symbol))} size={24} color={on ? site.color : t.ink3} />
              <Text style={[s.tabLabel, { color: on ? t.ink : t.ink2, fontWeight: on ? '600' : '400' }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{x.title}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

type Option = { key: string; label: string; hint: string; dot?: string }

// The iOS segmented control: a grey track and a raised thumb. Colour is a dot beside the label, never the label.
function Segmented({ t, options, value, onChange }: { t: Theme; options: Option[]; value: string; onChange: (key: string) => void }) {
  return (
    <View style={[s.track, { backgroundColor: t.fill }]}>
      {options.map((o) => {
        const on = o.key === value
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} hitSlop={{ top: 6, bottom: 6 }}
            style={[s.segment, on && [s.thumb, { backgroundColor: t.thumb }]]}
            accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={o.hint}>
            {o.dot ? <View style={[s.dot, { backgroundColor: o.dot }]} /> : null}
            <Text style={[s.segmentLabel, { color: t.ink, fontWeight: on ? '600' : '400' }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  pressed: { opacity: 0.5 },
  top: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  out: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28, gap: 12 },
  foot: { fontSize: 12, lineHeight: 16, textAlign: 'center', marginTop: 8 },

  track: { flexDirection: 'row', borderRadius: 9, borderCurve: 'continuous', padding: 2 },
  segment: { flex: 1, height: 32, borderRadius: 7, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thumb: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  segmentLabel: { fontSize: 14, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  tabs: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10, lineHeight: 13 },
})
