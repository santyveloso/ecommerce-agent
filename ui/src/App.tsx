import { useState, useEffect } from 'react'
import Onboarding from './Onboarding'
import LoadingScreen from './LoadingScreen'
import Dashboard from './Dashboard'
import { API } from './constants'

/* ── Main App ───────────────────────────────── */
export default function App() {
  const [configured, setConfigured] = useState(() => !!localStorage.getItem('ec_configured'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if API already has credentials (survives localStorage clears)
    fetch(`${API}/setup/status`)
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          localStorage.setItem('ec_configured', '1')
          setConfigured(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!configured) {
    return <Onboarding onDone={() => setConfigured(true)} />
  }

  return <Dashboard />
}
