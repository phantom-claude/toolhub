(() => {
  'use strict';

  const STORAGE_KEY = 'toolhub_interview_coach_v1';

  const BANK = {
    databricks: {
      label: 'Databricks',
      loops: {
        phone: ['coding-phone'],
        full: ['recruiter', 'coding-phone', 'coding-onsite', 'concurrency', 'system-design', 'behavioral'],
        'coding-heavy': ['coding-phone', 'coding-onsite', 'coding-onsite', 'concurrency'],
        'design-heavy': ['recruiter', 'coding-phone', 'system-design', 'system-design', 'behavioral'],
      },
      templates: {
        recruiter: {
          name: 'Recruiter Screen',
          duration: '30 min',
          category: 'fit',
          rubric: ['Clear 60-90 second intro', 'Specific Why Databricks', 'Role/location/timeline clarity', 'Resume highlights are crisp'],
          script: [
            'I am a software engineer focused on backend/data infrastructure...',
            'The project I want to highlight is...',
            'I am interested in Databricks because it combines data infrastructure, distributed systems, and AI impact...',
          ].join('\n'),
        },
        'coding-phone': {
          name: 'Technical Phone Screen',
          duration: '45-60 min',
          category: 'coding',
          rubric: ['Clarifies requirements', 'Finds correct data structure', 'Codes cleanly', 'Tests edge cases', 'Explains complexity'],
          script: [
            'Let me clarify the requirements first.',
            'A brute-force solution would be...',
            'The key observation is...',
            'I will test a normal case, an empty/boundary case, and a follow-up case.',
          ].join('\n'),
        },
        'coding-onsite': {
          name: 'Onsite Coding',
          duration: '60 min',
          category: 'coding',
          rubric: ['Production-quality API', 'Handles follow-ups', 'Good variable names', 'Bug-free edge cases', 'Scales beyond in-memory baseline'],
          script: [
            'I will start with a simple correct version, then optimize.',
            'The invariant I want to maintain is...',
            'If this needs to scale, I would...',
          ].join('\n'),
        },
        concurrency: {
          name: 'Concurrency / Machine Coding',
          duration: '60 min',
          category: 'concurrency',
          rubric: ['Identifies shared mutable state', 'Avoids races/deadlocks', 'Backpressure/shutdown plan', 'Testing strategy', 'Performance trade-offs'],
          script: [
            'The shared state here is...',
            'The simplest correct design is a coarse lock, but the throughput bottleneck is...',
            'For production, I would use bounded queues and explicit shutdown behavior.',
          ].join('\n'),
        },
        'system-design': {
          name: 'System Design',
          duration: '60 min',
          category: 'design',
          rubric: ['Requirements and scale', 'API/data model', 'Architecture', 'Deep dive', 'Failure handling', 'Trade-offs', 'Observability'],
          script: [
            'Before jumping into architecture, I want to clarify requirements and scale.',
            'At a high level, I would split the system into...',
            'Let me deep dive into the most critical component...',
            'The main trade-off is...',
          ].join('\n'),
        },
        behavioral: {
          name: 'Behavioral / Hiring Manager',
          duration: '45-60 min',
          category: 'behavioral',
          rubric: ['STAR+L structure', 'Personal ownership', 'Measurable impact', 'Mature conflict handling', 'Clear English'],
          script: [
            'Situation: ...',
            'Task: I was responsible for...',
            'Action: I specifically did...',
            'Result: The measurable impact was...',
            'Learning: Next time I would...',
          ].join('\n'),
        },
      },
      questions: {
        fit: [
          q('Why Databricks?', 'Prepare a concise answer connecting data/AI infrastructure, distributed systems, lakehouse, and customer impact.', ['company-fit', 'english'], ['Make it specific to Databricks, not generic AI hype.', 'Mention one product area: Spark, Delta Lake, notebooks, jobs, MLflow, or lakehouse.'], ['Why this team?', 'What kind of work are you looking for?', 'What is your timeline?']),
          q('Tell me about yourself.', 'Give a 60-90 second intro that frames you as a backend/data-infrastructure engineer with measurable project impact.', ['intro', 'recruiter'], ['Current identity', 'Strongest technical area', 'One project with impact', 'Why this role'], ['Can you go deeper on that project?', 'Why are you leaving?', 'What level are you targeting?']),
        ],
        coding: [
          q('IP to CIDR', 'Given a start IPv4 address and a count n, return the minimum set of CIDR blocks that exactly cover the range.', ['leetcode-751', 'bit-manipulation', 'range'], ['Convert IP to integer', 'Use lowest set bit for aligned block size', 'Respect remaining count', 'Convert block size to prefix length'], ['What about IPv6?', 'How do you validate input?', 'Can adjacent CIDR blocks be merged?']),
          q('Design Hit Counter', 'Design a hit counter that records hits and returns hits in the past 5 minutes.', ['design', 'queue', 'data-stream'], ['Deque for exact counts', 'Bucketed circular array for high QPS', 'Evict old timestamps correctly'], ['What if multiple hits share a timestamp?', 'How to support per-user counters?', 'How to distribute it?']),
          q('Snapshot Array', 'Implement set(index, val), snap(), and get(index, snap_id).', ['leetcode-1146', 'versioning', 'binary-search'], ['Per-index version history', 'Binary search latest version <= snap_id', 'Avoid full array copy'], ['How to compact old versions?', 'What if snap is called millions of times?', 'How to make it thread-safe?']),
          q('Time Based Key-Value Store', 'Implement set(key, value, timestamp) and get(key, timestamp) returning the latest value at or before timestamp.', ['leetcode-981', 'binary-search', 'kv'], ['Map key to sorted versions', 'Binary search floor timestamp', 'Handle missing and early timestamps'], ['What if timestamps are unordered?', 'What if data does not fit memory?', 'How would you shard it?']),
          q('Design Tic-Tac-Toe', 'Design an n x n Tic-Tac-Toe game where move(row, col, player) returns whether the player wins.', ['leetcode-348', 'design', 'matrix'], ['Row/column/diagonal counters', '+1/-1 per player', 'O(1) move'], ['How to support k-in-a-row?', 'How do you reject invalid moves?', 'What about concurrent players?']),
          q('House Robber II', 'Given circular houses, maximize robbed amount without robbing adjacent houses.', ['leetcode-213', 'dp'], ['Reduce to two linear House Robber runs', 'Handle length 1/2 edge cases'], ['How does House Robber III differ?', 'Can you reconstruct chosen houses?']),
          q('Step-By-Step Directions in Binary Tree', 'Return directions from one tree node to another using U, L, and R.', ['leetcode-2096', 'tree', 'lca'], ['Find root-to-node paths', 'Remove common prefix', 'Convert start suffix to U'], ['What if values are not unique?', 'How to support many queries?', 'What if parent pointers exist?']),
          q('Smallest Range Covering K Lists', 'Given k sorted lists, find the smallest range that includes at least one number from each list.', ['leetcode-632', 'heap', 'sliding-window'], ['Min-heap with current max', 'Update best range', 'Stop when a list is exhausted'], ['Can you solve by flattening and sliding window?', 'What if lists stream in?']),
          q('Count Integers in Intervals', 'Design a structure that adds intervals and returns the count of covered integers.', ['leetcode-2276', 'ordered-set', 'intervals'], ['Maintain disjoint intervals', 'Merge overlaps', 'Track total covered count'], ['How to support deletion?', 'How to handle huge coordinate ranges?']),
          q('Web Crawler Multithreaded', 'Crawl URLs under the same hostname using multiple workers without duplicate fetches.', ['leetcode-1242', 'concurrency', 'bfs'], ['Shared visited set', 'Thread-safe queue', 'Same-host filter', 'Worker shutdown'], ['How to rate limit?', 'How to retry failures?', 'How to distribute crawling?']),
          q('Return K Elements Above Threshold', 'Given an array or stream, return k elements above a threshold. Clarify whether arbitrary k or top k is required.', ['top-k', 'heap', 'stream'], ['Clarify arbitrary vs top-k', 'Single pass for arbitrary k', 'Min-heap for top k'], ['What if fewer than k exist?', 'What about repeated threshold queries?', 'How to run distributed?']),
        ],
        concurrency: [
          q('Async Logger', 'Implement a thread-safe logger that accepts messages from many threads and writes efficiently.', ['logger', 'producer-consumer', 'queue'], ['Bounded blocking queue', 'Single writer thread', 'Batch flush', 'Graceful shutdown'], ['Flush every write or batch?', 'How to handle crash durability?', 'How to rotate logs?']),
          q('High-Concurrency LRU Cache', 'Design an LRU cache that supports high concurrent access.', ['lru', 'locking', 'cache'], ['Hash map + list baseline', 'get mutates recency', 'Coarse lock vs segmented LRU'], ['Can read-write locks help?', 'How to reduce contention?', 'What is acceptable approximate LRU?']),
          q('KV Store with Rolling Load Metrics', 'Implement put/get plus measureGetLoad and measurePutLoad for the last five minutes.', ['kv', 'rolling-window', 'metrics'], ['Storage map', 'Deque or buckets for rolling metrics', 'Expired event cleanup'], ['Per-key load?', 'High QPS memory usage?', 'Thread safety?']),
        ],
        design: [
          q('Notebook Query Execution Service', 'Design a service that executes SQL/Python notebook commands and streams results back to users.', ['databricks', 'scheduler', 'query-execution'], ['Submission API', 'Auth', 'Scheduler', 'Cluster manager', 'Result store', 'Progress stream'], ['How to cancel a query?', 'How to handle large results?', 'How to isolate tenants?', 'Worker crash?']),
          q('Delta Lake Metadata Service', 'Design a metadata service for versioned Delta tables with concurrent reads/writes and time travel.', ['delta-lake', 'metadata', 'transactions'], ['Transaction log as source of truth', 'Snapshot cache', 'Optimistic concurrency control', 'Checkpoint/compaction'], ['Concurrent writer conflict?', 'Stale cache?', 'Vacuum vs time travel?', 'Object storage latency?']),
          q('ETL Job Scheduler', 'Design a DAG scheduler for ETL pipelines with retries, dependencies, and monitoring.', ['jobs', 'dag', 'scheduler'], ['Job/task model', 'READY/RUNNING/SUCCESS states', 'Worker heartbeat', 'Retry/backoff', 'Idempotency'], ['Scheduler leader failure?', 'Duplicate output?', 'Long-running tasks?', 'SLA alerts?']),
          q('Distributed Log Ingestion Platform', 'Design a system that ingests logs/events and supports near-real-time analytics.', ['streaming', 'logs', 'analytics'], ['Gateway', 'Durable stream', 'Processors', 'Hot store', 'Lakehouse history'], ['Backpressure?', 'Late events?', 'Exactly-once?', 'Hot partitions?']),
          q('Retail Data Warehouse', 'Design a data warehouse for an online retailer using lakehouse-style layers.', ['warehouse', 'schema', 'analytics'], ['Facts/dimensions', 'Bronze/silver/gold', 'SCD Type 2', 'Partitioning/clustering'], ['Late events?', 'Schema evolution?', 'Data quality checks?']),
          q('ML Model Serving Platform', 'Design a platform for real-time and batch model inference with versioning and rollback.', ['ml-serving', 'platform', 'scale'], ['Model registry', 'Gateway', 'Serving fleet', 'Batch jobs', 'Canary/A-B', 'Monitoring'], ['Feature consistency?', 'Rollback?', 'Autoscaling?', 'Drift detection?']),
        ],
        behavioral: [
          q('Most impactful project', 'Tell me about the project you are most proud of. Use STAR+L and quantify the result.', ['behavioral', 'ownership'], ['Clear role', 'Technical challenge', 'Measurable outcome', 'Learning'], ['What did you personally own?', 'What was the hardest trade-off?', 'What would you do differently?']),
          q('Conflict with teammate', 'Tell me about a time you disagreed with a coworker and how you handled it.', ['behavioral', 'collaboration'], ['Different assumptions', 'Data-driven alignment', 'Respectful communication'], ['What was your mistake?', 'How did the relationship end?', 'What changed afterward?']),
          q('Failure or incident', 'Tell me about a failure, production issue, or mistake.', ['behavioral', 'maturity'], ['Own the issue', 'Root cause', 'Guardrails added', 'Learning'], ['How did you communicate?', 'How did you prevent recurrence?']),
          q('Ambiguous project', 'Describe a time you had to make progress with unclear requirements.', ['behavioral', 'ambiguity'], ['Clarify goals', 'Break down scope', 'Feedback loops', 'Deliver incrementally'], ['How did you choose priorities?', 'Who did you align with?']),
        ],
      },
    },
  };

  let state = loadState() || createEmptyState();
  let activeRoundId = state.activeRoundId || null;
  let toastTimer = null;

  const els = {
    bankCount: document.getElementById('bank-count'),
    company: document.getElementById('company-select'),
    level: document.getElementById('level-select'),
    loop: document.getElementById('loop-select'),
    seed: document.getElementById('seed-input'),
    generate: document.getElementById('generate-btn'),
    reset: document.getElementById('reset-btn'),
    copyLoop: document.getElementById('copy-loop-btn'),
    exportBtn: document.getElementById('export-btn'),
    summary: document.getElementById('summary-grid'),
    sessionLabel: document.getElementById('session-label'),
    roundList: document.getElementById('round-list'),
    empty: document.getElementById('empty-state'),
    view: document.getElementById('round-view'),
    kicker: document.getElementById('round-kicker'),
    title: document.getElementById('round-title'),
    meta: document.getElementById('round-meta'),
    prompt: document.getElementById('round-prompt'),
    tags: document.getElementById('round-tags'),
    signals: document.getElementById('signals-list'),
    followups: document.getElementById('followups-list'),
    rubric: document.getElementById('rubric-list'),
    notes: document.getElementById('notes-input'),
    score: document.getElementById('score-select'),
    saveStatus: document.getElementById('save-status'),
    clearNotes: document.getElementById('clear-notes-btn'),
    copyRound: document.getElementById('copy-round-btn'),
    script: document.getElementById('script-block'),
    toast: document.getElementById('toast'),
  };

  init();

  function init() {
    els.bankCount.textContent = String(countQuestions(BANK.databricks.questions));
    hydrateControls();
    bindEvents();
    render();
  }

  function hydrateControls() {
    if (!state.session) return;
    els.company.value = state.session.company;
    els.level.value = state.session.level;
    els.loop.value = state.session.loopStyle;
    els.seed.value = state.session.seed || '';
  }

  function bindEvents() {
    els.generate.addEventListener('click', () => {
      state = generateSession({
        company: els.company.value,
        level: els.level.value,
        loopStyle: els.loop.value,
        seed: els.seed.value.trim() || new Date().toISOString().slice(0, 10),
      });
      activeRoundId = state.rounds[0]?.id || null;
      state.activeRoundId = activeRoundId;
      saveState();
      render();
      showToast('Interview loop generated.');
    });

    els.reset.addEventListener('click', () => {
      if (!confirm('Reset the saved interview session?')) return;
      state = createEmptyState();
      activeRoundId = null;
      localStorage.removeItem(STORAGE_KEY);
      render();
      showToast('Session reset.');
    });

    els.copyLoop.addEventListener('click', () => copyText(sessionToPrompt()));
    els.exportBtn.addEventListener('click', exportJson);
    els.notes.addEventListener('input', updateActiveRoundFromForm);
    els.score.addEventListener('change', updateActiveRoundFromForm);
    els.clearNotes.addEventListener('click', () => {
      const round = getActiveRound();
      if (!round) return;
      round.notes = '';
      els.notes.value = '';
      saveState();
      renderRoundList();
      showToast('Notes cleared.');
    });
    els.copyRound.addEventListener('click', () => {
      const round = getActiveRound();
      if (round) copyText(roundToPrompt(round));
    });
  }

  function generateSession(config) {
    const companyBank = BANK[config.company];
    const rng = seededRandom(`${config.company}:${config.level}:${config.loopStyle}:${config.seed}`);
    const templateIds = companyBank.loops[config.loopStyle] || companyBank.loops.full;
    const used = new Set();
    const rounds = templateIds.map((templateId, index) => {
      const template = companyBank.templates[templateId];
      const question = pickQuestion(companyBank.questions[template.category], rng, used);
      return {
        id: `round-${index + 1}`,
        number: index + 1,
        templateId,
        templateName: template.name,
        duration: template.duration,
        category: template.category,
        question,
        rubric: template.rubric,
        script: template.script,
        notes: '',
        score: '',
      };
    });

    return {
      session: {
        id: `session-${Date.now()}`,
        company: config.company,
        companyLabel: companyBank.label,
        level: config.level,
        loopStyle: config.loopStyle,
        seed: config.seed,
        createdAt: new Date().toISOString(),
      },
      rounds,
      activeRoundId: rounds[0]?.id || null,
    };
  }

  function pickQuestion(list, rng, used) {
    const candidates = list.filter(item => !used.has(item.title));
    const pool = candidates.length ? candidates : list;
    const question = pool[Math.floor(rng() * pool.length)];
    used.add(question.title);
    return question;
  }

  function render() {
    renderSummary();
    renderRoundList();
    renderActiveRound();
  }

  function renderSummary() {
    if (!state.session) {
      els.summary.innerHTML = '';
      els.sessionLabel.textContent = 'No session yet';
      return;
    }
    const scored = state.rounds.filter(round => round.score).length;
    const avg = averageScore();
    const done = state.rounds.filter(round => round.notes.trim() || round.score).length;
    els.sessionLabel.textContent = `${state.session.companyLabel} · ${labelForLevel(state.session.level)} · seed ${state.session.seed}`;
    els.summary.innerHTML = [
      metric(state.rounds.length, 'rounds in this loop'),
      metric(done, 'rounds with notes/score'),
      metric(scored, 'self-scored rounds'),
      metric(avg ? avg.toFixed(1) : '--', 'average self score'),
    ].join('');
  }

  function renderRoundList() {
    if (!state.rounds.length) {
      els.roundList.innerHTML = '<div class="empty-mini">No rounds generated.</div>';
      return;
    }
    els.roundList.innerHTML = state.rounds.map(round => {
      const done = round.notes.trim() || round.score;
      const active = round.id === activeRoundId;
      return `<button class="round-item ${active ? 'active' : ''} ${done ? 'done' : ''}" type="button" data-id="${round.id}">
        <strong>Round ${round.number}: ${escapeHtml(round.templateName)}</strong>
        <span>${escapeHtml(round.question.title)} · ${escapeHtml(round.duration)}${round.score ? ` · score ${round.score}` : ''}</span>
      </button>`;
    }).join('');
    els.roundList.querySelectorAll('.round-item').forEach(button => {
      button.addEventListener('click', () => {
        activeRoundId = button.dataset.id;
        state.activeRoundId = activeRoundId;
        saveState();
        render();
      });
    });
  }

  function renderActiveRound() {
    const round = getActiveRound();
    if (!round) {
      els.empty.classList.remove('hidden');
      els.view.classList.add('hidden');
      return;
    }

    els.empty.classList.add('hidden');
    els.view.classList.remove('hidden');
    els.kicker.textContent = `Round ${round.number} · ${round.category}`;
    els.title.textContent = `${round.templateName}: ${round.question.title}`;
    els.meta.textContent = `${round.duration} · ${round.question.tags.join(', ')}`;
    els.prompt.textContent = round.question.prompt;
    els.tags.innerHTML = round.question.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    els.signals.innerHTML = round.question.signals.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    els.followups.innerHTML = round.question.followups.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    els.rubric.innerHTML = round.rubric.map(item => `<div class="rubric-item">${escapeHtml(item)}</div>`).join('');
    els.notes.value = round.notes || '';
    els.score.value = round.score || '';
    els.script.textContent = round.script;
    els.saveStatus.textContent = 'Autosaved locally';
  }

  function updateActiveRoundFromForm() {
    const round = getActiveRound();
    if (!round) return;
    round.notes = els.notes.value;
    round.score = els.score.value;
    saveState();
    els.saveStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
    renderSummary();
    renderRoundList();
  }

  function getActiveRound() {
    return state.rounds.find(round => round.id === activeRoundId) || state.rounds[0] || null;
  }

  function sessionToPrompt() {
    if (!state.session) return 'No interview loop generated yet.';
    return [
      `Run a ${state.session.companyLabel} ${labelForLevel(state.session.level)} interview loop.`,
      `Loop style: ${state.session.loopStyle}.`,
      `Seed: ${state.session.seed}.`,
      '',
      ...state.rounds.map(roundToPrompt),
    ].join('\n');
  }

  function roundToPrompt(round) {
    return [
      `Round ${round.number}: ${round.templateName} (${round.duration})`,
      `Problem: ${round.question.title}`,
      `Prompt: ${round.question.prompt}`,
      `Tags: ${round.question.tags.join(', ')}`,
      `Signals: ${round.question.signals.join('; ')}`,
      `Follow-ups: ${round.question.followups.join('; ')}`,
      `Rubric: ${round.rubric.join('; ')}`,
    ].join('\n');
  }

  function exportJson() {
    const content = JSON.stringify(state, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-loop-${state.session?.company || 'empty'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Exported JSON.');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard.');
    } catch (error) {
      showToast('Copy failed. Browser blocked clipboard access.');
    }
  }

  function metric(value, label) {
    return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function averageScore() {
    const scores = state.rounds.map(round => Number(round.score)).filter(Boolean);
    if (!scores.length) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  function countQuestions(groups) {
    return Object.values(groups).reduce((sum, list) => sum + list.length, 0);
  }

  function q(title, prompt, tags, signals, followups) {
    return { title, prompt, tags, signals, followups };
  }

  function labelForLevel(level) {
    return {
      newgrad: 'New Grad / Intern',
      sde: 'SDE / L4-L5',
      senior: 'Senior',
    }[level] || level;
  }

  function seededRandom(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 1000000) / 1000000;
    };
  }

  function createEmptyState() {
    return { session: null, rounds: [], activeRoundId: null };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }
})();
