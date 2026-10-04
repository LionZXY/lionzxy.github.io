import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (/\.(?:js|jsx|css|html)$/.test(entry.name)) files.push(path)
  }
  return files
}

test('runtime source cannot fetch externally hosted static data', async () => {
  const forbidden = [
    /\bfetch\s*\(\s*[`'"]https?:\/\//,
    /\b(?:axios\.(?:get|post)|XMLHttpRequest|EventSource|WebSocket)\b/,
    /\b(?:tileLayer|setUrl)\s*\(\s*[`'"]https?:\/\//,
    /\b(?:src|srcSet)\s*=\s*[{]?\s*[`'"]https?:\/\//,
    /url\(\s*[`'"]?https?:\/\//,
  ]
  const violations = []
  for (const file of await sourceFiles(join(root, 'src'))) {
    const source = await readFile(file, 'utf8')
    for (const pattern of forbidden) {
      if (pattern.test(source)) violations.push(`${file.slice(root.length + 1)}: ${pattern}`)
    }
  }
  assert.deepEqual(violations, [], `external runtime static-data requests found:\n${violations.join('\n')}`)
})

test('location widget uses a valid checked-in map asset', async () => {
  const locationModule = await import(new URL('../src/data/location.js', import.meta.url))
  const location = locationModule.location
  assert.deepEqual(location, {
    city: 'London',
    country: 'UK',
    label: 'London, UK',
    latitude: 51.4805,
    longitude: -0.005,
    timezone: 'Europe/London',
    mapAsset: 'images/map-london.svg',
    mapLink: 'https://www.google.com/maps/@51.4805,-0.005,11z',
  })
  assert.match(location.mapAsset, /^images\/[a-z0-9-]+\.svg$/)

  const asset = await readFile(join(root, 'public', location.mapAsset), 'utf8')
  assert.match(asset, /^<svg\b/)
  assert.match(asset, /<title[^>]*>Map of London<\/title>/)
  assert.doesNotMatch(asset, /(?:href|src)\s*=\s*["']https?:\/\//i)
  assert.doesNotMatch(asset, /url\(\s*["']?https?:\/\//i)
  assert.doesNotMatch(asset, /(?:Invalid apiKey|Unauthorized)/i)
})
