// Authoring only. Production/CI never run this or require a credential.
// Supply the key on stdin via a masked terminal prompt, never argv or a file.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import process from 'node:process'
import { PNG } from 'pngjs'
let key = ''
for await (const chunk of process.stdin) key += chunk
key = key.trim()
if (!key) throw new Error('Supply a CARTO authoring key on stdin')
const directory = new URL('../public/maps/carto/light_all/', import.meta.url)
const placeholderHash = '69be4aecf9f814ba45d585801a5aa41e79b16fc88eafec5b1954a9f06a69e6be'
const manifest = { provider: 'CARTO Positron light_all', source: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', captured: new Date().toISOString().slice(0, 10), zoom: 10, x: [510, 513], y: [339, 342], tiles: [] }
for (let x = 510; x <= 513; x++) {
  await mkdir(new URL(`10/${x}/`, directory), { recursive: true })
  for (let y = 339; y <= 342; y++) {
    for (const retina of [false, true]) {
      const path = `10/${x}/${y}${retina ? '@2x' : ''}.png`
      let bytes
      try {
        const response = await fetch(`https://a.basemaps.cartocdn.com/light_all/${path}?key=${encodeURIComponent(key)}`, { headers: { Referer: 'https://lionzxy.github.io/' }, signal: AbortSignal.timeout(30_000) })
        if (!response.ok) throw new Error('HTTP error')
        bytes = Buffer.from(await response.arrayBuffer())
      } catch { throw new Error(`Unable to fetch tile ${path}`) } // No credential-bearing URL in errors.
      const png = PNG.sync.read(bytes, { checkCRC: true })
      const sha256 = createHash('sha256').update(bytes).digest('hex')
      const size = retina ? 512 : 256
      if (png.width !== size || png.height !== size || sha256 === placeholderHash) throw new Error(`Invalid/watermarked tile ${path}`)
      await writeFile(new URL(path, directory), bytes)
      manifest.tiles.push({ path, bytes: bytes.length, sha256 })
    }
  }
}
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n')
console.log(`Validated and saved ${manifest.tiles.length} normal/retina PNG tiles`)
