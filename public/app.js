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
  takeoverShown: null, // 'rights' | 'claim' | 'moves' | 'trips' — a full-panel view occupying #results
  claim: null,
  tripEditing: null,   // a trip object while the add/edit form is open
  historySummary: null, // cached /api/history summary for deal verdicts
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
  refreshTripsBadge();
  // The badge is the web's stand-in for a push notification: re-pull the watchdog every 10 minutes
  // while the tab is open, and whenever the tab regains focus.
  setInterval(refreshTripsBadge, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshTripsBadge(); });
}

// Count what needs a human right now: unseen watchdog alerts, deadlines closing in <= 3 days,
// and claims whose legal clocks have run out. Shown on the My Trips tab so it finds the user.
async function refreshTripsBadge() {
  const tab = document.querySelector('.tab[data-mode="trips"]');
  if (!tab) return;
  let n = 0;
  try {
    if (Trips.all().length && !state.watchPulling) {
      state.watch = await Trips.pullAlerts();
    }
    const by = state.watch && state.watch.byTripId || {};
    for (const t of Trips.all()) {
      const w = by[t.watchId || t.id];
      if (w) n += (w.alerts || []).filter((a) => !a.seen && !a.resolved && a.kind !== 'minor_change').length;
    }
    n += Trips.upcoming().filter((u) => u.deadline.daysLeft <= 3).length;
    n += (ClaimTrack.summary().overdue || 0);
  } catch {}
  let b = tab.querySelector('.tab-badge');
  if (!n) { if (b) b.remove(); tab.removeAttribute('title'); return; }
  if (!b) { b = document.createElement('span'); b.className = 'tab-badge'; tab.appendChild(b); }
  b.textContent = String(n);
  tab.title = `${n} thing${n === 1 ? '' : 's'} that need${n === 1 ? 's' : ''} you: new watchdog alerts, deadlines within 3 days, or claim clocks that have run out.`;
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
  if (btn) btn.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
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
    $('#mode-moves').classList.toggle('hidden', mode !== 'moves');
    $('#mode-trips').classList.toggle('hidden', mode !== 'trips');
    if (mode === 'rights') renderRights();
    else if (mode === 'claim') renderClaim();
    else if (mode === 'moves') renderMoves();
    else if (mode === 'trips') renderTrips();
    else if (state.takeoverShown) {
      // leaving a full-panel view (Rights / What am I owed / Money Moves) — restore the search empty-state
      $('#results').innerHTML = defaultResultsHTML;
      setStatus('');
      $('#trend').classList.add('hidden');
    }
    state.takeoverShown = ['rights', 'claim', 'moves', 'trips'].includes(mode) ? mode : null;
  }));

  const tripAdd = $('#trip-add-btn');
  if (tripAdd) tripAdd.addEventListener('click', () => { state.tripEditing = {}; renderTrips(); });

  $$('#moves-nav button').forEach((b) => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.jump);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  $$('#rights-nav button').forEach((b) => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.jump);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const claimStart = $('#claim-start');
  if (claimStart) claimStart.addEventListener('click', startClaim);

  // Crisis mode lives inside #results (including the restorable intro), so delegate —
  // direct listeners would die every time innerHTML is replaced.
  $('#results').addEventListener('click', (e) => {
    const open = e.target.closest('#crisis-btn');
    if (open) return renderCrisisMenu();
    const scen = e.target.closest('[data-crisis]');
    if (scen) return renderCrisisScenario(scen.dataset.crisis);
    if (e.target.closest('#crisis-back')) return renderCrisisMenu();
    if (e.target.closest('#crisis-home')) {
      $('#results').innerHTML = defaultResultsHTML;
      setStatus('');
    }
  });

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
  return `<div class="notice warn"> <b>Google rate-limited ${n} lookup${n === 1 ? '' : 's'}.</b> Big “Everywhere” scans bump into Google’s free limit, so some places couldn’t be checked. Recent results are saved — wait a minute and try again, switch to <b>Popular spots</b>, or add a free Amadeus key (<a href="#" id="notice-setup">precise mode</a>) for unlimited, reliable scans.</div>`;
}

function renderExplore() {
  const rows = state.exploreRows;
  const p = state.exploreParams;
  const blocked = state.exploreBlocked || 0;
  const notice = blocked >= 3 ? throttleNotice(blocked) : '';

  if (!rows.length) {
    $('#results').innerHTML = notice + `<div class="intro">
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
    <span> Cheapest: <b>${cheapest.destination}</b> ${money(cheapest.best.price.total)}</span>
    <span> Most cert value: <b>${bestValue.destination}</b> saves ${money(bestValue.best.value.netSavings)}${bestValue.best.value.estimate ? ' (est.)' : ''} <span class="hint">on a ${money(bestValue.best.price.total)} fare</span></span>
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
      <td>${money(v.secondTicketPrice, v.currency)}<span class="ex-judge" data-judge="${r.destination}|${Math.round(v.secondTicketPrice || 0)}"></span></td>
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
  fillExploreJudgments();
}

// After the Everywhere table renders: judge each destination's price against what THIS app has
// recorded for that route (all dates), in one /api/history round-trip. Under 5 observations for a
// route it stays silent — no invented verdicts.
async function fillExploreJudgments() {
  const slots = $$('.ex-judge');
  if (!slots.length) return;
  let summary;
  try { summary = (await fetchJSON('/api/history')).summary || []; } catch { return; }
  const byDest = {};
  for (const g of summary) {
    if (g.origin !== state.origin) continue;
    (byDest[g.destination] ||= []).push(...g.points.map((p) => p.price));
  }
  for (const el of slots) {
    const [dest, priceStr] = String(el.dataset.judge).split('|');
    const price = Number(priceStr);
    const prices = (byDest[dest] || []).filter((n) => n != null).sort((a, b) => a - b);
    if (prices.length < 5 || !price) continue;
    const q = (f) => prices[Math.min(prices.length - 1, Math.floor(f * prices.length))];
    const p25 = q(0.25), median = q(0.5), p75 = q(0.75);
    let cls, text;
    if (price <= p25) { cls = 'low'; text = 'cheap for this route'; }
    else if (price <= median) { cls = 'ok'; text = `below usual ${money(median)}`; }
    else if (price >= p75) { cls = 'high'; text = `high — usually ${money(median)}`; }
    else { cls = 'ok'; text = `about usual (${money(median)})`; }
    el.className = `ex-judge ${cls}`;
    el.textContent = text;
    el.title = `${prices.length} fares recorded for ${state.origin}→${dest} across all dates: low ${money(prices[0])}, typical ${money(median)}, high ${money(prices[prices.length - 1])}.`;
  }
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
  { key: 'refunds', label: 'Refunds & cancellations', emoji: '' },
  { key: 'bumping', label: 'Bumped from an oversold flight', emoji: '' },
  { key: 'delays', label: 'Delays & tarmac', emoji: '' },
  { key: 'baggage', label: 'Baggage', emoji: '' },
  { key: 'fees', label: 'Fees & fine print', emoji: '' },
  { key: 'disability', label: 'Disability', emoji: '' },
];

function renderRights() {
  const d = window.RIGHTS_DATA;
  const host = $('#results');
  if (!d) {
    host.innerHTML = '<div class="intro"><h2>Rights guide didn’t load</h2><p>Couldn’t find rights-data.js. Make sure it’s served alongside the app.</p></div>';
    return;
  }
  const v = $('#rights-verified');
  if (v) v.textContent = 'Every claim was checked against primary government sources (DOT, eCFR, Congress, EU/UK/Canada). Last verified mid-2026.';

  host.innerHTML =
    rightsHeroHtml() +
    coverageCheckerHtml() +
    cocHtml() +
    rightsOwedHtml(d.rightsCards) +
    rightsLadderHtml(d.escalationLadder) +
    rightsIntlHtml(d.internationalCompensation) +
    rightsLawHtml(d.legislation) +
    scorecardHtml() +
    rightsRecordHtml(d.statsLinks, d.reviewLinks) +
    gapTableHtml() +
    rightsAlliesHtml(d.advocacyGroups);
  wireCoverageChecker();
  wireCoc();
  wireScorecardShare();
}

// Scorecard -> 9:16 share card for one metric (fact-led; the ranking is the message).
function wireScorecardShare() {
  const sc = window.SCORECARD;
  if (!sc || !sc.airlines) return;
  const META = {
    onTimePct: { title: 'Which airlines actually land on time', unitLabel: '% of flights on time', lowerBetter: false, pct: true },
    cancelledPct: { title: 'Which airlines cancel the most flights', unitLabel: '% of flights cancelled', lowerBetter: true, pct: true },
    mishandledBagsRate: { title: 'Which airlines lose the most bags', unitLabel: 'bags mishandled per 100 checked', lowerBetter: true },
    involuntaryDBPer10k: { title: 'Which airlines bump the most passengers', unitLabel: 'involuntary bumps per 10,000 passengers', lowerBetter: true },
    complaintsPer100k: { title: 'Which airlines get the most complaints', unitLabel: 'complaints per 100,000 passengers', lowerBetter: true },
  };
  $$('[data-sc-share]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.scShare;
    const m = META[key];
    if (!m) return;
    const rows = sc.airlines.filter((a) => !a.defunct && a[key] != null).map((a) => ({ name: a.name, value: a[key] }));
    const opts = { ...m, rows, industry: sc.report && sc.report.industry ? sc.report.industry[key] : null, period: 'Jan–Jun 2026' };
    const dataUrl = Viral.renderScorecardCard(opts);
    const cap = Viral.scorecardCaption(opts);
    shareImage(dataUrl, cap).then((r) => setStatus(r === 'shared' ? 'Shared — caption copied to paste.' : 'Card saved + caption copied.'));
  }));
}

// "Am I covered?" — the gateway question. EU261 protects millions of Americans who never claim,
// because the departing/arriving asymmetry is genuinely counterintuitive.
function coverageCheckerHtml() {
  const opts = (list) => list.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
  const R = Coverage.REGIONS, C = Coverage.CARRIERS;
  return `<section id="rights-covered" class="rights-block">
    <h3 class="rights-h"> Does EU law cover your flight?</h3>
    <p class="rights-sub">EU261 is the strongest passenger-rights law in the world — and it follows the <b>flight</b>, not your nationality. Fly out of Europe on <em>any</em> airline, including Delta or United, and you're covered for up to €600 cash. Most Americans never find out.</p>
    <div class="mm-tool">
      <div class="mm-grid cov-grid">
        <label>Flying from<select id="cov-from">${opts(R)}</select></label>
        <label>Flying to<select id="cov-to">${opts(R)}</select></label>
        <label>On<select id="cov-carrier">${opts(C)}</select></label>
        <label>Distance<select id="cov-band">
          <option value="short">Short (under ~930 mi)</option>
          <option value="medium">Medium (~930–2,175 mi)</option>
          <option value="long" selected>Long (over ~2,175 mi — e.g. Europe ⇄ U.S.)</option>
        </select></label>
      </div>
      <div id="cov-out" class="mm-out"></div>
    </div>
  </section>`;
}

function wireCoverageChecker() {
  if (!$('#cov-from')) return;
  const run = () => {
    const res = Coverage.check({ from: $('#cov-from').value, to: $('#cov-to').value, carrier: $('#cov-carrier').value, band: $('#cov-band').value });
    const yes = res.covered.map((c) => `<div class="cov-card yes">
      <div class="cov-head"><span class="cov-regime">${esc(c.regime)}</span><span class="cov-amt">${esc(c.amount || '')}</span></div>
      <p class="cov-why">${esc(c.why)}</p>
      <p class="cov-pays">Pays: ${esc(c.pays)}</p>
      ${c.deadline ? `<p class="cov-pays"> ${esc(c.deadline)}</p>` : ''}
      <div class="claim-meta"><span> <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.rule)}</a></span></div>
    </div>`).join('');
    const no = res.notCovered.map((c) => `<div class="cov-card no">
      <div class="cov-head"><span class="cov-regime">${esc(c.regime)} — not covered</span></div>
      <p class="cov-why">${esc(c.why)}</p>
      ${c.tip ? `<p class="cov-tip"> ${esc(c.tip)}</p>` : ''}
    </div>`).join('');
    const know = (res.alsoKnow || []).map((k) => `<div class="cov-card know">
      <div class="cov-head"><span class="cov-regime"> ${esc(k.title)}</span></div>
      <p class="cov-why">${esc(k.detail)}</p>
    </div>`).join('');
    $('#cov-out').innerHTML = `<div class="cov-headline ${res.covered.length ? 'good' : ''}">${esc(res.headline)}</div>${yes}${no}${know}`;
  };
  ['#cov-from', '#cov-to', '#cov-carrier', '#cov-band'].forEach((s) => $(s).addEventListener('change', run));
  // Default to the case that matters most: an American flying home from Europe.
  $('#cov-from').value = 'eu';
  $('#cov-to').value = 'us';
  $('#cov-carrier').value = 'us';
  run();
}

// The Contract of Carriage — the binding document nobody reads, decoded per airline.
// Under Wolens, breach of THIS is what you can actually enforce, so rule numbers matter.
function cocHtml() {
  const d = window.COC_DATA;
  if (!d || !d.airlines) return '';
  const opts = d.airlines.map((a, i) => `<option value="${i}">${esc(a.airline.replace(/\s*\(.*$/, ''))}</option>`).join('');
  return `<section id="rights-coc" class="rights-block">
    <h3 class="rights-h">Your airline's own contract</h3>
    <p class="rights-sub">Every ticket you buy is governed by a 50–100 page Contract of Carriage. Almost nobody reads it, and that's the point — it's where the airline's binding promises live. It also matters more than it looks: most consumer-protection suits against airlines are blocked by federal law, but <b>breach of the airline's own contract is not</b> (<em>American Airlines v. Wolens</em>). We read them and pulled out the parts you can use, with the rule numbers to quote.</p>
    <div class="mm-tool">
      <label class="coc-pick">Which airline<select id="coc-airline">${opts}</select></label>
      <div id="coc-out"></div>
    </div>
  </section>`;
}

function wireCoc() {
  const sel = $('#coc-airline');
  if (!sel) return;
  const render = () => {
    const a = window.COC_DATA.airlines[Number(sel.value) || 0];
    if (!a) return;
    const provisions = (a.provisions || []).map((p) => `
      <details class="coc-prov">
        <summary><span class="coc-topic">${esc(p.topic)}</span><span class="coc-rule">${esc(p.ruleNumber)}</span></summary>
        <div class="coc-body">
          ${p.ruleNote ? `<p class="coc-catch"><b>Where to find it:</b> ${esc(p.ruleNote)}</p>` : ''}
          <p>${esc(p.plainEnglish)}</p>
          ${p.exactQuote ? `<blockquote class="coc-quote">“${esc(p.exactQuote)}”</blockquote>` : ''}
          ${p.howToUse ? `<div class="coc-say"><b>How to invoke it</b><p>${esc(p.howToUse)}</p></div>` : ''}
          ${p.catch ? `<p class="coc-catch"><b>The catch:</b> ${esc(p.catch)}</p>` : ''}
        </div>
      </details>`).join('');
    $('#coc-out').innerHTML = `
      <div class="coc-meta">
        <a href="${esc(a.cocUrl.split(' ')[0])}" target="_blank" rel="noopener">Read the full contract</a>
        ${a.lastUpdated ? `<span class="coc-rev">${esc(a.lastUpdated)}</span>` : ''}
        ${a.confidence !== 'high' ? `<span class="coc-conf">verify before relying on this</span>` : ''}
      </div>
      ${a.buriedGem ? `<div class="coc-gem"><b>The buried one</b><p>${esc(a.buriedGem)}</p></div>` : ''}
      <div class="coc-keyfacts">
        <div><span class="coc-k">Schedule change that triggers a refund</span><p>${esc(a.scheduleChangeThreshold)}</p></div>
        <div><span class="coc-k">Will they put you on another airline?</span><p>${esc(a.rebooksOnOtherAirlines)}</p></div>
      </div>
      <div class="coc-list-head">What you can quote at them (${(a.provisions || []).length} provisions)</div>
      ${provisions}`;
  };
  sel.addEventListener('change', render);
  render();
}

// The argument in one table: same disruption, different continent, wildly different outcome.
function gapTableHtml() {
  const rows = Coverage.GAPS.map((g) => `<tr>
    <td class="gap-scenario">${esc(g.scenario)}</td>
    <td class="gap-us">${esc(g.us)}</td>
    <td class="gap-eu">${esc(g.eu)}</td>
  </tr>`).join('');
  const notes = Coverage.GAPS.filter((g) => g.note).map((g) => `<li><b>${esc(g.scenario)}:</b> ${esc(g.note)}</li>`).join('');
  return `<section id="rights-gap" class="rights-block">
    <h3 class="rights-h"> Same delay, different continent</h3>
    <p class="rights-sub">Identical disruption. What you get depends almost entirely on which airport you took off from.</p>
    <div class="gap-wrap"><table class="scan gap-table">
      <thead><tr><th>What happened</th><th> In the U.S.</th><th> In the EU</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <ul class="gap-notes">${notes}</ul>
    <p class="hint">Worth knowing when you book: on a Europe trip, the leg <b>departing</b> Europe carries far stronger protection than the leg flying out.</p>
  </section>`;
}

function rightsHeroHtml() {
  return `<div class="rights-hero">
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
    <h3 class="rights-h"> What the airline owes you</h3>
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
    <h3 class="rights-h"> How to actually get paid</h3>
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
    <h3 class="rights-h"> Flying to/from Europe, the UK, or Canada? They may owe you cash</h3>
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
    <h3 class="rights-h"> The law — what’s real, what’s not, what’s coming</h3>
    <p class="rights-sub">Green = in force today. Amber = proposed or promised, not yet enforceable. Red = struck down. Kept honest so you never claim something that isn’t actually law.</p>
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
    <h3 class="rights-h"> Check the airline’s record — independent sources</h3>
    <div class="rights-grid">${(stats || []).map(linkRow).join('')}</div>
    <h3 class="rights-h" style="margin-top:18px"> Leave a review / document a bad experience</h3>
    <div class="rights-grid">${(reviews || []).map(linkRow).join('')}</div>
  </section>`;
}

// The airline scorecard — the government's own numbers on who actually gets you there. Every
// figure comes from the U.S. DOT Air Travel Consumer Report (public/scorecard-data.js, generated
// from the report and re-verified). Ranked worst-to-best per column so the comparison is honest:
// same period, same metric, same source for everyone. Nulls render as "—", never as a guess.
function scorecardHtml() {
  const sc = window.SCORECARD;
  if (!sc || !Array.isArray(sc.airlines) || !sc.airlines.length) return '';
  const hasData = (a) => ['onTimePct', 'cancelledPct', 'mishandledBagsRate', 'involuntaryDBPer10k', 'complaintsPer100k'].some((k) => a[k] != null);
  const rows = sc.airlines.filter((a) => !a.defunct && hasData(a));
  const ind = (sc.report && sc.report.industry) || {};
  const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
  const fmtNum = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d));
  const cmp = (n, avg, lowerBetter) => (n == null || avg == null ? '' : (lowerBetter ? n <= avg : n >= avg) ? ' sc-good' : ' sc-bad');
  const best = (key, lowerBetter) => {
    const vals = rows.map((a) => a[key]).filter((v) => v != null);
    if (!vals.length) return null;
    return lowerBetter ? Math.min(...vals) : Math.max(...vals);
  };
  const worst = (key, lowerBetter) => {
    const vals = rows.map((a) => a[key]).filter((v) => v != null);
    if (!vals.length) return null;
    return lowerBetter ? Math.max(...vals) : Math.min(...vals);
  };
  const COLS = [
    { key: 'onTimePct', label: 'On time', fmt: fmtPct, lowerBetter: false, avg: ind.onTimePct },
    { key: 'cancelledPct', label: 'Cancelled', fmt: fmtPct, lowerBetter: true, avg: ind.cancelledPct },
    { key: 'mishandledBagsRate', label: 'Bags mishandled', sub: 'per 100 bags', fmt: (n) => fmtNum(n, 2), lowerBetter: true, avg: ind.mishandledBagsRate },
    { key: 'involuntaryDBPer10k', label: 'Bumped', sub: 'per 10,000', fmt: (n) => fmtNum(n, 2), lowerBetter: true, avg: ind.involuntaryDBPer10k },
    { key: 'complaintsPer100k', label: 'Complaints', sub: 'per 100,000', fmt: (n) => fmtNum(n, 2), lowerBetter: true, avg: ind.complaintsPer100k },
  ];
  // Default sort: complaints per 100k, worst first — the column that measures how they treat you.
  const sorted = rows.slice().sort((a, b) => (b.complaintsPer100k ?? -1) - (a.complaintsPer100k ?? -1));
  const head = COLS.map((c) => `<th class="num">${esc(c.label)}${c.sub ? `<span class="sc-sub">${esc(c.sub)}</span>` : ''}</th>`).join('');
  const body = sorted.map((a) => `<tr>
      <td class="sc-name">${esc(a.name)}${a.notes && /combined|merged|reported with/i.test(a.notes) ? ' <span class="sc-flag" title="' + esc(a.notes) + '">†</span>' : ''}</td>
      ${COLS.map((c) => {
        const v = a[c.key];
        const isBest = v != null && v === best(c.key, c.lowerBetter);
        const isWorst = v != null && v === worst(c.key, c.lowerBetter) && !isBest;
        return `<td class="num${cmp(v, c.avg, c.lowerBetter)}${isBest ? ' sc-best' : ''}${isWorst ? ' sc-worst' : ''}">${c.fmt(v)}</td>`;
      }).join('')}
    </tr>`).join('');
  const avgRow = `<tr class="sc-avg"><td class="sc-name">All reporting airlines</td>${COLS.map((c) => `<td class="num">${c.fmt(c.avg)}</td>`).join('')}</tr>`;
  const r = sc.report || {};
  const periods = Array.from(new Set(rows.map((a) => a.period).filter(Boolean)));
  return `<section id="rights-scorecard" class="rights-block">
    <h3 class="rights-h">The airlines, by the government’s numbers</h3>
    <p class="hint">Straight from the U.S. DOT Air Travel Consumer Report${r.period ? ` — ${esc(r.period)}` : ''}. Same period, same metric, same source for every airline. Sorted by complaints per 100,000 passengers, worst first. Green is better than the industry line, red is worse.</p>
    <div class="gap-wrap"><table class="sc-table">
      <thead><tr><th>Airline</th>${head}</tr></thead>
      <tbody>${body}${avgRow}</tbody>
    </table></div>
    <div class="sc-share"><span class="hint">Share one column as a card:</span> ${COLS.map((c) => `<button class="ghost sm" data-sc-share="${esc(c.key)}">${esc(c.label)}</button>`).join(' ')}</div>
    <p class="hint sc-foot">${periods.length > 1 ? 'Periods differ by column where DOT publishes them at different cadences (bumping is quarterly): ' + esc(periods.join(' · ')) + '. ' : ''}${rows.some((a) => a.notes && /combined|merged|reported with/i.test(a.notes)) ? '† reported combined with a merger partner. ' : ''}${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Read the report →</a>` : ''}${r.publishedDate ? ` Published ${esc(r.publishedDate)}.` : ''}</p>
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
    <h3 class="rights-h"> Who’s actually on your side</h3>
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
  $('#results').innerHTML = `    <div class="claim-wizard">
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
      ? `<span> ${e.ruleUrl ? `<a href="${esc(e.ruleUrl)}" target="_blank" rel="noopener">${esc(e.rule)}</a>` : esc(e.rule)}</span>`      : '';
    return `<div class="claim-ent ${esc(e.strength)}">
      <div class="claim-ent-head">
        <span class="claim-ent-title">${esc(e.title)}</span>
        ${amt ? `<span class="claim-amt">${esc(e.amountText)}</span>` : ''}
      </div>
      ${e.detail ? `<p class="claim-detail">${esc(e.detail)}</p>` : ''}
      ${ruleBit || e.deadline ? `<div class="claim-meta">${ruleBit}${e.deadline ? `<span> ${esc(e.deadline)}</span>` : ''}</div>` : ''}
    </div>`;
  }).join('');

  $('#results').innerHTML = `    <div class="claim-result">
      <div class="claim-headline">${esc(res.headline)}</div>
      ${ents}
      <div class="claim-doc">
        <div class="claim-doc-head"><h3> Your demand letter</h3><button class="ghost sm" data-copy="claim-letter">Copy</button></div>
        <p class="hint">Anything still in [BRACKETS] fills in as you enter your details below.</p>
        <pre class="claim-pre" id="claim-letter">${esc(ClaimEngine.fill(res.letterBody, state.claim.details || {}, state.claim.answers))}</pre>
      </div>
      <div class="claim-doc">
        <div class="claim-doc-head"><h3> DOT complaint text</h3><button class="ghost sm" data-copy="claim-dot">Copy</button></div>
        <pre class="claim-pre" id="claim-dot">${esc(ClaimEngine.fill(res.dotText, state.claim.details || {}, state.claim.answers))}</pre>
        <a class="rights-btn" href="https://www.transportation.gov/airconsumer/file-consumer-complaint" target="_blank" rel="noopener">Open the DOT complaint form ↗</a>
      </div>
      ${fileSectionHtml(state.claim.answers)}
      <div id="claim-tracker"></div>
      ${escalationHtml(res, state.claim.answers)}
      ${viralSectionHtml(res)}
      <p class="hint claim-disclaim"> ${esc(res.disclaimer)}</p>
      <div class="claim-nav">${state.claim.history.length ? '<button class="ghost" id="claim-change">← Change an answer</button>' : ''}
        <button class="primary" id="claim-restart">↺ Check another problem</button></div>
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
  const change = $('#claim-change');
  if (change) change.addEventListener('click', claimBack);
  wireFileSection(res, state.claim.answers);
  wireEscalation(res, state.claim.answers);
  wireViralSection(res, state.claim.answers);
  renderClaimTracker();
}

// ---------- the claim tracker: what happens after you hit send ----------
// Renders the live clocks for THIS claim (if any filing has been recorded) and the one thing to do
// next. Filing is easy; not losing the thread is what actually gets people paid.
function renderClaimTracker() {
  const host = $('#claim-tracker');
  if (!host) return;
  const c = state.claim.trackId ? ClaimTrack.get(state.claim.trackId) : null;
  if (!c || !c.filings.length) {
    host.innerHTML = `<div class="ct-empty"><b>What happens after you send it:</b> the moment you file, this starts the airline's legal response clock (30 days to acknowledge, 60 to answer in writing) and tells you the day you're allowed to escalate — with the next letter ready.</div>`;
    return;
  }
  const tl = ClaimTrack.timeline(c);
  const na = ClaimTrack.nextAction(c);
  const stageLine = c.filings.map((f) => `${esc(ClaimTrack.STAGES[f.stage].label)} · ${esc(ClaimTrack.fmt(f.date))}`).join('  →  ');
  const rows = tl.map((t) => {
    const when = t.daysLeft < 0 ? `${Math.abs(t.daysLeft)} day${Math.abs(t.daysLeft) === 1 ? '' : 's'} overdue` : t.daysLeft === 0 ? 'Due today' : `${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'} left`;
    return `<div class="ct-row ${esc(t.status)}"><span class="ct-when">${when}</span><span class="ct-label">${esc(t.label)}</span><span class="ct-rule">${esc(t.rule)} · by ${esc(ClaimTrack.fmt(t.due))}</span></div>`;
  }).join('');
  const actionBtn = na.channel
    ? `<button class="primary ct-next-btn" data-ct-fire="${esc(na.channel)}">${na.kind === 'file' ? 'Send it' : 'Escalate now'}</button>`
    : '';
  host.innerHTML = `
    <div class="ct">
      <div class="ct-head"><span class="ct-title">Your claim, tracked</span><span class="ct-stages">${stageLine}</span></div>
      <div class="ct-next ${esc(na.kind)}"><b>Next:</b> ${esc(na.text)} ${actionBtn}</div>
      <div class="ct-rows">${rows}</div>
      <div class="ct-outcome">
        <span class="hint">Heard back?</span>
        <button class="ghost sm" data-ct-outcome="paid">They paid</button>
        <button class="ghost sm" data-ct-outcome="denied">They refused</button>
      </div>
      <p class="hint">Deadlines are the airline's legal obligations (14 CFR 259.7, 260.10, 250.8; FCBA). Weekends aren't counted for the credit-card refund clock; federal holidays aren't excluded, so this may run a day or two early — never late.</p>
    </div>`;
  $$('[data-ct-fire]').forEach((b) => b.addEventListener('click', () => {
    const target = document.getElementById(b.dataset.ctFire);
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('ct-flash'); setTimeout(() => target.classList.remove('ct-flash'), 1600); if (b.dataset.ctFire === 'esc-notice') { const det = target.closest('details'); if (det) det.open = true; } }
  }));
  $$('[data-ct-outcome]').forEach((b) => b.addEventListener('click', () => {
    ClaimTrack.markOutcome(state.claim.trackId, b.dataset.ctOutcome);
    renderClaimTracker();
  }));
}

// ---------- viral: turn the claim into a shareable TikTok receipt + caption ----------
function viralSectionHtml(res) {
  // A share card needs a firm (strong) entitlement behind it; otherwise there is nothing true to post.
  if (!Viral.shareable(res)) return '';
  return `<div class="claim-doc viral">
    <div class="claim-doc-head"><h3> Share your story</h3></div>
    <p class="hint">A clear receipt — the amount, the rule, and how fast you found it — is what gets people to check their own claims. Turn yours into a post.</p>
    <button class="primary" id="viral-gen"> Generate my TikTok post</button>
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
    out.innerHTML = `      <img class="viral-img" alt="Your shareable airline receipt card" src="${dataUrl}" />
      <div class="viral-cap-head"><b>Caption</b>
        <span><button class="ghost sm" id="viral-remix"> Remix</button>
        <button class="ghost sm" id="viral-copy">Copy caption</button></span></div>
      <pre class="claim-pre" id="viral-caption">${esc(cap)}</pre>
      <div class="file-actions">
        <button class="rights-btn" id="viral-download"> Save image</button>
        <button class="rights-btn" id="viral-share"> Share to TikTok</button>
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

// The step almost nobody takes — and the one airlines actually respond to. Kept collapsed so it
// reads as an escalation after the airline has already refused, not as the opening move.
function escalationHtml(res, a) {
  const cash = res.entitlements.find((e) => e.strength === 'strong' && ClaimEngine.exactAmount(e.amountText));
  const amount = cash ? ClaimEngine.exactAmount(cash.amountText) : '';
  return `<details class="claim-doc escalate">
    <summary><b>They said no. What now?</b></summary>
    <p class="hint">Most people stop at the customer-service form. That's what the process is designed for. If they've refused — or gone quiet past the deadline — there are two levers left, and airlines respond to both.</p>
    <div class="esc-grid">
      <div class="esc-card">
        <h4>Small claims court</h4>
        <p>No lawyer, filing fees usually $30–$75, and you sue where <em>you</em> live. Most consumer-protection suits against airlines are blocked by federal law — but <b>breach of the airline's own contract is not</b> (<em>American Airlines v. Wolens</em>). Defending a small claim costs them more than most claims are worth, which is why a credible notice often gets paid before anything is filed.</p>
        <button class="rights-btn" id="esc-notice">Write my final notice${amount ? ` (${esc(amount)})` : ''}</button>
      </div>
      <div class="esc-card">
        <h4>Evidence pack</h4>
        <p>Whatever route you take, the claim lives or dies on records. Here's exactly what to gather for this incident.</p>
        <button class="rights-btn" id="esc-evidence">Show my checklist</button>
      </div>
    </div>
    <div id="esc-out"></div>
  </details>`;
}

function wireEscalation(res, a) {
  const notice = $('#esc-notice');
  if (notice) notice.addEventListener('click', () => {
    const d = state.claim.details || {};
    const cash = res.entitlements.find((e) => e.strength === 'strong' && ClaimEngine.exactAmount(e.amountText));
    const amount = cash ? ClaimEngine.exactAmount(cash.amountText) : '';
    const text = ClaimEngine.fill(ClaimEngine.smallClaimsNotice(a, d, { amount }), d, a);
    if (state.claim.trackId) { ClaimTrack.recordFiling(state.claim.trackId, 'smallclaims', 'final notice'); renderClaimTracker(); }
    $('#esc-out').innerHTML = `<div class="claim-doc-head" style="margin-top:14px"><h3>Final notice before legal action</h3><button class="ghost sm" data-copy="esc-letter">Copy</button></div>
      <p class="hint">Send it the same way you sent the first request, so it's on the record. Fill anything still in [BRACKETS].</p>
      <pre class="claim-pre" id="esc-letter">${esc(text)}</pre>
      <p class="hint">This is information, not legal advice — small claims limits and procedure vary by state.</p>`;
    wireCopyButtons();
  });
  const ev = $('#esc-evidence');
  if (ev) ev.addEventListener('click', () => {
    const list = ClaimEngine.evidencePack(a);
    $('#esc-out').innerHTML = `<div class="crisis-collect" style="margin-top:14px"><h4>Gather these</h4>
      <ul>${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  });
}

function wireCopyButtons() {
  $$('[data-copy]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', () => {
      const el = document.getElementById(b.dataset.copy);
      if (!el) return;
      copyText(el.textContent);
      flashText(`[data-copy="${b.dataset.copy}"]`, 'Copied', 'Copy');
    });
  });
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
    <div class="claim-doc-head"><h3> File it — in a couple of taps</h3></div>
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
      <button class="rights-btn" id="file-email"> Email the airline</button>
      <button class="rights-btn" id="file-dot"> File DOT complaint</button>
      <button class="rights-btn" id="file-print"> Print / Save as PDF</button>
      ${a.payment === 'credit' ? '<button class="rights-btn" id="file-charge"> Chargeback letter</button>' : ''}
      <button class="rights-btn ghost" id="file-ics"> Reminder</button>
    </div>
    <p class="hint" id="file-status"></p>
  </div>`;
}

function wireFileSection(res, a) {
  const d = (state.claim.details = state.claim.details || {});
  const airlines = window.AIRLINES || [];
  const setStatus = (m) => { const s = $('#file-status'); if (s) s.textContent = m || ''; };

  // Keep the visible letter/complaint in sync as details are typed.
  const refreshDocs = () => {
    const L = $('#claim-letter'), D = $('#claim-dot');
    if (L) L.textContent = ClaimEngine.fill(res.letterBody, d, a);
    if (D) D.textContent = ClaimEngine.fill(res.dotText, d, a);
  };
  const bind = (sel, key) => {
    const el = $(sel);
    if (!el) return;
    if (d[key]) el.value = d[key];
    el.addEventListener('input', () => { d[key] = el.value.trim(); refreshDocs(); });
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
      refreshDocs();
    });
  }

  const letter = () => ClaimEngine.fill(res.letterBody, d, a);
  const dotText = () => ClaimEngine.fill(res.dotText, d, a);
  const onClick = (s, fn) => { const el = $(s); if (el) el.addEventListener('click', fn); };

  // Every filing gets recorded: this is what starts the airline's legal clock in the tracker.
  const track = (stage, note) => {
    if (!state.claim.trackId) {
      const c = ClaimTrack.start(a, d, res);
      state.claim.trackId = c.id;
    }
    ClaimTrack.recordFiling(state.claim.trackId, stage, note);
    renderClaimTracker();
  };

  onClick('#file-email', () => {
    const body = letter();
    const subj = ('Refund / compensation request' + (d.flightNo ? ' — flight ' + d.flightNo : '')).trim();
    track('airline', d._email ? 'email' : 'web form');
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
    track('dot', 'DOT online form');
    copyText(dotText());
    window.open('https://www.transportation.gov/airconsumer/file-consumer-complaint', '_blank', 'noopener');
    setStatus('Your DOT complaint text is copied — paste it into the form that just opened.');
  });
  onClick('#file-print', () => printDoc('Demand letter', letter()));
  onClick('#file-charge', () => { track('chargeback', 'letter to issuer'); printDoc('Chargeback letter', ClaimEngine.fill(ClaimEngine.chargebackLetter(a, d), d, a)); });
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

// Every open deadline on a trip -> one .ics: an all-day event on the due date plus reminders 7 days
// and 1 day before at 09:00 (the phone app schedules the same two). Grandma-proof: open the file,
// tap Add, done.
function downloadTripDeadlinesIcs(t) {
  const dls = Trips.deadlines(t).filter((d) => d.status !== 'expired');
  if (!dls.length) { setStatus('No open deadlines on this trip yet.'); return; }
  const z = (dd) => dd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const route = [t.origin, t.dest].filter(Boolean).join('-') || 'trip';
  const escI = (x) => String(x || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fairfare//Deadlines//EN', 'CALSCALE:GREGORIAN'];
  for (const d of dls) {
    const due = new Date(d.due + 'T09:00:00');
    const uid = `fairfare-${t.id}-${d.key}@local`;
    lines.push('BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(due),
      'SUMMARY:' + escI(`${route}: ${d.label} (last day)`),
      'DESCRIPTION:' + escI(`${d.why} Rule: ${d.rule}. Open Fairfare > My Trips to file it pre-filled.`),
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:' + escI(`${d.label} — 1 week left`), 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + escI(`${d.label} — tomorrow`), 'END:VALARM',
      'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url; el.download = `fairfare-${route}-deadlines.ics`;
  document.body.appendChild(el); el.click(); el.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(`${dls.length} deadline${dls.length === 1 ? '' : 's'} exported — open the file to add them to your calendar (reminders 7 days and 1 day before).`);
}

// ---------- Money Moves: the playbook + true-price calculator + card checker ----------
function renderMoves() {
  setStatus('');
  $('#trend').classList.add('hidden');
  const d = window.MONEY_DATA || { moves: [], fees: [], cards: [] };
  const moves = d.moves || [], fees = d.fees || [], cards = d.cards || [];
  $('#results').innerHTML = `    <div class="rights-hero">
      <h2>The stuff airlines don’t advertise</h2>
      <p>Real ways to pay less and claw money back — the exact steps, the dollar amount, and the honest catch. No fluff.</p>
    </div>
    <section id="mm-buycheck" class="rights-block">${buyCheckHtml(fees)}</section>
    <section id="mm-play" class="rights-block">
      <h3 class="rights-h"> The playbook</h3>
      <p class="rights-sub">Sorted by how much they put back in your pocket. Tap one for the steps and the catch.</p>
      ${moves.length ? moves.map(moveCardHtml).join('') : '<p class="hint">Loading the playbook…</p>'}
    </section>
    <section id="mm-true" class="rights-block">${truePriceHtml(fees)}</section>
    <section id="mm-fare" class="rights-block">${fareClassHtml()}</section>
    <section id="mm-schedule" class="rights-block">${scheduleChangeHtml()}</section>
    <section id="mm-fees" class="rights-block">
      <h3 class="rights-h"> The fees they bury</h3>
      <p class="rights-sub">The upfront fee-disclosure rule got struck down in 2026, so airlines don’t have to show these while you shop. Here they are anyway.</p>
      ${feeTableHtml(fees)}
    </section>
    <section id="mm-cards" class="rights-block">${cardCheckerHtml(cards)}</section>`;
  wireTruePrice(fees);
  wireFareClass();
  wireCardChecker(cards);
  wireBuyCheck(fees);
}

// ---------- the Buy Check: run a fare through everything we know, before you pay ----------
function buyCheckHtml(fees) {
  const opts = (fees || []).map((f, i) => `<option value="${i}">${esc(f.airline)}</option>`).join('');
  const regions = (r) => Coverage.REGIONS.map((x) => `<option value="${esc(x.id)}"${x.id === r ? ' selected' : ''}>${esc(x.label)}</option>`).join('');
  return `<div class="mm-tool bc-tool">
    <h3 class="rights-h">Before you buy: run the check</h3>
    <p class="rights-sub">Airlines price the fare; the rest they keep quiet. Thirty seconds here shows the real total, whether you're protected if it goes wrong, and the leverage you keep after paying — before they get your money.</p>
    <div class="mm-grid bc-grid">
      <label>Airline<select id="bc-airline">${opts}</select></label>
      <label>Fare you see<span class="mm-money"><span class="cur">$</span><input id="bc-fare" type="number" min="0" placeholder="240" /></span></label>
      <label>Fare type<select id="bc-type"><option value="basic">Basic economy</option><option value="main" selected>Main / regular</option></select></label>
    </div>
    <div class="mm-grid bc-grid2">
      <label>Flying from<select id="bc-from">${regions('us')}</select></label>
      <label>Flying to<select id="bc-to">${regions('us')}</select></label>
    </div>
    <div class="mm-checks">
      <label><input type="checkbox" id="bc-carry" checked /> Carry-on</label>
      <label><input type="checkbox" id="bc-bag" /> Checked bag</label>
      <label><input type="checkbox" id="bc-seat" checked /> Pick my seat</label>
      <label><input type="checkbox" id="bc-change" /> Might change it</label>
    </div>
    <div class="mm-grid bc-cert hidden" id="bc-cert-row">
      <label>Booking class (optional)<input id="bc-class" maxlength="1" placeholder="T" autocomplete="off" /></label>
      <label>Card<select id="bc-tier"><option value="platinum">Platinum</option><option value="reserve">Reserve</option></select></label>
    </div>
    <div id="bc-out" class="mm-out"></div>
  </div>`;
}

function wireBuyCheck(fees) {
  if (!$('#bc-airline')) return;
  const run = () => {
    const f = fees[Number($('#bc-airline').value) || 0] || {};
    $('#bc-cert-row').classList.toggle('hidden', !/^DL$/i.test(f.iata || ''));
    const to = $('#bc-to').value;
    const report = BuyCheck.run({
      airlineIndex: Number($('#bc-airline').value) || 0,
      fare: Number($('#bc-fare').value) || 0,
      fareType: $('#bc-type').value,
      needs: { carryOn: $('#bc-carry').checked, bag: $('#bc-bag').checked, seat: $('#bc-seat').checked, change: $('#bc-change').checked },
      fromRegion: $('#bc-from').value,
      toRegion: to,
      carrierRegion: 'us', // every airline in the picker is a U.S. carrier
      band: ['eu', 'uk', 'ch'].includes(to) || ['eu', 'uk', 'ch'].includes($('#bc-from').value) ? 'long' : 'medium',
      bookingClass: $('#bc-class') ? $('#bc-class').value : '',
      tier: $('#bc-tier') ? $('#bc-tier').value : 'platinum',
    });
    $('#bc-out').innerHTML = report.sections.map((s) => `
      <div class="bc-sec ${esc(s.level)}">
        <div class="bc-sec-title">${esc(s.title)}</div>
        ${s.headline ? `<p class="bc-headline">${esc(s.headline)}</p>` : ''}
        ${(s.lines || []).map((l) => `<p class="bc-line">${esc(l)}</p>`).join('')}
        ${(s.warns || []).map((w) => `<p class="bc-warn">${esc(w)}</p>`).join('')}
        ${s.gem ? `<p class="bc-gem">Worth knowing: ${esc(s.gem)} <span class="hint">(full detail under “Your airline's own contract” in Your rights)</span></p>` : ''}
        ${s.kind === 'record' ? `<p class="hint">U.S. DOT Air Travel Consumer Report${s.period ? ', ' + esc(s.period) : ''}.${s.reportUrl ? ` <a href="${esc(s.reportUrl)}" target="_blank" rel="noopener">Read the report →</a>` : ''}</p>` : ''}
      </div>`).join('');
    // The deal verdict layers on top when we have history for this route (single-airport granularity
    // only exists for HLN searches, so this appears when it can actually say something).
  };
  ['#bc-airline', '#bc-fare', '#bc-type', '#bc-from', '#bc-to', '#bc-carry', '#bc-bag', '#bc-seat', '#bc-change', '#bc-class', '#bc-tier']
    .forEach((sel) => { const el = $(sel); if (el) el.addEventListener(sel.includes('fare') || sel.includes('class') ? 'input' : 'change', run); });
  const fare = $('#bc-fare');
  if (fare) fare.addEventListener('input', run);
  run();
}

// The schedule-change lever: airlines quietly move your flight, and that move can hand you
// rights you didn't buy — including cash back on a nonrefundable ticket.
function scheduleChangeHtml() {
  const s = window.COC_DATA && window.COC_DATA.schedule;
  if (!s) return '';
  const tactics = (s.tactics || []).map((t, i) => `
    <details class="coc-prov">
      <summary><span class="coc-topic">${esc(t.name)}</span><span class="coc-rule">${esc((t.worth || '').split('.')[0].slice(0, 44))}</span></summary>
      <div class="coc-body">
        <p>${esc(t.how)}</p>
        ${t.worth ? `<p class="coc-worth"><b>Worth:</b> ${esc(t.worth)}</p>` : ''}
        ${t.risk ? `<p class="coc-catch"><b>Reality check:</b> ${esc(t.risk)}</p>` : ''}
      </div>
    </details>`).join('');
  return `<div class="mm-tool">
    <h3 class="rights-h">When they move your flight, you gain leverage</h3>
    <p class="rights-sub">${esc(s.whatItIs || '')}</p>
    ${s.dotBaseline ? `<div class="coc-gem"><b>Your floor, by law</b><p>${esc(s.dotBaseline)}</p></div>` : ''}
    <div class="coc-list-head">What to do with it</div>
    ${tactics}
    <p class="hint">The cash refund on a qualifying change is a firm federal right. Everything else here is airline policy plus the individual agent — ask for it as such, and it works far more often than people expect.</p>
  </div>`;
}

// The one letter on your ticket that decides what you're allowed to do. Printed on every
// confirmation, explained on none of them.
function fareClassHtml() {
  return `<div class="mm-tool">
    <h3 class="rights-h">Decode the letter on your ticket</h3>
    <p class="rights-sub">Every ticket has a one-letter booking class. It decides whether your companion certificate works, whether you can upgrade, and whether you can change your flight — and two people in neighbouring seats can hold completely different rights. Find it on your confirmation (often labelled “Class” or “Fare class”).</p>
    <div class="mm-grid fc-grid">
      <label>Your booking class<input id="fc-code" placeholder="e.g. T" autocomplete="off" autocapitalize="characters" /></label>
      <label>Your card<select id="fc-tier">
        <option value="platinum">Platinum</option>
        <option value="reserve">Reserve</option>
      </select></label>
    </div>
    <div id="fc-out" class="mm-out"></div>
  </div>`;
}

function wireFareClass() {
  const input = $('#fc-code');
  if (!input) return;
  const run = () => {
    const out = $('#fc-out');
    const tier = $('#fc-tier').value;
    const raw = input.value;
    if (!raw.trim()) { out.innerHTML = eligibleListHtml(tier); return; }
    const d = FareClass.decode(raw, tier);
    if (!d) { out.innerHTML = `<p class="hint">Enter a single letter from your confirmation.</p>`; return; }
    if (!d.known) {
      out.innerHTML = `<div class="cov-card no"><div class="cov-head"><span class="cov-regime">Class ${esc(d.code)}</span></div>
        <p class="cov-why">${esc(d.summary)}</p></div>${eligibleListHtml(tier)}`;
      return;
    }
    const ok = d.cert.ok;
    out.innerHTML = `
      <div class="cov-card ${ok ? 'yes' : 'no'}">
        <div class="cov-head">
          <span class="cov-regime">Class ${esc(d.code)} — ${esc(d.tier)}</span>
          <span class="cov-amt">${ok ? 'Certificate works' : 'Not eligible'}</span>
        </div>
        <p class="cov-why">${ok
          ? `This books into <b>${esc(d.cert.cabin)}</b>, which your ${tier === 'reserve' ? 'Reserve' : 'Platinum'} certificate can ticket. If the fare looks right, the companion should price out at taxes only.`
          : esc(d.cert.why)}</p>
        ${d.note ? `<p class="cov-pays">${esc(d.note)}</p>` : ''}
        <p class="cov-pays">Cabin: ${esc(d.cabin)} · Changes/refunds: ${esc(d.flexibility)}</p>
        ${!d.certain ? `<p class="cov-tip">Delta rotates inventory codes, so treat the cabin as the typical structure and confirm on your ticket. The certificate eligibility above is from Delta’s own certificate terms.</p>` : ''}
        ${d.cert.upgradeHint ? `<p class="cov-tip">Worth knowing: this is exactly what the Reserve card buys you over Platinum — the higher cabins.</p>` : ''}
      </div>
      ${eligibleListHtml(tier)}`;
  };
  // Typing over an existing letter replaces it: keep only the last letter entered.
  input.addEventListener('input', () => {
    const last = input.value.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();
    if (input.value !== last) input.value = last;
    run();
  });
  input.addEventListener('focus', () => input.select());
  $('#fc-tier').addEventListener('change', run);
  run();
}

function eligibleListHtml(tier) {
  const rows = FareClass.eligibleList(tier).map((g) =>
    `<div class="fc-row"><span class="fc-cabin">${esc(g.cabin)}</span><span class="fc-codes">${g.codes.map((c) => `<code>${esc(c)}</code>`).join('')}</span></div>`).join('');
  return `<div class="fc-list">
    <div class="fc-list-head">What your certificate can actually ticket</div>
    ${rows}
    <p class="hint">These seats have to be open for sale in that exact bucket — that's why a flight can show plenty of empty seats and still refuse the certificate.</p>
  </div>`;
}

function moveCardHtml(m) {
  const risk = m.riskLevel || 'low';
  const riskLabel = risk === 'high' ? 'High risk' : risk === 'medium' ? 'Some risk' : 'Low risk';
  return `<div class="mm-card ${esc(risk)}">
    <div class="mm-card-head">
      <span class="mm-card-title">${esc(m.title)}</span>
      <span class="mm-risk ${esc(risk)}">${riskLabel}</span>
    </div>
    <div class="mm-tldr"> ${esc(m.tldr)}${m.saves ? ` · <b>${esc(m.saves)}</b>` : ''}</div>
    <p class="mm-what">${esc(m.whatItIs)}</p>
    <details class="r-more"><summary>Exact steps &amp; the catch</summary>
      <div class="rights-detail">
        ${m.steps && m.steps.length ? `<div class="rd-row"><span class="rd-k">Do this</span><span class="rd-v"><ol class="mm-steps">${m.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></span></div>` : ''}
        ${m.saves ? `<div class="rd-row"><span class="rd-k">Saves</span><span class="rd-v">${esc(m.saves)}</span></div>` : ''}
        ${m.theCatch ? `<div class="rd-row"><span class="rd-k">The catch</span><span class="rd-v">${esc(m.theCatch)}</span></div>` : ''}
        ${m.legal ? `<div class="rd-row"><span class="rd-k">Legal?</span><span class="rd-v">${esc(m.legal)}</span></div>` : ''}
        ${sourcesHtml(m.sources)}
      </div>
    </details>
  </div>`;
}

function truePriceHtml(fees) {
  const opts = (fees || []).map((f, i) => `<option value="${i}">${esc(f.airline)}</option>`).join('');
  return `<div class="mm-tool">
    <h3 class="rights-h"> True price calculator</h3>
    <p class="rights-sub">The “cheap” fare usually isn’t. See what it really costs once you add what you actually need.</p>
    <div class="mm-grid">
      <label>Airline<select id="tp-airline">${opts}</select></label>
      <label>Fare you see<span class="mm-money"><span class="cur">$</span><input id="tp-fare" type="number" min="0" placeholder="129" /></span></label>
      <label>Fare type<select id="tp-type"><option value="basic">Basic economy</option><option value="main">Main / regular</option></select></label>
    </div>
    <div class="mm-checks">
      <label><input type="checkbox" id="tp-carry" checked /> Full-size carry-on</label>
      <label><input type="checkbox" id="tp-bag" /> Check a bag</label>
      <label><input type="checkbox" id="tp-seat" checked /> Pick my seat</label>
      <label><input type="checkbox" id="tp-change" /> Might change it</label>
    </div>
    <div id="tp-out" class="mm-out"></div>
  </div>`;
}

function feeNum(s) {
  if (!s) return 0;
  const nums = [...String(s).matchAll(/\$\s?(\d+)/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
}

function wireTruePrice(fees) {
  if (!$('#tp-airline')) return;
  ['#tp-airline', '#tp-fare', '#tp-type', '#tp-carry', '#tp-bag', '#tp-seat', '#tp-change'].forEach((s) => {
    const el = $(s);
    if (el) el.addEventListener('input', () => computeTruePrice(fees));
  });
  computeTruePrice(fees);
}

function computeTruePrice(fees) {
  const f = (fees || [])[Number($('#tp-airline').value) || 0];
  if (!f) return;
  const fare = Number($('#tp-fare').value) || 0;
  const basic = $('#tp-type').value === 'basic';
  const wantCarry = $('#tp-carry').checked, wantBag = $('#tp-bag').checked, wantSeat = $('#tp-seat').checked, wantChange = $('#tp-change').checked;
  let add = 0;
  const lines = [];
  if (wantBag) { const b = feeNum(f.checkedBag1); add += b; lines.push(['Checked bag', b]); }
  if (wantCarry) { const c = feeNum(f.carryOn); if (c > 0) { add += c; lines.push(['Carry-on', c]); } }
  if (wantSeat) { const s = feeNum(f.seat); if (s > 0) { add += s; lines.push(['Seat selection', s]); } }
  const warns = [];
  if (basic) {
    if (f.basicEconomy) warns.push('Basic economy: ' + f.basicEconomy);
    if (wantChange) warns.push('Basic economy usually can’t be changed — if plans shift, you lose the whole fare.');
  } else if (wantChange && f.changeFee) {
    warns.push('Changes on this fare: ' + f.changeFee);
  }
  const total = fare + add;
  const out = $('#tp-out');
  if (!out) return;
  out.innerHTML = `    <div class="mm-out-top">${fare ? `That ${money(fare)} fare can run up to <b>${money(total)}</b>` : `Real total: up to <b>${money(total)}</b>`}${add > 0 ? ` — ${money(add)} in add-ons they don’t show you upfront.` : '.'}</div>
    ${lines.length ? `<ul class="mm-lines">${lines.map((l) => `<li>${esc(l[0])}: <b>+${money(l[1])}</b></li>`).join('')}</ul>` : ''}
    ${warns.length ? `<div class="mm-warn"> ${warns.map(esc).join('<br>')}</div>` : ''}
    <p class="hint">Run the same numbers on each airline before you book — the lowest sticker price usually loses once the fees land.</p>`;
}

function feeTableHtml(fees) {
  if (!fees || !fees.length) return '<p class="hint">Loading fee schedules…</p>';
  const rows = fees.map((f) => `<tr>
    <td><b>${esc(f.airline)}</b></td>
    <td>${esc(f.checkedBag1 || '—')}</td>
    <td>${esc(f.carryOn || '—')}</td>
    <td>${esc(f.seat || '—')}</td>
    <td>${esc(f.changeFee || '—')}</td>
    <td class="mm-be">${esc(f.basicEconomy || '—')}</td>
  </tr>`).join('');
  return `<table class="scan mm-fees">
    <thead><tr><th>Airline</th><th>1st bag</th><th>Carry-on</th><th>Seat</th><th>Change</th><th>Basic economy strips</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function cardCheckerHtml(cards) {
  const opts = ['<option value="">Pick your card…</option>'].concat((cards || []).map((c, i) => `<option value="${i}">${esc(c.card)}</option>`)).join('');
  return `<div class="mm-tool">
    <h3 class="rights-h"> Money you already have</h3>
    <p class="rights-sub">Most people never claim the trip insurance built into their credit card. Check yours.</p>
    <select id="cc-pick" class="mm-cc-pick">${opts}</select>
    <div id="cc-out" class="mm-out"></div>
  </div>`;
}

function wireCardChecker(cards) {
  const sel = $('#cc-pick');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const c = (cards || [])[Number(sel.value)];
    const out = $('#cc-out');
    if (!c) { out.innerHTML = ''; return; }
    const cell = (k, v) => (v ? `<div class="mm-cc-cell"><div class="mm-cc-k">${esc(k)}</div><div class="mm-cc-v">${esc(v)}</div></div>` : '');
    out.innerHTML = `      <div class="mm-cc-grid">
        ${cell('Flight delay', c.tripDelay)}
        ${cell('Trip cancellation', c.tripCancellation)}
        ${cell('Bag delayed', c.baggageDelay)}
        ${cell('Bag lost', c.baggageLoss)}
      </div>
      ${c.howToClaim ? `<p class="mm-cc-how"><b>How to claim:</b> ${esc(c.howToClaim)}</p>` : ''}
      <div class="mm-warn"> The catch: ${esc(c.catch || 'You must pay for the trip with this card.')}</div>
      ${sourcesHtml(c.sources)}`;
  });
}

// ---------- My Trips: the vault + claim-deadline tracker ----------
const ISSUE_LABELS = {
  none: 'Nothing went wrong (just tracking it)',
  cancelled: 'It got canceled',
  schedule: 'They changed the flight time or route before the trip',
  delayed: 'It was very late',
  bumped: 'I got bumped from an oversold flight',
  bag_late: 'My bag showed up late',
  bag_lost: 'My bag was lost or damaged',
  downgrade: 'I got downgraded',
  extra: 'I paid for something I didn’t get',
};

function renderTrips() {
  setStatus('');
  $('#trend').classList.add('hidden');
  if (state.tripEditing) return renderTripForm();
  // Pull the watchdog's findings once per render; re-render when they land so alerts appear.
  if (!state.watchPulling) {
    state.watchPulling = true;
    Trips.pullAlerts().then((r) => { state.watch = r; state.watchPulling = false; if (state.takeoverShown === 'trips' && !state.tripEditing) renderTripsBody(); });
  }
  renderTripsBody();
}

function renderTripsBody() {

  const trips = Trips.all();
  const soon = Trips.upcoming().filter((u) => u.deadline.daysLeft <= 14);
  const hasClaims = ClaimTrack.all().some((c) => c.status === 'open' && c.filings.length);

  if (!trips.length && !hasClaims) {
    $('#results').innerHTML = `      <div class="rights-hero">
        <h2>Never miss a deadline again</h2>
        <p>Every way to get money back from an airline has a clock on it — some as short as 7 days. Save a trip and this counts every one down for you, then files the claim with your details already filled in.</p>
      </div>
      <div class="tv-empty">
        <button class="primary" id="tv-first">＋ Add your first trip</button>
        <p class="hint">Takes 20 seconds. Stored on this device with no account. To watch fares, only the route and dates are checked on our server — never your name or confirmation number.</p>
      </div>`;
    $('#tv-first').addEventListener('click', () => { state.tripEditing = {}; renderTrips(); });
    return;
  }

  const alertBar = soon.length
    ? `<div class="tv-alert"><b> ${soon.length} deadline${soon.length === 1 ? '' : 's'} in the next 2 weeks.</b> ${esc(soon[0].deadline.label)} for ${esc(soon[0].trip.airline || 'your trip')} ${soon[0].deadline.daysLeft <= 0 ? 'is due today' : 'in ' + soon[0].deadline.daysLeft + ' day' + (soon[0].deadline.daysLeft === 1 ? '' : 's')}.</div>`    : '';

  $('#results').innerHTML = `    ${watchBannerHtml()}
    ${moneyBannerHtml()}
    ${openClaimsHtml()}
    ${alertBar}
    <div class="summary-line wrap">
      <span><b>${trips.length}</b> trip${trips.length === 1 ? '' : 's'} tracked</span>
      <button class="ghost sm" id="tv-add">＋ Add a trip</button>
    </div>
    ${trips.map(tripCardHtml).join('')}`;

  $('#tv-add').addEventListener('click', () => { state.tripEditing = {}; renderTrips(); });
  $$('[data-trip-edit]').forEach((b) => b.addEventListener('click', () => {
    state.tripEditing = Trips.all().find((t) => t.id === b.dataset.tripEdit) || {};
    renderTrips();
  }));
  $$('[data-trip-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('Remove this trip?')) { Trips.remove(b.dataset.tripDel); renderTrips(); }
  }));
  $$('[data-trip-claim]').forEach((b) => b.addEventListener('click', () => openClaimFromTrip(b.dataset.tripClaim)));
  $$('[data-trip-fare]').forEach((b) => b.addEventListener('click', () => doFareCheck(b.dataset.tripFare)));
  $$('[data-trip-ics]').forEach((b) => b.addEventListener('click', () => { const t = Trips.all().find((x) => x.id === b.dataset.tripIcs); if (t) downloadTripDeadlinesIcs(t); }));
  $$('[data-dl-share]').forEach((b) => b.addEventListener('click', () => shareDeadline(b.dataset.dlShare)));
  $$('[data-ct-open]').forEach((b) => b.addEventListener('click', () => openTrackedClaim(b.dataset.ctOpen)));
  $$('[data-wd-ack]').forEach((b) => b.addEventListener('click', async () => {
    const t = Trips.all().find((x) => x.id === b.dataset.wdAck);
    if (t) { await Trips.ackAlerts(t); state.watch = await Trips.pullAlerts(); renderTripsBody(); refreshTripsBadge(); }
  }));
  $$('[data-wd-refund]').forEach((b) => b.addEventListener('click', () => {
    const [id, idx] = String(b.dataset.wdRefund).split('|');
    openRefundFromAlert(id, Number(idx));
  }));
  fillTripTrends(trips);
}

// Watchdog found a significant schedule change -> open the claim wizard fully answered as a
// declined schedule change, with the ORIGINAL vs NEW times written into the letter. The federal
// test is the size of the change (14 CFR 260.2), so the exact minutes are the evidence.
function fmtLegTime(v) {
  if (!v) return '';
  const m = String(v).match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  return String(v);
}
function legSummary(legs) {
  if (!Array.isArray(legs) || !legs.length) return '';
  const first = legs[0], last = legs[legs.length - 1];
  const bits = [];
  if (first.dep) bits.push('dep ' + fmtLegTime(first.dep));
  if (last.arr) bits.push('arr ' + fmtLegTime(last.arr));
  if (legs.length > 1) bits.push(`${legs.length - 1} stop${legs.length > 2 ? 's' : ''}`);
  return bits.join(' / ');
}
function deltaBand(min) {
  if (min == null) return '3-4';
  if (min < 60) return '<1';
  if (min < 120) return '1-2';
  if (min < 180) return '2-3';
  if (min < 240) return '3-4';
  if (min < 360) return '4-6';
  return '6+';
}
function openRefundFromAlert(tripId, alertIdx) {
  const t = Trips.all().find((x) => x.id === tripId);
  const w = state.watch && state.watch.byTripId ? state.watch.byTripId[t && (t.watchId || t.id)] : null;
  if (!t || !w) return;
  const a = (w.alerts || [])[alertIdx];
  if (!a) return;
  const isReturn = /^Return/.test(a.title || '');
  const leg = isReturn ? 'inbound' : 'outbound';
  const wasLegs = w.baseline ? w.baseline[leg] : null;
  const nowLegs = w.latest ? w.latest[leg] : null;
  const routeChange = /connection|different airport/i.test(a.detail || '');
  const answers = Object.assign(Trips.claimAnswers(t), {
    type: 'schedule',
    schedDelta: routeChange ? 'route' : deltaBand(a.delta),
    schedAccepted: 'no',
    incidentDate: (a.at || new Date().toISOString()).slice(0, 10),
    schedFrom: legSummary(wasLegs) || undefined,
    schedTo: legSummary(nowLegs) || undefined,
    schedDirection: /earlier/i.test(a.detail || '') ? 'earlier' : 'later',
    flightDate: t.departDate || undefined,
  });
  if (answers.region === 'from_eu' || answers.region === 'from_uk') {
    // Notice = how far before departure the change surfaced.
    const days = t.departDate ? Math.round((new Date(t.departDate + 'T00:00:00') - new Date(answers.incidentDate + 'T00:00:00')) / 86400000) : null;
    answers.schedNotice = days == null ? '14+' : days < 7 ? '<7' : days < 14 ? '7-13' : '14+';
  }
  state.claim = { answers, history: ClaimEngine.prefilledHistory(answers), details: Trips.claimDetails(t) };
  const idx = (window.AIRLINES || []).findIndex((x) => x.name.replace(/\s*\(.*\)\s*$/, '') === (t.airline || ''));
  if (idx >= 0) {
    const al = window.AIRLINES[idx];
    Object.assign(state.claim.details, { _idx: String(idx), _email: al.email, _refundUrl: al.refundUrl, _complaintUrl: al.complaintUrl, _defunct: !!al.defunct });
  }
  $$('.tab').forEach((x) => x.classList.remove('active'));
  document.querySelector('.tab[data-mode="claim"]').classList.add('active');
  ['explore', 'single', 'scan', 'rights', 'moves', 'trips'].forEach((m) => $('#mode-' + m).classList.add('hidden'));
  $('#mode-claim').classList.remove('hidden');
  state.takeoverShown = 'claim';
  renderClaimStep();
  setStatus('Refund request drafted from the watchdog’s evidence — the old and new times are in the letter. Check the details, then send.');
}

// After the cards are on screen, pull each dated trip's price trend and drop it in place.
// The paid fare (if the user recorded one) is judged against the route so "you're $X over the
// low" reads against what THEY paid, not an abstract number.
function fillTripTrends(trips) {
  for (const t of trips) {
    if (!(t.origin && t.dest && t.departDate)) continue;
    fetchTrend({ origin: t.origin, destination: t.dest, departDate: t.departDate, returnDate: t.returnDate }).then((tr) => {
      const el = document.getElementById('trend-' + t.id);
      if (!el || !tr) return;
      if (!tr.trip.n && !(tr.route && tr.route.n)) { el.remove(); return; }
      const paid = t.fare ? Number(t.fare) : null;
      let paidLine = '';
      if (paid && tr.trip.n && tr.trip.latest != null) {
        const diff = Math.round(paid - tr.trip.latest);
        const today = new Date().toISOString().slice(0, 10);
        const when = tr.trip.latestDay === today ? "Today's fare" : `The fare we last saw (${esc(Trips.fmt(tr.trip.latestDay))})`;
        if (diff > 0) paidLine = `<div class="tr-paid good">${when} is <b>${money(diff)} under</b> what you paid — on a no-change-fee fare that difference comes back as credit when you rebook. ${tr.trip.latestDay === today ? '' : 'Hit “Check today\'s fare” to confirm it still holds.'}</div>`;
        else if (diff < 0) paidLine = `<div class="tr-paid">You paid ${money(Math.abs(diff))} less than ${tr.trip.latestDay === today ? "today's fare" : 'the last fare we saw'} — you bought well.</div>`;
      }
      el.innerHTML = trendBlockHtml(tr, { price: paid, compact: true }) + paidLine;
    });
  }
}

// Airline name -> IATA (from the verified directory), for policy lookups.
function iataForAirline(name) {
  if (!name) return null;
  const clean = String(name).replace(/\s*\(.*\)\s*$/, '').toLowerCase();
  const hit = (window.AIRLINES || []).find((a) => a.name.replace(/\s*\(.*\)\s*$/, '').toLowerCase() === clean);
  return hit ? hit.iata : null;
}

// "Your fare dropped $N — here is exactly what THIS airline does about it." Data is the airline's
// own published policy (public/faredrop-data.js), verified. Says nothing for airlines we haven't verified.
function fareDropPlaybookHtml(t, drop) {
  const fd = window.FAREDROP;
  const iata = iataForAirline(t && t.airline);
  const p = fd && Array.isArray(fd.airlines) ? fd.airlines.find((x) => x.iata === iata) : null;
  if (!p || p.defunct) return '';
  const amount = drop ? money(drop) : 'the difference';
  const form = p.refundForm === 'original_payment' ? 'back to your card' : p.refundForm === 'credit' ? 'as travel credit' : p.refundForm === 'mixed' ? 'as credit (or cash in some cases)' : '';
  let head;
  if (p.canReprice === true) head = `On ${esc(p.name)}, you can move to the lower fare and get ${amount} ${form}${p.changeFeeNum ? ` (minus the ${esc(p.changeFee)} change fee)` : ' with no change fee'}.`;
  else if (p.canReprice === 'partial') head = `On ${esc(p.name)}, repricing works only in some cases: ${esc(p.notes || p.changeFee || '')}`;
  else head = `On ${esc(p.name)}, standard tickets can’t be repriced after purchase${p.changeFee ? ` (${esc(p.changeFee)})` : ''}. ${esc(p.notes || '')}`;
  const steps = Array.isArray(p.howTo) && p.howTo.length ? `<ol class="fd-steps">${p.howTo.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : '';
  const facts = [
    p.basicEconomy ? `<b>Basic Economy:</b> ${esc(p.basicEconomy)}` : '',
    p.creditExpiry ? `<b>Credit expiry:</b> ${esc(p.creditExpiry)}` : '',
    p.sameDayNote ? esc(p.sameDayNote) : '',
  ].filter(Boolean).map((x) => `<div class="fd-fact">${x}</div>`).join('');
  const src = Array.isArray(p.sourceUrls) && p.sourceUrls[0] ? `<a href="${esc(p.sourceUrls[0])}" target="_blank" rel="noopener">${esc(p.name)}’s policy →</a>` : '';
  return `<div class="fd-block">
    <div class="fd-head">${head}</div>
    ${steps}
    ${facts}
    <div class="hint fd-src">${src}${fd.verifiedDate ? ` Verified ${esc(fd.verifiedDate)}.` : ''}</div>
  </div>`;
}

// The watchdog's findings on one trip: each alert is a money lever with the rule behind it.
function watchAlertsHtml(t) {
  const w = state.watch && state.watch.byTripId ? state.watch.byTripId[t.watchId || t.id] : null;
  if (!w) {
    return t.watched ? `<div class="wd-line quiet">Watchdog on it — re-checks for fare drops and schedule changes automatically${w && w.lastCheckedAt ? '' : '. First check runs shortly.'}</div>` : '';
  }
  const alerts = (w.alerts || []).filter((a) => !a.resolved);
  const meta = `checked ${w.checks || 0}× · ${w.lastCheckedAt ? 'last ' + new Date(w.lastCheckedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'first check pending'}${w.lastError ? ' · ' + esc(w.lastError) : ''}`;
  if (!alerts.length) return `<div class="wd-line quiet">Watchdog on it — no changes yet <span class="hint">(${meta})</span></div>`;
  return `<div class="wd-alerts">${alerts.map((a) => `
    <div class="wd-alert ${esc(a.severity)}${a.seen ? ' seen' : ''}">
      <div class="wd-title">${esc(a.title)}${a.seen ? '' : ' <span class="wd-new">new</span>'}</div>
      <div class="wd-detail">${esc(a.detail)}</div>
      ${a.lever ? `<div class="wd-lever"><b>Do this:</b> ${esc(a.lever)}${a.rule ? ` <span class="hint">(${esc(a.rule)})</span>` : ''}</div>` : ''}
      ${a.kind === 'price_drop' ? fareDropPlaybookHtml(t, a.delta) : ''}
      ${a.kind === 'significant_change' ? `<div class="wd-act"><button class="primary sm" data-wd-refund="${esc(t.id)}|${(w.alerts || []).indexOf(a)}">Write the refund request →</button> <span class="hint">Letter pre-filled with the old and new times. You hit send.</span></div>` : ''}
    </div>`).join('')}
    <div class="wd-meta"><span class="hint">${meta}</span><button class="ghost sm" data-wd-ack="${esc(t.id)}">Got it</button></div>
  </div>`;
}

// "Money the machine found" — the running tally of what the watchdog surfaced across all trips.
function watchBannerHtml() {
  const s = state.watch && state.watch.summary;
  if (!s || !s.watches) return '';
  if (!s.unseen && !s.moneyFound) return '';
  const bits = [];
  if (s.moneyFound) bits.push(`<b class="tv-big">$${Math.round(s.moneyFound).toLocaleString('en-US')}</b> in fare drops found on your trips`);
  if (s.unseen) bits.push(`${s.unseen} new alert${s.unseen === 1 ? '' : 's'} below`);
  return `<div class="tv-money wd-banner"><div class="tv-money-top">Watchdog: ${bits.join(' · ')}</div>
    <div class="tv-money-sub">Every saved trip is re-checked automatically. A fare drop means you can rebook and keep the difference; a big schedule shift can mean a free change or a full cash refund — even on a nonrefundable ticket.</div></div>`;
}

// Open claims in the vault: the "did they respond yet?" view. Each card is the claim's next action.
function openClaimsHtml() {
  const claims = ClaimTrack.all().filter((c) => c.status === 'open' && c.filings.length);
  if (!claims.length) return '';
  const cards = claims.map((c) => {
    const na = ClaimTrack.nextAction(c);
    const d = c.details || {};
    const route = [d.origin, d.dest].filter(Boolean).join(' → ') || (d.airline || 'Claim');
    const overdue = ClaimTrack.timeline(c).filter((t) => t.status === 'overdue').length;
    return `<div class="tv-card ct-card ${na.kind === 'escalate' ? 'escalate' : ''}">
      <div class="tv-head">
        <div>
          <div class="tv-route">${esc(route)}${c.amount ? ` <span class="tv-flight">${esc(c.amount)}</span>` : ''}</div>
          <div class="tv-meta">${esc(d.airline || '')} · filed ${esc(ClaimTrack.fmt(c.filings[0].date))}${overdue ? ` · <b class="ct-od">${overdue} clock${overdue === 1 ? '' : 's'} blown</b>` : ''}</div>
        </div>
        <button class="ghost sm" data-ct-open="${esc(c.id)}">Open</button>
      </div>
      <div class="ct-next ${esc(na.kind)}"><b>Next:</b> ${esc(na.text)}</div>
    </div>`;
  }).join('');
  return `<div class="ct-vault"><div class="rights-h" style="font-size:16px;margin-bottom:8px">Claims in progress</div>${cards}</div>`;
}

// Re-open a tracked claim in the wizard result view, with its tracker live.
function openTrackedClaim(id) {
  const c = ClaimTrack.get(id);
  if (!c) return;
  state.claim = { answers: c.answers || {}, history: [], details: c.details || {}, trackId: c.id };
  const idx = (window.AIRLINES || []).findIndex((x) => x.name.replace(/\s*\(.*\)\s*$/, '') === (c.details && c.details.airline || ''));
  if (idx >= 0) { const x = window.AIRLINES[idx]; Object.assign(state.claim.details, { _idx: String(idx), _email: x.email, _refundUrl: x.refundUrl, _complaintUrl: x.complaintUrl, _defunct: !!x.defunct }); }
  $$('.tab').forEach((x) => x.classList.remove('active'));
  document.querySelector('.tab[data-mode="claim"]').classList.add('active');
  ['explore', 'single', 'scan', 'rights', 'moves', 'trips'].forEach((m) => $('#mode-' + m).classList.add('hidden'));
  $('#mode-claim').classList.remove('hidden');
  state.takeoverShown = 'claim';
  renderClaimStep();
}

// The running total — the reason to come back. Split into what's owed vs what depends on the
// cause, so the headline number is one we can actually stand behind.
function moneyBannerHtml() {
  const m = Trips.moneyOnTable();
  const foreign = m.foreign || [];
  if (!m.confirmed && !m.potential && !m.unquantified && !m.incomplete && !foreign.length) return '';
  const bits = [];
  if (m.potential) bits.push(`plus up to <b>${money(m.potential)}</b> more if the airline caused it`);
  if (foreign.length) bits.push(`plus <b>${foreign.map(esc).join(' + ')}</b> in EU/UK/Canada compensation if the airline caused it`);
  if (m.unquantified) bits.push(`${m.unquantified} refund${m.unquantified === 1 ? '' : 's'} owed (add what you paid to total them)`);
  if (m.incomplete) bits.push(`${m.incomplete} claim${m.incomplete === 1 ? ' needs' : 's need'} a couple more answers before we can put a number on ${m.incomplete === 1 ? 'it' : 'them'}`);
  const head = m.confirmed
    ? `You're owed <b class="tv-big">${money(m.confirmed)}</b>`    : (m.potential || foreign.length || m.unquantified)
      ? `You have <b class="tv-big">${m.potential ? money(m.potential) : foreign[0] ? esc(foreign[0]) : 'money'}</b> on the table`
      : `<b class="tv-big">${m.incomplete}</b> claim${m.incomplete === 1 ? '' : 's'} to finish`;
  return `<div class="tv-money">
    <div class="tv-money-top">${head}${m.tripsWithClaims ? ` <span class="hint">across ${m.tripsWithClaims} trip${m.tripsWithClaims === 1 ? '' : 's'}</span>` : ''}</div>
    ${bits.length ? `<div class="tv-money-sub">${bits.join(' · ')}</div>` : ''}
    ${m.next ? `<div class="tv-money-next">Next deadline: <b>${esc(m.next.deadline.label)}</b> — ${m.next.deadline.daysLeft <= 0 ? 'today' : m.next.deadline.daysLeft + ' day' + (m.next.deadline.daysLeft === 1 ? '' : 's') + ' left'}</div>` : ''}
  </div>`;
}

function tripCardHtml(t) {
  const dl = Trips.deadlines(t);
  const live = dl.filter((d) => d.status !== 'expired');
  const stake = Trips.atStake(t);
  const route = [t.origin, t.dest].filter(Boolean).join(' → ') || '—';
  const issue = t.issue && t.issue !== 'none' ? ISSUE_LABELS[t.issue] : null;
  return `<div class="tv-card">
    <div class="tv-head">
      <div>
        <div class="tv-route">${esc(route)}${t.flightNo ? ` <span class="tv-flight">${esc(t.flightNo)}</span>` : ''}</div>
        <div class="tv-meta">${esc(t.airline || 'Airline not set')}${t.departDate ? ' · ' + esc(Trips.fmt(t.departDate)) : ''}</div>
      </div>
      <div class="tv-actions">
        <button class="ghost sm" data-trip-edit="${esc(t.id)}">Edit</button>
        <button class="ghost sm" data-trip-del="${esc(t.id)}">✕</button>
      </div>
    </div>
    ${issue ? `<div class="tv-issue">${esc(issue)}${stake ? ` · <b>you may be owed ${esc(stake)}</b>` : ''}</div>` : ''}
    ${watchAlertsHtml(t)}
    ${t.origin && t.dest && t.departDate ? `<div class="tv-trend" id="trend-${esc(t.id)}"></div>` : ''}
    ${live.length ? `<div class="tv-dls">${live.slice(0, 5).map((d) => deadlineHtml(d, t)).join('')}</div>` : '<p class="hint">No open deadlines. If something went wrong on this trip, hit Edit and tell it what happened.</p>'}
    <div class="tv-fare" id="fare-${esc(t.id)}">${t.fareCheck ? fareResultHtml(t.fareCheck) : ''}</div>
    <div class="tv-btns">
      ${t.issue && t.issue !== 'none'
        ? `<button class="primary tv-claim" data-trip-claim="${esc(t.id)}"> See what I'm owed &amp; file it →</button>`        : `<button class="ghost tv-claim" data-trip-edit="${esc(t.id)}">Something go wrong on this trip?</button>`}
      <button class="ghost sm" data-trip-fare="${esc(t.id)}"> Check today's fare</button>
      ${live.length ? `<button class="ghost sm" data-trip-ics="${esc(t.id)}">Add deadlines to calendar</button>` : ''}
    </div>
  </div>`;
}

function deadlineHtml(d, trip) {
  const n = d.daysLeft;
  const when = n <= 0 ? 'Due today' : n === 1 ? '1 day left' : `${n} days left`;
  const shareable = trip && n <= 60;
  return `<div class="tv-dl ${esc(d.status)}" title="${esc(d.why)}">
    <span class="tv-dl-when">${when}</span>
    <span class="tv-dl-label">${esc(d.label)}</span>
    <span class="tv-dl-due">by ${esc(Trips.fmt(d.due))}${shareable ? ` <button class="tv-share" data-dl-share="${esc(trip.id)}|${esc(d.key)}" title="Share this countdown">↗</button>` : ''}</span>
  </div>`;
}

function fareResultHtml(fc) {
  if (!fc) return '';
  if (fc.error) return `<div class="tv-fare-line warn"> ${esc(fc.error)}</div>`;
  if (fc.unavailable) return `<div class="tv-fare-line">${esc(fc.unavailable)}</div>`;
  if (fc.drop != null && fc.drop > 0) {
    const t = Trips.all().find((x) => x.fareCheck === fc) || null;
    return `<div class="tv-fare-line good"><b> Fare dropped ${money(fc.drop)}</b> — it's ${money(fc.current)} today vs the ${money(fc.paid)} you paid.
      On a no-change-fee fare you can usually rebook and keep the difference as travel credit. <span class="hint">(checked ${esc(fc.checked)})</span></div>${fareDropPlaybookHtml(t, fc.drop)}`;
  }
  if (fc.drop != null && fc.drop <= 0) {
    return `<div class="tv-fare-line">Today's fare is ${money(fc.current)} — no drop below the ${money(fc.paid)} you paid. <span class="hint">(checked ${esc(fc.checked)})</span></div>`;
  }
  return `<div class="tv-fare-line">Today's fare: <b>${money(fc.current)}</b>. <span class="hint">Add what you paid (Edit) to track drops. (checked ${esc(fc.checked)})</span></div>`;
}

async function doFareCheck(id) {
  const t = Trips.all().find((x) => x.id === id);
  if (!t) return;
  const box = document.getElementById('fare-' + id);
  if (box) box.innerHTML = '<div class="tv-fare-line"><span class="spinner"></span>Checking today\'s fare…</div>';
  const fc = await Trips.checkFare(t);
  Trips.update(id, { fareCheck: fc });
  if (box) box.innerHTML = fareResultHtml(fc);
  // The check just recorded a fresh observation — redraw this trip's trend so the verdict moves.
  fillTripTrends([t]);
}

// Share a closing-window countdown — the useful fact is that these deadlines exist.
function shareDeadline(payload) {
  const [id, key] = String(payload).split('|');
  const t = Trips.all().find((x) => x.id === id);
  if (!t) return;
  const d = Trips.deadlines(t).find((x) => x.key === key);
  if (!d) return;
  const opts = { airline: t.airline || '', label: d.label, daysLeft: d.daysLeft, amount: Trips.atStake(t), rule: d.rule };
  const dataUrl = Viral.renderDeadlineCard(opts);
  const cap = Viral.deadlineCaption(opts);
  shareImage(dataUrl, cap).then((r) => {
    setStatus(r === 'shared' ? 'Shared — caption copied to paste.' : 'Countdown image saved + caption copied.');
  });
}

function renderTripForm() {
  const t = state.tripEditing || {};
  const isNew = !t.id;
  const opt = (v, label, cur) => `<option value="${esc(v)}"${cur === v ? ' selected' : ''}>${esc(label)}</option>`;
  const airlines = (window.AIRLINES || []).map((a) => a.name.replace(/\s*\(.*\)\s*$/, ''));
  $('#results').innerHTML = `    <div class="tv-form">
      <h2 class="claim-q">${isNew ? 'Add a trip' : 'Edit trip'}</h2>
      <p class="hint">Only the airline and date are needed. The more you add, the more it can file for you later.</p>
      <div class="file-grid">
        <label class="file-wide">Airline
          <input id="tf-airline" list="tf-air-list" value="${esc(t.airline || '')}" placeholder="Delta Air Lines" autocomplete="off" />
          <datalist id="tf-air-list">${airlines.map((a) => `<option value="${esc(a)}"></option>`).join('')}</datalist>
        </label>
        <label>Flight #<input id="tf-flight" value="${esc(t.flightNo || '')}" placeholder="DL1234 — fills the airline" autocomplete="off" /></label>
        <label>Confirmation #<input id="tf-conf" value="${esc(t.confirmation || '')}" placeholder="ABC123" autocomplete="off" /></label>
        <label>From<input id="tf-origin" value="${esc(t.origin || '')}" placeholder="HLN" autocomplete="off" /></label>
        <label>To<input id="tf-dest" value="${esc(t.dest || '')}" placeholder="JFK" autocomplete="off" /></label>
        <label>Flight date<input id="tf-depart" type="date" value="${esc(t.departDate || '')}" /></label>
        <label>Date you booked<input id="tf-booked" type="date" value="${esc(t.bookedDate || '')}" /></label>
        <label>Where<select id="tf-region">
          ${opt('us', 'Within the U.S.', t.region || 'us')}
          ${opt('intl_from_us', 'International, leaving the U.S.', t.region)}
          ${opt('from_eu', 'Leaving the EU', t.region)}
          ${opt('from_uk', 'Leaving the UK', t.region)}
          ${opt('canada', 'To/from Canada', t.region)}
        </select></label>
        <label>Paid with<select id="tf-pay">
          ${opt('credit', 'Credit card', t.payment || 'credit')}
          ${opt('other', 'Debit, cash, or check', t.payment)}
        </select></label>
        <label class="file-wide">What happened?<select id="tf-issue">
          ${Object.keys(ISSUE_LABELS).map((k) => opt(k, ISSUE_LABELS[k], t.issue || 'none')).join('')}
        </select></label>
        <label id="tf-issuedate-wrap" class="${t.issue && t.issue !== 'none' ? '' : 'hidden'}">When did it happen?<input id="tf-issuedate" type="date" value="${esc(t.issueDate || '')}" /></label>
        <label>What you paid <span class="hint" style="font-weight:400">(tracks fare drops)</span><input id="tf-fare" type="number" min="0" value="${esc(t.fare || '')}" placeholder="250" /></label>
        <label id="tf-delay-wrap" class="${t.issue === 'delayed' || t.issue === 'bumped' ? '' : 'hidden'}">How late did you arrive?<select id="tf-delay">${opt('', '— choose —', t.arrDelay || '')}
          ${['<1|Under 1 hour', '1-2|1–2 hours', '2-3|2–3 hours', '3-4|3–4 hours', '4-6|4–6 hours', '6-9|6–9 hours', '9+|9+ hours'].map((s) => { const [v, l] = s.split('|'); return opt(v, l, t.arrDelay || ''); }).join('')}
        </select></label>
      </div>
      <div class="file-actions">
        <button class="primary" id="tf-save">${isNew ? 'Save trip' : 'Save changes'}</button>
        <button class="ghost" id="tf-cancel">Cancel</button>
      </div>
    </div>`;

  const sync = () => {
    const iss = $('#tf-issue').value;
    $('#tf-issuedate-wrap').classList.toggle('hidden', iss === 'none');
    $('#tf-delay-wrap').classList.toggle('hidden', iss !== 'delayed' && iss !== 'bumped');
  };
  $('#tf-issue').addEventListener('change', sync);

  // Type "DL1234" -> the airline fills itself in (and with it, the right filing channel).
  $('#tf-flight').addEventListener('input', () => {
    const guess = Trips.airlineFromFlightNo($('#tf-flight').value);
    const air = $('#tf-airline');
    if (guess && !air.value.trim()) {
      air.value = guess;
      air.classList.add('tf-autofilled');
      setTimeout(() => air.classList.remove('tf-autofilled'), 1200);
    }
  });

  $('#tf-cancel').addEventListener('click', () => { state.tripEditing = null; renderTrips(); });
  $('#tf-save').addEventListener('click', () => {
    const data = {
      airline: $('#tf-airline').value.trim(),
      flightNo: $('#tf-flight').value.trim(),
      confirmation: $('#tf-conf').value.trim(),
      origin: $('#tf-origin').value.trim().toUpperCase(),
      dest: $('#tf-dest').value.trim().toUpperCase(),
      departDate: $('#tf-depart').value,
      bookedDate: $('#tf-booked').value,
      region: $('#tf-region').value,
      payment: $('#tf-pay').value,
      issue: $('#tf-issue').value,
      issueDate: $('#tf-issuedate').value || $('#tf-depart').value,
      fare: $('#tf-fare').value,
      arrDelay: ['delayed', 'bumped'].includes($('#tf-issue').value) ? $('#tf-delay').value : '',
    };
    if (!data.airline && !data.departDate) { alert('Add at least the airline or the flight date.'); return; }
    const saved = t.id ? Trips.update(t.id, data) : Trips.add(data);
    state.tripEditing = null;
    // Put the machine on it: server re-checks this trip for fare drops and schedule shifts.
    if (saved && saved.origin && saved.dest && saved.departDate) Trips.watch(saved).then(() => renderTrips());
    renderTrips();
  });
}

// One tap: saved trip -> fully answered claim, details pre-filled, straight to the result.
function openClaimFromTrip(id) {
  const t = Trips.all().find((x) => x.id === id);
  if (!t) return;
  const answers = Trips.claimAnswers(t);
  state.claim = { answers, history: ClaimEngine.prefilledHistory(answers), details: Trips.claimDetails(t) };
  const idx = (window.AIRLINES || []).findIndex((a) => a.name.replace(/\s*\(.*\)\s*$/, '') === (t.airline || ''));
  if (idx >= 0) {
    const a = window.AIRLINES[idx];
    Object.assign(state.claim.details, { _idx: String(idx), _email: a.email, _refundUrl: a.refundUrl, _complaintUrl: a.complaintUrl, _defunct: !!a.defunct });
  }
  $$('.tab').forEach((x) => x.classList.remove('active'));
  document.querySelector('.tab[data-mode="claim"]').classList.add('active');
  ['explore', 'single', 'scan', 'rights', 'moves', 'trips'].forEach((m) => $('#mode-' + m).classList.add('hidden'));
  $('#mode-claim').classList.remove('hidden');
  state.takeoverShown = 'claim';
  renderClaimStep();
}

// ---------- crisis mode: at the airport, right now ----------
function renderCrisisMenu() {
  setStatus('');
  $('#trend').classList.add('hidden');
  const cards = Crisis.SCENARIOS.map((s) => `    <button class="crisis-card" data-crisis="${esc(s.id)}">
      <span class="crisis-title">${esc(s.title)}</span>
      <span class="crisis-go">→</span>
    </button>`).join('');
  $('#results').innerHTML = `    <div class="crisis-head">
      <h2>What's happening?</h2>
      <p class="rights-sub">The next 20 minutes decide most of the money. Pick the situation — you'll get exactly what to do, what to say, and what not to accept.</p>
    </div>
    <div class="crisis-list">${cards}</div>
    <div class="crisis-evidence">
      <h4> Whatever it is — start collecting now</h4>
      <ul>${Crisis.EVIDENCE.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <button class="ghost" id="crisis-home">← Back to the app</button>`;
}

function renderCrisisScenario(id) {
  const s = Crisis.SCENARIOS.find((x) => x.id === id);
  if (!s) return renderCrisisMenu();
  $('#results').innerHTML = `    <div class="crisis-head">
      <h2>${esc(s.title)}</h2>
    </div>
    <div class="crisis-steps">
      ${s.now.map((n, i) => `<div class="crisis-step"><span class="crisis-num">${i + 1}</span><p>${esc(n)}</p></div>`).join('')}
    </div>
    <div class="crisis-say">
      <h4> Word for word, at the counter</h4>
      <p>${esc(s.say)}</p>
      <button class="ghost sm" id="crisis-copy">Copy the script</button>
    </div>
    <div class="crisis-collect"><h4> Collect</h4><ul>${s.collect.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
    <div class="mm-warn"> ${esc(s.dontAccept)}</div>
    <div class="cov-card yes"><p class="cov-why"> ${esc(s.money)}</p></div>
    <div class="file-actions">
      <button class="primary" id="crisis-claim"> Later: see what this is worth &amp; file it</button>
      <button class="ghost" id="crisis-back">← Other situations</button>
    </div>`;
  const copy = $('#crisis-copy');
  if (copy) copy.addEventListener('click', () => { copyText(s.say); flashText('#crisis-copy', 'Copied ✓', 'Copy the script'); });
  const claim = $('#crisis-claim');
  if (claim) claim.addEventListener('click', () => {
    // Jump into the claim wizard with the matching incident type pre-answered.
    const map = { delay: 'delayed', cancel: 'cancelled', bump: 'bumped', bag: 'bag_late', bagdrop: 'bag_late', weather: 'cancelled' };
    state.claim = { answers: { type: map[s.id] || undefined }, history: map[s.id] ? ['type'] : [] };
    $$('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelector('.tab[data-mode="claim"]').classList.add('active');
    ['explore', 'single', 'scan', 'rights', 'moves', 'trips'].forEach((m) => $('#mode-' + m).classList.add('hidden'));
    $('#mode-claim').classList.remove('hidden');
    state.takeoverShown = 'claim';
    renderClaimStep();
  });
}

// ---------- price trend: is this price actually good, and should you buy or wait? ----------
// Everything here comes from /api/trend, which is computed from prices this app itself recorded
// (every search, and every watchdog sweep). Honest by design: under 3 observations for the exact
// trip it says "learning" instead of inventing a call — but the route-wide context still shows.
async function fetchTrend({ origin, destination, departDate, returnDate }) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const qs = new URLSearchParams({ origin: origin || state.origin, destination, departDate: departDate || '', returnDate: returnDate || '', today });
  try { return await fetchJSON(`/api/trend?${qs}`); } catch { return null; }
}

const VERDICT_LABEL = { buy: 'Buy', wait: 'Wait', watch: 'Watch', learn: 'Learning', past: 'Flown' };

// Inline sparkline (path pre-computed by the server so web + mobile draw the identical line).
function miniSparkHtml(spark, trip) {
  if (!spark || !spark.path) return '';
  const pts = spark.points || [];
  const last = pts[pts.length - 1];
  return `<svg class="tr-spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
    <path d="${spark.path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${last ? `<circle cx="${last[0]}" cy="${last[1]}" r="2.2" fill="currentColor"/>` : ''}
  </svg>`;
}

// One block: verdict + the exact reason + the summary line + route context. `price` (optional)
// is the fare on screen, judged against the route's history when the trip series is thin.
function trendBlockHtml(tr, { price = null, compact = false } = {}) {
  if (!tr || !tr.trip) return '';
  const t = tr.trip, r = tr.route || { n: 0 };
  const v = t.verdict || 'learn';
  let routeLine = '';
  if (r.n >= 5) {
    const p = price != null ? Number(price) : t.latest;
    let judged = '';
    if (p != null) {
      if (p <= r.p25) judged = `<b>cheap for this route</b> — in the lowest quarter of the ${r.n} fares we've seen`;
      else if (p <= r.median) judged = `below the usual ${money(r.median)} for this route`;
      else if (p >= r.p75) judged = `<b>high for this route</b> — it usually runs ${money(r.median)}`;
      else judged = `about normal for this route (usually ${money(r.median)})`;
    }
    const which = price != null && p !== t.latest ? `What you paid (${money(p)}) is ` : price != null ? `This fare (${money(p)}) is ` : t.latest != null ? `The last fare we saw (${money(t.latest)}) is ` : '';
    routeLine = `<div class="tr-route">${judged ? which + judged + ' · ' : ''}route low ${money(r.min)} · typical ${money(r.median)} · ${r.n} fares recorded</div>`;
  } else if (r.n) {
    routeLine = `<div class="tr-route">Route history: ${r.n} fare${r.n === 1 ? '' : 's'} recorded so far (route verdicts start at 5).</div>`;
  }
  const spark = t.n >= 2 ? miniSparkHtml(tr.spark, t) : '';
  const head = `<span class="tr-verdict ${esc(v)}">${VERDICT_LABEL[v] || v}</span>`;
  const meta = t.n ? `<span class="tr-summary">${esc(tr.summary || '')}</span>` : '';
  if (compact) {
    return `<div class="tr-block compact">${head}${spark}<div class="tr-body"><div class="tr-reason">${esc(t.reason || '')}</div>${meta}${routeLine}</div></div>`;
  }
  return `<div class="tr-block">
    <div class="tr-top">${head}${spark}${meta}</div>
    <div class="tr-reason">${esc(t.reason || '')}</div>
    ${routeLine}
  </div>`;
}

// ---------- zero-typing glue: search result -> Buy Check / My Trips ----------
// Coverage region for a destination code: the curated network's zone first, then a small map of
// major EU/UK/CH/CA airports (for hand-typed codes), else 'other' — flagged so we never quietly
// assert the wrong regime.
const REGION_BY_AIRPORT = {
  // EU/EEA majors
  CDG: 'eu', ORY: 'eu', AMS: 'eu', FRA: 'eu', MUC: 'eu', MAD: 'eu', BCN: 'eu', FCO: 'eu', MXP: 'eu',
  DUB: 'eu', LIS: 'eu', ATH: 'eu', VIE: 'eu', BRU: 'eu', CPH: 'eu', ARN: 'eu', OSL: 'eu', HEL: 'eu', KEF: 'eu',
  // UK
  LHR: 'uk', LGW: 'uk', MAN: 'uk', EDI: 'uk', STN: 'uk',
  // Switzerland
  ZRH: 'ch', GVA: 'ch',
  // Canada
  YYZ: 'ca', YVR: 'ca', YUL: 'ca', YYC: 'ca', YOW: 'ca', YEG: 'ca',
};
function regionForDest(dest) {
  const d = (state.meta && state.meta.destinations || []).find((x) => x.code === dest);
  if (d) return { region: d.zone === 'domestic' ? 'us' : 'other', known: true };
  if (REGION_BY_AIRPORT[dest]) return { region: REGION_BY_AIRPORT[dest], known: true };
  return { region: 'other', known: false };
}

// Prefill the Buy Check from an offer and open it — the form is rendered by the moves tab,
// so activate the tab first (that wires the listeners), then set fields and fire them.
function openBuyCheckPrefilled(o) {
  document.querySelector('.tab[data-mode="moves"]').click();
  const fees = (window.MONEY_DATA && window.MONEY_DATA.fees) || [];
  const dlIdx = fees.findIndex((f) => /^DL$/i.test(f.iata || ''));
  const setVal = (sel, v, ev = 'change') => { const el = $(sel); if (el != null && v != null) { el.value = String(v); el.dispatchEvent(new Event(ev)); } };
  if (dlIdx >= 0) setVal('#bc-airline', dlIdx);
  setVal('#bc-fare', Math.round(Number(o.price) || 0), 'input');
  setVal('#bc-type', o.basic ? 'basic' : 'main');
  setVal('#bc-from', 'us');
  const r = regionForDest(o.dest);
  setVal('#bc-to', r.region);
  if (o.klass) setVal('#bc-class', o.klass, 'input');
  const tierSel = $('#tier');
  if (tierSel && $('#bc-tier')) setVal('#bc-tier', tierSel.value);
  const target = document.getElementById('mm-buycheck');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(r.known
    ? `Buy Check pre-filled from your ${esc(o.dest)} result.`
    : `Buy Check pre-filled from your ${esc(o.dest)} result — double-check “Flying to,” we don't recognize that airport's region.`);
}

// One tap: found deal -> the trip vault, fare-drop watch armed. The claim deadlines arm
// themselves the moment a booking date or an issue is added later.
function saveTripFromOffer(o) {
  const d = (state.meta && state.meta.destinations || []).find((x) => x.code === o.dest);
  const zone = d ? d.zone : null;
  const t = Trips.add({
    airline: 'Delta Air Lines',
    origin: state.origin,
    dest: o.dest,
    departDate: o.depart || '',
    returnDate: o.ret || '',
    region: zone === 'domestic' ? 'us' : zone ? 'intl_from_us' : 'us',
    payment: 'credit',
    issue: 'none',
    fare: o.price ? String(Math.round(Number(o.price))) : '',
  });
  Trips.watch(t).then(() => renderTrips());
  document.querySelector('.tab[data-mode="trips"]').click();
  setStatus(`Saved ${state.origin} → ${esc(o.dest)} to My Trips — and the watchdog is on it: it re-checks automatically for fare drops and schedule changes you can cash in on.`);
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
  setStatus(`${offers.length} Delta option(s) · ${srcLabel}${degraded ? ' ·  ' + (notes || 'fell back to sample') : ''}`);

  const best = offers.find((o) => o.companion.status !== 'ineligible') || offers[0];
  let html = '';
  if (best) {
    html += `<div class="summary-line">
      <span>Best companion value to <b>${params.destination}</b>:</span>
      ${bestBadge(best)}
      <button id="trend-btn" class="ghost sm"> Price calendar &amp; trend</button>
    </div>
    <div id="deal-verdict" class="deal-line"></div>`;
  }
  html += offers.map((o) => offerCard(o, params)).join('') || '<p class="hint">No Delta offers returned for these dates. Try different dates.</p>';
  $('#results').innerHTML = html;
  wireStarButtons(params.tier);
  $$('[data-bc-offer]').forEach((b) => b.addEventListener('click', () =>
    openBuyCheckPrefilled({ dest: b.dataset.dest, price: b.dataset.price, klass: b.dataset.klass, basic: !!b.dataset.basic })));
  $$('[data-save-trip]').forEach((b) => b.addEventListener('click', () =>
    saveTripFromOffer({ dest: b.dataset.dest, price: b.dataset.price, depart: b.dataset.depart, ret: b.dataset.return })));
  const tb = $('#trend-btn');
  if (tb) tb.addEventListener('click', () => loadTrend(params));

  // Price verdict — this search just recorded a new observation, so the trend is fresh.
  if (best) {
    fetchTrend({ destination: params.destination, departDate: params.departDate, returnDate: params.returnDate }).then((tr) => {
      const el = $('#deal-verdict');
      if (el && tr) el.innerHTML = trendBlockHtml(tr, { price: best.price.total });
    });
  }
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
    ? `Booking classes: ${e.bookingClasses.map((c) => `<code>${c}</code>`).join('')}`    : `Booking class: <em>not shown by ${sourceShort(o.provider)}</em>`;

  return `<div class="offer ${e.status}">
    <div class="offer-head">
      <div class="route">${state.origin} → ${dest}
        <span class="seg">${routeLine(o)}</span>
      </div>
      <div>${statusTag(e)}</div>
    </div>

    <div class="metrics">
      <div class="metric"><div class="k">One ticket</div><div class="v">${money(v.secondTicketPrice, v.currency)}</div></div>
      <div class="metric"><div class="k">Companion pays${v.estimate ? ' (est.)' : ''}${v.taxExact ? ' <span class="exact" title="Computed from the exact federal fees — not an estimate">exact</span>' : ''}</div><div class="v">${e.status === 'ineligible' ? '—' : cents(v.companionTaxes, v.currency)}</div>${taxBreakdownHtml(v)}</div>
      <div class="metric save"><div class="k">You save ${est}</div><div class="v">${v.netSavings == null ? '—' : money(v.netSavings, v.currency)}</div></div>
    </div>

    <div class="classes">${classes} &nbsp;·&nbsp; ${e.reason}</div>

    <div class="offer-actions">
      <button class="star-btn ${star}" data-dest="${dest}" data-depart="${params.departDate}" data-return="${params.returnDate || ''}">
        ${star ? '★ Watching' : '☆ Watch this trip'}</button>
      <button class="bc-offer-btn" data-bc-offer
        data-dest="${esc(dest)}" data-price="${esc(o.price?.total ?? '')}"
        data-klass="${esc((e.bookingClasses && e.bookingClasses[0]) || '')}"
        data-basic="${o.basicEconomy || o.basic ? '1' : ''}">Buy Check ›</button>
      <button class="save-trip-btn" data-save-trip
        data-dest="${esc(dest)}" data-price="${esc(o.price?.total ?? '')}"
        data-depart="${esc(params.departDate || '')}" data-return="${esc(params.returnDate || '')}">＋ My Trips</button>
      <a href="${googleFlights(dest, params)}" target="_blank" rel="noopener">Google Flights ↗</a>
      <a href="${deltaLink(dest, params)}" target="_blank" rel="noopener">Open on Delta ↗</a>
    </div>
  </div>`;
}

// Show the receipts: every fee, itemized, so the number is checkable rather than trusted.
function taxBreakdownHtml(v) {
  if (!v.taxBreakdown || !v.taxBreakdown.length) return '';
  const rows = v.taxBreakdown
    .filter((b) => b.amount !== 0 || b.code === 'US')
    .map((b) => `<div class="tb-row"><span>${esc(b.label)}</span><span>${b.amount < 0 ? '−' : ''}${cents(Math.abs(b.amount), v.currency)}</span></div>`)
    .join('');
  return `<details class="tax-break"><summary>see the breakdown</summary>
    <div class="tb">${rows}<div class="tb-row tb-total"><span>Total</span><span>${cents(v.companionTaxes, v.currency)}</span></div></div>
    <p class="hint">Federal fees set by statute (49 CFR 1510.5 · 49 U.S.C. 40117 · IRC 4261). The 7.5% excise is $0 because the companion fare is $0.</p>
  </details>`;
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

// Exact-to-the-cent formatting — used wherever we're showing a precise fee, not a rounded fare.
function cents(n, cur = 'USD') {
  if (n == null) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  catch { return `$${Number(n).toFixed(2)}`; }
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
