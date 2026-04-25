/**
 * Puffer Walks — Fitbit Auth Server (Vercel Integration)
 * -------------------------------------------------------
 * This file handles the OAuth 2.0 flow directly in Vercel Serverless.
 * It is mapped to /auth/(.*) via vercel.json.
 */

import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// ─── Firebase Admin Init ───────────────────────────────────────────────────────
let serviceAccount;
try {
  let secret = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  secret = secret.replace(/[\n\r]/g, "").replace(/\s(?={)/, "");
  if (!secret) throw new Error("FIREBASE_SERVICE_ACCOUNT is empty!");
  serviceAccount = JSON.parse(secret);
} catch (err) {
  // On Vercel, we don't want to process.exit(1), we'll just log and fail on request
  console.error("❌ Firebase Secret Error:", err.message);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const CLIENT_ID = process.env.VITE_FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_FITBIT_CLIENT_SECRET;
const REDIRECT_URI = process.env.VITE_FITBIT_REDIRECT_URI;
const SCOPES = "activity profile";

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.VITE_GOOGLE_REDIRECT_URI || "http://localhost:5173/google-callback";

const FRONTEND_URL = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

// ─── Helper: Standardize Wallet Address ────────────────────────────────────────
function standardizeAddress(addr) {
  if (!addr) return null;
  let clean = addr.toLowerCase().trim();
  if (!clean.startsWith("0x")) clean = "0x" + clean;
  return clean;
}

// ─── Helper: Exchange code for tokens ────────────────────────────────────────
async function exchangeCode(code) {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

// ─── Helper: Refresh access token ────────────────────────────────────────────
async function refreshAccessToken(walletAddress) {
  const db = admin.firestore();
  const userDoc = await db.collection("fitbit_tokens").doc(walletAddress.toLowerCase()).get();
  if (!userDoc.exists) throw new Error("No token found for wallet");

  const { refresh_token } = userDoc.data();
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    await db.collection("fitbit_tokens").doc(walletAddress.toLowerCase()).update({
      connected: false,
      error: err,
    });
    throw new Error(`Token refresh failed: ${err}`);
  }

  const tokens = await res.json();

  await db.collection("fitbit_tokens").doc(walletAddress.toLowerCase()).set({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    fitbit_user_id: tokens.user_id,
    connected: true,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return tokens.access_token;
}

// ─── Google Fit Helpers ──────────────────────────────────────────────────────
async function exchangeGoogleCode(code, redirectUri) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri || GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json();
}

async function refreshGoogleAccessToken(walletAddress) {
  const db = admin.firestore();
  const userDoc = await db.collection("googlefit_tokens").doc(walletAddress.toLowerCase()).get();
  if (!userDoc.exists) throw new Error("No Google token found for wallet");

  const { refresh_token } = userDoc.data();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    await db.collection("googlefit_tokens").doc(walletAddress.toLowerCase()).update({
      connected: false,
      error: err,
    });
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const tokens = await res.json();

  await db.collection("googlefit_tokens").doc(walletAddress.toLowerCase()).set({
    access_token: tokens.access_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    connected: true,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return tokens.access_token;
}

// ─── Express App Init ─────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── Endpoints ────────────────────────────────────────────────────────────────
app.get(["/fitbit/url", "/auth/fitbit/url"], (req, res) => {
  const wallet = standardizeAddress(req.query.wallet);
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    prompt: "login consent",
    state: wallet,
    expires_in: "604800",
  });

  const url = `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  res.json({ url });
});

app.get(["/fitbit/callback", "/auth/fitbit/callback"], async (req, res) => {
  const { code, state } = req.query;
  const walletAddress = standardizeAddress(state);
  const db = admin.firestore();

  if (!code || !walletAddress) {
    return res.redirect(`${FRONTEND_URL}/?fitbit=error`);
  }

  try {
    const tokens = await exchangeCode(code);
    await db.collection("fitbit_tokens").doc(walletAddress).set({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
      fitbit_user_id: tokens.user_id,
      connected: true,
      connected_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect(`${FRONTEND_URL}/?fitbit=connected`);
  } catch (err) {
    console.error("❌ Callback handling error:", err.message);
    res.redirect(`${FRONTEND_URL}/?fitbit=error`);
  }
});

app.get(["/fitbit/status", "/auth/fitbit/status"], async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const db = admin.firestore();

  try {
    const doc = await db.collection("fitbit_tokens").doc(wallet.toLowerCase()).get();
    if (!doc.exists || !doc.data().connected) {
      return res.json({ connected: false });
    }
    return res.json({ connected: true, fitbit_user_id: doc.data().fitbit_user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(["/fitbit/steps", "/auth/fitbit/steps"], async (req, res) => {
  const { wallet, date } = req.body;
  if (!wallet || !date) return res.status(400).json({ error: "wallet and date required" });
  const db = admin.firestore();

  try {
    const doc = await db.collection("fitbit_tokens").doc(wallet.toLowerCase()).get();
    if (!doc.exists || !doc.data().connected) {
      return res.status(401).json({ error: "Not connected" });
    }

    let { access_token, expires_at } = doc.data();

    if (Date.now() > expires_at - 300000) {
      access_token = await refreshAccessToken(wallet);
    }

    const fitbitRes = await fetch(`https://api.fitbit.com/1/user/-/activities/tracker/steps/date/${date}/1d.json`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!fitbitRes.ok) {
      if (fitbitRes.status === 401) {
        try {
          access_token = await refreshAccessToken(wallet);
          const retryRes = await fetch(`https://api.fitbit.com/1/user/-/activities/tracker/steps/date/${date}/1d.json`, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          if (!retryRes.ok) throw new Error("Retry failed");
          const retryData = await retryRes.json();
          const trackerSteps = retryData?.['activities-tracker-steps'];
          const steps = trackerSteps && trackerSteps.length > 0 ? parseInt(trackerSteps[0].value, 10) : 0;
          return res.json({ steps });
        } catch {
          await db.collection("fitbit_tokens").doc(wallet.toLowerCase()).update({ connected: false });
          return res.status(401).json({ error: "Token revoked, please reconnect Fitbit" });
        }
      }
      throw new Error(`Fitbit API error: ${fitbitRes.status}`);
    }

    const data = await fitbitRes.json();
    const trackerSteps = data?.['activities-tracker-steps'];
    const steps = trackerSteps && trackerSteps.length > 0 ? parseInt(trackerSteps[0].value, 10) : 0;
    res.json({ steps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(["/fitbit/disconnect", "/auth/fitbit/disconnect"], async (req, res) => {
  const wallet = standardizeAddress(req.body.wallet);
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const db = admin.firestore();

  try {
    const docSnap = await db.collection("fitbit_tokens").doc(wallet.toLowerCase()).get();
    if (docSnap.exists) {
      const { access_token, refresh_token } = docSnap.data();
      const token = refresh_token || access_token;
      if (token) {
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
        await fetch("https://api.fitbit.com/oauth2/revoke", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ token }),
        }).catch(err => console.error("Token revoke failed:", err));
      }
    }
  } catch (err) {
    console.error("Error during disconnect token revoke:", err);
  }

  await db.collection("fitbit_tokens").doc(wallet).set({ connected: false }, { merge: true });
  res.json({ success: true });
});

// ─── Google Fit Endpoints ────────────────────────────────────────────────────
app.post(["/googlefit/exchange", "/auth/googlefit/exchange"], async (req, res) => {
  const { code, walletAddress, redirectUri } = req.body;
  const wallet = standardizeAddress(walletAddress);
  const db = admin.firestore();

  if (!code || !wallet) {
    return res.status(400).json({ error: "code and wallet required" });
  }

  try {
    const tokens = await exchangeGoogleCode(code, redirectUri);
    await db.collection("googlefit_tokens").doc(wallet).set({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
      connected: true,
      connected_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Google Callback handling error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post(["/googlefit/steps", "/auth/googlefit/steps"], async (req, res) => {
  const { wallet, date } = req.body;
  if (!wallet || !date) return res.status(400).json({ error: "wallet and date required" });
  const db = admin.firestore();

  try {
    const doc = await db.collection("googlefit_tokens").doc(wallet.toLowerCase()).get();
    if (!doc.exists || !doc.data().connected) {
      return res.status(401).json({ error: "Not connected" });
    }

    let { access_token, expires_at } = doc.data();

    if (Date.now() > expires_at - 300000) {
      access_token = await refreshGoogleAccessToken(wallet);
    }

    const startTime = new Date(date + "T00:00:00Z").getTime();
    const endTime = new Date(date + "T23:59:59Z").getTime();

    const fetchSteps = async (token) => {
      const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
          bucketByTime: { durationMillis: endTime - startTime },
          startTimeMillis: startTime,
          endTimeMillis: endTime
        })
      });
      if (!res.ok) throw res;
      return res.json();
    };

    try {
      const data = await fetchSteps(access_token);
      let steps = 0;
      if (data.bucket && data.bucket[0]) {
        data.bucket[0].dataset.forEach(d => {
          d.point.forEach(p => {
            p.value.forEach(v => { steps += v.intVal || 0; });
          });
        });
      }
      res.json({ steps });
    } catch (err) {
      if (err.status === 401) {
        access_token = await refreshGoogleAccessToken(wallet);
        const data = await fetchSteps(access_token);
        let steps = 0;
        if (data.bucket && data.bucket[0]) {
          data.bucket[0].dataset.forEach(d => {
            d.point.forEach(p => {
              p.value.forEach(v => { steps += v.intVal || 0; });
            });
          });
        }
        return res.json({ steps });
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(["/googlefit/disconnect", "/auth/googlefit/disconnect"], async (req, res) => {
  const wallet = standardizeAddress(req.body.wallet);
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const db = admin.firestore();

  await db.collection("googlefit_tokens").doc(wallet).set({ connected: false }, { merge: true });
  res.json({ success: true });
});

export default app;
