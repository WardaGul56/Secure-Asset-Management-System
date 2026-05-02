import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import MapWidget from '../../components/MapWidget'
import { locationApi, zonesApi } from '../../api'

export default function AdminLiveMap() {
  const [locations, setLocations] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    Promise.all([locationApi.latest(), zonesApi.getAll()])
      .then(([l, z]) => {
        setLocations(l.data.locations || [])
        setZones(z.data.zones || [])
      }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Topbar
        title="Live Map"
        subtitle="Real-time asset positions + zone boundaries"
        actions={
          <button className="btn btn-secondary" onClick={fetchData}>↺ Refresh</button>
        }
      />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-teal-dim)', color: 'var(--accent-teal)' }}>📍</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{locations.length}</div>
              <div className="stat-label">Active Assets</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>⛔</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{zones.filter(z => z.is_forbidden).length}</div>
              <div className="stat-label">Forbidden Zones</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' }}>✅</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{zones.filter(z => !z.is_forbidden).length}</div>
              <div className="stat-label">Allowed Zones</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading map data...</span></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <MapWidget locations={locations} zones={zones} className="map-container-full" />
          </div>
        )}
      </div>
    </>
  )
}
