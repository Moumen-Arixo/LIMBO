/**
 * JS/engine/Camera.js
 * الكاميرا السينمائية مع تتبع ناعم واهتزاز شاشة (Camera Follow & Screenshake)
 * بواسطة الوكيل رقم 4: مبرمج الحركة والفيزياء (Movement Specialist)
 */

class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.target = null;
        
        // معدل تتبع ناعم (Lerp Factor) - كلما قل، زادت نعومة وتأخر الكاميرا السينمائي
        this.lerp = 0.06;
        
        // اهتزاز الشاشة (Screenshake)
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92; // معدل تلاشي الاهتزاز في كل إطار
        
        // إزاحة الهدف لرؤية مساحة أكبر أمام اللاعب (Camera Offsetting)
        this.offsetX = 0;
        this.offsetY = -50; // رفع الكاميرا للأعلى قليلاً لرؤية الأرضية
    }

    setTarget(entity) {
        this.target = entity;
        if (entity) {
            this.x = entity.x - this.width / 2;
            this.y = entity.y - this.height / 2 + this.offsetY;
        }
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * تفعيل اهتزاز الكاميرا فجأة (مثل الارتطام أو الصرخة)
     */
    triggerShake(intensity) {
        this.shakeIntensity = intensity;
    }

    update(mapWidth, mapHeight) {
        if (!this.target) return;

        // حساب الموضع المستهدف للكاميرا لتركز على اللاعب في المنتصف
        const targetX = this.target.x - this.width / 2 + this.offsetX;
        const targetY = this.target.y - this.height / 2 + this.offsetY;

        // تطبيق الاستكمال الخطي (Linear Interpolation) لحركة سينمائية ناعمة جداً
        this.x += (targetX - this.x) * this.lerp;
        this.y += (targetY - this.y) * this.lerp;

        // محاصرة حدود الكاميرا داخل الخريطة لكي لا نخرج خارج العالم
        this.x = Math.max(0, Math.min(mapWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(mapHeight - this.height, this.y));

        // حساب اهتزاز الكاميرا وتبديده تدريجياً
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }
    }

    /**
     * تطبيق تحريك المشهد (Translation) على سياق الرسم في اللوحة
     */
    apply(ctx) {
        ctx.save();
        
        // إذا كان هناك اهتزاز نشط، نقوم بإزاحة المحاور عشوائياً بمقدار شدة الاهتزاز
        let dx = 0;
        let dy = 0;
        if (this.shakeIntensity > 0) {
            dx = (Math.random() - 0.5) * this.shakeIntensity;
            dy = (Math.random() - 0.5) * this.shakeIntensity;
        }
        
        ctx.translate(-Math.floor(this.x + dx), -Math.floor(this.y + dy));
    }

    /**
     * استرجاع سياق الرسم الأصلي
     */
    restore(ctx) {
        ctx.restore();
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.Camera = Camera;
