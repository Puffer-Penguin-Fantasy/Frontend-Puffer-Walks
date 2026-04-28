import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from '@razorlabs/razorkit'
import LoginPage from './pages/Login'
import SettingsPage from './pages/Settings'
import Callback from './pages/Callback'

import LeaderboardPage from './pages/Leaderboard'
import ProfilePage from './pages/Profile'
import PrivacyPage from './pages/Privacy'
import GuidanceDemo from './pages/GuidanceDemo'
import { NavigationDock } from './components/NavigationDock'
import { TooltipProvider } from './components/ui/tooltip'
import { AppGuidance } from './components/AppGuidance'


function AppRoutes() {
	const { isConnected } = useAccount()

	return (
		<Routes>
			<Route
				path="/"
				element={isConnected ? <SettingsPage /> : <LoginPage />}
			/>
			<Route path="/callback" element={<Callback />} />

			<Route path="/privacy" element={<PrivacyPage />} />
			<Route 
				path="/leaderboard/:gameId" 
				element={isConnected ? <LeaderboardPage /> : <Navigate to="/" />} 
			/>
			<Route 
				path="/profile" 
				element={isConnected ? <ProfilePage /> : <Navigate to="/" />} 
			/>
			<Route path="/guidance-demo" element={<GuidanceDemo />} />
			{/* Catch-all redirect to home */}
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	)
}

function App() {
	return (
		<BrowserRouter>
			<TooltipProvider delayDuration={0}>
				<AppGuidance />
				<AppRoutes />
				<NavigationDock />
			</TooltipProvider>
		</BrowserRouter>
	)
}

export default App
