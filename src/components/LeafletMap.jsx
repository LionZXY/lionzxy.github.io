import { useEffect, useRef } from 'react'
import { location } from '../data/location'

// Original f4582ce rendering; only the tile source and resize handling change.
export function LeafletMap() {
  const mapRef = useRef(null)
  useEffect(() => {
    let disposed = false
    /** @type {import('leaflet').Map | undefined} */
    let map
    let cleanupObserver = () => {}
    import('leaflet').then((L) => {
      const element = mapRef.current
      if (disposed || !element) return
      map = L.map(element, {
        zoomControl: false, attributionControl: false, dragging: false,
        scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false,
        keyboard: false, boxZoom: false, trackResize: false,
        minZoom: location.zoom, maxZoom: location.zoom,
      }).setView([location.center[0], location.center[1]], location.zoom)
      L.tileLayer(`${import.meta.env.BASE_URL}${location.tilePath}`, {
        maxZoom: 19,
      }).addTo(map)
      const markerIcon = L.divIcon({
        className: 'map-marker-custom',
        html: '<div class="map-pin-outer"><div class="map-pin-inner"></div></div>',
        iconSize: [36, 36], iconAnchor: [18, 18],
      })
      L.marker([location.latitude, location.longitude], { icon: markerIcon, interactive: false }).addTo(map)
      // Skip the initial observer notification: the map is already correctly
      // sized, and resetting it would unnecessarily abort first tile requests.
      let width = element.clientWidth
      let height = element.clientHeight
      // Supported by Leaflet 1.9.4 setView; omitted by community typings.
      /** @type {import('leaflet').ZoomPanOptions & { reset: boolean }} */
      const resizeOptions = { animate: false, reset: true }
      const observer = new ResizeObserver(() => {
        if (element.clientWidth === width && element.clientHeight === height) return
        width = element.clientWidth
        height = element.clientHeight
        map?.invalidateSize({ pan: false, animate: false })
        map?.setView([location.center[0], location.center[1]], location.zoom, resizeOptions)
      })
      observer.observe(element)
      cleanupObserver = () => observer.disconnect()
    })
    return () => { disposed = true; cleanupObserver(); map?.remove() }
  }, [])
  return <div ref={mapRef} data-testid="location-map" role="img" aria-label={`Map showing ${location.label}`} style={{ width: '100%', height: '100%' }} />
}
