
// FILE: ai-interface/runner-ui.js   GENERATED: 2025-07-21T15:44:00+02:00
// Re-enabled fetchStatusBar with 30-second interval and debugging

const backendBaseURL = 'http://localhost:3001';

// Ensure dark mode is default on load
if (!document.body.classList.contains('dark-mode')) {
  document.body.classList.add('dark-mode');
}

// Action Templates for each action type
const templates = {
  shell: ["dir", "echo 'Hello World'"],
  python: ["print('Hello from Python!')"],
  read: ["ai-interface/index.html", "file outputs/output.txt"],
  write: [`{
  "filename": "file outputs/test.md",
  "content": "## Example Markdown\\nHello world!"
}`],
  json: [`{
  "type": "shell",
  "command": "dir"
}`,
`{
  "type": "python",
  "command": "print('Hello from JSON Python!')"
}`]
};

// Map option text to action values for compatibility with minimal index.html
const actionMap = {
  "Run Shell Command": "shell",
  "Run Python": "python",
  "Read File": "read",
  "Write File": "write",
  "Run JSON": "json"
};

// Show Templates
function showTemplates() {
  const actionType = document.getElementById("actionType");
  const area = document.getElementById("templates");
  if (!actionType || !area) return;
  let action = actionType.value;
  action = actionMap[action] || action;
  area.innerHTML = "";
  (templates[action] || []).forEach(t => {
    let btn = document.createElement("button");
    btn.innerText = "Insert Example";
    btn.type = "button";
    btn.onclick = () => { document.getElementById("inputBox").value = t; };
    area.appendChild(btn);
  });
}

// Event Wiring on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  showTemplates();
  const actionType = document.getElementById("actionType");
  if (actionType) actionType.onchange = showTemplates;

  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) darkToggle.onclick = function() { document.body.classList.toggle('dark-mode'); };

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.onclick = submitToRunner;

  const clearInputBtn = document.getElementById('clearInputBtn');
  if (clearInputBtn) clearInputBtn.onclick = clearInput;

  const clearOutputBtn = document.getElementById('clearOutputBtn');
  if (clearOutputBtn) clearOutputBtn.onclick = clearOutput;

  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) helpBtn.onclick = openHelp;

  const testFirebaseBtn = document.getElementById('testFirebaseBtn');
  if (testFirebaseBtn) testFirebaseBtn.onclick = () => runTest('firebase', 'Firebase');

  const testGitHubBtn = document.getElementById('testGitHubBtn');
  if (testGitHubBtn) testGitHubBtn.onclick = () => runTest('github', 'GitHub');

  const testVercelBtn = document.getElementById('testVercelBtn');
  if (testVercelBtn) testVercelBtn.onclick = () => runTest('vercel', 'Vercel');

  const copyOutputBtn = document.getElementById('copyOutputBtn');
  if (copyOutputBtn) copyOutputBtn.onclick = copyOutput;

  const saveOutputBtn = document.getElementById('saveOutputBtn');
  if (saveOutputBtn) saveOutputBtn.onclick = saveOutputToFile;

  if (document.getElementById("statusbar")) {
    fetchStatusBar();
    setInterval(() => {
      if (document.getElementById("statusbar")) fetchStatusBar();
    }, 30000);
  }
});

// Status Bar Handling
async function fetchStatusBar() {
  const statusbar = document.getElementById("statusbar");
  if (!statusbar) return;
  try {
    let res = await fetch(`${backendBaseURL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test_all_integrations", targets: ["firebase", "github", "vercel"] })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    let data = await res.json();
    let html = "";
    html += data.output.includes('✅ Firebase') ? `<span class='status-ok'>Firebase ✓</span>` : `<span class='status-missing'>Firebase ✗</span>`;
    html += data.output.includes('✅ GitHub') ? `<span class='status-ok'>GitHub ✓</span>` : `<span class='status-missing'>GitHub ✗</span>`;
    html += data.output.includes('✅ Vercel') ? `<span class='status-ok'>Vercel ✓</span>` : `<span class='status-missing'>Vercel ✗</span>`;
    statusbar.innerHTML = html;
    console.log('Status bar updated:', data.output); // Debugging
  } catch (e) {
    statusbar.innerHTML = "<span style='color:red'>Status: Error fetching integrations - " + e.message + "</span>";
    console.error('fetchStatusBar error:', e.message); // Debugging
  }
}

// Submit & Spinner
function submitToRunner() {
  const actionType = document.getElementById("actionType");
  const input = document.getElementById("inputBox").value.trim();
  if (!actionType) return;
  let action = actionType.value;
  action = actionMap[action] || action;
  let payload = { action };

  if (["shell", "python"].includes(action)) {
    if (!confirm("Are you sure you want to run this " + action + " code?")) return;
  }

  switch (action) {
    case "shell":
    case "python":
      payload.inputData = input;
      break;
    case "read":
      payload.targetPath = input;
      break;
    case "write":
      try { JSON.parse(input); payload.inputData = input; }
      catch (e) { showToast("Write File input must be valid JSON."); return; }
      break;
    case "json":
      try { JSON.parse(input); payload.raw = input; }
      catch (e) { showToast("Run JSON input must be valid JSON."); return; }
      break;
    default:
      payload.inputData = input;
  }

  showSpinner(true);
  fetch(`${backendBaseURL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    const outputBox = document.getElementById("outputBox");
    if (outputBox) outputBox.value = data.output || "";
    renderOutput(data.output);
    pushHistory(input, data.output);
    showToast("Done!");
    showSpinner(false);
  })
  .catch(error => {
    const outputBox = document.getElementById("outputBox");
    if (outputBox) outputBox.value = "❌ Error: " + error;
    renderOutput("❌ Error: " + error);
    showToast("Failed: " + error, true);
    showSpinner(false);
  });
}

// Render Output (JSON, Markdown, Plain)
function renderOutput(output) {
  const el = document.getElementById("outputRender");
  if (!el || !output) { el && (el.innerHTML = ""); return; }
  try {
    let asObj = JSON.parse(output);
    el.innerHTML = "<pre>" + JSON.stringify(asObj, null, 2) + "</pre>";
    return;
  } catch(e) {}
  if (/^#{1,6} /.test(output) || /\*\*/.test(output)) {
    el.innerHTML = output.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/^# (.*)$/gm, "<h1>$1</h1>");
    return;
  }
  el.innerHTML = "<pre>" + output.replace(/</g,"<").replace(/>/g,">") + "</pre>";
}

// Clear Input/Output
function clearInput() {
  const inputBox = document.getElementById("inputBox");
  if (inputBox) inputBox.value = "";
}
function clearOutput() {
  const outputBox = document.getElementById("outputBox");
  const outputRender = document.getElementById("outputRender");
  if (outputBox) outputBox.value = "";
  if (outputRender) outputRender.innerHTML = "";
}

// History Handling
let history = [];
function pushHistory(input, output) {
  history.unshift({ input, output, time: new Date().toLocaleTimeString() });
  if (history.length > 5) history.pop();
  updateHistoryView();
}
function updateHistoryView() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";
  history.forEach((h, i) => {
    let item = document.createElement("li");
    item.innerHTML = `[${h.time}] <code>${h.input.replace(/</g,"<").replace(/>/g,">").slice(0, 40)}${h.input.length>40?'...':''}</code>`;
    item.onclick = () => {
      const inputBox = document.getElementById("inputBox");
      const outputBox = document.getElementById("outputBox");
      if (inputBox) inputBox.value = h.input;
      if (outputBox) outputBox.value = h.output;
      renderOutput(h.output);
    };
    list.appendChild(item);
  });
}

// Spinner and Toast
function showSpinner(show) {
  const spinner = document.getElementById("spinner");
  if (spinner) spinner.style.display = show ? "" : "none";
}
function showToast(msg, error) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.innerText = msg;
  el.className = "toast show" + (error ? " error" : "");
  setTimeout(() => { el.className = "toast"; }, 2600);
}

// Test Buttons (POST-based)
function runTest(type, label) {
  showSpinner(true);
  fetch(`${backendBaseURL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "test_all_integrations", targets: [type.toLowerCase()] })
  })
  .then(response => response.json())
  .then(data => {
    const outputBox = document.getElementById("outputBox");
    if (outputBox) outputBox.value = data.output || "";
    renderOutput(data.output);
    pushHistory(`[TEST ${label}]`, data.output);
    showToast(`Integration tested: ${label}`);
    showSpinner(false);
    fetchStatusBar();
  })
  .catch(error => {
    const outputBox = document.getElementById("outputBox");
    if (outputBox) outputBox.value = "❌ Error: " + error;
    renderOutput("❌ Error: " + error);
    showToast("Failed: " + error, true);
    showSpinner(false);
    fetchStatusBar();
  });
}

// Output Controls
function copyOutput() {
  const output = document.getElementById("outputBox").value;
  if (!output) { showToast("No output to copy!"); return; }
  navigator.clipboard.writeText(output).then(
    () => showToast("Output copied to clipboard!"),
    () => showToast("Failed to copy output.", true)
  );
}
function saveOutputToFile() {
  const output = document.getElementById("outputBox").value;
  if (!output) { showToast("No output to save!"); return; }
  let filename = prompt("Enter filename (e.g. output.txt or info.md):", "output.txt");
  if (!filename) return;
  if (!filename.startsWith("file outputs/")) filename = "file outputs/" + filename;
  const payload = {
    action: "write",
    inputData: JSON.stringify({ filename, content: output })
  };
  showSpinner(true);
  fetch(`${backendBaseURL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => { showToast(data.output); showSpinner(false); })
  .catch(error => { showToast("❌ Error saving output: " + error, true); showSpinner(false); });
}

// Help Handler
function openHelp() {
  window.open('operators-manual.md', '_blank');
}
