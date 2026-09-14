// viral.js — turns a claim result into a shareable TikTok post:
// a 9:16 "the airline owes me $X" receipt card (PNG via canvas) + a fact-led caption with hashtags.
// Pure client-side, no backend. window.Viral.{ caption, renderCard }.

window.Viral = (function () {
  'use strict';

  // Pull a single headline dollar/€/£ figure from the strongest entitlement, if any.
  function pickAmount(res) {
    const cash = (e) => e && /\$|€|£|CAD/.test(e.amountText || '');
    const e =
      res.entitlements.find((x) => x.strength === 'strong' && cash(x)) ||
      res.entitlements.find((x) => x.strength === 'conditional' && cash(x));
    if (!e) return null;
    const m = (e.amountText || '').match(/(\$[\d,]+|€\s?\d[\d,]*|£\s?\d[\d,]*|CAD\s?[\d,]+)/);
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
  }
  function topRule(res) {
    const e = res.entitlements.find((x) => x.rule && x.rule !== '—');
    return e ? e.rule : 'federal law';
  }
  function airlineName(d) {
    const n = (d && d.airline ? String(d.airline) : '').trim();
    return n || 'The airline';
  }

  const HOOKS = {
    bumped: [
      (al, amt) => `Got bumped from an oversold ${al} flight? They offered me a voucher — but federal law says I'm owed ${amt} in cash. Most people take the voucher and never find out. ✈️`,
      (al, amt) => `If you're bumped from an oversold flight, the airline owes you cash — not a meal voucher. ${al} owed me ${amt} under federal bumping rules. Worth knowing before you fly. ✈️`,
      (al, amt) => `Offered a small voucher after a bump, when the legal amount was ${amt}. The federal rule sets the cash you're owed — here's how I checked mine. 👇`,
    ],
    cancelled: [
      (al) => `If your flight is canceled, you can take a cash refund instead of a travel credit — even if they only offer the credit. ${al} canceled mine; I got my money back. Most people don't know they can. 💸`,
      (al) => `When a flight is canceled, federal rule 14 CFR Part 260 lets you request a cash refund to your original card instead of a credit. That's how I got mine back from ${al}. 💸`,
      (al) => `After a cancellation you're entitled to a full cash refund, not just a voucher. ${al} canceled on me and I got the refund. Here's the rule and how to claim it. 👇`,
    ],
    delayed: [
      (al) => `Delayed for hours? Depending on the cause, the airline may owe you meals, a hotel, and rebooking. Here's what the rules actually require — most people never ask. ✈️`,
      (al) => `Delayed by ${al} for hours? Meals, a hotel, and rebooking may be on the airline. Here's the rule that says so, and how to ask. 👇`,
    ],
    bag_late: [
      (al) => `If your checked bag shows up late, federal rules let you get your bag fee refunded. ${al} owed me mine. Most people never request it. 🧳`,
      (al) => `If your checked bag arrives late, federal law says the bag fee gets refunded. ${al} owed me mine — here's how to claim it. 🧳`,
    ],
    bag_lost: [
      (al, amt) => `If an airline loses your bag, compensation is capped at ${amt} by law — and you can claim up to that for what was inside. ${al} lost mine. Here's how the limit works. 🧳`,
    ],
    downgrade: [
      (al) => `Downgraded to a cheaper seat than you paid for? You're owed the fare difference back, by law. ${al} downgraded me — most people never claim the refund. ✈️`,
    ],
    extra: [
      (al) => `Paid ${al} for Wi-Fi or a seat you never got to use? That's a refund under federal law. Most people never ask — here's how. 💸`,
    ],
  };

  function caption(res, a, d, variant) {
    const al = airlineName(d);
    const amtRaw = pickAmount(res);
    const amt = amtRaw || 'real money';
    const list = HOOKS[a.type] || [(x, m) => `Turns out ${x} owes ${m} here under the rules — something most travelers never check. Found out in a couple of minutes. 👇`];
    const hook = list[(variant || 0) % list.length](al, amt);
    const slug = al !== 'The airline' ? '#' + al.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 'tok' : null;
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
    const al = airlineName(d);
    const amt = pickAmount(res);
    const rule = topRule(res);
    const fullRefund = !amt && ['cancelled', 'extra', 'downgrade'].includes(a.type);
    const amtBig = amt || (fullRefund ? 'A FULL REFUND' : 'CASH');

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3a93c';
    ctx.font = '800 44px system-ui, Segoe UI, Roboto, sans-serif';
    ctx.fillText('WHAT MOST FLYERS NEVER CLAIM', pad, 190);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 86px system-ui, Segoe UI, Roboto, sans-serif';
    const headline = amt ? `${al} owes me ${amt}.` : `${al} owes me — and most people never claim it.`;
    let y = wrapText(ctx, headline.toUpperCase(), pad, 320, W - 2 * pad, 100);

    ctx.fillStyle = '#9db4d6';
    ctx.font = '600 48px system-ui, Segoe UI, Roboto, sans-serif';
    y = wrapText(ctx, 'They offered a voucher — but the law says cash.', pad, y + 44, W - 2 * pad, 62);

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
    ctx.fillText('THEY OWE ME', pad + 36, ly);
    ctx.fillStyle = '#2bcf86';
    const big = amtBig.length > 9 ? '120px' : '168px';
    ctx.font = `800 ${big} system-ui, sans-serif`;
    ctx.fillText(amtBig, pad + 36, ly + (amtBig.length > 9 ? 150 : 180));
    ly += amtBig.length > 9 ? 250 : 290;
    ctx.fillStyle = '#7fa9e0';
    ctx.font = '800 40px system-ui, sans-serif';
    ctx.fillText('THE LAW THAT SAYS SO', pad + 36, ly);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 52px system-ui, sans-serif';
    wrapText(ctx, rule, pad + 36, ly + 70, W - 2 * pad - 72, 62);

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

  return { caption, renderCard, pickAmount, renderDeadlineCard, deadlineCaption, renderScorecardCard, scorecardCaption };
})();
