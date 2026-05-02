import { lazy, Suspense, useState, useEffect } from 'react'
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
const PageLoader = () => {
	const [timedOut, setTimedOut] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), 10000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-[3000] p-6 text-center">
			<div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-6" />
			{timedOut && (
				<div className="max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500">
					<p className="text-white/60 text-sm mb-4">Taking longer than expected. This can happen in some wallet browsers.</p>
					<button 
						onClick={() => window.location.reload()}
						className="px-6 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-white/90 transition-all active:scale-95"
					>
						Refresh Page
					</button>
				</div>
			)}
		</div>
	);
}


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
