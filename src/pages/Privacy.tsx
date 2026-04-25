export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 text-white">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: April 2025</p>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base mb-2">1. Overview</h2>
            <p>
              Puffer Walks ("we", "our", "us") is a Web3 fitness competition platform built on the Movement Network. 
              This Privacy Policy explains how we collect, use, and protect information when you use our application 
              at <a href="https://pufferwalks.arcticpenguin.xyz" className="text-blue-400 hover:underline">https://pufferwalks.arcticpenguin.xyz</a>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Wallet Address:</strong> Your public blockchain wallet address, used to identify you within the platform.</li>
              <li><strong className="text-white">Fitness Data:</strong> If you connect Google Fit or Fitbit, we access your daily step count to track game progress. We request only the minimum required permissions (activity and step data).</li>
              <li><strong className="text-white">Profile Information:</strong> Optional username and profile image you choose to set.</li>
              <li><strong className="text-white">Usage Data:</strong> Game participation records stored on the Movement blockchain and in Firebase Firestore.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To sync your daily steps to the blockchain for game progress tracking.</li>
              <li>To display your rank and performance on leaderboards.</li>
              <li>To process game entry fees and reward distributions on-chain.</li>
              <li>We do <strong className="text-white">not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">4. Google Fit & Fitbit Integration</h2>
            <p>
              When you connect Google Fit or Fitbit, we store OAuth tokens securely in Firebase Firestore to enable 
              periodic step synchronization. These tokens are used solely to read your step count. You may disconnect 
              at any time from the Settings page, which will revoke our access and delete your stored tokens.
            </p>
            <p className="mt-2">
              Our use of Google API data complies with the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">5. Data Storage & Security</h2>
            <p>
              Game data is stored on the Movement Network blockchain (public and immutable). 
              Profile and token data is stored in Google Firebase Firestore with access controls in place. 
              We implement industry-standard security practices, but no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">6. Data Retention</h2>
            <p>
              Blockchain data (game results, wallet activity) is permanent by nature of the blockchain. 
              Firebase profile and token data is retained until you disconnect your fitness provider or request deletion. 
              To request data deletion, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Access the data we hold about you.</li>
              <li>Request correction or deletion of your off-chain data.</li>
              <li>Disconnect fitness integrations at any time via the Settings page.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">8. Contact</h2>
            <p>
              For privacy-related requests or questions, contact us at:{" "}
              <a href="mailto:josephakpansunday@gmail.com" className="text-blue-400 hover:underline">
                josephakpansunday@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-white/40 hover:text-white text-xs transition-colors">
            ← Back to Puffer Walks
          </a>
        </div>
      </div>
    </div>
  );
}
