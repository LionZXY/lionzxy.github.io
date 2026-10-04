import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { location } from '../src/data/location.js'
const root = fileURLToPath(new URL('..', import.meta.url))
async function sourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (/\.(?:js|jsx|css|html)$/.test(entry.name)) files.push(path)
  }
  return files
}
test('runtime source cannot fetch external static data or contain a basemap credential', async () => {
  const forbidden = [/\bfetch\s*\(\s*[`'"]https?:\/\//, /\b(?:axios\.(?:get|post)|XMLHttpRequest|EventSource|WebSocket)\b/, /\b(?:tileLayer|setUrl)\s*\(\s*[`'"]https?:\/\//, /\b(?:src|srcSet)\s*=\s*[{]?\s*[`'"]https?:\/\//, /url\(\s*[`'"]?https?:\/\//, /cb1_[a-z0-9_]+/i]
  const violations = []
  for (const file of [...await sourceFiles(join(root, 'src')), join(root, 'index.html')]) {
    const source = await readFile(file, 'utf8')
    for (const pattern of forbidden) if (pattern.test(source)) violations.push(`${file}: ${pattern}`)
  }
  assert.deepEqual(violations, [])
  assert.match(location.tilePath, /^maps\/carto\/light_all\/\{z\}\/\{x\}\/\{y\}\{r\}\.png$/)
})
test('normal/retina tile cache is complete, genuine, and unchanged since capture', async () => {
  const directory = join(root, 'public/maps/carto/light_all')
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
  assert.equal(location.zoom, 10)
  assert.deepEqual(location.center, [51.49, -0.06])
  assert.equal(location.latitude, 51.4805)
  assert.equal(location.longitude, -0.005)
  assert.equal(location.timezone, 'Europe/London')
  assert.equal(manifest.zoom, location.zoom)
  const paths = new Set(manifest.tiles.map(({ path }) => path))
  assert.equal(paths.size, 32)
  for (let x = 510; x <= 513; x++) for (let y = 339; y <= 342; y++) for (const suffix of ['', '@2x']) assert(paths.has(`10/${x}/${y}${suffix}.png`), 'missing tile')
  for (const tile of manifest.tiles) {
    assert.match(tile.path, /^10\/\d+\/\d+(@2x)?\.png$/)
    const bytes = await readFile(join(directory, tile.path))
    const hash = createHash('sha256').update(bytes).digest('hex')
    assert.equal(hash, tile.sha256, `changed/corrupted tile ${tile.path}`)
    assert.notEqual(hash, '69be4aecf9f814ba45d585801a5aa41e79b16fc88eafec5b1954a9f06a69e6be', 'API KEY REQUIRED placeholder')
    assert.equal(bytes.length, tile.bytes)
    const png = PNG.sync.read(bytes, { checkCRC: true })
    const size = tile.path.includes('@2x') ? 512 : 256
    assert.equal(png.width, size); assert.equal(png.height, size)
  }
})
