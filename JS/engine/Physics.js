/**
 * JS/engine/Physics.js
 * محرك الفيزياء وحساب الاصطدامات (AABB Collisions & Forces)
 * بواسطة الوكيل رقم 4: مبرمج الفيزياء والحركة (Movement Specialist)
 */

class PhysicsEngine {
    constructor() {
        // الإعدادات الفيزيائية العامة للعبة
        this.gravity = 0.5;
        this.maxFallSpeed = 12;
        this.friction = 0.82; // احتكاك أرضي قوي لإيقاف اللاعب بوزن وارتداد واقعي
        this.waterFriction = 0.7; // مقاومة الماء عند السباحة تبطئ السرعة
        this.waterGravity = 0.08; // جاذبية مخففة جداً عند السباحة في المياه لمحاكاة الطفو
    }

    /**
     * فحص بسيط للاصطدام بين مستطيلين (AABB Collision)
     */
    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * تحديث وحل الاصطدامات للكيانات المتحركة (اللاعب، الصناديق) مع أرضيات اللعبة المادية
     * @param {object} entity الكائن المتحرك
     * @param {Array} solids قائمة بالمستطيلات الصلبة في المستوى {x, y, width, height}
     */
    resolveCollisions(entity, solids) {
        entity.onGround = false;

        // 1. تطبيق الجاذبية حسب البيئة (ماء أو هواء)
        if (entity.isSwimming) {
            entity.vy += this.waterGravity;
            if (entity.vy > 2.5) entity.vy = 2.5; // سرعة سقوط مائية محددة
        } else if (!entity.isClimbing) {
            entity.vy += this.gravity;
            if (entity.vy > this.maxFallSpeed) entity.vy = this.maxFallSpeed;
        }

        // 2. الحركة الأفقية وحل الاصطدام الأفقي
        entity.x += entity.vx;
        for (let i = 0; i < solids.length; i++) {
            const solid = solids[i];
            if (PhysicsEngine.checkCollision(entity, solid)) {
                // ملامسة من اليسار أو اليمين
                if (entity.vx > 0) {
                    entity.x = solid.x - entity.width; // صد اللاعب لليسار
                } else if (entity.vx < 0) {
                    entity.x = solid.x + solid.width; // صد اللاعب لليمين
                }
                entity.vx = 0;
            }
        }

        // 3. الحركة العمودية وحل الاصطدام العمودي
        entity.y += entity.vy;
        for (let i = 0; i < solids.length; i++) {
            const solid = solids[i];
            if (PhysicsEngine.checkCollision(entity, solid)) {
                // ملامسة من الأعلى أو الأسفل
                if (entity.vy > 0) {
                    entity.y = solid.y - entity.height; // الوقوف على السطح
                    entity.onGround = true;
                    entity.vy = 0;
                } else if (entity.vy < 0) {
                    entity.y = solid.y + solid.height; // الاصطدام بالسقف
                    entity.vy = 0;
                }
            }
        }
        
        // 4. تطبيق الاحتكاك السطحي
        if (entity.isSwimming) {
            entity.vx *= this.waterFriction;
            entity.vy *= this.waterFriction;
        } else {
            // احتكاك طبيعي في الهواء وعلى الأرض
            entity.vx *= this.friction;
        }
    }

    /**
     * تحديث العلاقات الفيزيائية بين اللاعب والصندوق القابل للسحب
     * @param {object} player اللاعب
     * @param {object} box الصندوق
     */
    resolvePlayerBoxInteraction(player, box) {
        // إذا كان اللاعب ممسكاً بالصندوق (Shift or E pressed) وكان بجواره مباشرة
        if (player.isGrabbing && box.isGrabbable) {
            const distance = Math.abs((player.x + player.width/2) - (box.x + box.width/2));
            const playerCenterY = player.y + player.height/2;
            const boxCenterY = box.y + box.height/2;

            // شروط الإمساك: المسافة الأفقية قريبة والارتفاع متقارب
            if (distance < player.width + box.width/2 + 10 && Math.abs(playerCenterY - boxCenterY) < 30) {
                player.isPushing = true;
                
                // ربط السرعة الأفقية للصندوق باللاعب مع إضافة مقاومة وزن الصندوق
                box.vx = player.vx * 0.45; // الصندوق ثقيل يبطئ اللاعب
                player.vx *= 0.45;
                
                // محاذاة الصندوق لئلا يتخلخل من يد اللاعب
                if (player.x < box.x) {
                    // اللاعب يسار الصندوق
                    box.x = player.x + player.width;
                } else {
                    // اللاعب يمين الصندوق
                    box.x = player.x - box.width;
                }
            } else {
                player.isPushing = false;
            }
        } else {
            player.isPushing = false;
        }
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.PhysicsEngine = PhysicsEngine;
