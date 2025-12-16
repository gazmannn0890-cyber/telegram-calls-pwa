// Модуль для работы с WebRTC
const WebRTCModule = {
    // Настройки WebRTC
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        sdpSemantics: 'unified-plan'
    },
    
    // Состояние
    state: {
        peerConnection: null,
        localStream: null,
        remoteStream: null,
        dataChannel: null,
        isCaller: false,
        isConnected: false,
        iceCandidates: []
    },
    
    // Инициализация
    async init() {
        console.log('🌐 Инициализация WebRTC модуля');
        
        try {
            // Проверяем поддержку WebRTC
            if (!this.isSupported()) {
                throw new Error('WebRTC не поддерживается в этом браузере');
            }
            
            // Запрашиваем разрешения
            await this.requestPermissions();
            
            console.log('✅ WebRTC модуль готов к работе');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации WebRTC:', error);
            showNotification('WebRTC не поддерживается', 'error');
            return false;
        }
    },
    
    // Проверка поддержки WebRTC
    isSupported() {
        return !!(navigator.mediaDevices &&
                 navigator.mediaDevices.getUserMedia &&
                 window.RTCPeerConnection &&
                 window.RTCSessionDescription);
    },
    
    // Запрос разрешений
    async requestPermissions() {
        try {
            // Запрашиваем доступ к камере и микрофону
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                }
            });
            
            this.state.localStream = stream;
            console.log('✅ Разрешения получены');
            
        } catch (error) {
            console.error('❌ Ошибка получения разрешений:', error);
            throw error;
        }
    },
    
    // Создание PeerConnection
    createPeerConnection(isCaller = false) {
        try {
            this.state.isCaller = isCaller;
            
            // Создаём PeerConnection
            this.state.peerConnection = new RTCPeerConnection(this.config);
            
            // Добавляем локальный поток
            if (this.state.localStream) {
                this.addLocalStream();
            }
            
            // Настройка обработчиков событий
            this.setupEventHandlers();
            
            // Создаём DataChannel для обмена данными
            if (isCaller) {
                this.createDataChannel();
            } else {
                this.setupDataChannelHandler();
            }
            
            console.log('✅ PeerConnection создан');
            return this.state.peerConnection;
            
        } catch (error) {
            console.error('❌ Ошибка создания PeerConnection:', error);
            throw error;
        }
    },
    
    // Добавление локального потока
    addLocalStream() {
        if (!this.state.localStream || !this.state.peerConnection) return;
        
        this.state.localStream.getTracks().forEach(track => {
            this.state.peerConnection.addTrack(track, this.state.localStream);
        });
        
        console.log('✅ Локальный поток добавлен');
    },
    
    // Настройка обработчиков событий
    setupEventHandlers() {
        const pc = this.state.peerConnection;
        
        // ICE кандидаты
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.state.iceCandidates.push(event.candidate);
                console.log('❄️ Новый ICE кандидат');
                
                // В реальном приложении здесь бы отправка кандидата сигнальным сервером
                this.sendIceCandidate(event.candidate);
            }
        };
        
        // Получение удалённого потока
        pc.ontrack = (event) => {
            console.log('🎬 Получен удалённый поток');
            this.state.remoteStream = event.streams[0];
            this.playRemoteStream();
        };
        
        // Изменение состояния соединения
        pc.onconnectionstatechange = () => {
            console.log(`📡 Состояние соединения: ${pc.connectionState}`);
            
            switch (pc.connectionState) {
                case 'connected':
                    this.state.isConnected = true;
                    showNotification('Соединение установлено', 'success');
                    break;
                case 'disconnected':
                case 'failed':
                    this.state.isConnected = false;
                    showNotification('Соединение потеряно', 'error');
                    break;
                case 'closed':
                    this.state.isConnected = false;
                    this.cleanup();
                    break;
            }
        };
        
        // Изменение ICE состояния
        pc.oniceconnectionstatechange = () => {
            console.log(`🧊 ICE состояние: ${pc.iceConnectionState}`);
        };
        
        // Изменение ICE состояния выбора
        pc.onicegatheringstatechange = () => {
            console.log(`🧊 ICE сборка: ${pc.iceGatheringState}`);
        };
        
        // Обработка переговоров
        pc.onnegotiationneeded = async () => {
            console.log('🔄 Требуется переподключение');
            await this.handleNegotiation();
        };
    },
    
    // Создание DataChannel
    createDataChannel() {
        try {
            this.state.dataChannel = this.state.peerConnection.createDataChannel('telegram-calls', {
                ordered: true,
                maxPacketLifeTime: 3000,
                protocol: 'json'
            });
            
            this.setupDataChannelEvents();
            console.log('📡 DataChannel создан');
            
        } catch (error) {
            console.error('❌ Ошибка создания DataChannel:', error);
        }
    },
    
    // Настройка обработчика DataChannel
    setupDataChannelHandler() {
        this.state.peerConnection.ondatachannel = (event) => {
            this.state.dataChannel = event.channel;
            this.setupDataChannelEvents();
            console.log('📡 DataChannel получен');
        };
    },
    
    // Настройка событий DataChannel
    setupDataChannelEvents() {
        const dc = this.state.dataChannel;
        
        dc.onopen = () => {
            console.log('✅ DataChannel открыт');
            showNotification('Канал данных открыт', 'info');
        };
        
        dc.onclose = () => {
            console.log('❌ DataChannel закрыт');
        };
        
        dc.onerror = (error) => {
            console.error('❌ Ошибка DataChannel:', error);
        };
        
        dc.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleDataChannelMessage(data);
            } catch (error) {
                console.error('❌ Ошибка парсинга сообщения:', error);
            }
        };
    },
    
    // Обработка сообщений DataChannel
    handleDataChannelMessage(data) {
        console.log('📨 Получено сообщение:', data);
        
        switch (data.type) {
            case 'text':
                showNotification(`Сообщение: ${data.text}`, 'info');
                break;
                
            case 'file':
                this.handleFileTransfer(data);
                break;
                
            case 'drawing':
                DrawingModule.handleRemoteDrawing(data);
                break;
                
            case 'control':
                this.handleControlMessage(data);
                break;
        }
    },
    
    // Отправка сообщения через DataChannel
    sendDataChannelMessage(type, payload) {
        if (!this.state.dataChannel || this.state.dataChannel.readyState !== 'open') {
            console.warn('DataChannel не готов');
            return false;
        }
        
        try {
            const message = {
                type: type,
                timestamp: Date.now(),
                sender: AppState.currentUser.id,
                ...payload
            };
            
            this.state.dataChannel.send(JSON.stringify(message));
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка отправки сообщения:', error);
            return false;
        }
    },
    
    // Создание оффера (для звонящего)
    async createOffer() {
        try {
            const pc = this.state.peerConnection;
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await pc.setLocalDescription(offer);
            
            console.log('📤 Оффер создан');
            return offer;
            
        } catch (error) {
            console.error('❌ Ошибка создания оффера:', error);
            throw error;
        }
    },
    
    // Создание ответа (для принимающего)
    async createAnswer(offer) {
        try {
            const pc = this.state.peerConnection;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            console.log('📥 Ответ создан');
            return answer;
            
        } catch (error) {
            console.error('❌ Ошибка создания ответа:', error);
            throw error;
        }
    },
    
    // Установка удалённого описания
    async setRemoteDescription(description) {
        try {
            await this.state.peerConnection.setRemoteDescription(
                new RTCSessionDescription(description)
            );
            
            console.log('✅ Удалённое описание установлено');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка установки удалённого описания:', error);
            throw error;
        }
    },
    
    // Добавление ICE кандидата
    async addIceCandidate(candidate) {
        try {
            await this.state.peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
            
            console.log('✅ ICE кандидат добавлен');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка добавления ICE кандидата:', error);
            return false;
        }
    },
    
    // Воспроизведение удалённого потока
    playRemoteStream() {
        if (!this.state.remoteStream) return;
        
        // Ищем элемент видео для удалённого потока
        const remoteVideo = document.getElementById('remoteVideo') || 
                           document.querySelector('.remote-video');
        
        if (remoteVideo && remoteVideo.tagName === 'VIDEO') {
            remoteVideo.srcObject = this.state.remoteStream;
            remoteVideo.play().catch(e => console.warn('Не удалось воспроизвести видео:', e));
        }
        
        // Также можно отобразить в групповом звонке
        this.updateGroupCallUI();
    },
    
    // Обновление UI группового звонка
    updateGroupCallUI() {
        // В реальном приложении здесь бы обновление сетки участников
    },
    
    // Обработка переподключения
    async handleNegotiation() {
        try {
            if (this.state.isCaller) {
                const offer = await this.createOffer();
                // Отправляем оффер через сигнальный сервер
                this.sendOffer(offer);
            }
        } catch (error) {
            console.error('❌ Ошибка переподключения:', error);
        }
    },
    
    // Отправка оффера (имитация)
    sendOffer(offer) {
        console.log('📤 Отправка оффера:', offer.type);
        // В реальном приложении здесь бы WebSocket
    },
    
    // Отправка ICE кандидата (имитация)
    sendIceCandidate(candidate) {
        console.log('❄️ Отправка ICE кандидата');
        // В реальном приложении здесь бы WebSocket
    },
    
    // Переключение камеры
    async switchCamera() {
        try {
            // Получаем все доступные камеры
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length < 2) {
                showNotification('Доступна только одна камера', 'warning');
                return false;
            }
            
            // Находим текущую камеру
            const currentTrack = this.state.localStream.getVideoTracks()[0];
            const currentDeviceId = currentTrack.getSettings().deviceId;
            
            // Выбираем следующую камеру
            const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId) ||
                              videoDevices[0];
            
            // Создаём новый поток
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: nextDevice.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            // Заменяем видеотрек
            const newVideoTrack = newStream.getVideoTracks()[0];
            const sender = this.state.peerConnection.getSenders()
                .find(s => s.track && s.track.kind === 'video');
            
            if (sender) {
                sender.replaceTrack(newVideoTrack);
            }
            
            // Обновляем локальный поток
            currentTrack.stop();
            this.state.localStream.removeTrack(currentTrack);
            this.state.localStream.addTrack(newVideoTrack);
            
            // Обновляем PIP видео
            this.updateLocalVideo();
            
            showNotification('Камера переключена', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка переключения камеры:', error);
            showNotification('Не удалось переключить камеру', 'error');
            return false;
        }
    },
    
    // Включение/выключение микрофона
    toggleMicrophone() {
        if (!this.state.localStream) return;
        
        const audioTrack = this.state.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            AppState.isMuted = !audioTrack.enabled;
            
            // Отправляем состояние через DataChannel
            this.sendDataChannelMessage('control', {
                action: 'mute',
                muted: !audioTrack.enabled
            });
            
            return !audioTrack.enabled;
        }
        
        return AppState.isMuted;
    },
    
    // Включение/выключение камеры
    toggleCamera() {
        if (!this.state.localStream) return;
        
        const videoTrack = this.state.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            AppState.isVideoOn = videoTrack.enabled;
            
            // Отправляем состояние через DataChannel
            this.sendDataChannelMessage('control', {
                action: 'video',
                enabled: videoTrack.enabled
            });
            
            // Обновляем PIP
            if (videoTrack.enabled) {
                this.updateLocalVideo();
            }
            
            return videoTrack.enabled;
        }
        
        return AppState.isVideoOn;
    },
    
    // Обновление локального видео
    updateLocalVideo() {
        const pipVideo = document.querySelector('.pip-video');
        if (pipVideo && this.state.localStream) {
            // Удаляем старый элемент видео
            pipVideo.innerHTML = '';
            
            // Создаём новый элемент видео
            const video = document.createElement('video');
            video.srcObject = this.state.localStream;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            
            pipVideo.appendChild(video);
        }
    },
    
    // Запись звонка
    startRecording() {
        if (!this.state.remoteStream && !this.state.localStream) {
            showNotification('Нет потоков для записи', 'warning');
            return false;
        }
        
        try {
            // Создаём MediaRecorder для объединённого потока
            const combinedStream = new MediaStream();
            
            // Добавляем аудио из локального потока
            if (this.state.localStream) {
                const audioTrack = this.state.localStream.getAudioTracks()[0];
                if (audioTrack) combinedStream.addTrack(audioTrack.clone());
            }
            
            // Добавляем видео из удалённого потока
            if (this.state.remoteStream) {
                const videoTrack = this.state.remoteStream.getVideoTracks()[0];
                if (videoTrack) combinedStream.addTrack(videoTrack.clone());
            }
            
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000
            });
            
            const chunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                this.saveRecording(blob);
            };
            
            this.mediaRecorder.start(1000); // Собираем данные каждую секунду
            AppState.isRecording = true;
            
            showNotification('Запись звонка начата', 'info');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка начала записи:', error);
            showNotification('Не удалось начать запись', 'error');
            return false;
        }
    },
    
    // Остановка записи
    stopRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            return false;
        }
        
        this.mediaRecorder.stop();
        AppState.isRecording = false;
        
        showNotification('Запись звонка остановлена', 'info');
        return true;
    },
    
    // Сохранение записи
    saveRecording(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `telegram-call-${new Date().toISOString()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('Запись сохранена', 'success');
    },
    
    // Обработка управляющих сообщений
    handleControlMessage(data) {
        switch (data.action) {
            case 'mute':
                // Обновляем UI для удалённого пользователя
                console.log(`Удалённый пользователь ${data.muted ? 'выключил' : 'включил'} микрофон`);
                break;
                
            case 'video':
                console.log(`Удалённый пользователь ${data.enabled ? 'включил' : 'выключил'} камеру`);
                break;
        }
    },
    
    // Обработка передачи файлов
    handleFileTransfer(data) {
        // В реальном приложении здесь бы обработка файлов
        showNotification(`Получен файл: ${data.name}`, 'info');
    },
    
    // Очистка ресурсов
    cleanup() {
        if (this.state.peerConnection) {
            this.state.peerConnection.close();
            this.state.peerConnection = null;
        }
        
        if (this.state.localStream) {
            this.state.localStream.getTracks().forEach(track => track.stop());
            this.state.localStream = null;
        }
        
        if (this.state.remoteStream) {
            this.state.remoteStream.getTracks().forEach(track => track.stop());
            this.state.remoteStream = null;
        }
        
        this.state.dataChannel = null;
        this.state.isConnected = false;
        this.state.iceCandidates = [];
        
        console.log('🧹 WebRTC ресурсы очищены');
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    const initialized = await WebRTCModule.init();
    if (initialized) {
        console.log('🌐 WebRTC модуль готов к работе');
    }
});

// Экспорт
window.WebRTCModule = WebRTCModule;
