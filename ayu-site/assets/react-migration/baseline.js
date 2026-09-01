// === Entry dialog interaction ===
const overlay = document.getElementById('entryOverlay');
const penguin = document.getElementById('entryPenguin');
const greeting = document.getElementById('greeting');

var greetings = [];

// === Site Data Loader (shared with admin.html) ===
var SITE_DATA_KEY = 'ayu-site-data';

function loadSiteData() {
  var stored = localStorage.getItem(SITE_DATA_KEY);
  if (stored) { try { var d = JSON.parse(stored); if (d) return d; } catch(e) {} }
  return null;
}

function getFreshContactLinks(siteData) {
  return [
    {
      platform: '邮箱',
      url: 'mailto:924386950@qq.com',
      icon: '✉️',
      hint: '924386950@qq.com'
    },
    {
      platform: 'GitHub',
      url: 'https://github.com/yuanxuru-oss',
      icon: '🐙',
      hint: 'yuanxuru-oss'
    },
    {
      platform: '小红书',
      url: 'https://www.xiaohongshu.com/user/profile/6267928c000000002102667b',
      icon: '📕',
      hint: '阿鱼 Ayu'
    }
  ];
}

function seedSiteData(callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'site-data.json?updated=' + Date.now(), true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) {
      try {
        var d = JSON.parse(xhr.responseText);
        // Only seed if site-data.json has real content (passport.name is non-empty)
        if (d && d.passport && d.passport.name) {
          localStorage.setItem(SITE_DATA_KEY, JSON.stringify(d));
          callback(d);
          return;
        }
      } catch(e) {}
    }
    callback(null);
  };
  xhr.onerror = function() { callback(null); };
  xhr.send();
}

// Keep published project and highlight data current even when this browser has an older cache.
function refreshPublishedSiteData(siteData) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'site-data.json?updated=' + Date.now(), true);
  xhr.onload = function() {
    if (xhr.status !== 200 && xhr.status !== 0) return;
    try {
      var fresh = JSON.parse(xhr.responseText);
      if (!fresh) return;
      if (Array.isArray(fresh.projects)) siteData.projects = fresh.projects;
      if (Array.isArray(fresh.competitions)) siteData.competitions = fresh.competitions;
      if (Array.isArray(fresh.socialLinks)) siteData.socialLinks = fresh.socialLinks;
      localStorage.setItem(SITE_DATA_KEY, JSON.stringify(siteData));
      renderAll(siteData);
    } catch (e) {}
  };
  xhr.send();
}

function renderAll(siteData) {
  if (!siteData) return;
  
  // Hero
  if (siteData.hero) {
    var h = siteData.hero;
    var reactHero = new URLSearchParams(window.location.search).get('react-hero') === '1';
    if (!reactHero) {
      var el = document.getElementById('heroHint'); if (el) el.textContent = h.hint || '';
      el = document.getElementById('heroTitle'); if (el) el.textContent = h.title || '';
      el = document.getElementById('heroSub'); if (el) el.textContent = h.subtitle || '';
    }
    if (h.greetings && h.greetings.length) { greetings = h.greetings.slice(); greetingFull = greetings[Math.floor(Math.random() * greetings.length)]; }
  }
  
  // Passport fields follow the same opt-in migration pattern as card lists.
  var reactPassport = new URLSearchParams(window.location.search).get('react-passport') === '1';
  if (siteData.passport && !reactPassport) {
    var p = siteData.passport;
    var el = document.getElementById('pfNameVal'); if (el) el.textContent = p.name || '';
    el = document.getElementById('pfIslandVal'); if (el) el.textContent = p.island || '';
    el = document.getElementById('pfRoleVal'); if (el) el.textContent = p.role || '';
    el = document.getElementById('pfMottoVal'); if (el) el.textContent = p.motto || '';
  }
  
  // Projects remain in this baseline renderer until the React section is
  // explicitly enabled for this preview iframe.
  var reactProjects = new URLSearchParams(window.location.search).get('react-projects') === '1';
  if (siteData.projects && !reactProjects) {
    var grid = document.getElementById('projectsGrid');
    if (grid) {
      grid.innerHTML = siteData.projects.map(function(proj) {
        var tagsHtml = (proj.tags || []).map(function(t) { return '<span class="card-tag">' + t + '</span>'; }).join('');
        var linkHtml = proj.link 
          ? '<a href="' + proj.link + '" target="_blank" class="card-link">' + (proj.linkText || '→') + '</a>'
          : '<span class="card-link" style="cursor:default;opacity:0.7">' + (proj.linkText || '') + '</span>';
        return '<div class="item-card">' +
          '<div class="card-tags">' + tagsHtml + '</div>' +
          '<h3>' + (proj.title || '') + '</h3>' +
          '<p>' + (proj.desc || '') + '</p>' +
          linkHtml + '</div>';
      }).join('');
    }
  }
  
  // Competitions follow the same opt-in migration pattern as projects.
  var reactCompetitions = new URLSearchParams(window.location.search).get('react-competitions') === '1';
  if (siteData.competitions && !reactCompetitions) {
    var grid = document.getElementById('competitionsGrid');
    if (grid) {
      var sortedCompetitions = siteData.competitions.slice().sort(function(a, b) {
        function yearOf(item) {
          var match = (item.tags || []).join(' ').match(/\b(20\d{2})\b/);
          return match ? Number(match[1]) : 0;
        }
        return yearOf(b) - yearOf(a);
      });
      grid.innerHTML = sortedCompetitions.map(function(comp) {
        var tagsHtml = (comp.tags || []).map(function(t) { return '<span class="card-tag">' + t + '</span>'; }).join('');
        var descHtml = comp.desc ? '<p>' + comp.desc + '</p>' : '';
        return '<div class="item-card">' +
          '<div class="card-tags">' + tagsHtml + '</div>' +
          '<h3>' + (comp.title || '') + '</h3>' +
          descHtml +
          '<span class="card-link" style="cursor:default">' + (comp.status || '') + '</span>' +
        '</div>';
      }).join('');
    }
  }
  
  // Contact cards can be rendered by React without changing their container or CSS.
  var reactSocialLinks = new URLSearchParams(window.location.search).get('react-social-links') === '1';
  if (siteData.socialLinks && !reactSocialLinks) {
    var container = document.getElementById('socialLinksContainer');
    if (container) {
      var socialLinks = siteData.socialLinks;
      if (!socialLinks || socialLinks.length < 3) {
        socialLinks = getFreshContactLinks(siteData);
        try {
          siteData.socialLinks = socialLinks;
          localStorage.setItem(SITE_DATA_KEY, JSON.stringify(siteData));
        } catch (e) {}
      }
      container.innerHTML = socialLinks.map(function(link) {
        return '<a href="' + link.url + '" target="_blank" class="contact-link-card">' +
          '<span class="cl-icon">' + (link.icon || '🔗') + '</span>' +
          '<span class="cl-label">' + (link.platform || '') + '</span>' +
          '<span class="cl-hint">' + (link.hint || '') + '</span></a>';
      }).join('');
    }
  }
}

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
// Uses XMLHttpRequest instead of fetch — works under file:// protocol
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
    if (target === 'resume') {
      document.getElementById('resume').classList.add('open');
      document.body.style.overflow = 'hidden';
      return;
    }
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 400);
      }
    }
  });
});

// Resume entry opens as a compact overlay so it never adds a long page section.
const resumeOverlay = document.getElementById('resume');
const closeResume = () => { resumeOverlay.classList.remove('open'); document.body.style.overflow = ''; };
document.querySelectorAll('[data-open-resume]').forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  resumeOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}));
document.getElementById('resumeClose').addEventListener('click', closeResume);
resumeOverlay.addEventListener('click', (e) => { if (e.target === resumeOverlay) closeResume(); });

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
// SITE_DATA_KEY, loadSiteData(), seedSiteData(), renderAll() defined above

// === Dynamic Gallery — reads from localStorage (shared with admin.html) ===
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

function escapeHTML(value) {
  var d = document.createElement('div');
  d.textContent = value == null ? '' : String(value);
  return d.innerHTML;
}

function renderRichText(value) {
  return escapeHTML(value).replace(/\n/g, '<br>');
}

function loadWorks() {
  var stored = localStorage.getItem(AYU_WORKS_KEY);
  if (stored) {
    try {
      var data = JSON.parse(stored);
      if (data && data.length) return data;
    } catch(e) {}
  }
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
          localStorage.setItem(AYU_WORKS_KEY, JSON.stringify(data));
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

// --- 渲染画廊卡片 ---

function getWorkCategories(work) {
  var tags = (work.tags || []).map(function(tag) {
    return String(tag).toLowerCase();
  });
  var text = (tags.join(' ') + ' ' + (work.title || '') + ' ' + (work.summary || '')).toLowerCase();
  var cats = [];

  function add(cat) {
    if (cats.indexOf(cat) === -1) cats.push(cat);
  }

  if (tags.some(function(tag) { return tag === 'ip' || tag.indexOf('ip') !== -1 || tag.indexOf('品牌') !== -1; })) add('ip');
  if (tags.some(function(tag) { return tag.indexOf('插画') !== -1 || tag.indexOf('治愈') !== -1; })) add('illust');
  if (tags.some(function(tag) { return tag.indexOf('非遗') !== -1; }) || text.indexOf('海丝') !== -1 || text.indexOf('刺桐') !== -1) add('heritage');

  if (!cats.length) add('illust');
  return cats;
}

function tagClass(index) {
  return ['tag-mint', 'tag-yellow', 'tag-orange'][index % 3];
}

function renderGalleryTags(tags) {
  return (tags || []).map(function(tag, index) {
    return '<span class="tag ' + tagClass(index) + '">' + escapeHTML(tag) + '</span>';
  }).join('');
}

var PLACEHOLDER_CARD = '<div class="memo-card empty" data-cats="illust">' +
  '<div class="memo-img memo-img-empty"><span>🖌️</span></div>' +
  '<div class="memo-body">' +
    '<h3>更多创作中…</h3>' +
    '<div class="memo-tags"><span class="tag tag-mint">插画</span></div>' +
    '<p>新的插画和设计作品正在路上。</p>' +
    '<div class="memo-footer">' +
      '<span class="memo-date">coming soon</span>' +
      '<button class="memo-detail-btn" disabled>敬请期待</button>' +
    '</div>' +
  '</div>' +
'</div>';

function applyGalleryFilter(filter) {
  document.querySelectorAll('#galleryTrack .memo-card[data-cats]').forEach(function(card) {
    var cats = (card.dataset.cats || '').split(/\s+/);
    card.style.display = filter === 'all' || cats.indexOf(filter) !== -1 ? '' : 'none';
  });
}

function renderGallery(works) {
  var track = document.getElementById('galleryTrack');
  if (!track) return;

  if (window._ayuBuildWorksMap) window._ayuBuildWorksMap(works);

  if (!works.length) {
    track.innerHTML = PLACEHOLDER_CARD;
    return;
  }

  var html = '';
  works.forEach(function(w, idx) {
    html += '<div class="memo-card" data-cats="' + escapeHTML(getWorkCategories(w).join(' ')) + '" data-work-id="' + escapeHTML(w.id) + '">' +
      '<div class="memo-img" id="memoImg' + idx + '"><span>📸</span></div>' +
      '<div class="memo-body">' +
        '<h3>' + escapeHTML(w.title || '') + '</h3>' +
        '<div class="memo-tags">' + renderGalleryTags(w.tags || []) + '</div>' +
        '<p>' + escapeHTML(w.summary || '') + '</p>' +
        '<div class="memo-footer">' +
          '<span class="memo-date">' + escapeHTML(w.date || '') + '</span>' +
          '<button class="memo-detail-btn">作品详情 ▸</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  html += PLACEHOLDER_CARD;
  track.innerHTML = html;

  works.forEach(function(w, idx) {
    resolveImgSrc(w.imgMain, function(src) {
      if (src) {
        var el = document.getElementById('memoImg' + idx);
        if (el) el.innerHTML = '<img src="' + escapeHTML(src) + '" alt="' + escapeHTML(w.title || '') + '">';
      }
    });
  });

  var active = document.querySelector('.gallery-filter-tag.active');
  applyGalleryFilter(active ? active.dataset.filter : 'all');
}

var reactGallery = new URLSearchParams(window.location.search).get('react-gallery') === '1';

if (!reactGallery) (function initGallery() {
  function boot() {
    var data = loadWorks();
    if (data) {
      renderGallery(data);
    } else {
      seedFromJSON(function(seedData) {
        renderGallery(seedData);
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

function initGalleryFilters() {
  document.querySelectorAll('.gallery-filter-tag').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gallery-filter-tag').forEach(function(item) {
        item.classList.remove('active');
      });
      btn.classList.add('active');
      applyGalleryFilter(btn.dataset.filter || 'all');
    });
  });
}

if (!reactGallery) initGalleryFilters();

// === Work Detail — Scrapbook Collage ===
if (!reactGallery) (function() {
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

// React keeps the gallery data and content in sync. The page shell still owns
// these two pre-existing return buttons, so close the shell directly in React
// gallery mode to retain the original interaction outside React's portal tree.
if (reactGallery) {
  function closeReactGalleryDetail() {
    var overlay = document.getElementById('workDetailOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('workDetailBack').addEventListener('click', closeReactGalleryDetail);
  document.getElementById('workDetailBack2').addEventListener('click', closeReactGalleryDetail);
}

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

// === Init site data ===
(function initSite() {
  var data = loadSiteData();
  if (data) {
    if (!data.socialLinks || data.socialLinks.length < 3) {
      data.socialLinks = getFreshContactLinks(data);
      try { localStorage.setItem(SITE_DATA_KEY, JSON.stringify(data)); } catch (e) {}
    }
    renderAll(data);
    refreshPublishedSiteData(data);
  } else {
    seedSiteData(function(data) {
      if (data) {
        if (!data.socialLinks || data.socialLinks.length < 3) {
          data.socialLinks = getFreshContactLinks(data);
          try { localStorage.setItem(SITE_DATA_KEY, JSON.stringify(data)); } catch (e) {}
        }
        renderAll(data);
        refreshPublishedSiteData(data);
      }
    });
  }
})();

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
