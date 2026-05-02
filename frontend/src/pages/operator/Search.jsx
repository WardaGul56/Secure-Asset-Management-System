import { useState } from 'react'
import Topbar from '../../components/Topbar'
import { honeypotApi } from '../../api'

export default function OperatorSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(false)
    setResults([])
    try {
      const res = await honeypotApi.search(query)
      setResults(res.data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
  }

  return (
    <>
      <Topbar title="Asset Search" subtitle="Search available fleet assets by name" />
      <div className="page-body">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 6 }}>Search Assets</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Enter an asset name to find its details and last known location.
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by asset name..."
            />
            {query && (
              <button type="button" className="btn btn-secondary" onClick={handleClear}>✕ Clear</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </form>

          {loading && (
            <div className="loading-center"><div className="spinner" /><span>Searching assets...</span></div>
          )}

          {searched && !loading && (
            results.length > 0 ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} found for "{query}"
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Asset Name</th><th>Last Known Location</th></tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            🚛 {r.asset_name}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            📍 {r.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-text">No assets found matching "{query}"</div>
              </div>
            )
          )}

          {!searched && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 13 }}>Enter a search term above to find assets</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
