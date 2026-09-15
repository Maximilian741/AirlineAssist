// viral.js — turns a claim result into a shareable TikTok post:
// a 9:16 "the airline owes me $X" receipt card (PNG via canvas) + a fact-led caption with hashtags.
// Pure client-side, no backend. window.Viral.{ caption, renderCard }.

window.Viral = (function () {
  'use strict';

  // The one entitlement a share card may feature: a strong (firm) claim. Conditional money depends on
  // facts we don't know (the cause, the carrier's size), so it never becomes "owes me" in a public post.
  function featured(res) {
    return ((res && res.entitlements) || []).find((e) => e.strength === 'strong') || null;
  }
  // A figure the entitlement LEADS with is exact ("$800 (400% of your fare…)"); a ceiling never leads.
  const EXACT = /^\s*(\$[\d,]+|€\s?[\d,]+|£\s?[\d,]+|CAD\s?[\d,]+)(?![\d,]|\s*\/)/;
  const ANY_FIGURE = /(\$[\d,]+|€\s?[\d,]+|£\s?[\d,]+|[\d,]+ SDR)/;
  function pickAmount(res) {
    const e = featured(res);
    const m = e ? String(e.amountText || '').match(EXACT) : null;
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
  }
  function shareable(res) {
    return !!featured(res);
  }
  function airlineName(d) {
    const n = (d && d.airline ? String(d.airline) : '').trim();
    return n || 'The airline';
  }

  /** Everything the card says, taken from the featured entitlement. null when there is nothing firm to share. */
  function cardCopy(res, a, d) {
    const e = featured(res);
    if (!e) return null;
    const al = airlineName(d);
    const rule = e.rule && e.rule !== '—' ? e.rule : 'the rule behind it';
    const title = String(e.title || '');
    if (/lost|damaged/i.test(title)) {
      const cap = (String(e.amountText || '').match(ANY_FIGURE) || [])[1] || '';
      return {
        headline: `${al} has to cover my lost bag.`,
        sub: cap ? `For what I can prove was inside, up to ${cap}.` : 'For what I can prove was inside.',
        panelLabel: 'COVERED UP TO',
        big: cap || 'MY PROVEN LOSS',
        rule,
      };
    }
    const amount = pickAmount(res);
    const pct = String(e.amountText || '').match(/^(\d+)% of /);
    const phrase = amount || (pct ? `${pct[1]}% of my fare` : /full cash refund/i.test(title) ? 'a full refund' : /bag fee/i.test(title) ? 'my bag fee back' : /refund/i.test(title) ? 'a refund' : '');
    return {
      headline: phrase ? `${al} owes me ${phrase}.` : `${al} owes me — here’s the rule.`,
      sub: e.condition ? `Conditions apply: ${e.condition}.` : 'Most people never ask for it.',
      panelLabel: 'THEY OWE ME',
      big: (phrase || 'see the rule').toUpperCase(),
      rule,
    };
  }

  // Captions state what the rule entitles you to. Nothing is narrated as already paid.
  // n.start begins a sentence ("Delta" / "The airline"), n.mid sits inside one ("Delta" / "the airline"),
  // n.adj qualifies a noun ("Delta " / "") so "an oversold flight" never reads "an oversold The airline flight".
  const HOOKS = {
    bumped: [
      (n, amt) => `Bumped from an oversold ${n.adj}flight? The federal bumping rule says that's ${amt ? amt + ' in cash' : 'cash'} — a voucher only if you choose one. Most people take the voucher and never check. ✈️`,
      (n, amt) => `If you're forced off an oversold flight leaving a U.S. airport, the airline owes you cash under 14 CFR 250.5${amt ? ` — for this ${n.adj}flight, ${amt}` : ''}. Worth knowing before you fly. ✈️`,
    ],
    cancelled: [
      (n) => `If your flight is canceled and you don't take the rebooking, you're owed a cash refund to your card — not a travel credit, even if that's all they offer. ${n.start} canceled mine; here's the rule. 💸`,
      (n) => `Canceled flight, and you chose not to fly? Federal rule 14 CFR Part 260 requires a refund to your original payment, not a voucher. Checking what ${n.mid} owes me. 💸`,
    ],
    schedule: [
      (n) => `${n.start} changed my flight by hours. Under 14 CFR 260, a change that big means a full refund if you decline it — even on a nonrefundable fare. Most people just accept the new time. ✈️`,
    ],
    bag_late: [
      (n) => `If your checked bag shows up late and you filed a report, the bag fee is refundable under federal rules. Asking ${n.mid} for mine — most people never do. 🧳`,
    ],
    bag_lost: [
      (n, _amt, cap) => `If an airline loses your bag, it has to cover what you can prove was inside${cap ? ` — up to ${cap}` : ''}. ${n.start} lost mine. Here's how the limit works. 🧳`,
    ],
    downgrade: [
      (n) => `Downgraded to a lower cabin and refused to fly it? Under 14 CFR 260 that's a full refund of the fare. Asking ${n.mid} for mine. ✈️`,
    ],
    extra: [
      (n) => `Paid ${n.mid} for Wi-Fi or a seat you never got? That's refundable under federal rules. Most people never ask — here's how. 💸`,
    ],
  };
  // The hook follows the featured entitlement, not just the incident type (a missing bag can surface as a lost-bag claim).
  function hookKey(e, a) {
    const t = String(e.title || '');
    if (/lost|damaged/i.test(t)) return 'bag_lost';
    if (/bag fee/i.test(t)) return 'bag_late';
    if (/forced off/i.test(t)) return 'bumped';
    if (/unused service/i.test(t)) return 'extra';
    return a && a.type;
  }

  function caption(res, a, d, variant) {
    const e = featured(res);
    if (!e) return '';
    const al = airlineName(d);
    const named = al !== 'The airline';
    const n = { start: al, mid: named ? al : 'the airline', adj: named ? al + ' ' : '' };
    const amt = pickAmount(res);
    const cap = (String(e.amountText || '').match(ANY_FIGURE) || [])[1] || '';
    const list = HOOKS[hookKey(e, a)] || [(x) => `Turns out there's a rule for this. Checking what ${x.mid} owes me — took about 2 minutes. 👇`];
    const hook = list[(variant || 0) % list.length](n, amt, cap);
    const slug = named ? '#' + al.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 'tok' : null;
    const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#passengerrights', '#travelhack', '#fyp', '#foryou', slug]
      .filter(Boolean)
      .join(' ');
    return `${hook}\n\nMost people never check what they're owed — took me about 2 minutes.\n\n${tags}`;
  }

  // ---- canvas card (1080x1920, TikTok/Reels vertical) ----
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = String(text).split(' ');
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = w;
        y += lh;
      } else {
        line = t;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lh;
    }
    return y;
  }

  function renderCard(res, a, d) {
    const c = cardCopy(res, a, d);
    if (!c) return null;
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0c1626');
    g.addColorStop(1, '#15243f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(0, 0, W, 18);

    const pad = 96;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 44px system-ui, Segoe UI, Roboto, sans-serif';
    ctx.fillText('WHAT MOST FLYERS NEVER CLAIM', pad, 190);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 86px system-ui, Segoe UI, Roboto, sans-serif';
    let y = wrapText(ctx, c.headline.toUpperCase(), pad, 320, W - 2 * pad, 100);

    ctx.fillStyle = '#9db4d6';
    ctx.font = '600 48px system-ui, Segoe UI, Roboto, sans-serif';
    y = wrapText(ctx, c.sub, pad, y + 44, W - 2 * pad, 62);

    // receipt panel
    const ry = y + 64;
    const rh = 600;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, pad - 16, ry, W - 2 * (pad - 16), rh, 30);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    roundRect(ctx, pad - 16, ry, W - 2 * (pad - 16), rh, 30);
    ctx.stroke();

    let ly = ry + 96;
    ctx.fillStyle = '#7fa9e0';
    ctx.font = '800 40px system-ui, sans-serif';
    ctx.fillText(c.panelLabel, pad + 36, ly);
    ctx.fillStyle = '#2bcf86';
    const long = c.big.length > 9;
    ctx.font = `800 ${long ? '120px' : '168px'} system-ui, sans-serif`;
    ctx.fillText(c.big, pad + 36, ly + (long ? 150 : 180));
    ly += long ? 250 : 290;
    ctx.fillStyle = '#7fa9e0';
    ctx.font = '800 40px system-ui, sans-serif';
    ctx.fillText('THE RULE', pad + 36, ly);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 52px system-ui, sans-serif';
    wrapText(ctx, c.rule, pad + 36, ly + 70, W - 2 * pad - 72, 62);

    // CTA
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 66px system-ui, sans-serif';
    wrapText(ctx, 'What does your airline owe you?', pad, H - 380, W - 2 * pad, 80);
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 56px system-ui, sans-serif';
    ctx.fillText('Check yours free — it’s your money. \u{1F447}', pad, H - 232);
    ctx.fillStyle = '#9db4d6';
    ctx.font = '700 42px system-ui, sans-serif';
    ctx.fillText('Fairfare · know your rights, get paid', pad, H - 150);

    return cv.toDataURL('image/png');
  }

  // ---- deadline receipt card: "X days left to claim $Y" ----
  // Shares the urgency, not outrage — the useful fact is that these windows close.
  function renderDeadlineCard(opts) {
    const { airline, label, daysLeft, amount, rule } = opts || {};
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0c1626');
    g.addColorStop(1, '#15243f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = daysLeft <= 7 ? '#ef5b6a' : '#1565c0';
    ctx.fillRect(0, 0, W, 18);

    const pad = 96;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 44px system-ui, Segoe UI, Roboto, sans-serif';
    ctx.fillText('THIS CLAIM WINDOW IS CLOSING', pad, 190);

    // big countdown
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 220px system-ui, sans-serif';
    const n = daysLeft <= 0 ? 'TODAY' : String(daysLeft);
    ctx.font = `800 ${n.length > 3 ? 130 : 220}px system-ui, sans-serif`;
    ctx.fillText(n, pad, 430);
    if (daysLeft > 0) {
      ctx.fillStyle = '#9db4d6';
      ctx.font = '800 62px system-ui, sans-serif';
      ctx.fillText(daysLeft === 1 ? 'day left' : 'days left', pad, 510);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 60px system-ui, sans-serif';
    let y = wrapText(ctx, label || 'to file this claim', pad, 610, W - 2 * pad, 74);

    if (amount) {
      const ry = y + 50;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, pad - 16, ry, W - 2 * (pad - 16), 300, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      roundRect(ctx, pad - 16, ry, W - 2 * (pad - 16), 300, 30);
      ctx.stroke();
      ctx.fillStyle = '#7fa9e0';
      ctx.font = '800 40px system-ui, sans-serif';
      ctx.fillText('WHAT’S ON THE LINE', pad + 36, ry + 80);
      ctx.fillStyle = '#2bcf86';
      ctx.font = `800 ${String(amount).length > 9 ? 110 : 150}px system-ui, sans-serif`;
      ctx.fillText(String(amount), pad + 36, ry + 210);
      y = ry + 300;
    }

    if (rule) {
      ctx.fillStyle = '#9db4d6';
      ctx.font = '600 42px system-ui, sans-serif';
      wrapText(ctx, rule, pad, y + 80, W - 2 * pad, 54);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 62px system-ui, sans-serif';
    wrapText(ctx, airline ? `Had a problem with ${airline}?` : 'Had a flight go wrong?', pad, H - 360, W - 2 * pad, 76);
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 54px system-ui, sans-serif';
    ctx.fillText('Check your deadlines free. \u{1F447}', pad, H - 230);
    ctx.fillStyle = '#9db4d6';
    ctx.font = '700 42px system-ui, sans-serif';
    ctx.fillText('Fairfare · know your rights, get paid', pad, H - 150);

    return cv.toDataURL('image/png');
  }

  function deadlineCaption(opts) {
    const { label, daysLeft, amount, airline } = opts || {};
    const when = daysLeft <= 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
    const money = amount ? ` worth ${amount}` : '';
    const who = airline ? ` with ${airline}` : '';
    const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#passengerrights', '#travelhack', '#fyp', '#foryou'].join(' ');
    return `Most people don’t know airline claims have a deadline. Mine${who}${money} closes ${when} — ${label || 'and then it’s gone for good'}.\n\nIf a flight went wrong for you in the last year, it’s worth checking before your window closes.\n\n${tags}`;
  }


  // The airline scorecard as a 9:16 card: one metric, every airline ranked, the government's own
  // numbers. Fact-led on purpose \u2014 the ranking is the whole message.
  // opts: { rows:[{name, value}], industry, period, lowerBetter, unitLabel, title, pct }
  function renderScorecardCard(opts) {
    const { rows = [], industry = null, period = '', lowerBetter = true, unitLabel = '', title = '', pct = false } = opts || {};
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0c1626');
    g.addColorStop(1, '#15243f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(0, 0, W, 18);

    const pad = 96;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 40px system-ui, Segoe UI, Roboto, sans-serif';
    ctx.fillText('THE GOVERNMENT\u2019S OWN NUMBERS', pad, 170);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 72px system-ui, sans-serif';
    let y = wrapText(ctx, title || 'How the airlines compare', pad, 270, W - 2 * pad, 84);
    ctx.fillStyle = '#9db4d6';
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.fillText(`${unitLabel}${period ? ' \u00b7 ' + period : ''}`, pad, y + 30);

    const list = rows.filter((r) => r.value != null).slice().sort((a, b) => (lowerBetter ? b.value - a.value : a.value - b.value));
    const max = Math.max(...list.map((r) => r.value), industry || 0) || 1;
    const top = y + 110;
    const rowH = Math.min(120, Math.floor((H - 520 - top) / Math.max(1, list.length + 1)));
    const barX = pad + 330, barW = W - pad - barX - 200;
    const fmt = (v) => (pct ? `${Number(v).toFixed(1)}%` : Number(v).toFixed(2));
    list.forEach((r, i) => {
      const yy = top + i * rowH;
      const worst = i === 0, best = i === list.length - 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${rowH > 100 ? 42 : 36}px system-ui, sans-serif`;
      const nm = String(r.name).replace(/ (Air Lines|Airlines|Airways|Air)$/i, '');
      ctx.fillText(nm, pad, yy + rowH * 0.62);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, barX, yy + rowH * 0.22, barW, rowH * 0.5, 14); ctx.fill();
      ctx.fillStyle = worst ? '#ef5b6a' : best ? '#2bcf86' : '#7fa9e0';
      roundRect(ctx, barX, yy + rowH * 0.22, Math.max(14, barW * (r.value / max)), rowH * 0.5, 14); ctx.fill();
      ctx.fillStyle = worst ? '#ef5b6a' : best ? '#2bcf86' : '#ffffff';
      ctx.font = `800 ${rowH > 100 ? 42 : 36}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(fmt(r.value), W - pad, yy + rowH * 0.62);
      ctx.textAlign = 'left';
    });
    if (industry != null) {
      const yy = top + list.length * rowH + 20;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([12, 12]);
      ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(W - pad, yy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#9db4d6';
      ctx.font = '600 36px system-ui, sans-serif';
      ctx.fillText(`All airlines: ${fmt(industry)}`, pad, yy + 52);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 54px system-ui, sans-serif';
    wrapText(ctx, 'Source: U.S. DOT Air Travel Consumer Report.', pad, H - 330, W - 2 * pad, 66);
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 48px system-ui, sans-serif';
    ctx.fillText('Check any airline free before you book. \U0001F447', pad, H - 220);
    ctx.fillStyle = '#9db4d6';
    ctx.font = '700 42px system-ui, sans-serif';
    ctx.fillText('Fairfare \u00b7 know your rights, get paid', pad, H - 150);
    return cv.toDataURL('image/png');
  }

  function scorecardCaption(opts) {
    const { rows = [], title = '', period = '', lowerBetter = true, unitLabel = '', pct = false } = opts || {};
    const list = rows.filter((r) => r.value != null).slice().sort((a, b) => (lowerBetter ? b.value - a.value : a.value - b.value));
    if (!list.length) return '';
    const fmt = (v) => (pct ? `${Number(v).toFixed(1)}%` : Number(v).toFixed(2));
    const worst = list[0], best = list[list.length - 1];
    const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#travelhack', '#fyp', '#foryou'].join(' ');
    return `${title}${period ? ` (${period})` : ''}, straight from the U.S. DOT\u2019s own report: ${worst.name} ${fmt(worst.value)} vs ${best.name} ${fmt(best.value)} ${unitLabel}. Same period, same source, every airline.\n\nWorth a look before you book.\n\n${tags}`;
  }

  return { caption, renderCard, pickAmount, shareable, cardCopy, renderDeadlineCard, deadlineCaption, renderScorecardCard, scorecardCaption };
})();
