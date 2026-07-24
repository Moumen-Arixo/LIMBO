/**
 * JS/levels/LevelRenderer.js
 * محرك رسم الخلفيات ثلاثية الأبعاد الوهمية والطبقات البصرية العميقة (Parallax & Atmosphere Engine)
 * بواسطة الوكيل رقم 6: مهندس مطالبات الفن والصور (Visual & Art Designer)
 */

class LevelRenderer {
    constructor() {
        // مصفوفة جزيئات المطر المتساقطة سينمائياً
        this.rainParticles = [];
        this.initRain();
    }

    /**
     * تهيئة 100 جزيء مطر ساقط بزاوية مائلة
     */
    initRain() {
        for (let i = 0; i < 120; i++) {
            this.rainParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                speed: 8 + Math.random() * 6,
                len: 15 + Math.random() * 15,
                opacity: 0.05 + Math.random() * 0.12
            });
        }
    }

    /**
     * رسم طبقة الخلفية البعيدة جداً (Far Background Layer)
     * تتحرك ببطء شديد 10% من حركة الكاميرا لتحقيق عمق هائل
     */
    drawFarBackground(ctx, camera, mapWidth, mapHeight) {
        ctx.fillStyle = '#090a0d'; // غيوم السماء المكتومة الداكنة
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

        // تأثير تدرج شروق/غروب باهت تحت السحب
        const skyGrad = ctx.createLinearGradient(0, camera.y, 0, camera.y + camera.height);
        skyGrad.addColorStop(0, '#060709');
        skyGrad.addColorStop(0.7, '#0b0e14');
        skyGrad.addColorStop(1, '#181b22'); // لون رمادي مزرق عند خط الأفق
        ctx.fillStyle = skyGrad;
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

        ctx.save();
        // سرعة تحريك طبقة الـ Far: 10% فقط من إزاحة الكاميرا
        ctx.translate(-camera.x * 0.1, -camera.y * 0.1);

        // رسم الجبال والأنابيب البعيدة
        ctx.fillStyle = '#101319'; // لون ظلال رمادي باهت لتبدو الأجسام بعيدة في الضباب
        const elements = window.levelData.parallaxElements.far;
        
        elements.forEach(el => {
            if (el.type === 'mountain') {
                ctx.beginPath();
                ctx.moveTo(el.x, el.y + el.height);
                ctx.lineTo(el.x + el.width / 2, el.y); // قمة الجبل
                ctx.lineTo(el.x + el.width, el.y + el.height);
                ctx.closePath();
                ctx.fill();
            } else if (el.type === 'chimney') {
                ctx.fillRect(el.x, el.y, el.width, el.height);
                // رسم دخان رقيق متصاعد من المدخنة
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                ctx.beginPath();
                ctx.arc(el.x + el.width/2 + 5, el.y - 20, 15, 0, Math.PI*2);
                ctx.arc(el.x + el.width/2 + 20, el.y - 45, 25, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#101319'; // استعادة اللون
            }
        });

        ctx.restore();
    }

    /**
     * رسم طبقة الخلفية المتوسطة (Mid Background Layer)
     * تتحرك بسرعة 40% لتجاور الأجسام الهيكلية والشجر
     */
    drawMidBackground(ctx, camera) {
        ctx.save();
        // سرعة الطبقة المتوسطة: 40% من إزاحة الكاميرا
        ctx.translate(-camera.x * 0.4, -camera.y * 0.4);

        const elements = window.levelData.parallaxElements.mid;

        elements.forEach(el => {
            if (el.type === 'tree') {
                // شجرة ديستوبية بهيكل عظمي غامق بلا أوراق (أسلوب اللعبة المميز)
                ctx.fillStyle = '#0a0c10';
                ctx.fillRect(el.x, el.y, el.width, el.height); // جذع الشجرة
                
                // أغصان ممتدة
                ctx.strokeStyle = '#0a0c10';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(el.x + el.width/2, el.y + 40);
                ctx.lineTo(el.x - 20, el.y + 10);
                ctx.moveTo(el.x + el.width/2, el.y + 80);
                ctx.lineTo(el.x + 30, el.y + 50);
                ctx.stroke();
            } else if (el.type === 'beam') {
                ctx.fillStyle = '#090b10';
                ctx.fillRect(el.x, el.y, el.width, el.height);
            } else if (el.type === 'girder') {
                ctx.fillStyle = '#080a0e';
                ctx.fillRect(el.x, el.y, el.width, el.height);
                // تفاصيل جمالية للرافعة السقفية كدعامات حديدية مائلة
                ctx.strokeStyle = '#050608';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let step = el.x; step < el.x + el.width; step += 30) {
                    ctx.moveTo(step, el.y);
                    ctx.lineTo(step + 20, el.y + el.height);
                }
                ctx.stroke();
            } else if (el.type === 'tank') {
                ctx.fillStyle = '#08090d';
                ctx.fillRect(el.x, el.y, el.width, el.height);
                // غطاء الخزان الدائري بالأعلى
                ctx.beginPath();
                ctx.ellipse(el.x + el.width/2, el.y, el.width/2, 10, 0, 0, Math.PI*2);
                ctx.fill();
            } else if (el.type === 'pipe_horizontal') {
                ctx.fillStyle = '#06070a';
                ctx.fillRect(el.x, el.y, el.width, el.height);
            }
        });

        ctx.restore();
    }

    /**
     * رسم طبقة الأصول الأمامية المقربة جداً (Foreground Parallax Layer)
     * تتحرك بسرعة 130% لتوحي بتلصص عدسة الكاميرا من بين الأدغال والأسوار
     */
    drawForeground(ctx, camera) {
        ctx.save();
        // سرعة الطبقة الأمامية: 130% من إزاحة الكاميرا
        ctx.translate(-camera.x * 1.3, -camera.y * 1.3);

        ctx.fillStyle = '#010204'; // أسود مطبق وخالص للأجسام القريبة جداً
        ctx.strokeStyle = '#010204';
        
        const elements = window.levelData.parallaxElements.fore;

        elements.forEach(el => {
            if (el.type === 'bush') {
                // رسم شجيرات مستديرة متداخلة
                ctx.beginPath();
                ctx.arc(el.x, el.y + el.height, el.width * 0.4, 0, Math.PI * 2);
                ctx.arc(el.x + el.width * 0.4, el.y + el.height - 10, el.width * 0.5, 0, Math.PI * 2);
                ctx.arc(el.x + el.width * 0.8, el.y + el.height, el.width * 0.4, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            } else if (el.type === 'fence') {
                // سياج حديدي مقرب
                ctx.lineWidth = 4;
                ctx.beginPath();
                // العوارض الأفقية للوصول للمشهد التالي
                ctx.moveTo(el.x, el.y + 10);
                ctx.lineTo(el.x + el.width, el.y + 10);
                ctx.moveTo(el.x, el.y + 25);
                ctx.lineTo(el.x + el.width, el.y + 25);
                
                // العوارض العمودية المدببة
                for (let step = el.x + 10; step < el.x + el.width; step += 25) {
                    ctx.moveTo(step, el.y + el.height);
                    ctx.lineTo(step, el.y);
                    ctx.lineTo(step - 2, el.y + 4);
                }
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    /**
     * رسم السلالم (Ladders) في مسرح اللعبة
     */
    drawLadders(ctx, ladders) {
        ctx.save();
        ctx.strokeStyle = '#06070a';
        ctx.lineWidth = 3.5;
        
        ladders.forEach(l => {
            // القضبان العمودية الجانبية
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x, l.y + l.height);
            ctx.moveTo(l.x + l.width, l.y);
            ctx.lineTo(l.x + l.width, l.y + l.height);
            ctx.stroke();

            // العوارض الأفقية للتسلق
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let step = l.y + 10; step < l.y + l.height; step += 15) {
                ctx.moveTo(l.x, step);
                ctx.lineTo(l.x + l.width, step);
            }
            ctx.stroke();
            ctx.lineWidth = 3.5; // استعادة السماكة
        });
        ctx.restore();
    }

    /**
     * رسم حوض المياه مع مؤثر متموج تفاعلي (Water Rendering)
     */
    drawWater(ctx, waterZones) {
        ctx.save();
        
        waterZones.forEach(w => {
            // رسم سطح مائي متموج إجرائياً باستخدام جيب الجيب (Sine Wave Shader Style)
            const time = Date.now() * 0.003;
            
            ctx.fillStyle = 'rgba(24, 30, 40, 0.65)'; // مياه رمادية مزرقة شبه شفافة
            ctx.beginPath();
            ctx.moveTo(w.x, w.y + w.height);
            ctx.lineTo(w.x, w.y);
            
            // تكوين منحن متموج لسطح المياه
            for (let px = w.x; px <= w.x + w.width; px += 15) {
                const waveY = w.y + Math.sin(px * 0.02 + time) * 6 + Math.cos(px * 0.01 - time * 0.5) * 2;
                ctx.lineTo(px, waveY);
            }
            ctx.lineTo(w.x + w.width, w.y + w.height);
            ctx.closePath();
            ctx.fill();

            // رسم رغوة بيضاء خفيفة جداً تطفو على قمة الأمواج
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let px = w.x; px <= w.x + w.width; px += 8) {
                const waveY = w.y + Math.sin(px * 0.02 + time) * 6 + Math.cos(px * 0.01 - time * 0.5) * 2;
                if (px === w.x) ctx.moveTo(px, waveY);
                else ctx.lineTo(px, waveY);
            }
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * رسم المطر السينمائي في مساحة الشاشة الحالية
     */
    drawRain(ctx, camera) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        
        // تحديث ورسم جزيئات المطر المتساقطة
        this.rainParticles.forEach(p => {
            ctx.strokeStyle = `rgba(180, 200, 220, ${p.opacity})`;
            ctx.beginPath();
            ctx.moveTo(camera.x + p.x, camera.y + p.y);
            ctx.lineTo(camera.x + p.x - 3, camera.y + p.y + p.len); // هطول مائل لليسار قليلاً بفعل الرياح
            ctx.stroke();

            // تحريك جزيء المطر لأسفل
            p.y += p.speed;
            p.x -= p.speed * 0.15; // ميلان خفيف

            // إعادة تدوير الجزيء إذا نزل أسفل الكاميرا
            if (p.y > camera.height) {
                p.y = -20;
                p.x = Math.random() * camera.width;
            }
        });
        
        ctx.restore();
    }

    /**
     * رسم الأجواء الضبابية والـ Vignette
     */
    drawAtmosphere(ctx, camera) {
        ctx.save();
        
        // تدرج ضبابي مائل من الأعلى لأسفل يعزز شعور الكآبة والجو المغبر
        const fogGrad = ctx.createLinearGradient(camera.x, camera.y, camera.x, camera.y + camera.height);
        fogGrad.addColorStop(0, 'rgba(10, 12, 16, 0.0)');
        fogGrad.addColorStop(0.5, 'rgba(10, 12, 16, 0.15)');
        fogGrad.addColorStop(0.85, 'rgba(12, 15, 20, 0.4)'); // ضباب مكثف على مقربة من الأرض
        fogGrad.addColorStop(1, 'rgba(8, 10, 13, 0.7)');
        
        ctx.fillStyle = fogGrad;
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

        ctx.restore();
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.LevelRenderer = LevelRenderer;
