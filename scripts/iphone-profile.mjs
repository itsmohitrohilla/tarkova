// Writes tarkova-admin.mobileconfig: a file that puts the owner's dashboard (api/admin.js) on an iPhone's home
// screen as a full-screen app with the Tarkova icon.
//   node --env-file=.env scripts/iphone-profile.mjs [https://www.tarkova.com]
// Send the file to the iPhone (AirDrop, or email it to yourself), then Settings > Profile Downloaded > Install.
// iOS says "Not Signed": that is expected for a file you made yourself. The file holds the admin address, which
// contains ADMIN_KEY, so it is gitignored: never share or commit it. Removing the profile removes the app.
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const site = (process.argv[2] || 'https://www.tarkova.com').replace(/\/$/, '')
const key = process.env.ADMIN_KEY
if (!key) throw new Error('ADMIN_KEY is missing: run with --env-file=.env')
const xml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const icon = readFileSync(new URL('../public/apple-touch-icon.png', import.meta.url)).toString('base64')

const profile = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key><string>com.apple.webClip.managed</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>PayloadIdentifier</key><string>com.tarkova.admin.webclip</string>
      <key>PayloadUUID</key><string>${randomUUID().toUpperCase()}</string>
      <key>PayloadDisplayName</key><string>Tarkova Admin</string>
      <key>Label</key><string>Tarkova</string>
      <key>URL</key><string>${xml(`${site}/admin/${encodeURIComponent(key)}/`)}</string>
      <key>Icon</key><data>${icon}</data>
      <key>FullScreen</key><true/>
      <key>IgnoreManifestScope</key><true/>
      <key>IsRemovable</key><true/>
      <key>Precomposed</key><true/>
    </dict>
  </array>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadVersion</key><integer>1</integer>
  <key>PayloadIdentifier</key><string>com.tarkova.admin</string>
  <key>PayloadUUID</key><string>${randomUUID().toUpperCase()}</string>
  <key>PayloadDisplayName</key><string>Tarkova Admin</string>
  <key>PayloadDescription</key><string>Adds the Tarkova admin dashboard to the home screen.</string>
  <key>PayloadOrganization</key><string>Tarkova</string>
</dict>
</plist>
`
const out = new URL('../tarkova-admin.mobileconfig', import.meta.url)
writeFileSync(out, profile)
console.log(`Wrote ${out.pathname}\nIt opens ${site}/admin/<ADMIN_KEY>/ (the dashboard must be live there first).`)
