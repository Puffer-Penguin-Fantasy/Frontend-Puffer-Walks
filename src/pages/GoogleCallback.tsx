import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function GoogleCallback() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        // Google OAuth sends the token in the URL hash for response_type=token
        const hashParams = new URLSearchParams(location.hash.replace('#', '?'))
        const token = hashParams.get('access_token')

        if (token) {
            localStorage.setItem('googlefit_token', token)
            navigate('/')
        } else {
            // Handle error case
            console.error('Google OAuth failed: No access token found')
            navigate('/')
        }
    }, [location, navigate])

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
