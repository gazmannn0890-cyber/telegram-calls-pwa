// Модуль для работы с хранилищем
const StorageModule = {
    // Конфигурация
    config: {
        dbName: 'TelegramCallsDB',
        dbVersion: 3,
        stores: {
            chats: 'chats',
            messages: 'messages',
            contacts: 'contacts',
            groups: 'groups',
            calls: 'calls',
            settings: 'settings',
            media: 'media'
        }
    },
    
    // Состояние
    state: {
        db: null,
        isInitialized: false,
        offlineQueue: []
    },
    
    // Инициализация
    async init() {
        console.log('💾 Инициализация модуля хранилища');
        
        try {
            // Проверяем поддержку IndexedDB
            if (!window.indexedDB) {
                throw new Error('IndexedDB не поддерживается');
            }
            
            // Открываем базу данных
            await this.openDatabase();
            
            // Загружаем данные в память
            await this.loadToMemory();
            
            // Инициализируем синхронизацию
            this.initSync();
            
            this.state.isInitialized = true;
            console.log('✅ Модуль хранилища инициализирован');
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации хранилища:', error);
            
            // Используем localStorage как fallback
            console.log('🔄 Использую localStorage как fallback');
            this.useLocalStorageFallback();
            
            return false;
        }
    },
    
    // Открытие базы данных
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, this.config.dbVersion);
            
            request.onerror = () => {
                reject(new Error('Не удалось открыть базу данных'));
            };
            
            request.onsuccess = (event) => {
                this.state.db = event.target.result;
                console.log('✅ База данных открыта');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Обновление базы данных');
                
                // Создаём хранилища
                Object.values(this.config.stores).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        
                        // Создаём индексы для чатов
                        if (storeName === 'chats') {
                            store.createIndex('type', 'type', { unique: false });
                            store.createIndex('lastActivity', 'lastActivity', { unique: false });
                            store.createIndex('isPinned', 'isPinned', { unique: false });
                        }
                        
                        // Создаём индексы для сообщений
                        if (storeName === 'messages') {
                            store.createIndex('chatId', 'chatId', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            store.createIndex('senderId', 'senderId', { unique: false });
                        }
                        
                        // Создаём индексы для контактов
                        if (storeName === 'contacts') {
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('phone', 'phone', { unique: true });
                            store.createIndex('isFavorite', 'isFavorite', { unique: false });
                        }
                        
                        // Создаём индексы для групп
                        if (storeName === 'groups') {
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('lastActivity', 'lastActivity', { unique: false });
                        }
                        
                        // Создаём индексы для звонков
                        if (storeName === 'calls') {
                            store.createIndex('contactId', 'contactId', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                        }
                    }
                });
            };
            
            request.onblocked = () => {
                console.warn('База данных заблокирована');
                reject(new Error('База данных заблокирована'));
            };
        });
    },
    
    // Загрузка данных в память
    async loadToMemory() {
        console.log('📥 Загрузка данных в память');
        
        try {
            // Загружаем чаты
            AppState.chats = await this.getAll('chats');
            console.log(`✅ Загружено ${AppState.chats.length} чатов`);
            
            // Загружаем сообщения
            AppState.messages = {};
            const allMessages = await this.getAll('messages');
            
            // Группируем сообщения по chatId
            allMessages.forEach(message => {
                if (!AppState.messages[message.chatId]) {
                    AppState.messages[message.chatId] = [];
                }
                AppState.messages[message.chatId].push(message);
            });
            
            console.log(`✅ Загружено ${allMessages.length} сообщений`);
            
            // Загружаем контакты (если нет, используем модуль контактов)
            const contacts = await this.getAll('contacts');
            if (contacts.length > 0) {
                ContactsModule.state.contacts = contacts;
                console.log(`✅ Загружено ${contacts.length} контактов`);
            }
            
            // Загружаем группы (если нет, используем модуль групп)
            const groups = await this.getAll('groups');
            if (groups.length > 0) {
                GroupsModule.state.groups = groups;
                console.log(`✅ Загружено ${groups.length} групп`);
            }
            
            // Загружаем настройки
            const settings = await this.get('settings', 'appSettings');
            if (settings) {
                AppState.settings = { ...AppState.settings, ...settings };
                console.log('✅ Настройки загружены');
            }
            
            // Загружаем историю звонков
            const calls = await this.getAll('calls');
            if (calls.length > 0) {
                AppState.callHistory = calls;
                console.log(`✅ Загружено ${calls.length} записей истории звонков`);
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    },
    
    // Получение всех записей из хранилища
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Получение записи по ID
    get(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Сохранение записи
    save(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                // Добавляем в очередь для офлайн-синхронизации
                this.addToOfflineQueue(storeName, 'put', data);
                resolve(data);
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log(`💾 Данные сохранены в ${storeName}:`, data.id);
                resolve(data);
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Сохранение нескольких записей
    saveAll(storeName, items) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                items.forEach(item => {
                    this.addToOfflineQueue(storeName, 'put', item);
                });
                resolve(items);
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const promises = items.map(item => {
                return new Promise((res, rej) => {
                    const request = store.put(item);
                    request.onsuccess = () => res(item);
                    request.onerror = () => rej(request.error);
                });
            });
            
            Promise.all(promises)
                .then(results => {
                    console.log(`💾 Сохранено ${items.length} записей в ${storeName}`);
                    resolve(results);
                })
                .catch(reject);
        });
    },
    
    // Удаление записи
    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                this.addToOfflineQueue(storeName, 'delete', id);
                resolve();
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`🗑️ Запись удалена из ${storeName}:`, id);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Очистка хранилища
    clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.state.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log(`🧹 Хранилище ${storeName} очищено`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Сохранение чата
    async saveChat(chat) {
        const saved = await this.save('chats', chat);
        
        // Обновляем состояние
        const index = AppState.chats.findIndex(c => c.id === chat.id);
        if (index !== -1) {
            AppState.chats[index] = chat;
        } else {
            AppState.chats.unshift(chat);
        }
        
        return saved;
    },
    
    // Сохранение сообщения
    async saveMessage(message) {
        const saved = await this.save('messages', message);
        
        // Обновляем состояние
        if (!AppState.messages[message.chatId]) {
            AppState.messages[message.chatId] = [];
        }
        
        const index = AppState.messages[message.chatId].findIndex(m => m.id === message.id);
        if (index !== -1) {
            AppState.messages[message.chatId][index] = message;
        } else {
            AppState.messages[message.chatId].push(message);
        }
        
        return saved;
    },
    
    // Сохранение нескольких сообщений
    async saveMessages(messages) {
        if (!messages.length) return [];
        
        const saved = await this.saveAll('messages', messages);
        
        // Обновляем состояние
        messages.forEach(message => {
            if (!AppState.messages[message.chatId]) {
                AppState.messages[message.chatId] = [];
            }
            
            const index = AppState.messages[message.chatId].findIndex(m => m.id === message.id);
            if (index !== -1) {
                AppState.messages[message.chatId][index] = message;
            } else {
                AppState.messages[message.chatId].push(message);
            }
        });
        
        return saved;
    },
    
    // Сохранение контакта
    async saveContact(contact) {
        const saved = await this.save('contacts', contact);
        
        // Обновляем модуль контактов
        const index = ContactsModule.state.contacts.findIndex(c => c.id === contact.id);
        if (index !== -1) {
            ContactsModule.state.contacts[index] = contact;
        } else {
            ContactsModule.state.contacts.unshift(contact);
        }
        
        return saved;
    },
    
    // Сохранение группы
    async saveGroup(group) {
        const saved = await this.save('groups', group);
        
        // Обновляем модуль групп
        const index = GroupsModule.state.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
            GroupsModule.state.groups[index] = group;
        } else {
            GroupsModule.state.groups.unshift(group);
        }
        
        return saved;
    },
    
    // Сохранение звонка в историю
    async saveCall(call) {
        const saved = await this.save('calls', call);
        
        // Обновляем состояние
        if (!AppState.callHistory) {
            AppState.callHistory = [];
        }
        
        AppState.callHistory.unshift(call);
        
        // Ограничиваем историю последними 100 звонками
        if (AppState.callHistory.length > 100) {
            AppState.callHistory = AppState.callHistory.slice(0, 100);
            await this.cleanupOldCalls();
        }
        
        return saved;
    },
    
    // Очистка старых звонков
    async cleanupOldCalls() {
        try {
            const allCalls = await this.getAll('calls');
            if (allCalls.length <= 100) return;
            
            // Сортируем по времени (новые сначала)
            const sorted = allCalls.sort((a, b) => b.timestamp - a.timestamp);
            const toKeep = sorted.slice(0, 100);
            const toDelete = sorted.slice(100);
            
            // Удаляем старые
            const deletePromises = toDelete.map(call => 
                this.delete('calls', call.id)
            );
            
            await Promise.all(deletePromises);
            console.log(`🗑️ Удалено ${toDelete.length} старых звонков`);
            
        } catch (error) {
            console.error('❌ Ошибка очистки старых звонков:', error);
        }
    },
    
    // Сохранение настроек
    async saveSettings() {
        const settings = {
            id: 'appSettings',
            ...AppState.settings,
            updatedAt: Date.now()
        };
        
        return await this.save('settings', settings);
    },
    
    // Сохранение медиафайла
    async saveMedia(file, metadata) {
        const media = {
            id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            data: file,
            metadata: metadata,
            createdAt: Date.now(),
            accessedAt: Date.now()
        };
        
        return await this.save('media', media);
    },
    
    // Получение медиафайла
    async getMedia(id) {
        return await this.get('media', id);
    },
    
    // Получение сообщений чата
    async getChatMessages(chatId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                // Возвращаем из памяти
                const messages = AppState.messages[chatId] || [];
                resolve(messages.slice(offset, offset + limit));
                return;
            }
            
            const transaction = this.state.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('chatId');
            const range = IDBKeyRange.only(chatId);
            const request = index.openCursor(range, 'prev'); // Новые сначала
            
            const messages = [];
            let count = 0;
            let skipped = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    if (skipped < offset) {
                        skipped++;
                        cursor.continue();
                    } else if (count < limit) {
                        messages.push(cursor.value);
                        count++;
                        cursor.continue();
                    } else {
                        resolve(messages);
                    }
                } else {
                    resolve(messages);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Поиск сообщений
    async searchMessages(query, limit = 20) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                // Ищем в памяти
                const results = [];
                const searchQuery = query.toLowerCase();
                
                Object.values(AppState.messages).forEach(chatMessages => {
                    chatMessages.forEach(message => {
                        if (message.type === 'text' && 
                            message.content.toLowerCase().includes(searchQuery)) {
                            results.push(message);
                        }
                    });
                });
                
                resolve(results.slice(0, limit));
                return;
            }
            
            const transaction = this.state.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allMessages = request.result || [];
                const searchQuery = query.toLowerCase();
                
                const results = allMessages
                    .filter(message => 
                        message.type === 'text' && 
                        message.content.toLowerCase().includes(searchQuery)
                    )
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                
                resolve(results);
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Получение непрочитанных сообщений
    async getUnreadMessages(userId = AppState.currentUser.id) {
        return new Promise((resolve, reject) => {
            if (!this.state.db) {
                // Считаем в памяти
                let unread = 0;
                Object.values(AppState.messages).forEach(chatMessages => {
                    chatMessages.forEach(message => {
                        if (message.senderId !== userId && 
                            message.status !== 'read' &&
                            (!message.views || !message.views.includes(userId))) {
                            unread++;
                        }
                    });
                });
                resolve(unread);
                return;
            }
            
            const transaction = this.state.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allMessages = request.result || [];
                const unread = allMessages.filter(message => 
                    message.senderId !== userId && 
                    message.status !== 'read' &&
                    (!message.views || !message.views.includes(userId))
                ).length;
                
                resolve(unread);
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    // Добавление в офлайн-очередь
    addToOfflineQueue(storeName, operation, data) {
        const queueItem = {
            id: Date.now() + Math.random(),
            storeName,
            operation,
            data,
            timestamp: Date.now(),
            retries: 0
        };
        
        this.state.offlineQueue.push(queueItem);
        console.log(`📦 Добавлено в офлайн-очередь: ${operation} в ${storeName}`);
        
        // Сохраняем очередь в localStorage
        this.saveOfflineQueue();
        
        // Показываем уведомление
        if (navigator.onLine === false) {
            showNotification('Данные сохранены для офлайн-синхронизации', 'info');
        }
    },
    
    // Сохранение офлайн-очереди
    saveOfflineQueue() {
        try {
            localStorage.setItem('offlineQueue', JSON.stringify(this.state.offlineQueue));
        } catch (error) {
            console.error('❌ Ошибка сохранения офлайн-очереди:', error);
        }
    },
    
    // Загрузка офлайн-очереди
    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('offlineQueue');
            if (saved) {
                this.state.offlineQueue = JSON.parse(saved);
                console.log(`📦 Загружено ${this.state.offlineQueue.length} записей в офлайн-очереди`);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки офлайн-очереди:', error);
        }
    },
    
    // Синхронизация офлайн-очереди
    async syncOfflineQueue() {
        if (this.state.offlineQueue.length === 0 || !this.state.db) return;
        
        console.log('🔄 Синхронизация офлайн-очереди...');
        
        const successful = [];
        const failed = [];
        
        for (const item of this.state.offlineQueue) {
            try {
                const transaction = this.state.db.transaction([item.storeName], 'readwrite');
                const store = transaction.objectStore(item.storeName);
                
                let request;
                switch (item.operation) {
                    case 'put':
                        request = store.put(item.data);
                        break;
                    case 'delete':
                        request = store.delete(item.data);
                        break;
                    default:
                        continue;
                }
                
                await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                
                successful.push(item.id);
                console.log(`✅ Синхронизировано: ${item.operation} в ${item.storeName}`);
                
            } catch (error) {
                console.error(`❌ Ошибка синхронизации:`, error);
                item.retries++;
                
                if (item.retries < 3) {
                    failed.push(item);
                }
            }
        }
        
        // Удаляем успешно синхронизированные
        this.state.offlineQueue = failed;
        this.saveOfflineQueue();
        
        if (successful.length > 0) {
            showNotification(`Синхронизировано ${successful.length} записей`, 'success');
        }
    },
    
    // Инициализация синхронизации
    initSync() {
        // Загружаем очередь
        this.loadOfflineQueue();
        
        // Слушаем онлайн/офлайн статус
        window.addEventListener('online', () => {
            console.log('🌐 Онлайн, синхронизируем...');
            this.syncOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Офлайн');
        });
        
        // Периодическая синхронизация
        setInterval(() => {
            if (navigator.onLine && this.state.offlineQueue.length > 0) {
                this.syncOfflineQueue();
            }
        }, 30000); // Каждые 30 секунд
    },
    
    // Использование localStorage как fallback
    useLocalStorageFallback() {
        console.log('🔄 Использую localStorage fallback');
        
        // Переопределяем методы для использования localStorage
        this.getAll = async (storeName) => {
            const key = `telegram_${storeName}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        };
        
        this.save = async (storeName, data) => {
            const key = `telegram_${storeName}`;
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            
            const index = items.findIndex(item => item.id === data.id);
            if (index !== -1) {
                items[index] = data;
            } else {
                items.push(data);
            }
            
            localStorage.setItem(key, JSON.stringify(items));
            return data;
        };
        
        this.delete = async (storeName, id) => {
            const key = `telegram_${storeName}`;
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
        };
        
        this.clear = async (storeName) => {
            const key = `telegram_${storeName}`;
            localStorage.removeItem(key);
        };
    },
    
    // Экспорт всех данных
    async exportAllData() {
        try {
            const data = {};
            
            // Собираем данные из всех хранилищ
            for (const storeName of Object.values(this.config.stores)) {
                data[storeName] = await this.getAll(storeName);
            }
            
            // Добавляем метаданные
            data.metadata = {
                exportedAt: new Date().toISOString(),
                appVersion: '1.0.0',
                userId: AppState.currentUser.id,
                totalSize: JSON.stringify(data).length
            };
            
            // Создаём JSON файл
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `telegram-calls-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showNotification('Резервная копия создана', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка экспорта данных:', error);
            showNotification('Не удалось создать резервную копию', 'error');
            return false;
        }
    },
    
    // Импорт данных
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Проверяем структуру данных
                    if (!data.metadata || !data.chats) {
                        throw new Error('Некорректный формат файла');
                    }
                    
                    // Импортируем данные
                    let importedCount = 0;
                    
                    for (const storeName of Object.values(this.config.stores)) {
                        if (data[storeName] && Array.isArray(data[storeName])) {
                            await this.saveAll(storeName, data[storeName]);
                            importedCount += data[storeName].length;
                        }
                    }
                    
                    // Перезагружаем данные в память
                    await this.loadToMemory();
                    
                    showNotification(`Импортировано ${importedCount} записей`, 'success');
                    resolve(true);
                    
                } catch (error) {
                    console.error('❌ Ошибка импорта данных:', error);
                    showNotification('Не удалось импортировать данные', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Ошибка чтения файла'));
            };
            
            reader.readAsText(file);
        });
    },
    
    // Получение статистики хранилища
    async getStorageStats() {
        if (!this.state.db) {
            return { total: 0, byStore: {} };
        }
        
        const stats = { total: 0, byStore: {} };
        
        for (const storeName of Object.values(this.config.stores)) {
            try {
                const items = await this.getAll(storeName);
                const size = JSON.stringify(items).length;
                
                stats.byStore[storeName] = {
                    count: items.length,
                    size: size,
                    readableSize: this.formatBytes(size)
                };
                
                stats.total += size;
                
            } catch (error) {
                console.error(`❌ Ошибка получения статистики для ${storeName}:`, error);
            }
        }
        
        stats.readableTotal = this.formatBytes(stats.total);
        return stats;
    },
    
    // Форматирование байтов
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    // Очистка старых данных
    async cleanupOldData(days = 30) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        
        try {
            // Очищаем старые сообщения
            const allMessages = await this.getAll('messages');
            const oldMessages = allMessages.filter(m => m.timestamp < cutoffDate);
            
            for (const message of oldMessages) {
                await this.delete('messages', message.id);
                deletedCount++;
            }
            
            // Очищаем старые звонки (кроме избранных)
            const allCalls = await this.getAll('calls');
            const oldCalls = allCalls.filter(c => 
                c.timestamp < cutoffDate && !c.isFavorite
            );
            
            for (const call of oldCalls) {
                await this.delete('calls', call.id);
                deletedCount++;
            }
            
            console.log(`🗑️ Удалено ${deletedCount} старых записей`);
            showNotification(`Удалено ${deletedCount} старых записей`, 'info');
            
            // Перезагружаем данные
            await this.loadToMemory();
            
            return deletedCount;
            
        } catch (error) {
            console.error('❌ Ошибка очистки старых данных:', error);
            return 0;
        }
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await StorageModule.init();
});

// Экспорт
window.StorageModule = StorageModule;
