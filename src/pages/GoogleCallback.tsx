import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { GOOGLE_REDIRECT_URI } from '../integrations/googlefit/config'

const isDev = import.meta.env.DEV;
const AUTH_SERVER = isDev ? (import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3001") : "";

function GoogleCallback() {
    const [searchParams] = useSearchParams()
    const exchanged = useRef(false)
    const navigate = useNavigate()

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code && state && !exchanged.current) {
            exchanged.current = true
            const exchangeToken = async () => {
                try {
                    const res = await fetch(`${AUTH_SERVER}/auth/googlefit/exchange`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            code, 
                            walletAddress: state,
                            redirectUri: GOOGLE_REDIRECT_URI
                        }),
                    });

                    if (res.ok) {
                        navigate('/?googlefit=connected')
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        console.error('Google exchange failed:', errorData)
                        navigate('/?googlefit=error')
                    }
                } catch (err) {
                    console.error('Google exchange error:', err)
                    navigate('/?googlefit=error')
                }
            }
            exchangeToken()
            return
        }

        if (!code || !state) {
            navigate('/')
        }
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#fcc61f] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-white font-sans text-sm font-medium">Synchronizing Google Fit...</p>
            </div>
        </div>
    )
}

export default GoogleCallback
