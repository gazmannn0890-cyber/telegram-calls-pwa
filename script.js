// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const AppState = {
    // Тема
    isDarkTheme: true,
    isPremium: false,
    
    // Пользователь
    currentUser: {
        id: 1,
        name: "Алексей",
        phone: "+7 (999) 123-45-67",
        avatar: "https://i.pravatar.cc/150?img=3",
        status: "online",
        lastSeen: Date.now()
    },
    
    // Чат
    currentChatId: null,
    chats: [],
    messages: {},
    
    // Звонки
    isInCall: false,
    callType: 'audio',
    isMuted: false,
    isVideoOn: false,
    isSpeakerOn: false,
    callDuration: 0,
    callTimer: null,
    currentContact: null,
    
    // Групповой звонок
    isGroupCall: false,
    groupCallParticipants: [],
    groupCallTimer: null,
    
    // WebRTC
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    
    // Эффекты
    currentEffect: 'normal',
    isDrawingMode: false,
    isRecording: false,
    isScreenSharing: false,
    
    // Уведомления
    notifications: [],
    
    // Настройки
    settings: {
        privacy: 'contacts',
        videoQuality: 'auto',
        noiseCancellation: true,
        saveToGallery: false,
        notifications: true,
        encryption: true,
        language: 'ru'
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
async function initApp() {
    console.log('🚀 Инициализация Telegram Calls Pro...');
    
    // Загружаем сохранённые данные
    loadFromLocalStorage();
    
    // Инициализируем тему
    initTheme();
    
    // Инициализируем чаты
    initChats();
    
    // Инициализируем контакты
    initContacts();
    
    // Инициализируем WebRTC
    initWebRTC();
    
    // Запускаем Service Worker для PWA
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.worker.register('sw.js');
            console.log('✅ Service Worker зарегистрирован:', registration);
        } catch (error) {
            console.error('❌ Ошибка Service Worker:', error);
        }
    }
    
    // Инициализируем уведомления
    initNotifications();
    
    // Инициализируем жесты
    initGestures();
    
    // Показываем приветственное уведомление
    showNotification('Добро пожаловать в Telegram Calls Pro!', 'success');
    
    console.log('✅ Приложение инициализировано');
}

// ===== ТЕМА =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    AppState.isDarkTheme = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    
    document.body.setAttribute('data-theme', AppState.isDarkTheme ? 'dark' : 'light');
    document.getElementById('themeToggle').checked = AppState.isDarkTheme;
    
    // Слушаем изменения системной темы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            AppState.isDarkTheme = e.matches;
            document.body.setAttribute('data-theme', AppState.isDarkTheme ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    AppState.isDarkTheme = !AppState.isDarkTheme;
    const theme = AppState.isDarkTheme ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').checked = AppState.isDarkTheme;
    
    localStorage.setItem('theme', theme);
    showNotification(`Тема изменена на ${AppState.isDarkTheme ? 'тёмную' : 'светлую'}`, 'info');
}

// ===== НАВИГАЦИЯ =====
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    
    // Останавливаем все активные звуки
    stopAllSounds();
    
    // Закрываем все меню
    closeAllMenus();
}

function showMainScreen() {
    showScreen('mainScreen');
    updateChatsList();
}

function showContactsScreen() {
    showScreen('contactsScreen');
    updateContactsList();
}

function showCallHistory() {
    // Временная реализация
    showNotification('История звонков пока недоступна', 'warning');
}

function showSettingsScreen() {
    showScreen('settingsScreen');
}

function openChat(chatId) {
    AppState.currentChatId = chatId;
    showScreen('chatScreen');
    loadChatMessages(chatId);
    updateChatHeader(chatId);
}

function closeChat() {
    AppState.currentChatId = null;
    showMainScreen();
}

// ===== БОКОВОЕ МЕНЮ =====
function toggleSideMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('open');
}

function closeSideMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.remove('open');
}

// ===== ПОИСК =====
function showSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.add('active');
    searchBar.querySelector('.search-input').focus();
}

function hideSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.remove('active');
    searchBar.querySelector('.search-input').value = '';
}

// ===== ЧАТЫ =====
function initChats() {
    // Инициализируем тестовые чаты
    AppState.chats = [
        {
            id: 1,
            type: 'private',
            name: 'Алексей Иванов',
            avatar: 'https://i.pravatar.cc/150?img=1',
            lastMessage: 'Аудиозвонок • 5:24',
            lastMessageType: 'call',
            time: '14:30',
            unread: 2,
            online: true,
            members: [],
            isPinned: true
        },
        {
            id: 2,
            type: 'private',
            name: 'Мария Гарсия',
            avatar: 'https://i.pravatar.cc/150?img=5',
            lastMessage: 'Пропущенный видеозвонок',
            lastMessageType: 'call',
            time: 'Вчера',
            unread: 1,
            online: false,
            members: [],
            isPinned: false
        },
        {
            id: 3,
            type: 'group',
            name: 'Рабочая группа',
            avatar: null,
            lastMessage: 'Вы: Видеозвонок в 15:00',
            lastMessageType: 'text',
            time: '10:20',
            unread: 0,
            online: true,
            members: [1, 2, 4, 5, 6, 7, 8, 9],
            isPinned: true
        }
    ];
    
    // Инициализируем тестовые сообщения
    AppState.messages = {
        1: [
            {
                id: 1,
                type: 'text',
                text: 'Привет! Как дела?',
                senderId: 1,
                timestamp: Date.now() - 3600000,
                isRead: true,
                isEdited: false
            },
            {
                id: 2,
                type: 'text',
                text: 'Привет! Всё отлично, только что закончил проект. А у тебя?',
                senderId: 0, // текущий пользователь
                timestamp: Date.now() - 3540000,
                isRead: true,
                isEdited: false
            },
            {
                id: 3,
                type: 'voice',
                duration: 15,
                senderId: 1,
                timestamp: Date.now() - 3480000,
                isRead: true
            },
            {
                id: 4,
                type: 'call',
                callType: 'audio',
                duration: 324,
                senderId: 0,
                timestamp: Date.now() - 3300000,
                isRead: true
            }
        ]
    };
}

function updateChatsList() {
    const chatsList = document.getElementById('chatsList');
    if (!chatsList) return;
    
    // Обновляем список чатов
    // В реальном приложении здесь был бы динамический рендеринг
}

function loadChatMessages(chatId) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer || !AppState.messages[chatId]) return;
    
    // Очищаем контейнер
    messagesContainer.innerHTML = '';
    
    // Добавляем сообщения
    AppState.messages[chatId].forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    
    // Скроллим вниз
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.senderId === 0 ? 'outgoing' : 'incoming'}`;
    
    let content = '';
    
    switch (message.type) {
        case 'text':
            content = `
                <div class="message-content">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">
                        ${formatTime(message.timestamp)}
                        ${message.senderId === 0 ? '<i class="fas fa-check-double read"></i>' : ''}
                    </div>
                </div>
                ${message.senderId === 0 ? '<div class="message-status"><i class="fas fa-check-double"></i></div>' : ''}
            `;
            break;
            
        case 'voice':
            content = `
                <div class="message-content">
                    <div class="voice-content">
                        <button class="play-voice" onclick="playVoiceMessage(${message.id})">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="voice-waveform">
                            <div class="wave"></div>
                        </div>
                        <span class="voice-duration">0:${message.duration.toString().padStart(2, '0')}</span>
                    </div>
                    <div class="message-time">
                        ${formatTime(message.timestamp)}
                    </div>
                </div>
            `;
            break;
            
        case 'call':
            content = `
                <div class="message-content">
                    <div class="call-info">
                        <i class="fas fa-${message.callType === 'video' ? 'video' : 'phone'}"></i>
                        <div class="call-details">
                            <span class="call-type">${message.callType === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}</span>
                            <span class="call-duration">${formatDuration(message.duration)}</span>
                        </div>
                    </div>
                    <div class="message-time">
                        ${formatTime(message.timestamp)}
                    </div>
                </div>
            `;
            break;
    }
    
    div.innerHTML = content;
    return div;
}

function updateChatHeader(chatId) {
    const chat = AppState.chats.find(c => c.id === chatId);
    if (!chat) return;
    
    document.getElementById('chatContactName').textContent = chat.name;
    document.getElementById('chatContactAvatar').src = chat.avatar || 'https://i.pravatar.cc/150';
    document.getElementById('chatContactStatus').textContent = chat.online ? 'в сети' : 'был(а) недавно';
}

function sendMessage() {
    const input = document.querySelector('.message-input');
    const text = input.value.trim();
    
    if (!text || !AppState.currentChatId) return;
    
    // Создаем новое сообщение
    const message = {
        id: Date.now(),
        type: 'text',
        text: text,
        senderId: 0,
        timestamp: Date.now(),
        isRead: false,
        isEdited: false
    };
    
    // Добавляем в состояние
    if (!AppState.messages[AppState.currentChatId]) {
        AppState.messages[AppState.currentChatId] = [];
    }
    AppState.messages[AppState.currentChatId].push(message);
    
    // Обновляем UI
    const messagesContainer = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    
    // Очищаем input и скроллим вниз
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Имитируем ответ
    setTimeout(() => {
        sendAutoReply(AppState.currentChatId);
    }, 1000);
    
    // Воспроизводим звук
    playSound('message');
    
    // Сохраняем в хранилище
    saveToLocalStorage();
}

function sendAutoReply(chatId) {
    const replies = [
        'Отлично!',
        'Интересно...',
        'Понял, спасибо!',
        'Согласен с тобой',
        'Давай обсудим это позже'
    ];
    
    const reply = {
        id: Date.now(),
        type: 'text',
        text: replies[Math.floor(Math.random() * replies.length)],
        senderId: chatId, // ID собеседника
        timestamp: Date.now(),
        isRead: false
    };
    
    AppState.messages[chatId].push(reply);
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        const messageElement = createMessageElement(reply);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Показываем уведомление
        const chat = AppState.chats.find(c => c.id === chatId);
        if (chat) {
            showNotification(`Новое сообщение от ${chat.name}`, 'message');
        }
    }
    
    playSound('message');
}

// ===== КОНТАКТЫ =====
function initContacts() {
    // В реальном приложении здесь была бы загрузка контактов
}

function updateContactsList() {
    // В реальном приложении здесь был бы динамический рендеринг
}

function addNewContact() {
    showNotification('Добавление контактов пока недоступно', 'warning');
}

function importContacts() {
    if (navigator.contacts) {
        navigator.contacts.select(['name', 'tel'], { multiple: true })
            .then(contacts => {
                showNotification(`Импортировано ${contacts.length} контактов`, 'success');
            })
            .catch(error => {
                console.error('Ошибка импорта контактов:', error);
                showNotification('Не удалось импортировать контакты', 'error');
            });
    } else {
        showNotification('API контактов не поддерживается', 'error');
    }
}

// ===== ЗВОНКИ =====
function startNewCall(type = 'audio') {
    const modal = document.getElementById('newCallModal');
    modal.classList.add('active');
    
    // Устанавливаем тип звонка
    document.querySelectorAll('.call-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
}

function closeNewCallModal() {
    const modal = document.getElementById('newCallModal');
    modal.classList.remove('active');
}

function startCallFromModal() {
    const searchInput = document.querySelector('.contact-search');
    const contactName = searchInput.value.trim();
    
    if (!contactName) {
        showNotification('Введите имя контакта', 'warning');
        return;
    }
    
    const type = document.querySelector('.call-type-btn.active').dataset.type;
    
    if (type === 'group') {
        createGroupCall();
    } else {
        // Имитируем звонок новому контакту
        AppState.currentContact = {
            id: Date.now(),
            name: contactName,
            avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
        };
        
        startCall(type);
    }
    
    closeNewCallModal();
}

function startCall(type, contactId = null) {
    if (contactId) {
        const chat = AppState.chats.find(c => c.id === contactId);
        if (chat) {
            AppState.currentContact = {
                id: chat.id,
                name: chat.name,
                avatar: chat.avatar
            };
        }
    }
    
    if (!AppState.currentContact) {
        showNotification('Выберите контакт для звонка', 'warning');
        return;
    }
    
    AppState.isInCall = true;
    AppState.callType = type;
    AppState.isMuted = false;
    AppState.isVideoOn = type === 'video';
    AppState.callDuration = 0;
    
    // Обновляем UI
    document.getElementById('callContactName').textContent = AppState.currentContact.name;
    document.getElementById('callStatusText').textContent = 'Соединение...';
    
    // Показываем экран звонка
    showScreen('callScreen');
    
    // Запускаем анимацию ракеты
    startRocketAnimation();
    
    // Имитируем процесс соединения
    setTimeout(() => {
        document.getElementById('callStatusText').textContent = 'Звонит...';
        playSound('ringtone');
        
        // Имитируем ответ через 3 секунды
        setTimeout(() => {
            stopSound('ringtone');
            document.getElementById('callStatusText').textContent = '00:00';
            startCallTimer();
            
            // Для видеозвонка показываем локальное видео
            if (type === 'video') {
                initLocalVideo();
            }
            
            // Показываем уведомление
            showNotification(`Начат ${type === 'video' ? 'видео' : 'аудио'}звонок с ${AppState.currentContact.name}`, 'call');
        }, 3000);
    }, 1000);
}

function startCallTimer() {
    AppState.callTimer = setInterval(() => {
        AppState.callDuration++;
        
        const minutes = Math.floor(AppState.callDuration / 60);
        const seconds = AppState.callDuration % 60;
        
        document.getElementById('callStatusText').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function toggleMute() {
    AppState.isMuted = !AppState.isMuted;
    
    const btn = document.querySelector('.control-btn:nth-child(1) i');
    btn.className = AppState.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    btn.closest('.control-btn').classList.toggle('active', AppState.isMuted);
    
    showNotification(AppState.isMuted ? 'Микрофон выключен' : 'Микрофон включен', 'info');
}

function toggleVideo() {
    if (AppState.callType !== 'video') return;
    
    AppState.isVideoOn = !AppState.isVideoOn;
    
    const btn = document.querySelector('.control-btn:nth-child(2) i');
    btn.className = AppState.isVideoOn ? 'fas fa-video' : 'fas fa-video-slash';
    btn.closest('.control-btn').classList.toggle('active', AppState.isVideoOn);
    
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
        if (AppState.isVideoOn) {
            localVideo.classList.remove('hidden');
            initLocalVideo();
        } else {
            localVideo.classList.add('hidden');
        }
    }
    
    showNotification(AppState.isVideoOn ? 'Камера включена' : 'Камера выключена', 'info');
}

function toggleSpeaker() {
    AppState.isSpeakerOn = !AppState.isSpeakerOn;
    
    const btn = document.querySelector('.control-btn:nth-child(3) i');
    btn.className = AppState.isSpeakerOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    btn.closest('.control-btn').classList.toggle('active', AppState.isSpeakerOn);
    
    showNotification(AppState.isSpeakerOn ? 'Динамик включён' : 'Динамик выключен', 'info');
}

function endCall() {
    // Останавливаем таймер
    if (AppState.callTimer) {
        clearInterval(AppState.callTimer);
        AppState.callTimer = null;
    }
    
    // Останавливаем все звуки
    stopAllSounds();
    
    // Останавливаем локальное видео
    if (AppState.localStream) {
        AppState.localStream.getTracks().forEach(track => track.stop());
        AppState.localStream = null;
    }
    
    // Сбрасываем состояние
    AppState.isInCall = false;
    AppState.isGroupCall = false;
    AppState.callDuration = 0;
    
    // Воспроизводим звук завершения звонка
    playSound('callEnd');
    
    // Показываем уведомление
    const duration = formatDuration(AppState.callDuration);
    showNotification(`Звонок завершён. Длительность: ${duration}`, 'info');
    
    // Возвращаемся на главный экран
    showMainScreen();
}

// ===== ГРУППОВЫЕ ЗВОНКИ =====
function createGroupCall(participantIds = null) {
    if (participantIds) {
        // Создаём групповой звонок с выбранными участниками
        AppState.groupCallParticipants = participantIds.map(id => ({
            id,
            name: `Участник ${id}`,
            avatar: `https://i.pravatar.cc/150?img=${id}`,
            isMuted: false,
            isVideoOn: true,
            isSpeaking: id === 1 // Первый участник говорит
        }));
    } else {
        // Создаём тестовый групповой звонок
        AppState.groupCallParticipants = [
            {
                id: 1,
                name: 'Алексей',
                avatar: 'https://i.pravatar.cc/150?img=1',
                isMuted: false,
                isVideoOn: true,
                isSpeaking: true
            },
            {
                id: 2,
                name: 'Мария',
                avatar: 'https://i.pravatar.cc/150?img=5',
                isMuted: true,
                isVideoOn: true,
                isSpeaking: false
            },
            {
                id: 3,
                name: 'Иван',
                avatar: 'https://i.pravatar.cc/150?img=8',
                isMuted: false,
                isVideoOn: false,
                isSpeaking: false
            }
        ];
    }
    
    AppState.isGroupCall = true;
    AppState.isInCall = true;
    AppState.callDuration = 0;
    
    // Показываем экран группового звонка
    showScreen('groupCallScreen');
    
    // Обновляем количество участников
    document.getElementById('participantsCount').textContent = AppState.groupCallParticipants.length;
    
    // Запускаем таймер
    startGroupCallTimer();
    
    // Показываем уведомление
    showNotification('Групповой звонок начат', 'call');
}

function startGroupCallTimer() {
    if (AppState.groupCallTimer) {
        clearInterval(AppState.groupCallTimer);
    }
    
    AppState.groupCallTimer = setInterval(() => {
        AppState.callDuration++;
        
        const minutes = Math.floor(AppState.callDuration / 60);
        const seconds = AppState.callDuration % 60;
        
        document.getElementById('groupCallDuration').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function endGroupCall() {
    // Останавливаем таймер
    if (AppState.groupCallTimer) {
        clearInterval(AppState.groupCallTimer);
        AppState.groupCallTimer = null;
    }
    
    // Сбрасываем состояние
    AppState.isGroupCall = false;
    AppState.isInCall = false;
    AppState.groupCallParticipants = [];
    AppState.callDuration = 0;
    
    // Воспроизводим звук
    playSound('callEnd');
    
    // Показываем статистику
    const duration = formatDuration(AppState.callDuration);
    const participants = AppState.groupCallParticipants.length;
    showNotification(`Групповой звонок завершён. Участников: ${participants}, Длительность: ${duration}`, 'info');
    
    // Возвращаемся на главный экран
    showMainScreen();
}

function addParticipantToCall() {
    const newParticipant = {
        id: Date.now(),
        name: `Участник ${AppState.groupCallParticipants.length + 1}`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        isMuted: Math.random() > 0.5,
        isVideoOn: Math.random() > 0.3,
        isSpeaking: false
    };
    
    AppState.groupCallParticipants.push(newParticipant);
    document.getElementById('participantsCount').textContent = AppState.groupCallParticipants.length;
    
    showNotification(`${newParticipant.name} присоединился к звонку`, 'info');
}

function toggleGroupCallMenu() {
    const menu = document.getElementById('groupCallMenu');
    menu.classList.toggle('active');
}

// ===== ЭФФЕКТЫ И ФИЛЬТРЫ =====
function toggleEffects() {
    const modal = document.getElementById('effectsModal');
    modal.classList.add('active');
}

function closeEffectsModal() {
    const modal = document.getElementById('effectsModal');
    modal.classList.remove('active');
}

function applyEffect(effect) {
    AppState.currentEffect = effect;
    
    // Применяем эффект к видео
    const remoteVideo = document.querySelector('.remote-video');
    if (remoteVideo) {
        remoteVideo.style.filter = getEffectFilter(effect);
    }
    
    showNotification(`Применён эффект: ${effect}`, 'info');
    closeEffectsModal();
}

function getEffectFilter(effect) {
    switch(effect) {
        case 'vintage': return 'sepia(0.5) contrast(1.2)';
        case 'blackwhite': return 'grayscale(1) contrast(1.2)';
        case 'sepia': return 'sepia(1)';
        case 'blur': return 'blur(5px)';
        case 'pixelate': return 'contrast(2)';
        default: return 'none';
    }
}

function toggleDrawingMode() {
    AppState.isDrawingMode = !AppState.isDrawingMode;
    
    const canvas = document.getElementById('drawingCanvas');
    if (AppState.isDrawingMode) {
        canvas.style.pointerEvents = 'auto';
        initDrawingCanvas();
        showNotification('Режим рисования включён', 'info');
    } else {
        canvas.style.pointerEvents = 'none';
        clearDrawingCanvas();
        showNotification('Режим рисования выключен', 'info');
    }
}

function initDrawingCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const [x, y] = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#0088cc';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        [lastX, lastY] = [x, y];
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function getCoordinates(e) {
        if (e.touches) {
            return [e.touches[0].clientX, e.touches[0].clientY];
        }
        return [e.clientX, e.clientY];
    }
}

function clearDrawingCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===== WebRTC =====
async function initWebRTC() {
    try {
        // Проверяем доступность медиаустройств
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('WebRTC не поддерживается');
            return;
        }
        
        // Запрашиваем разрешения
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ WebRTC инициализирован');
        AppState.localStream = stream;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации WebRTC:', error);
        showNotification('Не удалось получить доступ к камере/микрофону', 'error');
    }
}

async function initLocalVideo() {
    if (!AppState.localStream) {
        try {
            AppState.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
        } catch (error) {
            console.error('Ошибка доступа к камере:', error);
            return;
        }
    }
    
    const pipVideo = document.querySelector('.pip-video');
    if (pipVideo && AppState.localStream) {
        // Создаём элемент video для PIP
        const video = document.createElement('video');
        video.srcObject = AppState.localStream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        pipVideo.innerHTML = '';
        pipVideo.appendChild(video);
    }
}

// ===== ЗВУКИ =====
function playSound(soundName) {
    if (!AppState.settings.notifications) return;
    
    const audio = document.getElementById(`${soundName}Audio`);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Не удалось воспроизвести звук:', e));
    }
}

function stopSound(soundName) {
    const audio = document.getElementById(`${soundName}Audio`);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function stopAllSounds() {
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

// ===== АНИМАЦИИ =====
function startRocketAnimation() {
    const rocket = document.getElementById('rocketAnimation');
    if (!rocket) return;
    
    rocket.classList.add('active');
    
    setTimeout(() => {
        rocket.classList.remove('active');
    }, 2000);
}

// ===== УВЕДОМЛЕНИЯ =====
function initNotifications() {
    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(message, type = 'info') {
    // Создаём элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-title">${getNotificationTitle(type)}</div>
        <div class="notification-message">${message}</div>
    `;
    
    // Добавляем в контейнер
    const container = document.getElementById('notificationContainer');
    container.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    // Показываем системное уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(getNotificationTitle(type), {
            body: message,
            icon: 'assets/icons/icon-192.png'
        });
    }
    
    // Воспроизводим звук
    if (type !== 'info') {
        playSound('message');
    }
}

function getNotificationTitle(type) {
    switch(type) {
        case 'success': return '✅ Успешно';
        case 'error': return '❌ Ошибка';
        case 'warning': return '⚠️ Предупреждение';
        case 'call': return '📞 Звонок';
        case 'message': return '💬 Сообщение';
        default: return 'ℹ️ Информация';
    }
}

// ===== ЖЕСТЫ =====
function initGestures() {
    let startX, startY;
    let isSwiping = false;
    
    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Горизонтальный свайп
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
            if (deltaX > 0) {
                // Свайп вправо - открываем меню
                if (!document.getElementById('sideMenu').classList.contains('open')) {
                    toggleSideMenu();
                }
            } else {
                // Свайп влево - закрываем меню
                if (document.getElementById('sideMenu').classList.contains('open')) {
                    closeSideMenu();
                }
            }
            isSwiping = false;
        }
    });
    
    document.addEventListener('touchend', () => {
        isSwiping = false;
    });
}

// ===== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ =====
function saveToLocalStorage() {
    try {
        const data = {
            theme: AppState.isDarkTheme ? 'dark' : 'light',
            chats: AppState.chats,
            messages: AppState.messages,
            settings: AppState.settings
        };
        
        localStorage.setItem('telegramCallsPro', JSON.stringify(data));
    } catch (error) {
        console.error('Ошибка сохранения в LocalStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('telegramCallsPro');
        if (data) {
            const parsed = JSON.parse(data);
            
            AppState.isDarkTheme = parsed.theme === 'dark';
            if (parsed.chats) AppState.chats = parsed.chats;
            if (parsed.messages) AppState.messages = parsed.messages;
            if (parsed.settings) AppState.settings = parsed.settings;
        }
    } catch (error) {
        console.error('Ошибка загрузки из LocalStorage:', error);
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function playVoiceMessage(messageId) {
    showNotification('Воспроизведение голосового сообщения', 'info');
    // В реальном приложении здесь было бы воспроизведение аудио
}

function closeAllMenus() {
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('attachmentMenu').classList.remove('active');
    document.getElementById('groupCallMenu').classList.remove('active');
    document.getElementById('callMenu').classList.remove('active');
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
document.addEventListener('DOMContentLoaded', initApp);

// Обработка ввода сообщения
document.querySelector('.message-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Перетаскивание PIP видео
document.querySelector('.local-video-pip')?.addEventListener('mousedown', startDrag);
document.querySelector('.local-video-pip')?.addEventListener('touchstart', startDrag);

function startDrag(e) {
    const pip = e.currentTarget;
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
    } else {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
    
    initialX = pip.offsetLeft;
    initialY = pip.offsetTop;
    
    function onMove(moveEvent) {
        moveEvent.preventDefault();
        isDragging = true;
        
        let clientX, clientY;
        if (moveEvent.type === 'mousemove') {
            clientX = moveEvent.clientX;
            clientY = moveEvent.clientY;
        } else {
            clientX = moveEvent.touches[0].clientX;
            clientY = moveEvent.touches[0].clientY;
        }
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        pip.style.left = `${initialX + deltaX}px`;
        pip.style.top = `${initialY + deltaY}px`;
    }
    
    function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
        
        if (isDragging) {
            // Сохраняем позицию
            localStorage.setItem('pipPosition', JSON.stringify({
                left: pip.style.left,
                top: pip.style.top
            }));
        }
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

// Загружаем сохранённую позицию PIP
window.addEventListener('load', () => {
    const savedPosition = localStorage.getItem('pipPosition');
    if (savedPosition) {
        const { left, top } = JSON.parse(savedPosition);
        const pip = document.querySelector('.local-video-pip');
        if (pip) {
            pip.style.left = left;
            pip.style.top = top;
        }
    }
});

// ===== PWA УСТАНОВКА =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое отображение подсказки
    e.preventDefault();
    deferredPrompt = e;
    
    // Показываем кнопку установки
    showNotification('Установите приложение для лучшего опыта!', 'info');
});

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Пользователь установил приложение');
        }
        
        deferredPrompt = null;
    }
}

// ===== ОФФЛАЙН РЕЖИМ =====
window.addEventListener('online', () => {
    showNotification('Соединение восстановлено', 'success');
});

window.addEventListener('offline', () => {
    showNotification('Отсутствует подключение к интернету', 'warning');
});

// Экспортируем функции для использования в HTML
window.toggleTheme = toggleTheme;
window.showMainScreen = showMainScreen;
window.showContactsScreen = showContactsScreen;
window.showCallHistory = showCallHistory;
window.showSettingsScreen = showSettingsScreen;
window.openChat = openChat;
window.closeChat = closeChat;
window.toggleSideMenu = toggleSideMenu;
window.closeSideMenu = closeSideMenu;
window.showSearch = showSearch;
window.hideSearch = hideSearch;
window.sendMessage = sendMessage;
window.startNewCall = startNewCall;
window.closeNewCallModal = closeNewCallModal;
window.startCallFromModal = startCallFromModal;
window.startCall = startCall;
window.toggleMute = toggleMute;
window.toggleVideo = toggleVideo;
window.toggleSpeaker = toggleSpeaker;
window.endCall = endCall;
window.createGroupCall = createGroupCall;
window.endGroupCall = endGroupCall;
window.addParticipantToCall = addParticipantToCall;
window.toggleGroupCallMenu = toggleGroupCallMenu;
window.toggleEffects = toggleEffects;
window.closeEffectsModal = closeEffectsModal;
window.applyEffect = applyEffect;
window.toggleDrawingMode = toggleDrawingMode;
window.addNewContact = addNewContact;
window.importContacts = importContacts;
window.playVoiceMessage = playVoiceMessage;

console.log('📱 Telegram Calls Pro готов к работе!');

// ===== ИСПРАВЛЕНИЯ ДЛЯ КОНТАКТОВ =====
function showContactsScreen() {
    showScreen('contactsScreen');
    renderContactsList();
}

function renderContactsList() {
    const container = document.getElementById('contactsList');
    if (!container) return;
    
    // Проверяем, есть ли контакты в модуле
    const contacts = ContactsModule?.state?.contacts || [
        {
            id: 1,
            name: 'Алексей Иванов',
            phone: '+7 (999) 111-22-33',
            avatar: 'https://i.pravatar.cc/150?img=1',
            status: 'online',
            isFavorite: true
        },
        {
            id: 2,
            name: 'Мария Гарсия',
            phone: '+7 (999) 222-33-44',
            avatar: 'https://i.pravatar.cc/150?img=5',
            status: 'offline',
            isFavorite: true
        },
        {
            id: 3,
            name: 'Иван Петров',
            phone: '+7 (999) 333-44-55',
            avatar: 'https://i.pravatar.cc/150?img=8',
            status: 'online',
            isFavorite: false
        }
    ];
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-item" onclick="selectContact(${contact.id})">
            <div class="contact-avatar">
                <img src="${contact.avatar}" alt="${contact.name}">
                <span class="status-dot ${contact.status}"></span>
            </div>
            <div class="contact-info">
                <div class="contact-header">
                    <h3 class="contact-name">${contact.name}</h3>
                    ${contact.isFavorite ? '<i class="fas fa-star favorite-star"></i>' : ''}
                </div>
                <p class="contact-phone">${contact.phone}</p>
            </div>
            <div class="contact-actions">
                <button class="action-btn call" onclick="startCall('audio', ${contact.id}); event.stopPropagation()">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="action-btn video" onclick="startCall('video', ${contact.id}); event.stopPropagation()">
                    <i class="fas fa-video"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function selectContact(contactId) {
    // В реальном приложении здесь бы открытие чата
    showNotification('Функция откроется в следующем обновлении', 'info');
}

// ===== ИСПРАВЛЕНИЯ ДЛЯ ИСТОРИИ ЗВОНКОВ =====
function showCallHistory() {
    // Создаём временный экран истории
    const historyHTML = `
        <div id="historyScreen" class="screen active">
            <header class="header">
                <button class="back-btn" onclick="showMainScreen()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h1>История звонков</h1>
                <button class="icon-btn" onclick="clearCallHistory()" title="Очистить историю">
                    <i class="fas fa-trash"></i>
                </button>
            </header>
            
            <div class="call-history-container">
                ${renderCallHistoryItems()}
            </div>
        </div>
    `;
    
    // Добавляем на страницу
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = historyHTML;
    document.body.appendChild(tempDiv.firstElementChild);
    
    // Показываем экран
    showScreen('historyScreen');
}

function renderCallHistoryItems() {
    const calls = [
        {
            id: 1,
            name: 'Алексей Иванов',
            avatar: 'https://i.pravatar.cc/150?img=1',
            type: 'audio',
            duration: '5:24',
            time: 'Сегодня, 14:30',
            status: 'incoming',
            missed: false
        },
        {
            id: 2,
            name: 'Мария Гарсия',
            avatar: 'https://i.pravatar.cc/150?img=5',
            type: 'video',
            duration: 'Пропущен',
            time: 'Вчера, 18:15',
            status: 'incoming',
            missed: true
        },
        {
            id: 3,
            name: 'Иван Петров',
            avatar: 'https://i.pravatar.cc/150?img=8',
            type: 'audio',
            duration: '12:45',
            time: '12 ноя',
            status: 'outgoing',
            missed: false
        }
    ];
    
    return calls.map(call => `
        <div class="call-history-item ${call.missed ? 'missed' : ''}">
            <div class="call-avatar">
                <img src="${call.avatar}" alt="${call.name}">
                <div class="call-type-icon">
                    <i class="fas fa-${call.type === 'video' ? 'video' : 'phone'}"></i>
                </div>
            </div>
            <div class="call-info">
                <div class="call-header">
                    <h3>${call.name}</h3>
                    <span class="call-time">${call.time}</span>
                </div>
                <div class="call-details">
                    <span class="call-type">${call.type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}</span>
                    <span class="call-duration">${call.duration}</span>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-back-btn" onclick="startCall('${call.type}', ${call.id})">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function clearCallHistory() {
    if (confirm('Очистить всю историю звонков?')) {
        showNotification('История звонков очищена', 'success');
        // В реальном приложении здесь бы очистка из хранилища
    }
}

// ===== ИСПРАВЛЕНИЕ ТЕМЫ =====
function toggleTheme() {
    AppState.isDarkTheme = !AppState.isDarkTheme;
    const theme = AppState.isDarkTheme ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').checked = AppState.isDarkTheme;
    
    localStorage.setItem('theme', theme);
    showNotification(`Тема изменена на ${AppState.isDarkTheme ? 'тёмную' : 'светлую'}`, 'info');
}

// Инициализация темы при загрузке
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    AppState.isDarkTheme = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    
    document.body.setAttribute('data-theme', AppState.isDarkTheme ? 'dark' : 'light');
    
    // Обновляем переключатель в настройках
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = AppState.isDarkTheme;
        themeToggle.onchange = toggleTheme;
    }
}

// Вызываем initTheme при загрузке
document.addEventListener('DOMContentLoaded', initTheme);

// ===== ИСПРАВЛЕНИЯ ДЛЯ БОКОВОГО МЕНЮ =====
document.addEventListener('click', (e) => {
    // Закрытие бокового меню при клике вне его
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu && sideMenu.classList.contains('open') && 
        !e.target.closest('.side-menu') && 
        !e.target.closest('.menu-btn')) {
        sideMenu.classList.remove('open');
    }
});

// ===== БЫСТРЫЕ ИСПРАВЛЕНИЯ ДЛЯ ОТСУТСТВУЮЩИХ ФУНКЦИЙ =====
window.showPremiumScreen = () => showNotification('Premium скоро будет доступен!', 'info');
window.showChatMenu = () => showNotification('Меню чата', 'info');
window.toggleAttachmentMenu = () => showNotification('Вложения', 'info');
window.startVoiceMessage = () => showNotification('Голосовое сообщение', 'info');
window.showContactInfo = () => showNotification('Информация о контакте', 'info');

// Функции для вложений (заглушки)
window.attachPhoto = () => showNotification('Прикрепление фото', 'info');
window.attachVideo = () => showNotification('Прикрепление видео', 'info');
window.attachDocument = () => showNotification('Прикрепление документа', 'info');
window.attachLocation = () => showNotification('Прикрепление местоположения', 'info');
window.attachContact = () => showNotification('Прикрепление контакта', 'info');
window.attachSticker = () => showNotification('Прикрепление стикера', 'info');

// Функции для звонков (заглушки)
window.toggleScreenShare = () => showNotification('Демонстрация экрана', 'info');
window.toggleGroupMute = () => showNotification('Микрофон группы', 'info');
window.toggleGroupVideo = () => showNotification('Камера группы', 'info');
window.showParticipantsList = () => showNotification('Список участников', 'info');
window.recordGroupCall = () => showNotification('Запись звонка', 'info');
window.toggleSubitles = () => showNotification('Субтитры', 'info');

// Настройки
window.editProfile = () => showNotification('Редактирование профиля', 'info');
window.contactSupport = () => showNotification('Поддержка', 'info');

// Логин/логаут
window.logout = () => {
    if (confirm('Выйти из аккаунта?')) {
        showNotification('Вы вышли из аккаунта', 'info');
        // В реальном приложении здесь бы редирект на логин
    }
};

// ===== ИСПРАВЛЕНИЕ ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ =====
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    
    // Останавливаем все активные звуки
    stopAllSounds();
}

// ===== ДОБАВЛЯЕМ ОТСУТСТВУЮЩИЕ CSS КЛАССЫ ЧЕРЕЗ JS =====
function addMissingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Стили для контактов */
        .contact-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 16px;
            margin-bottom: 8px;
            background: var(--bg-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .contact-item:hover {
            background: var(--bg-tertiary);
        }
        
        .contact-avatar {
            position: relative;
            margin-right: 12px;
        }
        
        .contact-avatar img {
            width: 50px;
            height: 50px;
            border-radius: 25px;
            object-fit: cover;
        }
        
        .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 6px;
            border: 2px solid var(--bg-secondary);
        }
        
        .status-dot.online {
            background: #4CAF50;
        }
        
        .status-dot.offline {
            background: #999;
        }
        
        .favorite-star {
            color: #FFD700;
            margin-left: 8px;
        }
        
        .contact-phone {
            font-size: 14px;
            color: var(--text-secondary);
            margin-top: 4px;
        }
        
        /* Стили для истории звонков */
        .call-history-container {
            padding: 16px;
        }
        
        .call-history-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: 12px;
            margin-bottom: 8px;
        }
        
        .call-history-item.missed {
            border-left: 4px solid #ff3b30;
        }
        
        .call-type-icon {
            position: absolute;
            bottom: -2px;
            right: -2px;
            background: var(--accent-primary);
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
        }
        
        .call-time {
            font-size: 12px;
            color: var(--text-tertiary);
        }
        
        .call-type {
            font-size: 14px;
            color: var(--text-secondary);
        }
        
        .call-duration {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 500;
        }
        
        .call-back-btn {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            border: none;
            background: rgba(0, 136, 204, 0.1);
            color: var(--accent-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        
        /* Исправления для кнопок */
        .action-btn {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin-left: 8px;
            transition: all 0.2s ease;
        }
        
        .action-btn.call {
            background: rgba(0, 136, 204, 0.1);
            color: var(--accent-primary);
        }
        
        .action-btn.video {
            background: rgba(0, 201, 183, 0.1);
            color: var(--accent-secondary);
        }
        
        .action-btn:hover {
            transform: scale(1.1);
        }
        
        /* Стили для свайп-подсказки */
        .swipe-hint {
            position: absolute;
            bottom: 120px;
            left: 0;
            right: 0;
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        
        /* Стили для переключателя темы */
        .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-tertiary);
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--accent-primary);
        }
        
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    `;
    
    document.head.appendChild(style);
}

// Добавляем недостающие стили при загрузке
document.addEventListener('DOMContentLoaded', addMissingStyles);

// ===== ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ =====
window.addEventListener('DOMContentLoaded', () => {
    // Инициализируем тему
    initTheme();
    
    // Инициализируем приложение
    initApp();
    
    // Добавляем недостающие стили
    addMissingStyles();
    
    console.log('✅ Приложение инициализировано с исправлениями');
});
