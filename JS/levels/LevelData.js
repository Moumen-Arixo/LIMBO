/**
 * JS/levels/LevelData.js
 * بيانات وتخطيط المستوى الأول (Act I: The Escape) والطبقات الجمالية
 * بواسطة الوكيل رقم 9 & 18 (مصمم ومطور المستويات ومسؤول السياق)
 */

class LevelData {
    constructor() {
        this.width = 3200;  // عرض خريطة الفصل الأول بالبكسل
        this.height = 6400; // الارتفاع الافتراضي للشاشة (اللاعب يتحرك أفقياً بشكل رئيسي)
        
        // سنحدد ارتفاع الأرضية المادية ليكون ثابتاً في الغالب حول Y = 500 بكسل
        
        // 1. الأرضيات والمنصات الصلبة للتصادم (Physics Solids)
        this.solids = [
            // الأرضيات المتسلسلة على طول المستوى
            { x: 0, y: 480, width: 800, height: 200 },       // أرضية الغابة الأولى
            { x: 800, y: 480, width: 900, height: 200 },     // أرضية الساحة والمستودع
            { x: 1700, y: 550, width: 700, height: 200 },    // الأرضية المنخفضة لحوض المياه والسباحة
            { x: 2400, y: 480, width: 800, height: 200 },    // أرضية مصنع النهاية
            
            // الجدران المرتفعة كحواجز للألغاز
            { x: 740, y: 350, width: 60, height: 130 },      // جدار نهاية الغابة (يتطلب سحب الصندوق لتسلقه)
            { x: 1450, y: 300, width: 50, height: 180 },     // جدار الساحة والمستودع الثاني
            { x: 1700, y: 400, width: 50, height: 150 },     // حافة حوض السباحة اليسرى الهابطة
            { x: 2000, y: 460, width: 40, height: 100 },     // جدار منخفض مغمور بالماء (يتطلب الغوص والسباحة أسفله)
            { x: 2400, y: 400, width: 50, height: 80 },      // حافة حوض السباحة اليمنى
            
            // منصات علوية وسلالم مبنية
            { x: 1100, y: 360, width: 150, height: 20 },     // منصة علوية في منطقة كشاف الضوء
            { x: 2550, y: 380, width: 120, height: 20 },     // منصة المصعد أو القبو النهائي
        ];

        // 2. مناطق السلالم (Ladders)
        this.ladders = [
            { x: 1120, y: 360, width: 24, height: 120 },    // سلم للوصول للمنصة العلوية الأولى
            { x: 2600, y: 380, width: 24, height: 100 }     // سلم في نهاية اللعبة
        ];

        // 3. مناطق المياه والسباحة (Water / Swimming Zones)
        this.waterZones = [
            { x: 1700, y: 470, width: 700, height: 250 }     // حوض مائي عميق بطول 700 بكسل
        ];

        // 4. الخلفيات والزخارف الجمالية المتحركة (Parallax Background Elements)
        // الطبقات: Far (بعيدة جداً)، Mid (متوسطة)، Fore (أمامية جداً)
        this.parallaxElements = {
            far: [
                // غابات جبلية بعيدة جداً باللون الرمادي الباهت
                { type: 'mountain', x: 100, y: 150, width: 250, height: 350 },
                { type: 'mountain', x: 400, y: 120, width: 300, height: 380 },
                { type: 'mountain', x: 900, y: 160, width: 250, height: 340 },
                { type: 'mountain', x: 1500, y: 100, width: 400, height: 400 },
                { type: 'mountain', x: 2200, y: 140, width: 320, height: 360 },
                
                // أنابيب مصانع ودخان بعيد جداً
                { type: 'chimney', x: 1200, y: 200, width: 40, height: 280 },
                { type: 'chimney', x: 2600, y: 150, width: 60, height: 330 }
            ],
            mid: [
                // سياج متهالك وأشجار داكنة
                { type: 'tree', x: 50, y: 280, width: 12, height: 200 },
                { type: 'tree', x: 180, y: 250, width: 15, height: 230 },
                { type: 'tree', x: 320, y: 270, width: 10, height: 210 },
                { type: 'tree', x: 500, y: 240, width: 16, height: 240 },
                { type: 'tree', x: 680, y: 260, width: 14, height: 220 },
                
                // هياكل معدنية للمستودعات
                { type: 'beam', x: 850, y: 200, width: 6, height: 280 },
                { type: 'beam', x: 1050, y: 200, width: 6, height: 280 },
                { type: 'beam', x: 1350, y: 200, width: 6, height: 280 },
                { type: 'girder', x: 850, y: 220, width: 500, height: 8 }, // رافعة سقفية أفقية
                
                // أنابيب وخزانات ضخمة
                { type: 'tank', x: 1800, y: 350, width: 100, height: 200 },
                { type: 'pipe', x: 2150, y: 320, width: 12, height: 230 },
                { type: 'pipe_horizontal', x: 1700, y: 380, width: 700, height: 10 }
            ],
            fore: [
                // أوراق شجر وأعشاب برية سوداء قريبة جداً من عدسة الكاميرا
                { type: 'bush', x: 150, y: 440, width: 80, height: 60 },
                { type: 'bush', x: 450, y: 430, width: 110, height: 70 },
                { type: 'fence', x: 810, y: 440, width: 120, height: 40 },
                { type: 'bush', x: 1600, y: 430, width: 90, height: 60 },
                { type: 'bush', x: 2450, y: 440, width: 70, height: 50 }
            ]
        };

        // 5. نقاط الصناديق الفيزيائية (Boxes)
        this.boxes = [
            new Box(480, 444),       // الصندوق الأول لتسلق الجدار العالي في الغابة
            new Box(1000, 444),      // الصندوق الثاني لحجب ضوء الكشاف
        ];

        // 6. مفاتيح التشغيل والبوابات (Levers & Doors)
        this.levers = [
            new Lever(2250, 530, 'mainGate') // رافعة في نهاية حوض الماء لفتح البوابة النهائية
        ];
        
        this.doors = [
            new Door('mainGate', 2410, 400, 20, 80) // البوابة المؤصدة أمام مستودع المصنع
        ];

        // 7. الأعداء الحركيون (Enemies & Searchlights)
        this.searchlights = [
            // كشاف ضوء مثبت في السقف يمسح منطقة ساحة الصندوق
            new Searchlight(1050, 180, 260, 0.5, 2.6, 0.008)
        ];

        this.dogs = [
            // كلب حراسة هجومي يجوب المنطقة خلف جدار الساحة
            new GuardDog(1550, 460, 1500, 1680)
        ];

        // 8. نقاط الحفظ التلقائي والولادة (Checkpoints & Spawns)
        this.checkpoints = [
            new Checkpoint(780, 400, 1),   // بعد عبور الجدار الأول مباشرة
            new Checkpoint(1470, 400, 2),  // قبل مواجهة الكلب والدخول للمياه
            new Checkpoint(2430, 400, 3)   // بعد عبور البوابة الكبرى بنجاح
        ];
        
        // نقطة البدء الافتراضية للعبة
        this.spawnPoint = { x: 80, y: 400 };
    }

    /**
     * إعادة تعيين الكيانات التفاعلية في هذا المستوى في حال موت اللاعب
     * @param {number} checkpointId معرف آخر نقطة حفظ تم تفعيلها
     */
    resetOnDeath(checkpointId) {
        // 1. إعادة توليد الصناديق في مواقع مقبولة لحل اللغز
        this.boxes = [
            new Box(480, 444),
            new Box(1000, 444)
        ];

        // 2. إعادة تعيين الرافعات والأبواب والمطاردات
        this.levers.forEach(l => l.activated = false);
        this.doors.forEach(d => {
            d.isOpen = false;
            d.currentHeight = d.height;
        });

        // 3. إعادة تعيين الكلاب
        this.dogs = [
            new GuardDog(1550, 460, 1500, 1680)
        ];

        // 4. إعادة تعيين الكشافات
        this.searchlights = [
            new Searchlight(1050, 180, 260, 0.5, 2.6, 0.008)
        ];
        
        // تحديد إحداثيات الولادة
        if (checkpointId === 1) {
            return { x: 790, y: 350 };
        } else if (checkpointId === 2) {
            return { x: 1480, y: 350 };
        } else if (checkpointId === 3) {
            return { x: 2440, y: 350 };
        }
        
        return { x: 80, y: 400 }; // العودة للبداية تماماً
    }
}

// جعلها عامة لاستيرادها التقليدي في المتصفح
window.LevelData = LevelData;
