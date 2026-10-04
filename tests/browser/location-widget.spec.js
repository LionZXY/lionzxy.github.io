import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
const origin = 'http://127.0.0.1:4173'
const freeze = '.card-animate { animation:none !important; opacity:1 !important; transform:none !important; } .map-pin-outer { animation:none !important; }'

async function tilesReady(page) {
  await expect.poll(() => page.locator('img.leaflet-tile').evaluateAll((images) => images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) === 1))).toBe(true)
}
async function geometry(page) {
  return page.getByTestId('location-map').evaluate((map) => {
    const rect = map.getBoundingClientRect()
    const tiles = [...map.querySelectorAll('.leaflet-tile-loaded')].map((tile) => tile.getBoundingClientRect())
    let covered = true
    for (const fx of [.01,.25,.5,.75,.99]) for (const fy of [.01,.5,.99]) {
      const x = rect.left + rect.width * fx, y = rect.top + rect.height * fy
      if (!tiles.some((tile) => tile.left <= x && tile.right >= x && tile.top <= y && tile.bottom >= y)) covered = false
    }
    const marker = map.querySelector('.map-marker-custom').getBoundingClientRect()
    const project = (lat, lng) => { const sine = Math.sin(lat * Math.PI / 180); return [262144 * (lng / 360 + .5), 262144 * (.5 - Math.log((1+sine)/(1-sine))/(4*Math.PI))] }
    const center = project(51.49,-.06), pin = project(51.4805,-.005)
    const expected = [Math.round(pin[0])-Math.round(center[0]-map.clientWidth/2),Math.round(pin[1])-Math.round(center[1]-map.clientHeight/2)]
    const delta = [(marker.left+marker.right)/2-rect.left-expected[0],(marker.top+marker.bottom)/2-rect.top-expected[1]]
    return { covered, centered: delta.every((v) => Math.abs(v) <= 1), delta }
  })
}

test('local map loads without third-party requests and survives all responsive layouts', async ({ page }, info) => {
  const external = [], errors = [], failed = [], httpErrors = []
  page.on('request', (request) => { if (new URL(request.url()).origin !== origin) external.push(request.url()) })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`) })
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText ?? 'unknown error'
    // Removing obsolete tiles during resize legitimately cancels their requests.
    // Every still-visible image and all real HTTP/network failures are checked.
    if (!/NS_BINDING_ABORTED|ERR_ABORTED|cancelled/i.test(error)) failed.push(`${request.url()}: ${error}`)
  })
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('.map-pin-outer')).toHaveCSS('animation-name', 'mapPulse')
  await expect(page.locator('.map-pin-outer')).toHaveCSS('animation-duration', '2s')
  await page.addStyleTag({ content: freeze })
  await tilesReady(page)
  const map = page.getByTestId('location-map'), card = page.locator('.map-card')
  await expect(map).toHaveAttribute('aria-label', 'Map showing London, UK')
  await expect(page.getByTestId('location-label')).toHaveText('London, UK')
  await expect(card.locator('.map-link')).toHaveAttribute('href', 'https://www.google.com/maps/@51.4805,-0.005,11z')
  await expect(card.locator('.map-attribution')).toBeVisible()
  const sizes = await map.locator('img.leaflet-tile').evaluateAll((images) => images.map((image) => image.naturalWidth))
  expect(sizes.length).toBeGreaterThan(0)
  expect(sizes.every((size) => size === (info.project.use.deviceScaleFactor > 1 ? 512 : 256))).toBe(true)
  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const cards = [...document.querySelectorAll('.bento-grid .card')].map((card) => card.getBoundingClientRect())
    const map = document.querySelector('[data-testid="location-map"]').getBoundingClientRect()
    const parent = document.querySelector('.map-card').getBoundingClientRect()
    const label = document.querySelector('.map-overlay').getBoundingClientRect()
    const overlaps = []
    for (let i=0;i<cards.length;i++) for (let j=i+1;j<cards.length;j++) {
      const a=cards[i],b=cards[j]
      if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)overlaps.push([i,j])
    }
    return { overflow:document.documentElement.scrollWidth>viewport, inside:cards.every((card)=>card.left>=-1&&card.right<=viewport+1&&card.width>0&&card.height>0), fills:['left','right','top','bottom'].every((edge)=>Math.abs(map[edge]-parent[edge])<=1), labelInside:label.left>=parent.left&&label.right<=parent.right&&label.top>=parent.top&&label.bottom<=parent.bottom, overlaps }
  })
  expect(layout).toEqual({ overflow:false, inside:true, fills:true, labelInside:true, overlaps:[] })
  await map.screenshot({ path:info.outputPath('map.png') })
  if ([320,768,1440].includes(info.project.use.viewport.width)) await page.screenshot({ path:info.outputPath('page.png'), fullPage:true })
  for (const width of [320,641,1025,info.project.use.viewport.width]) {
    await page.setViewportSize({ width, height:info.project.use.viewport.height })
    await expect.poll(async () => { const result=await geometry(page); return result.covered&&result.centered }).toBe(true)
    await tilesReady(page)
  }
  expect(external).toEqual([]);expect(errors).toEqual([]);expect(failed).toEqual([]);expect(httpErrors).toEqual([])
})

test('map CSS pixels match original f4582ce Leaflet and frozen original styles', async ({ page }, info) => {
  // Original URL template, genuine recorded responses, no network or credentials.
  await page.route('**/*', async (route) => {
    const url=new URL(route.request().url())
    if(url.origin===origin)return route.continue()
    if(/^[abcd]\.basemaps\.cartocdn\.com$/.test(url.hostname)) {
      const match=url.pathname.match(/^\/light_all\/(10\/\d+\/\d+(?:@2x)?\.png)$/)
      if(match)return route.fulfill({ contentType:'image/png', body:await readFile(new URL(`../../public/maps/carto/light_all/${match[1]}`,import.meta.url)) })
    }
    return route.abort()
  })
  await page.goto('/', { waitUntil:'networkidle' })
  await page.addStyleTag({ content:freeze })
  await tilesReady(page)
  // Normalize position only, not native CSS size, to eliminate fractional-scroll
  // compositor differences when substituting the original map in the same card.
  await page.locator('.map-card').evaluate((card) => {
    const rect=card.getBoundingClientRect()
    Object.assign(card.style,{ position:'fixed',left:'0px',top:'0px',width:`${rect.width}px`,height:`${rect.height}px`,zIndex:'10000' })
  })
  await tilesReady(page)
  // Compare native CSS-pixel rendering at each actual emulated DPR. Full-DPR
  // quality screenshots are captured by the layout test; native @2x PNG sizes
  // are also asserted there. This avoids Chromium's fractional raster-decoder
  // interpolation seams without adding any pixel-difference tolerance.
  const current=await page.getByTestId('location-map').screenshot({ path:info.outputPath('local-map.png'), scale:'css' })
  await page.addStyleTag({ content:await readFile(new URL('../fixtures/original-map.css',import.meta.url),'utf8') })
  await page.addScriptTag({ content:await readFile(new URL('../../node_modules/leaflet/dist/leaflet.js',import.meta.url),'utf8') })
  await page.evaluate(() => {
    // Exact original map, tile and marker options from f4582ce.
    const element=document.createElement('div')
    element.setAttribute('data-testid','original-map');element.style.width='100%';element.style.height='100%'
    document.querySelector('.map-link').replaceChildren(element)
    const L=window.L
    const map=L.map(element,{ zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,keyboard:false }).setView([51.49,-.06],10)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{ maxZoom:19,subdomains:'abcd' }).addTo(map)
    const icon=L.divIcon({ className:'map-marker-custom',html:'<div class="map-pin-outer"><div class="map-pin-inner"></div></div>',iconSize:[36,36],iconAnchor:[18,18] })
    L.marker([51.4805,-.005],{ icon }).addTo(map)
  })
  await tilesReady(page)
  const original=await page.getByTestId('original-map').screenshot({ path:info.outputPath('original-map.png'), scale:'css' })
  const a=PNG.sync.read(current),b=PNG.sync.read(original)
  expect(a.width).toBe(b.width);expect(a.height).toBe(b.height)
  let changedPixels=0
  for(let i=0;i<a.data.length;i+=4)if(a.data.subarray(i,i+4).compare(b.data.subarray(i,i+4)))changedPixels++
  await info.attach('pixel-comparison',{ body:JSON.stringify({ changedPixels,totalPixels:a.width*a.height }),contentType:'application/json' })
  expect(changedPixels,'old design must have identical CSS-pixel rendering').toBe(0)
})
