// Модуль для работы с чатами
const ChatModule = {
    // Инициализация чатов
    init() {
        console.log('💬 Инициализация модуля чатов');
        this.loadChatsFromStorage();
    },
    
    // Загрузка чатов из хранилища
    loadChatsFromStorage() {
        const saved = localStorage.getItem('telegram-chats');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                AppState.chats = data.chats || [];
                AppState.messages = data.messages || {};
            } catch (error) {
                console.error('Ошибка загрузки чатов:', error);
            }
        }
    },
    
    // Сохранение чатов в хранилище
    saveChatsToStorage() {
        const data = {
            chats: AppState.chats,
            messages: AppState.messages
        };
        localStorage.setItem('telegram-chats', JSON.stringify(data));
    },
    
    // Создание нового чата
    createChat(contactId, type = 'private') {
        const chat = {
            id: Date.now(),
            type: type,
            contactId: contactId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            unread: 0,
            isArchived: false,
            isPinned: false
        };
        
        AppState.chats.push(chat);
        this.saveChatsToStorage();
        return chat;
    },
    
    // Отправка сообщения
    async sendMessage(chatId, content, type = 'text') {
        const message = {
            id: Date.now(),
            chatId: chatId,
            senderId: AppState.currentUser.id,
            type: type,
            content: content,
            timestamp: Date.now(),
            status: 'sending'
        };
        
        // Добавляем в локальное хранилище
        if (!AppState.messages[chatId]) {
            AppState.messages[chatId] = [];
        }
        AppState.messages[chatId].push(message);
        
        // Обновляем UI
        this.updateChatUI(chatId, message);
        
        // Сохраняем
        this.saveChatsToStorage();
        
        // Имитируем отправку на сервер
        setTimeout(() => {
            this.updateMessageStatus(chatId, message.id, 'sent');
            
            // Имитируем получение ответа
            if (type === 'text') {
                setTimeout(() => {
                    this.receiveMessage(chatId, {
                        type: 'text',
                        content: this.generateAutoReply(content),
                        senderId: chatId // ID собеседника
                    });
                }, 1000 + Math.random() * 2000);
            }
        }, 500);
        
        return message;
    },
    
    // Получение сообщения
    receiveMessage(chatId, messageData) {
        const message = {
            id: Date.now(),
            chatId: chatId,
            senderId: messageData.senderId,
            type: messageData.type,
            content: messageData.content,
            timestamp: Date.now(),
            status: 'received'
        };
        
        if (!AppState.messages[chatId]) {
            AppState.messages[chatId] = [];
        }
        AppState.messages[chatId].push(message);
        
        // Обновляем UI
        this.updateChatUI(chatId, message);
        
        // Показываем уведомление
        if (AppState.currentChatId !== chatId) {
            this.showMessageNotification(chatId, message);
        }
        
        this.saveChatsToStorage();
    },
    
    // Обновление UI чата
    updateChatUI(chatId, message) {
        // Здесь будет обновление интерфейса
        // В реальном приложении здесь бы использовался Virtual DOM
    },
    
    // Генерация автоматического ответа
    generateAutoReply(message) {
        const replies = {
            greeting: ['Привет!', 'Здравствуйте!', 'Добрый день!'],
            question: ['Хороший вопрос!', 'Давайте подумаем...', 'Интересно...'],
            default: ['Понял вас', 'Согласен', 'Интересно']
        };
        
        const text = message.toLowerCase();
        
        if (text.includes('привет') || text.includes('здравствуй')) {
            return replies.greeting[Math.floor(Math.random() * replies.greeting.length)];
        }
        
        if (text.includes('?')) {
            return replies.question[Math.floor(Math.random() * replies.question.length)];
        }
        
        return replies.default[Math.floor(Math.random() * replies.default.length)];
    },
    
    // Показ уведомления о сообщении
    showMessageNotification(chatId, message) {
        const chat = AppState.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        let title = chat.name || 'Новое сообщение';
        let body = '';
        
        switch (message.type) {
            case 'text':
                body = message.content;
                break;
            case 'image':
                body = '📷 Фото';
                break;
            case 'voice':
                body = '🎤 Голосовое сообщение';
                break;
            case 'call':
                body = '📞 Пропущенный звонок';
                break;
            default:
                body = 'Новое сообщение';
        }
        
        showNotification(`${title}: ${body}`, 'message');
    },
    
    // Обновление статуса сообщения
    updateMessageStatus(chatId, messageId, status) {
        const chatMessages = AppState.messages[chatId];
        if (!chatMessages) return;
        
        const message = chatMessages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
            this.saveChatsToStorage();
        }
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    ChatModule.init();
});
