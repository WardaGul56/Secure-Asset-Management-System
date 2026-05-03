import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const truckIcon = L.divIcon({
  html: `<div style="
    background: #00d4aa;
    border: 2px solid #0a0e1a;
    border-radius: 50%;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 0 12px rgba(0,212,170,0.5);
  ">🚛</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function getPolygonCenter(geoJson) {
  // Compute centroid of the first polygon ring
  try {
    let coords = null
    if (geoJson.type === 'Polygon') {
      coords = geoJson.coordinates[0]
    } else if (geoJson.type === 'Feature' && geoJson.geometry?.type === 'Polygon') {
      coords = geoJson.geometry.coordinates[0]
    } else if (geoJson.type === 'FeatureCollection') {
      const first = geoJson.features[0]
      if (first?.geometry?.type === 'Polygon') coords = first.geometry.coordinates[0]
    }
    if (!coords || coords.length === 0) return null
    const lngs = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ]
  } catch { return null }
}

export default function MapWidget({ locations = [], zones = [], className = 'map-container', center = [33.72, 73.04] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const zonesRef = useRef([])
  const labelsRef = useRef([])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    mapInstance.current = L.map(mapRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Update markers
  useEffect(() => {
    if (!mapInstance.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return
      const marker = L.marker([loc.latitude, loc.longitude], { icon: truckIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 160px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">${loc.asset_name || 'Asset'}</div>
            <div style="font-size: 12px; color: #8899bb;">Plate: ${loc.plate_number || '—'}</div>
            <div style="font-size: 12px; color: #8899bb;">Operator: ${loc.op_id || '—'}</div>
            <div style="font-size: 11px; color: #4a5a7a; margin-top: 4px;">${loc.timestamp ? new Date(loc.timestamp).toLocaleString() : ''}</div>
          </div>
        `)
      markersRef.current.push(marker)
    })
  }, [locations])

  // Update zones with name labels
  useEffect(() => {
    if (!mapInstance.current) return
    zonesRef.current.forEach(z => z.remove())
    zonesRef.current = []
    labelsRef.current.forEach(l => l.remove())
    labelsRef.current = []

    zones.forEach(zone => {
      if (!zone.boundary) return
      try {
        const geo = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary
        const color = zone.is_forbidden ? '#ef4444' : '#00d4aa'

        const layer = L.geoJSON(geo, {
          style: {
            color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.7,
            dashArray: zone.is_forbidden ? '6 4' : null,
          }
        })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div style="font-family: 'DM Sans', sans-serif;">
              <div style="font-weight: 700; font-size: 13px;">${zone.zone_name}</div>
              <div style="font-size: 11px; margin-top: 4px; color: ${color};">
                ${zone.is_forbidden ? '⛔ Forbidden Zone' : '✅ Allowed Zone'}
              </div>
            </div>
          `)
        zonesRef.current.push(layer)

        // Add zone name label at centroid
        const centroid = getPolygonCenter(geo)
        if (centroid) {
          const label = L.divIcon({
            html: `<div style="
              background: ${zone.is_forbidden ? 'rgba(239,68,68,0.85)' : 'rgba(0,212,170,0.85)'};
              color: #fff;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              font-family: 'DM Sans', sans-serif;
              white-space: nowrap;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            ">${zone.zone_name}</div>`,
            className: '',
            iconAnchor: [0, 0],
          })
          const labelMarker = L.marker(centroid, { icon: label, interactive: false })
            .addTo(mapInstance.current)
          labelsRef.current.push(labelMarker)
        }
      } catch (e) {
        console.warn('Invalid zone boundary', e)
      }
    })
  }, [zones])

  return <div ref={mapRef} className={className} />
}
