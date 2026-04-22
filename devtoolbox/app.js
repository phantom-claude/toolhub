/* ===== Navigation ===== */
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('#tool-list a');
  const panels = document.querySelectorAll('.tool-panel');
  const search = document.getElementById('tool-search');
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.dataset.tool;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      panels.forEach(p => p.classList.toggle('active', p.id === id));
      if (window.innerWidth <= 900) sidebar.classList.remove('open');
      // init tools that need it
      if (id === 'color-picker') updateColor();
      if (id === 'unit-converter') populateUnits();
    });
  });

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    document.querySelectorAll('#tool-list li').forEach(li => {
      li.classList.toggle('hidden', !li.textContent.toLowerCase().includes(q));
    });
  });

  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // init
  updateColor();
  populateUnits();
});

/* ===== Helpers ===== */
function clearFields(...ids) {
  ids.forEach(id => { document.getElementById(id).value = ''; });
}

function copyText(id) {
  const el = document.getElementById(id);
  navigator.clipboard.writeText(el.value || el.textContent);
}

function setStatus(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  const baseClass = el.classList.contains('t-status') ? 't-status' : 'status';
  el.className = baseClass + ' ' + type;
}

function downloadText(id, filename) {
  const text = document.getElementById(id).value;
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}

/* ===== 1. JSON Formatter (Full Featured) ===== */

// --- Auto-format on paste ---
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('json-in');
  inp.addEventListener('paste', () => {
    setTimeout(() => {
      if (document.getElementById('json-auto').checked) jsonFormat();
    }, 50);
  });
  inp.addEventListener('scroll', () => syncLineScroll('json-in', 'json-in-lines'));
  document.getElementById('json-out').addEventListener('scroll', () => syncLineScroll('json-out', 'json-out-lines'));
});

function syncLineScroll(textareaId, linesId) {
  const ta = document.getElementById(textareaId);
  const ln = document.getElementById(linesId);
  if (ta && ln) ln.scrollTop = ta.scrollTop;
}

function updateLineNumbers(textareaId, linesId) {
  const show = document.getElementById('json-line-numbers').checked;
  const lnEl = document.getElementById(linesId);
  if (!show) { lnEl.style.display = 'none'; return; }
  lnEl.style.display = '';
  const text = document.getElementById(textareaId).value;
  const count = (text.match(/\n/g) || []).length + 1;
  lnEl.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
}

function updateCharCount(textareaId, countId) {
  const text = document.getElementById(textareaId).value;
  document.getElementById(countId).textContent = text.length.toLocaleString() + ' chars';
}

function jsonInputChanged() {
  updateLineNumbers('json-in', 'json-in-lines');
  updateCharCount('json-in', 'json-in-count');
}

function jsonOutputChanged() {
  updateLineNumbers('json-out', 'json-out-lines');
  updateCharCount('json-out', 'json-out-count');
  const val = document.getElementById('json-out').value;
  if (document.getElementById('json-highlight').checked) jsonUpdateHighlighted(val);
  jsonUpdateTree(val);
}

function jsonSetStatus(msg, type) {
  const el = document.getElementById('json-status');
  el.textContent = msg;
  el.className = 'jf-status-msg ' + type;
}

function getJsonIndent() {
  const v = document.getElementById('json-indent').value;
  return v === '\\t' ? '\t' : parseInt(v);
}

// --- Core operations ---
function jsonFormat() {
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const formatted = JSON.stringify(obj, null, getJsonIndent());
    document.getElementById('json-out').value = formatted;
    jsonSetStatus('✓ Valid JSON — formatted successfully', 'success');
    jsonOutputChanged();
    jsonUpdateStats(obj, formatted);
  } catch (e) {
    jsonSetStatus('✗ ' + e.message, 'error');
  }
}

function jsonMinify() {
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const mini = JSON.stringify(obj);
    document.getElementById('json-out').value = mini;
    jsonSetStatus('✓ Minified — ' + mini.length.toLocaleString() + ' chars', 'success');
    jsonOutputChanged();
    jsonUpdateStats(obj, mini);
  } catch (e) {
    jsonSetStatus('✗ ' + e.message, 'error');
  }
}

function jsonValidate() {
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const type = Array.isArray(obj) ? 'Array' : typeof obj;
    jsonSetStatus(`✓ Valid JSON (${type})`, 'success');
  } catch (e) {
    jsonSetStatus('✗ ' + e.message, 'error');
  }
}

// --- Sort keys recursively ---
function jsonSortKeys() {
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const sorted = sortKeysDeep(obj);
    const formatted = JSON.stringify(sorted, null, getJsonIndent());
    document.getElementById('json-out').value = formatted;
    jsonSetStatus('✓ Keys sorted alphabetically', 'success');
    jsonOutputChanged();
    jsonUpdateStats(sorted, formatted);
  } catch (e) { jsonSetStatus('✗ ' + e.message, 'error'); }
}

function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortKeysDeep(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// --- Flatten / Unflatten ---
function jsonFlatten() {
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const flat = flattenObj(obj);
    const formatted = JSON.stringify(flat, null, getJsonIndent());
    document.getElementById('json-out').value = formatted;
    jsonSetStatus('✓ Flattened to dot notation', 'success');
    jsonOutputChanged();
  } catch (e) { jsonSetStatus('✗ ' + e.message, 'error'); }
}

function flattenObj(obj, prefix = '', res = {}) {
  for (const key of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + key : key;
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      flattenObj(obj[key], path, res);
    } else {
      res[path] = obj[key];
    }
  }
  return res;
}

function jsonUnflatten() {
  try {
    const flat = JSON.parse(document.getElementById('json-in').value);
    const nested = {};
    for (const [key, val] of Object.entries(flat)) {
      const parts = key.split('.');
      let cur = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in cur)) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
    }
    const formatted = JSON.stringify(nested, null, getJsonIndent());
    document.getElementById('json-out').value = formatted;
    jsonSetStatus('✓ Unflattened back to nested', 'success');
    jsonOutputChanged();
  } catch (e) { jsonSetStatus('✗ ' + e.message, 'error'); }
}

// --- Escape / Unescape ---
function jsonStringify() {
  const raw = document.getElementById('json-in').value;
  document.getElementById('json-out').value = JSON.stringify(raw);
  jsonSetStatus('✓ Escaped as string literal', 'success');
  jsonOutputChanged();
}

function jsonUnescape() {
  try {
    const val = JSON.parse(document.getElementById('json-in').value);
    if (typeof val !== 'string') throw new Error('Input must be a JSON string literal');
    document.getElementById('json-out').value = val;
    jsonSetStatus('✓ Unescaped', 'success');
    jsonOutputChanged();
  } catch (e) { jsonSetStatus('✗ ' + e.message, 'error'); }
}

// --- JSON Path query ---
function jsonQueryPath() {
  const pathStr = document.getElementById('json-path').value.trim();
  if (!pathStr) { jsonSetStatus('Enter a JSON path like $.store.book[0].title', 'info'); return; }
  try {
    const obj = JSON.parse(document.getElementById('json-in').value);
    const result = jsonPathResolve(obj, pathStr);
    document.getElementById('json-out').value = JSON.stringify(result, null, getJsonIndent());
    jsonSetStatus(`✓ Path resolved — ${Array.isArray(result) ? result.length + ' results' : typeof result}`, 'success');
    jsonOutputChanged();
  } catch (e) { jsonSetStatus('✗ ' + e.message, 'error'); }
}

function jsonPathResolve(obj, path) {
  // Simple JSON path: $.key.key[0], $.key[*].subkey
  let parts = path.replace(/^\$\.?/, '').split(/\.(?![^\[]*\])/);
  let current = [obj];
  for (const part of parts) {
    if (!part) continue;
    const arrMatch = part.match(/^(.+?)\[([^\]]*)\]$/);
    if (arrMatch) {
      const key = arrMatch[1];
      const index = arrMatch[2];
      let next = [];
      for (const c of current) {
        const v = c[key];
        if (Array.isArray(v)) {
          if (index === '*') next.push(...v);
          else { const i = parseInt(index); if (v[i] !== undefined) next.push(v[i]); }
        }
      }
      current = next;
    } else {
      current = current.map(c => c != null ? c[part] : undefined).filter(v => v !== undefined);
    }
  }
  return current.length === 1 ? current[0] : current;
}

// --- Helpers ---
function jsonCopyOutput() {
  const val = document.getElementById('json-out').value;
  if (val) { navigator.clipboard.writeText(val); jsonSetStatus('📋 Copied to clipboard', 'info'); }
}

function jsonDownload() {
  const val = document.getElementById('json-out').value || document.getElementById('json-in').value;
  if (!val) return;
  const blob = new Blob([val], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function jsonLoadSample() {
  const sample = {
    "company": "Acme Corp",
    "founded": 2010,
    "active": true,
    "address": {
      "street": "123 Innovation Drive",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "coordinates": { "lat": 37.7749, "lng": -122.4194 }
    },
    "employees": [
      { "id": 1, "name": "Alice Johnson", "role": "CEO", "skills": ["leadership", "strategy"] },
      { "id": 2, "name": "Bob Smith", "role": "CTO", "skills": ["architecture", "golang", "python"] },
      { "id": 3, "name": "Charlie Brown", "role": "Designer", "skills": ["figma", "css", "ux"] }
    ],
    "products": [
      { "name": "Widget Pro", "price": 29.99, "inStock": true, "tags": ["popular", "new"] },
      { "name": "Gadget Plus", "price": 49.99, "inStock": false, "tags": ["premium"] }
    ],
    "metadata": { "version": "2.1.0", "lastUpdated": "2026-04-14T12:00:00Z" }
  };
  document.getElementById('json-in').value = JSON.stringify(sample);
  jsonInputChanged();
  jsonFormat();
}

function jsonClearAll() {
  document.getElementById('json-in').value = '';
  document.getElementById('json-out').value = '';
  document.getElementById('json-path').value = '';
  document.getElementById('json-status').textContent = '';
  document.getElementById('json-status').className = 'jf-status-msg';
  document.getElementById('json-stats').innerHTML = '';
  document.getElementById('json-out-highlighted').innerHTML = '';
  document.getElementById('json-out-tree').innerHTML = '';
  jsonInputChanged();
  jsonOutputChanged();
}

// --- Stats ---
function jsonUpdateStats(obj, str) {
  const stats = { keys: 0, values: 0, depth: 0, arrays: 0, objects: 0 };
  function walk(v, d) {
    if (d > stats.depth) stats.depth = d;
    if (Array.isArray(v)) {
      stats.arrays++;
      v.forEach(item => walk(item, d + 1));
    } else if (v !== null && typeof v === 'object') {
      stats.objects++;
      for (const k of Object.keys(v)) {
        stats.keys++;
        walk(v[k], d + 1);
      }
    } else {
      stats.values++;
    }
  }
  walk(obj, 0);
  document.getElementById('json-stats').innerHTML = `
    <span><span class="jf-stat-label">Size:</span> <span class="jf-stat-val">${str.length.toLocaleString()}</span></span>
    <span><span class="jf-stat-label">Keys:</span> <span class="jf-stat-val">${stats.keys}</span></span>
    <span><span class="jf-stat-label">Values:</span> <span class="jf-stat-val">${stats.values}</span></span>
    <span><span class="jf-stat-label">Depth:</span> <span class="jf-stat-val">${stats.depth}</span></span>
    <span><span class="jf-stat-label">Objects:</span> <span class="jf-stat-val">${stats.objects}</span></span>
    <span><span class="jf-stat-label">Arrays:</span> <span class="jf-stat-val">${stats.arrays}</span></span>
  `;
}

// --- Syntax Highlighting ---
function jsonUpdateHighlighted(jsonStr) {
  const el = document.getElementById('json-out-highlighted');
  if (!jsonStr) { el.innerHTML = ''; return; }
  el.innerHTML = syntaxHighlightJSON(jsonStr);
}

function syntaxHighlightJSON(json) {
  return escapeHtml(json).replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      let cls = 'jf-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'jf-key' : 'jf-string';
      } else if (/true|false/.test(match)) {
        cls = 'jf-boolean';
      } else if (/null/.test(match)) {
        cls = 'jf-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  ).replace(/([{}\[\]])/g, '<span class="jf-bracket">$1</span>')
   .replace(/(,)/g, '<span class="jf-comma">$1</span>');
}

// --- Tree View ---
function jsonUpdateTree(jsonStr) {
  const el = document.getElementById('json-out-tree');
  if (!jsonStr) { el.innerHTML = ''; return; }
  try {
    const obj = JSON.parse(jsonStr);
    el.innerHTML = buildTree(obj, '', true);
  } catch { el.innerHTML = '<span style="color:var(--red)">Cannot build tree</span>'; }
}

function buildTree(val, key, open) {
  if (val === null) return treeLeaf(key, '<span class="jf-tree-val-null">null</span>');
  if (typeof val === 'boolean') return treeLeaf(key, `<span class="jf-tree-val-boolean">${val}</span>`);
  if (typeof val === 'number') return treeLeaf(key, `<span class="jf-tree-val-number">${val}</span>`);
  if (typeof val === 'string') return treeLeaf(key, `<span class="jf-tree-val-string">"${escapeHtml(val)}"</span>`);

  const isArr = Array.isArray(val);
  const entries = isArr ? val.map((v, i) => [i, v]) : Object.entries(val);
  const type = isArr ? `Array[${entries.length}]` : `Object{${entries.length}}`;
  const id = 'tree_' + Math.random().toString(36).slice(2, 8);
  const children = entries.map(([k, v]) => buildTree(v, k, false)).join('');

  return `<div class="jf-tree-line">
    <span class="jf-tree-toggle" onclick="this.textContent=this.textContent==='▶'?'▼':'▶';document.getElementById('${id}').classList.toggle('jf-tree-hidden')">${open ? '▼' : '▶'}</span>
    ${key !== '' ? `<span class="jf-tree-key">${escapeHtml(String(key))}</span>: ` : ''}
    <span class="jf-tree-type">${type}</span>
  </div>
  <div id="${id}" class="jf-tree-node${open ? '' : ' jf-tree-hidden'}">${children}</div>`;
}

function treeLeaf(key, valHtml) {
  return `<div class="jf-tree-line" style="padding-left:20px">
    ${key !== '' ? `<span class="jf-tree-key">${escapeHtml(String(key))}</span>: ` : ''}${valHtml}
  </div>`;
}

// --- Tab switching ---
function jsonSwitchTab(btn, tab) {
  document.querySelectorAll('.jf-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('json-out').style.display = tab === 'raw' ? '' : 'none';
  document.getElementById('json-out-lines').style.display = tab === 'raw' ? '' : 'none';
  document.getElementById('json-out-highlighted').style.display = tab === 'highlighted' ? '' : 'none';
  document.getElementById('json-out-tree').style.display = tab === 'tree' ? '' : 'none';
}

/* ===== 2. Markdown Editor ===== */
function renderMarkdown() {
  const md = document.getElementById('md-in').value;
  if (typeof marked !== 'undefined') {
    document.getElementById('md-out').innerHTML = marked.parse(md);
  } else {
    document.getElementById('md-out').textContent = md;
  }
}

/* ===== 3. Base64 ===== */
function b64Encode() {
  try {
    document.getElementById('b64-out').value = btoa(unescape(encodeURIComponent(document.getElementById('b64-in').value)));
  } catch (e) { document.getElementById('b64-out').value = 'Error: ' + e.message; }
}

function b64Decode() {
  try {
    document.getElementById('b64-out').value = decodeURIComponent(escape(atob(document.getElementById('b64-in').value.trim())));
  } catch (e) { document.getElementById('b64-out').value = 'Error: ' + e.message; }
}

/* ===== 4. URL Encoder ===== */
function urlEnc() {
  document.getElementById('url-out').value = encodeURIComponent(document.getElementById('url-in').value);
}
function urlDec() {
  try {
    document.getElementById('url-out').value = decodeURIComponent(document.getElementById('url-in').value);
  } catch (e) { document.getElementById('url-out').value = 'Error: ' + e.message; }
}

/* ===== 5. Color Picker ===== */
function updateColor() {
  const hex = document.getElementById('color-input').value;
  document.getElementById('color-swatch').style.background = hex;
  document.getElementById('color-hex').value = hex.toUpperCase();

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.getElementById('color-rgb').value = `rgb(${r}, ${g}, ${b})`;

  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
      case gg: h = ((bb - rr) / d + 2) / 6; break;
      case bb: h = ((rr - gg) / d + 4) / 6; break;
    }
  }
  document.getElementById('color-hsl').value = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/* ===== 6. Hash Generator ===== */
async function generateHashes() {
  const text = document.getElementById('hash-in').value;
  const enc = new TextEncoder().encode(text);
  const algos = [
    ['SHA-1', 'hash-sha1'],
    ['SHA-256', 'hash-sha256'],
    ['SHA-512', 'hash-sha512'],
  ];
  for (const [algo, id] of algos) {
    const buf = await crypto.subtle.digest(algo, enc);
    document.getElementById(id).value = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/* ===== 7. Password Generator (Full Featured) ===== */

let pgCurrentStyle = 'smart';
const pgHistory = [];

// Word lists for passphrase
const pgWords = [
  'brave','tiger','jump','cloud','river','storm','swift','flame','crystal','shadow',
  'lunar','solar','ocean','forest','eagle','thunder','iron','silver','golden','cosmic',
  'alpha','delta','omega','nova','meteor','comet','pulse','spark','blaze','frost',
  'rapid','quiet','vivid','bold','calm','fierce','noble','royal','magic','power',
  'stone','steel','glass','silk','velvet','coral','amber','ivory','jade','onyx',
  'maple','cedar','birch','aspen','lotus','orchid','tulip','daisy','fern','moss',
  'hawk','wolf','bear','lion','fox','deer','whale','crow','swan','dove',
  'peak','vale','mesa','dune','reef','cove','glen','ridge','cliff','bay'
];

// Consonants/vowels for pronounceable
const pgConsonants = 'bcdfghjklmnpqrstvwxyz';
const pgVowels = 'aeiou';

function pgSelectStyle(card, style) {
  document.querySelectorAll('.pg-style-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  pgCurrentStyle = style;
  // Show/hide segment slider (only for smart & pronounceable)
  const segRow = document.getElementById('pg-seg-row');
  segRow.style.display = (style === 'smart' || style === 'pronounceable') ? '' : 'none';
}

function pgUpdateLen() {
  document.getElementById('pg-len-val').textContent = document.getElementById('pg-len').value;
}

function pgUpdateSeg() {
  document.getElementById('pg-seg-val').textContent = document.getElementById('pg-seg').value;
}

function pgGenerate(count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(pgCreatePassword());
  }
  pgRenderOutput(results);
}

function pgCreatePassword() {
  switch (pgCurrentStyle) {
    case 'smart': return pgSmartPattern();
    case 'random': return pgRandomMix();
    case 'pronounceable': return pgPronounceable();
    case 'passphrase': return pgPassphrase();
    default: return pgRandomMix();
  }
}

// --- Smart Pattern: Xxx00-Xxx00-Xxx00 ---
function pgSmartPattern() {
  const segments = parseInt(document.getElementById('pg-seg').value) || 3;
  const parts = [];
  for (let s = 0; s < segments; s++) {
    let part = '';
    // Uppercase letter
    part += pgRandChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    // 2 lowercase
    part += pgRandChar('abcdefghijklmnopqrstuvwxyz');
    part += pgRandChar('abcdefghijklmnopqrstuvwxyz');
    // 2 digits
    part += pgRandChar('0123456789');
    part += pgRandChar('0123456789');
    parts.push(part);
  }
  return parts.join('-');
}

// --- Random Mix ---
function pgRandomMix() {
  const len = parseInt(document.getElementById('pg-len').value) || 16;
  let chars = '';
  if (document.getElementById('pg-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (document.getElementById('pg-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (document.getElementById('pg-digits').checked) chars += '0123456789';
  if (document.getElementById('pg-symbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
  return pw;
}

// --- Pronounceable: Bix-Kef-Nup-792 ---
function pgPronounceable() {
  const segments = parseInt(document.getElementById('pg-seg').value) || 3;
  const parts = [];
  for (let s = 0; s < segments; s++) {
    let syl = '';
    // Consonant + vowel + consonant
    syl += pgRandChar(pgConsonants).toUpperCase();
    syl += pgRandChar(pgVowels);
    syl += pgRandChar(pgConsonants);
    parts.push(syl);
  }
  // Add numeric suffix
  let num = '';
  for (let i = 0; i < 3; i++) num += pgRandChar('0123456789');
  parts.push(num);
  return parts.join('-');
}

// --- Passphrase: brave-tiger-jump-42 ---
function pgPassphrase() {
  const wordCount = Math.max(2, Math.min(8, Math.floor(parseInt(document.getElementById('pg-len').value) / 5)));
  const picked = [];
  const rand = new Uint32Array(wordCount + 1);
  crypto.getRandomValues(rand);
  for (let i = 0; i < wordCount; i++) {
    picked.push(pgWords[rand[i] % pgWords.length]);
  }
  const num = (rand[wordCount] % 90) + 10;
  picked.push(String(num));
  return picked.join('-');
}

function pgRandChar(chars) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return chars[arr[0] % chars.length];
}

// --- Calculate entropy ---
function pgCalcEntropy(pw) {
  let poolSize = 0;
  if (/[a-z]/.test(pw)) poolSize += 26;
  if (/[A-Z]/.test(pw)) poolSize += 26;
  if (/[0-9]/.test(pw)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) poolSize += 32;
  return poolSize > 0 ? Math.log2(Math.pow(poolSize, pw.replace(/[-\s]/g, '').length)) : 0;
}

function pgStrengthInfo(entropy) {
  if (entropy >= 120) return { label: 'Very Strong', cls: 'pg-str-very-strong', pct: 100 };
  if (entropy >= 80) return { label: 'Strong', cls: 'pg-str-strong', pct: 80 };
  if (entropy >= 60) return { label: 'Moderate', cls: 'pg-str-moderate', pct: 55 };
  return { label: 'Weak', cls: 'pg-str-weak', pct: 30 };
}

function pgEntropyColor(entropy) {
  if (entropy >= 120) return 'linear-gradient(90deg, #4f8cff, #a855f7)';
  if (entropy >= 80) return '#34d399';
  if (entropy >= 60) return '#fbbf24';
  return '#f87171';
}

// --- Colorize password characters ---
function pgColorize(pw) {
  return pw.split('').map(ch => {
    if (ch === '-' || ch === ' ') return `<span class="pg-ch-sep">${ch}</span>`;
    if (/[A-Z]/.test(ch)) return `<span class="pg-ch-upper">${ch}</span>`;
    if (/[0-9]/.test(ch)) return `<span class="pg-ch-digit">${ch}</span>`;
    if (/[a-z]/.test(ch)) return `<span class="pg-ch-lower">${ch}</span>`;
    return `<span class="pg-ch-symbol">${escapeHtml(ch)}</span>`;
  }).join('');
}

// --- Render output ---
function pgRenderOutput(passwords) {
  const out = document.getElementById('pg-output');
  let html = '';
  passwords.forEach((pw, i) => {
    const entropy = pgCalcEntropy(pw);
    const str = pgStrengthInfo(entropy);
    const id = 'pg-pw-' + Date.now() + '-' + i;
    html += `
      <div class="pg-result" style="animation-delay:${i * 60}ms">
        <div style="flex:1;min-width:0">
          <div class="pg-result-pw" id="${id}">${pgColorize(pw)}</div>
          <div class="pg-entropy-bar"><div class="pg-entropy-fill" style="width:${str.pct}%;background:${pgEntropyColor(entropy)}"></div></div>
          <div class="pg-entropy-text">
            <span>${Math.round(entropy)} bits entropy</span>
            <span>${pw.length} characters</span>
          </div>
        </div>
        <span class="pg-strength ${str.cls}">${str.label}</span>
        <div class="pg-result-actions">
          <button class="pg-btn-copy" onclick="pgCopy(this,'${pw.replace(/'/g, "\\'")}')">Copy</button>
        </div>
      </div>`;
    // Add to history
    pgHistory.unshift({ pw, time: new Date() });
  });
  out.innerHTML = html;

  // Update previews on cards
  pgUpdatePreviews();

  // Show history
  if (pgHistory.length) pgRenderHistory();
}

function pgCopy(btn, pw) {
  navigator.clipboard.writeText(pw);
  btn.textContent = '✓ Copied';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
}

function pgUpdatePreviews() {
  // Generate fresh preview for each style
  const origStyle = pgCurrentStyle;
  pgCurrentStyle = 'smart';
  document.getElementById('pg-preview-smart').textContent = pgCreatePassword();
  pgCurrentStyle = 'random';
  document.getElementById('pg-preview-random').textContent = pgCreatePassword().slice(0, 12);
  pgCurrentStyle = 'pronounceable';
  document.getElementById('pg-preview-pronounceable').textContent = pgCreatePassword();
  pgCurrentStyle = 'passphrase';
  document.getElementById('pg-preview-passphrase').textContent = pgCreatePassword();
  pgCurrentStyle = origStyle;
}

function pgRenderHistory() {
  const wrap = document.getElementById('pg-history-wrap');
  const el = document.getElementById('pg-history');
  wrap.style.display = '';
  el.innerHTML = pgHistory.slice(0, 20).map(h =>
    `<div class="pg-history-item">
      <span>${escapeHtml(h.pw)}</span>
      <span class="pg-history-time">${h.time.toLocaleTimeString()}</span>
    </div>`
  ).join('');
}

function pgClearHistory() {
  pgHistory.length = 0;
  document.getElementById('pg-history').innerHTML = '';
  document.getElementById('pg-history-wrap').style.display = 'none';
}

// Keep old API working for other references
function genPassword() { pgGenerate(1); }

/* ===== 8. QR Generator ===== */
function genQR() {
  const text = document.getElementById('qr-in').value.trim();
  const out = document.getElementById('qr-out');
  out.innerHTML = '';
  if (!text) return;
  if (typeof qrcode === 'undefined') { out.textContent = 'QR library not loaded'; return; }
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    out.innerHTML = qr.createImgTag(6, 12);
  } catch (e) { out.textContent = 'Error: ' + e.message; }
}

/* ===== 9. Timestamp Converter ===== */
function tsToDate() {
  const ts = parseInt(document.getElementById('ts-unix').value);
  if (isNaN(ts)) { setStatus('ts-result', 'Enter a valid timestamp', 'error'); return; }
  const d = new Date(ts * 1000);
  document.getElementById('ts-date').value = d.toISOString().slice(0, 19);
  setStatus('ts-result', `UTC: ${d.toUTCString()}  |  Local: ${d.toLocaleString()}`, 'info');
}

function dateToTs() {
  const val = document.getElementById('ts-date').value;
  if (!val) { setStatus('ts-result', 'Select a date', 'error'); return; }
  const ts = Math.floor(new Date(val).getTime() / 1000);
  document.getElementById('ts-unix').value = ts;
  setStatus('ts-result', `Unix timestamp: ${ts}`, 'info');
}

function tsNow() {
  const now = Math.floor(Date.now() / 1000);
  document.getElementById('ts-unix').value = now;
  tsToDate();
}

/* ===== 10. Unit Converter ===== */
const units = {
  length: {
    meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
    mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254
  },
  weight: {
    kilogram: 1, gram: 0.001, milligram: 0.000001,
    pound: 0.453592, ounce: 0.0283495, ton: 1000
  },
  temperature: { celsius: 'C', fahrenheit: 'F', kelvin: 'K' },
  data: {
    byte: 1, kilobyte: 1024, megabyte: 1048576,
    gigabyte: 1073741824, terabyte: 1099511627776
  }
};

function populateUnits() {
  const cat = document.getElementById('unit-category').value;
  const keys = Object.keys(units[cat]);
  ['unit-from', 'unit-to'].forEach((id, i) => {
    const sel = document.getElementById(id);
    sel.innerHTML = keys.map((k, j) => `<option value="${k}" ${j === i ? 'selected' : ''}>${k}</option>`).join('');
  });
  convertUnit();
}

function convertUnit() {
  const cat = document.getElementById('unit-category').value;
  const val = parseFloat(document.getElementById('unit-val').value);
  const from = document.getElementById('unit-from').value;
  const to = document.getElementById('unit-to').value;
  if (isNaN(val)) { document.getElementById('unit-result').value = ''; return; }

  let result;
  if (cat === 'temperature') {
    let celsius;
    if (from === 'celsius') celsius = val;
    else if (from === 'fahrenheit') celsius = (val - 32) * 5 / 9;
    else celsius = val - 273.15;

    if (to === 'celsius') result = celsius;
    else if (to === 'fahrenheit') result = celsius * 9 / 5 + 32;
    else result = celsius + 273.15;
  } else {
    result = val * units[cat][from] / units[cat][to];
  }
  document.getElementById('unit-result').value = parseFloat(result.toPrecision(10));
}

/* ===== 11. File Converter ===== */
function fcFileSelected() {
  const f = document.getElementById('file-input');
  const drop = document.getElementById('fc-drop');
  if (f.files.length) {
    drop.innerHTML = `<div class="fc-drop-icon">✓</div><div>${escapeHtml(f.files[0].name)}</div><div class="fc-drop-hint">${(f.files[0].size/1024).toFixed(1)} KB</div>`;
  }
}

function convertFile() {
  const fileInput = document.getElementById('file-input');
  const format = document.getElementById('file-format').value;
  if (!fileInput.files.length) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.getElementById('file-canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const ext = format.split('/')[1];
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'converted.' + ext;
        a.click();
        URL.revokeObjectURL(a.href);
      }, format, 0.92);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(fileInput.files[0]);
}

/* ===== 12. Regex Tester ===== */
function testRegex() {
  const pattern = document.getElementById('regex-pattern').value;
  const flags = document.getElementById('regex-flags').value;
  const text = document.getElementById('regex-text').value;
  const out = document.getElementById('regex-out');
  if (!pattern || !text) { out.innerHTML = '<span style="color:var(--text2)">Enter pattern and text</span>'; return; }

  try {
    const re = new RegExp(pattern, flags);
    let matchCount = 0;
    const highlighted = text.replace(re, match => {
      matchCount++;
      return `<span class="match">${escapeHtml(match)}</span>`;
    });
    out.innerHTML = matchCount ? highlighted : '<span style="color:var(--red)">No matches</span>';
  } catch (e) {
    out.innerHTML = `<span style="color:var(--red)">Invalid regex: ${escapeHtml(e.message)}</span>`;
  }
}

/* ===== 13. JSON Diff ===== */
function jsonDiff() {
  const out = document.getElementById('diff-out');
  try {
    const a = JSON.parse(document.getElementById('diff-a').value);
    const b = JSON.parse(document.getElementById('diff-b').value);
    const lines = [];
    diffObjects(a, b, '', lines);
    if (!lines.length) lines.push('<div class="unchanged">No differences found</div>');
    out.innerHTML = lines.join('\n');
  } catch (e) {
    out.innerHTML = `<span style="color:var(--red)">Parse error: ${escapeHtml(e.message)}</span>`;
  }
}

function diffObjects(a, b, path, lines) {
  const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of allKeys) {
    const p = path ? path + '.' + key : key;
    const inA = a != null && key in a;
    const inB = b != null && key in b;
    if (inA && !inB) {
      lines.push(`<div class="removed">- ${escapeHtml(p)}: ${escapeHtml(JSON.stringify(a[key]))}</div>`);
    } else if (!inA && inB) {
      lines.push(`<div class="added">+ ${escapeHtml(p)}: ${escapeHtml(JSON.stringify(b[key]))}</div>`);
    } else if (typeof a[key] === 'object' && typeof b[key] === 'object' && a[key] !== null && b[key] !== null && !Array.isArray(a[key])) {
      diffObjects(a[key], b[key], p, lines);
    } else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      lines.push(`<div class="removed">- ${escapeHtml(p)}: ${escapeHtml(JSON.stringify(a[key]))}</div>`);
      lines.push(`<div class="added">+ ${escapeHtml(p)}: ${escapeHtml(JSON.stringify(b[key]))}</div>`);
    }
  }
}

/* ===== 14. SQL Formatter ===== */
function sqlFormat() {
  const input = document.getElementById('sql-in').value.trim();
  if (!input) return;

  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
    'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE',
    'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'FULL JOIN', 'CROSS JOIN', 'ON', 'AS', 'DISTINCT', 'UNION',
    'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IN',
    'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'EXISTS', 'NOT EXISTS',
    'INTO', 'IF', 'BEGIN', 'COMMIT', 'ROLLBACK'
  ];

  // Uppercase keywords
  let sql = input;
  keywords.sort((a, b) => b.length - a.length);
  for (const kw of keywords) {
    const re = new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi');
    sql = sql.replace(re, kw);
  }

  // Add newlines before major keywords
  const lineBreakers = [
    'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
    'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
    'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'UNION', 'UNION ALL'
  ];
  for (const kw of lineBreakers) {
    const re = new RegExp('(?<!^)\\b(' + kw.replace(/ /g, '\\s+') + ')\\b', 'g');
    sql = sql.replace(re, '\n$1');
  }

  // Indent sub-clauses
  const lines = sql.split('\n').map(l => l.trim()).filter(Boolean);
  const indentKw = ['AND', 'OR', 'ON', 'SET', 'VALUES'];
  const formatted = lines.map(line => {
    for (const kw of indentKw) {
      if (line.startsWith(kw + ' ') || line === kw) return '  ' + line;
    }
    return line;
  });

  document.getElementById('sql-out').value = formatted.join('\n');
}

/* ===== 15. HTML Encoder ===== */
function htmlEnc() {
  const input = document.getElementById('html-in').value;
  document.getElementById('html-out').value = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function htmlDecFn() {
  const input = document.getElementById('html-in').value;
  const doc = new DOMParser().parseFromString(input, 'text/html');
  document.getElementById('html-out').value = doc.documentElement.textContent;
}

/* ===== 16. UUID Generator ===== */
function genUUIDs() {
  const count = Math.min(parseInt(document.getElementById('uuid-count').value) || 1, 100);
  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(crypto.randomUUID());
  }
  document.getElementById('uuid-out').value = uuids.join('\n');
}

/* ===== 17. JSON to CSV ===== */
function jsonToCsv() {
  try {
    const data = JSON.parse(document.getElementById('csv-in').value);
    if (!Array.isArray(data) || !data.length) throw new Error('Input must be a non-empty array of objects');
    const headers = [...new Set(data.flatMap(Object.keys))];
    const csvEscape = v => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const rows = [headers.map(csvEscape).join(',')];
    for (const row of data) {
      rows.push(headers.map(h => csvEscape(row[h])).join(','));
    }
    document.getElementById('csv-out').value = rows.join('\n');
  } catch (e) {
    document.getElementById('csv-out').value = 'Error: ' + e.message;
  }
}

/* ===== 18. CSS Minifier ===== */
function cssMinify() {
  const input = document.getElementById('css-in').value;
  const minified = input
    .replace(/\/\*[\s\S]*?\*\//g, '')    // remove comments
    .replace(/\s+/g, ' ')                // collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // remove spaces around tokens
    .replace(/;}/g, '}')                  // remove last semicolon
    .trim();
  document.getElementById('css-out').value = minified;
  const saved = ((1 - minified.length / input.length) * 100).toFixed(1);
  setStatus('css-stats', `Original: ${input.length} chars → Minified: ${minified.length} chars (${saved}% saved)`, 'info');
}

function cssBeautify() {
  const input = document.getElementById('css-in').value;
  let depth = 0;
  let result = '';
  const tokens = input.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').split('');
  for (let i = 0; i < tokens.length; i++) {
    const c = tokens[i];
    if (c === '{') {
      depth++;
      result += ' {\n' + '  '.repeat(depth);
    } else if (c === '}') {
      depth--;
      result = result.trimEnd() + '\n' + '  '.repeat(depth) + '}\n' + '  '.repeat(depth);
    } else if (c === ';') {
      result += ';\n' + '  '.repeat(depth);
    } else if (c === ':') {
      result += ': ';
    } else {
      result += c;
    }
  }
  document.getElementById('css-out').value = result.trim();
}

/* ===== 19. Random Selector ===== */

// --- Tab switching ---
function rsMode(mode, btn) {
  document.querySelectorAll('.rs-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.rs-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('rs-' + mode + '-panel').classList.add('active');
  if (mode === 'wheel') wheelDraw();
}

// --- List pick (original) ---
function randomPick() {
  const items = document.getElementById('rand-in').value.split('\n').map(s => s.trim()).filter(Boolean);
  const count = Math.min(parseInt(document.getElementById('rand-count').value) || 1, items.length);
  if (!items.length) { document.getElementById('rand-out').textContent = 'Add some items first'; return; }

  const arr = [...items];
  const rand = new Uint32Array(arr.length);
  crypto.getRandomValues(rand);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  document.getElementById('rand-out').textContent = arr.slice(0, count).join(', ');
}

// --- Number range pick ---
function rangePick() {
  const min = parseInt(document.getElementById('range-min').value) || 0;
  const max = parseInt(document.getElementById('range-max').value) || 100;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const result = lo + (rand[0] % (hi - lo + 1));
  document.getElementById('range-result').innerHTML = `<div class="rs-range-number">${result}</div>`;
}

// --- Spinning Wheel ---
const wheelColors = [
  '#4f8cff','#a855f7','#f59e0b','#ef4444','#34d399','#ec4899',
  '#06b6d4','#f97316','#6366f1','#22c55e','#e11d48','#8b5cf6',
  '#14b8a6','#fbbf24','#3b82f6','#d946ef'
];
let wheelAngle = 0;
let wheelSpinning = false;

function wheelGetItems() {
  const text = document.getElementById('wheel-items').value;
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function wheelDraw(highlightIdx) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const items = wheelGetItems();
  const n = items.length || 1;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    // Empty state
    ctx.fillStyle = '#23262f';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add items above', cx, cy);
    return;
  }

  const sliceAngle = (Math.PI * 2) / n;

  for (let i = 0; i < n; i++) {
    const startA = wheelAngle + i * sliceAngle;
    const endA = startA + sliceAngle;

    // Slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startA, endA);
    ctx.closePath();
    ctx.fillStyle = wheelColors[i % wheelColors.length];
    if (highlightIdx === i) {
      ctx.fillStyle = '#fff';
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startA + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = highlightIdx === i ? '#0f1117' : '#fff';
    ctx.font = `bold ${Math.min(14, 160 / n)}px sans-serif`;
    const label = items[i].length > 14 ? items[i].slice(0, 12) + '…' : items[i];
    ctx.fillText(label, r - 16, 5);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#181a20';
  ctx.fill();
  ctx.strokeStyle = '#2e3140';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function wheelSpin() {
  if (wheelSpinning) return;
  const items = wheelGetItems();
  if (!items.length) return;

  wheelSpinning = true;
  const btn = document.getElementById('wheel-spin-btn');
  btn.disabled = true;
  btn.classList.add('spinning');
  document.getElementById('wheel-result').style.display = 'none';

  // Pick winner
  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const winnerIdx = rand[0] % items.length;

  const n = items.length;
  const sliceAngle = (Math.PI * 2) / n;

  // Calculate target: the pointer is at top (270° = -π/2)
  // We want winnerIdx's slice center to be at the top
  const targetSliceCenter = winnerIdx * sliceAngle + sliceAngle / 2;
  // Pointer is at -π/2 (top). We need: wheelAngle + targetSliceCenter ≡ -π/2 (mod 2π)
  // So wheelAngle = -π/2 - targetSliceCenter
  const targetAngle = -Math.PI / 2 - targetSliceCenter;

  // Add full rotations for dramatic spinning (5-8 full turns)
  const extraTurns = 5 + (rand[0] % 4);
  const totalRotation = extraTurns * Math.PI * 2;
  const startAngle = wheelAngle;
  const endAngle = targetAngle - totalRotation;

  const duration = 4000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);

    wheelAngle = startAngle + (endAngle - startAngle) * ease;
    wheelDraw();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Normalize angle
      wheelAngle = targetAngle;
      wheelDraw(winnerIdx);

      // Show result
      const resultEl = document.getElementById('wheel-result');
      resultEl.style.display = '';
      resultEl.innerHTML = `🎉 <strong>${escapeHtml(items[winnerIdx])}</strong>`;

      btn.disabled = false;
      btn.classList.remove('spinning');
      wheelSpinning = false;
    }
  }

  requestAnimationFrame(animate);
}

/* ===== 20. JWT Decoder ===== */
function decodeJWT() {
  const token = document.getElementById('jwt-in').value.trim();
  const parts = token.split('.');
  if (parts.length < 2) {
    document.getElementById('jwt-header').textContent = 'Invalid JWT format';
    document.getElementById('jwt-payload').textContent = '';
    return;
  }
  try {
    const decode = s => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));
    document.getElementById('jwt-header').textContent = JSON.stringify(decode(parts[0]), null, 2);
    document.getElementById('jwt-payload').textContent = JSON.stringify(decode(parts[1]), null, 2);
  } catch (e) {
    document.getElementById('jwt-header').textContent = 'Decode error: ' + e.message;
    document.getElementById('jwt-payload').textContent = '';
  }
}
