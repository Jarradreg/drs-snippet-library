/* ============================================================
   Snippet Library
   - Templates are read-only. Only placeholder values are editable.
   - Copy output is the RAW Discord markdown (markers intact).
   - Preview is a faithful, rendered rendering of that markdown.
   ============================================================ */
(function () {
  'use strict';

  /* Shortcodes such as ":drs:" are not valid Discord markdown, but we still
     know which emoji they refer to so the preview can show the real thing
     while the copy output stays byte-identical to the template. */
  var ALIASES = { drs: '1211444510807031849' };

  /* ── hero background video ─────────────────────────────────────
     Drop your own links into `sources` — mp4, webm or both, in
     preference order. The browser takes the first one it can play.
     Clear the array to fall back to the parchment canvas alone.    */
  var BACKDROP = {
    sources: [
      'https://cdn.pixabay.com/video/2022/09/20/131973-751915246_large.mp4'
    ]
  };

  var SNIPPETS = [
    {
      id: 'greetings',
      category: 'Greetings',
      title: 'Greetings',
      note: 'Opening message. Swap the Discord ID for whoever you are replying to.',
      fields: [
        { key: 'discordId', label: 'Discord ID', def: '1093138840660742249', ph: '1093138840660742249' }
      ],
      template:
        '<:drs:1211444510807031849> | **Greetings,**\n' +
        '\n' +
        '> My name is <@{{discordId}}>, and I am with the Public Relations Team at DRS. Please bear with me whilst I update your balance.\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'liked-service',
      category: 'Feedback',
      title: 'Liked my Service',
      note: 'Optional feedback request. No editable fields — copy as-is.',
      fields: [],
      template:
        ':drs: | **Liked my service?**\n' +
        '\n' +
        '> If you liked my service and wish for me to get noticed, I would suggest and be very grateful if you could fill out the form below. This is optional, of course, and is not required.\n' +
        '\n' +
        'Link: https://forms.gle/NVaehacnq51tz6ne9\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'follow-up',
      category: 'Support',
      title: 'Follow-up',
      note: 'Closes a reply once the request is done. No editable fields — copy as-is.',
      fields: [],
      template:
        '<:drs:1211444510807031849> | **Anything else?**\n' +
        '\n' +
        '> Is there anything else I can help you with today? If not, have a lovely day, and thank you for reaching out to the Public Relations Team at DRS.\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'point-error',
      category: 'Errors',
      title: 'Point Error',
      note: 'Use when points could not be applied. No editable fields — copy as-is.',
      fields: [],
      template:
        ':drs: | **Point Error.**\n' +
        '\n' +
        '> Unfortunately, I could not add your points. I have requested that another member of the Public Relations team review this issue and issue your points.\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'request-points',
      category: 'Points',
      title: 'Request Points',
      note: 'Fill in the three fields, then copy. Every value is inserted for you.',
      fields: [
        { key: 'discordId', label: 'Discord ID', def: '', ph: '1093138840660742249' },
        { key: 'robloxId', label: 'Roblox ID', def: '', ph: '123456789' },
        { key: 'points', label: 'Points Requested', def: '', ph: '1000' }
      ],
      template:
        '<:drs:1211444510807031849> | **Request Points**\n' +
        '\n' +
        '> Hello, and thank you for your patience with your points request.\n' +
        '>\n' +
        '> **Discord ID:** {{discordId}}\n' +
        '> **Roblox ID:** {{robloxId}}\n' +
        '> **Points Requested:** {{points}}\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'points-addon',
      category: 'Points',
      title: 'Points Addon',
      note: 'Confirms a manual points entry. The trailing ping takes a Discord ID.',
      fields: [
        { key: 'discordId', label: 'Discord ID (ping)', def: '', ph: '1093138840660742249' }
      ],
      template:
        '<:drs:1211444510807031849> | **Points Addon**\n' +
        '\n' +
        '**As our dashboard is currently not functional, I have logged your points through a separate section, where your points will be put on once our systems come back. Can I assist you with anything else <@{{discordId}}>?**\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'points-added',
      category: 'Points',
      title: 'Points Added',
      note: 'Balance confirmation. Enter the new balance in points.',
      fields: [
        { key: 'balance', label: 'Balance (points)', def: '688', ph: '688' }
      ],
      template:
        '<:drs:1211444510807031849> | **Points Added**\n' +
        '\n' +
        '> **Your points have been added to your account.**\n' +
        '> **Your current balance is: {{balance}} Points!**\n' +
        '\n' +
        'Anything else I can help you with?\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    },
    {
      id: 'blank',
      category: 'Templates',
      title: 'Blank Format',
      note: 'House style with nothing filled in. Edit the title and message body.',
      fields: [
        { key: 'title', label: 'Title', def: '', ph: 'Message title', wide: true, block: true },
        { key: 'body', label: 'Message', def: '', ph: 'Write your message…', type: 'textarea', wide: true, block: true }
      ],
      template:
        '<:drs:1211444510807031849> | **{{title}}**\n' +
        '\n' +
        '**{{body}}**\n' +
        '\n' +
        '-# **Public Relations Team @ DRS**'
    }
  ];

  var CATEGORY_ORDER = ['Greetings', 'Support', 'Feedback', 'Points', 'Errors', 'Templates'];

  /* A sequence is an ordered run of snippets. Pressing one walks the team
     through the messages in order; copying a step ticks it off. */
  var SEQUENCES = [
    {
      id: 'points',
      name: 'Points sequence',
      note: 'The three messages a points request runs through, in order.',
      steps: ['greetings', 'points-added', 'liked-service']
    }
  ];

  /* Minimal monochrome line icons, ~20px, single-weight stroke.
     Stroke is wine when the chip is chromatic (active tab) and ink when not. */
  var ICON = {
    all: '<path d="M12 3.5l8.5 4.7-8.5 4.7-8.5-4.7L12 3.5z"/><polyline points="3.5 12.2 12 16.9 20.5 12.2"/><polyline points="3.5 16.4 12 21.1 20.5 16.4"/>',
    Greetings: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6.5 7S5 17.5 5 14v-1.5a1.5 1.5 0 0 1 3 0"/>',
    Support: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.2 3.2M18 6l-3.2 3.2M6 18l3.2-3.2M18 18l-3.2-3.2"/>',
    Feedback: '<path d="M20 12.2c0 3.8-3.6 6.9-8 6.9-1 0-2-.2-2.9-.5L4 20.4l1.3-3.6A6.8 6.8 0 0 1 4 12.2c0-3.8 3.6-6.9 8-6.9s8 3.1 8 6.9z"/><path d="M9.4 11.6h.01M12 11.6h.01M14.6 11.6h.01"/>',
    Points: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    Errors: '<path d="M12 4.2L21 19.4H3L12 4.2z"/><path d="M12 10v4"/><path d="M12 16.6h.01"/>',
    Templates: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><polyline points="14 3.5 14 8 18.5 8"/><path d="M9 13h6M9 16.5h4"/>',
    Discord: '<path d="M19.5 6.4A15 15 0 0 0 15.4 5l-.3.6a11 11 0 0 1 3.3 1.2 12.7 12.7 0 0 0-11 0A11 11 0 0 1 10.7 5.6L10.4 5a15 15 0 0 0-4.1 1.4C3.7 10 3 13.4 3.4 16.7A15 15 0 0 0 8 19l.9-1.5a9.6 9.6 0 0 1-1.6-.8l.4-.3a10.7 10.7 0 0 0 9.8 0l.4.3a9.6 9.6 0 0 1-1.6.8L17.2 19a15 15 0 0 0 4.6-2.3c.5-3.9-.6-7.3-2.3-10.3z"/><circle cx="9.3" cy="13.4" r="1.2"/><circle cx="14.7" cy="13.4" r="1.2"/>'
  };

  function icon(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + ICON[name] + '</svg>';
  }

  /* Trust Logo Card strip — the five categories plus the platform. */
  var TRUST = CATEGORY_ORDER.concat(['Discord']);

  /* ── state ─────────────────────────────────────────────── */

  var state = {
    query: '',
    category: 'All',
    selectedId: SNIPPETS[0].id,
    values: {},
    copied: null,
    seq: { running: false, done: [] }
  };

  var el = {
    search: document.getElementById('search'),
    searchClear: document.getElementById('searchClear'),
    filters: document.getElementById('filters'),
    cards: document.getElementById('cards'),
    listCount: document.getElementById('listCount'),
    empty: document.getElementById('empty'),
    editor: document.getElementById('editor'),
    pane: document.getElementById('editorPane'),
    copy: document.getElementById('copy'),
    copyLabel: document.getElementById('copyLabel'),
    copyIco: document.getElementById('copyIco'),
    copyNote: document.getElementById('copyNote'),
    copiedPill: document.getElementById('copiedPill'),
    hero: document.querySelector('.hero'),
    nav: document.getElementById('nav'),
    trustRow: document.getElementById('trustRow'),
    homeCards: document.getElementById('homeCards'),
    seqPanel: document.getElementById('seqPanel'),
    seqRun: document.getElementById('seqRun'),
    seqSteps: document.getElementById('seqSteps'),
    leave: document.getElementById('leave'),
    leaveGo: document.getElementById('leaveGo'),
    heroVideo: document.getElementById('backdropVideo')
  };

  /* The library is a two-pane tool that only exists on library.html.
     Everything library-shaped is skipped on the landing page. */
  var HAS_LIBRARY = !!(el.cards && el.editor && el.copy && el.search && el.filters);

  function byId(id) {
    for (var i = 0; i < SNIPPETS.length; i++) if (SNIPPETS[i].id === id) return SNIPPETS[i];
    return null;
  }

  function current() { return byId(state.selectedId) || SNIPPETS[0]; }

  function defaults(s) {
    var v = {};
    s.fields.forEach(function (f) { v[f.key] = f.def || ''; });
    return v;
  }

  function valuesOf(s) {
    if (!state.values[s.id]) state.values[s.id] = defaults(s);
    return state.values[s.id];
  }

  /* ── text assembly ─────────────────────────────────────── */

  /* Raw output for the clipboard: placeholders -> real values. */
  function rawFor(s) {
    var v = valuesOf(s);
    return s.template
      .replace(/\{\{(\w+)\}\}/g, function (_, key) { return v[key] != null ? v[key] : ''; })
      .replace(/[ \t]+$/gm, '')
      .replace(/\n+$/, '');
  }

  /* Preview input: placeholders -> opaque markers, never user text. */
  function markedFor(s) {
    var i = 0;
    return s.template.replace(/\{\{(\w+)\}\}/g, function () { return '@@F' + (i++) + '@@'; });
  }

  /* ── escaping ──────────────────────────────────────────── */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── tokenizer ─────────────────────────────────────────── */
  /* Pulls out the things that must survive Discord markdown
     formatting untouched: code, emoji, mentions, links, fields. */

  function tokenize(src, tokens) {
    var names = Object.keys(ALIASES);
    var aliasGroup = names.length ? names.join('|') : 'ZZZNOMATCH';
    var re = new RegExp(
      '```\\n?([\\s\\S]*?)```' + '|' +           // 1  code block
      '`([^`\\n]+)`' + '|' +                    // 2  inline code
      '<(a?):([a-zA-Z0-9_]{2,32}):(\\d{15,25})>' + '|' +  // 3,4,5  emoji
      '<@&(\\d{15,25})>' + '|' +                // 6  role
      '<@!?(\\d{15,25}|@@F\\d+@@)>' + '|' +      // 7  user (id, or an editable field)
      '<#(\\d{15,25})>' + '|' +                 // 8  channel
      '(https?:\\/\\/[^\\s<>)\\]]+)' + '|' +    // 9  url
      ':(' + aliasGroup + '):' + '|' +           // 10 shortcode alias
      '@@F(\\d+)@@',                           // 11 field marker
      'g'
    );

    var out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      out += src.slice(last, m.index);
      var tok = null;

      if (m[1] !== undefined) tok = { t: 'code', v: m[1] };
      else if (m[2] !== undefined) tok = { t: 'icode', v: m[2] };
      else if (m[5] !== undefined) tok = { t: 'emoji', name: m[4], id: m[5], anim: m[3] === 'a' };
      else if (m[6] !== undefined) tok = { t: 'role', id: m[6] };
      else if (m[7] !== undefined) tok = { t: 'user', id: m[7] };
      else if (m[8] !== undefined) tok = { t: 'channel', id: m[8] };
      else if (m[9] !== undefined) {
        var url = m[9], trail = '';
        var tm = url.match(/[.,;:!?]+$/);
        if (tm) { trail = tm[0]; url = url.slice(0, url.length - trail.length); }
        tok = { t: 'url', v: url, trail: trail };
      }
      else if (m[10] !== undefined) tok = { t: 'alias', name: m[10] };
      else if (m[11] !== undefined) tok = { t: 'field', i: +m[11] };

      if (tok) {
        tokens.push(tok);
        out += '\u0000T' + (tokens.length - 1) + '\u0000';
        last = m.index + m[0].length;
      }
    }
    out += src.slice(last);
    return out;
  }

  /* ── inline markdown ───────────────────────────────────── */
  /* Discord's markers toggle: a marker closes if that style is open,
     otherwise it opens. This is why "**a **b** c**" renders as
     bold / normal / bold in Discord — and we reproduce that. */

  var STYLES = {
    '***': { open: '<strong><em>', close: '</em></strong>' },
    '**':  { open: '<strong>',     close: '</strong>' },
    '__':  { open: '<span class="d-u">', close: '</span>' },
    '~~':  { open: '<del>',        close: '</del>' },
    '||':  { open: '<span class="d-spoiler">', close: '</span>' },
    '*':   { open: '<em>',         close: '</em>' },
    '_':   { open: '<em>',         close: '</em>' }
  };
  var MARKERS = ['***', '**', '__', '~~', '||', '*', '_'];
  var WS = /\s/;

  /* A marker run can only open a style when it is not isolated, i.e. it is
     not surrounded by whitespace on both sides. Discord's markers toggle,
     so "**a **b** c**" ends up bold / normal / bold — we match that. */
  function canOpen(src, i, len) {
    var before = src[i - 1], after = src[i + len];
    var wsBefore = before !== undefined && WS.test(before);
    var wsAfter = after !== undefined && WS.test(after);
    return !(wsBefore && wsAfter);
  }

  function inline(src) {
    var stack = [], out = '', buf = '', i = 0;

    function flush() { out += esc(buf); buf = ''; }

    while (i < src.length) {
      var marker = null;
      for (var k = 0; k < MARKERS.length; k++) {
        if (src.substr(i, MARKERS[k].length) === MARKERS[k]) { marker = MARKERS[k]; break; }
      }
      if (!marker) { buf += src[i]; i++; continue; }

      var idx = -1;
      for (var s = stack.length - 1; s >= 0; s--) {
        if (stack[s].m === marker) { idx = s; break; }
      }

      if (idx !== -1) {
        flush();
        while (stack.length > idx) out += STYLES[stack.pop().m].close;
      } else {
        if (!canOpen(src, i, marker.length)) { buf += marker; i += marker.length; continue; }
        flush();
        stack.push({ m: marker });
        out += STYLES[marker].open;
      }
      i += marker.length;
    }

    flush();
    while (stack.length) out += STYLES[stack.pop().m].close;
    return out;
  }

  /* ── block markdown ────────────────────────────────────── */

  function parseBlocks(src) {
    var lines = String(src).split('\n');
    var blocks = [], i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      var q = /^\s*>\s?(.*)$/.exec(line);
      if (q) {
        var qlines = [];
        while (i < lines.length) {
          var qm = /^\s*>\s?(.*)$/.exec(lines[i]);
          if (!qm) break;
          qlines.push(qm[1]);
          i++;
        }
        blocks.push({ type: 'quote', lines: qlines });
        continue;
      }

      var sm = /^\s*-#\s?(.*)$/.exec(line);
      if (sm) {
        var slines = [];
        while (i < lines.length) {
          var s2 = /^\s*-#\s?(.*)$/.exec(lines[i]);
          if (!s2) break;
          slines.push(s2[1]);
          i++;
        }
        blocks.push({ type: 'small', lines: slines });
        continue;
      }

      var plines = [];
      while (i < lines.length && lines[i].trim() &&
             !/^\s*>/.test(lines[i]) && !/^\s*-#/.test(lines[i])) {
        plines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'p', lines: plines });
    }
    return blocks;
  }

  function renderBlock(b, tokens) {
    if (b.type === 'quote') {
      return '<div class="d-quote">' + b.lines.map(function (l) {
        return l.trim() === '' ? '<span class="d-qbreak"></span>' : inline(l);
      }).join('<br>') + '</div>';
    }
    if (b.type === 'small') {
      return '<div class="d-small">' + b.lines.map(inline).join('<br>') + '</div>';
    }
    return b.lines.map(function (l) {
      if (/^\s*(---|\*\*\*|___)\s*$/.test(l)) return '<hr class="d-hr">';
      return inline(l);
    }).join('<br>');
  }

  /* ── token rendering ───────────────────────────────────── */

  function renderToken(tok, s, values) {
    switch (tok.t) {
      case 'code':
        return '<pre class="d-code">' + esc(tok.v) + '</pre>';
      case 'icode':
        return '<code class="d-code">' + esc(tok.v) + '</code>';
      case 'emoji':
        return emojiHTML(tok.name, tok.id, tok.anim);
      case 'alias':
        return emojiHTML(tok.name, ALIASES[tok.name], false);
      case 'user': {
        var fm = /^@@F(\d+)@@$/.exec(tok.id);
        if (fm) return mentionFieldHTML(s.fields[+fm[1]], values);
        return '<span class="d-mention">@' + esc(tok.id) + '</span>';
      }
      case 'role':
        return '<span class="d-role">@' + esc(tok.id) + '</span>';
      case 'channel':
        return '<span class="d-channel">#' + esc(tok.id) + '</span>';
      case 'url':
        return '<a class="d-link" href="' + esc(tok.v) + '" target="_blank" rel="noopener noreferrer">' +
               esc(tok.v) + '</a>' + esc(tok.trail || '');
      case 'field':
        return fieldHTML(tok.i, s, values);
      default:
        return '';
    }
  }

  function emojiHTML(name, id, animated) {
    var src = 'https://cdn.discordapp.com/emojis/' + id + (animated ? '.gif' : '.png');
    return '<img class="d-emoji" src="' + src + '" alt=":' + esc(name) + ':" title=":' + esc(name) +
           ':" draggable="false" data-fallback=":' + esc(name) + ':">';
  }

  function fieldHTML(i, s, values) {
    var f = s.fields[i];
    if (!f) return '';
    var v = values[f.key] || '';
    var cls = 'd-field' + (f.block ? ' d-field--block' : '');
    if (!v) return '<span class="' + cls + '"><span class="ph">' + esc(f.ph || f.label) + '</span></span>';
    return '<span class="' + cls + '">' + esc(v) + '</span>';
  }

  /* An editable mention, e.g. <@{{discordId}}> */
  function mentionFieldHTML(f, values) {
    if (!f) return '';
    var v = values[f.key] || '';
    if (!v) return '<span class="d-mention"><span class="ph">@' + esc(f.ph || f.label) + '</span></span>';
    return '<span class="d-mention">@' + esc(v) + '</span>';
  }

  function wireEmojiFallbacks(root) {
    var imgs = root.querySelectorAll('img.d-emoji');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        function fail() {
          if (img.dataset.fell === '1' || !img.parentNode) return;
          img.dataset.fell = '1';
          var span = document.createElement('span');
          span.className = 'd-alias';
          span.textContent = img.getAttribute('data-fallback') || '';
          img.parentNode.replaceChild(span, img);
        }
        img.addEventListener('error', fail);
        /* a cached 404 fires before this runs — catch it now */
        if (img.complete && !img.naturalWidth) fail();
      })(imgs[i]);
    }
  }

  /* Full render of one snippet -> Discord message HTML */
  function renderSnippet(s) {
    var tokens = [];
    var marked = tokenize(markedFor(s), tokens);
    var blocks = parseBlocks(marked);

    /* Two paragraphs separated by a blank line are a real break in Discord.
       Quote and small blocks are already block-level, so they need nothing. */
    var html = blocks.reduce(function (acc, b, i) {
      var prev = blocks[i - 1];
      if (prev && prev.type === 'p' && b.type === 'p') acc += '<br>';
      return acc + renderBlock(b, tokens);
    }, '');

    html = html.replace(/\u0000T(\d+)\u0000/g, function (_, n) {
      return renderToken(tokens[+n], s, valuesOf(s));
    });

    return '<div class="msg">' +
      '<div class="avatar" aria-hidden="true">DRS</div>' +
      '<div class="msg-body">' +
        '<div class="msg-head">' +
          '<span class="msg-name">DRS</span>' +
          '<span class="msg-bot">APP</span>' +
          '<span class="msg-time">Today at ' + timeNow() + '</span>' +
        '</div>' +
        '<div class="msg-text">' + html + '</div>' +
      '</div>' +
    '</div>';
  }

  function timeNow() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  /* ── plain text for the card previews ──────────────────── */

  function plainCard(s, max) {
    var tokens = [];
    var marked = tokenize(markedFor(s), tokens);
    var text = marked
      .replace(/```/g, '')
      .replace(/^\s*>\s?/gm, '')
      .replace(/^\s*-#\s?/gm, '')
      .replace(/\*\*\*|\*\*|__|~~|\|\||\*|_/g, '')
      .replace(/\u0000T(\d+)\u0000/g, function (_, n) { return '\u0000P' + n + '\u0000'; })
      .replace(/[ \t]+$/gm, '')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    if (text.length > max) {
      var cut = text.slice(0, max);
      var sp = cut.lastIndexOf(' ');
      if (sp > max * 0.6) cut = cut.slice(0, sp);
      text = cut.replace(/[\u0000P\d]*$/, '').replace(/[\s,;:.]+$/, '') + '…';
    }

    return esc(text).replace(/\u0000P(\d+)\u0000/g, function (_, n) {
      var tok = tokens[+n];
      if (!tok) return '';
      if (tok.t === 'field') {
        var f = s.fields[tok.i];
        return '<span class="ph">‹' + esc(f ? f.label : 'value') + '›</span>';
      }
      if (tok.t === 'user') {
        var mf = /^@@F(\d+)@@$/.exec(tok.id);
        if (mf) {
          var mfld = s.fields[+mf[1]];
          return '<span class="ph">@‹' + esc(mfld ? mfld.label : 'user') + '›</span>';
        }
        return '@user';
      }
      if (tok.t === 'role') return '@role';
      if (tok.t === 'channel') return '#channel';
      if (tok.t === 'url') return esc(tok.v) + esc(tok.trail || '');
      if (tok.t === 'emoji' || tok.t === 'alias') return ':' + esc(tok.name) + ':';
      return esc(tok.v);
    });
  }

  /* ── left pane ─────────────────────────────────────────── */

  function matches(s) {
    if (state.category !== 'All' && s.category !== state.category) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = (s.title + ' ' + s.category + ' ' + s.note + ' ' + plainTextOf(s)).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function plainTextOf(s) {
    var tmp = document.createElement('div');
    tmp.innerHTML = plainCard(s, 4000);
    return tmp.textContent || '';
  }

  function renderFilters() {
    var cats = ['All'].concat(CATEGORY_ORDER.filter(function (c) {
      return SNIPPETS.some(function (s) { return s.category === c; });
    }));

    el.filters.innerHTML = '';
    cats.forEach(function (c) {
      var n = c === 'All' ? SNIPPETS.length : SNIPPETS.filter(function (s) { return s.category === c; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(state.category === c));
      b.innerHTML = icon(c === 'All' ? 'all' : c) + esc(c) + '<span class="n">' + n + '</span>';
      b.addEventListener('click', function () {
        state.category = c;
        renderFilters();
        renderCards();
      });
      el.filters.appendChild(b);
    });
  }

  /* ── sequence ────────────────────────────────────────────
     There is exactly one sequence. Pressing it walks the team through the
     messages in order; copying a step ticks it off and moves to the next. */

  function sequence() { return SEQUENCES[0]; }

  /* Which step a snippet is, or -1 when the sequence isn't running. */
  function stepIndex(id) {
    if (!state.seq.running) return -1;
    return sequence().steps.indexOf(id);
  }

  function seqComplete() {
    return state.seq.done.length === sequence().steps.length;
  }

  function startSequence() {
    state.seq.running = true;
    state.seq.done = [];
    state.query = '';
    if (el.search) el.search.value = '';
    if (el.searchClear) el.searchClear.hidden = true;
    state.category = 'All';
    select(sequence().steps[0]);
  }

  function tickStep(id) {
    var seq = sequence();
    if (state.seq.done.indexOf(id) < 0) state.seq.done.push(id);

    var next = null;
    for (var i = 0; i < seq.steps.length; i++) {
      if (state.seq.done.indexOf(seq.steps[i]) < 0) { next = seq.steps[i]; break; }
    }
    if (next) select(next);

    if (seqComplete()) {
      state.seq.running = false;
      state.seq.done = [];
    }
    renderSequence();
  }

  function renderSequence() {
    if (!el.seqPanel) return;
    var seq = sequence();
    var running = state.seq.running;

    el.seqPanel.classList.toggle('is-running', running);

    el.seqRun.textContent = running ? 'Reset' : (state.seq.done.length ? 'Run again' : 'Run sequence');
    el.seqRun.classList.toggle('btn-ghost', running);

    el.seqSteps.innerHTML = seq.steps.map(function (id, i) {
      var s = byId(id);
      if (!s) return '';
      var isDone = state.seq.done.indexOf(id) >= 0;
      var isNow = running && state.selectedId === id;
      return '<li class="seq-step' + (isDone ? ' is-done' : '') + (isNow ? ' is-now' : '') + '">' +
        '<button type="button" data-id="' + esc(id) + '"' + (isNow ? ' aria-current="step"' : '') + '>' +
          '<span class="seq-tick">' + (isDone ? ICON_DONE : String(i + 1)) + '</span>' +
          '<span class="seq-title">' + esc(s.title) + '</span>' +
        '</button></li>';
    }).join('');
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

  function renderTrust() {
    if (!el.trustRow) return;
    el.trustRow.innerHTML = TRUST.map(function (c) {
      return '<div class="trust-cell">' + icon(c) + '<span>' + esc(c) + '</span></div>';
    }).join('');
  }

  /* Landing page: one Suite Product Card per category, deep-linking to
     the library with that category already selected. */
  var HOME_COPY = {
    Greetings: 'How you open a reply — your name, the team, and a promise to come back to them.',
    Support: 'The middle of a conversation. Follow-ups, check-ins, and closing a request once it is done.',
    Feedback: 'A short, optional request for a rating after a good reply. Never required, never pushy.',
    Points: 'Requests, confirmations and manual entries, with the numbers filled in for you.',
    Errors: 'What to say when a request could not be applied, without sounding like a system error.',
    Templates: 'The house style with nothing in it. Write a new one from scratch in our voice.'
  };

  function renderHomeCards() {
    if (!el.homeCards) return;
    el.homeCards.innerHTML = CATEGORY_ORDER.map(function (c) {
      var n = SNIPPETS.filter(function (s) { return s.category === c; }).length;
      return '<article class="card">' +
        '<span class="card-ico" aria-hidden="true">' + icon(c) + '</span>' +
        '<h3 class="card-title">' + esc(c) + '</h3>' +
        '<p class="card-preview">' + esc(HOME_COPY[c] || '') + '</p>' +
        '<div class="card-foot">' +
          '<span class="card-fields">' + n + (n === 1 ? ' snippet' : ' snippets') + '</span>' +
          '<a class="card-go" href="library.html?category=' + encodeURIComponent(c) + '">Browse' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>' +
          '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* library.html?category=Points opens straight on that tab */
  function applyCategoryFromUrl() {
    var q = (window.location && window.location.search) || '';
    var m = /[?&]category=([^&]+)/.exec(q);
    if (!m) return;
    var c = decodeURIComponent(m[1].replace(/\+/g, ' '));
    if (CATEGORY_ORDER.indexOf(c) >= 0) state.category = c;
  }

  function renderCards() {
    var list = SNIPPETS.filter(matches);
    el.cards.innerHTML = '';
    el.empty.hidden = list.length > 0;
    el.listCount.textContent = list.length + (list.length === 1 ? ' snippet' : ' snippets');

    list.forEach(function (s, i) {
      var card = document.createElement('div');
      card.className = 'card' + (s.id === state.selectedId ? ' is-active' : '');
      card.setAttribute('role', 'listitem');
      card.style.animationDelay = Math.min(i * 28, 220) + 'ms';

      var nFields = s.fields.length;
      var step = stepIndex(s.id);
      card.innerHTML =
        '<div class="card-top">' +
          (step >= 0 ? '<span class="seq-badge">Step ' + (step + 1) + '</span>' : '') +
          '<span class="card-ico" aria-hidden="true">' + icon(s.category) + '</span>' +
          '<span class="card-tag">' + esc(s.category) + '</span>' +
        '</div>' +
        '<h3 class="card-title"><button class="card-main" type="button" data-id="' + s.id + '"' +
          (s.id === state.selectedId ? ' aria-current="true"' : '') + '>' + esc(s.title) + '</button></h3>' +
        '<p class="card-preview">' + plainCard(s, 104) + '</p>' +
        '<div class="card-foot">' +
          '<span class="card-fields">' + (nFields ? nFields + (nFields === 1 ? ' editable field' : ' editable fields') : 'no editable fields') + '</span>' +
          '<button class="card-go" type="button" data-id="' + s.id + '">Edit &amp; Copy' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>' +
          '</button>' +
        '</div>';

      var mains = card.querySelectorAll('.card-main, .card-go');
      for (var k = 0; k < mains.length; k++) {
        mains[k].addEventListener('click', function () { select(this.dataset.id); });
      }
      el.cards.appendChild(card);
    });
  }

  /* ── right pane ────────────────────────────────────────── */

  function fieldHTMLInput(f) {
    var inputHtml = f.type === 'textarea'
      ? '<textarea id="f-' + f.key + '" rows="2" placeholder="' + esc(f.ph || '') + '"></textarea>'
      : '<input id="f-' + f.key + '" type="text" placeholder="' + esc(f.ph || '') + '" autocomplete="off" spellcheck="false" />';
    return '<div class="field' + (f.wide ? ' field--wide' : '') + '">' +
      '<label for="f-' + f.key + '">' + esc(f.label) + '<span class="key">{{' + esc(f.key) + '}}</span></label>' +
      inputHtml +
    '</div>';
  }

  function renderEditor() {
    var s = current();
    var v = valuesOf(s);

    var html = '<div class="editor-in">';
    html +=
      '<div class="editor-head">' +
        '<div class="editor-id">' +
          '<span class="tag">' + esc(s.category) + '</span>' +
          '<h2>' + esc(s.title) + '</h2>' +
          '<p class="editor-note">' + esc(s.note) + '</p>' +
        '</div>' +
        '<div class="editor-actions">' +
          '<button class="btn-ghost" id="reset" type="button"' + (s.fields.length ? '' : ' disabled') + '>' +
            '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4"/></svg>' +
            'Reset fields' +
          '</button>' +
        '</div>' +
      '</div>';

    html +=
      '<section class="section"' + (s.fields.length ? '' : ' hidden') + '>' +
        '<div class="section-head"><h3>Editable fields</h3><span class="section-hint">Inserted on copy</span></div>' +
        '<div class="fields">' + s.fields.map(fieldHTMLInput).join('') + '</div>' +
      '</section>';

    html +=
      '<section class="section">' +
        '<div class="code-block">' +
          '<div class="code-head">' +
            '<span class="code-name">discord&#8202;·&#8202;preview</span>' +
            '<span class="pill" id="copiedPill" role="status" aria-live="polite">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>' +
              'Copied' +
            '</span>' +
          '</div>' +
          '<div class="code-body" id="preview">' + renderSnippet(s) + '</div>' +
        '</div>' +
      '</section>';

    html += '</div>';

    el.editor.innerHTML = html;

    /* set values (after insertion, never as innerHTML) */
    s.fields.forEach(function (f) {
      var input = document.getElementById('f-' + f.key);
      if (!input) return;
      input.value = v[f.key] || '';
      input.addEventListener('input', function () {
        valuesOf(s)[f.key] = input.value;
        updatePreview();
      });
    });

    var reset = document.getElementById('reset');
    if (reset) {
      reset.addEventListener('click', function () {
        state.values[s.id] = defaults(s);
        renderEditor();
      });
    }

    wireEmojiFallbacks(el.editor);
    el.copyLabel = document.getElementById('copyLabel');
    el.copiedPill = document.getElementById('copiedPill');
    updatePreview();
  }

  function updatePreview() {
    var s = current();
    var box = document.getElementById('preview');
    if (box) {
      box.innerHTML = renderSnippet(s);
      wireEmojiFallbacks(box);
    }
    var n = rawFor(s).length;
    el.copyNote.textContent = 'Copies ' + n + ' character' + (n === 1 ? '' : 's') +
      ' of raw Discord Markdown — formatting, emojis and mentions preserved.';
  }

  function select(id) {
    if (state.selectedId === id) { renderSequence(); return; }
    state.selectedId = id;
    renderCards();
    renderEditor();
    renderSequence();
    if (window.matchMedia('(max-width: 1180px)').matches) {
      el.pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── copy ──────────────────────────────────────────────── */

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
    el.copy.classList.add('done');
    el.copyIco.innerHTML = ICON_DONE;
    el.copyLabel.textContent = 'Copied!';
    if (el.copiedPill) el.copiedPill.classList.add('show');

    clearTimeout(state.copied);
    state.copied = setTimeout(function () {
      el.copy.classList.remove('done');
      el.copyIco.innerHTML = ICON_COPY;
      el.copyLabel.textContent = 'Copy message';
      if (el.copiedPill) el.copiedPill.classList.remove('show');
    }, 1600);
  }

  function doCopy() {
    var s = current();
    writeClipboard(rawFor(s)).then(function (ok) {
      if (ok) {
        flashCopied();
        if (stepIndex(s.id) >= 0) tickStep(s.id);
      } else {
        el.copyLabel.textContent = 'Press Ctrl+C';
        setTimeout(function () { el.copyLabel.textContent = 'Copy message'; }, 1600);
      }
    });
  }

  /* ── events ────────────────────────────────────────────── */

  if (HAS_LIBRARY) {

  el.search.addEventListener('input', function () {
    state.query = el.search.value;
    el.searchClear.hidden = !state.query;
    renderCards();
  });

  el.search.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { el.search.value = ''; state.query = ''; el.searchClear.hidden = true; renderCards(); }
  });

  el.searchClear.addEventListener('click', function () {
    el.search.value = ''; state.query = ''; el.searchClear.hidden = true; renderCards(); el.search.focus();
  });

  el.copy.addEventListener('click', doCopy);

  if (el.seqRun) {
    el.seqRun.addEventListener('click', function () {
      if (state.seq.running) {
        state.seq.running = false;
        state.seq.done = [];
        renderSequence();
        renderCards();
      } else {
        startSequence();
      }
    });
  }

  if (el.seqSteps) {
    el.seqSteps.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-id]');
      if (btn) select(btn.dataset.id);
    });
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);

    if (e.key === '/' && !typing) { e.preventDefault(); el.search.focus(); el.search.select(); return; }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doCopy(); return; }

    if (!typing && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && el.cards.children.length) {
      e.preventDefault();
      var ids = SNIPPETS.filter(matches).map(function (s) { return s.id; });
      var at = ids.indexOf(state.selectedId);
      at = e.key === 'ArrowDown' ? Math.min(at + 1, ids.length - 1) : Math.max(at - 1, 0);
      if (ids[at]) {
        select(ids[at]);
        var next = el.cards.querySelector('.card-main[data-id="' + ids[at] + '"]');
        if (next) next.focus();
      }
    }
  });

  el.cards.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var btn = e.target.closest('.card-main, .card-go');
    if (!btn) return;
    e.preventDefault();
    select(btn.dataset.id);
    if (e.target.classList.contains('card-main')) {
      var back = el.cards.querySelector('.card-main[data-id="' + btn.dataset.id + '"]');
      if (back) back.focus();
    }
  });

  } /* HAS_LIBRARY */

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
     Drop your own links into `sources` — mp4, webm or both, in
     preference order. The browser takes the first one it can play.
     Clear the array to fall back to the parchment canvas alone.
     Playback starts only while the hero is on screen.             */

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

  /* ── boot ──────────────────────────────────────────────── */

  renderTrust();
  renderHomeCards();
  initHeader();
  initLeaveNotice();
  mountHeroVideo();

  if (HAS_LIBRARY) {
    el.copyIco.innerHTML = ICON_COPY;
    applyCategoryFromUrl();
    renderFilters();
    renderCards();
    renderEditor();
    renderSequence();
  }
})();
