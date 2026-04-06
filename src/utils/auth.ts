export function getStoredToken(): string | null {
	return localStorage.getItem('fitbit_token')
}

export function logout(): void {
	localStorage.removeItem('fitbit_token')
	window.location.reload()
}


