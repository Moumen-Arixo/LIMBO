/**
 * JS/entities/Elements.js
 * الكيانات التفاعلية والأعداء والأفخاخ (Boxes, Doors, Levers, Searchlights, Dogs, Checkpoints)
 * بواسطة الوكيل رقم 3 & 5: مبرمج الأسلوب والذكاء الاصطناعي للأعداء
 */

// ==========================================
// 1. الصندوق المادي القابل للدفع والسحب (Physics Box)
// ==========================================
class Box {
    constructor(x, y, width = 36, height = 36) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        
        this.onGround = false;
        this.isGrabbable = true; // يمكن للاعب الإمساك به
    }

    update(solids, physics) {
        // تحديث فيزيائيات الصندوق الذاتية كالسقوط والاصطدام بالأرضيات
        physics.resolveCollisions(this, solids);
    }

    draw(ctx) {
        ctx.save();
        
        // رسم صندوق خشبي داكن ثقيل مع تدعيمات قطرية معدنية
        ctx.fillStyle = '#14171a';
        ctx.strokeStyle = '#020304';
        ctx.lineWidth = 3;
        
        // تعبئة وإطار الصندوق
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // تفاصيل خشبية قطرية (X brace)
        ctx.strokeStyle = '#090a0d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y + 4);
        ctx.lineTo(this.x + this.width - 4, this.y + this.height - 4);
        ctx.moveTo(this.x + this.width - 4, this.y + 4);
        ctx.lineTo(this.x + 4, this.y + this.height - 4);
        ctx.stroke();

        // مسامير في الزوايا
        ctx.fillStyle = '#050607';
        const spots = [
            [this.x + 4, this.y + 4],
            [this.x + this.width - 4, this.y + 4],
            [this.x + 4, this.y + this.height - 4],
            [this.x + this.width - 4, this.y + this.height - 4]
        ];
        spots.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 1.5, 0, Math.PI*2);
            ctx.fill();
        });

        ctx.restore();
    }
}

// ==========================================
// 2. الرافعة أو المفتاح الكهربائي (Lever Switch)
// ==========================================
class Lever {
    constructor(x, y, targetDoorId) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.targetDoorId = targetDoorId;
        this.activated = false;
        
        this.cooldown = 0; // لعدم تشغيله مراراً وتكراراً بثانية واحدة
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
    }

    trigger(synth) {
        if (this.cooldown > 0) return false;
        this.activated = !this.activated;
        this.cooldown = 30; // نصف ثانية تبريد
        synth.playLever();
        return true;
    }

    draw(ctx) {
        ctx.save();

        // رسم القاعدة الحديدية للمفتاح
        ctx.fillStyle = '#101216';
        ctx.fillRect(this.x, this.y + 10, this.width, 10);
        
        // رسم عمود الرافعة
        ctx.strokeStyle = '#323a45';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 10);
        if (this.activated) {
            // مائل لليمين عند التفعيل
            ctx.lineTo(this.x + 22, this.y - 2);
            ctx.stroke();
            // المقبض الأحمر المضيء
            ctx.fillStyle = '#9e1a2a';
            ctx.beginPath();
            ctx.arc(this.x + 22, this.y - 2, 4, 0, Math.PI*2);
            ctx.fill();
        } else {
            // مائل لليصار عند الخمول
            ctx.lineTo(this.x - 2, this.y - 2);
            ctx.stroke();
            // المقبض الأحمر الخافت
            ctx.fillStyle = '#4a0d16';
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y - 2, 4, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================
// 3. البوابة الأمنية الثقيلة (Security Door)
// ==========================================
class Door {
    constructor(id, x, y, width = 16, height = 80) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.startY = y;
        this.width = width;
        this.height = height;
        
        this.isOpen = false;
        this.currentHeight = height; // يتناقص عندما تفتح البوابة للأعلى
    }

    update(leverState, synth) {
        const targetHeight = leverState ? 0 : this.height;
        
        if (this.currentHeight !== targetHeight) {
            if (this.currentHeight > targetHeight) {
                this.currentHeight = Math.max(targetHeight, this.currentHeight - 2);
                if (this.currentHeight === 0 && !this.isOpen) {
                    this.isOpen = true;
                }
            } else {
                this.currentHeight = Math.min(targetHeight, this.currentHeight + 2);
                if (this.isOpen) {
                    this.isOpen = false;
                }
            }
        }
    }

    // تُرجع أبعاد البوابة الفعلية للفيزياء للاصطدام
    getSolidRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.currentHeight
        };
    }

    draw(ctx) {
        if (this.currentHeight <= 2) return; // مختفية تماماً مفتوحة

        ctx.save();
        
        // رسم البوابة الفولاذية المخططة
        ctx.fillStyle = '#1c2026';
        ctx.strokeStyle = '#0b0d10';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.currentHeight);
        ctx.strokeRect(this.x, this.y, this.width, this.currentHeight);

        // خطوط أفقية أمنية صفراء باهتة
        ctx.fillStyle = '#8f7e2c';
        for (let i = 10; i < this.currentHeight; i += 16) {
            ctx.fillRect(this.x + 2, this.y + i, this.width - 4, 4);
        }

        ctx.restore();
    }
}

// ==========================================
// 4. كشاف الضوء الدوار الذكي (Volumetric Searchlight)
// ==========================================
class Searchlight {
    constructor(x, y, range = 220, angleStart = 0.3, angleEnd = 2.8, speed = 0.01) {
        this.x = x;
        this.y = y;
        this.range = range; // طول شعاع الضوء
        this.angleStart = angleStart; // الزاوية الدنيا
        this.angleEnd = angleEnd;     // الزاوية القصوى
        this.speed = speed;
        
        this.currentAngle = angleStart;
        this.movingRight = true;
        this.beamWidth = 0.45; // بالراديان (عرض مخروط الضوء)
    }

    update() {
        // تدوير الكشاف ببطء يميناً ويساراً
        if (this.movingRight) {
            this.currentAngle += this.speed;
            if (this.currentAngle >= this.angleEnd) this.movingRight = false;
        } else {
            this.currentAngle -= this.speed;
            if (this.currentAngle <= this.angleStart) this.movingRight = true;
        }
    }

    /**
     * فحص ما إذا كان الكيان (اللاعب) تم اكتشافه بواسطة الكشاف
     * @param {object} entity اللاعب
     * @param {Array} boxes الصناديق المتواجدة في الغرفة (الصناديق تحجب الضوء)
     */
    detects(entity, boxes = []) {
        if (!entity.isAlive) return false;

        const pX = entity.x + entity.width / 2;
        const pY = entity.y + entity.height / 2;

        // 1. حساب المسافة المباشرة
        const dx = pX - this.x;
        const dy = pY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.range) return false; // بعيد جداً خارج مدى الكشاف

        // 2. حساب زاوية البطل بالنسبة للكشاف
        let angleToPlayer = Math.atan2(dy, dx);
        if (angleToPlayer < 0) angleToPlayer += Math.PI * 2; // تعديل الزاوية لتكون موجبة

        // حساب المسافة الدائرية بين الكشاف واللاعب
        const diff = Math.abs(angleToPlayer - this.currentAngle);
        const insideCone = diff < this.beamWidth / 2;

        if (insideCone) {
            // 3. فحص ما إذا كان هناك صندوق يحجب الضوء (Raycasting Block Check)
            for (let i = 0; i < boxes.length; i++) {
                const box = boxes[i];
                const bX = box.x + box.width / 2;
                const bY = box.y + box.height / 2;

                const distToBox = Math.sqrt((bX - this.x)**2 + (bY - this.y)**2);
                
                // إذا كان الصندوق يقع بين الكشاف واللاعب
                if (distToBox < dist) {
                    let angleToBox = Math.atan2(bY - this.y, bX - this.x);
                    if (angleToBox < 0) angleToBox += Math.PI * 2;
                    
                    // إذا كان الصندوق على نفس مسار الزاوية تقريباً
                    if (Math.abs(angleToPlayer - angleToBox) < 0.12) {
                        return false; // الصندوق يحجب شعاع الضوء عن اللاعب بنجاح!
                    }
                }
            }
            return true; // اللاعب مكشوف ومكتشف!
        }
        return false;
    }

    draw(ctx) {
        ctx.save();

        // 1. رسم المنبع الضوئي الفولاذي الدوار في السقف
        ctx.fillStyle = '#22252a';
        ctx.strokeStyle = '#050607';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // رسم الفوهة الدوارة الموجهة
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, this.currentAngle - 0.5, this.currentAngle + 0.5);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();

        // 2. رسم المخروط الضوئي الحجمي الشفاف الباعث للدفء والضباب
        const endAngleLeft = this.currentAngle - this.beamWidth / 2;
        const endAngleRight = this.currentAngle + this.beamWidth / 2;

        const leftX = this.x + Math.cos(endAngleLeft) * this.range;
        const leftY = this.y + Math.sin(endAngleLeft) * this.range;
        const rightX = this.x + Math.cos(endAngleRight) * this.range;
        const rightY = this.y + Math.sin(endAngleRight) * this.range;

        // تدرج إشعاعي دائرى للضوء المتلاشى تدريجياً
        const grad = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, this.range);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.28)'); // وهج دافئ خفيف
        grad.addColorStop(0.3, 'rgba(255, 255, 200, 0.14)');
        grad.addColorStop(1, 'rgba(255, 255, 200, 0.0)'); // متلاشٍ تماماً في الأطراف

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(leftX, leftY);
        // تقويس نهاية مخروط الضوء
        ctx.arc(this.x, this.y, this.range, endAngleLeft, endAngleRight);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();

        // رسم النواة الضوئية للمنشأ الضيق جداً
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.currentAngle) * this.range, this.y + Math.sin(this.currentAngle) * this.range);
        ctx.stroke();

        ctx.restore();
    }
}

// ==========================================
// 5. كلب الحراسة الشرس (Guard Dog Enemy)
// ==========================================
class GuardDog {
    constructor(x, y, patrolLeft, patrolRight) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        
        this.vx = 0;
        this.vy = 0;
        
        // مسارات الدورية
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.patrolSpeed = 1.3;
        this.chaseSpeed = 4.2; // ركض جنوني وسريع جداً خلف اللاعب!
        
        // حالات الكلب
        this.state = 'PATROL'; // 'PATROL', 'CHASE', 'ATTACK'
        this.facingRight = true;
        this.onGround = false;
        
        // أنيميشن دورة الركض
        this.runCycle = 0;
        this.barkCooldown = 0;
    }

    update(player, solids, physics, synth) {
        if (!player.isAlive) {
            this.state = 'PATROL';
        }

        this.barkCooldown--;

        // 1. حساب المسافة إلى اللاعب لتغيير الحالة
        const dx = (player.x + player.width/2) - (this.x + this.width/2);
        const dy = (player.y + player.height/2) - (this.y + this.height/2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // رؤية الكلب للاعب: إذا كان اللاعب قريباً وبنفس الارتفاع تقريباً وليس مختبئاً
        if (player.isAlive && dist < 240 && Math.abs(dy) < 80) {
            // إذا كان اللاعب خلف صندوق، يتم حجب رؤية الكلب
            this.state = 'CHASE';
        } else {
            this.state = 'PATROL';
        }

        // 2. منطق اتخاذ القرار والذكاء الاصطناعي (AI State Machine)
        if (this.state === 'CHASE') {
            // مطاردة اللاعب بكل شراسة
            this.facingRight = dx > 0;
            this.vx = this.facingRight ? this.chaseSpeed : -this.chaseSpeed;
            this.runCycle += 0.35; // دوران أرجل سريع

            // إطلاق عواء ونباح بشكل دوري
            if (this.barkCooldown <= 0) {
                synth.playDogBark();
                this.barkCooldown = 60 + Math.random() * 40; // مرة كل ثانية وثانية ونصف
            }
            
            // زيادة معدل خطر الموسيقى ودقات القلب بسبب ملاحقة الكلب
            synth.setDangerLevel(0.8);

            // افتراس البطل عند الملامسة الفورية
            if (dist < 18) {
                player.die(synth);
                synth.playDogBark();
            }
        } else {
            // تسيير دورية كلاسيكية هادئة
            this.runCycle += 0.08;
            if (this.facingRight) {
                this.vx = this.patrolSpeed;
                if (this.x + this.width >= this.patrolRight) {
                    this.facingRight = false;
                }
            } else {
                this.vx = -this.patrolSpeed;
                if (this.x <= this.patrolLeft) {
                    this.facingRight = true;
                }
            }
        }

        // تطبيق الجاذبية وحل الاصطدامات مع الأرضيات للكلب
        physics.resolveCollisions(this, solids);
    }

    draw(ctx) {
        ctx.save();

        // تدوير الرسم حسب اتجاه حركة الكلب
        ctx.translate(this.x + this.width / 2, 0);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        ctx.translate(-(this.x + this.width / 2), 0);

        ctx.fillStyle = '#050608'; // كلب أسود ظلالي قاتم مخيف
        ctx.strokeStyle = '#050608';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // حساب حركة الأقدام الأربعة إجرائياً
        let legSwing = Math.sin(this.runCycle);
        let backLegY = this.state === 'CHASE' ? Math.abs(legSwing) * -5 : Math.abs(legSwing) * -2;
        let frontLegY = this.state === 'CHASE' ? Math.abs(Math.cos(this.runCycle)) * -5 : Math.abs(Math.cos(this.runCycle)) * -2;

        const bodyY = this.y + 6 + (this.state === 'CHASE' ? Math.sin(this.runCycle * 2) * 1.5 : 0);

        // 1. الأقدام الخلفية
        ctx.beginPath();
        ctx.moveTo(this.x + 4, bodyY + 6);
        ctx.lineTo(this.x + 1 + legSwing * 6, this.y + this.height + backLegY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + 8, bodyY + 6);
        ctx.lineTo(this.x + 5 - legSwing * 6, this.y + this.height + backLegY);
        ctx.stroke();

        // 2. الأقدام الأمامية
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 8, bodyY + 6);
        ctx.lineTo(this.x + this.width - 11 + Math.cos(this.runCycle) * 6, this.y + this.height + frontLegY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 4, bodyY + 6);
        ctx.lineTo(this.x + this.width - 6 - Math.cos(this.runCycle) * 6, this.y + this.height + frontLegY);
        ctx.stroke();

        // 3. ذيل الكلب المتصلب للخلف أثناء الجري
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x + 2, bodyY + 2);
        if (this.state === 'CHASE') {
            ctx.lineTo(this.x - 8, bodyY - 4 + Math.sin(this.runCycle) * 3);
        } else {
            ctx.lineTo(this.x - 4, bodyY + 5);
        }
        ctx.stroke();

        // 4. الجذع والرقبة والرأس
        ctx.fillStyle = '#06070a';
        ctx.fillRect(this.x + 4, bodyY, this.width - 8, 8); // البطن والظهر
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 8, bodyY);
        ctx.lineTo(this.x + this.width, bodyY - 6); // الرقبة الممتدة للأعلى
        ctx.lineTo(this.x + this.width + 6, bodyY - 6); // الأنف والفكين
        ctx.lineTo(this.x + this.width, bodyY + 6);
        ctx.closePath();
        ctx.fill();

        // 5. الأذنان المدببتان اليقظتان
        ctx.fillStyle = '#020304';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, bodyY - 6);
        ctx.lineTo(this.x + this.width - 3, bodyY - 12);
        ctx.lineTo(this.x + this.width + 1, bodyY - 6);
        ctx.fill();

        // 6. عيون حمراء صغيرة تومض فقط أثناء المطاردة (Glowing Red Eyes)
        if (this.state === 'CHASE') {
            ctx.fillStyle = '#e50914';
            ctx.beginPath();
            ctx.arc(this.x + this.width + 2, bodyY - 4, 1.5, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================
// 6. نقطة الحفظ التلقائي (Interactive Checkpoint)
// ==========================================
class Checkpoint {
    constructor(x, y, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.activated = false;
    }

    update(player) {
        // إذا عبر اللاعب من أمام نقطة الحفظ
        if (!this.activated && PhysicsEngine.checkCollision(this, player)) {
            this.activated = true;
            console.log(`💾 تم تنشيط نقطة الحفظ رقم: ${this.id}`);
            return true; // يجب على اللعبة حفظ التقدم الآن
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        
        // رسم جهاز نقطة الحفظ كمصباح إشارات باهت مع شريحة إلكترونية
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(this.x + 18, this.y, 4, this.height); // عمود المصباح

        // القاعدة
        ctx.fillStyle = '#1b1f24';
        ctx.fillRect(this.x + 10, this.y + this.height - 6, 20, 6);

        // صندوق الإشارة بالأعلى
        ctx.fillStyle = '#090a0d';
        ctx.fillRect(this.x + 14, this.y, 12, 16);

        if (this.activated) {
            // وميض أزرق تكنولوجي خافت عند التفعيل
            ctx.fillStyle = '#3a86c8';
            ctx.shadowColor = '#3a86c8';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 8, 3.5, 0, Math.PI*2);
            ctx.fill();
        } else {
            // وميض أحمر خامل
            ctx.fillStyle = '#4a111a';
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 8, 3, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.Box = Box;
window.Lever = Lever;
window.Door = Door;
window.Searchlight = Searchlight;
window.GuardDog = GuardDog;
window.Checkpoint = Checkpoint;
