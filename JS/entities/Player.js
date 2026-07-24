/**
 * JS/entities/Player.js
 * الكائن البرمجي للبطل (الفتى صاحب القميص الأحمر) مع الأنيميشن الإجرائي (Procedural Animation)
 * بواسطة الوكيل رقم 3 & 4 (مبرمج آليات الحركة والأنيميشن)
 */

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 48;
        
        this.vx = 0;
        this.vy = 0;
        
        // الخصائص الحركية
        this.speed = 3.2;
        this.jumpForce = -8.5;
        this.climbSpeed = 2.0;
        this.swimSpeed = 1.6;
        
        // حالات الكيان (States)
        this.onGround = false;
        this.isAlive = true;
        this.facingRight = true;
        this.isGrabbing = false; // هل يضغط زر التفاعل؟
        this.isPushing = false;  // هل يتدافع فعلاً مع صندوق؟
        this.isClimbing = false; // هل يتسلق سلماً؟
        this.isSwimming = false; // هل يسبح في الماء؟
        this.isCrouching = false; // هل ينحني؟
        
        // متغيرات الرسوم الإجرائية (Procedural Animation Variables)
        this.walkCycle = 0;
        this.breathCycle = 0;
        this.climbCycle = 0;
        this.swimCycle = 0;
        this.deathProgress = 0;
        
        // لتتبع تشغيل صوت الخطوات
        this.lastFootstepStep = 0;
    }

    /**
     * تحديث حركة اللاعب والمدخلات
     * @param {object} input لوحة المفاتيح
     * @param {SoundSynth} synth محرك الصوت
     */
    update(input, synth) {
        if (!this.isAlive) {
            // منطق سقوط الجسد الميت ببطء
            if (this.deathProgress < 1.0) {
                this.deathProgress += 0.05;
            }
            return;
        }

        // 1. تنفس مستمر للشخصية عند الوقوف (Breathing Cycle)
        this.breathCycle += 0.04;

        // 2. فحص محاولة تفعيل زر التفاعل (سحب الصناديق)
        this.isGrabbing = (input.shift || input.e);

        // 3. التوجيه يميناً أو يساراً (Facing direction)
        if (input.left && !this.isPushing) {
            this.facingRight = false;
        } else if (input.right && !this.isPushing) {
            this.facingRight = true;
        }

        // 4. الحركة في حالة التسلق (Climbing Ladder)
        if (this.isClimbing) {
            this.vx = 0;
            if (input.up) {
                this.vy = -this.climbSpeed;
                this.climbCycle += 0.15;
                if (Math.sin(this.climbCycle) > 0.9 && Math.random() < 0.2) {
                    synth.playFootstep('metal'); // صوت حلقة تسلق معدنية
                }
            } else if (input.down) {
                this.vy = this.climbSpeed;
                this.climbCycle -= 0.15;
                if (Math.sin(this.climbCycle) > 0.9 && Math.random() < 0.2) {
                    synth.playFootstep('metal');
                }
            } else {
                this.vy = 0; // ثبات على السلم عند ترك الأزرار
            }
            return; // تخطي بقية قوانين الحركة العادية
        }

        // 5. الحركة في حالة السباحة (Swimming)
        if (this.isSwimming) {
            this.swimCycle += 0.08;
            
            // حركة أفقية في الماء
            if (input.left) {
                this.vx = -this.swimSpeed;
            } else if (input.right) {
                this.vx = this.swimSpeed;
            }
            
            // حركة عمودية للغوص أو الصعود في الماء
            if (input.up || input.space) {
                this.vy = -this.swimSpeed * 1.2;
            } else if (input.down) {
                this.vy = this.swimSpeed * 1.2;
            }

            // تشغيل صوت رشقات ماء دورية أثناء السباحة
            if (Math.abs(this.vx) > 0.1 && Math.sin(this.swimCycle) > 0.9) {
                synth.playFootstep('water');
            }
            return;
        }

        // 6. الحركة الأفقية الطبيعية (الجري / الدفع)
        let accel = this.speed;
        if (this.isPushing) {
            accel *= 0.45; // تباطؤ شديد عند سحب/دفع الصناديق الثقيلة
        } else if (this.isCrouching) {
            accel *= 0.5; // تباطؤ عند الانحناء
        }

        if (input.left) {
            this.vx = -accel;
            this.walkCycle += this.isPushing ? 0.08 : 0.18;
        } else if (input.right) {
            this.vx = accel;
            this.walkCycle += this.isPushing ? 0.08 : 0.18;
        } else {
            // توقف الحركة الأفقية
            this.walkCycle = 0;
        }

        // تشغيل صوت الخطوات في الوقت الفعلي عند الحركة على الأرض
        if (this.onGround && Math.abs(this.vx) > 0.1) {
            const stepThreshold = Math.sin(this.walkCycle);
            // نشغل الصوت عند قمة دورة المشي للتزامن مع حركة الأقدام البصرية
            if (stepThreshold > 0.8 && this.lastFootstepStep <= 0.8) {
                const surface = this.y > 580 ? 'metal' : 'dirt'; // إذا كان في الأسفل، الأرضية معدنية
                synth.playFootstep(surface);
                
                // في حال دفع الصندوق، نشغل صوت صرير خفيف
                if (this.isPushing && Math.random() < 0.4) {
                    synth.playSqueak();
                }
            }
            this.lastFootstepStep = stepThreshold;
        }

        // 7. الانحناء (Crouching)
        if (input.down && this.onGround && !this.isPushing) {
            this.isCrouching = true;
            this.height = 30; // تقليل حجم الاصطدام للتسلل في الأنفاق
        } else {
            if (this.isCrouching) {
                this.height = 48; // استعادة الطول الطبيعي
                this.y -= 18; // تعديل الارتفاع لعدم النفاذ في الأرضية
                this.isCrouching = false;
            }
        }

        // 8. القفز (Jumping)
        if ((input.up || input.space) && this.onGround && !this.isPushing) {
            this.vy = this.jumpForce;
            this.onGround = false;
            synth.playFootstep('dirt'); // صوت دفعة القفز من الأرض
        }
    }

    die(synth) {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.vx = 0;
        this.vy = 0;
        this.isGrabbing = false;
        this.isPushing = false;
        this.isClimbing = false;
        synth.playDeath();
    }

    /**
     * رسم البطل إجرائياً بجسم ظلالي وقميص أحمر دافئ سينمائي
     * @param {CanvasRenderingContext2D} ctx سياق الرسم
     */
    draw(ctx) {
        ctx.save();

        // محاكاة سقطة الموت الدرامية بتدوير المشهد
        if (!this.isAlive) {
            ctx.translate(this.x + this.width / 2, this.y + this.height);
            ctx.rotate(this.deathProgress * Math.PI / 2); // استلقاء على الأرض
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height));
        }

        const headRadius = 6;
        const chestWidth = 10;
        const hipY = this.y + this.height - 16;
        const chestY = this.y + 12;
        
        let walkSwing = Math.sin(this.walkCycle);
        let breatheOffset = Math.sin(this.breathCycle) * 0.8;

        // تعديل الأبعاد عند الانحناء
        const drawHeightY = this.isCrouching ? this.y + 10 : this.y;

        // لتسهيل الرسم، نقوم بالتدوير الأفقي إذا كان يواجه اليسار
        ctx.translate(this.x + this.width / 2, 0);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        ctx.translate(-(this.x + this.width / 2), 0);

        // 1. الأقدام والأرجل (Legs & Feet)
        ctx.fillStyle = '#050505'; // أرجل ظلالية سوداء قاتمة
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#050505';
        ctx.lineCap = 'round';

        // حساب زوايا الأرجل بشكل إجرائي
        let legL_X_Offset = 0;
        let legR_X_Offset = 0;
        let legL_Y_Offset = 0;
        let legR_Y_Offset = 0;

        if (this.isClimbing) {
            // الأرجل أثناء التسلق تتحرك بالتبادل
            const climbSwing = Math.sin(this.climbCycle);
            legL_Y_Offset = climbSwing * 6;
            legR_Y_Offset = -climbSwing * 6;
        } else if (this.isSwimming) {
            // الأرجل أثناء السباحة ترفرف كالزعانف
            const swimSwing = Math.sin(this.swimCycle * 1.5);
            legL_X_Offset = -8 + swimSwing * 3;
            legR_X_Offset = -12 - swimSwing * 3;
        } else if (Math.abs(this.vx) > 0.1 && this.onGround) {
            // الجري أو المشي العادي
            legL_X_Offset = walkSwing * 10;
            legR_X_Offset = -walkSwing * 10;
            legL_Y_Offset = Math.abs(walkSwing) * -3;
        }

        // الساق اليسرى (Left Leg)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 2, hipY); // مفصل الحوض
        if (this.isCrouching) {
            ctx.lineTo(this.x + this.width / 2 - 6 + legL_X_Offset * 0.5, hipY + 8);
            ctx.lineTo(this.x + this.width / 2 - 4 + legL_X_Offset * 0.5, this.y + this.height);
        } else {
            ctx.lineTo(this.x + this.width / 2 - 3 + legL_X_Offset * 0.5, hipY + 8 + legL_Y_Offset * 0.5); // الركبة
            ctx.lineTo(this.x + this.width / 2 - 2 + legL_X_Offset, this.y + this.height + legL_Y_Offset); // القدم
        }
        ctx.stroke();

        // الساق اليمنى (Right Leg)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 + 2, hipY);
        if (this.isCrouching) {
            ctx.lineTo(this.x + this.width / 2 + 4 + legR_X_Offset * 0.5, hipY + 8);
            ctx.lineTo(this.x + this.width / 2 + 6 + legR_X_Offset * 0.5, this.y + this.height);
        } else {
            ctx.lineTo(this.x + this.width / 2 + 3 + legR_X_Offset * 0.5, hipY + 8 + legR_Y_Offset * 0.5);
            ctx.lineTo(this.x + this.width / 2 + 2 + legR_X_Offset, this.y + this.height + legR_Y_Offset);
        }
        ctx.stroke();

        // 2. الجذع والقميص الأحمر (Red Torso / Shirt)
        // أحمر باهت سينمائي غير مشبع (Desaturated Red) ليلائم الجو الغائم
        ctx.fillStyle = '#8B2635'; 
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - chestWidth/2, chestY + breatheOffset); // يسار الأكتاف
        ctx.lineTo(this.x + this.width / 2 + chestWidth/2, chestY + breatheOffset); // يمين الأكتاف
        ctx.lineTo(this.x + this.width / 2 + 4, hipY); // يمين الحوض
        ctx.lineTo(this.x + this.width / 2 - 4, hipY); // يسار الحوض
        ctx.closePath();
        ctx.fill();

        // رسم حزام خصر رقيق داكن
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 4, hipY);
        ctx.lineTo(this.x + this.width / 2 + 4, hipY);
        ctx.stroke();

        // 3. الرقبة والرأس الظلالي (Neck & Head)
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, chestY - headRadius + breatheOffset, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // رقبة قصيرة
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, chestY + breatheOffset);
        ctx.lineTo(this.x + this.width / 2, chestY - 2 + breatheOffset);
        ctx.stroke();

        // 4. الذراعين والأيدي (Arms & Hands)
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 2.5;

        let armLeftX = this.x + this.width / 2 - 4;
        let armRightX = this.x + this.width / 2 + 4;
        let armY = chestY + 2 + breatheOffset;

        if (this.isPushing) {
            // مد اليدين للأمام للإمساك بالصندوق
            ctx.beginPath();
            ctx.moveTo(armRightX, armY);
            ctx.lineTo(this.x + this.width + 10, armY + 2); // اليد ممدودة خارج جسد اللاعب
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(armLeftX, armY);
            ctx.lineTo(this.x + this.width + 8, armY + 4);
            ctx.stroke();
        } else if (this.isClimbing) {
            // اليدين للأعلى أثناء التسلق بالتبادل
            const climbSwing = Math.sin(this.climbCycle);
            ctx.beginPath();
            ctx.moveTo(armLeftX, armY);
            ctx.lineTo(armLeftX - 2, armY - 14 - climbSwing * 8);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(armRightX, armY);
            ctx.lineTo(armRightX + 2, armY - 14 + climbSwing * 8);
            ctx.stroke();
        } else if (this.isSwimming) {
            // اليدين ممدودتان بشكل أفقي أثناء السباحة ورفرفة خفيفة
            const swimSwing = Math.sin(this.swimCycle);
            ctx.beginPath();
            ctx.moveTo(armLeftX, armY);
            ctx.lineTo(armLeftX - 10 + swimSwing * 4, armY + swimSwing * 2);
            ctx.stroke();
        } else {
            // تمايل طبيعي أثناء الجري أو وقوف هادئ ومسترخٍ
            let armSwing = Math.sin(this.walkCycle);
            ctx.beginPath();
            ctx.moveTo(armLeftX, armY);
            if (Math.abs(this.vx) > 0.1) {
                // مرجحة اليدين عكس حركة الأقدام
                ctx.lineTo(armLeftX - armSwing * 8, armY + 12);
            } else {
                // وقوف هادئ متمايل مع التنفس
                ctx.lineTo(armLeftX - 2, armY + 14 + breatheOffset);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.Player = Player;
