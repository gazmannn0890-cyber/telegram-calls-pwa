// Модуль для рисования на экране
const DrawingModule = {
    // Состояние
    state: {
        canvas: null,
        context: null,
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        currentColor: '#0088cc',
        currentSize: 3,
        currentTool: 'brush',
        drawings: [],
        isEraser: false,
        isFilled: false,
        opacity: 1.0
    },
    
    // Инструменты рисования
    tools: {
        brush: 'brush',
        eraser: 'eraser',
        line: 'line',
        rectangle: 'rectangle',
        circle: 'circle',
        arrow: 'arrow',
        text: 'text'
    },
    
    // Инициализация
    init() {
        console.log('🎨 Инициализация модуля рисования');
        
        // Создаём canvas
        this.createCanvas();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Инициализируем панель инструментов
        this.initToolbar();
        
        return true;
    },
    
    // Создание canvas
    createCanvas() {
        // Проверяем, не создан ли уже canvas
        let canvas = document.getElementById('drawingCanvas');
        
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'drawingCanvas';
            canvas.className = 'drawing-canvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5000;
                display: none;
            `;
            
            document.body.appendChild(canvas);
        }
        
        this.state.canvas = canvas;
        this.state.context = canvas.getContext('2d');
        
        // Устанавливаем размеры canvas
        this.resizeCanvas();
        
        // Слушаем изменения размера окна
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('✅ Canvas создан');
    },
    
    // Изменение размера canvas
    resizeCanvas() {
        const canvas = this.state.canvas;
        if (!canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        this.state.context.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Перерисовываем все рисунки
        this.redrawAll();
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        const canvas = this.state.canvas;
        if (!canvas) return;
        
        // Мышь
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Тач
        canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        canvas.addEventListener('touchmove', (e) => this.draw(e));
        canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Предотвращаем прокрутку при рисовании на мобильных
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },
    
    // Инициализация панели инструментов
    initToolbar() {
        // Создаём панель инструментов, если её нет
        let toolbar = document.getElementById('drawingToolbar');
        
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'drawingToolbar';
            toolbar.className = 'drawing-toolbar';
            toolbar.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(26, 26, 26, 0.9);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 12px;
                display: flex;
                gap: 8px;
                z-index: 5001;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                display: none;
            `;
            
            // Цвета
            const colors = [
                '#0088cc', '#00c9b7', '#4CAF50', '#FF9800', 
                '#F44336', '#9C27B0', '#FFFFFF', '#000000'
            ];
            
            // Инструменты
            const tools = [
                { icon: 'fas fa-paint-brush', tool: 'brush', title: 'Кисть' },
                { icon: 'fas fa-eraser', tool: 'eraser', title: 'Ластик' },
                { icon: 'fas fa-minus', tool: 'line', title: 'Линия' },
                { icon: 'fas fa-square', tool: 'rectangle', title: 'Прямоугольник' },
                { icon: 'fas fa-circle', tool: 'circle', title: 'Круг' },
                { icon: 'fas fa-long-arrow-alt-right', tool: 'arrow', title: 'Стрелка' },
                { icon: 'fas fa-font', tool: 'text', title: 'Текст' }
            ];
            
            // Создаём кнопки цветов
            colors.forEach(color => {
                const colorBtn = document.createElement('button');
                colorBtn.className = 'drawing-color-btn';
                colorBtn.style.cssText = `
                    width: 30px;
                    height: 30px;
                    border-radius: 15px;
                    border: ${color === '#FFFFFF' ? '1px solid #666' : 'none'};
                    background: ${color};
                    cursor: pointer;
                `;
                colorBtn.title = color;
                colorBtn.onclick = () => this.setColor(color);
                
                toolbar.appendChild(colorBtn);
            });
            
            // Разделитель
            const divider = document.createElement('div');
            divider.style.cssText = 'width: 1px; background: #444; margin: 0 8px;';
            toolbar.appendChild(divider);
            
            // Создаём кнопки инструментов
            tools.forEach(toolInfo => {
                const toolBtn = document.createElement('button');
                toolBtn.className = `drawing-tool-btn ${this.state.currentTool === toolInfo.tool ? 'active' : ''}`;
                toolBtn.innerHTML = `<i class="${toolInfo.icon}"></i>`;
                toolBtn.title = toolInfo.title;
                toolBtn.onclick = () => this.setTool(toolInfo.tool);
                
                toolbar.appendChild(toolBtn);
            });
            
            // Кнопка очистки
            const clearBtn = document.createElement('button');
            clearBtn.className = 'drawing-clear-btn';
            clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
            clearBtn.title = 'Очистить';
            clearBtn.onclick = () => this.clearCanvas();
            
            toolbar.appendChild(clearBtn);
            
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.className = 'drawing-close-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.title = 'Закрыть рисование';
            closeBtn.onclick = () => this.toggleDrawingMode();
            
            toolbar.appendChild(closeBtn);
            
            document.body.appendChild(toolbar);
        }
    },
    
    // Переключение режима рисования
    toggleDrawingMode() {
        const canvas = this.state.canvas;
        const toolbar = document.getElementById('drawingToolbar');
        
        if (!canvas || !toolbar) return;
        
        if (canvas.style.display === 'none') {
            // Включаем режим рисования
            canvas.style.display = 'block';
            canvas.style.pointerEvents = 'auto';
            toolbar.style.display = 'flex';
            
            // Отправляем состояние через WebRTC
            if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
                WebRTCModule.sendDataChannelMessage('drawing', {
                    action: 'mode',
                    enabled: true
                });
            }
            
            showNotification('Режим рисования включён', 'info');
            
        } else {
            // Выключаем режим рисования
            canvas.style.display = 'none';
            canvas.style.pointerEvents = 'none';
            toolbar.style.display = 'none';
            
            // Отправляем состояние через WebRTC
            if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
                WebRTCModule.sendDataChannelMessage('drawing', {
                    action: 'mode',
                    enabled: false
                });
            }
            
            showNotification('Режим рисования выключен', 'info');
        }
    },
    
    // Начало рисования
    startDrawing(e) {
        this.state.isDrawing = true;
        [this.state.lastX, this.state.lastY] = this.getCoordinates(e);
        
        // Для инструментов фигур и текста сохраняем начальную точку
        if (['rectangle', 'circle', 'line', 'arrow', 'text'].includes(this.state.currentTool)) {
            this.state.startX = this.state.lastX;
            this.state.startY = this.state.lastY;
            
            // Для текста показываем поле ввода
            if (this.state.currentTool === 'text') {
                this.showTextInput();
            }
        }
        
        // Начинаем новый рисунок
        this.state.currentDrawing = {
            tool: this.state.currentTool,
            color: this.state.currentColor,
            size: this.state.currentSize,
            opacity: this.state.opacity,
            points: [[this.state.lastX, this.state.lastY]],
            isFilled: this.state.isFilled
        };
    },
    
    // Рисование
    draw(e) {
        if (!this.state.isDrawing) return;
        
        e.preventDefault();
        
        const [x, y] = this.getCoordinates(e);
        
        // Добавляем точку в текущий рисунок
        if (this.state.currentDrawing) {
            this.state.currentDrawing.points.push([x, y]);
        }
        
        // Очищаем canvas для перерисовки
        this.clearTempCanvas();
        
        // Рисуем в зависимости от инструмента
        switch (this.state.currentTool) {
            case 'brush':
            case 'eraser':
                this.drawFreehand(x, y);
                break;
                
            case 'line':
                this.drawLine(x, y);
                break;
                
            case 'rectangle':
                this.drawRectangle(x, y);
                break;
                
            case 'circle':
                this.drawCircle(x, y);
                break;
                
            case 'arrow':
                this.drawArrow(x, y);
                break;
        }
        
        // Сохраняем последние координаты
        this.state.lastX = x;
        this.state.lastY = y;
        
        // Отправляем данные через WebRTC
        this.sendDrawingData(x, y);
    },
    
    // Остановка рисования
    stopDrawing() {
        if (!this.state.isDrawing) return;
        
        this.state.isDrawing = false;
        
        // Сохраняем законченный рисунок
        if (this.state.currentDrawing && this.state.currentDrawing.points.length > 1) {
            this.state.drawings.push({ ...this.state.currentDrawing });
            
            // Отправляем законченный рисунок через WebRTC
            this.sendCompleteDrawing();
        }
        
        // Очищаем временные данные
        this.state.currentDrawing = null;
        this.state.startX = null;
        this.state.startY = null;
    },
    
    // Рисование от руки
    drawFreehand(x, y) {
        const ctx = this.state.context;
        ctx.beginPath();
        ctx.moveTo(this.state.lastX, this.state.lastY);
        ctx.lineTo(x, y);
        
        if (this.state.currentTool === 'eraser') {
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = this.state.currentSize * 2;
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.strokeStyle = this.state.currentColor;
            ctx.lineWidth = this.state.currentSize;
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.state.opacity;
        ctx.stroke();
        
        // Возвращаем обычный режим смешивания
        ctx.globalCompositeOperation = 'source-over';
    },
    
    // Рисование линии
    drawLine(x, y) {
        const ctx = this.state.context;
        ctx.beginPath();
        ctx.moveTo(this.state.startX, this.state.startY);
        ctx.lineTo(x, y);
        
        ctx.strokeStyle = this.state.currentColor;
        ctx.lineWidth = this.state.currentSize;
        ctx.lineCap = 'round';
        ctx.globalAlpha = this.state.opacity;
        ctx.stroke();
    },
    
    // Рисование прямоугольника
    drawRectangle(x, y) {
        const ctx = this.state.context;
        const width = x - this.state.startX;
        const height = y - this.state.startY;
        
        if (this.state.isFilled) {
            ctx.fillStyle = this.state.currentColor;
            ctx.globalAlpha = this.state.opacity * 0.5;
            ctx.fillRect(this.state.startX, this.state.startY, width, height);
        }
        
        ctx.strokeStyle = this.state.currentColor;
        ctx.lineWidth = this.state.currentSize;
        ctx.globalAlpha = this.state.opacity;
        ctx.strokeRect(this.state.startX, this.state.startY, width, height);
    },
    
    // Рисование круга
    drawCircle(x, y) {
        const ctx = this.state.context;
        const radius = Math.sqrt(
            Math.pow(x - this.state.startX, 2) + 
            Math.pow(y - this.state.startY, 2)
        );
        
        ctx.beginPath();
        ctx.arc(this.state.startX, this.state.startY, radius, 0, Math.PI * 2);
        
        if (this.state.isFilled) {
            ctx.fillStyle = this.state.currentColor;
            ctx.globalAlpha = this.state.opacity * 0.5;
            ctx.fill();
        }
        
        ctx.strokeStyle = this.state.currentColor;
        ctx.lineWidth = this.state.currentSize;
        ctx.globalAlpha = this.state.opacity;
        ctx.stroke();
    },
    
    // Рисование стрелки
    drawArrow(x, y) {
        const ctx = this.state.context;
        const headLength = 15;
        const angle = Math.atan2(y - this.state.startY, x - this.state.startX);
        
        // Рисуем линию
        ctx.beginPath();
        ctx.moveTo(this.state.startX, this.state.startY);
        ctx.lineTo(x, y);
        
        ctx.strokeStyle = this.state.currentColor;
        ctx.lineWidth = this.state.currentSize;
        ctx.globalAlpha = this.state.opacity;
        ctx.stroke();
        
        // Рисуем наконечник
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - headLength * Math.cos(angle - Math.PI / 6),
            y - headLength * Math.sin(angle - Math.PI / 6)
        );
        
        ctx.lineTo(
            x - headLength * Math.cos(angle + Math.PI / 6),
            y - headLength * Math.sin(angle + Math.PI / 6)
        );
        
        ctx.closePath();
        
        if (this.state.isFilled) {
            ctx.fillStyle = this.state.currentColor;
            ctx.globalAlpha = this.state.opacity;
            ctx.fill();
        } else {
            ctx.stroke();
        }
    },
    
    // Показ поля ввода текста
    showTextInput() {
        // Создаём поле ввода
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'drawing-text-input';
        input.placeholder = 'Введите текст...';
        input.style.cssText = `
            position: fixed;
            top: ${this.state.startY}px;
            left: ${this.state.startX}px;
            background: transparent;
            border: 2px solid ${this.state.currentColor};
            color: ${this.state.currentColor};
            font-size: ${this.state.currentSize * 5}px;
            padding: 5px;
            z-index: 5002;
            outline: none;
        `;
        
        // Обработчик завершения ввода
        const finishInput = () => {
            const text = input.value.trim();
            if (text) {
                this.drawText(text, this.state.startX, this.state.startY);
                
                // Сохраняем в историю
                this.state.drawings.push({
                    tool: 'text',
                    color: this.state.currentColor,
                    size: this.state.currentSize,
                    opacity: this.state.opacity,
                    text: text,
                    x: this.state.startX,
                    y: this.state.startY
                });
                
                // Отправляем через WebRTC
                this.sendTextDrawing(text, this.state.startX, this.state.startY);
            }
            
            input.remove();
            this.stopDrawing();
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishInput();
            }
        });
        
        input.addEventListener('blur', finishInput);
        
        document.body.appendChild(input);
        input.focus();
    },
    
    // Рисование текста
    drawText(text, x, y) {
        const ctx = this.state.context;
        ctx.font = `${this.state.currentSize * 5}px Arial`;
        ctx.fillStyle = this.state.currentColor;
        ctx.globalAlpha = this.state.opacity;
        ctx.fillText(text, x, y);
    },
    
    // Очистка временного canvas
    clearTempCanvas() {
        // Для инструментов фигур очищаем canvas и перерисовываем все сохранённые рисунки
        if (['rectangle', 'circle', 'line', 'arrow'].includes(this.state.currentTool)) {
            this.state.context.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);
            this.redrawAll();
        }
    },
    
    // Перерисовка всех рисунков
    redrawAll() {
        const ctx = this.state.context;
        ctx.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);
        
        this.state.drawings.forEach(drawing => {
            this.drawSavedDrawing(drawing);
        });
    },
    
    // Рисование сохранённого рисунка
    drawSavedDrawing(drawing) {
        const ctx = this.state.context;
        
        ctx.strokeStyle = drawing.color;
        ctx.fillStyle = drawing.color;
        ctx.lineWidth = drawing.size;
        ctx.globalAlpha = drawing.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        switch (drawing.tool) {
            case 'brush':
            case 'eraser':
                if (drawing.points.length < 2) return;
                
                ctx.beginPath();
                ctx.moveTo(drawing.points[0][0], drawing.points[0][1]);
                
                for (let i = 1; i < drawing.points.length; i++) {
                    ctx.lineTo(drawing.points[i][0], drawing.points[i][1]);
                }
                
                if (drawing.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.lineWidth = drawing.size * 2;
                }
                
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
                break;
                
            case 'line':
                if (drawing.points.length >= 2) {
                    ctx.beginPath();
                    ctx.moveTo(drawing.points[0][0], drawing.points[0][1]);
                    ctx.lineTo(drawing.points[1][0], drawing.points[1][1]);
                    ctx.stroke();
                }
                break;
                
            case 'rectangle':
                if (drawing.points.length >= 2) {
                    const x1 = drawing.points[0][0];
                    const y1 = drawing.points[0][1];
                    const x2 = drawing.points[1][0];
                    const y2 = drawing.points[1][1];
                    
                    const width = x2 - x1;
                    const height = y2 - y1;
                    
                    if (drawing.isFilled) {
                        ctx.globalAlpha = drawing.opacity * 0.5;
                        ctx.fillRect(x1, y1, width, height);
                        ctx.globalAlpha = drawing.opacity;
                    }
                    
                    ctx.strokeRect(x1, y1, width, height);
                }
                break;
                
            case 'circle':
                if (drawing.points.length >= 2) {
                    const x1 = drawing.points[0][0];
                    const y1 = drawing.points[0][1];
                    const x2 = drawing.points[1][0];
                    const y2 = drawing.points[1][1];
                    
                    const radius = Math.sqrt(
                        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
                    );
                    
                    ctx.beginPath();
                    ctx.arc(x1, y1, radius, 0, Math.PI * 2);
                    
                    if (drawing.isFilled) {
                        ctx.globalAlpha = drawing.opacity * 0.5;
                        ctx.fill();
                        ctx.globalAlpha = drawing.opacity;
                    }
                    
                    ctx.stroke();
                }
                break;
                
            case 'arrow':
                if (drawing.points.length >= 2) {
                    const x1 = drawing.points[0][0];
                    const y1 = drawing.points[0][1];
                    const x2 = drawing.points[1][0];
                    const y2 = drawing.points[1][1];
                    const headLength = 15;
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    
                    // Линия
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    
                    // Наконечник
                    ctx.beginPath();
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(
                        x2 - headLength * Math.cos(angle - Math.PI / 6),
                        y2 - headLength * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.lineTo(
                        x2 - headLength * Math.cos(angle + Math.PI / 6),
                        y2 - headLength * Math.sin(angle + Math.PI / 6)
                    );
                    ctx.closePath();
                    
                    if (drawing.isFilled) {
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                }
                break;
                
            case 'text':
                if (drawing.text) {
                    ctx.font = `${drawing.size * 5}px Arial`;
                    ctx.fillText(drawing.text, drawing.x, drawing.y);
                }
                break;
        }
    },
    
    // Получение координат
    getCoordinates(e) {
        const canvas = this.state.canvas;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return [
            clientX - rect.left,
            clientY - rect.top
        ];
    },
    
    // Установка цвета
    setColor(color) {
        this.state.currentColor = color;
        this.state.isEraser = false;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.drawing-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.title === color);
        });
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'color',
                color: color
            });
        }
    },
    
    // Установка инструмента
    setTool(tool) {
        this.state.currentTool = tool;
        this.state.isEraser = tool === 'eraser';
        
        // Обновляем активную кнопку
        document.querySelectorAll('.drawing-tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.onclick.toString().includes(`'${tool}'`));
        });
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'tool',
                tool: tool
            });
        }
    },
    
    // Установка размера
    setSize(size) {
        this.state.currentSize = size;
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'size',
                size: size
            });
        }
    },
    
    // Переключение заливки
    toggleFill() {
        this.state.isFilled = !this.state.isFilled;
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'fill',
                filled: this.state.isFilled
            });
        }
    },
    
    // Очистка canvas
    clearCanvas() {
        const ctx = this.state.context;
        ctx.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);
        
        this.state.drawings = [];
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'clear'
            });
        }
        
        showNotification('Холст очищен', 'info');
    },
    
    // Отправка данных рисования через WebRTC
    sendDrawingData(x, y) {
        if (!WebRTCModule || !WebRTCModule.sendDataChannelMessage) return;
        
        WebRTCModule.sendDataChannelMessage('drawing', {
            action: 'draw',
            tool: this.state.currentTool,
            color: this.state.currentColor,
            size: this.state.currentSize,
            fromX: this.state.lastX,
            fromY: this.state.lastY,
            toX: x,
            toY: y,
            isFilled: this.state.isFilled,
            opacity: this.state.opacity
        });
    },
    
    // Отправка законченного рисунка
    sendCompleteDrawing() {
        if (!WebRTCModule || !WebRTCModule.sendDataChannelMessage) return;
        
        if (this.state.currentDrawing) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'complete',
                drawing: this.state.currentDrawing
            });
        }
    },
    
    // Отправка текстового рисунка
    sendTextDrawing(text, x, y) {
        if (!WebRTCModule || !WebRTCModule.sendDataChannelMessage) return;
        
        WebRTCModule.sendDataChannelMessage('drawing', {
            action: 'text',
            text: text,
            x: x,
            y: y,
            color: this.state.currentColor,
            size: this.state.currentSize,
            opacity: this.state.opacity
        });
    },
    
    // Обработка удалённого рисования
    handleRemoteDrawing(data) {
        switch (data.action) {
            case 'mode':
                if (data.enabled && this.state.canvas.style.display === 'none') {
                    this.toggleDrawingMode();
                }
                break;
                
            case 'color':
                this.state.currentColor = data.color;
                break;
                
            case 'tool':
                this.state.currentTool = data.tool;
                this.state.isEraser = data.tool === 'eraser';
                break;
                
            case 'size':
                this.state.currentSize = data.size;
                break;
                
            case 'fill':
                this.state.isFilled = data.filled;
                break;
                
            case 'draw':
                this.drawRemote(data);
                break;
                
            case 'complete':
                if (data.drawing) {
                    this.state.drawings.push(data.drawing);
                    this.redrawAll();
                }
                break;
                
            case 'text':
                this.drawText(data.text, data.x, data.y);
                
                this.state.drawings.push({
                    tool: 'text',
                    color: data.color,
                    size: data.size,
                    opacity: data.opacity,
                    text: data.text,
                    x: data.x,
                    y: data.y
                });
                break;
                
            case 'clear':
                this.clearCanvas();
                break;
        }
    },
    
    // Рисование удалённых данных
    drawRemote(data) {
        const ctx = this.state.context;
        
        ctx.strokeStyle = data.color;
        ctx.fillStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.globalAlpha = data.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (data.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = data.size * 2;
        }
        
        switch (data.tool) {
            case 'brush':
            case 'eraser':
                ctx.beginPath();
                ctx.moveTo(data.fromX, data.fromY);
                ctx.lineTo(data.toX, data.toY);
                ctx.stroke();
                break;
                
            case 'line':
                ctx.beginPath();
                ctx.moveTo(data.fromX, data.fromY);
                ctx.lineTo(data.toX, data.toY);
                ctx.stroke();
                break;
                
            case 'rectangle':
                const width = data.toX - data.fromX;
                const height = data.toY - data.fromY;
                
                if (data.isFilled) {
                    ctx.globalAlpha = data.opacity * 0.5;
                    ctx.fillRect(data.fromX, data.fromY, width, height);
                    ctx.globalAlpha = data.opacity;
                }
                
                ctx.strokeRect(data.fromX, data.fromY, width, height);
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(data.toX - data.fromX, 2) + 
                    Math.pow(data.toY - data.fromY, 2)
                );
                
                ctx.beginPath();
                ctx.arc(data.fromX, data.fromY, radius, 0, Math.PI * 2);
                
                if (data.isFilled) {
                    ctx.globalAlpha = data.opacity * 0.5;
                    ctx.fill();
                    ctx.globalAlpha = data.opacity;
                }
                
                ctx.stroke();
                break;
                
            case 'arrow':
                const headLength = 15;
                const angle = Math.atan2(data.toY - data.fromY, data.toX - data.fromX);
                
                // Линия
                ctx.beginPath();
                ctx.moveTo(data.fromX, data.fromY);
                ctx.lineTo(data.toX, data.toY);
                ctx.stroke();
                
                // Наконечник
                ctx.beginPath();
                ctx.moveTo(data.toX, data.toY);
                ctx.lineTo(
                    data.toX - headLength * Math.cos(angle - Math.PI / 6),
                    data.toY - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    data.toX - headLength * Math.cos(angle + Math.PI / 6),
                    data.toY - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                
                if (data.isFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
        }
        
        // Возвращаем обычный режим смешивания
        ctx.globalCompositeOperation = 'source-over';
    },
    
    // Сохранение рисунка как изображения
    saveAsImage() {
        if (!this.state.canvas) return;
        
        const link = document.createElement('a');
        link.download = `рисунок-${new Date().toISOString().split('T')[0]}.png`;
        link.href = this.state.canvas.toDataURL('image/png');
        link.click();
        
        showNotification('Рисунок сохранён', 'success');
    },
    
    // Отмена последнего действия
    undo() {
        if (this.state.drawings.length === 0) return;
        
        this.state.drawings.pop();
        this.redrawAll();
        
        // Отправляем через WebRTC
        if (WebRTCModule && WebRTCModule.sendDataChannelMessage) {
            WebRTCModule.sendDataChannelMessage('drawing', {
                action: 'undo'
            });
        }
        
        showNotification('Действие отменено', 'info');
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    DrawingModule.init();
});

// Экспорт
window.DrawingModule = DrawingModule;
