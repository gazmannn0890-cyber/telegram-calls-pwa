// Модуль для работы со звонками
const CallsModule = {
    // Инициализация
    init() {
        console.log('📞 Инициализация модуля звонков');
        this.initAudioContext();
        this.loadCallHistory();
    },
    
    // Инициализация аудиоконтекста
    initAudioContext() {
        if (!window.AudioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Аудиоконтекст инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации аудиоконтекста:', error);
        }
    },
    
    // Загрузка истории звонков
    loadCallHistory() {
        const saved = localStorage.getItem('telegram-call-history');
        if (saved) {
            try {
                AppState.callHistory = JSON.parse(saved);
            } catch (error) {
                console.error('Ошибка загрузки истории звонков:', error);
            }
        }
    },
    
    // Сохранение истории звонков
    saveCallHistory() {
        localStorage.setItem('telegram-call-history', JSON.stringify(AppState.callHistory));
    },
    
    // Начало звонка
    async startCall(contactId, type = 'audio') {
        const contact = this.getContactById(contactId);
        if (!contact) {
            showNotification('Контакт не найден', 'error');
            return;
        }
        
        // Обновляем состояние
        AppState.isInCall = true;
        AppState.callType = type;
        AppState.currentContact = contact;
        AppState.callStartTime = Date.now();
        
        // Добавляем в историю
        this.addToCallHistory({
            contactId: contact.id,
            type: type,
            direction: 'outgoing',
            startTime: AppState.callStartTime,
            status: 'calling'
        });
        
        // Показываем экран звонка
        showScreen('callScreen');
        
        // Обновляем UI
        this.updateCallUI();
        
        // Запускаем таймер ожидания
        this.startCallTimer();
        
        // Имитируем процесс соединения
        await this.simulateCallConnection();
        
        return true;
    },
    
    // Принятие входящего звонка
    acceptIncomingCall(callData) {
        AppState.isInCall = true;
        AppState.callType = callData.type;
        AppState.currentContact = this.getContactById(callData.contactId);
        AppState.callStartTime = Date.now();
        
        // Обновляем историю
        this.updateCallHistory(callData.id, {
            status: 'accepted',
            startTime: AppState.callStartTime
        });
        
        // Показываем экран звонка
        showScreen('callScreen');
        
        // Обновляем UI
        this.updateCallUI();
        
        // Запускаем таймер звонка
        this.startCallTimer();
        
        // Инициализируем медиа
        if (callData.type === 'video') {
            initLocalVideo();
        }
    },
    
    // Отклонение звонка
    declineIncomingCall(callData) {
        this.updateCallHistory(callData.id, {
            status: 'declined',
            endTime: Date.now()
        });
        
        showNotification('Вы отклонили звонок', 'info');
    },
    
    // Завершение звонка
    endCall() {
        if (!AppState.isInCall) return;
        
        const duration = Math.floor((Date.now() - AppState.callStartTime) / 1000);
        
        // Обновляем историю
        this.updateLastCallHistory({
            status: 'ended',
            endTime: Date.now(),
            duration: duration
        });
        
        // Сбрасываем состояние
        AppState.isInCall = false;
        AppState.isGroupCall = false;
        AppState.currentContact = null;
        
        // Останавливаем таймер
        if (AppState.callTimer) {
            clearInterval(AppState.callTimer);
            AppState.callTimer = null;
        }
        
        // Останавливаем медиа
        this.stopMediaStreams();
        
        // Возвращаемся на главный экран
        showMainScreen();
        
        // Показываем статистику
        showNotification(`Звонок завершён. Длительность: ${formatDuration(duration)}`, 'info');
    },
    
    // Имитация процесса соединения
    async simulateCallConnection() {
        return new Promise((resolve) => {
            // Показываем статус "Звоним..."
            document.getElementById('callStatusText').textContent = 'Звоним...';
            
            // Воспроизводим гудки
            this.playRingtone();
            
            // Имитируем ожидание ответа (3-8 секунд)
            const waitTime = 3000 + Math.random() * 5000;
            
            setTimeout(() => {
                // Останавливаем гудки
                this.stopRingtone();
                
                // 80% шанс, что звонок будет принят
                if (Math.random() > 0.2) {
                    // Звонок принят
                    document.getElementById('callStatusText').textContent = '00:00';
                    this.startCallDurationTimer();
                    
                    // Инициализируем видео, если это видеозвонок
                    if (AppState.callType === 'video') {
                        initLocalVideo();
                    }
                    
                    resolve(true);
                } else {
                    // Звонок отклонён
                    document.getElementById('callStatusText').textContent = 'Не отвечает';
                    
                    setTimeout(() => {
                        this.endCall();
                        showNotification('Абонент не отвечает', 'warning');
                    }, 2000);
                    
                    resolve(false);
                }
            }, waitTime);
        });
    },
    
    // Воспроизведение гудков
    playRingtone() {
        const ringtone = document.getElementById('ringtoneAudio');
        if (ringtone) {
            ringtone.currentTime = 0;
            ringtone.play().catch(e => console.warn('Не удалось воспроизвести гудки:', e));
        }
    },
    
    // Остановка гудков
    stopRingtone() {
        const ringtone = document.getElementById('ringtoneAudio');
        if (ringtone) {
            ringtone.pause();
            ringtone.currentTime = 0;
        }
    },
    
    // Запуск таймера ожидания
    startCallTimer() {
        let seconds = 0;
        
        AppState.callTimer = setInterval(() => {
            seconds++;
            const text = `Звоним... ${seconds}с`;
            document.getElementById('callStatusText').textContent = text;
            
            // Автоматическое завершение через 30 секунд
            if (seconds >= 30) {
                this.endCall();
                showNotification('Абонент не отвечает', 'warning');
            }
        }, 1000);
    },
    
    // Запуск таймера длительности звонка
    startCallDurationTimer() {
        let seconds = 0;
        
        if (AppState.callTimer) {
            clearInterval(AppState.callTimer);
        }
        
        AppState.callTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            
            document.getElementById('callStatusText').textContent = 
                `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                
            AppState.callDuration = seconds;
        }, 1000);
    },
    
    // Обновление UI звонка
    updateCallUI() {
        if (!AppState.currentContact) return;
        
        // Обновляем информацию о контакте
        document.getElementById('callContactName').textContent = AppState.currentContact.name;
        
        // Обновляем аватар
        const avatar = document.querySelector('.call-avatar');
        if (avatar && AppState.currentContact.avatar) {
            avatar.src = AppState.currentContact.avatar;
        }
        
        // Обновляем кнопки управления
        this.updateCallControls();
    },
    
    // Обновление кнопок управления
    updateCallControls() {
        const muteBtn = document.querySelector('.control-btn:nth-child(1) i');
        const videoBtn = document.querySelector('.control-btn:nth-child(2) i');
        const speakerBtn = document.querySelector('.control-btn:nth-child(3) i');
        
        if (muteBtn) {
            muteBtn.className = AppState.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            muteBtn.closest('.control-btn').classList.toggle('active', AppState.isMuted);
        }
        
        if (videoBtn) {
            videoBtn.className = AppState.isVideoOn ? 'fas fa-video' : 'fas fa-video-slash';
            videoBtn.closest('.control-btn').classList.toggle('active', AppState.isVideoOn);
            
            // Показываем/скрываем PIP
            const pip = document.getElementById('localVideo');
            if (pip) {
                pip.classList.toggle('hidden', !AppState.isVideoOn);
            }
        }
        
        if (speakerBtn) {
            speakerBtn.className = AppState.isSpeakerOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            speakerBtn.closest('.control-btn').classList.toggle('active', AppState.isSpeakerOn);
        }
    },
    
    // Остановка медиапотоков
    stopMediaStreams() {
        if (AppState.localStream) {
            AppState.localStream.getTracks().forEach(track => track.stop());
            AppState.localStream = null;
        }
        
        if (AppState.remoteStream) {
            AppState.remoteStream.getTracks().forEach(track => track.stop());
            AppState.remoteStream = null;
        }
    },
    
    // Получение контакта по ID
    getContactById(contactId) {
        // В реальном приложении здесь бы был поиск в базе данных
        return {
            id: contactId,
            name: `Контакт ${contactId}`,
            avatar: `https://i.pravatar.cc/150?img=${contactId}`,
            phone: '+7 (999) 123-45-67'
        };
    },
    
    // Добавление в историю звонков
    addToCallHistory(callData) {
        const call = {
            id: Date.now(),
            ...callData,
            createdAt: Date.now()
        };
        
        if (!AppState.callHistory) {
            AppState.callHistory = [];
        }
        
        AppState.callHistory.unshift(call);
        
        // Сохраняем
        this.saveCallHistory();
        
        return call;
    },
    
    // Обновление истории звонков
    updateCallHistory(callId, updates) {
        if (!AppState.callHistory) return;
        
        const call = AppState.callHistory.find(c => c.id === callId);
        if (call) {
            Object.assign(call, updates);
            this.saveCallHistory();
        }
    },
    
    // Обновление последнего звонка в истории
    updateLastCallHistory(updates) {
        if (!AppState.callHistory || AppState.callHistory.length === 0) return;
        
        const lastCall = AppState.callHistory[0];
        Object.assign(lastCall, updates);
        this.saveCallHistory();
    },
    
    // Переключение микрофона
    toggleMute() {
        AppState.isMuted = !AppState.isMuted;
        
        // В реальном приложении здесь бы было управление аудиотреком
        if (AppState.localStream) {
            AppState.localStream.getAudioTracks().forEach(track => {
                track.enabled = !AppState.isMuted;
            });
        }
        
        this.updateCallControls();
        showNotification(AppState.isMuted ? 'Микрофон выключен' : 'Микрофон включен', 'info');
    },
    
    // Переключение камеры
    toggleVideo() {
        if (AppState.callType !== 'video') return;
        
        AppState.isVideoOn = !AppState.isVideoOn;
        
        // В реальном приложении здесь бы было управление видеотреком
        if (AppState.localStream) {
            AppState.localStream.getVideoTracks().forEach(track => {
                track.enabled = AppState.isVideoOn;
            });
        }
        
        this.updateCallControls();
        showNotification(AppState.isVideoOn ? 'Камера включена' : 'Камера выключена', 'info');
    },
    
    // Переключение динамика
    toggleSpeaker() {
        AppState.isSpeakerOn = !AppState.isSpeakerOn;
        
        // В реальном приложении здесь бы было управление аудиовыходом
        this.updateCallControls();
        showNotification(AppState.isSpeakerOn ? 'Динамик включён' : 'Динамик выключен', 'info');
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    CallsModule.init();
});

// Экспорт функций
window.CallsModule = CallsModule;
