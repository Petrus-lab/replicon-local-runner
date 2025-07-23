
// FILE: interface-server.js   GENERATED: 2025-07-21T19:26:00+02:00
// Force Firebase reinitialization to detect .env changes

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

require('dotenv').config({ path: path.join(__dirname, '.env') });

async function getOctokit() {
  const { Octokit } = await import('@octokit/rest');
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

function testFirebaseLive() {
  try {
    const admin = require('firebase-admin');
    // Clear existing apps to force reinitialization
    if (admin.apps.length) {
      admin.apps.forEach(app => app.delete());
    }
    // Check GOOGLE_APPLICATION_CREDENTIALS
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return Promise.resolve('❌ Firebase not available: GOOGLE_APPLICATION_CREDENTIALS not set.');
    }
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!fs.existsSync(serviceAccountPath)) {
      return Promise.resolve('❌ Firebase not available: Service account file not found.');
    }
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    return admin.firestore().collection('__diagnostic').doc('status').get()
      .then(() => '✅ Firebase connected.')
      .catch(e => '❌ Firebase error: ' + e.message);
  } catch (e) {
    return Promise.resolve('❌ Firebase not available: ' + e.message);
  }
}

async function testGitHubLive() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return '❌ GitHub error: GITHUB_TOKEN not set.';
    }
    const octokit = await getOctokit();
    const res = await octokit.repos.listForAuthenticatedUser({ per_page: 1 });
    if (res && Array.isArray(res.data)) {
      return '✅ GitHub connected.';
    } else {
      return '❌ GitHub API error.';
    }
  } catch (e) {
    return '❌ GitHub error: ' + (e.message || e.toString());
  }
}

async function testVercelLive() {
  const token = process.env.VERCEL_TOKEN;
  const orgId = process.env.VERCEL_ORG_ID;
  if (!token) {
    return '❌ Vercel error: VERCEL_TOKEN not set.';
  }
  let results = [];
  try {
    const url2 = `https://api.vercel.com/v2/projects?limit=1${orgId ? `&teamId=${orgId}` : ''}`;
    const headers = { Authorization: `Bearer ${token}` };
    const res2 = await axios.get(url2, { headers });
    if (res2.status === 200 && res2.data.projects) {
      results.push('✅ Vercel connected via /v2/projects.');
    } else {
      results.push('❌ Vercel /v2 API error.');
    }
  } catch (e) {
    results.push('❌ Vercel /v2 error: ' + (e.response?.data?.error?.message || e.message));
  }
  try {
    const url9 = `https://api.vercel.com/v9/projects`;
    const headers = { Authorization: `Bearer ${token}` };
    const res9 = await axios.get(url9, { headers });
    if (res9.status === 200 && Array.isArray(res9.data.projects)) {
      results.push('✅ Vercel connected via /v9/projects.');
    } else {
      results.push('❌ Vercel /v9 API error.');
    }
  } catch (e) {
    results.push('❌ Vercel /v9 error: ' + (e.response?.data?.error?.message || e.message));
  }
  return results.join('\n');
}

app.post('/run', async (req, res) => {
  const { action, inputData, targetPath, raw, targets } = req.body;
  try {
    if (action === 'test_all_integrations' && Array.isArray(targets)) {
      let results = await Promise.all(targets.map(async t => {
        t = t.toLowerCase();
        if (t === 'firebase') return await testFirebaseLive();
        if (t === 'github') return await testGitHubLive();
        if (t === 'vercel') return await testVercelLive();
        return `❌ Unknown integration: ${t}`;
      }));
      return res.json({ output: results.join('\n') });
    }
    if (action === 'shell' && inputData) {
      exec(inputData, { cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) return res.json({ output: stderr });
        return res.json({ output: stdout });
      });
      return;
    }
    if (action === 'python' && inputData) {
      exec(`python -c "${inputData.replace(/"/g, '\\"')}"`, { cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) return res.json({ output: stderr });
        return res.json({ output: stdout });
      });
      return;
    }
    if (action === 'read' && targetPath) {
      fs.readFile(targetPath, 'utf8', (err, data) => {
        if (err) return res.json({ output: `❌ Error: ${err.message}` });
        return res.json({ output: data });
      });
      return;
    }
    if (action === 'write' && inputData) {
      let parsed;
      try { parsed = JSON.parse(inputData); }
      catch (e) { return res.json({ output: '❌ Error: Invalid JSON for write.' }); }
      if (!parsed.filename || !parsed.content) return res.json({ output: '❌ Error: filename and content required.' });
      fs.writeFile(parsed.filename, parsed.content, err => {
        if (err) return res.json({ output: `❌ Error writing file: ${err.message}` });
        return res.json({ output: `✅ Saved to ${parsed.filename}` });
      });
      return;
    }
    if (action === 'json' && raw) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return res.json({ output: `❌ Error: Invalid JSON: ${e.message}` });
      }
      if (!parsed.type || !parsed.command) {
        return res.json({ output: `❌ Error: JSON must include 'type' (shell or python) and 'command'.` });
      }
      if (parsed.type === 'shell') {
        exec(parsed.command, { cwd: process.cwd() }, (err, stdout, stderr) => {
          if (err) return res.json({ output: `❌ Shell error: ${stderr}` });
          return res.json({ output: stdout });
        });
        return;
      }
      if (parsed.type === 'python') {
        exec(`python -c "${parsed.command.replace(/"/g, '\\"')}"`, { cwd: process.cwd() }, (err, stdout, stderr) => {
          if (err) return res.json({ output: `❌ Python error: ${stderr}` });
          return res.json({ output: stdout });
        });
        return;
      }
      return res.json({ output: `❌ Error: Unknown type '${parsed.type}' in JSON action.` });
    }
    return res.json({ output: `❌ Unknown action "${action}".` });
  } catch (err) {
    return res.json({ output: `❌ Exception: ${err.message}` });
  }
});

app.listen(port, () => {
  console.log(`✋ Replicon Local AI Runner backend active: http://localhost:${port}`);
});
