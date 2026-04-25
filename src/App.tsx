import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from '@razorlabs/razorkit'
import LoginPage from './pages/Login'
import SettingsPage from './pages/Settings'
import Callback from './pages/Callback'
import GoogleCallback from './pages/GoogleCallback'
import LeaderboardPage from './pages/Leaderboard'
import { NavigationDock } from './components/NavigationDock'
import { TooltipProvider } from './components/ui/tooltip'


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
				element={isConnected ? <SettingsPage /> : <Navigate to="/login" />}
			/>
			<Route path="/callback" element={<Callback />} />
			<Route path="/google-callback" element={<GoogleCallback />} />
			<Route 
				path="/leaderboard/:gameId" 
				element={isConnected ? <LeaderboardPage /> : <Navigate to="/login" />} 
			/>
			{/* Catch-all redirect to home (which then goes to login if needed) */}
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	)
}

function App() {
	return (
		<BrowserRouter>
			<TooltipProvider delayDuration={0}>
				<AppRoutes />
				<NavigationDock />
			</TooltipProvider>
		</BrowserRouter>
	)
}

export default App
