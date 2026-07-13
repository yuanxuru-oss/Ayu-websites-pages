// === Entry dialog interaction ===
const overlay = document.getElementById('entryOverlay');
const penguin = document.getElementById('entryPenguin');
const greeting = document.getElementById('greeting');

var greetings = [
  '欢迎来到<strong>阿鱼的小岛</strong>！你想去哪里看看？',
  '今天天气真好呀！要逛逛吗？',
  '嘿！<strong>好久不见</strong>～想去哪儿？',
  '阿鱼在岛上留了些东西，要看看吗？'
];

var greetingFull = '欢迎来到<strong>阿鱼的小岛</strong>！你想去哪里看看？';
let typewriterTimer = null;

// === Typewriter (matches animal-island-ui Typewriter component: preserves HTML, 90ms) ===
// Counts total plain-text length across all text nodes in a DOM fragment
function countText(root) {
  let n = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) n += walker.currentNode.textContent.length;
  return n;
}

// Recursively truncate text nodes so total visible chars <= limit
function truncateTextNodes(root, limit) {
  let remaining = limit;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (remaining <= 0) { node.textContent = ''; continue; }
    const len = node.textContent.length;
    if (len <= remaining) { remaining -= len; continue; }
    node.textContent = node.textContent.slice(0, remaining);
    remaining = 0;
  }
}

// Clone source HTML, truncate to 'count' visible chars, return HTML string
function renderTruncated(sourceHTML, count) {
  const tmpl = document.createElement('div');
  tmpl.innerHTML = sourceHTML;
  truncateTextNodes(tmpl, count);
  return tmpl.innerHTML;
}

function typewrite(html, el, speed = 90) {
  if (typewriterTimer) clearTimeout(typewriterTimer);
  const total = (function() {
    const d = document.createElement('div'); d.innerHTML = html;
    return countText(d);
  })();
  let i = 0;
  el.innerHTML = '';
  function tick() {
    if (i < total) {
      i++;
      el.innerHTML = renderTruncated(html, i);
      // Animalese chirp per character
      const tmp = document.createElement('div'); tmp.innerHTML = renderTruncated(html, i);
      const txt = tmp.textContent || '';
      if (txt) animalese(txt[txt.length - 1]);
      typewriterTimer = setTimeout(tick, speed);
    }
    // Done — full HTML rendered, no cursor
  }
  tick();
}

// === Sound effect (Web Audio chime) ===
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function chime(freq = 800, duration = 0.15) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + duration);
  } catch(e) {}
}

// === Real Animalese audio (from animalese-typing extension, MIT license) ===
const ANIMALESE_BUFFERS = {};
let animaleseLoaded = false;
let animaleseLoading = false;

function loadAnimalese() {
  if (animaleseLoaded || animaleseLoading) return;
  animaleseLoading = true;
  const ctx = getCtx();
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const base = 'animalese/';
  let loaded = 0;
  for (const l of letters) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', base + l + '.aac', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        ctx.decodeAudioData(xhr.response, function(audio) {
          ANIMALESE_BUFFERS[l] = audio;
          loaded++;
          if (loaded >= letters.length) animaleseLoaded = true;
        }, function() {});
      }
    };
    xhr.onerror = function() {};
    xhr.send();
  }
}

// Shared gain node + track last source for instant cutoff
let animaleseGainNode = null;
let animalesePrevSrc = null;

function animalese(char) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
    // Lazy-load if not started
    if (!animaleseLoaded && !animaleseLoading) loadAnimalese();
    const now = ctx.currentTime;
    // Kill previous sound instantly
    if (animalesePrevSrc) {
      try { animalesePrevSrc.stop(now); } catch(_) {}
      animalesePrevSrc = null;
    }
    const lower = char.toLowerCase();
    let buffer = ANIMALESE_BUFFERS[lower];
    if (!buffer) {
      const keys = Object.keys(ANIMALESE_BUFFERS);
      if (keys.length) {
        buffer = ANIMALESE_BUFFERS[keys[Math.floor(Math.random() * keys.length)]];
      } else {
        // Fallback: chime if animalese not yet loaded
        chime(600 + Math.random() * 400, 0.08);
        return;
      }
    }
    if (!animaleseGainNode) {
      animaleseGainNode = ctx.createGain();
      animaleseGainNode.connect(ctx.destination);
    }
    animaleseGainNode.gain.setValueAtTime(0.25, now);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.detune.value = (Math.random() * 200 - 100);
    src.connect(animaleseGainNode);
    src.start(now);
    animalesePrevSrc = src;
  } catch(e) {}
}

// Penguin click → random greeting + bounce + chime + retype
penguin.addEventListener('click', () => {
  // Resume AudioContext on user interaction (autoplay policy)
  const ctx = getCtx();
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
  // Lazy-load animalese if not yet loaded
  if (!animaleseLoaded && !animaleseLoading) loadAnimalese();
  if (greetings.length > 0) greetingFull = greetings[Math.floor(Math.random() * greetings.length)];
  penguin.style.animation = 'none';
  penguin.offsetHeight;
  penguin.style.animation = 'float 3s ease-in-out infinite';
  chime(880, 0.12);
  typewrite(greetingFull, greeting, 90);
});

// Dialog option → scroll to section + dismiss overlay + chime
document.querySelectorAll('.dodo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    overlay.classList.add('dismissed');
    chime(660, 0.18);
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 400);
      }
    }
  });
});

// Also dismiss overlay when clicking background
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.classList.add('dismissed');
});

// Keyboard: Escape dismisses
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') overlay.classList.add('dismissed');
});

// === Passport Message Board ===
const STORAGE_KEY = 'ayu-passports-v1';

// AC-style villager avatars — drawn images
const VILLAGERS = [
  { id:'dog',     img:'avatars/dog.png' },
  { id:'cat1',    img:'avatars/cat1.png' },
  { id:'rabbit',  img:'avatars/rabbit.png' },
  { id:'bear',    img:'avatars/bear.png' },
  { id:'frog',    img:'avatars/frog.png' },
  { id:'penguin', img:'avatars/penguin.png' },
  { id:'sheep',   img:'avatars/sheep.png' },
  { id:'duck',    img:'avatars/duck.png' },
  { id:'cat2',    img:'avatars/cat2.png' },
  { id:'squirrel',img:'avatars/squirrel.png' },
  { id:'hamster', img:'avatars/hamster.png' },
  { id:'bird',    img:'avatars/bird.png' },
];

let selectedVillager = VILLAGERS[0];

// Build villager avatar grid
const emojiGrid = document.getElementById('pfEmojiGrid');
VILLAGERS.forEach((v, i) => {
  const btn = document.createElement('button');
  btn.className = 'pf-villager-btn';
  btn.innerHTML = `<img src="${v.img}" alt="${v.id}" class="pf-v-thumb">`;
  btn.addEventListener('click', () => {
    selectedVillager = v;
    updateAvatarPreview(v);
    emojiGrid.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chime(1040, 0.08);
  });
  if (i === 0) btn.classList.add('active');
  emojiGrid.appendChild(btn);
});

function updateAvatarPreview(v) {
  const preview = document.getElementById('pfAvatarPreview');
  preview.innerHTML = `<img src="${v.img}" alt="${v.id}" class="pf-preview-img">`;
}

// Load existing passports
function loadPassports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch(e) { return []; }
}

function savePassports(passports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passports));
}

function renderWall() {
  const wall = document.getElementById('passportWall');
  const passports = loadPassports();
  if (!passports.length) {
    wall.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1;padding:40px">还没有岛民护照…来做第一个留言的人吧 🐧</p>';
    return;
  }
  wall.innerHTML = passports.map((p, i) => `
    <div class="visitor-passport">
      <div class="vp-avatar"><img src="${esc(p.img)}" alt="" class="vp-img"></div>
      <div class="vp-info">
        <div class="vp-name">${esc(p.name)}</div>
        <div class="vp-time">${p.time}</div>
        <div class="vp-message">${esc(p.message)}</div>
      </div>
      <button class="vp-delete" onclick="deletePassport(${i})" title="删除">✕</button>
    </div>
  `).reverse().join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

window.deletePassport = function(index) {
  if (!confirm('确定要删除这条护照吗？')) return;
  const passports = loadPassports();
  // Reverse index since wall shows newest first
  const realIndex = passports.length - 1 - index;
  passports.splice(realIndex, 1);
  savePassports(passports);
  renderWall();
  chime(440, 0.2);
};

document.getElementById('pfSubmit').addEventListener('click', () => {
  const name = document.getElementById('pfName').value.trim();
  const message = document.getElementById('pfMessage').value.trim();
  if (!name) { document.getElementById('pfName').focus(); return; }
  if (!message) { document.getElementById('pfMessage').focus(); return; }

  const now = new Date();
  const time = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const passports = loadPassports();
  passports.push({ name, message, img: selectedVillager.img, time });
  savePassports(passports);
  renderWall();

  // Reset form
  document.getElementById('pfName').value = '';
  document.getElementById('pfMessage').value = '';
  selectedVillager = VILLAGERS[0];
  updateAvatarPreview(VILLAGERS[0]);
  emojiGrid.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  emojiGrid.querySelector('button').classList.add('active');

  chime(660, 0.2);
  setTimeout(() => chime(880, 0.15), 150);
});

// Init
updateAvatarPreview(VILLAGERS[0]);
renderWall();

// === Animalese on passport form input ===
['pfName','pfMessage'].forEach(function(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1) animalese(e.key);
  });
});

// ===== SITE DATA LOADER (shared admin/index) =====

// === Dynamic Gallery — reads from localStorage (fallback to data.json) ===
var AYU_WORKS_KEY = 'ayu-works-admin';
var IMG_DB = null;

function openImgDB(cb) {
  if (IMG_DB) { cb(IMG_DB); return; }
  var req = indexedDB.open('ayu-images', 1);
  req.onupgradeneeded = function(e) { e.target.result.createObjectStore('images'); };
  req.onsuccess = function(e) { IMG_DB = e.target.result; cb(IMG_DB); };
  req.onerror = function() { cb(null); };
}

function resolveImgSrc(src, callback) {
  if (!src || src.indexOf('imgdb:') !== 0) { callback(src); return; }
  var key = src.slice(6);
  openImgDB(function(db) {
    if (!db) { callback(''); return; }
    var tx = db.transaction('images', 'readonly');
    var get = tx.objectStore('images').get(key);
    get.onsuccess = function() {
      callback(get.result ? URL.createObjectURL(get.result) : '');
    };
    get.onerror = function() { callback(''); };
  });
}

function loadWorks() {
  // Always load from data.json — no localStorage caching
  // (caching caused stale/garbled data issues)
  return null;
}

function seedFromJSON(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'data.json', true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data && data.length) {
          callback(data);
          return;
        }
      } catch(e) {}
    }
    callback([]);
  };
  xhr.onerror = function() { callback([]); };
  xhr.send();
}

function renderGallery(works) {
  var track = document.getElementById('galleryTrack');
  if (!track) return;

  // Build works map for detail overlay
  if (window._ayuBuildWorksMap) window._ayuBuildWorksMap(works);

  var html = '';
  var total = works.length;
  if (!total) {
    html = '<div class="memo-card"><div class="memo-img memo-img-empty"><span>📸</span></div><div class="memo-body"><h3>更多创作中…</h3><p>新的插画和设计作品正在路上。</p><div class="memo-footer"><span class="memo-date">…</span><button class="memo-detail-btn" disabled>敬请期待</button></div></div></div>';
    track.innerHTML = html;
    return;
  }

  works.forEach(function(w, idx) {
    html += '<div class="memo-card" data-work-id="' + w.id + '">' +
      '<div class="memo-img" id="memoImg' + idx + '"><span>📸</span></div>' +
      '<div class="memo-body">' +
        '<h3>' + (w.title || '') + '</h3>' +
        '<p>' + (w.summary || '') + '</p>' +
        '<div class="memo-footer">' +
          '<span class="memo-date">' + (w.date || '') + '</span>' +
          '<button class="memo-detail-btn">作品详情 ▸</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  // Always append placeholder
  html += '<div class="memo-card"><div class="memo-img memo-img-empty"><span>📸</span></div><div class="memo-body"><h3>更多创作中…</h3><p>新的插画和设计作品正在路上。</p><div class="memo-footer"><span class="memo-date">…</span><button class="memo-detail-btn" disabled>敬请期待</button></div></div></div>';

  track.innerHTML = html;

  // Resolve images asynchronously
  works.forEach(function(w, idx) {
    resolveImgSrc(w.imgMain, function(src) {
      if (src) {
        var el = document.getElementById('memoImg' + idx);
        if (el) el.innerHTML = '<img src="' + src + '" alt="' + (w.title || '') + '">';
      }
    });
  });
}

// Init: load works and render gallery
(function initGallery() {
  var data = loadWorks();
  if (data) {
    renderGallery(data);
  } else {
    seedFromJSON(function(data) {
      renderGallery(data);
    });
  }
})();

// === Gallery scroll arrows ===
(function() {
  var track = document.getElementById('galleryTrack');
  var leftBtn = document.querySelector('.gallery-arrow-left');
  var rightBtn = document.querySelector('.gallery-arrow-right');
  if (!track || !leftBtn || !rightBtn) return;
  var scrollAmount = 248;
  leftBtn.addEventListener('click', function() { track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); });
  rightBtn.addEventListener('click', function() { track.scrollBy({ left: scrollAmount, behavior: 'smooth' }); });
  // Keyboard arrows when gallery is in view
  document.addEventListener('keydown', function(e) {
    var rect = track.getBoundingClientRect();
    var inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: scrollAmount, behavior: 'smooth' }); }
  });
})();

// === Work Detail — Scrapbook Collage ===
(function() {
  var overlay = document.getElementById('workDetailOverlay');
  if (!overlay) return;

  // Dynamic works map — populated by loadWorks() from localStorage
  window._ayuWorksMap = {};

  function buildMap(data) {
    window._ayuWorksMap = {};
    data.forEach(function(w) { window._ayuWorksMap[w.id] = w; });
  }

  function open(id) {
    var w = window._ayuWorksMap[id]; if (!w) return;
    document.getElementById('spTitle').textContent = w.title;
    document.getElementById('spDate').textContent = w.date;
    document.getElementById('spTags').innerHTML = (w.tags || []).map(function(t) {
      return '<span class="card-tag">' + t + '</span>';
    }).join('');
    // Resolve hero image
    resolveImgSrc(w.imgMain, function(src) {
      document.getElementById('spHeroImg').src = src || '';
    });
    document.getElementById('spDesc').innerHTML = w.desc || '';
    // Resolve extra images
    var extra = document.getElementById('spExtra');
    extra.innerHTML = '';
    (w.extra || []).forEach(function(src) {
      resolveImgSrc(src, function(resolved) {
        if (resolved) {
          extra.innerHTML += '<img src="' + resolved + '" alt="">';
        }
      });
    });
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Event delegation — any gallery card button triggers open via data-work-id
  document.getElementById('galleryTrack').addEventListener('click', function(e) {
    var btn = e.target.closest('.memo-detail-btn');
    if (!btn || btn.disabled) return;
    var card = btn.closest('.memo-card');
    if (!card) return;
    var id = card.dataset.workId;
    if (id) open(id);
  });

  document.getElementById('workDetailBack').addEventListener('click', close);
  document.getElementById('workDetailBack2').addEventListener('click', close);
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });

  window._ayuBuildWorksMap = buildMap;
})();

// === Like button ===
var likeCount = 0;
var liked = false;
function toggleLike() {
  var btn = document.getElementById('spLikeBtn');
  var count = document.getElementById('likeCount');
  var heart = btn.querySelector('.like-heart');
  liked = !liked;
  if (liked) {
    likeCount++;
    btn.classList.add('liked');
    heart.textContent = '💗';
    chime(880, 0.15);
  } else {
    likeCount = Math.max(0, likeCount - 1);
    btn.classList.remove('liked');
    heart.textContent = '🤍';
  }
  count.textContent = likeCount;
}

// === Loading splash ===
(function() {
  const splash = document.getElementById('loadingSplash');
  const fill = document.getElementById('loadingFill');
  if (!splash) return;
  let dismissed = false;

  // Start progress bar fill: 0% → 100% over ~2s
  function startProgress() {
    let pct = 0;
    const interval = setInterval(() => {
      pct += 2;
      if (pct >= 100) { pct = 100; clearInterval(interval); }
      if (fill) fill.style.width = pct + '%';
    }, 40);
  }
  startProgress();

  function dismiss() {
    if (dismissed || !splash.parentNode) return;
    dismissed = true;
    if (fill) fill.style.width = '100%';
    splash.classList.add('reveal');
    // Pre-load animalese + start typewriter as mask reveals
    loadAnimalese();
    // Start typewriter shortly after — animalese loads async via XHR
    setTimeout(function() { typewrite(greetingFull, greeting, 90); }, 300);
    setTimeout(() => { if (splash.parentNode) splash.remove(); }, 700);
  }

  if (document.readyState === 'complete') {
    setTimeout(dismiss, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(dismiss, 2000));
  }

  setTimeout(() => { if (!dismissed) dismiss(); }, 8000);
})();