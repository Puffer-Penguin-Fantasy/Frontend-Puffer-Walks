import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import LoginPage from './pages/Login'
import SettingsPage from './pages/Settings'
import Callback from './pages/Callback'
import GoogleCallback from './pages/GoogleCallback'
import LeaderboardPage from './pages/Leaderboard'


function AppRoutes() {
	const { connected } = useWallet()

	return (
		<Routes>
			<Route
				path="/login"
				element={connected ? <Navigate to="/" /> : <LoginPage />}
			/>
			<Route
				path="/"
				element={connected ? <SettingsPage /> : <LoginPage />}
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
