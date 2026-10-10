// One drawing per block type in the feed. BlockView skips any type it does not know: the server adds new ones.
import { useState } from 'react'
import { GestureResponderEvent, Linking, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Svg, { Polyline } from 'react-native-svg'
import type { Block, Feed, Tile } from './api'
import type { Theme } from './theme'

type Glyph = keyof typeof Ionicons.glyphMap
// The server may name any Ionicon; one this build does not have becomes a plain dot.
export const glyph = (name: string, or: Glyph = 'ellipse'): Glyph => (name in Ionicons.glyphMap ? (name as Glyph) : or)

const num = (n: number) => n.toLocaleString('en-US')
const plural = (n: number, one: string, many: string) => `${num(n)} ${n === 1 ? one : many}`
const short = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n))
// A round top for the y-axis whose half is a whole number too: 3 -> 4, 45 -> 60, 101 -> 200.
const niceMax = (n: number) => {
  if (n <= 2) return 2
  const pow = 10 ** Math.floor(Math.log10(n))
  return [1, 2, 4, 6, 8, 10].find((m) => n <= m * pow)! * pow
}

type Props = { t: Theme; accent: string }

export function BlockView({ block, feed, t, accent }: Props & { block: Block; feed: Feed }) {
  switch (block.type) {
    case 'hero': return <Heading t={t} eyebrow={block.greeting} title={block.title} line={block.line} />
    case 'tiles': return <Tiles t={t} tiles={block.tiles ?? []} />
    case 'chart': return <Chart t={t} accent={accent} b={block} />
    case 'list': return (
      <Card t={t} title={block.title}>
        {block.rows?.length ? block.rows.map((r, i) => (
          <View key={i} style={s.listRow}>
            <View style={s.between}>
              <Text style={[s.body, s.grow, { color: t.ink }]} numberOfLines={2}>{r.label}</Text>
              <Text style={[s.body, s.figure, { color: t.ink }]}>{r.value ?? num(r.n)}</Text>
            </View>
            <Meter t={t} color={accent} share={r.n / Math.max(...block.rows.map((x) => x.n), 1)} />
          </View>
        )) : <Text style={[s.body, { color: t.ink2 }]}>{block.empty}</Text>}
      </Card>
    )
    case 'posts': return (
      <Card t={t} title={block.title}>
        {(block.rows ?? []).map((r, i) => (
          <View key={i} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
            <Text style={[s.body, s.strong, { color: t.ink }]} numberOfLines={3}>{r.title}</Text>
            <Text style={[s.small, { color: t.ink2 }]}>{r.line}</Text>
          </View>
        ))}
      </Card>
    )
    case 'stars': return (
      <Card t={t} title={block.title}>
        {(block.rows ?? []).map((r) => (
          <View key={r.stars} style={s.starRow} accessible accessibilityLabel={`${r.stars} stars: ${r.n}, ${r.percent} percent`}>
            <Text style={[s.body, s.figure, { color: t.ink, width: 12 }]}>{r.stars}</Text>
            <Ionicons name="star" size={13} color={t.star} />
            <View style={s.grow}><Meter t={t} color={t.star} share={r.percent / 100} /></View>
            <Text style={[s.body, s.figure, { color: t.ink, width: 34, textAlign: 'right' }]}>{num(r.n)}</Text>
            <Text style={[s.small, s.figure, { color: t.ink2, width: 40, textAlign: 'right' }]}>{r.percent}%</Text>
          </View>
        ))}
      </Card>
    )
    case 'messages': return (
      <Card t={t} title={block.title}>
        {feed.messages?.length ? feed.messages.map((m, i) => (
          <View key={m.id} style={[s.row, s.message, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
            <View style={[s.avatar, { backgroundColor: t.fill }]}>
              <Text style={[s.strong, { color: t.ink, fontSize: 15 }]}>{(m.name || m.email || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.grow}>
              <Text style={[s.body, s.strong, { color: t.ink }]} numberOfLines={1}>{m.name || 'No name given'}</Text>
              {m.email ? (
                <Text style={[s.small, { color: t.ink2, textDecorationLine: 'underline' }]} numberOfLines={1} accessibilityRole="link" onPress={() => Linking.openURL(`mailto:${m.email}`)}>{m.email}</Text>
              ) : null}
              <Text style={[s.body, { color: t.ink, marginTop: 6 }]} selectable>{m.body}</Text>
              <Text style={[s.tiny, { color: t.ink3, marginTop: 6 }]}>{m.from} · {m.when}</Text>
            </View>
          </View>
        )) : <Text style={[s.body, { color: t.ink2 }]}>No messages yet.</Text>}
      </Card>
    )
    case 'ratings': return (
      <Card t={t} title={block.title}>
        {feed.ratings?.length ? feed.ratings.map((r, i) => (
          <View key={r.id} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
            <View style={s.between}>
              <View style={s.stars} accessible accessibilityLabel={`${r.stars} of 5 stars`}>
                {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={n <= r.stars ? 'star' : 'star-outline'} size={16} color={n <= r.stars ? t.star : t.ink3} />)}
              </View>
              <Text style={[s.small, { color: t.ink2 }]}>{r.when}</Text>
            </View>
            {r.comment ? <Text style={[s.body, { color: t.ink, marginTop: 6 }]} selectable>{r.comment}</Text> : null}
          </View>
        )) : <Text style={[s.body, { color: t.ink2 }]}>No ratings yet.</Text>}
      </Card>
    )
    default: return null
  }
}

// The large title at the top of a section; a hero block is the same thing with the server's words.
export function Heading({ t, eyebrow, title, line }: { t: Theme; eyebrow: string; title: string; line: string }) {
  return (
    <View style={s.heading}>
      <Text style={[s.small, s.strong, { color: t.ink2 }]}>{eyebrow}</Text>
      <Text style={[s.large, { color: t.ink }]} accessibilityRole="header">{title}</Text>
      <Text style={[s.body, { color: t.ink2 }]}>{line}</Text>
    </View>
  )
}

function Card({ t, title, children }: { t: Theme; title: string; children: React.ReactNode }) {
  return (
    <View style={[s.card, { backgroundColor: t.card }]}>
      <Text style={[s.title, { color: t.ink }]} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  )
}

function Meter({ t, color, share }: { t: Theme; color: string; share: number }) {
  return (
    <View style={[s.track, { backgroundColor: t.fill }]}>
      <View style={[s.trackFill, { backgroundColor: color, width: `${Math.max(0, Math.min(1, share)) * 100}%` }]} />
    </View>
  )
}

/* ---------- tiles ---------- */

// Two columns; an odd tile out takes the full width, as on the website.
function Tiles({ t, tiles }: { t: Theme; tiles: Tile[] }) {
  const rows: Tile[][] = []
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2))
  return (
    <View style={s.gap}>
      {rows.map((row, i) => (
        <View key={i} style={s.tileRow}>{row.map((tile, j) => <TileCard key={j} t={t} tile={tile} />)}</View>
      ))}
    </View>
  )
}

function TileCard({ t, tile }: { t: Theme; tile: Tile }) {
  const value = String(tile.value ?? '–')
  const c = tile.change
  return (
    <View style={[s.card, s.tile, { backgroundColor: t.card }]} accessible
      accessibilityLabel={`${tile.label}: ${value}${c ? `, ${c.up ? 'up' : 'down'} ${c.percent} percent` : ''}. ${tile.note ?? ''}`}>
      <View style={s.between}>
        <View style={[s.badge, { backgroundColor: tile.color || t.ink3 }]}><Ionicons name={glyph(tile.symbol)} size={17} color="#fff" /></View>
        {tile.trend && tile.trend.length > 1 ? <Spark points={tile.trend} color={tile.color || t.ink3} /> : null}
      </View>
      <Text style={[s.small, { color: t.ink2, marginTop: 10 }]} numberOfLines={1}>{tile.label}</Text>
      <View style={s.valueRow}>
        {/* Long values (a date, a long duration) step down a size rather than clip. */}
        <Text style={[s.value, { color: t.ink }, value.length > 11 ? { fontSize: 17, lineHeight: 22 } : value.length > 7 ? { fontSize: 22, lineHeight: 28 } : null]}>{value}</Text>
        {c ? (
          <View style={s.change}>
            <Ionicons name={c.up ? 'caret-up' : 'caret-down'} size={11} color={c.up ? t.up : t.down} />
            <Text style={[s.small, s.strong, s.figure, { color: c.up ? t.up : t.down }]}>{num(c.percent)}%</Text>
          </View>
        ) : null}
      </View>
      {tile.note ? <Text style={[s.tiny, { color: t.ink3 }]} numberOfLines={2}>{tile.note}</Text> : null}
    </View>
  )
}

function Spark({ points, color }: { points: number[]; color: string }) {
  const W = 64, H = 24, top = Math.max(...points, 1)
  const line = points.map((v, i) => `${(2 + (i / (points.length - 1)) * (W - 4)).toFixed(1)},${(H - 2 - (v / top) * (H - 4)).toFixed(1)}`).join(' ')
  return (
    <Svg width={W} height={H}>
      <Polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  )
}

/* ---------- bar chart ---------- */

const PLOT = 132, TICK = 72, OVER = 12

// Touch or drag across the plot to read a bar: the line under the title shows its tip and value.
function Chart({ t, accent, b }: Props & { b: Extract<Block, { type: 'chart' }> }) {
  const [w, setW] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const pts = b.points ?? []
  const n = pts.length
  if (!n) return <Card t={t} title={b.title}><Text style={[s.body, { color: t.ink2 }]}>No {b.many} yet.</Text></Card>

  const total = pts.reduce((sum, p) => sum + p.n, 0)
  const peak = pts.reduce((a, p) => (p.n >= a.n ? p : a)) // latest on a tie
  const top = niceMax(peak.n)
  const slot = w / n
  const bar = Math.max(1, Math.min(28, slot - 2))
  const pick = (e: GestureResponderEvent, toggle: boolean) => {
    const i = Math.floor(e.nativeEvent.locationX / slot)
    if (i >= 0 && i < n) setSel(toggle && i === sel ? null : i)
  }
  const on = sel === null ? null : pts[sel]
  const summary = total === 0 ? `No ${b.many} in this period` : b.plain ? `Most: ${peak.tip} · ${plural(peak.n, b.one, b.many)}` : `${num(total)} total · peak ${num(peak.n)}, ${peak.tip}`
  // A timeline's last bar is the day, week or month still running.
  const caption = on ? `${plural(on.n, b.one, b.many)} · ${on.tip}${!b.plain && sel === n - 1 ? ' · so far' : ''}` : summary

  // As many tick labels as fit: a timeline counts back from "now", a plain chart counts from the left.
  // The end label is pushed inwards to stay on the card (a timeline's may hang OVER px into the padding),
  // so its neighbour needs that much more room. Widths are estimated: about 6px a character at this size.
  const label = Math.max(...pts.map((p) => p.tick.length)) * 6 + 12
  const over = b.plain ? 0 : OVER
  const step = slot ? Math.max(1, Math.ceil((label + Math.max(0, (label - slot) / 2 - over)) / slot)) : 1
  const labelled = (i: number) => (b.plain ? i : n - 1 - i) % step === 0

  return (
    <Card t={t} title={b.title}>
      <Text style={[s.small, s.figure, { color: on ? t.ink : t.ink2, marginTop: -6, marginBottom: 14 }]} numberOfLines={1}>{caption}</Text>
      <View style={s.plotRow} accessible accessibilityLabel={`${b.title}. ${summary}.`}>
        <View style={s.axis}>
          {[top, top / 2, 0].map((v) => <Text key={v} allowFontScaling={false} style={[s.tiny, s.figure, { color: t.ink3 }]}>{short(v)}</Text>)}
        </View>
        <View style={s.grow}>
          <View style={{ height: PLOT }} onLayout={(e) => setW(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true} onResponderGrant={(e) => pick(e, true)} onResponderMove={(e) => pick(e, false)}>
            {/* pointerEvents none: the touch then lands on the plot itself, so locationX is measured from its left edge. */}
            <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
              {[0, 0.5, 1].map((f) => <View key={f} style={[s.grid, { top: f * (PLOT - 1), backgroundColor: t.line }]} />)}
              <View style={s.bars}>
                {pts.map((p, i) => (
                  <View key={i} style={s.slot}>
                    {p.n > 0 ? (
                      <View style={{
                        width: bar, height: Math.max(3, (p.n / top) * PLOT), backgroundColor: accent,
                        borderTopLeftRadius: Math.min(4, bar / 2), borderTopRightRadius: Math.min(4, bar / 2),
                        opacity: sel === null ? (!b.plain && i === n - 1 ? 0.55 : 1) : i === sel ? 1 : 0.3,
                      }} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={s.ticks}>
            {w > 0 && pts.map((p, i) => {
              if (!labelled(i)) return null
              const x = i * slot + slot / 2 - TICK / 2
              return (
                <Text key={i} numberOfLines={1} allowFontScaling={false} style={[s.tiny, s.tick, { color: i === sel ? t.ink : t.ink3, left: Math.max(0, Math.min(w - TICK + over, x)), textAlign: x < 0 ? 'left' : x > w - TICK + over ? 'right' : 'center' }]}>{p.tick}</Text>
              )
            })}
          </View>
        </View>
      </View>
    </Card>
  )
}

const s = StyleSheet.create({
  gap: { gap: 12 },
  grow: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  card: { borderRadius: 16, borderCurve: 'continuous', padding: 16 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600', marginBottom: 10 },
  large: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 20 },
  small: { fontSize: 13, lineHeight: 18 },
  tiny: { fontSize: 12, lineHeight: 16 },
  strong: { fontWeight: '600' },
  figure: { fontVariant: ['tabular-nums'] },
  heading: { gap: 2, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },

  row: { paddingVertical: 12 },
  listRow: { paddingVertical: 8, gap: 6 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7 },
  stars: { flexDirection: 'row', gap: 2 },
  message: { flexDirection: 'row', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  tileRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, padding: 14 },
  badge: { width: 32, height: 32, borderRadius: 9, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, marginTop: 2, marginBottom: 2 },
  value: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  plotRow: { flexDirection: 'row', gap: 8 },
  axis: { height: PLOT + 16, marginTop: -8, justifyContent: 'space-between', alignItems: 'flex-end' }, // each label centred on its grid line
  grid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: PLOT },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: PLOT },
  ticks: { height: 22 },
  tick: { position: 'absolute', top: 6, width: TICK },
})
