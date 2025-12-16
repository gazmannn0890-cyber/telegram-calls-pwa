// Состояние приложения
const state = {
    isDarkTheme: true,
    isInCall: false,
    callType: 'audio',
    isMuted: false,
    isVideoOn: false,
    isSpeakerOn: false,
    callDuration: 0,
    callTimer: null,
    currentContact: null,
    isDraggingVideo: false,
    dragStartX: 0,
    dragStartY: 0
};

// DOM элементы
const screens = {
    main: document.getElementById('mainScreen'),
    call: document.getElementById('callScreen'),
    history: document.getElementById('historyScreen'),
    settings: document.getElementById('settingsScreen')
};

const modal = {
    newCall: document.getElementById('newCallModal')
};

// Инициализация приложения
function init() {
    // Проверяем сохранённую тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.isDarkTheme = savedTheme === 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle').checked = state.isDarkTheme;
    } else {
        // Определяем предпочтительную тему системы
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.isDarkTheme = prefersDark;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    
    // Инициализируем элементы чатов с анимацией
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach((item, index) => {
        item.style.setProperty('--i', index);
        item.style.animationDelay = `${index * 0.05}s`;
    });
    
    // Инициализируем элементы истории звонков
    const callItems = document.querySelectorAll('.call-item');
    callItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Инициализация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Ошибка Service Worker:', err));
    }
    
    // Обработка свайпов
    setupSwipeGestures();
    
    // Обработка долгого нажатия
    setupLongPress();
    
    console.log('Telegram Calls App инициализирован');
}

// Переключение темы
function toggleTheme() {
    state.isDarkTheme = !state.isDarkTheme;
    const theme = state.isDarkTheme ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Обновляем иконку темы
    const themeIcon = document.querySelector('.fa-moon');
    if (themeIcon) {
        themeIcon.className = state.isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Показать/скрыть поиск
function showSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.remove('hidden');
    const input = searchBar.querySelector('.search-input');
    input.focus();
}

function hideSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.add('hidden');
}

// Переключение экранов
function showScreen(screenId) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    }
}

function showMainScreen() {
    showScreen('main');
}

function openCallHistory() {
    showScreen('history');
}

function openChats() {
    showScreen('main');
}

function openSettings() {
    showScreen('settings');
}

// Работа со звонками
function startCall(type, element = null) {
    state.callType = type;
    state.isInCall = true;
    
    if (element) {
        const chatItem = element.closest('.chat-item');
        if (chatItem) {
            const name = chatItem.querySelector('.chat-name').textContent;
            const avatar = chatItem.querySelector('img').src;
            
            state.currentContact = { name, avatar };
            
            document.getElementById('callName').textContent = name;
            document.getElementById('callAvatar').src = avatar;
        }
    }
    
    showScreen('call');
    
    // Запускаем анимацию ракеты
    startRocketAnimation();
    
    // Имитируем процесс соединения
    setTimeout(() => {
        document.getElementById('callStatus').textContent = 'Звонит...';
        
        // Имитируем принятие звонка
        setTimeout(() => {
            document.getElementById('callStatus').textContent = '00:00';
            startCallTimer();
            
            // Показываем видео окно для видеозвонков
            if (type === 'video') {
                toggleVideo();
            }
        }, 2000);
    }, 1000);
}

function startNewCall() {
    modal.newCall.classList.add('active');
    modal.newCall.classList.remove('hidden');
}

function closeNewCallModal() {
    modal.newCall.classList.remove('active');
    setTimeout(() => {
        modal.newCall.classList.add('hidden');
    }, 300);
}

function startNewCall(type) {
    closeNewCallModal();
    const input = document.querySelector('.contact-input');
    const name = input.value || 'Новый контакт';
    
    state.currentContact = { 
        name, 
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
    };
    
    document.getElementById('callName').textContent = name;
    document.getElementById('callAvatar').src = state.currentContact.avatar;
    
    startCall(type);
}

function endCall() {
    state.isInCall = false;
    
    // Останавливаем таймер
    if (state.callTimer) {
        clearInterval(state.callTimer);
        state.callTimer = null;
    }
    
    // Сбрасываем состояние
    state.isMuted = false;
    state.isVideoOn = false;
    state.isSpeakerOn = false;
    state.callDuration = 0;
    
    // Обновляем кнопки
    updateCallControls();
    
    showMainScreen();
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    const btn = document.querySelector('.control-btn:nth-child(1) i');
    btn.className = state.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    btn.closest('.control-btn').classList.toggle('active', state.isMuted);
    
    // Показываем уведомление о шумоподавлении при долгом нажатии
}

function toggleVideo() {
    state.isVideoOn = !state.isVideoOn;
    const btn = document.querySelector('.control-btn:nth-child(2) i');
    btn.className = state.isVideoOn ? 'fas fa-video' : 'fas fa-video-slash';
    btn.closest('.control-btn').classList.toggle('active', state.isVideoOn);
    
    const videoPreview = document.getElementById('videoPreview');
    if (state.isVideoOn) {
        videoPreview.classList.remove('hidden');
        // Добавляем свечение вокруг аватарки
        document.querySelector('.call-avatar').style.boxShadow = '0 0 20px rgba(0, 201, 183, 0.5)';
    } else {
        videoPreview.classList.add('hidden');
        document.querySelector('.call-avatar').style.boxShadow = 'none';
    }
}

function toggleSpeaker() {
    state.isSpeakerOn = !state.isSpeakerOn;
    const btn = document.querySelector('.control-btn:nth-child(3) i');
    btn.className = state.isSpeakerOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    btn.closest('.control-btn').classList.toggle('active', state.isSpeakerOn);
}

function startCallTimer() {
    state.callDuration = 0;
    state.callTimer = setInterval(() => {
        state.callDuration++;
        const minutes = Math.floor(state.callDuration / 60);
        const seconds = state.callDuration % 60;
        document.getElementById('callStatus').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function startRocketAnimation() {
    const rocket = document.getElementById('rocketAnimation');
    rocket.classList.add('active');
    
    setTimeout(() => {
        rocket.classList.remove('active');
    }, 2000);
}

function updateCallControls() {
    // Обновляем все кнопки управления
    const controls = document.querySelectorAll('.control-btn');
    controls[0].querySelector('i').className = state.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    controls[1].querySelector('i').className = state.isVideoOn ? 'fas fa-video' : 'fas fa-video-slash';
    controls[2].querySelector('i').className = state.isSpeakerOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    
    controls[0].classList.toggle('active', state.isMuted);
    controls[1].classList.toggle('active', state.isVideoOn);
    controls[2].classList.toggle('active', state.isSpeakerOn);
}

// Настройка жестов
function setupSwipeGestures() {
    let startX, startY, distX, distY;
    const threshold = 50; // минимальное расстояние для свайпа
    const restraint = 100; // максимальное отклонение по вертикали
    const allowedTime = 500; // максимальное время жеста
    
    let startTime;
    
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = new Date().getTime();
    });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        distX = touch.clientX - startX;
        distY = touch.clientY - startY;
        const elapsedTime = new Date().getTime() - startTime;
        
        if (elapsedTime <= allowedTime) {
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                if (distX > 0) {
                    // Свайп вправо - переключение на видео
                    if (state.isInCall && state.callType === 'audio') {
                        state.callType = 'video';
                        toggleVideo();
                        showSwipeFeedback('Переключено на видео');
                    }
                } else {
                    // Свайп влево - переключение на аудио
                    if (state.isInCall && state.callType === 'video') {
                        state.callType = 'audio';
                        if (state.isVideoOn) toggleVideo();
                        showSwipeFeedback('Переключено на аудио');
                    }
                }
            }
        }
    });
}

function showSwipeFeedback(text) {
    const feedback = document.createElement('div');
    feedback.className = 'swipe-feedback';
    feedback.textContent = text;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 136, 204, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        animation: fadeOut 1.5s ease forwards;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 1500);
}

// Долгое нажатие для шумоподавления
function setupLongPress() {
    let pressTimer;
    const micBtn = document.querySelector('.control-btn:nth-child(1)');
    
    if (micBtn) {
        micBtn.addEventListener('touchstart', startPress);
        micBtn.addEventListener('touchend', cancelPress);
        micBtn.addEventListener('mousedown', startPress);
        micBtn.addEventListener('mouseup', cancelPress);
        micBtn.addEventListener('mouseleave', cancelPress);
    }
}

function startPress(e) {
    pressTimer = setTimeout(() => {
        showNoiseCancellationMenu();
    }, 500);
}

function cancelPress() {
    clearTimeout(pressTimer);
}

function showNoiseCancellationMenu() {
    const modes = ['Авто', 'Высокое', 'Низкое', 'Выкл'];
    const menu = document.createElement('div');
    menu.className = 'noise-menu';
    menu.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        gap: 8px;
        border: 1px solid var(--border);
    `;
    
    modes.forEach(mode => {
        const btn = document.createElement('button');
        btn.textContent = mode;
        btn.style.cssText = `
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
        `;
        btn.onmouseover = () => btn.style.background = 'var(--accent-primary)';
        btn.onmouseout = () => btn.style.background = 'var(--bg-tertiary)';
        btn.onclick = () => {
            showSwipeFeedback(`Шумоподавление: ${mode}`);
            menu.remove();
        };
        menu.appendChild(btn);
    });
    
    document.body.appendChild(menu);
    
    // Закрытие при клике вне меню
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
    
    function closeMenu(e) {
        if (!menu.contains(e.target) && !e.target.closest('.control-btn:nth-child(1)')) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }
}

// Drag & Drop для видео окна
function setupVideoDrag() {
    const videoPreview = document.getElementById('videoPreview');
    if (!videoPreview) return;
    
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    
    videoPreview.addEventListener('mousedown', dragStart);
    videoPreview.addEventListener('touchstart', dragStart);
    
    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        
        isDragging = true;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, videoPreview);
        }
    }
    
    function dragEnd() {
        isDragging = false;
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
    }
    
    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}

// Добавляем CSS для анимации исчезновения
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
    
    .swipe-feedback {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 136, 204, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        animation: fadeOut 1.5s ease forwards;
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupVideoDrag();
});

// Предотвращаем контекстное меню на мобильных устройствах
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.video-preview') || e.target.closest('.call-controls')) {
        e.preventDefault();
    }
});
