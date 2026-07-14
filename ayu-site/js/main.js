// ╔══════════════════════════════════════════════════════════╗
// ║          阿鱼小岛 · main.js                              ║
// ║          入口对话 / 音效 / 护照 / 画廊 / 加载动画          ║
// ╚══════════════════════════════════════════════════════════╝


// ============================================================
//  1. 入口对话 & 打字机效果
// ============================================================

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

// --- 打字机核心 ---

function countText(root) {
  let n = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) n += walker.currentNode.textContent.length;
  return n;
}

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

function renderTruncated(sourceHTML, count) {
  const tmpl = document.createElement('div');
  tmpl.innerHTML = sourceHTML;
  truncateTextNodes(tmpl, count);
  return tmpl.innerHTML;
}

function typewrite(html, el, speed) {
  speed = speed || 90;
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
      const tmp = document.createElement('div'); tmp.innerHTML = renderTruncated(html, i);
      const txt = tmp.textContent || '';
      if (txt) animalese(txt[txt.length - 1]);
      typewriterTimer = setTimeout(tick, speed);
    }
  }
  tick();
}

// --- 入口交互 ---

penguin.addEventListener('click', function() {
  var ctx = getCtx();
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
  if (!animaleseLoaded && !animaleseLoading) loadAnimalese();
  if (greetings.length > 0) greetingFull = greetings[Math.floor(Math.random() * greetings.length)];
  penguin.style.animation = 'none';
  penguin.offsetHeight;
  penguin.style.animation = 'float 3s ease-in-out infinite';
  chime(880, 0.12);
  typewrite(greetingFull, greeting, 90);
});

document.querySelectorAll('.dodo-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var target = btn.dataset.target;
    overlay.classList.add('dismissed');
    chime(660, 0.18);
    if (target) {
      var el = document.getElementById(target);
      if (el) setTimeout(function() { el.scrollIntoView({ behavior: 'smooth' }); }, 400);
    }
  });
});

overlay.addEventListener('click', function(e) {
  if (e.target === overlay) overlay.classList.add('dismissed');
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') overlay.classList.add('dismissed');
});


// ============================================================
//  2. 音效系统 (Web Audio)
// ============================================================

var audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function chime(freq, duration) {
  freq = freq || 800;
  duration = duration || 0.15;
  try {
    var ctx = getCtx();
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + duration);
  } catch(e) {}
}


// ============================================================
//  3. Animalese 动物语音效
// ============================================================

var ANIMALESE_BUFFERS = {};
var animaleseLoaded = false;
var animaleseLoading = false;

function loadAnimalese() {
  if (animaleseLoaded || animaleseLoading) return;
  animaleseLoading = true;
  var ctx = getCtx();
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
  var letters = 'abcdefghijklmnopqrstuvwxyz';
  var base = 'animalese/';
  var loaded = 0;
  for (var i = 0; i < letters.length; i++) {
    var l = letters[i];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', base + l + '.aac', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = (function(letter) {
      return function() {
        if (this.status === 200 || this.status === 0) {
          ctx.decodeAudioData(this.response, function(audio) {
            ANIMALESE_BUFFERS[letter] = audio;
            loaded++;
            if (loaded >= letters.length) animaleseLoaded = true;
          }, function() {});
        }
      };
    })(l);
    xhr.onerror = function() {};
    xhr.send();
  }
}

var animaleseGainNode = null;
var animalesePrevSrc = null;

function animalese(char) {
  try {
    var ctx = getCtx();
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
    if (!animaleseLoaded && !animaleseLoading) loadAnimalese();
    var now = ctx.currentTime;
    if (animalesePrevSrc) {
      try { animalesePrevSrc.stop(now); } catch(_) {}
      animalesePrevSrc = null;
    }
    var lower = char.toLowerCase();
    var buffer = ANIMALESE_BUFFERS[lower];
    if (!buffer) {
      var keys = Object.keys(ANIMALESE_BUFFERS);
      if (keys.length) {
        buffer = ANIMALESE_BUFFERS[keys[Math.floor(Math.random() * keys.length)]];
      } else {
        chime(600 + Math.random() * 400, 0.08);
        return;
      }
    }
    if (!animaleseGainNode) {
      animaleseGainNode = ctx.createGain();
      animaleseGainNode.connect(ctx.destination);
    }
    animaleseGainNode.gain.setValueAtTime(0.25, now);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.detune.value = (Math.random() * 200 - 100);
    src.connect(animaleseGainNode);
    src.start(now);
    animalesePrevSrc = src;
  } catch(e) {}
}


// ============================================================
//  4. 护照留言板
// ============================================================

var STORAGE_KEY = 'ayu-passports-v1';

var VILLAGERS = [
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
  { id:'bird',    img:'avatars/bird.png' }
];

var selectedVillager = VILLAGERS[0];

var emojiGrid = document.getElementById('pfEmojiGrid');
VILLAGERS.forEach(function(v, i) {
  var btn = document.createElement('button');
  btn.className = 'pf-villager-btn';
  btn.innerHTML = '<img src="' + v.img + '" alt="' + v.id + '" class="pf-v-thumb">';
  btn.addEventListener('click', function() {
    selectedVillager = v;
    updateAvatarPreview(v);
    emojiGrid.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    chime(1040, 0.08);
  });
  if (i === 0) btn.classList.add('active');
  emojiGrid.appendChild(btn);
});

function updateAvatarPreview(v) {
  var preview = document.getElementById('pfAvatarPreview');
  preview.innerHTML = '<img src="' + v.img + '" alt="' + v.id + '" class="pf-preview-img">';
}

function loadPassports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e) { return []; }
}

function savePassports(passports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passports));
}

function esc(str) {
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderWall() {
  var wall = document.getElementById('passportWall');
  var passports = loadPassports();
  if (!passports.length) {
    wall.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1;padding:40px">还没有岛民护照…来做第一个留言的人吧 🐧</p>';
    return;
  }
  wall.innerHTML = passports.map(function(p, i) {
    return '<div class="visitor-passport">' +
      '<div class="vp-avatar"><img src="' + esc(p.img) + '" alt="" class="vp-img"></div>' +
      '<div class="vp-info">' +
        '<div class="vp-name">' + esc(p.name) + '</div>' +
        '<div class="vp-time">' + p.time + '</div>' +
        '<div class="vp-message">' + esc(p.message) + '</div>' +
      '</div>' +
      '<button class="vp-delete" onclick="deletePassport(' + i + ')" title="删除">✕</button>' +
    '</div>';
  }).reverse().join('');
}

window.deletePassport = function(index) {
  if (!confirm('确定要删除这条护照吗？')) return;
  var passports = loadPassports();
  var realIndex = passports.length - 1 - index;
  passports.splice(realIndex, 1);
  savePassports(passports);
  renderWall();
  chime(440, 0.2);
};

document.getElementById('pfSubmit').addEventListener('click', function() {
  var name = document.getElementById('pfName').value.trim();
  var message = document.getElementById('pfMessage').value.trim();
  if (!name) { document.getElementById('pfName').focus(); return; }
  if (!message) { document.getElementById('pfMessage').focus(); return; }

  var now = new Date();
  var time = now.getFullYear() + '.' +
    String(now.getMonth()+1).padStart(2,'0') + '.' +
    String(now.getDate()).padStart(2,'0') + ' ' +
    String(now.getHours()).padStart(2,'0') + ':' +
    String(now.getMinutes()).padStart(2,'0');

  var passports = loadPassports();
  passports.push({ name: name, message: message, img: selectedVillager.img, time: time });
  savePassports(passports);
  renderWall();

  document.getElementById('pfName').value = '';
  document.getElementById('pfMessage').value = '';
  selectedVillager = VILLAGERS[0];
  updateAvatarPreview(VILLAGERS[0]);
  emojiGrid.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
  emojiGrid.querySelector('button').classList.add('active');

  chime(660, 0.2);
  setTimeout(function() { chime(880, 0.15); }, 150);
});

// 护照输入时播放 Animalese
['pfName','pfMessage'].forEach(function(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('keydown', function(e) {
    if (e.key.length === 1) animalese(e.key);
  });
});

// 初始化
updateAvatarPreview(VILLAGERS[0]);
renderWall();


// ============================================================
//  5. 创作画廊
// ============================================================

// --- IndexedDB 图片存储 (admin 后台用) ---

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

// --- 从 data.json 加载作品 ---
// 内嵌数据作为 file:// 预览兜底，日常内容以 data.json 为准。

var EMBEDDED_WORKS = [
  {
    "id": "work-1783856077057-572",
    "title": "双子星·刺桐双子星",
    "date": "2025.10",
    "imgMain": "works/image (14)_thumb.jpg",
    "tags": ["非遗", "IP"],
    "summary": "以泉州刺桐文化为灵感，把城市记忆转译成一对可延展的双子星 IP。",
    "desc": "刺桐双子星围绕泉州城市花与海丝文化展开，用成对角色承载传统与新生两种气质。",
    "caseStudy": {
      "oneLiner": "一组把泉州刺桐意象变成可亲近角色的城市文化 IP。",
      "inspiration": "灵感来自刺桐花、泉州海丝记忆和城市地标感。",
      "visualSystem": "角色以“双子”关系建立记忆点，一个偏温柔守护，一个偏明亮行动。",
      "tools": "AI 辅助概念发散、角色方向探索、细节修订。",
      "extension": "可延展为文旅导览角色、城市节庆主视觉、集章卡和贴纸包。"
    },
    "extra": ["works/双子星1_extra.jpg", "works/双子星2_extra.jpg", "works/双子星3_extra.jpg"]
  },
  {
    "id": "work-1783908155067-silk",
    "title": "丝路远航",
    "date": "2025.10",
    "imgMain": "works/silk-voyage-cover.png",
    "tags": ["插画", "非遗", "IP"],
    "summary": "“丝路远航”是融合福建深厚海洋文化与现代创意的 IP 形象。",
    "desc": "两位角色云澜与远帆分别代表传统的沉思与当代的创新。",
    "caseStudy": {
      "oneLiner": "一组用双角色讲述海丝文化传承与远航精神的视觉 IP。",
      "inspiration": "从福建海洋文化、古代航线、瓷器纹样和船帆意象中提取灵感。",
      "visualSystem": "云澜偏安静、内敛、古瓷质感；远帆偏热烈、行动、开放。",
      "tools": "AI 进行角色草案探索和场景氛围生成，再统一世界观。",
      "extension": "适合发展成展览导览角色、文创礼盒、城市宣传插画和教育类图文内容。"
    },
    "extra": ["works/silk-voyage-1.jpg", "works/silk-voyage-2.jpg", "works/silk-voyage-3.jpg"]
  },
  {
    "id": "work-jinqi-yuanbao",
    "title": "金骐元宝",
    "date": "2025.11",
    "imgMain": "works/jinqi-yuanbao-cover.png",
    "tags": ["插画", "IP", "品牌"],
    "summary": "以丙午马年与福建泉州非遗结合的马年 IP。",
    "desc": "以 2026 丙午马年为核心灵感，融合生肖马“马到成功”的文化寓意与祥云、金元素的吉祥内涵，结合现代萌系 IP 设计风格，实现传统生肖文化与当代审美融合，传递“骐骥奋进、祥云送福”的新年祝福。",
    "caseStudy": {
      "oneLiner": "一个面向新年传播和品牌周边的生肖马 IP。",
      "inspiration": "围绕丙午马年、金元宝、祥云和泉州传统纹样展开。",
      "visualSystem": "角色轮廓圆润，表情亲近，金色与红橙色建立节庆感。",
      "tools": "AI 辅助生成生肖角色方向、服饰元素和节庆场景。",
      "extension": "可延展为红包封面、节日海报、表情包、挂件、贴纸和品牌新年礼。"
    },
    "extra": ["works/jinqi-yuanbao-1.jpg", "works/jinqi-yuanbao-2.jpg", "works/jinqi-yuanbao-3.jpg"]
  },
  {
    "id": "work-moon-mender",
    "title": "月亮修补师",
    "date": "2025.11",
    "imgMain": "works/moon-mender-cover.jpg",
    "tags": ["插画", "IP", "治愈"],
    "summary": "在星光熠熠的云端之上，毛茸茸的修补师与青鸟作伴，用温暖的金线温柔地缝合着破碎的月亮，也悄悄治愈着宇宙间每一个失落的梦。",
    "desc": "发光小怪物波波（BOBO）用温柔修补破碎世界的故事。戴着圆眼镜、穿着多口袋围裙的他，在星光璀璨的云端，将乌云的眼泪织成魔法，把流星的焦虑化为安宁。<br><br>作品致敬了“金缮”哲学，传递出“破碎和修补也是一种美”的核心理念。这不仅是一段治愈的童话之旅，更是一剂开给世界的温柔处方。配合治愈系贴纸与丰富的周边文创，波波陪伴着每一个需要拥抱的人，轻轻告诉大家：伤痕也是一枚蓝勋章，不完美的你依然可以闪闪发光。",
    "caseStudy": {
      "oneLiner": "一个关于修补、陪伴和自我接纳的治愈系角色故事。",
      "inspiration": "灵感来自金缮哲学、夜空、月亮和人们对温柔陪伴的需要。",
      "visualSystem": "BOBO 的圆眼镜、围裙口袋、金线和青鸟伙伴构成核心识别。",
      "tools": "AI 参与角色草图、场景概念和氛围图生成，再通过故事设定统一叙事。",
      "extension": "适合做绘本、治愈卡牌、贴纸、社交媒体连载和情绪陪伴 App 角色。"
    },
    "extra": ["works/moon-mender-1.jpg", "works/moon-mender-2.jpg", "works/moon-mender-3.jpg"]
  }
];

function loadGalleryFromJSON(callback) {
  fetch('data.json?v=c491c97')
    .then(function(res) {
      if (!res.ok) throw new Error('fetch failed');
      return res.json();
    })
    .then(function(data) {
      if (data && data.length) { callback(data); return; }
      throw new Error('empty data');
    })
    .catch(function() {
      // 网络请求失败 → 用内嵌数据
      callback(EMBEDDED_WORKS);
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

(function initGallery() {
  function boot() {
    loadGalleryFromJSON(function(data) {
      renderGallery(data);
    });
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

initGalleryFilters();
// ============================================================
//  6. 作品详情弹窗
// ============================================================

(function() {
  var overlay = document.getElementById('workDetailOverlay');
  if (!overlay) return;

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
      return '<span class="card-tag">' + escapeHTML(t) + '</span>';
    }).join('');
    resolveImgSrc(w.imgMain, function(src) {
      document.getElementById('spHeroImg').src = src || '';
    });
    document.getElementById('spDesc').innerHTML = renderRichText(w.desc || w.summary || '');
    var extra = document.getElementById('spExtra');
    extra.innerHTML = '';
    (w.extra || []).forEach(function(src) {
      resolveImgSrc(src, function(resolved) {
        if (resolved) extra.innerHTML += '<img src="' + escapeHTML(resolved) + '" alt="' + escapeHTML(w.title || '') + '">';
      });
    });
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

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


// ============================================================
//  7. 点赞按钮
// ============================================================

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


// ============================================================
//  8. 加载动画 (Splash)
// ============================================================

(function() {
  var splash = document.getElementById('loadingSplash');
  var fill = document.getElementById('loadingFill');
  if (!splash) return;
  var dismissed = false;

  function startProgress() {
    var pct = 0;
    var interval = setInterval(function() {
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
    loadAnimalese();
    setTimeout(function() { typewrite(greetingFull, greeting, 90); }, 300);
    setTimeout(function() { if (splash.parentNode) splash.remove(); }, 700);
  }

  if (document.readyState === 'complete') {
    setTimeout(dismiss, 2000);
  } else {
    window.addEventListener('load', function() { setTimeout(dismiss, 2000); });
  }

  setTimeout(function() { if (!dismissed) dismiss(); }, 8000);
})();
