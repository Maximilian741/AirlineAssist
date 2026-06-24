// app.js — dashboard frontend (vanilla JS, no build step)

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  meta: null,
  health: null,
  origin: 'HLN',
  scanSelected: new Set(),
  watchlist: loadWatchlist(),
  lastSearch: null,
  exploreScope: 'popular',
  exploreSort: 'cheapest',
  exploreRows: [],
  exploreParams: null,
  exploreBlocked: 0,
  takeoverShown: null, // 'rights' | 'claim' — a full-panel view occupying #results
  claim: null,
};

let defaultResultsHTML = '';

init();

async function init() {
  initTheme();
  defaultResultsHTML = $('#results').innerHTML; // the welcome empty-state, restored when leaving Rights
  bindUI();
  await Promise.all([loadHealth(), loadMeta()]);
  setDefaultDates();
  renderWatchlist();
}

// ---------- theme ----------
function initTheme() {
  const saved = localStorage.getItem('dc-theme') || 'light';
  applyTheme(saved);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dc-theme', theme);
  const btn = $('#theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// ---------- health / source badge ----------
async function loadHealth() {
  try {
    state.health = await fetchJSON('/api/health');
    const badge = $('#source-badge');
    const banner = $('#info-banner');
    const text = $('#info-banner-text');
    if (state.health.dataSource === 'amadeus') {
      badge.textContent = `LIVE · Amadeus ${state.health.amadeus?.env || ''}`.trim();
      badge.className = 'badge badge-live';
      banner.classList.add('hidden');
    } else {
      badge.textContent = 'LIVE · Google Flights';
      badge.className = 'badge badge-live';
      text.innerHTML =
        '<strong>Keyless live data via Google Flights.</strong> Prices are real; booking class isn’t shown, ' +
        'so companion eligibility reads “Confirm on Delta.” For a firm eligible/not-eligible call, switch to ';
      banner.classList.remove('hidden');
    }
  } catch {
    $('#source-badge').textContent = 'server offline';
    $('#source-badge').className = 'badge badge-muted';
  }
}

async function loadMeta() {
  state.meta = await fetchJSON('/api/meta');
  state.origin = state.meta.origin.code;
  $('#origin-label').textContent = `${state.meta.origin.code} · ${state.meta.origin.city}`;

  const tier = $('#tier');
  tier.innerHTML = state.meta.tiers
    .map((t) => `<option value="${t.id}">${t.label} ($${t.annualFee}/yr)</option>`)
    .join('');
  tier.value = 'platinum';
  updateTierZones();
  tier.addEventListener('change', updateTierZones);

  $('#dest-list').innerHTML = state.meta.destinations
    .map((d) => `<option value="${d.code}">${d.city}</option>`)
    .join('');

  refreshScanChips();
}

function updateTierZones() {
  const t = state.meta.tiers.find((x) => x.id === $('#tier').value);
  $('#tier-zones').textContent = t ? t.zones : '';
}

function refreshScanChips() {
  const wrap = $('#scan-dests');
  // All popular destinations are selectable for BOTH cards (geography is the same). The ✦ marks
  // international-eligible spots (Mexico/Caribbean/Central America) that use the ~$250 tax cap.
  const dests = state.meta.destinations.filter((d) => d.popular && d.code !== 'SLC');
  if (state.scanSelected.size === 0) {
    ['JFK', 'LAX', 'MCO', 'BOS', 'ATL', 'SEA', 'CUN'].forEach((c) => state.scanSelected.add(c));
  }
  wrap.innerHTML = dests.map((d) => {
    const intl = d.zone === 'intl_eligible';
    const on = state.scanSelected.has(d.code);
    return `<button class="chip ${on ? 'on' : ''} ${intl ? 'intl' : ''}" data-code="${d.code}"
      title="${d.city}${intl ? ' — international, ~$250 companion tax cap' : ''}">${d.code}</button>`;
  }).join('');
  $$('#scan-dests .chip').forEach((chip) => chip.addEventListener('click', () => {
    const code = chip.dataset.code;
    state.scanSelected.has(code) ? state.scanSelected.delete(code) : state.scanSelected.add(code);
    chip.classList.toggle('on');
  }));
}

function setDefaultDates() {
  const depart = addDays(new Date(), 30);
  const ret = addDays(new Date(), 37);
  for (const id of ['#depart', '#scan-depart', '#exp-depart']) $(id).value = iso(depart);
  for (const id of ['#return', '#scan-return', '#exp-return']) $(id).value = iso(ret);
}

// ---------- UI bindings ----------
function bindUI() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.mode;
    $('#mode-explore').classList.toggle('hidden', mode !== 'explore');
    $('#mode-single').classList.toggle('hidden', mode !== 'single');
    $('#mode-scan').classList.toggle('hidden', mode !== 'scan');
    $('#mode-rights').classList.toggle('hidden', mode !== 'rights');
    $('#mode-claim').classList.toggle('hidden', mode !== 'claim');
    if (mode === 'rights') renderRights();
    else if (mode === 'claim') renderClaim();
    else if (state.takeoverShown) {
      // leaving a full-panel view (Rights / What am I owed) — restore the search empty-state
      $('#results').innerHTML = defaultResultsHTML;
      setStatus('');
      $('#trend').classList.add('hidden');
    }
    state.takeoverShown = mode === 'rights' || mode === 'claim' ? mode : null;
  }));

  $$('#rights-nav button').forEach((b) => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.jump);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const claimStart = $('#claim-start');
  if (claimStart) claimStart.addEventListener('click', startClaim);

  $$('.scope-btn').forEach((b) => b.addEventListener('click', () => {
    $$('.scope-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.exploreScope = b.dataset.scope;
  }));

  $('#theme-toggle').addEventListener('click', toggleTheme);

  // Flexible-dates toggle: show trip-length, relabel the date fields as a window.
  $('#exp-flex').addEventListener('change', (e) => {
    const flex = e.target.checked;
    $('#exp-nights-field').classList.toggle('hidden', !flex);
    $('#exp-depart-label').textContent = flex ? 'Leave any time after' : 'Leave on';
    $('#exp-return-label').textContent = flex ? 'Be home by' : 'Come back';
  });

  $('#explore-btn').addEventListener('click', doExplore);
  $('#search-btn').addEventListener('click', doSearch);
  $('#scan-btn').addEventListener('click', doScan);
  $('#destination').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  $('#refresh-watchlist').addEventListener('click', refreshWatchlist);

  $('#open-setup').addEventListener('click', (e) => { e.preventDefault(); $('#setup-modal').classList.remove('hidden'); });
  $('#setup-close').addEventListener('click', () => $('#setup-modal').classList.add('hidden'));
  $('#setup-modal').addEventListener('click', (e) => { if (e.target.id === 'setup-modal') e.target.classList.add('hidden'); });
}

// ---------- explore everywhere (no destination needed) ----------
async function doExplore() {
  const flexible = $('#exp-flex').checked;
  const departDate = $('#exp-depart').value;
  const returnDate = $('#exp-return').value;
  const nights = $('#exp-nights').value;
  const tier = $('#tier').value;
  const scope = state.exploreScope || 'popular';
  if (!departDate) return setStatus('Please pick a date first.', true);

  const payload = flexible
    ? { origin: state.origin, tier, scope, flexible: true, departStart: departDate, departEnd: returnDate || departDate, nights }
    : { origin: state.origin, tier, scope, departDate, returnDate };

  setBusy('#explore-btn', true);
  setStatus(`<span class="spinner"></span>Looking at Delta flights from ${state.origin}${flexible ? ' across your dates' : ''}… just a few seconds.`);
  $('#results').innerHTML = '';
  $('#trend').classList.add('hidden');
  try {
    const data = await postJSON('/api/explore', payload);
    if (data.error) return setStatus(`${data.error}`, true);
    const allRows = data.rows || [];
    state.exploreRows = allRows.filter((r) => r.best);
    state.exploreParams = { tier, source: data.source, scanned: data.scanned, flexible };

    const withDeals = state.exploreRows.length;
    const blockedRows = allRows.filter((r) => !r.best && r.blocked).length;   // Google wouldn't give data
    const noService = allRows.filter((r) => !r.best && !r.blocked).length;    // genuinely no Delta service
    state.exploreBlocked = blockedRows;

    const bits = [`${withDeals} place${withDeals === 1 ? '' : 's'} you can fly`];
    if (noService) bits.push(`${noService} with no Delta service`);
    if (blockedRows) bits.push(`${blockedRows} couldn’t be checked (Google rate-limited)`);
    if (flexible && data.window) bits.push(`cheapest of ${data.window.weeksSampled} weeks`);
    if (flexible && data.trimmedFrom && data.scanned < data.trimmedFrom) bits.push(`top ${data.scanned} of ${data.trimmedFrom} spots`);
    setStatus(`${bits.join(' · ')} · ${sourceLabel(data.source)}`);
    renderExplore();
  } catch (err) {
    setStatus(String(err.message || err), true);
  } finally {
    setBusy('#explore-btn', false);
  }
}

function throttleNotice(n) {
  return `<div class="notice warn">⚠ <b>Google rate-limited ${n} lookup${n === 1 ? '' : 's'}.</b> Big “Everywhere” scans bump into Google’s free limit, so some places couldn’t be checked. Recent results are saved — wait a minute and try again, switch to <b>Popular spots</b>, or add a free Amadeus key (<a href="#" id="notice-setup">precise mode</a>) for unlimited, reliable scans.</div>`;
}

function renderExplore() {
  const rows = state.exploreRows;
  const p = state.exploreParams;
  const blocked = state.exploreBlocked || 0;
  const notice = blocked >= 3 ? throttleNotice(blocked) : '';

  if (!rows.length) {
    $('#results').innerHTML = notice + `<div class="intro">
      <div class="big">${blocked ? '🚦' : '😕'}</div>
      <h2>${blocked ? 'Google limited our requests' : 'No Delta deals found for those dates'}</h2>
      <p>${blocked
        ? 'Too many lookups at once. Wait a minute and try again (recent results are saved), pick “Popular spots,” or add a free Amadeus key for unlimited, reliable scans.'
        : 'Try different dates, or tick “I’m flexible” to search a whole range.'}</p>
    </div>`;
    wireNoticeSetup();
    return;
  }

  const cheapest = rows.reduce((a, b) => (b.best.price.total < a.best.price.total ? b : a));
  const bestValue = rows.reduce((a, b) => ((b.best.value.netSavings ?? -1) > (a.best.value.netSavings ?? -1) ? b : a));

  const sorted = [...rows].sort((a, b) =>
    state.exploreSort === 'cheapest'
      ? a.best.price.total - b.best.price.total
      : (b.best.value.netSavings ?? -Infinity) - (a.best.value.netSavings ?? -Infinity)
  );

  const head = `<div class="summary-line wrap">
    <span>💸 Cheapest: <b>${cheapest.destination}</b> ${money(cheapest.best.price.total)}</span>
    <span>🏆 Most cert value: <b>${bestValue.destination}</b> saves ${money(bestValue.best.value.netSavings)}${bestValue.best.value.estimate ? ' (est.)' : ''} <span class="hint">on a ${money(bestValue.best.price.total)} fare</span></span>
    <span class="sortbox">Sort:
      <button class="sortbtn ${state.exploreSort === 'cheapest' ? 'on' : ''}" data-sort="cheapest">Cheapest</button>
      <button class="sortbtn ${state.exploreSort === 'value' ? 'on' : ''}" data-sort="value">Best cert value</button>
    </span>
  </div>`;

  const body = sorted.map((r, i) => {
    const e = r.best.companion, v = r.best.value;
    const d = state.meta.destinations.find((x) => x.code === r.destination);
    return `<tr class="${e.status}">
      <td class="rank">${i + 1}</td>
      <td><button class="link-dest" data-dest="${r.destination}" data-depart="${r.departDate}" data-return="${r.returnDate || ''}">${r.destination}</button>
        <span class="city">${d ? d.city : ''}</span></td>
      <td>${money(v.secondTicketPrice, v.currency)}</td>
      <td>${scanStatusCell(e)}</td>
      <td class="save">${v.netSavings == null ? '—' : money(v.netSavings, v.currency)}${v.estimate ? ' <span class="est">est.</span>' : ''}</td>
      <td><a href="${deltaLink(r.destination, { departDate: r.departDate, returnDate: r.returnDate })}" target="_blank" rel="noopener">Delta ↗</a></td>
    </tr>`;
  }).join('');

  $('#results').innerHTML = notice + head + `<table class="scan">
    <thead><tr><th>#</th><th>Destination</th><th>Price</th><th>Companion?</th><th>You save</th><th></th></tr></thead>
    <tbody>${body}</tbody></table>`;

  $$('.sortbtn').forEach((b) => b.addEventListener('click', () => { state.exploreSort = b.dataset.sort; renderExplore(); }));
  $$('.link-dest').forEach((b) => b.addEventListener('click', () => openSingle(b.dataset.dest, b.dataset.depart, b.dataset.return)));
  wireNoticeSetup();
}

function wireNoticeSetup() {
  const link = $('#notice-setup');
  if (link) link.addEventListener('click', (e) => { e.preventDefault(); $('#setup-modal').classList.remove('hidden'); });
}

// Click a destination in any board -> jump to single-trip view + search it (so you can see flights + trend).
function openSingle(dest, departDate, returnDate) {
  $$('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelector('.tab[data-mode="single"]').classList.add('active');
  $('#mode-explore').classList.add('hidden');
  $('#mode-scan').classList.add('hidden');
  $('#mode-single').classList.remove('hidden');
  $('#destination').value = dest;
  if (departDate) $('#depart').value = departDate;
  if (returnDate) $('#return').value = returnDate;
  doSearch();
}

// ---------- traveler rights guide (data-driven, verified content) ----------
const RIGHTS_CATS = [
  { key: 'refunds', label: 'Refunds & cancellations', emoji: '💵' },
  { key: 'bumping', label: 'Bumped from an oversold flight', emoji: '🎟️' },
  { key: 'delays', label: 'Delays & tarmac', emoji: '⏱️' },
  { key: 'baggage', label: 'Baggage', emoji: '🧳' },
  { key: 'fees', label: 'Fees & fine print', emoji: '🧾' },
  { key: 'disability', label: 'Disability', emoji: '♿' },
];

function renderRights() {
  const d = window.RIGHTS_DATA;
  const host = $('#results');
  if (!d) {
    host.innerHTML = '<div class="intro"><div class="big">⚠️</div><h2>Rights guide didn’t load</h2><p>Couldn’t find rights-data.js. Make sure it’s served alongside the app.</p></div>';
    return;
  }
  const v = $('#rights-verified');
  if (v) v.textContent = 'Every claim was checked against primary government sources (DOT, eCFR, Congress, EU/UK/Canada). Last verified mid-2026.';

  host.innerHTML =
    rightsHeroHtml() +
    rightsOwedHtml(d.rightsCards) +
    rightsLadderHtml(d.escalationLadder) +
    rightsIntlHtml(d.internationalCompensation) +
    rightsLawHtml(d.legislation) +
    rightsRecordHtml(d.statsLinks, d.reviewLinks) +
    rightsAlliesHtml(d.advocacyGroups);
}

function rightsHeroHtml() {
  return `<div class="rights-hero">
    <div class="big">🛡️</div>
    <h2>Know your rights as a passenger</h2>
    <p>Most people never claim what they’re owed, because the rules are easy to miss. Here’s what airlines legally owe you — the exact dollar amounts, the deadlines, and a link to the government source behind every single one.</p>
  </div>`;
}

function rightsOwedHtml(cards) {
  cards = cards || [];
  const groups = RIGHTS_CATS.map((c) => {
    const items = cards.filter((x) => x.category === c.key);
    if (!items.length) return '';
    return `<div class="rights-cat">
      <h4 class="rights-cat-h">${c.emoji} ${esc(c.label)}</h4>
      ${items.map(rightsCardHtml).join('')}
    </div>`;
  }).join('');
  return `<section id="rights-owed" class="rights-block">
    <h3 class="rights-h">💰 What the airline owes you</h3>
    ${groups}
  </section>`;
}

function rightsCardHtml(c) {
  const rows = [
    c.amounts ? ['How much / the numbers', c.amounts] : null,
    c.triggers ? ['When it applies', c.triggers] : null,
    c.howToClaim ? ['How to claim it', c.howToClaim] : null,
    c.legalBasis ? ['The law', c.legalBasis] : null,
  ].filter(Boolean);
  const detail = `<div class="rights-detail">
    ${rows.map(([k, val]) => `<div class="rd-row"><span class="rd-k">${esc(k)}</span><span class="rd-v">${esc(val)}</span></div>`).join('')}
    ${sourcesHtml(c.sources)}
  </div>`;
  return `<div class="r-card">
    <div class="r-head">${esc(c.headline)}</div>
    <p class="r-plain">${esc(c.plain)}</p>
    <details class="r-more"><summary>How to claim it &amp; the fine print</summary>${detail}</details>
  </div>`;
}

function sourcesHtml(sources) {
  if (!sources || !sources.length) return '';
  return `<div class="r-sources">Sources: ${sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ')}</div>`;
}

function rightsLadderHtml(steps) {
  steps = steps || [];
  const body = steps.map((s) => `<div class="ladder-step">
    <div class="ladder-num">${esc(s.step)}</div>
    <div class="ladder-body">
      <div class="ladder-action">${esc(s.action)}</div>
      <p class="ladder-detail">${esc(s.detail)}</p>
      ${s.url ? `<a class="rights-btn" href="${esc(s.url)}" target="_blank" rel="noopener">Open →</a>` : ''}
    </div>
  </div>`).join('');
  return `<section id="rights-getpaid" class="rights-block">
    <h3 class="rights-h">🪜 How to actually get paid</h3>
    <p class="rights-sub">Work down the ladder — most cases settle by step 3, the free DOT complaint.</p>
    <div class="ladder">${body}</div>
  </section>`;
}

function rightsIntlHtml(list) {
  list = list || [];
  const body = list.map((r) => `<div class="intl-card">
    <div class="intl-head"><span class="intl-regime">${esc(r.regime)}</span><span class="intl-amount">${esc(r.amount)}</span></div>
    <div class="intl-region">${esc(r.region)}</div>
    <details class="r-more"><summary>Who qualifies &amp; how to claim</summary>
      <div class="rights-detail">
        <div class="rd-row"><span class="rd-k">Who qualifies</span><span class="rd-v">${esc(r.eligibility)}</span></div>
        <div class="rd-row"><span class="rd-k">How to claim it</span><span class="rd-v">${esc(r.howToClaim)}</span></div>
        ${sourcesHtml(r.sources)}
      </div>
    </details>
  </div>`).join('');
  return `<section id="rights-intl" class="rights-block">
    <h3 class="rights-h">🌍 Flying to/from Europe, the UK, or Canada? They may owe you cash</h3>
    <p class="rights-sub">These laws pay real money for delays and cancellations — and most Americans never claim it. A flight home from Europe counts, even on a U.S. airline.</p>
    ${body}
  </section>`;
}

function rightsLawHtml(list) {
  list = list || [];
  const body = list.map((l) => `<div class="law-card ${statusClass(l.status)}">
    <div class="law-head">
      <span class="law-name">${esc(l.name)}${l.year ? ` <span class="law-year">${esc(l.year)}</span>` : ''}</span>
      <span class="law-pill ${statusClass(l.status)}">${esc(l.status)}</span>
    </div>
    <p class="law-summary">${esc(l.summary)}</p>
    ${l.whyItMatters ? `<p class="law-why"><b>Why it matters:</b> ${esc(l.whyItMatters)}</p>` : ''}
    ${sourcesHtml(l.sources)}
  </div>`).join('');
  return `<section id="rights-law" class="rights-block">
    <h3 class="rights-h">📜 The law — what’s real, what’s not, what’s coming</h3>
    <p class="rights-sub">🟢 in force today · 🟡 proposed or promised but not enforceable · 🔴 struck down or dead. Kept honest so you never claim something that isn’t actually law.</p>
    ${body}
  </section>`;
}

function rightsRecordHtml(stats, reviews) {
  const linkRow = (x) => `<div class="rights-card">
    <strong>${esc(x.label)}</strong>
    <p class="hint">${esc(x.note || '')}</p>
    ${x.url ? `<a class="rights-btn" href="${esc(x.url)}" target="_blank" rel="noopener">Open →</a>` : ''}
  </div>`;
  return `<section id="rights-record" class="rights-block">
    <h3 class="rights-h">📊 Check the airline’s record — independent sources</h3>
    <div class="rights-grid">${(stats || []).map(linkRow).join('')}</div>
    <h3 class="rights-h" style="margin-top:18px">✍️ Leave a review / document a bad experience</h3>
    <div class="rights-grid">${(reviews || []).map(linkRow).join('')}</div>
  </section>`;
}

function rightsAlliesHtml(list) {
  list = list || [];
  const body = list.map((a) => `<div class="rights-card">
    <strong>${esc(a.name)}</strong>
    <p class="hint">${esc(a.what || '')}</p>
    ${a.url ? `<a class="rights-btn" href="${esc(a.url)}" target="_blank" rel="noopener">Open →</a>` : ''}
  </div>`).join('');
  return `<section id="rights-allies" class="rights-block">
    <h3 class="rights-h">🤝 Who’s actually on your side</h3>
    <div class="rights-grid">${body}</div>
  </section>`;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (/vacated|struck down|did not pass|not in force/.test(s)) return 'dead';
  if (/in force|signed into law/.test(s)) return 'in-force';
  return 'pending';
}

// ---------- "What am I owed?" claim calculator ----------
function renderClaim() {
  if (!state.claim) state.claim = { answers: {}, history: [] };
  renderClaimStep();
}
function startClaim() {
  state.claim = { answers: {}, history: [] };
  renderClaimStep();
}

function renderClaimStep() {
  setStatus('');
  $('#trend').classList.add('hidden');
  const a = state.claim.answers;
  const q = ClaimEngine.nextQuestion(a);
  if (!q) return renderClaimResult();

  const answered = state.claim.history.length;
  $('#results').innerHTML = `
    <div class="claim-wizard">
      <div class="claim-step">Question ${answered + 1}</div>
      <h2 class="claim-q">${esc(q.title)}</h2>
      ${q.help ? `<p class="hint claim-help">${esc(q.help)}</p>` : ''}
      <div class="claim-options">${claimInputHtml(q)}</div>
      <div class="claim-nav">${answered ? '<button class="ghost" id="claim-back">← Back</button>' : ''}
        <button class="ghost" id="claim-cancel">Start over</button></div>
    </div>`;

  wireClaimInput(q);
  const back = $('#claim-back');
  if (back) back.addEventListener('click', claimBack);
  $('#claim-cancel').addEventListener('click', startClaim);
}

function claimInputHtml(q) {
  if (q.kind === 'choice') {
    return q.options.map((o) => `<button class="claim-opt" data-val="${esc(o.value)}">${esc(o.label)}</button>`).join('');
  }
  if (q.kind === 'money') {
    return `<div class="claim-money"><span class="cur">$</span><input id="claim-num" type="number" min="0" inputmode="decimal" placeholder="e.g. 250" /></div>
      <button class="primary claim-continue" id="claim-continue">Continue →</button>`;
  }
  if (q.kind === 'date') {
    return `<input id="claim-date" type="date" class="claim-date" />
      <button class="primary claim-continue" id="claim-continue">Continue →</button>`;
  }
  return '';
}

function wireClaimInput(q) {
  if (q.kind === 'choice') {
    $$('.claim-opt').forEach((b) => b.addEventListener('click', () => answerClaim(q.id, b.dataset.val)));
  } else if (q.kind === 'money') {
    const go = () => answerClaim(q.id, Number($('#claim-num').value) || 0);
    $('#claim-continue').addEventListener('click', go);
    $('#claim-num').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  } else if (q.kind === 'date') {
    $('#claim-continue').addEventListener('click', () => answerClaim(q.id, $('#claim-date').value || ''));
  }
}

function answerClaim(id, val) {
  state.claim.history.push(id);
  state.claim.answers[id] = val;
  renderClaimStep();
}
function claimBack() {
  const last = state.claim.history.pop();
  if (last) delete state.claim.answers[last];
  renderClaimStep();
}

function renderClaimResult() {
  const res = ClaimEngine.assess(state.claim.answers);
  const ents = res.entitlements.map((e) => {
    const amt = e.amountText && e.amountText !== '—' && e.amountText !== '';
    const ruleBit = e.rule && e.rule !== '—'
      ? `<span>📜 ${e.ruleUrl ? `<a href="${esc(e.ruleUrl)}" target="_blank" rel="noopener">${esc(e.rule)}</a>` : esc(e.rule)}</span>`
      : '';
    return `<div class="claim-ent ${esc(e.strength)}">
      <div class="claim-ent-head">
        <span class="claim-ent-title">${esc(e.title)}</span>
        ${amt ? `<span class="claim-amt">${esc(e.amountText)}</span>` : ''}
      </div>
      ${e.detail ? `<p class="claim-detail">${esc(e.detail)}</p>` : ''}
      ${ruleBit || e.deadline ? `<div class="claim-meta">${ruleBit}${e.deadline ? `<span>⏰ ${esc(e.deadline)}</span>` : ''}</div>` : ''}
    </div>`;
  }).join('');

  $('#results').innerHTML = `
    <div class="claim-result">
      <div class="claim-headline">${esc(res.headline)}</div>
      ${ents}
      <div class="claim-doc">
        <div class="claim-doc-head"><h3>✉️ Your demand letter</h3><button class="ghost sm" data-copy="claim-letter">Copy</button></div>
        <p class="hint">Fill the [BRACKETS] with your trip details, then email it to the airline.</p>
        <pre class="claim-pre" id="claim-letter">${esc(res.letterBody)}</pre>
      </div>
      <div class="claim-doc">
        <div class="claim-doc-head"><h3>🏛️ DOT complaint text</h3><button class="ghost sm" data-copy="claim-dot">Copy</button></div>
        <pre class="claim-pre" id="claim-dot">${esc(res.dotText)}</pre>
        <a class="rights-btn" href="https://www.transportation.gov/airconsumer/file-consumer-complaint" target="_blank" rel="noopener">Open the DOT complaint form ↗</a>
      </div>
      ${fileSectionHtml(state.claim.answers)}
      ${viralSectionHtml()}
      <p class="hint claim-disclaim">⚖️ ${esc(res.disclaimer)}</p>
      <button class="primary" id="claim-restart">↺ Check another problem</button>
    </div>`;

  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy);
    if (!el) return;
    const text = el.textContent;
    const done = () => { b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = 'Copy'), 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else done();
  }));
  $('#claim-restart').addEventListener('click', startClaim);
  wireFileSection(res, state.claim.answers);
  wireViralSection(res, state.claim.answers);
}

// ---------- viral: turn the claim into a shareable TikTok receipt + caption ----------
function viralSectionHtml() {
  return `<div class="claim-doc viral">
    <div class="claim-doc-head"><h3>📱 Share your story</h3></div>
    <p class="hint">A clear receipt — the amount, the rule, and how fast you found it — is what gets people to check their own claims. Turn yours into a post.</p>
    <button class="primary" id="viral-gen">✨ Generate my TikTok post</button>
    <div id="viral-out" class="viral-out hidden"></div>
  </div>`;
}

function wireViralSection(res, a) {
  const gen = $('#viral-gen');
  if (!gen) return;
  let variant = 0;
  const build = () => {
    const d = state.claim.details || {};
    const dataUrl = Viral.renderCard(res, a, d);
    const cap = Viral.caption(res, a, d, variant);
    const out = $('#viral-out');
    out.classList.remove('hidden');
    out.innerHTML = `
      <img class="viral-img" alt="Your shareable airline receipt card" src="${dataUrl}" />
      <div class="viral-cap-head"><b>Caption</b>
        <span><button class="ghost sm" id="viral-remix">🎲 Remix</button>
        <button class="ghost sm" id="viral-copy">Copy caption</button></span></div>
      <pre class="claim-pre" id="viral-caption">${esc(cap)}</pre>
      <div class="file-actions">
        <button class="rights-btn" id="viral-download">⬇️ Save image</button>
        <button class="rights-btn" id="viral-share">📲 Share to TikTok</button>
      </div>
      <p class="hint" id="viral-status">On your phone: tap <b>Share</b> → pick <b>TikTok</b> (Photo mode). Your caption is copied, ready to paste. Want it to post automatically? That needs a free TikTok developer app — get one and I’ll wire true one-tap posting.</p>`;

    $('#viral-remix').addEventListener('click', () => { variant++; build(); });
    $('#viral-copy').addEventListener('click', () => { copyText(cap); flashText('#viral-copy', 'Copied ✓', 'Copy caption'); });
    $('#viral-download').addEventListener('click', () => downloadDataUrl(dataUrl, 'airline-receipt.png'));
    $('#viral-share').addEventListener('click', async () => {
      const r = await shareImage(dataUrl, cap);
      const s = $('#viral-status');
      if (s) s.textContent = r === 'shared' ? 'Shared! Pick TikTok (Photo mode) — caption copied to paste.' : 'Image saved + caption copied. Open TikTok, upload it (Photo mode), and paste the caption.';
    });
  };
  gen.addEventListener('click', build);
}

function flashText(sel, on, off) { const b = $(sel); if (!b) return; b.textContent = on; setTimeout(() => (b.textContent = off), 1500); }
function downloadDataUrl(dataUrl, name) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/:(.*?);/) || [, 'image/png'])[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
async function shareImage(dataUrl, caption) {
  try {
    const file = new File([dataUrlToBlob(dataUrl)], 'airline-receipt.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      copyText(caption);
      await navigator.share({ files: [file], text: caption, title: 'My airline receipt' });
      return 'shared';
    }
  } catch (e) { /* fall through to download */ }
  downloadDataUrl(dataUrl, 'airline-receipt.png');
  copyText(caption);
  return 'downloaded';
}

// ---------- one-tap filing: capture trip details once, generate + hand off every filing ----------
function fileSectionHtml(a) {
  const airlines = window.AIRLINES || [];
  state.claim.details = state.claim.details || {};
  const opts = ['<option value="">Choose your airline…</option>']
    .concat(airlines.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`))
    .concat(['<option value="other">Other / not listed</option>'])
    .join('');
  return `<div class="claim-doc claim-file">
    <div class="claim-doc-head"><h3>📨 File it — in a couple of taps</h3></div>
    <p class="hint">Enter your trip details once. Every filing fills in automatically — you just review and hit send, so the claim is officially <b>yours</b>.</p>
    <div class="file-grid">
      <label class="file-wide">Airline<select id="fd-airline">${opts}</select></label>
      <label>Flight #<input id="fd-flight" placeholder="e.g. DL1234" autocomplete="off" /></label>
      <label>Confirmation #<input id="fd-conf" placeholder="ABC123" autocomplete="off" /></label>
      <label>From<input id="fd-origin" placeholder="HLN" autocomplete="off" /></label>
      <label>To<input id="fd-dest" placeholder="JFK" autocomplete="off" /></label>
      <label>Your name<input id="fd-name" autocomplete="off" /></label>
      <label>Your email or phone<input id="fd-contact" autocomplete="off" /></label>
    </div>
    <div class="file-actions">
      <button class="rights-btn" id="file-email">📧 Email the airline</button>
      <button class="rights-btn" id="file-dot">🏛️ File DOT complaint</button>
      <button class="rights-btn" id="file-print">🖨️ Print / Save as PDF</button>
      ${a.payment === 'credit' ? '<button class="rights-btn" id="file-charge">💳 Chargeback letter</button>' : ''}
      <button class="rights-btn ghost" id="file-ics">📅 Reminder</button>
    </div>
    <p class="hint" id="file-status"></p>
  </div>`;
}

function wireFileSection(res, a) {
  const d = (state.claim.details = state.claim.details || {});
  const airlines = window.AIRLINES || [];
  const setStatus = (m) => { const s = $('#file-status'); if (s) s.textContent = m || ''; };

  const bind = (sel, key) => {
    const el = $(sel);
    if (!el) return;
    if (d[key]) el.value = d[key];
    el.addEventListener('input', () => { d[key] = el.value.trim(); });
  };
  bind('#fd-flight', 'flightNo'); bind('#fd-conf', 'confirmation');
  bind('#fd-origin', 'origin'); bind('#fd-dest', 'dest');
  bind('#fd-name', 'name'); bind('#fd-contact', 'email');

  const sel = $('#fd-airline');
  if (sel) {
    if (d._idx != null) sel.value = d._idx;
    sel.addEventListener('change', () => {
      d._idx = sel.value;
      if (sel.value === '' || sel.value === 'other') {
        if (sel.value !== 'other') d.airline = '';
        d._email = null; d._refundUrl = null; d._complaintUrl = null; d._defunct = false;
      } else {
        const x = airlines[Number(sel.value)];
        if (x) {
          d.airline = x.name.replace(/\s*\(.*\)\s*$/, ''); // strip "(ceased operations…)" for the letter
          d._email = x.email || null;
          d._refundUrl = x.refundUrl;
          d._complaintUrl = x.complaintUrl;
          d._defunct = !!x.defunct;
        }
      }
    });
  }

  const letter = () => ClaimEngine.fill(res.letterBody, d, a);
  const dotText = () => ClaimEngine.fill(res.dotText, d, a);
  const onClick = (s, fn) => { const el = $(s); if (el) el.addEventListener('click', fn); };

  onClick('#file-email', () => {
    const body = letter();
    const subj = ('Refund / compensation request' + (d.flightNo ? ' — flight ' + d.flightNo : '')).trim();
    if (d._defunct) {
      copyText(body);
      if (d._complaintUrl) window.open(d._complaintUrl, '_blank', 'noopener');
      setStatus((d.airline || 'This airline') + ' has ceased operations — claims go through its wind-down/bankruptcy process. Card purchases are usually auto-refunded; we copied your letter and opened the guest-info page.');
      return;
    }
    if (d._email) {
      window.location.href = `mailto:${d._email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      setStatus('Opening your email app, pre-addressed to ' + d._email + ' with the letter — review and hit Send.');
    } else {
      copyText(body);
      const url = (a.type === 'delayed' || a.type === 'bumped') ? (d._complaintUrl || d._refundUrl) : (d._refundUrl || d._complaintUrl);
      if (url) window.open(url, '_blank', 'noopener');
      setStatus('This airline takes claims through its web form (no public email). Your letter is copied — paste it into the form that just opened.');
    }
  });
  onClick('#file-dot', () => {
    copyText(dotText());
    window.open('https://www.transportation.gov/airconsumer/file-consumer-complaint', '_blank', 'noopener');
    setStatus('Your DOT complaint text is copied — paste it into the form that just opened.');
  });
  onClick('#file-print', () => printDoc('Demand letter', letter()));
  onClick('#file-charge', () => printDoc('Chargeback letter', ClaimEngine.fill(ClaimEngine.chargebackLetter(a, d), d, a)));
  onClick('#file-ics', () => downloadIcs(a));
}

function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => {});
}
function printDoc(title, body) {
  const w = window.open('', '_blank');
  if (!w) { copyText(body); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>body{font:15px/1.7 Georgia,'Times New Roman',serif;max-width:680px;margin:48px auto;padding:0 24px;white-space:pre-wrap;color:#111}</style>
    </head><body>${esc(body)}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 300);
}
function downloadIcs(a) {
  const base = a.incidentDate ? new Date(a.incidentDate + 'T09:00:00') : new Date();
  const remind = new Date(base); remind.setDate(remind.getDate() + 7);
  const z = (dd) => dd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = 'fairfare-' + Math.random().toString(36).slice(2) + '@local';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fairfare//Claim//EN', 'BEGIN:VEVENT',
    'UID:' + uid, 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(remind),
    'SUMMARY:Follow up on your airline claim',
    'DESCRIPTION:If the airline has not paid what you are owed, escalate: file a free DOT complaint at transportation.gov/airconsumer and (if you paid by credit card) dispute the charge with your bank.',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Airline claim follow-up', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url; el.download = 'airline-claim-reminder.ics';
  document.body.appendChild(el); el.click(); el.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const s = $('#file-status'); if (s) s.textContent = 'Reminder downloaded — open it to add the follow-up to your calendar.';
}

// ---------- single search ----------
async function doSearch() {
  const destination = $('#destination').value.trim().toUpperCase();
  const departDate = $('#depart').value;
  const returnDate = $('#return').value;
  const tier = $('#tier').value;
  if (!destination) return setStatus('Enter a destination airport code.', true);
  if (!departDate) return setStatus('Pick a departure date.', true);

  state.lastSearch = { destination, departDate, returnDate, tier };
  setBusy('#search-btn', true);
  setStatus(`<span class="spinner"></span>Searching ${state.origin} → ${destination}…`);
  $('#results').innerHTML = '';
  $('#trend').classList.add('hidden');
  try {
    const data = await postJSON('/api/search', { origin: state.origin, destination, departDate, returnDate, tier });
    if (data.error) return setStatus(`${data.error}${data.hint ? ' — ' + data.hint : ''}`, true);
    renderSearch(data, { destination, departDate, returnDate, tier });
  } catch (err) {
    setStatus(String(err.message || err), true);
  } finally {
    setBusy('#search-btn', false);
  }
}

function renderSearch(data, params) {
  const { offers, source, notes, degraded } = data;
  const srcLabel = sourceLabel(source);
  setStatus(`${offers.length} Delta option(s) · ${srcLabel}${degraded ? ' · ⚠ ' + (notes || 'fell back to sample') : ''}`);

  const best = offers.find((o) => o.companion.status !== 'ineligible') || offers[0];
  let html = '';
  if (best) {
    html += `<div class="summary-line">
      <span>Best companion value to <b>${params.destination}</b>:</span>
      ${bestBadge(best)}
      <button id="trend-btn" class="ghost sm">📈 Price calendar &amp; trend</button>
    </div>`;
  }
  html += offers.map((o) => offerCard(o, params)).join('') || '<p class="hint">No Delta offers returned for these dates. Try different dates.</p>';
  $('#results').innerHTML = html;
  wireStarButtons(params.tier);
  const tb = $('#trend-btn');
  if (tb) tb.addEventListener('click', () => loadTrend(params));
}

function bestBadge(o) {
  const v = o.value;
  if (o.companion.status === 'eligible') return `<span class="tag elig">you save ${money(v.netSavings, v.currency)}${v.estimate ? ' (est.)' : ''}</span>`;
  if (o.companion.status === 'unknown') return `<span class="tag maybe">save about ${money(v.netSavings, v.currency)}</span>`;
  return `<span class="tag inelig">no companion fare found</span>`;
}

function statusTag(c) {
  if (c.status === 'eligible') return `<span class="tag elig">Companion flies free ✓</span>${c.eligibleCabinLabel ? `<span class="tag cabin">${c.eligibleCabinLabel}</span>` : ''}`;
  if (c.status === 'unknown') return `<span class="tag maybe">Companion likely — confirm on Delta</span>`;
  return `<span class="tag inelig">Not on this fare</span>`;
}

function offerCard(o, params) {
  const e = o.companion;
  const v = o.value;
  const dest = lastStop(o.outbound) || params.destination;
  const star = isWatched(params) ? 'on' : '';
  const est = v.estimate ? '<span class="est">est.</span>' : '';
  const classes = (e.bookingClasses && e.bookingClasses.length)
    ? `Booking classes: ${e.bookingClasses.map((c) => `<code>${c}</code>`).join('')}`
    : `Booking class: <em>not shown by ${sourceShort(o.provider)}</em>`;

  return `<div class="offer ${e.status}">
    <div class="offer-head">
      <div class="route">${state.origin} → ${dest}
        <span class="seg">${routeLine(o)}</span>
      </div>
      <div>${statusTag(e)}</div>
    </div>

    <div class="metrics">
      <div class="metric"><div class="k">One ticket</div><div class="v">${money(v.secondTicketPrice, v.currency)}</div></div>
      <div class="metric"><div class="k">Companion pays${v.estimate ? ' (est.)' : ''}</div><div class="v">${e.status === 'ineligible' ? '—' : money(v.companionTaxes, v.currency)}</div></div>
      <div class="metric save"><div class="k">You save ${est}</div><div class="v">${v.netSavings == null ? '—' : money(v.netSavings, v.currency)}</div></div>
    </div>

    <div class="classes">${classes} &nbsp;·&nbsp; ${e.reason}</div>

    <div class="offer-actions">
      <button class="star-btn ${star}" data-dest="${dest}" data-depart="${params.departDate}" data-return="${params.returnDate || ''}">
        ${star ? '★ Watching' : '☆ Watch this trip'}</button>
      <a href="${googleFlights(dest, params)}" target="_blank" rel="noopener">Google Flights ↗</a>
      <a href="${deltaLink(dest, params)}" target="_blank" rel="noopener">Open on Delta ↗</a>
    </div>
  </div>`;
}

function routeLine(o) {
  const segs = o.outbound?.segments || [];
  const path = segs.length
    ? segs.map((s) => s.from).concat(segs[segs.length - 1].to).join('→')
    : `${state.origin}→?`;
  const bits = [path];
  if (o.stops != null) bits.push(o.stops === 0 ? 'nonstop' : `${o.stops} stop${o.stops > 1 ? 's' : ''}`);
  else if (segs.length > 1) bits.push(`via ${segs[0].to}`);
  if (o.duration) bits.push(o.duration);
  if (o.outbound?.layover) bits.push(`via ${shortAirport(o.outbound.layover)}`);
  if (o.operator) bits.push(o.operator);
  const dep = segs[0]?.dep;
  if (dep) bits.push(`dep ${dep}`);
  if (o.inbound?.roundTrip) bits.push('round trip');
  return '↗ ' + bits.join(' · ');
}

// ---------- value scan ----------
async function doScan() {
  const departDate = $('#scan-depart').value;
  const returnDate = $('#scan-return').value;
  const tier = $('#tier').value;
  const dests = [...state.scanSelected];
  if (dests.length === 0) return setStatus('Select at least one destination chip.', true);
  if (!departDate) return setStatus('Pick a departure date.', true);

  const trips = dests.map((d) => ({ origin: state.origin, destination: d, departDate, returnDate }));
  setBusy('#scan-btn', true);
  setStatus(`<span class="spinner"></span>Scanning ${dests.length} destinations…`);
  $('#results').innerHTML = '';
  $('#trend').classList.add('hidden');
  try {
    const data = await postJSON('/api/scan', { tier, trips });
    if (data.error) return setStatus(`${data.error}`, true);
    renderScan(data);
  } catch (err) {
    setStatus(String(err.message || err), true);
  } finally {
    setBusy('#scan-btn', false);
  }
}

function renderScan(data) {
  const { rows, source, scanned } = data;
  setStatus(`Ranked ${scanned} destinations by companion value · ${sourceLabel(source)}`);
  const body = rows.map((r, i) => {
    const b = r.best;
    if (!b) return `<tr class="ineligible"><td class="rank">${i + 1}</td><td>${r.destination}</td><td colspan="6">${r.error || 'no offers'}</td></tr>`;
    const e = b.companion, v = b.value;
    return `<tr class="${e.status}">
      <td class="rank">${i + 1}</td>
      <td><b>${r.destination}</b></td>
      <td>${money(v.secondTicketPrice, v.currency)}</td>
      <td>${scanStatusCell(e)}</td>
      <td>${e.status === 'ineligible' ? '—' : money(v.companionTaxes, v.currency)}</td>
      <td class="save">${v.netSavings == null ? '—' : money(v.netSavings, v.currency)}${v.estimate ? ' <span class="est">est.</span>' : ''}</td>
      <td><a href="${deltaLink(r.destination, { departDate: r.departDate, returnDate: r.returnDate })}" target="_blank" rel="noopener">Delta ↗</a></td>
    </tr>`;
  }).join('');

  $('#results').innerHTML = `<table class="scan">
    <thead><tr><th>#</th><th>Dest</th><th>Price</th><th>Companion?</th><th>Companion pays</th><th>You save</th><th></th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function scanStatusCell(e) {
  if (e.status === 'eligible') return `<span class="tag elig">${e.eligibleCabinLabel || 'Yes'} ✓</span>`;
  if (e.status === 'unknown') return `<span class="tag maybe">Likely ✓</span>`;
  return `<span class="tag inelig">No</span>`;
}

// ---------- trend: price calendar + history ----------
async function loadTrend(params) {
  const trend = $('#trend');
  trend.classList.remove('hidden');
  trend.innerHTML = `<div class="trend-head"><span class="spinner"></span>Loading price calendar for ${state.origin} → ${params.destination}…</div>`;
  try {
    const [cal, hist] = await Promise.all([
      postJSON('/api/calendar', { origin: state.origin, destination: params.destination, tier: params.tier, weeks: 8, tripLengthDays: 7 }),
      fetchJSON(`/api/history?origin=${state.origin}&destination=${params.destination}&departDate=${params.departDate}&returnDate=${params.returnDate || ''}`),
    ]);
    renderTrend(trend, params, cal, hist);
  } catch (err) {
    trend.innerHTML = `<div class="trend-head err">Couldn’t load trend: ${String(err.message || err)}</div>`;
  }
}

function renderTrend(el, params, cal, hist) {
  const pts = (cal.points || []).filter((p) => p.price != null);
  const series = (hist.series || []).filter((s) => s.price != null);
  let html = `<div class="trend-head"><b>${state.origin} → ${params.destination}</b> — price by departure week (round trip, ${cal.tripLengthDays}-day) · ${sourceLabel(cal.source)}</div>`;
  html += barChart(pts);
  if (pts.length) {
    const cheapest = pts.reduce((a, b) => (b.price < a.price ? b : a));
    html += `<p class="hint">Cheapest upcoming week: <b>${cheapest.departDate}</b> at ${money(cheapest.price)}${cheapest.netSavings != null ? ` · cert saves ~${money(cheapest.netSavings)}` : ''}.</p>`;
  }
  if (series.length >= 2) {
    html += `<div class="trend-head" style="margin-top:14px"><b>Your tracked history</b> for ${params.departDate}${params.returnDate ? ' ⇄ ' + params.returnDate : ''} (since you started checking)</div>`;
    html += sparkline(series);
  } else {
    html += `<p class="hint" style="margin-top:10px">Tracked history builds up as you search/refresh this exact trip over days. ${series.length === 1 ? '1 point so far.' : ''}</p>`;
  }
  el.innerHTML = html;
}

function barChart(points) {
  if (!points.length) return '<p class="hint">No priced weeks returned.</p>';
  const W = 560, H = 150, padL = 44, padB = 34, padT = 10;
  const prices = points.map((p) => p.price);
  const max = Math.max(...prices), min = Math.min(...prices);
  const span = Math.max(1, max - min);
  const bw = (W - padL - 10) / points.length;
  const bars = points.map((p, i) => {
    const h = 8 + ((p.price - min) / span) * (H - padB - padT - 8);
    const x = padL + i * bw + 4;
    const y = H - padB - h;
    const isMin = p.price === min;
    return `<g>
      <rect x="${x}" y="${y}" width="${bw - 8}" height="${h}" rx="3" class="${isMin ? 'bar-min' : 'bar'}"></rect>
      <text x="${x + (bw - 8) / 2}" y="${y - 4}" class="bar-val">${Math.round(p.price)}</text>
      <text x="${x + (bw - 8) / 2}" y="${H - padB + 14}" class="bar-x">${p.departDate.slice(5)}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="xMidYMid meet">
    <text x="6" y="${padT + 8}" class="axis">$${Math.round(max)}</text>
    <text x="6" y="${H - padB}" class="axis">$${Math.round(min)}</text>
    ${bars}
  </svg>`;
}

function sparkline(series) {
  const W = 560, H = 90, padL = 44, padB = 18, padT = 10;
  const prices = series.map((s) => s.price);
  const max = Math.max(...prices), min = Math.min(...prices);
  const span = Math.max(1, max - min);
  const stepX = (W - padL - 10) / Math.max(1, series.length - 1);
  const pts = series.map((s, i) => {
    const x = padL + i * stepX;
    const y = padT + (1 - (s.price - min) / span) * (H - padB - padT);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dots = pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" class="spark-dot"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="xMidYMid meet">
    <text x="6" y="${padT + 6}" class="axis">$${Math.round(max)}</text>
    <text x="6" y="${H - padB + 2}" class="axis">$${Math.round(min)}</text>
    <path d="${path}" class="spark-line" fill="none"/>${dots}
  </svg>`;
}

// ---------- watchlist ----------
function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('dcw') || '[]'); } catch { return []; }
}
function saveWatchlist() { localStorage.setItem('dcw', JSON.stringify(state.watchlist)); }
function watchKey(t) { return `${t.destination}|${t.departDate}|${t.returnDate || ''}`; }
function isWatched(t) { return state.watchlist.some((w) => watchKey(w) === watchKey(t)); }

function wireStarButtons(tier) {
  $$('.star-btn').forEach((btn) => btn.addEventListener('click', () => {
    const t = { destination: btn.dataset.dest, departDate: btn.dataset.depart, returnDate: btn.dataset.return, tier };
    if (isWatched(t)) {
      state.watchlist = state.watchlist.filter((w) => watchKey(w) !== watchKey(t));
      btn.classList.remove('on'); btn.textContent = '☆ Watch this trip';
    } else {
      state.watchlist.push(t);
      btn.classList.add('on'); btn.textContent = '★ Watching';
    }
    saveWatchlist(); renderWatchlist();
  }));
}

function renderWatchlist() {
  const wrap = $('#watchlist-items');
  const empty = $('#watchlist-empty');
  const refresh = $('#refresh-watchlist');
  if (!state.watchlist.length) {
    wrap.innerHTML = ''; empty.classList.remove('hidden'); refresh.classList.add('hidden'); return;
  }
  empty.classList.add('hidden'); refresh.classList.remove('hidden');
  wrap.innerHTML = state.watchlist.map((w, i) => `<div class="wl-item">
    <span>${state.origin}→${w.destination} · ${w.departDate}${w.returnDate ? ' ⇄ ' + w.returnDate : ''}</span>
    <button data-i="${i}" title="remove">×</button>
  </div>`).join('');
  $$('#watchlist-items button').forEach((b) => b.addEventListener('click', () => {
    state.watchlist.splice(Number(b.dataset.i), 1); saveWatchlist(); renderWatchlist();
  }));
}

async function refreshWatchlist() {
  if (!state.watchlist.length) return;
  const tier = $('#tier').value;
  const trips = state.watchlist.map((w) => ({ origin: state.origin, destination: w.destination, departDate: w.departDate, returnDate: w.returnDate }));
  setBusy('#refresh-watchlist', true);
  setStatus(`<span class="spinner"></span>Re-checking ${trips.length} watched trip(s)…`);
  $('#trend').classList.add('hidden');
  try {
    const data = await postJSON('/api/scan', { tier, trips });
    renderScan(data);
  } catch (err) { setStatus(String(err.message || err), true); }
  finally { setBusy('#refresh-watchlist', false); }
}

// ---------- helpers ----------
function lastStop(leg) { const s = leg?.segments; return s && s.length ? s[s.length - 1].to : null; }
function shortAirport(name) { return (name || '').replace(/ International Airport| Airport/i, ''); }

function sourceLabel(s) {
  if (!s) return 'source: n/a';
  if (s.startsWith('googleflights')) return 'live · Google Flights';
  if (s.startsWith('amadeus')) return 'live · Amadeus';
  if (s.startsWith('sample')) return 'sample data';
  return `source: ${s}`;
}
function sourceShort(p) { return p === 'googleflights' ? 'Google Flights' : p === 'amadeus' ? 'Amadeus' : 'this source'; }

function googleFlights(dest, p) {
  const q = `Flights from ${state.origin} to ${dest} on ${p.departDate}${p.returnDate ? ' through ' + p.returnDate : ''}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}
function deltaLink(dest, p) {
  const params = new URLSearchParams({
    action: 'findFlights',
    tripType: p.returnDate ? 'ROUND_TRIP' : 'ONE_WAY',
    originCity: state.origin,
    destinationCity: dest,
    departureDate: p.departDate || '',
    passengerInfo: 'ADT:1',
    priceSchedule: 'PRICE',
  });
  if (p.returnDate) params.set('returnDate', p.returnDate);
  return `https://www.delta.com/flight-search/search?${params.toString()}`;
}

function money(n, cur = 'USD') {
  if (n == null) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n); }
  catch { return `$${Math.round(n)}`; }
}
function iso(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function setStatus(html, isErr = false) { const el = $('#status'); el.innerHTML = html; el.classList.toggle('err', isErr); }
function setBusy(sel, busy) { const b = $(sel); if (b) b.disabled = busy; }

async function fetchJSON(url) { const r = await fetch(url); return r.json(); }
async function postJSON(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
