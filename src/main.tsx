import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WalletProvider } from './components/WalletProvider'
import { GamesProvider } from './components/GamesProvider'
import { Toaster } from 'sonner'

window.onerror = function(msg, url, lineNo, columnNo, error) {
  const errorMsg = String(msg).toLowerCase();
  const errorUrl = String(url).toLowerCase();
  
  // Ignore common wallet extension injection errors that don't actually break the app
  if (errorMsg.includes('redefine property: ethereum') || 
      errorUrl.includes('chrome-extension') || 
      errorUrl.includes('wallet')) {
    console.warn('Ignoring non-critical wallet extension error:', msg);
    return true; // Prevent the error from triggering the crash UI
  }

  console.error('Global Error:', msg, 'at', url, ':', lineNo, ':', columnNo, error);
  
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = '<div style="background:#0a0a0a;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:sans-serif;"><h3>Initialization Error</h3><p style="color:rgba(255,255,255,0.6);font-size:14px;">The app encountered an error during startup. This is often caused by conflicting wallet extensions.</p><button onclick="window.location.reload()" style="margin-top:20px;padding:10px 20px;background:white;color:black;border:none;border-radius:20px;font-weight:bold;">Refresh</button></div>';
  }
  return false;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <WalletProvider>
        <GamesProvider>
          <App />
          <Toaster position="top-right" />
        </GamesProvider>
      </WalletProvider>
  </React.StrictMode>,
)
