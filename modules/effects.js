// Модуль для эффектов и фильтров
const EffectsModule = {
    // Состояние
    state: {
        currentFilter: 'normal',
        currentEffect: null,
        isMirrored: false,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        noise: 0,
        vignette: 0,
        grain: 0,
        isActive: false,
        videoElement: null,
        originalStream: null,
        processedStream: null
    },
    
    // Доступные фильтры
    filters: {
        normal: { name: 'Обычный', css: '' },
        vintage: { name: 'Винтаж', css: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
        noir: { name: 'Нуар', css: 'grayscale(1) contrast(1.5)' },
        dramatic: { name: 'Драматичный', css: 'contrast(2) brightness(0.8)' },
        warm: { name: 'Тёплый', css: 'sepia(0.3) saturate(1.5) hue-rotate(-10deg)' },
        cool: { name: 'Холодный', css: 'brightness(1.1) hue-rotate(180deg) saturate(1.2)' },
        cinematic: { name: 'Кино', css: 'contrast(1.4) saturate(1.2) brightness(0.9)' },
        pastel: { name: 'Пастель', css: 'saturate(0.7) brightness(1.2)' },
        neon: { name: 'Неон', css: 'saturate(3) contrast(2) brightness(1.1)' },
        sunset: { name: 'Закат', css: 'hue-rotate(-30deg) saturate(2) contrast(1.2)' }
    },
    
    // Доступные эффекты
    effects: {
        mirror: { name: 'Зеркало', type: 'transform' },
        blur: { name: 'Размытие', type: 'blur' },
        pixelate: { name: 'Пиксели', type: 'pixelate' },
        glitch: { name: 'Глитч', type: 'glitch' },
        scanlines: { name: 'Сканирующие линии', type: 'overlay' },
        vhs: { name: 'VHS', type: 'vhs' },
        rgb: { name: 'RGB смещение', type: 'rgb' },
        kaleidoscope: { name: 'Калейдоскоп', type: 'kaleidoscope' }
    },
    
    // Инициализация
    init() {
        console.log('🎭 Инициализация модуля эффектов');
        
        // Загружаем сохранённые настройки
        this.loadSettings();
        
        // Инициализируем WebGL для продвинутых эффектов
        this.initWebGL();
        
        return true;
    },
    
    // Загрузка настроек
    loadSettings() {
        try {
            const saved = localStorage.getItem('telegram-effects');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.state, settings);
                console.log('✅ Настройки эффектов загружены');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки настроек эффектов:', error);
        }
    },
    
    // Сохранение настроек
    saveSettings() {
        try {
            const settings = {
                currentFilter: this.state.currentFilter,
                brightness: this.state.brightness,
                contrast: this.state.contrast,
                saturation: this.state.saturation,
                hue: this.state.hue,
                blur: this.state.blur,
                isMirrored: this.state.isMirrored
            };
            
            localStorage.setItem('telegram-effects', JSON.stringify(settings));
        } catch (error) {
            console.error('❌ Ошибка сохранения настроек эффектов:', error);
        }
    },
    
    // Инициализация WebGL
    initWebGL() {
        try {
            // Создаём canvas для обработки видео
            this.canvas = document.createElement('canvas');
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            
            if (!this.gl) {
                console.warn('WebGL не поддерживается, будут использоваться CSS-фильтры');
                this.hasWebGL = false;
                return;
            }
            
            this.hasWebGL = true;
            this.initShaders();
            console.log('✅ WebGL инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации WebGL:', error);
            this.hasWebGL = false;
        }
    },
    
    // Инициализация шейдеров
    initShaders() {
        // Вершинный шейдер (стандартный)
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
        
        // Фрагментный шейдер для базовой обработки
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D u_image;
            uniform float u_brightness;
            uniform float u_contrast;
            uniform float u_saturation;
            uniform float u_hue;
            uniform float u_blur;
            uniform float u_noise;
            uniform float u_vignette;
            uniform float u_grain;
            
            varying vec2 v_texCoord;
            
            // Функция для коррекции цвета
            vec3 adjustColor(vec3 color) {
                // Яркость
                color = color * u_brightness;
                
                // Контраст
                color = (color - 0.5) * u_contrast + 0.5;
                
                // Насыщенность
                float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                color = mix(vec3(luminance), color, u_saturation);
                
                // Оттенок
                float cosHue = cos(u_hue);
                float sinHue = sin(u_hue);
                mat3 hueMatrix = mat3(
                    0.299 + 0.701 * cosHue + 0.168 * sinHue,
                    0.587 - 0.587 * cosHue + 0.330 * sinHue,
                    0.114 - 0.114 * cosHue - 0.497 * sinHue,
                    
                    0.299 - 0.299 * cosHue - 0.328 * sinHue,
                    0.587 + 0.413 * cosHue + 0.035 * sinHue,
                    0.114 - 0.114 * cosHue + 0.292 * sinHue,
                    
                    0.299 - 0.300 * cosHue + 1.250 * sinHue,
                    0.587 - 0.588 * cosHue - 1.050 * sinHue,
                    0.114 + 0.886 * cosHue - 0.203 * sinHue
                );
                
                color = hueMatrix * color;
                
                return color;
            }
            
            // Функция для добавления шума
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 coord = v_texCoord;
                
                // Простое размытие (бокс-фильтр)
                if (u_blur > 0.0) {
                    vec4 color = vec4(0.0);
                    float blurSize = u_blur / 1000.0;
                    
                    for (int x = -2; x <= 2; x++) {
                        for (int y = -2; y <= 2; y++) {
                            vec2 offset = vec2(float(x), float(y)) * blurSize;
                            color += texture2D(u_image, coord + offset);
                        }
                    }
                    
                    color /= 25.0;
                    gl_FragColor = vec4(adjustColor(color.rgb), 1.0);
                } else {
                    vec4 texColor = texture2D(u_image, coord);
                    gl_FragColor = vec4(adjustColor(texColor.rgb), 1.0);
                }
                
                // Добавление шума
                if (u_noise > 0.0) {
                    float noise = random(coord * 100.0) * u_noise / 100.0;
                    gl_FragColor.rgb += noise;
                }
                
                // Добавление зернистости (фильм-гран)
                if (u_grain > 0.0) {
                    float grain = random(coord * 500.0) * u_grain / 100.0 - u_grain / 200.0;
                    gl_FragColor.rgb += grain;
                }
                
                // Виньетирование
                if (u_vignette > 0.0) {
                    vec2 uv = coord * (1.0 - coord);
                    float vignette = uv.x * uv.y * 15.0;
                    vignette = pow(vignette, u_vignette / 100.0);
                    gl_FragColor.rgb *= vignette;
                }
                
                // Ограничение значений
                gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);
            }
        `;
        
        // Компиляция шейдеров
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Создание программы
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('❌ Ошибка линковки шейдеров:', this.gl.getProgramInfoLog(this.program));
            this.hasWebGL = false;
            return;
        }
        
        // Получение атрибутов и униформов
        this.positionAttribute = this.gl.getAttribLocation(this.program, "a_position");
        this.texCoordAttribute = this.gl.getAttribLocation(this.program, "a_texCoord");
        this.imageUniform = this.gl.getUniformLocation(this.program, "u_image");
        this.brightnessUniform = this.gl.getUniformLocation(this.program, "u_brightness");
        this.contrastUniform = this.gl.getUniformLocation(this.program, "u_contrast");
        this.saturationUniform = this.gl.getUniformLocation(this.program, "u_saturation");
        this.hueUniform = this.gl.getUniformLocation(this.program, "u_hue");
        this.blurUniform = this.gl.getUniformLocation(this.program, "u_blur");
        this.noiseUniform = this.gl.getUniformLocation(this.program, "u_noise");
        this.vignetteUniform = this.gl.getUniformLocation(this.program, "u_vignette");
        this.grainUniform = this.gl.getUniformLocation(this.program, "u_grain");
    },
    
    // Компиляция шейдера
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('❌ Ошибка компиляции шейдера:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    },
    
    // Применение фильтра к видеоэлементу
    applyToVideo(videoElement) {
        if (!videoElement) return;
        
        this.state.videoElement = videoElement;
        
        if (this.hasWebGL) {
            this.applyWebGLEffects();
        } else {
            this.applyCSSFilters();
        }
    },
    
    // Применение CSS-фильтров
    applyCSSFilters() {
        if (!this.state.videoElement) return;
        
        let filter = '';
        
        // Применяем выбранный фильтр
        if (this.filters[this.state.currentFilter]) {
            filter += this.filters[this.state.currentFilter].css + ' ';
        }
        
        // Применяем настройки цвета
        filter += `brightness(${this.state.brightness / 100}) `;
        filter += `contrast(${this.state.contrast / 100}) `;
        filter += `saturate(${this.state.saturation / 100}) `;
        filter += `hue-rotate(${this.state.hue}deg) `;
        
        // Применяем размытие
        if (this.state.blur > 0) {
            filter += `blur(${this.state.blur}px) `;
        }
        
        // Применяем зеркальное отражение
        if (this.state.isMirrored) {
            this.state.videoElement.style.transform = 'scaleX(-1)';
        } else {
            this.state.videoElement.style.transform = '';
        }
        
        this.state.videoElement.style.filter = filter.trim();
    },
    
    // Применение WebGL-эффектов
    applyWebGLEffects() {
        if (!this.gl || !this.program || !this.state.videoElement) return;
        
        // Устанавливаем размеры canvas
        this.canvas.width = this.state.videoElement.videoWidth;
        this.canvas.height = this.state.videoElement.videoHeight;
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Очищаем canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Используем программу
        this.gl.useProgram(this.program);
        
        // Создаём буферы
        this.setRectangle(0, 0, this.canvas.width, this.canvas.height);
        
        // Настраиваем атрибуты
        this.setAttributes();
        
        // Создаём текстуру
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        // Загружаем видео в текстуру
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,
            this.gl.UNSIGNED_BYTE, this.state.videoElement
        );
        
        // Устанавливаем униформы
        this.gl.uniform1i(this.imageUniform, 0);
        this.gl.uniform1f(this.brightnessUniform, this.state.brightness / 100);
        this.gl.uniform1f(this.contrastUniform, this.state.contrast / 100);
        this.gl.uniform1f(this.saturationUniform, this.state.saturation / 100);
        this.gl.uniform1f(this.hueUniform, this.state.hue * Math.PI / 180);
        this.gl.uniform1f(this.blurUniform, this.state.blur);
        this.gl.uniform1f(this.noiseUniform, this.state.noise);
        this.gl.uniform1f(this.vignetteUniform, this.state.vignette);
        this.gl.uniform1f(this.grainUniform, this.state.grain);
        
        // Рисуем
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        // Заменяем видео обработанным кадром
        // В реальном приложении здесь бы создание MediaStream из canvas
    },
    
    // Настройка прямоугольника
    setRectangle(x, y, width, height) {
        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;
        
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array([
                x1, y1,
                x2, y1,
                x1, y2,
                x1, y2,
                x2, y1,
                x2, y2
            ]),
            this.gl.STATIC_DRAW
        );
    },
    
    // Настройка атрибутов
    setAttributes() {
        // Позиции
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.enableVertexAttribArray(this.positionAttribute);
        this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
        
        // Текстурные координаты
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0
            ]),
            this.gl.STATIC_DRAW
        );
        
        this.gl.enableVertexAttribArray(this.texCoordAttribute);
        this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
    },
    
    // Установка фильтра
    setFilter(filterName) {
        if (!this.filters[filterName]) {
            console.error(`Фильтр "${filterName}" не найден`);
            return false;
        }
        
        this.state.currentFilter = filterName;
        
        // Сбрасываем настройки для пресетных фильтров
        if (filterName !== 'normal') {
            const filter = this.filters[filterName];
            
            // Парсим CSS фильтр для получения значений
            // Это упрощённая реализация
            if (filterName === 'vintage') {
                this.state.brightness = 90;
                this.state.contrast = 120;
                this.state.saturation = 100;
                this.state.hue = 0;
            } else if (filterName === 'noir') {
                this.state.brightness = 100;
                this.state.contrast = 150;
                this.state.saturation = 0;
                this.state.hue = 0;
            }
            // ... и так далее для других фильтров
        }
        
        this.applyEffects();
        this.saveSettings();
        
        showNotification(`Применён фильтр: ${this.filters[filterName].name}`, 'info');
        return true;
    },
    
    // Установка эффекта
    setEffect(effectName) {
        if (!this.effects[effectName]) {
            console.error(`Эффект "${effectName}" не найден`);
            return false;
        }
        
        this.state.currentEffect = effectName;
        this.applyEffects();
        
        showNotification(`Применён эффект: ${this.effects[effectName].name}`, 'info');
        return true;
    },
    
    // Применение всех эффектов
    applyEffects() {
        if (this.state.videoElement) {
            if (this.hasWebGL) {
                this.applyWebGLEffects();
            } else {
                this.applyCSSFilters();
            }
        }
    },
    
    // Установка яркости
    setBrightness(value) {
        this.state.brightness = Math.max(0, Math.min(200, value));
        this.applyEffects();
        this.saveSettings();
    },
    
    // Установка контраста
    setContrast(value) {
        this.state.contrast = Math.max(0, Math.min(200, value));
        this.applyEffects();
        this.saveSettings();
    },
    
    // Установка насыщенности
    setSaturation(value) {
        this.state.saturation = Math.max(0, Math.min(200, value));
        this.applyEffects();
        this.saveSettings();
    },
    
    // Установка оттенка
    setHue(value) {
        this.state.hue = value;
        this.applyEffects();
        this.saveSettings();
    },
    
    // Установка размытия
    setBlur(value) {
        this.state.blur = Math.max(0, Math.min(20, value));
        this.applyEffects();
        this.saveSettings();
    },
    
    // Переключение зеркального отражения
    toggleMirror() {
        this.state.isMirrored = !this.state.isMirrored;
        this.applyEffects();
        this.saveSettings();
        
        showNotification(
            this.state.isMirrored ? 'Зеркальное отражение включено' : 'Зеркальное отражение выключено',
            'info'
        );
    },
    
    // Сброс всех эффектов
    resetEffects() {
        this.state.currentFilter = 'normal';
        this.state.currentEffect = null;
        this.state.brightness = 100;
        this.state.contrast = 100;
        this.state.saturation = 100;
        this.state.hue = 0;
        this.state.blur = 0;
        this.state.noise = 0;
        this.state.vignette = 0;
        this.state.grain = 0;
        this.state.isMirrored = false;
        
        this.applyEffects();
        this.saveSettings();
        
        showNotification('Все эффекты сброшены', 'info');
    },
    
    // Получение текущего CSS фильтра
    getCurrentFilterCSS() {
        let filter = '';
        
        if (this.filters[this.state.currentFilter]) {
            filter += this.filters[this.state.currentFilter].css + ' ';
        }
        
        filter += `brightness(${this.state.brightness / 100}) `;
        filter += `contrast(${this.state.contrast / 100}) `;
        filter += `saturate(${this.state.saturation / 100}) `;
        filter += `hue-rotate(${this.state.hue}deg)`;
        
        if (this.state.blur > 0) {
            filter += ` blur(${this.state.blur}px)`;
        }
        
        return filter.trim();
    },
    
    // Применение эффектов к изображению
    applyToImage(imageElement) {
        if (!imageElement) return;
        
        // Создаём canvas для обработки
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        
        // Рисуем изображение
        ctx.drawImage(imageElement, 0, 0);
        
        // Применяем фильтры
        ctx.filter = this.getCurrentFilterCSS();
        
        // Очищаем и перерисовываем с фильтром
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageElement, 0, 0);
        
        // Применяем зеркальное отражение
        if (this.state.isMirrored) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(imageElement, -canvas.width, 0);
            ctx.restore();
        }
        
        // Заменяем исходное изображение обработанным
        imageElement.src = canvas.toDataURL();
    },
    
    // Создание предпросмотра фильтра
    createFilterPreview(filterName, size = 80) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // Рисуем тестовое изображение (градиент)
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#0088cc');
        gradient.addColorStop(0.5, '#00c9b7');
        gradient.addColorStop(1, '#9C27B0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Применяем фильтр
        if (filterName !== 'normal' && this.filters[filterName]) {
            ctx.filter = this.filters[filterName].css;
            ctx.drawImage(canvas, 0, 0);
        }
        
        return canvas;
    },
    
    // Обработка видео потока
    async processVideoStream(stream) {
        if (!this.hasWebGL) {
            // Используем простую обработку через CSS
            return stream;
        }
        
        try {
            // Создаём MediaStream из обработанных кадров
            const processedStream = this.canvas.captureStream(30);
            
            // В реальном приложении здесь бы обработка каждого кадра
            // и передача через processedStream
            
            return processedStream;
            
        } catch (error) {
            console.error('❌ Ошибка обработки видео потока:', error);
            return stream;
        }
    },
    
    // Применение эффектов в реальном времени
    startRealTimeEffects(videoElement) {
        if (!videoElement) return;
        
        this.state.isActive = true;
        this.state.videoElement = videoElement;
        
        // Запускаем цикл обработки
        const processFrame = () => {
            if (!this.state.isActive) return;
            
            this.applyEffects();
            requestAnimationFrame(processFrame);
        };
        
        processFrame();
    },
    
    // Остановка эффектов в реальном времени
    stopRealTimeEffects() {
        this.state.isActive = false;
        this.state.videoElement = null;
    },
    
    // Сохранение настроек как пресета
    saveAsPreset(name) {
        const preset = {
            name: name,
            filter: this.state.currentFilter,
            brightness: this.state.brightness,
            contrast: this.state.contrast,
            saturation: this.state.saturation,
            hue: this.state.hue,
            blur: this.state.blur,
            isMirrored: this.state.isMirrored,
            createdAt: Date.now()
        };
        
        try {
            const presets = JSON.parse(localStorage.getItem('telegram-effect-presets') || '[]');
            presets.push(preset);
            localStorage.setItem('telegram-effect-presets', JSON.stringify(presets));
            
            showNotification(`Пресет "${name}" сохранён`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения пресета:', error);
            showNotification('Не удалось сохранить пресет', 'error');
            return false;
        }
    },
    
    // Загрузка пресета
    loadPreset(presetName) {
        try {
            const presets = JSON.parse(localStorage.getItem('telegram-effect-presets') || '[]');
            const preset = presets.find(p => p.name === presetName);
            
            if (!preset) {
                showNotification(`Пресет "${presetName}" не найден`, 'warning');
                return false;
            }
            
            this.state.currentFilter = preset.filter;
            this.state.brightness = preset.brightness;
            this.state.contrast = preset.contrast;
            this.state.saturation = preset.saturation;
            this.state.hue = preset.hue;
            this.state.blur = preset.blur;
            this.state.isMirrored = preset.isMirrored;
            
            this.applyEffects();
            this.saveSettings();
            
            showNotification(`Пресет "${presetName}" загружен`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки пресета:', error);
            return false;
        }
    },
    
    // Получение списка пресетов
    getPresets() {
        try {
            return JSON.parse(localStorage.getItem('telegram-effect-presets') || '[]');
        } catch (error) {
            console.error('❌ Ошибка получения пресетов:', error);
            return [];
        }
    },
    
    // Удаление пресета
    deletePreset(presetName) {
        try {
            const presets = JSON.parse(localStorage.getItem('telegram-effect-presets') || '[]');
            const filtered = presets.filter(p => p.name !== presetName);
            
            if (filtered.length === presets.length) {
                showNotification(`Пресет "${presetName}" не найден`, 'warning');
                return false;
            }
            
            localStorage.setItem('telegram-effect-presets', JSON.stringify(filtered));
            showNotification(`Пресет "${presetName}" удалён`, 'info');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка удаления пресета:', error);
            return false;
        }
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    EffectsModule.init();
});

// Экспорт
window.EffectsModule = EffectsModule;
