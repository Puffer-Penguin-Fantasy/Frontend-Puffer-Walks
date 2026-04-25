import 'dotenv/config';
import app from './api/auth.js';
import axios from 'axios';

const PORT = 3001;

app.get('/', (req, res) => res.send('Auth Dev Server is Running '));
app.get('/keep-alive', (req, res) => res.send('Stayin Alive! 🕺'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n Auth Dev Server running at http://localhost:${PORT}`);
    console.log(`Standard endpoints:`);
    console.log(`   - http://localhost:${PORT}/auth/googlefit/exchange`);
    console.log(`   - http://localhost:${PORT}/auth/fitbit/url`);
});

// Self-ping every 10 minutes to stay awake (if deployed)
const APP_URL = process.env.VITE_AUTH_SERVER_URL || `http://localhost:${PORT}`;
if (APP_URL.includes('render.com') || APP_URL.includes('vercel.app')) {
    setInterval(() => {
        axios.get(`${APP_URL}/keep-alive`)
            .then(() => console.log(' Auth keep-alive ping successful'))
            .catch(err => console.error(' Auth keep-alive ping failed:', err.message));
    }, 10 * 60 * 1000);
}
