import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

/**
 * Fitbit OAuth Callback
 * 
 * This page is now a simple redirect handler.
 * The oracle auth-server.js handles the actual token exchange at:
 *   GET /auth/fitbit/callback?code=...&state=<wallet>
 * 
 * After the exchange, the oracle redirects back to:
 *   /?fitbit=connected   → success
 *   /?fitbit=denied      → user denied
 *   /?fitbit=error       → server error
 *
 * This component handles fallback for the old implicit flow (#access_token=...)
 * where users may arrive back from Fitbit directly.
 */
function Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Check for old implicit flow tokens still arriving in hash (graceful degradation)
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      // Old implicit flow — strip and redirect home (token is no longer stored)
      navigate('/?fitbit=reconnect')
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the wallet address

    if (code && state) {
      // Send code and wallet address to auth-server for token exchange
      const exchangeToken = async () => {
        try {
          const authServer = import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3001";
          const redirectUri = import.meta.env.VITE_FITBIT_REDIRECT_URI || `${window.location.origin}/callback`;
          
          const res = await fetch(`${authServer}/auth/fitbit/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code, 
              walletAddress: state,
              redirectUri 
            }),
          });

          if (res.ok) {
            navigate('/?fitbit=connected')
          } else {
            console.error('Exchange failed')
            navigate('/?fitbit=error')
          }
        } catch (err) {
          console.error('Exchange error:', err)
          navigate('/?fitbit=error')
        }
      }
      exchangeToken()
      return
    }

    // No params, just go home
    navigate('/')
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-900 font-sans text-sm font-medium">Synchronizing Fitbit...</p>
      </div>
    </div>
  )
}

export default Callback
