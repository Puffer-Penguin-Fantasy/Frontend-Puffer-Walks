import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WalletProvider } from './components/WalletProvider'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <WalletProvider>
        <App />
        <Toaster position="top-right" />
      </WalletProvider>
  </React.StrictMode>,
)
