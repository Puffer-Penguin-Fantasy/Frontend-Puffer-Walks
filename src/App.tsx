import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from '@razorlabs/razorkit'
import LoginPage from './pages/Login'
import SettingsPage from './pages/Settings'
import Callback from './pages/Callback'

// Lazy load pages and heavy components
const LeaderboardPage = lazy(() => import('./pages/Leaderboard'))
const ProfilePage = lazy(() => import('./pages/Profile'))
const PrivacyPage = lazy(() => import('./pages/Privacy'))
const GuidanceDemo = lazy(() => import('./pages/GuidanceDemo'))
const AppGuidance = lazy(() => import('./components/AppGuidance').then(m => ({ default: m.AppGuidance })))

import { NavigationDock } from './components/NavigationDock'
import { TooltipProvider } from './components/ui/tooltip'

// Loading fallback component
const PageLoader = () => (
	<div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-[3000]">
		<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
	</div>
)


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
				<Suspense fallback={<PageLoader />}>
					<AppGuidance />
					<AppRoutes />
				</Suspense>
				<NavigationDock />
			</TooltipProvider>
		</BrowserRouter>
	)
}

export default App
