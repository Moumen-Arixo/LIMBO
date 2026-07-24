/**
 * JS/audio/SoundSynth.js
 * محرك الصوت السينمائي التوليدي (Procedural Audio Engine)
 * بواسطة الوكيل رقم 10 (أخصائي هندسة الصوت والمؤثرات)
 */

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        
        // عقد التحكم بالبيئة المستمرة
        this.rainNode = null;
        this.droneNode = null;
        this.heartbeatTimer = null;
        
        this.dangerLevel = 0; // من 0 إلى 1 (يزيد سرعة دقات القلب وتوتر الموسيقى)
        this.lastHeartbeatTime = 0;
        this.heartbeatInterval = 1000; // ميلي ثانية
    }

    init() {
        if (this.initialized) return;
        
        try {
            // تهيئة سياق الصوت
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.initialized = true;
            
            // تشغيل الأصوات البيئية الخلفية فوراً
            this.startAmbient();
            this.startHeartbeatLoop();
            console.log("🔊 تم تهيئة محرك الصوت التوليدي بنجاح.");
        } catch (e) {
            console.error("فشلت تهيئة Web Audio API:", e);
        }
    }

    /**
     * تشغيل الموسيقى الخلفية وصوت المطر المستمر
     */
    startAmbient() {
        if (!this.initialized) return;

        // 1. توليد الضوضاء البيضاء لمحاكاة المطر (Rain Noise Buffer)
        const bufferSize = this.ctx.sampleRate * 2; // ثانيتين من الصوت
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        // مرشح لجعل الضوضاء تبدو كالمطر المتساقط (Bandpass + Lowpass Filters)
        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'bandpass';
        rainFilter.frequency.value = 1200;
        rainFilter.Q.value = 0.5;

        const rainLowpass = this.ctx.createBiquadFilter();
        rainLowpass.type = 'lowpass';
        rainLowpass.frequency.value = 3000;

        const rainGain = this.ctx.createGain();
        rainGain.gain.value = 0.15; // هادئ جداً في الخلفية

        // ربط العقد
        rainSource.connect(rainFilter);
        rainFilter.connect(rainLowpass);
        rainLowpass.connect(rainGain);
        rainGain.connect(this.ctx.destination);

        rainSource.start(0);
        this.rainNode = { source: rainSource, gain: rainGain };

        // 2. توليد النبرة العميقة السينمائية (Atmospheric Industrial Drone)
        const droneOsc1 = this.ctx.createOscillator();
        const droneOsc2 = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();
        const droneFilter = this.ctx.createBiquadFilter();

        droneOsc1.type = 'sawtooth';
        droneOsc1.frequency.value = 55; // نغمة منخفضة جداً A1

        droneOsc2.type = 'triangle';
        droneOsc2.frequency.value = 55.5; // تداخل بسيط لصنع تذبذب طبيعي (Detune)

        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 120; // كتم الترددات الحادة لإبقاء الصوت عميقاً

        droneGain.gain.value = 0.25;

        droneOsc1.connect(droneFilter);
        droneOsc2.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(this.ctx.destination);

        droneOsc1.start(0);
        droneOsc2.start(0);

        this.droneNode = { osc1: droneOsc1, osc2: droneOsc2, filter: droneFilter, gain: droneGain };
    }

    /**
     * إعداد مستوى الخطر لزيادة نبضات القلب والتوتر
     * @param {number} level من 0.0 (أمان تام) إلى 1.0 (خطر مطاردة مباشر)
     */
    setDangerLevel(level) {
        if (!this.initialized) return;
        this.dangerLevel = Math.max(0, Math.min(1, level));
        
        // تعديل تكرار دقات القلب (تتسارع في الخطر)
        this.heartbeatInterval = 1000 - (this.dangerLevel * 600); // بين 1000ms و 400ms

        // تعديل النبرة الخلفية (ترتفع حدة الضوضاء المنخفضة لتعكس القلق)
        if (this.droneNode) {
            const cutoffFreq = 120 + (this.dangerLevel * 180); // من 120Hz إلى 300Hz
            this.droneNode.filter.frequency.setTargetAtTime(cutoffFreq, this.ctx.currentTime, 0.5);
            this.droneNode.gain.gain.setTargetAtTime(0.25 + (this.dangerLevel * 0.15), this.ctx.currentTime, 0.5);
        }
    }

    /**
     * دقة قلب مزدوجة دافئة (Realistic Double Heartbeat)
     */
    startHeartbeatLoop() {
        const beat = () => {
            if (this.initialized) {
                const now = this.ctx.currentTime;
                // الضربة الأولى
                this.triggerOneBeat(60, 0.2, 0.15);
                // الضربة الثانية السريعة الملازمة
                this.triggerOneBeat(48, 0.12, 0.12, now + 0.18);
            }
            this.heartbeatTimer = setTimeout(beat, this.heartbeatInterval);
        };
        beat();
    }

    triggerOneBeat(freq, vol, duration, startTime = null) {
        const time = startTime || this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lp = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        // انخفاض التردد تدريجياً لتبدو الضربة مكتومة وعميقة
        osc.frequency.exponentialRampToValueAtTime(10, time + duration);

        lp.type = 'lowpass';
        lp.frequency.value = 80;

        gain.gain.setValueAtTime(vol * (0.3 + (this.dangerLevel * 0.7)), time);
        gain.gain.linearRampToValueAtTime(0.001, time + duration);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration + 0.05);
    }

    /**
     * تشغيل صوت خطوات الأقدام تفاعلياً حسب السطح
     * @param {string} surface 'dirt' أو 'metal' أو 'water'
     */
    playFootstep(surface = 'dirt') {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // توليد عينة ضوضاء قصيرة
        const bufferSize = this.ctx.sampleRate * 0.08; // 80ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        if (surface === 'water') {
            // صوت طرطشة ماء ناعمة ومخففة
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 1.0;
            gain.gain.setValueAtTime(0.2, time);
        } else if (surface === 'metal') {
            // طرقة معدنية قصيرة وحادة
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            gain.gain.setValueAtTime(0.08, time);

            // تداخل نبرة جيبية معدنية
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, time);
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + 0.05);
        } else {
            // صوت ترابي مكتوم
            filter.type = 'lowpass';
            filter.frequency.value = 180;
            gain.gain.setValueAtTime(0.3, time);
        }

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
        noise.stop(time + 0.1);
    }

    /**
     * صوت نباح كلب حراسة هجومي شرس!
     */
    playDogBark() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // نبرة هبوط سريعة وحادة للكلب
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, time);
        filter.Q.value = 1.5;

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.2);

        // تراكب ضوضاء خشنة لتعطي شعور الزمجرة البرية والخشونة
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 500;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, time);
        noiseGain.gain.linearRampToValueAtTime(0.001, time + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(time);
        noise.stop(time + 0.15);
    }

    /**
     * صوت هبوط ثقيل للجسد (Thud Landing)
     */
    playLand(surface = 'dirt') {
        if (!this.initialized) return;
        
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.2);

        filter.type = 'lowpass';
        filter.frequency.value = 100;

        gain.gain.setValueAtTime(0.6, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.22);

        // صوت خطوات هبوط إضافية للسطح
        this.playFootstep(surface);
        setTimeout(() => this.playFootstep(surface), 60);
    }

    /**
     * صرير سحب الصناديق الحديدية أو الخشبية الثقيلة (Box Drag Squeak)
     */
    playSqueak() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        // صرير عالي التردد ومقزز للأذن يحاكي الاحتكاك
        osc.frequency.setValueAtTime(700, time);
        osc.frequency.linearRampToValueAtTime(500, time + 0.2);

        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.25);
    }

    /**
     * صوت ارتفاع التوتر والترقب (Tension Rise)
     * يتم تفعيله عند عبور مخروط ضوء الكشاف
     */
    playTensionRise() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 1.2); // ارتفاع سريع للتردد

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, time);
        filter.frequency.exponentialRampToValueAtTime(1200, time + 1.2);
        filter.Q.value = 2.0;

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 1.3);
    }

    /**
     * صوت الموت (Shock / Drop Death)
     */
    playDeath() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        
        // 1. صدمة كهربائية قصيرة وعنيفة (Heavy Buzz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.linearRampToValueAtTime(30, time + 0.4);
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.5);

        // 2. هبوط تيار منخفض ومخيف
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(80, time);
        subOsc.frequency.exponentialRampToValueAtTime(20, time + 0.8);
        subGain.gain.setValueAtTime(0.8, time);
        subGain.gain.linearRampToValueAtTime(0.001, time + 0.8);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(time);
        subOsc.stop(time + 0.8);
    }

    /**
     * صوت طرطشة ماء قوية (Water Splash)
     */
    playSplash() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // ضوضاء للماء
        const bufferSize = this.ctx.sampleRate * 0.4; // 400ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);
        filter.frequency.exponentialRampToValueAtTime(150, time + 0.4);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
        noise.stop(time + 0.4);
    }

    /**
     * صوت رافعة معدنية أو تفعيل زر (Lever / Click)
     */
    playLever() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.setValueAtTime(120, time + 0.05);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.12);
    }

    /**
     * صوت فتح بوابة ميكانيكية ثقيلة (Heavy Door Move)
     */
    playDoorOpen() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, time);

        filter.type = 'lowpass';
        filter.frequency.value = 100;

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 1.5); // بوابة تتحرك ببطء لمدة ثانية ونصف

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 1.5);
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.SoundSynth = SoundSynth;
