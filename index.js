// replicon-local-runner/index.js
require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const REPO_NAME = GITHUB_REPO.split('/').pop();
const FIREBASE_KEY_PATH = './firebase-service-account.json';
const PROJECT_PATH = process.env.PROJECT_PATH || path.join(__dirname, '..', REPO_NAME);

app.use(express.json());

// Validate essential config
if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('❌ Missing GITHUB_TOKEN or GITHUB_REPO in .env');
  process.exit(1);
}

// Initialize Firebase if service account exists
if (fs.existsSync(FIREBASE_KEY_PATH)) {
  const serviceAccount = require(FIREBASE_KEY_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn('⚠️ Firebase key not found. Firestore test will fail unless provided.');
}

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Replicon Local Runner is online.');
});

// Unified command handler
app.post('/run', async (req, res) => {
  const { action, commitMsg = 'Runner push' } = req.body;

  switch (action) {
    case 'clone':
      return handleGitClone(res);
    case 'pull':
      return handleGitPull(res);
    case 'firestore-test':
      return handleFirestoreTest(res);
    case 'vercel-deploy':
      return handleVercelDeploy(res);
    default:
      return res.status(400).send('❌ Unknown action.');
  }
});

// === Git Pull ===
function handleGitPull(res) {
  const cmd = `git pull`;
  exec(cmd, { cwd: PROJECT_PATH }, (err, stdout, stderr) => {
    if (err) return res.status(500).send(`❌ Pull failed:\n${stderr}`);
    res.send(`✅ Pull complete:\n${stdout}`);
  });
}

// === Git Clone ===
function handleGitClone(res) {
  if (fs.existsSync(PROJECT_PATH)) {
    return res.send(`📁 Repo already exists at '${PROJECT_PATH}'.`);
  }
  const cloneCmd = `git clone https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO.split('https://github.com/')[1]} "${PROJECT_PATH}"`;
  exec(cloneCmd, (err, stdout, stderr) => {
    if (err) return res.status(500).send(`❌ Clone failed:\n${stderr}`);
    res.send(`✅ Clone successful:\n${stdout}`);
  });
}

// === Firestore Read Test ===
async function handleFirestoreTest(res) {
  try {
    if (!admin.apps.length) {
      return res.status(500).send('❌ Firebase not initialized. Missing service account file.');
    }

    const snapshot = await admin.firestore().collection('inventory').limit(5).get();
    const results = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, data: doc.data() });
    });

    res.send({
      message: `✅ Retrieved ${results.length} document(s) from Firestore`,
      docs: results,
    });
  } catch (error) {
    res.status(500).send(`❌ Firestore test failed:\n${error.message}`);
  }
}

// === FINAL Vercel Deployment Fix (Vercel CLI v43+ compatible) ===
function handleVercelDeploy(res) {
  const homeDir = os.homedir();
  exec(`vercel --prod --yes`, {
    cwd: PROJECT_PATH,
    env: {
      ...process.env,
      HOME: homeDir,
      USERPROFILE: homeDir
    }
  }, (err, stdout, stderr) => {
    if (err) return res.status(500).send(`❌ Vercel deploy failed:\n${stderr}`);
    res.send(`✅ Vercel deployment complete:\n${stdout}`);
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Replicon Local AI Runner is running on port ${PORT}`);
});
