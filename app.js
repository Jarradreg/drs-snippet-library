/* ============================================================
   Event Assister
   - Create an event, add participants, export a Discord-ready list.
   - Every participant field is optional.
   - Two switches decide the shape of the output:
       Pings                 print <@DiscordID> instead of the username
       Placement over points print Placement instead of Points
   - Events live in the browser so you can come back to them.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'event-assister.v1';

  /* ── hero background video ─────────────────────────────────────
     Drop your own links into `sources` — mp4, webm or both, in
     preference order. The browser takes the first one it can play.
     Clear the array to fall back to the parchment canvas alone.    */
  var BACKDROP = {
    sources: [
      'https://cdn.pixabay.com/video/2022/09/20/131973-751915246_large.mp4'
    ]
  };

  /* Every participant detail. All of them are optional. */
  var FIELDS = [
    { key: 'discordId', label: 'Discord ID' },
    { key: 'discordName', label: 'Discord Username' },
    { key: 'robloxName', label: 'Roblox Username' },
    { key: 'placement', label: 'Placement' },
    { key: 'points', label: 'Points' }
  ];

  var ICON = {
    'Discord ID': '<path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16"/>',
    'Discord Username': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    'Roblox Username': '<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>',
    Placement: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5.5a2.5 2.5 0 0 0 2.5 5M16 5h2.5a2.5 2.5 0 0 1-2.5 5"/><path d="M12 13v4M9 20h6"/>',
    Points: '<path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"/>',
    Pings: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    Create: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4M12 13v4M10 15h4"/>',
    Add: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    Export: '<path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 19h14"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"' +
      ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (ICON[name] || '') + '</svg>';
  }

  /* ── state ─────────────────────────────────────────────── */

  var state = {
    events: [],
    activeId: null,
    copied: null
  };

  var el = {
    nav: document.getElementById('nav'),
    eventSelect: document.getElementById('eventSelect'),
    eventName: document.getElementById('eventName'),
    eventNew: document.getElementById('eventNew'),
    eventDelete: document.getElementById('eventDelete'),
    optPings: document.getElementById('optPings'),
    optPlacement: document.getElementById('optPlacement'),
    addBtn: document.getElementById('addBtn'),
    phead: document.getElementById('phead'),
    participants: document.getElementById('participants'),
    partCount: document.getElementById('partCount'),
    output: document.getElementById('output'),
    copy: document.getElementById('copy'),
    copyLabel: document.getElementById('copyLabel'),
    copyIco: document.getElementById('copyIco'),
    copyNote: document.getElementById('copyNote'),
    copiedPill: document.getElementById('copiedPill'),
    exportBtn: document.getElementById('exportBtn'),
    fieldStrip: document.getElementById('fieldStrip'),
    homeCards: document.getElementById('homeCards'),
    matrix: document.getElementById('matrix'),
    hero: document.querySelector('.hero'),
    heroVideo: document.getElementById('backdropVideo'),
    leave: document.getElementById('leave'),
    leaveGo: document.getElementById('leaveGo')
  };

  var FIELD_INPUTS = {};
  FIELDS.forEach(function (f) {
    var node = document.getElementById('f-' + f.key);
    if (node) FIELD_INPUTS[f.key] = node;
  });

  /* The builder only exists on events.html. Everything app-shaped is
     skipped on the landing and styling-guide pages. */
  var HAS_APP = !!(el.eventSelect && el.participants && el.output && el.copy && el.addBtn);

  /* ── escaping ──────────────────────────────────────────── */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── the event model ───────────────────────────────────── */

  var seq = 0;

  function uid(prefix) {
    seq += 1;
    return (prefix || 'x') + Date.now().toString(36) + seq.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function newEvent(name) {
    return {
      id: uid('ev'),
      name: name || 'Untitled event',
      pings: false,
      placementFirst: false,
      participants: []
    };
  }

  function normalisePart(p) {
    var out = { id: (p && p.id) || uid('p') };
    FIELDS.forEach(function (f) {
      out[f.key] = p && typeof p[f.key] === 'string' ? p[f.key] : '';
    });
    return out;
  }

  function normaliseEvent(e) {
    return {
      id: (e && e.id) || uid('ev'),
      name: e && typeof e.name === 'string' && e.name ? e.name : 'Untitled event',
      pings: !!(e && e.pings),
      placementFirst: !!(e && e.placementFirst),
      participants: e && Array.isArray(e.participants) ? e.participants.map(normalisePart) : []
    };
  }

  function byEventId(id) {
    for (var i = 0; i < state.events.length; i++) {
      if (state.events[i].id === id) return state.events[i];
    }
    return null;
  }

  function activeEvent() {
    return byEventId(state.activeId) || state.events[0] || null;
  }

  /* ── storage ───────────────────────────────────────────── */

  function storage() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) {}
    return null;
  }

  function saveStore() {
    var store = storage();
    if (!store) return;
    try {
      store.setItem(STORE_KEY, JSON.stringify({ events: state.events, activeId: state.activeId }));
    } catch (e) {}
  }

  function loadStore() {
    var store = storage();
    var data = null;
    if (store) {
      try {
        var raw = store.getItem(STORE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) { data = null; }
    }

    if (data && Array.isArray(data.events) && data.events.length) {
      state.events = data.events.map(normaliseEvent);
      state.activeId = byEventId(data.activeId) ? data.activeId : state.events[0].id;
      return;
    }

    var first = newEvent('Untitled event');
    state.events = [first];
    state.activeId = first.id;
  }

  /* ── the output engine ──────────────────────────────────────
     This is the whole point of the tool, so it is deliberately
     small and explicit:

       Pings on            -> <@DiscordID>
       Pings off           -> Discord Username
       Placement over pts  -> Placement
       otherwise           -> Points

     Whatever is chosen leads; the other one fills in if the chosen
     one is blank, so a participant never comes out empty-handed.  */

  function numOrNull(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).trim();
    if (s === '') return null;
    var n = Number(s);
    return isNaN(n) ? null : n;
  }

  /* Which column leads, given the switches. */
  function leadingField(ev) {
    return ev.placementFirst ? 'placement' : 'points';
  }

  function valueFor(p, ev) {
    var lead = leadingField(ev);
    var other = lead === 'points' ? 'placement' : 'points';
    if (p[lead] !== '') return p[lead];
    if (p[other] !== '') return p[other];
    return '';
  }

  /* Who the line is about: a ping when asked for and possible,
     otherwise the Discord username, then Roblox, then the raw ID. */
  function labelFor(p, ev) {
    if (ev.pings && p.discordId !== '') {
      return {
        ping: true,
        copy: '<@' + p.discordId + '>',
        html: '<span class="d-mention">@' + esc(p.discordId) + '</span>'
      };
    }
    if (p.discordName !== '') {
      return { ping: false, copy: p.discordName, html: esc(p.discordName) };
    }
    if (p.robloxName !== '') {
      return { ping: false, copy: p.robloxName, html: esc(p.robloxName) };
    }
    if (p.discordId !== '') {
      return { ping: false, copy: p.discordId, html: esc(p.discordId) };
    }
    return { ping: false, copy: '', html: '' };
  }

  function lineFor(p, ev) {
    var label = labelFor(p, ev);
    return {
      ping: label.ping,
      copy: label.copy,
      html: label.html,
      value: valueFor(p, ev)
    };
  }

  /* Blank label AND blank value means there is genuinely nothing to
     print, so the line is dropped rather than printed as a stray dash. */
  function isPrintable(line) {
    return line.copy !== '' || line.value !== '';
  }

  function lineText(line) {
    if (line.copy === '') return line.value;
    if (line.value === '') return line.copy;
    return line.copy + ' - ' + line.value;
  }

  /* Placement reads best lowest-first (1st, 2nd, 3rd).
     Points read best highest-first. Anyone missing the leading
     number sorts to the bottom instead of jumping the queue. */
  function sortedParticipants(ev) {
    var list = ev.participants.slice();
    var key = leadingField(ev);

    list.sort(function (a, b) {
      var an = numOrNull(a[key]);
      var bn = numOrNull(b[key]);
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return key === 'placement' ? an - bn : bn - an;
    });

    return list;
  }

  function outputLines(ev) {
    if (!ev) return [];
    return sortedParticipants(ev).map(function (p) {
      return lineFor(p, ev);
    }).filter(isPrintable);
  }

  function outputText(ev) {
    return outputLines(ev).map(lineText).join('\n');
  }

  /* ── rendering: the builder ────────────────────────────── */

  function renderEventSelect() {
    if (!el.eventSelect) return;
    el.eventSelect.innerHTML = state.events.map(function (e) {
      return '<option value="' + esc(e.id) + '"' +
        (e.id === state.activeId ? ' selected' : '') + '>' + esc(e.name) + '</option>';
    }).join('');
  }

  function renderEventControls() {
    var ev = activeEvent();
    if (!ev) return;
    if (el.eventName) el.eventName.value = ev.name;
    if (el.optPings) el.optPings.checked = ev.pings;
    if (el.optPlacement) el.optPlacement.checked = ev.placementFirst;
  }

  function rowHTML(f, p) {
    var v = p[f.key];
    return '<input class="pcell" type="text" data-k="' + esc(f.key) + '" value="' + esc(v) +
      '" placeholder="' + esc(f.label) + '" aria-label="' + esc(f.label) + '"' +
      ' data-label="' + esc(f.label) + '">';
  }

  function renderParticipants() {
    if (!el.participants) return;
    var ev = activeEvent();
    var list = ev ? ev.participants : [];

    if (el.partCount) {
      el.partCount.textContent = list.length ? String(list.length) : '';
      el.partCount.hidden = !list.length;
    }
    if (el.phead) el.phead.hidden = !list.length;

    if (!list.length) {
      el.participants.innerHTML =
        '<div class="empty">' +
          '<p class="empty-title">No participants yet</p>' +
          '<p class="empty-sub">Fill in any of the fields above and press Add. Every field is optional.</p>' +
        '</div>';
      return;
    }

    el.participants.innerHTML = list.map(function (p, i) {
      return '<div class="prow" data-id="' + esc(p.id) + '">' +
        '<span class="prow-n">' + (i + 1) + '</span>' +
        FIELDS.map(function (f) { return rowHTML(f, p); }).join('') +
        '<button class="prow-del" type="button" data-del="' + esc(p.id) + '"' +
          ' aria-label="Remove participant ' + (i + 1) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"' +
          ' stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>';
    }).join('');
  }

  function timeNow() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return 'Today at ' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  function renderOutput() {
    if (!el.output) return;
    var ev = activeEvent();
    var lines = outputLines(ev);

    if (!lines.length) {
      el.output.innerHTML =
        '<div class="empty">' +
          '<p class="empty-title">Nothing to export yet</p>' +
          '<p class="empty-sub">Add a participant and the list appears here, ready to copy.</p>' +
        '</div>';
      return;
    }

    el.output.innerHTML =
      '<div class="msg">' +
        '<div class="avatar" aria-hidden="true">EA</div>' +
        '<div class="msg-body">' +
          '<div class="msg-head">' +
            '<span class="msg-name">Event Assister</span>' +
            '<span class="msg-bot">APP</span>' +
            '<span class="msg-time">' + esc(timeNow()) + '</span>' +
          '</div>' +
          '<div class="msg-text">' +
            lines.map(function (l) {
              var html = l.html;
              if (l.value !== '') html += (html ? ' - ' : '') + esc(l.value);
              return html;
            }).join('<br>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function updateCopyNote() {
    if (!el.copyNote) return;
    var ev = activeEvent();
    var lines = outputLines(ev);
    if (el.copy) el.copy.disabled = !lines.length;
    if (el.exportBtn) el.exportBtn.disabled = !lines.length;

    el.copyNote.textContent = lines.length
      ? lines.length + (lines.length === 1 ? ' line' : ' lines') +
        ' — pings ' + (ev.pings ? 'on' : 'off') +
        ', ' + (ev.placementFirst ? 'placement' : 'points') + ' first.'
      : 'Add a participant to build the list.';
  }

  function renderAll() {
    renderEventSelect();
    renderEventControls();
    renderParticipants();
    renderOutput();
    updateCopyNote();
  }

  /* ── rendering: the landing page ───────────────────────── */

  function renderFieldStrip() {
    if (!el.fieldStrip) return;
    var names = FIELDS.map(function (f) { return f.label; }).concat(['Pings']);
    el.fieldStrip.innerHTML = names.map(function (n) {
      return '<div class="trust-cell">' + icon(n) + '<span>' + esc(n) + '</span></div>';
    }).join('');
  }

  var STEPS = [
    {
      i: 'Create',
      t: 'Create an event',
      d: 'Give it a name, then set two switches: whether to ping people, and whether placement or points leads the list.'
    },
    {
      i: 'Add',
      t: 'Add participants',
      d: 'Discord ID, Discord Username, Roblox Username, Placement, Points. Every single field is optional.'
    },
    {
      i: 'Export',
      t: 'Export the list',
      d: 'Copy it straight into Discord, or download it as a .txt file. It reorders itself as you switch.'
    }
  ];

  function renderHomeCards() {
    if (!el.homeCards) return;
    el.homeCards.innerHTML = STEPS.map(function (s, i) {
      return '<article class="card">' +
        '<span class="card-ico" aria-hidden="true">' + icon(s.i) + '</span>' +
        '<h3 class="card-title">' + esc(s.t) + '</h3>' +
        '<p class="card-preview">' + esc(s.d) + '</p>' +
        '<div class="card-foot"><span class="card-fields">Step ' + (i + 1) + '</span></div>' +
      '</article>';
    }).join('');
  }

  /* The four possible outputs, generated by the same code that makes
     the real list, so the explainer can never drift from the tool. */
  function renderMatrix() {
    if (!el.matrix) return;

    var sample = {
      discordId: '000000000000000000',
      discordName: 'username',
      robloxName: 'RobloxUser',
      placement: '1',
      points: '25'
    };

    var combos = [
      { pings: true, placementFirst: false },
      { pings: true, placementFirst: true },
      { pings: false, placementFirst: false },
      { pings: false, placementFirst: true }
    ];

    el.matrix.innerHTML = combos.map(function (c) {
      var line = lineFor(sample, c);
      return '<div class="mx-row">' +
        '<span class="mx-flag">' + (c.pings ? 'Pings on' : 'Pings off') +
          ' &middot; ' + (c.placementFirst ? 'placement first' : 'points first') + '</span>' +
        '<code class="mx-out">' + esc(lineText(line)) + '</code>' +
      '</div>';
    }).join('');
  }

  /* ── actions ───────────────────────────────────────────── */

  function addParticipant() {
    var ev = activeEvent();
    if (!ev) return;

    var p = { id: uid('p') };
    FIELDS.forEach(function (f) {
      var node = FIELD_INPUTS[f.key];
      p[f.key] = node ? String(node.value).trim() : '';
      if (node) node.value = '';
    });

    ev.participants.push(p);
    saveStore();
    renderParticipants();
    renderOutput();
    updateCopyNote();

    var first = FIELD_INPUTS[FIELDS[0].key];
    if (first && first.focus) first.focus();
  }

  function removeParticipant(id) {
    var ev = activeEvent();
    if (!ev) return;
    ev.participants = ev.participants.filter(function (p) { return p.id !== id; });
    saveStore();
    renderParticipants();
    renderOutput();
    updateCopyNote();
  }

  /* Called on every keystroke inside a row, so it must NOT redraw the
     rows — that would steal focus mid-word. */
  function updateParticipant(id, key, value) {
    var ev = activeEvent();
    if (!ev) return;
    for (var i = 0; i < ev.participants.length; i++) {
      if (ev.participants[i].id === id) { ev.participants[i][key] = value; break; }
    }
    saveStore();
    renderOutput();
    updateCopyNote();
  }

  function createEvent() {
    var ev = newEvent('Untitled event');
    state.events.push(ev);
    state.activeId = ev.id;
    saveStore();
    renderAll();
    if (el.eventName) {
      el.eventName.focus();
      if (el.eventName.select) el.eventName.select();
    }
  }

  function deleteEvent() {
    var ev = activeEvent();
    if (!ev) return;

    var many = state.events.length > 1;
    var ask = 'Delete "' + ev.name + '"' + (many ? '?' : ' and clear it?');
    if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(ask)) return;

    if (many) {
      state.events = state.events.filter(function (e) { return e.id !== ev.id; });
      state.activeId = state.events[0].id;
    } else {
      /* never leave the tool with zero events */
      state.events = [newEvent('Untitled event')];
      state.activeId = state.events[0].id;
    }

    saveStore();
    renderAll();
  }

  function switchEvent(id) {
    if (!byEventId(id)) return;
    state.activeId = id;
    saveStore();
    renderAll();
  }

  /* ── copy and export ───────────────────────────────────── */

  var ICON_COPY =
    '<rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 5.5 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  var ICON_DONE = '<path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';

  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function flashCopied() {
    if (!el.copy || !el.copyLabel) return;
    el.copy.classList.add('done');
    if (el.copyIco) el.copyIco.innerHTML = ICON_DONE;
    el.copyLabel.textContent = 'Copied!';
    if (el.copiedPill) el.copiedPill.classList.add('show');

    clearTimeout(state.copied);
    state.copied = setTimeout(function () {
      el.copy.classList.remove('done');
      if (el.copyIco) el.copyIco.innerHTML = ICON_COPY;
      el.copyLabel.textContent = 'Copy list';
      if (el.copiedPill) el.copiedPill.classList.remove('show');
    }, 1600);
  }

  function doCopy() {
    var text = outputText(activeEvent());
    if (!text) return;

    writeClipboard(text).then(function (ok) {
      if (ok) {
        flashCopied();
      } else if (el.copyLabel) {
        el.copyLabel.textContent = 'Press Ctrl+C';
        setTimeout(function () { el.copyLabel.textContent = 'Copy list'; }, 1600);
      }
    });
  }

  function fileNameFor(ev) {
    var base = String((ev && ev.name) || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (base || 'event') + '.txt';
  }

  function doExport() {
    var ev = activeEvent();
    var text = outputText(ev);
    if (!text) return;

    if (typeof Blob !== 'function' || typeof URL === 'undefined' || !URL.createObjectURL) return;

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileNameFor(ev);
    document.body.appendChild(a);
    if (typeof a.click === 'function') a.click();
    document.body.removeChild(a);
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
  }

  /* ── leaving the site ────────────────────────────────────
     The Discord invite points off-site, so it warns first. */

  function initLeaveNotice() {
    if (!el.leave || !el.leaveGo || !document.querySelectorAll) return;
    var links = document.querySelectorAll('a[data-leave]');
    if (!links.length) return;

    var lastFocus = null;

    function close() {
      el.leave.hidden = true;
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var focusable = el.leave.querySelectorAll('button, a[href]');
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lastFocus = a;
        el.leaveGo.setAttribute('href', a.getAttribute('href') || '#');
        el.leave.hidden = false;
        document.addEventListener('keydown', onKey);
        var first = el.leave.querySelector('button, a[href]');
        if (first && first.focus) first.focus();
      });
    });

    Array.prototype.forEach.call(el.leave.querySelectorAll('[data-leave-close]'), function (b) {
      b.addEventListener('click', close);
    });
  }

  /* ── header: the 1px border fades in on scroll ──────────── */

  function initHeader() {
    if (!el.nav) return;
    var onScroll = function () {
      el.nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── hero background video ────────────────────────────────────
     Playback starts only while the hero is on screen.              */

  function calmMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function heroPlay() {
    var v = el.heroVideo;
    if (!v) return;
    try {
      if (typeof v.play !== 'function') return;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function heroPause() {
    var v = el.heroVideo;
    try { if (v && typeof v.pause === 'function') v.pause(); } catch (e) {}
  }

  function mountHeroVideo() {
    var v = el.heroVideo;
    if (!v || !el.hero || !BACKDROP.sources.length || v.dataset.mounted === '1') return;
    v.dataset.mounted = '1';

    for (var i = 0; i < BACKDROP.sources.length; i++) {
      var src = document.createElement('source');
      src.src = BACKDROP.sources[i];
      v.appendChild(src);
    }
    try { if (typeof v.load === 'function') v.load(); } catch (e) {}

    v.addEventListener('canplay', function () {
      el.hero.classList.add('is-ready');
    });

    if (calmMotion()) {
      /* honour the OS setting: hold one frame, don't animate */
      heroPause();
      try { v.currentTime = 0; } catch (e) {}
      el.hero.classList.add('is-ready');
      return;
    }

    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) heroPlay(); else heroPause();
        }
      }, { threshold: 0.05 }).observe(el.hero);
    } else {
      heroPlay();
    }
  }

  /* ── wiring ────────────────────────────────────────────── */

  function initApp() {
    if (el.copyIco) el.copyIco.innerHTML = ICON_COPY;

    if (el.addBtn) el.addBtn.addEventListener('click', addParticipant);

    if (el.copy) el.copy.addEventListener('click', doCopy);
    if (el.exportBtn) el.exportBtn.addEventListener('click', doExport);

    if (el.eventNew) el.eventNew.addEventListener('click', createEvent);
    if (el.eventDelete) el.eventDelete.addEventListener('click', deleteEvent);

    if (el.eventSelect) {
      el.eventSelect.addEventListener('change', function () { switchEvent(el.eventSelect.value); });
    }

    if (el.eventName) {
      el.eventName.addEventListener('input', function () {
        var ev = activeEvent();
        if (!ev) return;
        ev.name = el.eventName.value;
        /* rename just the option in place, so the caret is never lost */
        if (el.eventSelect && el.eventSelect.selectedIndex >= 0) {
          var opt = el.eventSelect.options[el.eventSelect.selectedIndex];
          if (opt) opt.textContent = ev.name || 'Untitled event';
        }
        saveStore();
      });
    }

    if (el.optPings) {
      el.optPings.addEventListener('change', function () {
        var ev = activeEvent();
        if (!ev) return;
        ev.pings = el.optPings.checked;
        saveStore();
        renderOutput();
        updateCopyNote();
      });
    }

    if (el.optPlacement) {
      el.optPlacement.addEventListener('change', function () {
        var ev = activeEvent();
        if (!ev) return;
        ev.placementFirst = el.optPlacement.checked;
        saveStore();
        renderOutput();
        updateCopyNote();
      });
    }

    /* edit a row in place — no redraw, so typing is never interrupted */
    if (el.participants) {
      el.participants.addEventListener('input', function (e) {
        var input = e.target.closest ? e.target.closest('input[data-k]') : null;
        if (!input) return;
        var row = input.closest('.prow');
        if (!row) return;
        updateParticipant(row.dataset.id, input.dataset.k, input.value);
      });

      el.participants.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-del]') : null;
        if (btn) removeParticipant(btn.dataset.del);
      });
    }

    /* Enter in any Add field submits the participant */
    FIELDS.forEach(function (f) {
      var node = FIELD_INPUTS[f.key];
      if (!node) return;
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); addParticipant(); }
      });
    });

    loadStore();
    renderAll();
  }

  /* ── boot ──────────────────────────────────────────────── */

  renderFieldStrip();
  renderHomeCards();
  renderMatrix();
  initHeader();
  initLeaveNotice();
  mountHeroVideo();

  if (HAS_APP) initApp();

  /* Small export hook so the behaviour can be tested outside a browser. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FIELDS: FIELDS,
      ICON: ICON,
      icon: icon,
      esc: esc,
      state: state,
      newEvent: newEvent,
      normaliseEvent: normaliseEvent,
      normalisePart: normalisePart,
      byEventId: byEventId,
      activeEvent: activeEvent,
      numOrNull: numOrNull,
      leadingField: leadingField,
      valueFor: valueFor,
      labelFor: labelFor,
      lineFor: lineFor,
      lineText: lineText,
      sortedParticipants: sortedParticipants,
      outputLines: outputLines,
      outputText: outputText,
      fileNameFor: fileNameFor,
      loadStore: loadStore,
      saveStore: saveStore,
      HAS_APP: HAS_APP
    };
  }
})();
