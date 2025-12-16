// Модуль для работы с контактами
const ContactsModule = {
    // Состояние
    state: {
        contacts: [],
        selectedContacts: new Set(),
        isImporting: false,
        searchQuery: ''
    },
    
    // Инициализация
    init() {
        console.log('📇 Инициализация модуля контактов');
        this.loadContacts();
        this.setupEventListeners();
        return this.state.contacts;
    },
    
    // Загрузка контактов
    loadContacts() {
        try {
            const saved = localStorage.getItem('telegram-contacts');
            if (saved) {
                this.state.contacts = JSON.parse(saved);
                console.log(`✅ Загружено ${this.state.contacts.length} контактов`);
            } else {
                this.generateDemoContacts();
                this.saveContacts();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контактов:', error);
            this.generateDemoContacts();
        }
    },
    
    // Сохранение контактов
    saveContacts() {
        try {
            localStorage.setItem('telegram-contacts', JSON.stringify(this.state.contacts));
            console.log('💾 Контакты сохранены');
        } catch (error) {
            console.error('❌ Ошибка сохранения контактов:', error);
        }
    },
    
    // Генерация демо контактов
    generateDemoContacts() {
        console.log('👥 Генерация демо контактов');
        
        this.state.contacts = [
            {
                id: 1,
                name: 'Алексей Иванов',
                phone: '+7 (999) 111-22-33',
                email: 'alex@example.com',
                avatar: 'https://i.pravatar.cc/150?img=1',
                status: 'online',
                lastSeen: Date.now(),
                isFavorite: true,
                isBlocked: false,
                labels: ['Друзья', 'Коллеги'],
                notes: 'Лучший друг'
            },
            {
                id: 2,
                name: 'Мария Гарсия',
                phone: '+7 (999) 222-33-44',
                email: 'maria@example.com',
                avatar: 'https://i.pravatar.cc/150?img=5',
                status: 'offline',
                lastSeen: Date.now() - 3600000,
                isFavorite: true,
                isBlocked: false,
                labels: ['Работа'],
                notes: 'Менеджер проектов'
            },
            {
                id: 3,
                name: 'Иван Петров',
                phone: '+7 (999) 333-44-55',
                email: 'ivan@example.com',
                avatar: 'https://i.pravatar.cc/150?img=8',
                status: 'online',
                lastSeen: Date.now(),
                isFavorite: false,
                isBlocked: false,
                labels: ['Семья'],
                notes: 'Двоюродный брат'
            },
            {
                id: 4,
                name: 'Екатерина Смирнова',
                phone: '+7 (999) 444-55-66',
                email: 'ekaterina@example.com',
                avatar: 'https://i.pravatar.cc/150?img=12',
                status: 'away',
                lastSeen: Date.now() - 1800000,
                isFavorite: false,
                isBlocked: false,
                labels: ['Университет'],
                notes: 'Одногруппница'
            },
            {
                id: 5,
                name: 'Дмитрий Кузнецов',
                phone: '+7 (999) 555-66-77',
                email: 'dmitry@example.com',
                avatar: 'https://i.pravatar.cc/150?img=15',
                status: 'online',
                lastSeen: Date.now(),
                isFavorite: true,
                isBlocked: false,
                labels: ['Спорт'],
                notes: 'Тренер'
            },
            {
                id: 6,
                name: 'Анна Козлова',
                phone: '+7 (999) 666-77-88',
                email: 'anna@example.com',
                avatar: 'https://i.pravatar.cc/150?img=20',
                status: 'offline',
                lastSeen: Date.now() - 7200000,
                isFavorite: false,
                isBlocked: false,
                labels: ['Друзья'],
                notes: ''
            },
            {
                id: 7,
                name: 'Сергей Николаев',
                phone: '+7 (999) 777-88-99',
                email: 'sergey@example.com',
                avatar: 'https://i.pravatar.cc/150?img=25',
                status: 'dnd',
                lastSeen: Date.now(),
                isFavorite: false,
                isBlocked: false,
                labels: ['Работа'],
                notes: 'Начальник отдела'
            },
            {
                id: 8,
                name: 'Ольга Морозова',
                phone: '+7 (999) 888-99-00',
                email: 'olga@example.com',
                avatar: 'https://i.pravatar.cc/150?img=30',
                status: 'online',
                lastSeen: Date.now(),
                isFavorite: true,
                isBlocked: false,
                labels: ['Семья'],
                notes: 'Сестра'
            }
        ];
        
        console.log(`✅ Сгенерировано ${this.state.contacts.length} демо контактов`);
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Поиск контактов
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('contact-search') || 
                e.target.classList.contains('search-input')) {
                this.state.searchQuery = e.target.value.toLowerCase();
                this.renderContacts();
            }
        });
    },
    
    // Получение контакта по ID
    getContactById(id) {
        return this.state.contacts.find(contact => contact.id === id);
    },
    
    // Поиск контактов
    searchContacts(query) {
        this.state.searchQuery = query.toLowerCase();
        return this.getFilteredContacts();
    },
    
    // Получение отфильтрованных контактов
    getFilteredContacts() {
        if (!this.state.searchQuery) {
            return this.state.contacts;
        }
        
        return this.state.contacts.filter(contact => {
            return contact.name.toLowerCase().includes(this.state.searchQuery) ||
                   contact.phone.includes(this.state.searchQuery) ||
                   (contact.email && contact.email.toLowerCase().includes(this.state.searchQuery)) ||
                   (contact.notes && contact.notes.toLowerCase().includes(this.state.searchQuery));
        });
    },
    
    // Добавление нового контакта
    addContact(contactData) {
        const newContact = {
            id: Date.now(),
            ...contactData,
            status: 'offline',
            lastSeen: Date.now(),
            isFavorite: false,
            isBlocked: false,
            labels: [],
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.state.contacts.unshift(newContact);
        this.saveContacts();
        
        console.log('✅ Контакт добавлен:', newContact.name);
        showNotification(`Контакт "${newContact.name}" добавлен`, 'success');
        
        return newContact;
    },
    
    // Обновление контакта
    updateContact(id, updates) {
        const index = this.state.contacts.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        this.state.contacts[index] = {
            ...this.state.contacts[index],
            ...updates,
            updatedAt: Date.now()
        };
        
        this.saveContacts();
        console.log('✅ Контакт обновлён:', id);
        
        return this.state.contacts[index];
    },
    
    // Удаление контакта
    deleteContact(id) {
        const index = this.state.contacts.findIndex(c => c.id === id);
        if (index === -1) return false;
        
        const contact = this.state.contacts[index];
        this.state.contacts.splice(index, 1);
        this.saveContacts();
        
        console.log('🗑️ Контакт удалён:', contact.name);
        showNotification(`Контакт "${contact.name}" удалён`, 'info');
        
        return true;
    },
    
    // Добавление в избранное
    toggleFavorite(id) {
        const contact = this.getContactById(id);
        if (!contact) return false;
        
        contact.isFavorite = !contact.isFavorite;
        contact.updatedAt = Date.now();
        this.saveContacts();
        
        showNotification(
            `Контакт "${contact.name}" ${contact.isFavorite ? 'добавлен в' : 'удалён из'} избранного`,
            'info'
        );
        
        return contact.isFavorite;
    },
    
    // Блокировка контакта
    toggleBlock(id) {
        const contact = this.getContactById(id);
        if (!contact) return false;
        
        contact.isBlocked = !contact.isBlocked;
        contact.updatedAt = Date.now();
        this.saveContacts();
        
        showNotification(
            `Контакт "${contact.name}" ${contact.isBlocked ? 'заблокирован' : 'разблокирован'}`,
            contact.isBlocked ? 'warning' : 'info'
        );
        
        return contact.isBlocked;
    },
    
    // Импорт контактов с устройства
    async importDeviceContacts() {
        if (!navigator.contacts || !navigator.contacts.select) {
            showNotification('Импорт контактов не поддерживается в этом браузере', 'error');
            return [];
        }
        
        try {
            this.state.isImporting = true;
            showNotification('Импорт контактов...', 'info');
            
            const contacts = await navigator.contacts.select(
                ['name', 'tel', 'email', 'address'],
                { multiple: true }
            );
            
            const imported = [];
            
            for (const deviceContact of contacts) {
                // Проверяем, нет ли уже такого контакта
                const exists = this.state.contacts.some(c => 
                    c.phone === deviceContact.tel?.[0] || 
                    c.email === deviceContact.email?.[0]
                );
                
                if (!exists && (deviceContact.name || deviceContact.tel?.[0])) {
                    const newContact = {
                        id: Date.now() + Math.random(),
                        name: deviceContact.name?.[0] || 'Без имени',
                        phone: deviceContact.tel?.[0] || '',
                        email: deviceContact.email?.[0] || '',
                        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                        status: 'offline',
                        lastSeen: Date.now(),
                        isFavorite: false,
                        isBlocked: false,
                        labels: ['Импортированные'],
                        notes: 'Импортирован с устройства',
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    
                    this.state.contacts.unshift(newContact);
                    imported.push(newContact);
                }
            }
            
            this.saveContacts();
            this.state.isImporting = false;
            
            showNotification(
                `Импортировано ${imported.length} контактов`,
                imported.length > 0 ? 'success' : 'info'
            );
            
            return imported;
            
        } catch (error) {
            this.state.isImporting = false;
            console.error('❌ Ошибка импорта контактов:', error);
            
            if (error.name === 'AbortError') {
                showNotification('Импорт отменён', 'warning');
            } else {
                showNotification('Не удалось импортировать контакты', 'error');
            }
            
            return [];
        }
    },
    
    // Экспорт контактов
    exportContacts(format = 'vcard') {
        try {
            let content = '';
            let filename = '';
            let mimeType = '';
            
            switch (format) {
                case 'vcard':
                    content = this.generateVCard();
                    filename = `telegram-contacts-${new Date().toISOString().split('T')[0]}.vcf`;
                    mimeType = 'text/vcard';
                    break;
                    
                case 'csv':
                    content = this.generateCSV();
                    filename = `telegram-contacts-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                case 'json':
                    content = JSON.stringify(this.state.contacts, null, 2);
                    filename = `telegram-contacts-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            showNotification(`Контакты экспортированы в ${format.toUpperCase()}`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка экспорта контактов:', error);
            showNotification('Не удалось экспортировать контакты', 'error');
            return false;
        }
    },
    
    // Генерация vCard
    generateVCard() {
        let vcard = '';
        
        for (const contact of this.state.contacts) {
            vcard += 'BEGIN:VCARD\n';
            vcard += 'VERSION:3.0\n';
            vcard += `FN:${contact.name}\n`;
            
            if (contact.phone) {
                vcard += `TEL;TYPE=CELL:${contact.phone.replace(/\D/g, '')}\n`;
            }
            
            if (contact.email) {
                vcard += `EMAIL:${contact.email}\n`;
            }
            
            vcard += 'END:VCARD\n\n';
        }
        
        return vcard;
    },
    
    // Генерация CSV
    generateCSV() {
        const headers = ['Имя', 'Телефон', 'Email', 'Статус', 'Избранное', 'Заметки'];
        const rows = this.state.contacts.map(contact => [
            `"${contact.name}"`,
            `"${contact.phone}"`,
            `"${contact.email || ''}"`,
            `"${contact.status}"`,
            `"${contact.isFavorite ? 'Да' : 'Нет'}"`,
            `"${contact.notes || ''}"`
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    },
    
    // Выбор контакта для группового звонка
    toggleContactSelection(id) {
        if (this.state.selectedContacts.has(id)) {
            this.state.selectedContacts.delete(id);
        } else {
            this.state.selectedContacts.add(id);
        }
        
        return this.state.selectedContacts.has(id);
    },
    
    // Получение выбранных контактов
    getSelectedContacts() {
        return Array.from(this.state.selectedContacts).map(id => this.getContactById(id));
    },
    
    // Очистка выбора
    clearSelection() {
        this.state.selectedContacts.clear();
    },
    
    // Рендеринг списка контактов
    renderContacts(containerId = 'contactsList') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const contacts = this.getFilteredContacts();
        
        container.innerHTML = contacts.map(contact => this.renderContactItem(contact)).join('');
    },
    
    // Рендеринг элемента контакта
    renderContactItem(contact) {
        const isSelected = this.state.selectedContacts.has(contact.id);
        const statusColor = this.getStatusColor(contact.status);
        
        return `
            <div class="contact-item ${isSelected ? 'selected' : ''}" 
                 onclick="ContactsModule.handleContactClick(${contact.id}, event)">
                <div class="contact-checkbox">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onclick="event.stopPropagation()"
                           onchange="ContactsModule.toggleContactSelection(${contact.id})">
                </div>
                
                <div class="contact-avatar">
                    <img src="${contact.avatar}" alt="${contact.name}">
                    <span class="status-dot" style="background: ${statusColor}"></span>
                </div>
                
                <div class="contact-info">
                    <div class="contact-header">
                        <h3 class="contact-name">${contact.name}</h3>
                        ${contact.isFavorite ? '<i class="fas fa-star favorite-star"></i>' : ''}
                        ${contact.isBlocked ? '<i class="fas fa-ban blocked-icon"></i>' : ''}
                    </div>
                    
                    <div class="contact-details">
                        <p class="contact-phone">
                            <i class="fas fa-phone"></i>
                            ${contact.phone}
                        </p>
                        ${contact.email ? `
                            <p class="contact-email">
                                <i class="fas fa-envelope"></i>
                                ${contact.email}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div class="contact-meta">
                        ${contact.labels.map(label => `
                            <span class="contact-label">${label}</span>
                        `).join('')}
                        
                        <span class="contact-status">
                            ${this.getStatusText(contact.status)}
                        </span>
                    </div>
                </div>
                
                <div class="contact-actions">
                    <button class="action-btn call" 
                            onclick="startCall('audio', ${contact.id}); event.stopPropagation()">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="action-btn video" 
                            onclick="startCall('video', ${contact.id}); event.stopPropagation()">
                        <i class="fas fa-video"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    // Обработка клика по контакту
    handleContactClick(contactId, event) {
        // Если не кликнули по кнопке
        if (!event.target.closest('.action-btn')) {
            this.toggleContactSelection(contactId);
            this.renderContacts();
        }
    },
    
    // Получение цвета статуса
    getStatusColor(status) {
        switch (status) {
            case 'online': return '#4CAF50';
            case 'away': return '#FF9800';
            case 'dnd': return '#F44336';
            case 'offline': return '#9E9E9E';
            default: return '#9E9E9E';
        }
    },
    
    // Получение текста статуса
    getStatusText(status) {
        switch (status) {
            case 'online': return 'в сети';
            case 'away': return 'отошёл';
            case 'dnd': return 'не беспокоить';
            case 'offline': return 'не в сети';
            default: return 'не в сети';
        }
    },
    
    // Получение контактов для быстрого набора
    getQuickDialContacts(limit = 6) {
        return this.state.contacts
            .filter(c => c.isFavorite)
            .slice(0, limit)
            .sort((a, b) => b.lastSeen - a.lastSeen);
    },
    
    // Обновление статуса последней активности
    updateLastSeen(contactId) {
        const contact = this.getContactById(contactId);
        if (contact) {
            contact.lastSeen = Date.now();
            contact.status = 'online';
            this.saveContacts();
        }
    },
    
    // Установка статуса
    setStatus(contactId, status) {
        const contact = this.getContactById(contactId);
        if (contact) {
            contact.status = status;
            contact.updatedAt = Date.now();
            this.saveContacts();
            
            return true;
        }
        
        return false;
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    ContactsModule.init();
});

// Экспорт
window.ContactsModule = ContactsModule;
