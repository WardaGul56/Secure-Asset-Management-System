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

export default function MapWidget({ locations = [], zones = [], className = 'map-container', center = [33.72, 73.04] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const zonesRef = useRef([])

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

  // Update zones
  useEffect(() => {
    if (!mapInstance.current) return
    zonesRef.current.forEach(z => z.remove())
    zonesRef.current = []

    zones.forEach(zone => {
      if (!zone.boundary) return
      try {
        const geo = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary
        const layer = L.geoJSON(geo, {
          style: {
            color: zone.is_forbidden ? '#ef4444' : '#00d4aa',
            fillColor: zone.is_forbidden ? '#ef4444' : '#00d4aa',
            fillOpacity: 0.08,
            weight: 2,
            opacity: 0.6,
            dashArray: zone.is_forbidden ? '6 4' : null,
          }
        })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div style="font-family: 'DM Sans', sans-serif;">
              <div style="font-weight: 700; font-size: 13px;">${zone.zone_name}</div>
              <div style="font-size: 11px; margin-top: 4px; color: ${zone.is_forbidden ? '#ef4444' : '#10b981'};">
                ${zone.is_forbidden ? '⛔ Forbidden Zone' : '✅ Allowed Zone'}
              </div>
            </div>
          `)
        zonesRef.current.push(layer)
      } catch (e) {
        console.warn('Invalid zone boundary', e)
      }
    })
  }, [zones])

  return <div ref={mapRef} className={className} />
}
