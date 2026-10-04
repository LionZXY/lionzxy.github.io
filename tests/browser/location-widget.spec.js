import { expect, test } from '@playwright/test'

const localOrigin = 'http://127.0.0.1:4173'

test('renders the checked-in location map without external requests or layout breakage', async ({ page }, testInfo) => {
  const externalRequests = []
  const failedRequests = []
  const pageErrors = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.startsWith(localOrigin)) externalRequests.push(url)
    }
  })
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? 'unknown error'}`))
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)))

  const map = page.getByTestId('location-map')
  const card = page.locator('.map-card')
  const label = page.getByTestId('location-label')

  await expect(map).toBeVisible()
  await expect(map).toHaveAttribute('src', '/images/map-london.svg')
  await expect(map).toHaveAttribute('alt', 'Static map showing London, UK')
  await expect(label).toHaveText('London, UK')
  await expect(card).toHaveAttribute('href', 'https://www.google.com/maps/@51.4805,-0.005,11z')
  expect(await map.evaluate((image) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })))
    .toEqual({ complete: true, width: 800, height: 360 })

  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const cards = [...document.querySelectorAll('.bento-grid .card')].map((element) => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }
    })
    const mapCard = document.querySelector('.map-card').getBoundingClientRect()
    const mapImage = document.querySelector('[data-testid="location-map"]').getBoundingClientRect()
    const overlays = [...document.querySelectorAll('.map-overlay')].map((element) => {
      const rect = element.getBoundingClientRect()
      const parent = element.closest('.map-card').getBoundingClientRect()
      return rect.left >= parent.left && rect.right <= parent.right && rect.top >= parent.top && rect.bottom <= parent.bottom
    })
    const overlaps = []
    for (let first = 0; first < cards.length; first += 1) {
      for (let second = first + 1; second < cards.length; second += 1) {
        const a = cards[first]
        const b = cards[second]
        if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) {
          overlaps.push([first, second])
        }
      }
    }
    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cardsInsideViewport: cards.every((rect) => rect.left >= -1 && rect.right <= viewportWidth + 1 && rect.width > 0 && rect.height > 0),
      overlaysInsideCards: overlays.every(Boolean),
      mapFillsCard: Math.abs(mapImage.left - mapCard.left) <= 1
        && Math.abs(mapImage.right - mapCard.right) <= 1
        && Math.abs(mapImage.top - mapCard.top) <= 1
        && Math.abs(mapImage.bottom - mapCard.bottom) <= 1,
      overlaps,
    }
  })

  expect(layout.scrollWidth, 'page must not overflow horizontally').toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.cardsInsideViewport, 'cards must not be clipped by the viewport').toBe(true)
  expect(layout.overlaysInsideCards, 'map label must remain inside the map').toBe(true)
  expect(layout.mapFillsCard, 'map image must fill the location card without clipping gaps').toBe(true)
  expect(layout.overlaps, 'cards must not overlap').toEqual([])
  expect(externalRequests, 'initial render must only request checked-in, same-origin assets').toEqual([])
  expect(failedRequests, 'all local assets must load successfully').toEqual([])
  expect(pageErrors, 'render must not raise browser errors').toEqual([])

  await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true })
})
