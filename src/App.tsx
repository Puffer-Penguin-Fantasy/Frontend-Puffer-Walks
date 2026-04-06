import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from '@razorlabs/razorkit'
import LoginPage from './pages/Login'
import SettingsPage from './pages/Settings'
import Callback from './pages/Callback'
import GoogleCallback from './pages/GoogleCallback'
import LeaderboardPage from './pages/Leaderboard'


function AppRoutes() {
	const { isConnected } = useAccount()

	return (
		<Routes>
			<Route
				path="/login"
				element={isConnected ? <Navigate to="/" /> : <LoginPage />}
			/>
			<Route
				path="/"
				element={isConnected ? <SettingsPage /> : <LoginPage />}
			/>
			<Route path="/callback" element={<Callback />} />
			<Route path="/google-callback" element={<GoogleCallback />} />
			<Route path="/leaderboard/:gameId" element={<LeaderboardPage />} />

		</Routes>
	)
}

function App() {
	return (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	)
}

export default App
