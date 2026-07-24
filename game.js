(() => {
  'use strict';

  /* -----------------------------------------------------------------------
     ظلال الفجر — محرك Canvas مستقل. جميع الرسوم والصوت مولّدة في المتصفح.
  ----------------------------------------------------------------------- */
  const VW = 1280;
  const VH = 720;
  const GRAVITY = 1580;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const el = {
    hud: $('hud'), hudAct: $('hud-act'), hudChapter: $('hud-chapter'), hudObjective: $('hud-objective'),
    seedCount: $('seed-count'), seedTotal: $('seed-total'), hint: $('interaction-hint'), toast: $('toast'),
    title: $('title-screen'), map: $('map-screen'), pause: $('pause-screen'), intro: $('chapter-card-screen'),
    ending: $('ending-screen'), credits: $('credits-screen'), touch: $('touch-controls'),
    mapList: $('chapter-map'), progress: $('progress-label'), sound: $('sound-btn'),
    introAct: $('intro-act'), introTitle: $('intro-title'), introCopy: $('intro-copy'),
    endingTitle: $('ending-title'), endingCopy: $('ending-copy')
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rect = (x, y, w, h, extra = {}) => ({ x, y, w, h, ...extra });
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const distance = (a, b) => Math.hypot((a.x + (a.w || 0) / 2) - (b.x + (b.w || 0) / 2), (a.y + (a.h || 0) / 2) - (b.y + (b.h || 0) / 2));
  const hash = (n) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
    return x - Math.floor(x);
  };

  const PALETTES = {
    forest: { top: '#163555', mid: '#2c6b78', bottom: '#8fb989', far: '#275866', near: '#173f4d', land: '#254e51', edge: '#9bd5a4', glow: '#f4b86d', mist: '#a8e0c8', accent: '#d88ea8', weather: 'ورق وندى' },
    canal: { top: '#172f59', mid: '#387c91', bottom: '#d7a36d', far: '#386276', near: '#1e5063', land: '#2e5960', edge: '#d9c08a', glow: '#ffc675', mist: '#9bd2da', accent: '#c88675', weather: 'مطر خفيف' },
    ash: { top: '#241d4b', mid: '#62518a', bottom: '#bd8cc2', far: '#4c4270', near: '#35294f', land: '#484060', edge: '#c8a5d4', glow: '#f7bf75', mist: '#d9abda', accent: '#89d4ce', weather: 'رماد ورقي' },
    city: { top: '#243a57', mid: '#668fa9', bottom: '#efae79', far: '#4d718c', near: '#284a64', land: '#34586b', edge: '#f1c78d', glow: '#ffd080', mist: '#c7e3db', accent: '#eb9ca4', weather: 'رايات وهواء' },
    sea: { top: '#17264d', mid: '#48749b', bottom: '#f09273', far: '#42678d', near: '#203e69', land: '#2d5874', edge: '#e7b38a', glow: '#ffd28d', mist: '#93d6dc', accent: '#f3b2ad', weather: 'رذاذ مالح' },
    observatory: { top: '#1c2148', mid: '#5e73a1', bottom: '#b99ded', far: '#4a5387', near: '#303665', land: '#3b4775', edge: '#c7b8ee', glow: '#ffe09b', mist: '#c9b7f0', accent: '#87dfd0', weather: 'غبار نجمي' }
  };

  const CHAPTERS = [
    { act: 1, actName: 'الفصل الأول · غابة الزجاج', name: 'شرارة تحت السرخس', biome: 'forest', biomeName: 'غابة الزجاج', type: 'spark', objective: 'اتبعي الفانوس واجمعي بذور الضوء.', intro: 'حين يصغي الوادي للفانوس، تفتح الجذور طريقاً صغيراً.' },
    { act: 1, actName: 'الفصل الأول · غابة الزجاج', name: 'الدرج المكسور', biome: 'forest', biomeName: 'غابة الزجاج', type: 'spark', objective: 'اعبري الجذور المتباعدة إلى المرساة التالية.', intro: 'كل درجة مكسورة تترك مكاناً صغيراً للضوء.' },
    { act: 1, actName: 'الفصل الأول · غابة الزجاج', name: 'باب البتلات', biome: 'forest', biomeName: 'غابة الزجاج', type: 'key', objective: 'ابحثي عن المفتاح الزجاجي لفتح باب البتلات.', intro: 'الباب لا يخفي طريقه؛ بل ينتظر نغمة المفتاح الصحيحة.' },
    { act: 1, actName: 'الفصل الأول · غابة الزجاج', name: 'وزن الندى', biome: 'forest', biomeName: 'غابة الزجاج', type: 'weight', objective: 'ضعي صندوق الرنين على لوح الضغط.', intro: 'للندى وزنٌ حين يتذكر من حمله.' },
    { act: 1, actName: 'الفصل الأول · غابة الزجاج', name: 'جسر الهمس', biome: 'forest', biomeName: 'غابة الزجاج', type: 'tide', objective: 'أديري الرافعة وأعيدي الجسر إلى مكانه.', intro: 'تحت اللحاء، ما زالت التروس تتكلم ببطء.' },
    { act: 2, actName: 'الفصل الثاني · قناة الساعات', name: 'مرسى النحاس', biome: 'canal', biomeName: 'قناة الساعات', type: 'tide', objective: 'تعلّمي توقيت المنصات المتحركة.', intro: 'الماء لا يقيس الوقت؛ العجلات هي التي تفعل.' },
    { act: 2, actName: 'الفصل الثاني · قناة الساعات', name: 'صمام المد', biome: 'canal', biomeName: 'قناة الساعات', type: 'tide', objective: 'حرّكي صمام المد واعبري الجسر.', intro: 'دورة واحدة كافية لتتبدل ضفة كاملة.' },
    { act: 2, actName: 'الفصل الثاني · قناة الساعات', name: 'مفتاحان للتيار', biome: 'canal', biomeName: 'قناة الساعات', type: 'resonance', objective: 'اجمعي المفتاحين الزجاجيين للبوابة المزدوجة.', intro: 'للتيار صوتان؛ لا يفتح إلا حين يعودان معاً.' },
    { act: 2, actName: 'الفصل الثاني · قناة الساعات', name: 'حمولة الصدى', biome: 'canal', biomeName: 'قناة الساعات', type: 'weight', objective: 'انقلي صندوق الرنين فوق القناة الهادئة.', intro: 'الصندوق يردد خطاك، لكنه لا يعرف إلى أين يذهب.' },
    { act: 2, actName: 'الفصل الثاني · قناة الساعات', name: 'قلب الطاحونة', biome: 'canal', biomeName: 'قناة الساعات', type: 'tide', objective: 'أعيدي دوران القلب النحاسي.', intro: 'تصل نورا إلى ذاكرة قصيرة تركتها سيل في الماء.' },
    { act: 3, actName: 'الفصل الثالث · أقاليم الرماد', name: 'الريشة الثانية', biome: 'ash', biomeName: 'أقاليم الرماد', type: 'spark', objective: 'اكتشفي القفزة الثانية واصعدي إلى الشرفات.', intro: 'تمنحها الريح ريشةً لا تسقط إلى الأرض.' },
    { act: 3, actName: 'الفصل الثالث · أقاليم الرماد', name: 'حدائق الجاذبية', biome: 'ash', biomeName: 'أقاليم الرماد', type: 'spark', objective: 'تتبعي المسارات العلوية وتفادي الرماد.', intro: 'الحدائق لا تتحدى الجاذبية؛ هي تفاوضها.' },
    { act: 3, actName: 'الفصل الثالث · أقاليم الرماد', name: 'ظل على الجدار', biome: 'ash', biomeName: 'أقاليم الرماد', type: 'resonance', objective: 'أعيدي الرنين إلى البلورات قبل الضباب.', intro: 'الظل لا يهاجم النور؛ إنه يبحث عن مكانه فيه.' },
    { act: 3, actName: 'الفصل الثالث · أقاليم الرماد', name: 'ممر المرآة', biome: 'ash', biomeName: 'أقاليم الرماد', type: 'key', objective: 'خذي المفتاح من المسار الذي يعكسه الماء.', intro: 'في الماء، تعود الأبواب التي ظننا أنها أغلقت.' },
    { act: 3, actName: 'الفصل الثالث · أقاليم الرماد', name: 'شرفة النبض', biome: 'ash', biomeName: 'أقاليم الرماد', type: 'resonance', objective: 'وحّدي مفتاحين لفتح المنارة البنفسجية.', intro: 'تدقّ الشرفة مرةً لكل خطوة لا تهرب منها.' },
    { act: 4, actName: 'الفصل الرابع · مدينة السحاب', name: 'سوق بلا وجوه', biome: 'city', biomeName: 'مدينة السحاب', type: 'resonance', objective: 'استعيدي مفاتيح السوق من الأسطح الهادئة.', intro: 'كل نافذة تذكر شخصاً لم يعد ينظر منها.' },
    { act: 4, actName: 'الفصل الرابع · مدينة السحاب', name: 'جرس الريح', biome: 'city', biomeName: 'مدينة السحاب', type: 'tide', objective: 'حرّكي الرافعة حين يمر جرس الريح.', intro: 'الرايات الملونة تحفظ ترتيب الأغنية.' },
    { act: 4, actName: 'الفصل الرابع · مدينة السحاب', name: 'قطار البذور', biome: 'city', biomeName: 'مدينة السحاب', type: 'tide', objective: 'اصعدي المنصة المتحركة إلى الحي التالي.', intro: 'قطار صغير يحمل حدائق كاملة إلى الغيوم.' },
    { act: 4, actName: 'الفصل الرابع · مدينة السحاب', name: 'الحديقة المعلّقة', biome: 'city', biomeName: 'مدينة السحاب', type: 'weight', objective: 'ثبتي الحديقة بصندوق الرنين.', intro: 'لا تسقط الحديقة ما دام أحد يتذكر جذورها.' },
    { act: 4, actName: 'الفصل الرابع · مدينة السحاب', name: 'مجلس الصمت', biome: 'city', biomeName: 'مدينة السحاب', type: 'resonance', objective: 'اجمعي مفتاحي المجلس عند ضوء الغروب.', intro: 'تصل رسالة سيل كاملة: «أنا في المرصد».' },
    { act: 5, actName: 'الفصل الخامس · بحر الشفق', name: 'شاطئ المرايا', biome: 'sea', biomeName: 'بحر الشفق', type: 'spark', objective: 'اقفزي بين جزر الضوء العائمة.', intro: 'البحر يعكس فجراً لا يزال بعيداً فوق الجبال.' },
    { act: 5, actName: 'الفصل الخامس · بحر الشفق', name: 'نداء الحوت الزجاجي', biome: 'sea', biomeName: 'بحر الشفق', type: 'key', objective: 'اتبعي نغمات الزجاج إلى المفتاح.', intro: 'صوت عميق تحت الماء يرسم طريقاً من دوائر.' },
    { act: 5, actName: 'الفصل الخامس · بحر الشفق', name: 'المدّ المعكوس', biome: 'sea', biomeName: 'بحر الشفق', type: 'tide', objective: 'بدّلي اتجاه المد واعبري قبل أن يعود.', intro: 'تبدو كل موجة كأنها تصعد إلى السماء.' },
    { act: 5, actName: 'الفصل الخامس · بحر الشفق', name: 'المرصد المكسور', biome: 'observatory', biomeName: 'المرصد', type: 'resonance', objective: 'اجمعي الرنين الأخير وصلي إلى الدرج.', intro: 'تتجه العدسات كلها إلى فجر مخبأ خلف الغيوم.' },
    { act: 5, actName: 'الفصل الخامس · بحر الشفق', name: 'فجران', biome: 'observatory', biomeName: 'المرصد', type: 'resonance', objective: 'افتحي بوابة المرصد واخترِي مصير الضوء.', intro: 'تنتظر نورا وسيل بين منارتين؛ لكل منهما فجر ممكن.' }
  ];

  const SAVE_KEY = 'dawnbound-save-v1';
  const freshSave = () => ({ unlocked: 0, lastChapter: 0, completed: [], totalSeeds: 0, chapterSeedBest: {}, muted: false, ending: null });
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw || typeof raw !== 'object') return freshSave();
      return { ...freshSave(), ...raw, completed: Array.isArray(raw.completed) ? raw.completed : [], chapterSeedBest: raw.chapterSeedBest || {} };
    } catch (_) { return freshSave(); }
  }
  let save = loadSave();
  function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }

  /* أصوات بسيطة محلية: لا ملفات صوتية خارجية ولا تشغيل قبل ضغط اللاعب. */
  class Soundscape {
    constructor() { this.ctx = null; this.master = null; this.muted = !!save.muted; this.lastAmbient = 0; this.biome = 'forest'; }
    unlock() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    setMuted(value) {
      this.muted = value;
      save.muted = value; persist();
      if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? 0 : 0.34, this.ctx.currentTime, .03);
      el.sound.textContent = value ? '♪̸' : '♫';
      el.sound.setAttribute('aria-label', value ? 'تشغيل الصوت' : 'كتم الصوت');
    }
    tone(freq, seconds = .12, type = 'sine', volume = .16, slide = 0) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + seconds);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + seconds);
      osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + seconds + .03);
    }
    jump() { this.tone(300, .12, 'triangle', .11, 155); }
    seed() { this.tone(620, .1, 'sine', .13, 210); setTimeout(() => this.tone(880, .14, 'sine', .09, 180), 55); }
    key() { this.tone(430, .12, 'triangle', .15, 210); setTimeout(() => this.tone(720, .2, 'sine', .1, 170), 75); }
    lever() { this.tone(160, .18, 'square', .09, -45); setTimeout(() => this.tone(260, .22, 'triangle', .1, 90), 65); }
    door() { this.tone(220, .32, 'sine', .12, 160); }
    danger() { this.tone(120, .22, 'sawtooth', .08, -45); }
    finish() { this.tone(392, .15, 'sine', .13, 110); setTimeout(() => this.tone(587, .2, 'sine', .13, 140), 120); setTimeout(() => this.tone(880, .4, 'sine', .11, 0), 250); }
    ambient(now, biome) {
      this.biome = biome;
      if (!this.ctx || this.muted || now - this.lastAmbient < 3.8) return;
      this.lastAmbient = now;
      const roots = { forest: 196, canal: 174, ash: 220, city: 247, sea: 146, observatory: 262 };
      const root = roots[biome] || 196;
      this.tone(root, 1.15, 'sine', .025, 3);
      this.tone(root * 1.5, .38, 'triangle', .018, 8);
      if (Math.random() > .45) setTimeout(() => this.tone(root * 2.02, .22, 'sine', .025, 35), 600);
    }
  }
  const audio = new Soundscape();

  const input = { left: false, right: false, jump: false, action: false, jumpPressed: false, actionPressed: false };
  function clearInput() { Object.keys(input).forEach((key) => { input[key] = false; }); }

  const game = {
    level: null, player: null, camera: { x: 0 }, time: 0, running: false, paused: false,
    transitioning: false, introTimer: null, toastTimer: null, mapReturn: 'title', flash: 0, lastTime: 0
  };

  function makePlayer(chapterIndex) {
    return { x: 118, y: 440, w: 29, h: 52, vx: 0, vy: 0, facing: 1, grounded: false, coyote: 0, jumps: 0,
      canDouble: chapterIndex >= 10, carrying: null, standing: null, invulnerable: 0, trail: [] };
  }

  function addPlatform(level, x, y, w, h, kind = 'stone') { level.platforms.push(rect(x, y, w, h, { kind })); }
  function addSeed(level, x, y, note) { level.seeds.push({ x, y, w: 22, h: 28, collected: false, note }); }
  function addKey(level, x, y) { level.keys.push({ x, y, w: 23, h: 32, collected: false }); }

  function buildLevel(index) {
    const chapter = CHAPTERS[index];
    const flat = chapter.type === 'weight';
    const level = {
      index, chapter, width: 4880, floor: 620, platforms: [], bridges: [], moving: [], hazards: [], seeds: [], keys: [], crates: [], plates: [], levers: [], gates: [], anchors: [], fog: null,
      goal: rect(4670, 505, 60, 110), checkpoint: { x: 118, y: 440 }, seedMessageShown: false, doorWasOpen: false
    };

    if (flat) {
      addPlatform(level, 0, 620, 4860, 180, 'root');
      addPlatform(level, 730, 535, 160, 20, 'ledge');
      addPlatform(level, 2780, 510, 180, 20, 'ledge');
    } else if (chapter.type === 'tide') {
      addPlatform(level, 0, 620, 700, 180, 'stone');
      addPlatform(level, 790, 620, 570, 180, 'stone');
      addPlatform(level, 1450, 620, 620, 180, 'stone');
      addPlatform(level, 2160, 620, 600, 180, 'stone');
      addPlatform(level, 3620, 620, 1240, 180, 'stone');
      addPlatform(level, 310, 520, 150, 20, 'ledge');
      addPlatform(level, 1000, 505, 170, 20, 'ledge');
      addPlatform(level, 1700, 500, 160, 20, 'ledge');
      addPlatform(level, 2390, 510, 140, 20, 'ledge');
      level.bridges.push(rect(2745, 620, 890, 30, { active: false, kind: 'bridge' }));
      level.moving.push({ x: 2360, y: 478, w: 150, h: 22, minX: 2350, maxX: 2670, speed: .56 + (index % 3) * .05, phase: index * .7, lastX: 2360, kind: 'moving' });
    } else {
      addPlatform(level, 0, 620, 700, 180, 'stone');
      addPlatform(level, 790, 620, 570, 180, 'stone');
      addPlatform(level, 1450, 620, 620, 180, 'stone');
      addPlatform(level, 2160, 620, 600, 180, 'stone');
      addPlatform(level, 2850, 620, 680, 180, 'stone');
      addPlatform(level, 3620, 620, 1240, 180, 'stone');
      addPlatform(level, 290, 520, 155, 20, 'ledge');
      addPlatform(level, 980, 505, 175, 20, 'ledge');
      addPlatform(level, 1660, 495, 165, 20, 'ledge');
      addPlatform(level, 2380, 515, 150, 20, 'ledge');
      addPlatform(level, 3100, 490, 190, 20, 'ledge');
    }

    // المسار الرئيسي دائماً قابل للحل؛ المخاطر قصيرة وواضحة.
    if (!flat) {
      level.hazards.push(rect(1160, 588, 52, 32));
      level.hazards.push(rect(2450 + (index % 2) * 60, 588, 48, 32));
      if (index > 9) level.hazards.push(rect(3290, 588, 54, 32));
    }

    addSeed(level, 390, 558, 'الفانوس يتذكر الطريق.');
    addSeed(level, 1880, 558, 'كل بذرة تعيد لوناً صغيراً إلى الوادي.');
    addSeed(level, 3370, 558, 'الضوء لا يطلب منكِ أن تسرعي.');
    level.anchors.push(rect(1280, 548, 42, 72, { lit: false }));
    level.anchors.push(rect(3850, 548, 42, 72, { lit: false }));

    const gate = rect(4290, 390, 45, 230, { open: chapter.type === 'spark', amount: chapter.type === 'spark' ? 1 : 0, kind: 'gate' });
    if (chapter.type !== 'spark') level.gates.push(gate);

    if (chapter.type === 'key') {
      addKey(level, 1860, 554);
    } else if (chapter.type === 'resonance') {
      addKey(level, 1580, 554);
      addKey(level, 3170, 554);
      addPlatform(level, 3020, 520, 145, 20, 'ledge');
    } else if (chapter.type === 'weight') {
      level.crates.push({ x: 1820, y: 568, w: 46, h: 52, vx: 0, vy: 0, grounded: false, carried: false, kind: 'crate' });
      level.plates.push(rect(3540, 601, 124, 16, { active: false, kind: 'plate' }));
    } else if (chapter.type === 'tide') {
      level.levers.push(rect(1940, 550, 40, 70, { used: false, kind: 'lever' }));
    }

    if ([12, 14, 19, 23, 24].includes(index)) level.fog = { x: 3720, y: 500, w: 360, h: 120, phase: index * .7 };
    return level;
  }

  function allSolids(level) {
    const solids = level.platforms.slice();
    level.bridges.forEach((b) => { if (b.active) solids.push(b); });
    level.moving.forEach((m) => solids.push(m));
    level.gates.forEach((g) => { if (!g.open) solids.push(g); });
    return solids;
  }

  function updateMoving(level, dt) {
    level.moving.forEach((m) => {
      m.lastX = m.x;
      const oscillation = (Math.sin(game.time * m.speed + m.phase) + 1) / 2;
      m.x = lerp(m.minX, m.maxX, oscillation);
      const dx = m.x - m.lastX;
      const p = game.player;
      if (p && p.standing === m && p.grounded) p.x += dx;
    });
  }

  function resolveBody(body, level, dt) {
    const solids = allSolids(level);
    body.x += body.vx * dt;
    for (const solid of solids) {
      if (!overlap(body, solid)) continue;
      if (body.vx > 0) body.x = solid.x - body.w;
      else if (body.vx < 0) body.x = solid.x + solid.w;
      body.vx = 0;
    }
    body.y += body.vy * dt;
    body.grounded = false; body.standing = null;
    for (const solid of solids) {
      if (!overlap(body, solid)) continue;
      if (body.vy >= 0) {
        body.y = solid.y - body.h;
        body.grounded = true; body.standing = solid;
      } else {
        body.y = solid.y + solid.h;
      }
      body.vy = 0;
    }
  }

  function updateCrates(level, dt) {
    for (const box of level.crates) {
      if (box.carried) continue;
      box.vy = Math.min(900, box.vy + GRAVITY * dt);
      resolveBody(box, level, dt);
      if (box.y > 790) { box.x = 1820; box.y = 500; box.vx = box.vy = 0; }
    }
  }

  function updatePuzzle(level) {
    const type = level.chapter.type;
    let unlocked = type === 'spark';
    if (type === 'key' || type === 'resonance') unlocked = level.keys.length > 0 && level.keys.every((key) => key.collected);
    if (type === 'weight') {
      const plate = level.plates[0];
      const pressure = [game.player, ...level.crates].some((thing) => thing && overlap(thing, plate));
      plate.active = pressure;
      unlocked = pressure;
    }
    if (type === 'tide') {
      unlocked = !!(level.levers[0] && level.levers[0].used);
      level.bridges.forEach((bridge) => { bridge.active = unlocked; });
    }
    for (const gate of level.gates) {
      const changed = gate.open !== unlocked;
      gate.open = unlocked;
      gate.amount = clamp(gate.amount + (gate.open ? .04 : -.04), 0, 1);
      if (changed && gate.open) { audio.door(); showToast('استجاب الباب للرنين الكهرماني.'); }
    }
  }

  function tryInteract() {
    if (!game.running || game.paused || !game.level) return;
    const p = game.player; const level = game.level;
    if (p.carrying) {
      const box = p.carrying;
      box.carried = false; box.x = p.x + p.facing * 39; box.y = p.y + 11; box.vx = p.facing * 90; box.vy = -35;
      p.carrying = null; audio.lever(); return;
    }
    const lever = level.levers.find((item) => distance(p, item) < 78);
    if (lever) {
      if (!lever.used) { lever.used = true; audio.lever(); showToast('دارت الرافعة؛ تشكّل جسر من الضوء.'); }
      else showToast('الرافعة في موضعها الصحيح.');
      return;
    }
    const box = level.crates.find((item) => !item.carried && distance(p, item) < 78);
    if (box) {
      box.carried = true; p.carrying = box; box.vx = box.vy = 0; audio.lever(); showToast('احملي صندوق الرنين ثم ضعيه على اللوح.');
    }
  }

  function collectObjects(level) {
    const p = game.player;
    for (const seed of level.seeds) {
      if (!seed.collected && overlap(p, seed)) {
        seed.collected = true; audio.seed(); updateHud();
        if (!level.seedMessageShown) { level.seedMessageShown = true; showToast(seed.note); }
      }
    }
    for (const key of level.keys) {
      if (!key.collected && overlap(p, key)) { key.collected = true; audio.key(); updateHud(); showToast('مفتاح زجاجي — صوته يصل إلى البوابة.'); }
    }
    for (const anchor of level.anchors) {
      if (!anchor.lit && overlap(p, anchor)) {
        anchor.lit = true; level.checkpoint = { x: anchor.x - 5, y: 440 }; audio.tone(330, .38, 'sine', .1, 95);
        showToast('مرسى ضوء — تم حفظ هذه النقطة.');
      }
    }
  }

  function respawn() {
    const p = game.player; const cp = game.level.checkpoint;
    if (p.invulnerable > 0) return;
    p.x = cp.x; p.y = cp.y; p.vx = p.vy = 0; p.carrying = null; p.invulnerable = 1; game.flash = .33;
    audio.danger(); showToast('أعادك الفانوس إلى آخر مرسى.');
  }

  function updatePlayer(level, dt) {
    const p = game.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    const moving = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const speed = p.carrying ? 185 : 285;
    if (moving) { p.vx = lerp(p.vx, moving * speed, Math.min(1, dt * 16)); p.facing = moving; }
    else p.vx = lerp(p.vx, 0, Math.min(1, dt * 13));

    if (p.grounded) { p.coyote = .11; p.jumps = 0; } else p.coyote -= dt;
    if (input.jumpPressed) {
      if (p.coyote > 0) { p.vy = -620; p.grounded = false; p.coyote = 0; p.jumps = 1; audio.jump(); }
      else if (p.canDouble && p.jumps < 2) { p.vy = -575; p.jumps = 2; audio.jump(); showToast('الريشة الثانية تفتح مساراً أعلى.'); }
    }
    if (!input.jump && p.vy < -160) p.vy += 1080 * dt;
    p.vy = Math.min(900, p.vy + GRAVITY * dt);
    resolveBody(p, level, dt);
    p.x = clamp(p.x, 0, level.width - p.w);
    if (p.carrying) {
      const box = p.carrying;
      box.x = p.x + (p.facing > 0 ? p.w + 8 : -box.w - 8);
      box.y = p.y + 3;
    }
    if (p.y > 780) respawn();
    for (const hazard of level.hazards) if (overlap(p, hazard)) { respawn(); break; }
    if (level.fog && p.x > level.fog.x && p.x < level.fog.x + level.fog.w && !level.fog.warned) {
      level.fog.warned = true; showToast('الضباب يتراجع عندما تثقين بالفانوس.');
    }
    if (p.x > level.goal.x - 15 && overlap(p, level.goal) && !game.transitioning) finishChapter();
  }

  function goalDescription(level) {
    const type = level.chapter.type;
    if (type === 'key') return `مفاتيح: ${level.keys.filter((k) => k.collected).length}/${level.keys.length}`;
    if (type === 'resonance') return `رنين المفاتيح: ${level.keys.filter((k) => k.collected).length}/${level.keys.length}`;
    if (type === 'weight') return level.plates[0].active ? 'لوح الضغط مضاء ✓' : 'الصندوق لم يصل إلى لوح الضغط';
    if (type === 'tide') return level.levers[0].used ? 'الجسر مستقر ✓' : 'ابحثي عن رافعة المد';
    return 'اتّبعي شعاع الفانوس إلى البوابة.';
  }

  function updateHint() {
    if (!game.running || game.paused || !game.level) { el.hint.classList.add('is-hidden'); return; }
    const p = game.player; const l = game.level;
    let text = '';
    if (p.carrying) text = 'اضغط <kbd>E</kbd> لإفلات الصندوق';
    else if (l.levers.some((x) => distance(p, x) < 78 && !x.used)) text = 'اضغط <kbd>E</kbd> لتدوير الرافعة';
    else if (l.crates.some((x) => distance(p, x) < 78 && !x.carried)) text = 'اضغط <kbd>E</kbd> لحمل صندوق الرنين';
    if (text) { el.hint.innerHTML = text; el.hint.classList.remove('is-hidden'); }
    else el.hint.classList.add('is-hidden');
  }

  function updateHud() {
    if (!game.level) return;
    const l = game.level; const c = l.chapter;
    el.hudAct.textContent = c.actName;
    el.hudChapter.textContent = `${String(l.index + 1).padStart(2, '0')} · ${c.name}`;
    el.hudObjective.textContent = `${c.objective} — ${goalDescription(l)}`;
    el.seedCount.textContent = l.seeds.filter((s) => s.collected).length;
    el.seedTotal.textContent = l.seeds.length;
  }

  function showToast(message, duration = 2500) {
    clearTimeout(game.toastTimer);
    el.toast.textContent = message; el.toast.classList.remove('is-hidden');
    game.toastTimer = setTimeout(() => el.toast.classList.add('is-hidden'), duration);
  }

  function hideAllScreens() {
    [el.title, el.map, el.pause, el.intro, el.ending, el.credits].forEach((node) => node.classList.add('is-hidden'));
  }

  function showIntro(chapter) {
    clearTimeout(game.introTimer);
    el.introAct.textContent = chapter.actName;
    el.introTitle.textContent = chapter.name;
    el.introCopy.textContent = chapter.intro;
    el.intro.classList.remove('is-hidden');
    game.introTimer = setTimeout(() => el.intro.classList.add('is-hidden'), 2450);
  }

  function startChapter(index) {
    index = clamp(index, 0, CHAPTERS.length - 1);
    audio.unlock();
    clearInput(); hideAllScreens();
    game.level = buildLevel(index); game.player = makePlayer(index); game.camera.x = 0; game.transitioning = false; game.flash = .22;
    game.running = true; game.paused = false;
    save.lastChapter = index; persist();
    el.hud.classList.remove('is-hidden');
    if (window.matchMedia('(pointer: coarse)').matches) el.touch.classList.remove('is-hidden');
    updateHud(); updateHint(); showIntro(CHAPTERS[index]);
  }

  function finishChapter() {
    const l = game.level; const index = l.index;
    game.transitioning = true; game.running = false; el.hud.classList.add('is-hidden'); el.touch.classList.add('is-hidden');
    const gained = l.seeds.filter((s) => s.collected).length;
    const before = Number(save.chapterSeedBest[index] || 0);
    if (gained > before) { save.totalSeeds += gained - before; save.chapterSeedBest[index] = gained; }
    if (!save.completed.includes(index)) save.completed.push(index);
    save.unlocked = Math.max(save.unlocked, Math.min(CHAPTERS.length - 1, index + 1));
    save.lastChapter = Math.min(CHAPTERS.length - 1, index + 1);
    persist(); audio.finish();
    showToast(index === CHAPTERS.length - 1 ? 'اكتمل المرصد. بقي قرار الفجر.' : `اكتمل فصل «${l.chapter.name}» ✦`, 2200);
    setTimeout(() => {
      if (index === CHAPTERS.length - 1) {
        el.ending.classList.remove('is-hidden');
      } else startChapter(index + 1);
    }, 1250);
  }

  function setEnding(kind) {
    save.ending = kind; persist();
    el.ending.classList.add('is-hidden');
    el.credits.classList.remove('is-hidden');
    if (kind === 'city') {
      el.endingTitle.textContent = 'فجر المدينة';
      el.endingCopy.textContent = 'تضيء النوافذ الواحدة تلو الأخرى، وتعود سيل من مسار النجوم. يظلّ للغابة ضوء صغير في فانوس نورا.';
    } else {
      el.endingTitle.textContent = 'فجر الغابة';
      el.endingCopy.textContent = 'تفتح نورا كفّها فوق الجذور، فينتشر الفجر بين البذور. تتعلم المدينة أن تنتظر نورها من غابة صارت حرة.';
    }
  }

  function openMap(returnTo = 'title') {
    game.mapReturn = returnTo;
    if (returnTo === 'title') el.title.classList.add('is-hidden');
    if (returnTo === 'pause') el.pause.classList.add('is-hidden');
    buildMap(); el.map.classList.remove('is-hidden');
  }
  function closeMap() {
    el.map.classList.add('is-hidden');
    if (game.mapReturn === 'pause' && game.running) el.pause.classList.remove('is-hidden');
    else el.title.classList.remove('is-hidden');
  }
  function buildMap() {
    el.mapList.innerHTML = '';
    for (let i = 0; i < CHAPTERS.length; i++) {
      const c = CHAPTERS[i]; const complete = save.completed.includes(i); const available = i <= save.unlocked;
      const button = document.createElement('button');
      button.type = 'button'; button.className = `chapter-node ${complete ? 'complete' : ''} ${available && !complete ? 'available' : ''}`;
      button.disabled = !available;
      button.setAttribute('role', 'listitem');
      button.innerHTML = `<span class="node-number">${String(i + 1).padStart(2, '0')} · ${c.actName.split('·')[0].trim()}</span><span class="node-name">${c.name}</span><span class="node-biome">${c.biomeName}</span><span class="node-status">${complete ? '✦' : available ? '◌' : '⌁'}</span>`;
      button.addEventListener('click', () => startChapter(i));
      el.mapList.appendChild(button);
    }
    el.progress.textContent = `${save.completed.length} من ${CHAPTERS.length} فصل مكتمل · ${save.totalSeeds} بذرة ضوء محفوظة`;
  }

  function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    clearInput();
    if (game.paused) { el.pause.classList.remove('is-hidden'); el.touch.classList.add('is-hidden'); }
    else { el.pause.classList.add('is-hidden'); if (window.matchMedia('(pointer: coarse)').matches) el.touch.classList.remove('is-hidden'); }
  }

  /* ------------------------------- الرسم -------------------------------- */
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function fillGradient(top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, top); g.addColorStop(.58, bottom); g.addColorStop(1, '#182d49');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }

  function drawMountainLayer(pal, factor, color, baseline, amplitude, seed) {
    const offset = -((game.camera.x * factor) % 250);
    ctx.beginPath(); ctx.moveTo(-280, VH); ctx.lineTo(-280, baseline);
    for (let x = -280; x < VW + 320; x += 105) {
      const worldX = (x - offset) / 105 + seed;
      const peak = baseline - amplitude * (.35 + hash(worldX) * .8);
      ctx.quadraticCurveTo(x + 47, peak, x + 105, baseline - amplitude * .22 * hash(worldX + 2));
    }
    ctx.lineTo(VW + 280, VH); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function drawSky(level) {
    const pal = PALETTES[level.chapter.biome];
    fillGradient(pal.top, pal.bottom);
    const orbX = 955 - game.camera.x * .06;
    const orbY = 150 + Math.sin(game.time * .12) * 7;
    const glow = ctx.createRadialGradient(orbX, orbY, 8, orbX, orbY, 145);
    glow.addColorStop(0, 'rgba(255,232,181,.65)'); glow.addColorStop(.22, 'rgba(255,207,140,.25)'); glow.addColorStop(1, 'rgba(255,206,155,0)');
    ctx.fillStyle = glow; ctx.fillRect(orbX - 150, orbY - 150, 300, 300);
    ctx.fillStyle = 'rgba(255,235,188,.78)'; ctx.beginPath(); ctx.arc(orbX, orbY, 27, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < 58; i++) {
      const x = ((i * 197 + 31 - game.camera.x * .08) % (VW + 80)) - 40;
      const y = 30 + hash(i + 9) * 310;
      const a = .16 + hash(i * 5) * .38;
      ctx.fillStyle = `rgba(239,249,242,${a})`;
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    drawMountainLayer(pal, .13, pal.far, 470, 140, level.index * 7 + 3);
    drawMountainLayer(pal, .3, pal.near, 555, 165, level.index * 13 + 8);
  }

  function drawFarStructures(level) {
    const pal = PALETTES[level.chapter.biome];
    const start = Math.floor(game.camera.x * .42 / 190) - 3;
    ctx.save(); ctx.globalAlpha = .53;
    for (let i = start; i < start + 13; i++) {
      const x = i * 190 - game.camera.x * .42;
      const h = 90 + hash(i + level.index * 11) * 155;
      if (level.chapter.biome === 'city' || level.chapter.biome === 'observatory') {
        ctx.fillStyle = pal.near; ctx.fillRect(x, 570 - h, 72, h + 50);
        ctx.fillStyle = pal.edge; ctx.globalAlpha = .25; ctx.fillRect(x + 15, 585 - h, 9, 15); ctx.fillRect(x + 41, 545 - h / 2, 9, 15); ctx.globalAlpha = .53;
        ctx.beginPath(); ctx.moveTo(x - 12, 570 - h); ctx.lineTo(x + 36, 530 - h); ctx.lineTo(x + 84, 570 - h); ctx.fill();
      } else {
        ctx.strokeStyle = pal.near; ctx.lineWidth = 13 + hash(i) * 8; ctx.beginPath(); ctx.moveTo(x + 35, 620); ctx.quadraticCurveTo(x + 18, 540 - h * .2, x + 43, 520 - h); ctx.stroke();
        ctx.fillStyle = pal.near; for (let b = 0; b < 4; b++) { ctx.beginPath(); ctx.ellipse(x + 44 + b * 12, 500 - h + hash(i * 9 + b) * 55, 37, 20, hash(b + i) * 2, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  function drawWeather(level) {
    const pal = PALETTES[level.chapter.biome];
    ctx.save();
    for (let i = 0; i < 54; i++) {
      const x = ((i * 113 - game.time * (18 + (i % 4) * 8) - game.camera.x * .62) % (VW + 80)) - 40;
      const y = (hash(i + level.index * 37) * 650 + game.time * (level.chapter.biome === 'canal' ? 34 : 12)) % 690;
      const alpha = .14 + hash(i * 8) * .18;
      if (level.chapter.biome === 'canal' || level.chapter.biome === 'sea') {
        ctx.strokeStyle = `rgba(212,244,244,${alpha})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 16); ctx.stroke();
      } else {
        ctx.fillStyle = `${pal.mist}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath(); ctx.arc(x, y, 1 + hash(i) * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPlatform(p, pal) {
    const gradient = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(p.h, 150));
    gradient.addColorStop(0, pal.edge); gradient.addColorStop(.08, pal.land); gradient.addColorStop(1, '#173344');
    ctx.fillStyle = gradient; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(7,23,39,.25)';
    for (let x = p.x + 16; x < p.x + p.w; x += 42) ctx.fillRect(x, p.y + 20 + (x % 3) * 7, 2, Math.min(100, p.h - 15));
    ctx.strokeStyle = pal.edge; ctx.globalAlpha = .7; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y + 1); ctx.lineTo(p.x + p.w, p.y + 1); ctx.stroke(); ctx.globalAlpha = 1;
  }

  function drawHazard(h, pal) {
    ctx.save(); ctx.fillStyle = '#a95267'; ctx.shadowColor = '#f18c76'; ctx.shadowBlur = 10;
    for (let x = h.x; x < h.x + h.w; x += 13) { ctx.beginPath(); ctx.moveTo(x, h.y + h.h); ctx.lineTo(x + 6.5, h.y); ctx.lineTo(x + 13, h.y + h.h); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  function drawWire(fromX, toX, y, active, pal) {
    ctx.save(); ctx.strokeStyle = active ? pal.glow : 'rgba(126,185,182,.35)'; ctx.lineWidth = active ? 2.5 : 1.2; ctx.shadowColor = active ? pal.glow : 'transparent'; ctx.shadowBlur = active ? 11 : 0;
    ctx.beginPath(); ctx.moveTo(fromX, y); ctx.bezierCurveTo(fromX + 110, y + 24, toX - 80, y - 26, toX, y + 8); ctx.stroke(); ctx.restore();
  }

  function drawSeed(seed, pal) {
    if (seed.collected) return;
    const bob = Math.sin(game.time * 2.1 + seed.x * .01) * 5;
    ctx.save(); ctx.translate(seed.x + 11, seed.y + 14 + bob); ctx.rotate(Math.sin(game.time * 1.5 + seed.x) * .3);
    ctx.shadowColor = pal.glow; ctx.shadowBlur = 18; ctx.fillStyle = '#ffe099';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(11, -2, 0, 13); ctx.quadraticCurveTo(-11, -2, 0, -12); ctx.fill();
    ctx.fillStyle = '#fff5c8'; ctx.beginPath(); ctx.arc(0, -2, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawKey(key, pal) {
    if (key.collected) return;
    const bob = Math.sin(game.time * 2.4 + key.x) * 4;
    ctx.save(); ctx.translate(key.x + 11, key.y + 15 + bob); ctx.rotate(game.time * .7);
    ctx.strokeStyle = '#bff5e5'; ctx.lineWidth = 3; ctx.shadowColor = pal.glow; ctx.shadowBlur = 13; ctx.beginPath(); ctx.arc(-3, -5, 6, 0, Math.PI * 2); ctx.moveTo(1, -1); ctx.lineTo(10, 9); ctx.lineTo(7, 12); ctx.moveTo(7, 6); ctx.lineTo(12, 6); ctx.stroke(); ctx.restore();
  }

  function drawCrate(box, pal) {
    ctx.save(); ctx.translate(box.x, box.y); ctx.fillStyle = '#395d68'; ctx.fillRect(0, 0, box.w, box.h); ctx.strokeStyle = '#d5a76b'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, box.w - 4, box.h - 4); ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(box.w - 5, box.h - 5); ctx.moveTo(box.w - 5, 5); ctx.lineTo(5, box.h - 5); ctx.stroke(); ctx.fillStyle = pal.glow; ctx.globalAlpha = .62 + Math.sin(game.time * 3) * .15; ctx.fillRect(box.w / 2 - 3, box.h / 2 - 3, 6, 6); ctx.restore();
  }

  function drawPlate(plate, pal) {
    ctx.save(); ctx.fillStyle = plate.active ? pal.glow : '#527886'; ctx.shadowColor = plate.active ? pal.glow : 'transparent'; ctx.shadowBlur = plate.active ? 14 : 0; ctx.fillRect(plate.x, plate.y, plate.w, plate.h); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(plate.x + 8, plate.y + 3, plate.w - 16, 2); ctx.restore();
  }

  function drawLever(lever, pal) {
    ctx.save(); ctx.translate(lever.x + 20, lever.y + 56); ctx.fillStyle = '#416673'; ctx.fillRect(-13, 0, 26, 12); ctx.strokeStyle = '#e2ad6d'; ctx.lineWidth = 5; ctx.shadowColor = lever.used ? pal.glow : 'transparent'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(lever.used ? 17 : -17, -33); ctx.stroke(); ctx.fillStyle = lever.used ? pal.glow : '#d9a064'; ctx.beginPath(); ctx.arc(lever.used ? 17 : -17, -33, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawGate(gate, pal) {
    const lift = gate.amount * 245;
    ctx.save(); ctx.translate(gate.x, gate.y - lift); ctx.shadowColor = pal.glow; ctx.shadowBlur = gate.open ? 15 : 6; ctx.fillStyle = '#405e72';
    for (let i = 0; i < 4; i++) { ctx.fillRect(i * 12, 0, 7, gate.h); }
    ctx.strokeStyle = pal.edge; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(gate.w + 5, 9); ctx.moveTo(-5, gate.h - 8); ctx.lineTo(gate.w + 5, gate.h - 8); ctx.stroke(); ctx.restore();
  }

  function drawBridge(bridge, pal) {
    if (!bridge.active) return;
    ctx.save(); ctx.fillStyle = '#416e77'; ctx.shadowColor = pal.glow; ctx.shadowBlur = 8; ctx.fillRect(bridge.x, bridge.y, bridge.w, bridge.h); ctx.strokeStyle = pal.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bridge.x, bridge.y + 2); ctx.lineTo(bridge.x + bridge.w, bridge.y + 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,245,195,.35)'; for (let x = bridge.x + 16; x < bridge.x + bridge.w; x += 44) ctx.fillRect(x, bridge.y + 9, 18, 3); ctx.restore();
  }

  function drawMoving(m, pal) {
    ctx.save(); ctx.fillStyle = '#4d8490'; ctx.shadowColor = pal.glow; ctx.shadowBlur = 10; ctx.fillRect(m.x, m.y, m.w, m.h); ctx.fillStyle = pal.edge; ctx.fillRect(m.x + 5, m.y + 2, m.w - 10, 3); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(m.x + m.w / 2 - 13, m.y + 9, 26, 2); ctx.restore();
  }

  function drawAnchor(anchor, pal) {
    ctx.save(); const x = anchor.x + 21; const y = anchor.y + 55; ctx.strokeStyle = anchor.lit ? pal.glow : '#5b8490'; ctx.lineWidth = 4; ctx.shadowColor = anchor.lit ? pal.glow : 'transparent'; ctx.shadowBlur = anchor.lit ? 17 : 0; ctx.beginPath(); ctx.arc(x, y - 17, 11, Math.PI, 0); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 12); ctx.moveTo(x - 12, y + 4); ctx.lineTo(x + 12, y + 4); ctx.stroke(); if (anchor.lit) { ctx.fillStyle = '#fff1b6'; ctx.beginPath(); ctx.arc(x, y - 17, 4, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }

  function drawFog(fog, pal) {
    ctx.save(); ctx.globalAlpha = .17; ctx.fillStyle = pal.mist; for (let i = 0; i < 8; i++) { const x = fog.x + i * 55 + Math.sin(game.time * .9 + i) * 18; const y = fog.y + 30 + Math.sin(game.time * 1.1 + i) * 12; ctx.beginPath(); ctx.ellipse(x, y, 65, 40, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }

  function drawGoal(goal, pal) {
    const pulse = .7 + Math.sin(game.time * 2) * .15;
    ctx.save(); ctx.translate(goal.x + goal.w / 2, goal.y + goal.h - 2); ctx.strokeStyle = pal.glow; ctx.lineWidth = 7; ctx.shadowColor = pal.glow; ctx.shadowBlur = 23; ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, -37, 36, Math.PI, 0); ctx.lineTo(36, 0); ctx.moveTo(-36, 0); ctx.lineTo(-36, -37); ctx.stroke();
    ctx.fillStyle = 'rgba(255,232,161,.22)'; ctx.fillRect(-29, -40, 58, 39); ctx.fillStyle = '#fff3c2'; ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawPlayer(p, pal) {
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 13) % 2 === 0) return;
    const moving = Math.min(1, Math.abs(p.vx) / 260);
    const step = Math.sin(game.time * (moving ? 13 : 2));
    const x = p.x + p.w / 2; const y = p.y;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(7,18,32,.26)'; ctx.beginPath(); ctx.ellipse(0, 53, 21, 5, 0, 0, Math.PI * 2); ctx.fill();
    // ساقان
    ctx.strokeStyle = '#182440'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, 37); ctx.lineTo(-7 + step * 5, 50); ctx.moveTo(5, 37); ctx.lineTo(7 - step * 5, 50); ctx.stroke();
    // وشاح متحرك
    ctx.strokeStyle = pal.glow; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.shadowColor = pal.glow; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(-4 * p.facing, 18); ctx.quadraticCurveTo(-22 * p.facing - moving * 12, 19 + step * 2, -34 * p.facing - moving * 14, 30 + step * 3); ctx.stroke();
    // العباءة
    ctx.shadowBlur = 0; ctx.fillStyle = '#20354f'; ctx.beginPath(); ctx.moveTo(-13, 20); ctx.quadraticCurveTo(0, 15, 13, 20); ctx.lineTo(17, 44); ctx.quadraticCurveTo(0, 49, -17, 44); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#6b9aaa'; ctx.lineWidth = 1.5; ctx.stroke();
    // رأس مقنّع
    ctx.fillStyle = '#d9e9df'; ctx.beginPath(); ctx.arc(0, 13, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1a2d49'; ctx.beginPath(); ctx.arc(0, 11, 11, Math.PI, 0); ctx.lineTo(11, 16); ctx.quadraticCurveTo(0, 25, -11, 16); ctx.fill();
    ctx.fillStyle = '#a8f0e2'; ctx.shadowColor = '#a8f0e2'; ctx.shadowBlur = 8; ctx.fillRect(p.facing > 0 ? 3 : -6, 11, 3, 3);
    // فانوس
    ctx.shadowColor = pal.glow; ctx.shadowBlur = 16; ctx.fillStyle = pal.glow; ctx.beginPath(); ctx.arc(11 * p.facing, 31, 5 + Math.sin(game.time * 4) * .7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawForeground(level) {
    const pal = PALETTES[level.chapter.biome];
    const start = Math.floor(game.camera.x / 150) - 3;
    ctx.save(); ctx.globalAlpha = .38; ctx.fillStyle = pal.near;
    for (let i = start; i < start + 13; i++) { const x = i * 150 - game.camera.x * .08; const h = 45 + hash(i * 9 + level.index) * 75; ctx.beginPath(); ctx.ellipse(x, 690 - h / 2, 36, h, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function render() {
    resize();
    const sx = canvas.width / VW; const sy = canvas.height / VH;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    const level = game.level || buildLevel(0);
    const p = game.player || makePlayer(0);
    const pal = PALETTES[level.chapter.biome];
    drawSky(level); drawFarStructures(level); drawWeather(level);
    ctx.save(); ctx.translate(-game.camera.x, 0);
    // توصيلات اللغز خلف العناصر
    if (level.plates[0] && level.gates[0]) drawWire(level.plates[0].x + level.plates[0].w / 2, level.gates[0].x, level.plates[0].y, level.plates[0].active, pal);
    if (level.levers[0] && level.gates[0]) drawWire(level.levers[0].x + 20, level.gates[0].x, level.levers[0].y + 35, level.levers[0].used, pal);
    level.platforms.forEach((platform) => drawPlatform(platform, pal));
    level.bridges.forEach((bridge) => drawBridge(bridge, pal));
    level.moving.forEach((moving) => drawMoving(moving, pal));
    level.hazards.forEach((hazard) => drawHazard(hazard, pal));
    level.fog && drawFog(level.fog, pal);
    level.anchors.forEach((anchor) => drawAnchor(anchor, pal));
    level.plates.forEach((plate) => drawPlate(plate, pal));
    level.levers.forEach((lever) => drawLever(lever, pal));
    level.seeds.forEach((seed) => drawSeed(seed, pal));
    level.keys.forEach((key) => drawKey(key, pal));
    level.crates.forEach((box) => drawCrate(box, pal));
    level.gates.forEach((gate) => drawGate(gate, pal));
    drawGoal(level.goal, pal); drawPlayer(p, pal);
    ctx.restore(); drawForeground(level);
    const vignette = ctx.createRadialGradient(VW / 2, VH / 2, VH * .24, VW / 2, VH / 2, VH * .78);
    vignette.addColorStop(.55, 'rgba(4,15,32,0)'); vignette.addColorStop(1, 'rgba(4,14,32,.43)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, VW, VH);
    if (game.flash > 0) { ctx.fillStyle = `rgba(255,239,192,${game.flash * .42})`; ctx.fillRect(0, 0, VW, VH); }
  }

  function update(dt) {
    game.time += dt;
    if (!game.running || game.paused || !game.level) return;
    const level = game.level;
    updateMoving(level, dt); updateCrates(level, dt); updatePuzzle(level);
    if (input.actionPressed) tryInteract();
    updatePlayer(level, dt); collectObjects(level); updatePuzzle(level);
    game.camera.x = lerp(game.camera.x, clamp(game.player.x - VW * .42, 0, level.width - VW), Math.min(1, dt * 4.8));
    game.flash = Math.max(0, game.flash - dt);
    updateHud(); updateHint(); audio.ambient(game.time, level.chapter.biome);
    input.jumpPressed = false; input.actionPressed = false;
  }

  function frame(now) {
    const dt = Math.min(.035, (now - game.lastTime) / 1000 || .016);
    game.lastTime = now; update(dt); render(); requestAnimationFrame(frame);
  }

  /* ---------------------------- الواجهة والمدخلات ------------------------ */
  function setControl(key, value) {
    if (value && !input[key] && (key === 'jump' || key === 'action')) input[`${key}Pressed`] = true;
    input[key] = value;
  }
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const map = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'jump', arrowup: 'jump', ' ': 'jump', e: 'action' };
    if (map[key]) { event.preventDefault(); setControl(map[key], true); }
    if (key === 'escape') { event.preventDefault(); togglePause(); }
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    const map = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'jump', arrowup: 'jump', ' ': 'jump', e: 'action' };
    if (map[key]) { event.preventDefault(); setControl(map[key], false); }
  });
  window.addEventListener('blur', clearInput);
  document.querySelectorAll('.touch-btn').forEach((button) => {
    const key = button.dataset.key;
    const on = (event) => { event.preventDefault(); setControl(key, true); };
    const off = (event) => { event.preventDefault(); setControl(key, false); };
    button.addEventListener('pointerdown', on); button.addEventListener('pointerup', off); button.addEventListener('pointercancel', off); button.addEventListener('pointerleave', off);
  });

  $('start-btn').addEventListener('click', () => startChapter(save.lastChapter || 0));
  $('map-btn').addEventListener('click', () => openMap('title'));
  document.querySelectorAll('.close-screen').forEach((button) => button.addEventListener('click', closeMap));
  $('pause-btn').addEventListener('click', togglePause);
  $('resume-btn').addEventListener('click', togglePause);
  $('pause-map-btn').addEventListener('click', () => openMap('pause'));
  $('home-btn').addEventListener('click', () => { game.running = false; game.paused = false; clearInput(); el.pause.classList.add('is-hidden'); el.hud.classList.add('is-hidden'); el.touch.classList.add('is-hidden'); el.title.classList.remove('is-hidden'); });
  $('sound-btn').addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); });
  $('restore-ending').addEventListener('click', () => setEnding('city'));
  $('release-ending').addEventListener('click', () => setEnding('forest'));
  $('credits-map-btn').addEventListener('click', () => { el.credits.classList.add('is-hidden'); openMap('title'); });
  $('reset-save-btn').addEventListener('click', () => {
    if (window.confirm('هل تريد إعادة ضبط كل الفصول والبذور المحفوظة؟')) { save = freshSave(); persist(); audio.setMuted(false); buildMap(); showToast('بدأت رحلة جديدة.'); }
  });

  audio.setMuted(audio.muted);
  game.level = buildLevel(save.lastChapter || 0);
  game.player = makePlayer(save.lastChapter || 0);
  buildMap(); updateHud();
  requestAnimationFrame(frame);
})();
