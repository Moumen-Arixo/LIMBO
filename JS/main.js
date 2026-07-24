/**
 * JS/main.js
 * النواة الأساسية لإدارة دورة اللعبة والتنسيق العام (Main Coordinator & Game Loop)
 * بواسطة الوكيل المدير (Coordinator / Project Manager) والوكيل رقم 2 (Core Developer)
 */

class GameCoordinator {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // الأبعاد الافتراضية للتصميم السينمائي (نسبة 16:9 عريضة)
        this.baseWidth = 960;
        this.baseHeight = 540;
        
        // تهيئة محركات الأنظمة المختلفة
        this.synth = new window.SoundSynth();
        this.physics = new window.PhysicsEngine();
        this.camera = new window.Camera(this.baseWidth, this.baseHeight);
        this.renderer = new window.LevelRenderer();
        
        // بيانات الحالة والتحميل
        this.levelData = null;
        this.player = null;
        this.lastCheckpointId = 0;
        
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'COMPLETED'
        
        // مدخلات لوحة المفاتيح
        this.keys = {
            left: false, right: false, up: false, down: false,
            space: false, shift: false, e: false, r: false
        };

        this.setupKeyboard();
        this.setupResize();
        this.resize();
        
        // بدء حلقة الرسوميات
        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * إعداد واستقبال مدخلات لوحة المفاتيح بشكل آمن وفوري
     */
    setupKeyboard() {
        const handleKey = (e, status) => {
            const code = e.code;
            if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = status;
            if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = status;
            if (code === 'ArrowUp' || code === 'KeyW') this.keys.up = status;
            if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = status;
            if (code === 'Space') this.keys.space = status;
            if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.shift = status;
            if (code === 'KeyE') this.keys.e = status;
            if (code === 'KeyR') this.keys.r = status;

            // تفاعل فوري لبدء اللعبة عند ضغط أي مفتاح في شاشة البداية
            if (this.gameState === 'START' && status === true) {
                this.startGame();
            }

            // إعادة المحاولة الفورية عند الموت وضغط زر R
            if (this.gameState === 'GAMEOVER' && code === 'KeyR' && status === true) {
                this.respawnPlayer();
            }
        };

        window.addEventListener('keydown', (e) => handleKey(e, true));
        window.addEventListener('keyup', (e) => handleKey(e, false));
    }

    /**
     * ملاءمة لوحة الرسم مع حجم شاشة المستخدم مع الحفاظ على التناسب البصري
     */
    setupResize() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // حساب نسبة العرض الأمثل لتركيز المشهد وتجنب التمدد البصري القبيح
        const scale = Math.min(w / this.baseWidth, h / this.baseHeight);
        
        this.canvas.width = this.baseWidth * scale;
        this.canvas.height = this.baseHeight * scale;
        
        this.ctx.imageSmoothingEnabled = false; // رسومات حادة وغير ضبابية
        this.ctx.scale(scale, scale);
        
        this.camera.setSize(this.baseWidth, this.baseHeight);
    }

    /**
     * تشغيل اللعبة فوراً وإخفاء شاشة البداية وتفعيل الصوت
     */
    startGame() {
        this.synth.init(); // تنشيط Web Audio API بعد تفاعل المستخدم مباشرة لتفادي حظر المتصفح
        this.gameState = 'PLAYING';
        
        // تهيئة المستوى الأول
        window.levelData = new window.LevelData();
        this.levelData = window.levelData;
        
        // وضع اللاعب في نقطة البداية الافتراضية
        this.player = new window.Player(this.levelData.spawnPoint.x, this.levelData.spawnPoint.y);
        this.camera.setTarget(this.player);
        
        // إخفاء شاشة البدء السينمائية بأسلوب التلاشي
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.remove('active');
    }

    /**
     * إعادة ولادة اللاعب من آخر نقطة حفظ آمنة عبر عبورها
     */
    respawnPlayer() {
        this.gameState = 'PLAYING';
        
        // استدعاء وكيل البيانات رقم 11 لإعادة وضع العالم وصناديقه لآخر حالة آمنة
        const spawnPos = this.levelData.resetOnDeath(this.lastCheckpointId);
        
        this.player = new window.Player(spawnPos.x, spawnPos.y);
        this.camera.setTarget(this.player);
        this.synth.setDangerLevel(0.0); // تصفير مستوى الخطر فوراً

        // إخفاء شاشة الموت
        const gameOverScreen = document.getElementById('gameover-screen');
        gameOverScreen.classList.remove('active');
    }

    /**
     * حلقة اللعبة الأساسية (The Game Loop)
     */
    loop(timestamp) {
        let dt = timestamp - this.lastTime;
        if (dt > 100) dt = 16; // حماية ضد التجمد وانتقال علامات التبويب
        this.lastTime = timestamp;

        if (this.gameState === 'PLAYING') {
            this.update();
        }
        
        this.draw();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * معالجة كافة حركات وفيزياء اللعبة وتفاعلات العناصر
     */
    update() {
        if (!this.player) return;

        // 1. فحص الموت المفاجئ (النزول أسفل الشاشة أو الهاوية مثلاً)
        if (this.player.y > this.baseHeight + 100 && this.player.isAlive) {
            this.player.die(this.synth);
        }

        // 2. تحديث حركة اللاعب بناء على أزرار التحكم ومحرك الصوت
        this.player.update(this.keys, this.synth);

        // 3. فحص التفاعل مع السلالم (Ladders Check)
        let nearLadder = false;
        for (let i = 0; i < this.levelData.ladders.length; i++) {
            const ladder = this.levelData.ladders[i];
            const pCenterX = this.player.x + this.player.width/2;
            
            // إذا كان محاذاً أفقياً مع السلم وضمن ارتفاعه المادي
            if (pCenterX > ladder.x && pCenterX < ladder.x + ladder.width &&
                this.player.y + this.player.height > ladder.y && this.player.y < ladder.y + ladder.height) {
                nearLadder = true;
                
                // تفعيل التسلق عند ضغط الزر لأعلى أو لأسفل
                if (this.keys.up || this.keys.down) {
                    if (!this.player.isClimbing) {
                        this.player.isClimbing = true;
                        this.player.vy = 0;
                        this.player.x = ladder.x + ladder.width/2 - this.player.width/2; // قفل محاذاة اللاعب أفقياً بمنتصف السلم
                    }
                }
                break;
            }
        }
        if (!nearLadder) {
            this.player.isClimbing = false;
        }

        // 4. فحص التفاعل مع المياه والسباحة (Water Check)
        let insideWater = false;
        for (let i = 0; i < this.levelData.waterZones.length; i++) {
            const water = this.levelData.waterZones[i];
            
            // فحص التصادم مع سطح الماء
            if (PhysicsEngine.checkCollision(this.player, water)) {
                insideWater = true;
                if (!this.player.isSwimming) {
                    // تفعيل السباحة لأول مرة تشغيل
                    this.player.isSwimming = true;
                    this.player.isClimbing = false;
                    this.synth.playSplash(); // طرطشة مائية فجائية مذهلة
                    this.camera.triggerShake(5); // اهتزاز خفيف لبيان وزن الارتطام بالماء
                }
                break;
            }
        }
        if (!insideWater) {
            this.player.isSwimming = false;
        }

        // 5. تحديث حركة الصناديق الفيزيائية واصطدامها بالبشر والأرضيات
        this.levelData.boxes.forEach(box => {
            box.update(this.levelData.solids, this.physics);
            this.physics.resolvePlayerBoxInteraction(this.player, box);
        });

        // 6. تجميع الأجسام الصلبة في المستوى لتصادم اللاعب (Solids + Doors)
        let activeSolids = [...this.levelData.solids];
        this.levelData.doors.forEach(door => {
            // تحديث حالة الأبواب الأمنية ومقدار انخفاضها ببطء
            const isDoorLeverActive = this.levelData.levers.some(l => l.targetDoorId === door.id && l.activated);
            door.update(isDoorLeverActive, this.synth);
            
            // تضاف البوابة لقائمة المصدمات فقط إذا كانت مغلقة أو تغلق
            activeSolids.push(door.getSolidRect());
        });

        // 7. تطبيق الفيزياء وحساب التصادم لللاعب
        if (this.player.isAlive) {
            this.physics.resolveCollisions(this.player, activeSolids);
        }

        // 8. فحص تفاعل اللاعب مع المفاتيح (Lever Interaction)
        this.levelData.levers.forEach(lever => {
            lever.update();
            if (this.keys.shift || this.keys.e) {
                // إذا كان اللاعب بجانب الرافعة وضغط التفاعل
                const dist = Math.abs((this.player.x + this.player.width/2) - (lever.x + lever.width/2));
                if (dist < 30 && Math.abs(this.player.y - lever.y) < 30) {
                    const triggered = lever.trigger(this.synth);
                    if (triggered) {
                        this.camera.triggerShake(3);
                    }
                }
            }
        });

        // 9. فحص كشافات الضوء الدوارة والموت عند الاكتشاف (Searchlights Detection)
        let caughtInSearchlight = false;
        this.levelData.searchlights.forEach(light => {
            light.update();
            if (light.detects(this.player, this.levelData.boxes)) {
                caughtInSearchlight = true;
            }
        });

        if (caughtInSearchlight && this.player.isAlive) {
            // زيادة الـ Danger Level بمعدل سريع، مما يزيد دقات قلب الفتى ومستوى الصوت المحيط
            this.synth.setDangerLevel(0.95);
            
            // إذا بقي الفتى مكشوفاً في الضوء لأكثر من نصف ثانية (صوت الإنذار يرتفع ويتوفى فورياً برصاص القناصة مجهولي الهوية)
            if (Math.random() < 0.05) { // محاكاة رصد سريع وموت سينمائي فوري
                this.player.die(this.synth);
                this.camera.triggerShake(18); // اهتزاز عنيف للشاشة عند الموت
                
                // إظهار شاشة الموت الحمراء السينمائية بعد ثانية ونصف
                setTimeout(() => {
                    if (this.gameState === 'PLAYING') return; // حماية ضد الإعادة السريعة
                    const gameOverScreen = document.getElementById('gameover-screen');
                    gameOverScreen.classList.add('active');
                    this.gameState = 'GAMEOVER';
                }, 1400);
            }
        } else {
            // تصفير مستوى الخطر تدريجياً للهدوء عند الاختباء مجدداً
            let targetDanger = 0.0;
            // إذا كان الكلب يلاحقه، يبقى التوتر مرتفعاً
            if (this.levelData.dogs.some(dog => dog.state === 'CHASE')) {
                targetDanger = 0.7;
            }
            this.synth.setDangerLevel(targetDanger);
        }

        // 10. تحديث الكلاب ومطاردتها للشخصية
        this.levelData.dogs.forEach(dog => {
            dog.update(this.player, this.levelData.solids, this.physics, this.synth);
            
            // إذا مات اللاعب بسبب الكلب، نهيئ شاشة الموت الفورية
            if (!this.player.isAlive && this.gameState === 'PLAYING') {
                this.camera.triggerShake(15);
                setTimeout(() => {
                    const gameOverScreen = document.getElementById('gameover-screen');
                    gameOverScreen.classList.add('active');
                    this.gameState = 'GAMEOVER';
                }, 1400);
            }
        });

        // 11. فحص عبور نقاط الحفظ (Checkpoints Activation)
        this.levelData.checkpoints.forEach(cp => {
            if (cp.update(this.player)) {
                this.lastCheckpointId = cp.id;
                this.camera.triggerShake(4); // وميض واهتزاز خفيف جداً يدل على الأمان وحفظ اللعبة
            }
        });

        // 12. تتبع الكاميرا للفتى في مسرح اللعبة
        this.camera.update(this.levelData.width, 600);

        // 13. فحص الوصول لنهاية الفصل الأول (مستودع المصنع الكلي X > 2850)
        if (this.player.x > 2880 && this.player.isAlive) {
            this.gameState = 'COMPLETED';
            this.synth.setDangerLevel(0.0);
            
            // تدرج تعتيم الشاشة وإظهار واجهة النهاية الفنية للعبة Inside
            const startScreen = document.getElementById('start-screen');
            const title = startScreen.querySelector('h1');
            const subtitle = startScreen.querySelector('.subtitle');
            const blink = startScreen.querySelector('.blink');
            const guide = startScreen.querySelector('.controls-guide');

            title.innerText = "انتهى الفصل الأول";
            title.style.color = '#8b2635';
            subtitle.innerText = "To Be Continued...";
            blink.innerText = "شكراً للعبك ديمو LIMBO: INSIDE THE MACHINE المطور كلياً بنظام الـ 20 إيجنت!";
            blink.style.animation = "none";
            guide.innerHTML = "<p style='text-align:center;'>تمت البرمجة وهندسة الأصوات إجرائياً بنجاح تام.<br>اضغط <strong>R</strong> لإعادة بدء الديمو من البداية.</p>";

            startScreen.classList.add('active');
        }
    }

    /**
     * رسم كامل العالم والطبقات والكيانات على الشاشة
     */
    draw() {
        // تنظيف لوحة الرسم قبل العرض
        this.ctx.fillStyle = '#050608';
        this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

        if (this.gameState === 'START') {
            // رسم شاشة تمهيدية فنية خلفية للشاشة الفارغة قبل التحميل
            this.ctx.fillStyle = '#0a0d13';
            this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
            return;
        }

        // --- بدء رسم مسرح اللعبة تحت تحويل الكاميرا السينمائية ---
        
        // 1. الطبقة البصرية البعيدة جداً (Far Parallax Background)
        this.renderer.drawFarBackground(this.ctx, this.camera, this.levelData.width, 600);

        // 2. الطبقة البصرية المتوسطة (Mid Parallax Background)
        this.renderer.drawMidBackground(this.ctx, this.camera);

        // تطبيق إزاحة الكاميرا لرسم المسرح الأساسي
        this.camera.apply(this.ctx);

        // 3. رسم السلالم (Ladders)
        this.renderer.drawLadders(this.ctx, this.levelData.ladders);

        // 4. رسم نقاط الحفظ والرافعات والبوابات (Interactive Environment)
        this.levelData.checkpoints.forEach(cp => cp.draw(this.ctx));
        this.levelData.levers.forEach(l => l.draw(this.ctx));
        this.levelData.doors.forEach(d => d.draw(this.ctx));

        // 5. رسم الصناديق الخشبية (Boxes)
        this.levelData.boxes.forEach(box => box.draw(this.ctx));

        // 6. رسم اللاعب (Player - The Boy)
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // 7. رسم الأعداء: كلاب الحراسة وكشافات الضوء
        this.levelData.dogs.forEach(dog => dog.draw(this.ctx));
        this.levelData.searchlights.forEach(light => light.draw(this.ctx));

        // 8. رسم حوض المياه المتموج (Wavy Water Surface)
        this.renderer.drawWater(this.ctx, this.levelData.waterZones);

        // 9. رسم الأرضيات المادية الصلبة ككتل جيرية سوداء قاتمة كطبيعة فن Inside
        this.ctx.fillStyle = '#010204';
        this.levelData.solids.forEach(solid => {
            this.ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
        });

        // استعادة تحويلات الكاميرا للطبقة الأمامية والمطر
        this.camera.restore(this.ctx);

        // --- انتهاء رسم مسرح اللعبة المادي ---

        // 10. رسم الطبقة البصرية الأمامية جداً (Foreground Parallax Layer)
        this.renderer.drawForeground(this.ctx, this.camera);

        // 11. رسم المطر التفاعلي البيئي الساقط
        this.renderer.drawRain(this.ctx, this.camera);

        // 12. رسم الأجواء الغيمية والضباب والـ Vignette
        this.renderer.drawAtmosphere(this.ctx, this.camera);
    }
}

// تشغيل المحرك عند تحميل الصفحة بالكامل
window.addEventListener('load', () => {
    window.coordinator = new GameCoordinator();
});
