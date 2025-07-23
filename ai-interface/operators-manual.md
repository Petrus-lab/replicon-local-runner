# 🧠 Replicon Local AI Runner – Operators Manual

## 1. System Overview
The Replicon Local AI Runner is a secure, local Node.js-based automation hub.  
It lets you run shell/Python code, manage files, interact with Firebase, GitHub, and Vercel, and view all results in a modern local web UI.

---

## 2. Requirements
- Node.js (v20+ recommended)
- Git (configured globally)
- Firebase Admin SDK service account key
- Vercel personal/team token
- Internet (for cloud integrations)
- **Windows only:** for batch files

---

## 3. Startup & Shutdown

### Fastest: Batch Files (Recommended)
- **To start everything:**  
  Double-click  
start-all.bat

sql
Copy code
- **To shut down and guarantee all backend ports/processes are dead:**  
Double-click  
shutdown-all.bat

pgsql
Copy code
This batch kills ONLY the Replicon backend/UI windows and forcibly frees port 3001.

- **To restart clean:**  
Double-click  
restart-all.bat

graphql
Copy code

### Manual (for advanced users)
- Backend:
```cmd
node interface-server.js
UI:

Open ai-interface/index.html in your browser or

Run a static server (like npx serve or lite-server)

4. Interface Usage (ai-interface/index.html)
Select an action type (shell, Python, file, JSON, etc.)

Paste your input/payload in the input box.

Use Insert Example buttons for templates.

Use Test buttons to check integrations.

Click Submit to Runner.

View output (supports Markdown and JSON formatting).

Use Copy Output or Save Output to File for easy sharing or archiving.

See the status bar for integration health (green check = connected).

5. Output & Logs
All files created by the runner are saved in:

nginx
Copy code
file outputs\
Notable outputs:

dirlist.txt – complete directory snapshot

runner-log.txt – command history/logs

Your custom output files

6. Firebase Integration
The backend uses a service account JSON file.

.env must contain (absolute path recommended):

ini
Copy code
GOOGLE_APPLICATION_CREDENTIALS=C:\replicon-industries\replicon-local-runner\firebase-service-account.json
Use the Test Firebase button in the UI to verify live connectivity and see Firestore structure.

Troubleshooting: If you see a red X, check the backend log for credential errors.

7. GitHub & Vercel Integration
Tokens must be set in .env:

ini
Copy code
GITHUB_TOKEN=your-token
VERCEL_TOKEN=your-token
VERCEL_PROJECT_ID=prj_022hg1f9T9P9yYqfYSMAhgnJcXcf
VERCEL_ORG_ID=team_vsAlrCPgJ6ltAhMFHofIhvwE
PORT=3001
UI Test Buttons:

Test GitHub: Lists your repositories and basic info.

Test Vercel: Lists your Vercel projects and latest deployments.

If you see Vercel errors, try both org IDs (comment/uncomment one at a time).

To fix 403 errors, check tokens and their permissions in your .env.

8. Safe Batch Controls
start-all.bat: Opens backend and UI in titled windows for easy management.

shutdown-all.bat:

Kills only RepliconBackend/RepliconUI windows by title.

Kills any process using backend port (default: 3001), so no zombies are left.

restart-all.bat: Fully stops, waits, and restarts everything.

9. File Security & Safety
All shell/Python execution is local only.

Never expose your runner to the public internet.

All output files go into file outputs\.

Always backup your .env and service account JSON!

10. Troubleshooting
Symptom	Solution
“Address in use” on start	Run shutdown-all.bat, or kill port 3001 process with Task Manager or netstat/taskkill
UI: Firebase/GitHub/Vercel is red	Double-check .env tokens, credential file, and restart backend
Output won’t save	Check file permissions and output path
“ls not found” error	On Windows, use dir instead of ls in shell commands

11. Tips & Notes
You can use the UI’s history and help buttons for productivity.

All integrations can be tested instantly with one click in the UI.

Use Markdown/JSON formatting for clear, readable output.

Confirm all file and credential changes by restarting backend with restart-all.bat.

Forensic/continuity note: If Vercel is down, try both org IDs as outlined in AI-CONTINUITY-DATA.md.

🗓 Last updated: 2025-07-14
Replicon Industries – Internal Automation

yaml
Copy code
