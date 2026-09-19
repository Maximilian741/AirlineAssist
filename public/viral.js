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
  const EXACT = /^\s*((?:\$|€\s?|£\s?|CAD\s?)\d+(?:,\d{3})*(?:\.\d{2})?)(?![\d.]|,\d|\s*\/)/;
  const ANY_FIGURE = /(\$[\d,]+(?:\.\d{2})?|€\s?[\d,]+(?:\.\d{2})?|£\s?[\d,]+(?:\.\d{2})?|[\d,]+ SDR)/;
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
    const amountText = String(e.amountText || '');
    // A bag-liability entitlement is a CEILING on a provable loss — recognised by that text, not by words in
    // the title, so the Montreal (international) version takes this path too.
    if (/provable loss/i.test(amountText)) {
      const cap = (amountText.match(ANY_FIGURE) || [])[1] || '';
      return {
        headline: `${al} has to cover my lost bag.`,
        sub: cap ? `For what I can prove was inside, up to ${cap}.` : 'For what I can prove was inside.',
        panelLabel: 'COVERED UP TO',
        big: cap || 'MY PROVEN LOSS',
        rule,
      };
    }
    const amount = pickAmount(res);
    // "400% of your one-way fare, up to $2,150" is a percentage with a ceiling: never one without the other.
    const pct = amountText.match(/^(\d+)% of /);
    const cap = (amountText.match(/up to (\$[\d,]+(?:\.\d{2})?)/) || [])[1] || '';
    const named = /full cash refund/i.test(title) ? 'a full refund'
      : /fare difference/i.test(title) ? 'the fare difference'
        : /bag fee/i.test(title) ? 'my bag fee back'
          : /refund/i.test(title) ? 'a refund' : '';
    const pctPhrase = pct ? `${pct[1]}% of my fare${cap ? `, capped at ${cap}` : ''}` : '';
    const phrase = amount || named || pctPhrase;
    return {
      headline: phrase ? `${al} owes me ${phrase}.` : `${al} owes me — here’s the rule.`,
      sub: e.condition ? `Conditions apply: ${e.condition}.` : 'Most people never ask for it.',
      panelLabel: 'THEY OWE ME',
      // Set as written: the small-caps label above it is the shout, the figure itself is just set well.
      big: amount || named || (pct ? `${pct[1]}% of my fare` : '') || 'See the rule',
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
      (n, _amt, _cap, a) => a && a.schedDelta === 'route'
        ? `${n.start} added a connection (or moved my airport) after I booked. Under 14 CFR 260 that’s a significant change — a full refund if you decline it, even on a nonrefundable fare. Most people just accept the new itinerary. ✈️`
        : `${n.start} changed my flight by hours. Under 14 CFR 260, a change that big means a full refund if you decline it — even on a nonrefundable fare. Most people just accept the new time. ✈️`,
    ],
    downgrade_flew: [
      (n) => `Downgraded to a cheaper cabin and flew it anyway? DOT still requires the airline to refund the fare difference — most people never ask. Asking ${n.mid} for mine. ✈️`,
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
    if (/provable loss/i.test(String(e.amountText || ''))) return 'bag_lost';
    if (/fare difference/i.test(t)) return 'downgrade_flew';
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
    const hook = list[(variant || 0) % list.length](n, amt, cap, a);
    const slug = named ? '#' + al.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 'tok' : null;
    const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#passengerrights', '#travelhack', '#fyp', '#foryou', slug]
      .filter(Boolean)
      .join(' ');
    return `${hook}\n\nMost people never check what they're owed — took me about 2 minutes.\n\n${tags}`;
  }

  // ---- the card, drawn the way the app is set: warm paper, ink, one accent, hairlines, no shadows ----
  const INK = '#1c2733';
  const PAPER = '#f7f4ee';
  const MUTED = '#5c6670';
  const RULE = '#cfc7b6';
  const NAVY = '#16324a';
  const OXBLOOD = '#b03a2e';
  const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
  const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

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
  /** Wrap, but never past `maxLines` — the last line gets an ellipsis. Returns the y after the block. */
  function wrapClamp(ctx, text, x, y, maxW, lh, maxLines) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines && shown.length) {
      let last = shown[shown.length - 1];
      while (last && ctx.measureText(last + ' …').width > maxW) last = last.replace(/\s*\S+$/, '');
      shown[shown.length - 1] = last + ' …';
    }
    shown.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
    return y + shown.length * lh;
  }
  /** Small-caps label with real letter-spacing (canvas has none), drawn a character at a time. */
  function tracked(ctx, text, x, y, spacing) {
    let cx = x;
    for (const ch of String(text)) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacing;
    }
    return cx;
  }
  function hairline(ctx, x1, y, x2, dashed) {
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [10, 12] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  /** The masthead every card carries: the monogram tile and the wordmark, as on the site. */
  function masthead(ctx, pad, y) {
    ctx.fillStyle = NAVY;
    roundRect(ctx, pad, y, 84, 84, 6);
    ctx.fill();
    ctx.fillStyle = '#fdfbf5';
    ctx.font = `italic 700 52px ${SERIF}`;
    ctx.fillText('F', pad + 27, y + 60);
    ctx.fillStyle = INK;
    ctx.font = `700 54px ${SERIF}`;
    ctx.fillText('Fairfare', pad + 108, y + 60);
    return y + 84;
  }
  function newCard() {
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = NAVY; // the spine: one deliberate mark of colour
    ctx.fillRect(0, 0, 10, H);
    ctx.textAlign = 'left';
    return { cv, ctx, W, H };
  }
  /** The closing block: rule, the question, and where to answer it. */
  function cardFooter(ctx, W, H, pad) {
    hairline(ctx, pad, H - 300, W - pad);
    ctx.fillStyle = INK;
    ctx.font = `700 58px ${SERIF}`;
    ctx.fillText('What does your airline owe you?', pad, H - 220);
    ctx.fillStyle = OXBLOOD;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText('Check yours free  →', pad, H - 152);
    ctx.fillStyle = MUTED;
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText('Fairfare · know your rights, get paid', pad, H - 90);
  }

  function renderCard(res, a, d) {
    const c = cardCopy(res, a, d);
    if (!c) return null;
    const { cv, ctx, W, H } = newCard();
    const pad = 96;
    const inner = W - 2 * pad;

    masthead(ctx, pad, 120);
    hairline(ctx, pad, 260, W - pad);

    ctx.fillStyle = OXBLOOD;
    ctx.font = `700 32px ${SANS}`;
    tracked(ctx, 'WHAT MOST FLYERS NEVER CLAIM', pad, 336, 3);

    ctx.fillStyle = INK;
    ctx.font = `700 88px ${SERIF}`;
    const afterHead = wrapClamp(ctx, c.headline, pad, 456, inner, 104, 3);

    ctx.fillStyle = MUTED;
    ctx.font = `400 40px ${SANS}`;
    wrapClamp(ctx, c.sub, pad, afterHead + 46, inner, 54, 2);

    // The stub is anchored, so every card tears off in the same place however long the headline ran.
    const top = 1060;
    hairline(ctx, pad, top, W - pad, true);
    ctx.fillStyle = MUTED;
    ctx.font = `700 30px ${SANS}`;
    tracked(ctx, c.panelLabel, pad, top + 72, 3);
    ctx.fillStyle = INK;
    const big = c.big.length > 12 ? 92 : c.big.length > 8 ? 116 : 148;
    ctx.font = `700 ${big}px ${SERIF}`;
    wrapClamp(ctx, c.big, pad, top + 90 + big, inner, big + 10, 2);
    ctx.fillStyle = MUTED;
    ctx.font = `700 30px ${SANS}`;
    tracked(ctx, 'THE RULE', pad, top + 340, 3);
    ctx.fillStyle = INK;
    ctx.font = `400 44px ${SERIF}`;
    wrapClamp(ctx, c.rule, pad, top + 404, inner, 54, 2);
    hairline(ctx, pad, top + 470, W - pad, true);

    cardFooter(ctx, W, H, pad);
    return cv.toDataURL('image/png');
  }

  // ---- deadline receipt card: "X days left to claim $Y" ----
  // Shares the urgency, not outrage — the useful fact is that these windows close.
  function renderDeadlineCard(opts) {
    const { airline, label, daysLeft, amount, rule } = opts || {};
    const { cv, ctx, W, H } = newCard();
    const pad = 96;

    let y = masthead(ctx, pad, 120) + 56;
    hairline(ctx, pad, y, W - pad);

    ctx.fillStyle = daysLeft <= 7 ? OXBLOOD : MUTED;
    ctx.font = `700 32px ${SANS}`;
    tracked(ctx, 'THIS CLAIM WINDOW IS CLOSING', pad, y + 76, 3);

    // the countdown, set as a figure rather than a scoreboard
    const n = daysLeft <= 0 ? 'TODAY' : String(daysLeft);
    ctx.fillStyle = daysLeft <= 7 ? OXBLOOD : INK;
    ctx.font = `700 ${n.length > 3 ? 150 : 230}px ${SERIF}`;
    ctx.fillText(n, pad, y + 320);
    if (daysLeft > 0) {
      ctx.fillStyle = MUTED;
      ctx.font = `400 54px ${SERIF}`;
      ctx.fillText(daysLeft === 1 ? 'day left' : 'days left', pad + ctx.measureText(n).width + 0, y + 320);
    }

    ctx.fillStyle = INK;
    ctx.font = `700 56px ${SERIF}`;
    y = wrapText(ctx, label || 'to file this claim', pad, y + 420, W - 2 * pad, 70);

    if (amount) {
      const top = y + 50;
      hairline(ctx, pad, top, W - pad, true);
      ctx.fillStyle = MUTED;
      ctx.font = `700 30px ${SANS}`;
      tracked(ctx, 'WHAT’S ON THE LINE', pad, top + 74, 3);
      ctx.fillStyle = INK;
      const big = String(amount).length > 12 ? 84 : 120;
      ctx.font = `700 ${big}px ${SERIF}`;
      y = wrapText(ctx, String(amount), pad, top + 74 + big + 20, W - 2 * pad, big + 12);
      hairline(ctx, pad, y + 36, W - pad, true);
      y += 36;
    }

    if (rule) {
      ctx.fillStyle = MUTED;
      ctx.font = `400 38px ${SANS}`;
      wrapText(ctx, rule, pad, y + 74, W - 2 * pad, 50);
    }

    hairline(ctx, pad, H - 300, W - pad);
    ctx.fillStyle = INK;
    ctx.font = `700 58px ${SERIF}`;
    ctx.fillText(airline ? `Had a problem with ${airline}?` : 'Had a flight go wrong?', pad, H - 220);
    ctx.fillStyle = OXBLOOD;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText('Check your deadlines free  →', pad, H - 152);
    ctx.fillStyle = MUTED;
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText('Fairfare · know your rights, get paid', pad, H - 90);
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
    const { cv, ctx, W, H } = newCard();
    const pad = 96;

    let y = masthead(ctx, pad, 120) + 56;
    hairline(ctx, pad, y, W - pad);
    ctx.fillStyle = MUTED;
    ctx.font = `700 32px ${SANS}`;
    tracked(ctx, 'THE GOVERNMENT’S OWN NUMBERS', pad, y + 76, 3);
    ctx.fillStyle = INK;
    ctx.font = `700 68px ${SERIF}`;
    y = wrapText(ctx, title || 'How the airlines compare', pad, y + 170, W - 2 * pad, 80);
    ctx.fillStyle = MUTED;
    ctx.font = `400 36px ${SANS}`;
    ctx.fillText(`${unitLabel}${period ? ' · ' + period : ''}`, pad, y + 26);

    // A ranked table, hairline-ruled: the ranking is the message, so let the figures carry it.
    const list = rows.filter((r) => r.value != null).slice().sort((a, b) => (lowerBetter ? b.value - a.value : a.value - b.value));
    const max = Math.max(...list.map((r) => r.value), industry || 0) || 1;
    const top = y + 96;
    const rowH = Math.min(116, Math.floor((H - 520 - top) / Math.max(1, list.length + 1)));
    const barX = pad + 330, barW = W - pad - barX - 210;
    const fmt = (v) => (pct ? `${Number(v).toFixed(1)}%` : Number(v).toFixed(2));
    hairline(ctx, pad, top - 20, W - pad);
    list.forEach((r, i) => {
      const yy = top + i * rowH;
      const worst = i === 0, best = i === list.length - 1;
      ctx.fillStyle = INK;
      ctx.font = `${worst || best ? 700 : 400} ${rowH > 100 ? 40 : 34}px ${SERIF}`;
      ctx.fillText(String(r.name).replace(/ (Air Lines|Airlines|Airways|Air)$/i, ''), pad, yy + rowH * 0.62);
      // the bar is a rule, not a candy stripe
      ctx.fillStyle = worst ? OXBLOOD : best ? NAVY : '#9aa3ab';
      ctx.fillRect(barX, yy + rowH * 0.42, Math.max(10, barW * (r.value / max)), 10);
      ctx.fillStyle = INK;
      ctx.font = `700 ${rowH > 100 ? 40 : 34}px ${SANS}`;
      ctx.textAlign = 'right';
      ctx.fillText(fmt(r.value), W - pad, yy + rowH * 0.62);
      ctx.textAlign = 'left';
      hairline(ctx, pad, yy + rowH - 8, W - pad);
    });
    if (industry != null) {
      const yy = top + list.length * rowH + 16;
      ctx.fillStyle = MUTED;
      ctx.font = `400 34px ${SANS}`;
      ctx.fillText(`All airlines: ${fmt(industry)}`, pad, yy + 40);
    }

    hairline(ctx, pad, H - 300, W - pad);
    ctx.fillStyle = INK;
    ctx.font = `700 50px ${SERIF}`;
    wrapText(ctx, 'Source: U.S. DOT Air Travel Consumer Report.', pad, H - 220, W - 2 * pad, 60);
    ctx.fillStyle = OXBLOOD;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText('Check any airline free before you book  →', pad, H - 152);
    ctx.fillStyle = MUTED;
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText('Fairfare · know your rights, get paid', pad, H - 90);
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
