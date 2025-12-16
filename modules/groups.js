// Модуль для работы с группами
const GroupsModule = {
    // Состояние
    state: {
        groups: [],
        currentGroup: null,
        groupMessages: {},
        groupCalls: [],
        selectedMembers: new Set()
    },
    
    // Инициализация
    init() {
        console.log('👥 Инициализация модуля групп');
        this.loadGroups();
        this.loadGroupMessages();
        return this.state.groups;
    },
    
    // Загрузка групп
    loadGroups() {
        try {
            const saved = localStorage.getItem('telegram-groups');
            if (saved) {
                this.state.groups = JSON.parse(saved);
                console.log(`✅ Загружено ${this.state.groups.length} групп`);
            } else {
                this.generateDemoGroups();
                this.saveGroups();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки групп:', error);
            this.generateDemoGroups();
        }
    },
    
    // Сохранение групп
    saveGroups() {
        try {
            localStorage.setItem('telegram-groups', JSON.stringify(this.state.groups));
            console.log('💾 Группы сохранены');
        } catch (error) {
            console.error('❌ Ошибка сохранения групп:', error);
        }
    },
    
    // Загрузка сообщений групп
    loadGroupMessages() {
        try {
            const saved = localStorage.getItem('telegram-group-messages');
            if (saved) {
                this.state.groupMessages = JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки сообщений групп:', error);
        }
    },
    
    // Сохранение сообщений групп
    saveGroupMessages() {
        try {
            localStorage.setItem('telegram-group-messages', JSON.stringify(this.state.groupMessages));
        } catch (error) {
            console.error('❌ Ошибка сохранения сообщений групп:', error);
        }
    },
    
    // Генерация демо групп
    generateDemoGroups() {
        console.log('👥 Генерация демо групп');
        
        this.state.groups = [
            {
                id: 1,
                name: 'Рабочая группа',
                description: 'Обсуждение рабочих вопросов',
                avatar: null,
                type: 'group',
                isPublic: false,
                isActive: true,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now(),
                createdBy: 1,
                members: [1, 2, 3, 4, 5, 6, 7, 8],
                admins: [1, 2],
                settings: {
                    sendMessages: true,
                    sendMedia: true,
                    addMembers: 'admins',
                    pinMessages: 'admins',
                    changeInfo: 'admins'
                },
                stats: {
                    messageCount: 1247,
                    callCount: 24,
                    lastActivity: Date.now()
                }
            },
            {
                id: 2,
                name: 'Друзья',
                description: 'Общение с друзьями',
                avatar: 'https://i.pravatar.cc/150?img=60',
                type: 'group',
                isPublic: false,
                isActive: true,
                createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 86400000,
                createdBy: 1,
                members: [1, 2, 5, 8],
                admins: [1],
                settings: {
                    sendMessages: true,
                    sendMedia: true,
                    addMembers: 'all',
                    pinMessages: 'all',
                    changeInfo: 'admins'
                },
                stats: {
                    messageCount: 542,
                    callCount: 12,
                    lastActivity: Date.now() - 86400000
                }
            },
            {
                id: 3,
                name: 'Семья',
                description: 'Семейный чат',
                avatar: 'https://i.pravatar.cc/150?img=70',
                type: 'group',
                isPublic: false,
                isActive: true,
                createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 172800000,
                createdBy: 1,
                members: [1, 3, 8],
                admins: [1],
                settings: {
                    sendMessages: true,
                    sendMedia: true,
                    addMembers: 'admins',
                    pinMessages: 'admins',
                    changeInfo: 'admins'
                },
                stats: {
                    messageCount: 321,
                    callCount: 8,
                    lastActivity: Date.now() - 172800000
                }
            }
        ];
        
        console.log(`✅ Сгенерировано ${this.state.groups.length} демо групп`);
    },
    
    // Создание новой группы
    createGroup(groupData) {
        const newGroup = {
            id: Date.now(),
            ...groupData,
            type: groupData.type || 'group',
            isPublic: false,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: AppState.currentUser.id,
            members: groupData.members || [],
            admins: [AppState.currentUser.id],
            settings: {
                sendMessages: true,
                sendMedia: true,
                addMembers: 'admins',
                pinMessages: 'admins',
                changeInfo: 'admins',
                ...groupData.settings
            },
            stats: {
                messageCount: 0,
                callCount: 0,
                lastActivity: Date.now()
            }
        };
        
        // Добавляем создателя в участники, если его нет
        if (!newGroup.members.includes(AppState.currentUser.id)) {
            newGroup.members.push(AppState.currentUser.id);
        }
        
        this.state.groups.unshift(newGroup);
        this.saveGroups();
        
        // Создаём пустой список сообщений для группы
        this.state.groupMessages[newGroup.id] = [];
        this.saveGroupMessages();
        
        console.log('✅ Группа создана:', newGroup.name);
        showNotification(`Группа "${newGroup.name}" создана`, 'success');
        
        return newGroup;
    },
    
    // Получение группы по ID
    getGroupById(id) {
        return this.state.groups.find(group => group.id === id);
    },
    
    // Получение участников группы
    getGroupMembers(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return [];
        
        return group.members.map(memberId => 
            ContactsModule.getContactById(memberId)
        ).filter(Boolean);
    },
    
    // Получение администраторов группы
    getGroupAdmins(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return [];
        
        return group.admins.map(adminId => 
            ContactsModule.getContactById(adminId)
        ).filter(Boolean);
    },
    
    // Проверка, является ли пользователь администратором
    isUserAdmin(groupId, userId = AppState.currentUser.id) {
        const group = this.getGroupById(groupId);
        return group && group.admins.includes(userId);
    },
    
    // Проверка, является ли пользователь участником
    isUserMember(groupId, userId = AppState.currentUser.id) {
        const group = this.getGroupById(groupId);
        return group && group.members.includes(userId);
    },
    
    // Добавление участника в группу
    addMember(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId) && group.settings.addMembers === 'admins') {
            showNotification('Только администраторы могут добавлять участников', 'warning');
            return false;
        }
        
        // Проверяем, не является ли уже участником
        if (group.members.includes(userId)) {
            showNotification('Пользователь уже в группе', 'warning');
            return false;
        }
        
        group.members.push(userId);
        group.updatedAt = Date.now();
        this.saveGroups();
        
        // Добавляем системное сообщение
        const contact = ContactsModule.getContactById(userId);
        if (contact) {
            this.addSystemMessage(groupId, 
                `${AppState.currentUser.name} добавил(а) ${contact.name} в группу`);
        }
        
        showNotification('Участник добавлен в группу', 'success');
        return true;
    },
    
    // Удаление участника из группы
    removeMember(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId)) {
            showNotification('Только администраторы могут удалять участников', 'warning');
            return false;
        }
        
        // Нельзя удалить создателя
        if (userId === group.createdBy) {
            showNotification('Нельзя удалить создателя группы', 'error');
            return false;
        }
        
        // Удаляем из участников
        const index = group.members.indexOf(userId);
        if (index === -1) return false;
        
        group.members.splice(index, 1);
        
        // Удаляем из администраторов, если был
        const adminIndex = group.admins.indexOf(userId);
        if (adminIndex !== -1) {
            group.admins.splice(adminIndex, 1);
        }
        
        group.updatedAt = Date.now();
        this.saveGroups();
        
        // Добавляем системное сообщение
        const contact = ContactsModule.getContactById(userId);
        if (contact) {
            this.addSystemMessage(groupId, 
                `${AppState.currentUser.name} удалил(а) ${contact.name} из группы`);
        }
        
        showNotification('Участник удалён из группы', 'info');
        return true;
    },
    
    // Назначение администратора
    promoteToAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId)) {
            showNotification('Только администраторы могут назначать администраторов', 'warning');
            return false;
        }
        
        // Проверяем, является ли участником
        if (!group.members.includes(userId)) {
            showNotification('Пользователь не является участником группы', 'warning');
            return false;
        }
        
        // Проверяем, не является ли уже администратором
        if (group.admins.includes(userId)) {
            showNotification('Пользователь уже администратор', 'warning');
            return false;
        }
        
        group.admins.push(userId);
        group.updatedAt = Date.now();
        this.saveGroups();
        
        // Добавляем системное сообщение
        const contact = ContactsModule.getContactById(userId);
        if (contact) {
            this.addSystemMessage(groupId, 
                `${AppState.currentUser.name} назначил(а) ${contact.name} администратором`);
        }
        
        showNotification('Пользователь назначен администратором', 'success');
        return true;
    },
    
    // Снятие прав администратора
    demoteFromAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId)) {
            showNotification('Только администраторы могут снимать администраторов', 'warning');
            return false;
        }
        
        // Нельзя снять создателя
        if (userId === group.createdBy) {
            showNotification('Нельзя снять права у создателя группы', 'error');
            return false;
        }
        
        const index = group.admins.indexOf(userId);
        if (index === -1) return false;
        
        group.admins.splice(index, 1);
        group.updatedAt = Date.now();
        this.saveGroups();
        
        // Добавляем системное сообщение
        const contact = ContactsModule.getContactById(userId);
        if (contact) {
            this.addSystemMessage(groupId, 
                `${AppState.currentUser.name} снял(а) ${contact.name} с должности администратора`);
        }
        
        showNotification('Права администратора сняты', 'info');
        return true;
    },
    
    // Обновление настроек группы
    updateGroupSettings(groupId, settings) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId) && group.settings.changeInfo === 'admins') {
            showNotification('Только администраторы могут изменять настройки', 'warning');
            return false;
        }
        
        group.settings = { ...group.settings, ...settings };
        group.updatedAt = Date.now();
        this.saveGroups();
        
        showNotification('Настройки группы обновлены', 'success');
        return true;
    },
    
    // Отправка сообщения в группу
    sendGroupMessage(groupId, content, type = 'text') {
        if (!this.isUserMember(groupId)) {
            showNotification('Вы не являетесь участником этой группы', 'error');
            return null;
        }
        
        const message = {
            id: Date.now(),
            groupId: groupId,
            senderId: AppState.currentUser.id,
            type: type,
            content: content,
            timestamp: Date.now(),
            status: 'sent',
            isEdited: false,
            reactions: {},
            views: []
        };
        
        // Добавляем в историю сообщений
        if (!this.state.groupMessages[groupId]) {
            this.state.groupMessages[groupId] = [];
        }
        
        this.state.groupMessages[groupId].push(message);
        this.saveGroupMessages();
        
        // Обновляем статистику группы
        this.updateGroupStats(groupId, 'message');
        
        // Обновляем UI
        this.renderGroupMessage(message);
        
        // Рассылаем уведомления участникам
        this.notifyGroupMembers(groupId, message);
        
        return message;
    },
    
    // Добавление системного сообщения
    addSystemMessage(groupId, text) {
        const message = {
            id: Date.now(),
            groupId: groupId,
            senderId: 0, // Система
            type: 'system',
            content: text,
            timestamp: Date.now(),
            status: 'sent'
        };
        
        if (!this.state.groupMessages[groupId]) {
            this.state.groupMessages[groupId] = [];
        }
        
        this.state.groupMessages[groupId].push(message);
        this.saveGroupMessages();
        
        return message;
    },
    
    // Обновление статистики группы
    updateGroupStats(groupId, type) {
        const group = this.getGroupById(groupId);
        if (!group) return;
        
        switch (type) {
            case 'message':
                group.stats.messageCount++;
                break;
            case 'call':
                group.stats.callCount++;
                break;
        }
        
        group.stats.lastActivity = Date.now();
        group.updatedAt = Date.now();
        this.saveGroups();
    },
    
    // Уведомление участников группы
    notifyGroupMembers(groupId, message) {
        const group = this.getGroupById(groupId);
        if (!group) return;
        
        // Получаем участников, кроме отправителя
        const membersToNotify = group.members.filter(
            memberId => memberId !== AppState.currentUser.id
        );
        
        // В реальном приложении здесь бы push-уведомления
        console.log(`📢 Уведомление ${membersToNotify.length} участников группы "${group.name}"`);
    },
    
    // Рендеринг сообщения группы
    renderGroupMessage(message) {
        // В реальном приложении здесь бы обновление UI
        console.log('💬 Рендеринг группового сообщения:', message);
    },
    
    // Начало группового звонка
    startGroupCall(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) {
            showNotification('Группа не найдена', 'error');
            return false;
        }
        
        if (!this.isUserMember(groupId)) {
            showNotification('Вы не являетесь участником этой группы', 'error');
            return false;
        }
        
        // Получаем участников для звонка
        const participants = this.getGroupMembers(groupId);
        
        // Создаём групповой звонок
        const groupCall = {
            id: Date.now(),
            groupId: groupId,
            type: 'video',
            participants: participants.map(p => p.id),
            startedAt: Date.now(),
            startedBy: AppState.currentUser.id,
            status: 'active'
        };
        
        // Добавляем в историю звонков
        this.state.groupCalls.push(groupCall);
        
        // Обновляем статистику
        this.updateGroupStats(groupId, 'call');
        
        // Показываем экран группового звонка
        AppState.isGroupCall = true;
        AppState.currentGroup = group;
        
        // Инициализируем WebRTC для нескольких участников
        this.initGroupWebRTC(participants);
        
        showNotification(`Групповой звонок начат в "${group.name}"`, 'call');
        return true;
    },
    
    // Инициализация группового WebRTC
    initGroupWebRTC(participants) {
        console.log('👥 Инициализация группового WebRTC для', participants.length, 'участников');
        
        // В реальном приложении здесь бы Mesh или SFU архитектура
        // Для демо просто показываем UI
        
        // Обновляем UI группового звонка
        this.renderGroupCallUI(participants);
    },
    
    // Рендеринг UI группового звонка
    renderGroupCallUI(participants) {
        const grid = document.getElementById('participantsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Добавляем участников
        participants.forEach((participant, index) => {
            const participantElement = this.createParticipantElement(participant, index === 0);
            grid.appendChild(participantElement);
        });
        
        // Добавляем кнопку добавления участников
        const addButton = this.createAddParticipantButton();
        grid.appendChild(addButton);
    },
    
    // Создание элемента участника
    createParticipantElement(participant, isActiveSpeaker = false) {
        const div = document.createElement('div');
        div.className = `participant ${isActiveSpeaker ? 'active-speaker' : ''}`;
        
        div.innerHTML = `
            <div class="participant-video">
                <img src="${participant.avatar}" alt="${participant.name}">
                <div class="participant-overlay">
                    <span class="participant-name">${participant.name}</span>
                    <div class="participant-status">
                        <i class="fas fa-microphone"></i>
                        <i class="fas fa-video"></i>
                    </div>
                </div>
                ${isActiveSpeaker ? `
                    <div class="speaker-indicator">
                        <div class="sound-wave"></div>
                    </div>
                ` : ''}
            </div>
        `;
        
        return div;
    },
    
    // Создание кнопки добавления участника
    createAddParticipantButton() {
        const div = document.createElement('div');
        div.className = 'participant add-participant';
        div.onclick = () => this.showAddParticipantModal();
        
        div.innerHTML = `
            <div class="add-participant-btn">
                <i class="fas fa-user-plus"></i>
                <span>Добавить</span>
            </div>
        `;
        
        return div;
    },
    
    // Показ модалки добавления участника
    showAddParticipantModal() {
        showNotification('Добавление участников в групповой звонок', 'info');
        
        // В реальном приложении здесь бы модалка с выбором контактов
        // Для демо просто добавляем случайного участника
        this.addRandomParticipantToCall();
    },
    
    // Добавление случайного участника
    addRandomParticipantToCall() {
        const availableContacts = ContactsModule.state.contacts
            .filter(c => !AppState.groupCallParticipants.includes(c.id))
            .slice(0, 3);
        
        if (availableContacts.length === 0) {
            showNotification('Нет доступных контактов для добавления', 'warning');
            return;
        }
        
        const randomContact = availableContacts[
            Math.floor(Math.random() * availableContacts.length)
        ];
        
        AppState.groupCallParticipants.push(randomContact.id);
        
        // Обновляем UI
        const grid = document.getElementById('participantsGrid');
        if (grid) {
            const participantElement = this.createParticipantElement(randomContact);
            grid.insertBefore(participantElement, grid.lastElementChild);
        }
        
        showNotification(`${randomContact.name} добавлен в звонок`, 'success');
    },
    
    // Получение истории групповых звонков
    getGroupCallHistory(groupId, limit = 10) {
        return this.state.groupCalls
            .filter(call => call.groupId === groupId)
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, limit);
    },
    
    // Поиск групп
    searchGroups(query) {
        const searchQuery = query.toLowerCase();
        
        return this.state.groups.filter(group => 
            group.name.toLowerCase().includes(searchQuery) ||
            (group.description && group.description.toLowerCase().includes(searchQuery))
        );
    },
    
    // Выход из группы
    leaveGroup(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем, является ли участником
        if (!this.isUserMember(groupId)) {
            showNotification('Вы не являетесь участником этой группы', 'warning');
            return false;
        }
        
        // Нельзя выйти, если вы создатель
        if (group.createdBy === AppState.currentUser.id) {
            showNotification('Создатель не может выйти из группы', 'error');
            return false;
        }
        
        // Удаляем из участников
        const memberIndex = group.members.indexOf(AppState.currentUser.id);
        if (memberIndex !== -1) {
            group.members.splice(memberIndex, 1);
        }
        
        // Удаляем из администраторов
        const adminIndex = group.admins.indexOf(AppState.currentUser.id);
        if (adminIndex !== -1) {
            group.admins.splice(adminIndex, 1);
        }
        
        group.updatedAt = Date.now();
        this.saveGroups();
        
        // Добавляем системное сообщение
        this.addSystemMessage(groupId, 
            `${AppState.currentUser.name} вышел(а) из группы`);
        
        showNotification(`Вы вышли из группы "${group.name}"`, 'info');
        return true;
    },
    
    // Удаление группы
    deleteGroup(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (group.createdBy !== AppState.currentUser.id) {
            showNotification('Только создатель может удалить группу', 'error');
            return false;
        }
        
        const index = this.state.groups.findIndex(g => g.id === groupId);
        if (index === -1) return false;
        
        this.state.groups.splice(index, 1);
        this.saveGroups();
        
        // Удаляем сообщения группы
        delete this.state.groupMessages[groupId];
        this.saveGroupMessages();
        
        showNotification(`Группа "${group.name}" удалена`, 'info');
        return true;
    },
    
    // Обновление информации о группе
    updateGroupInfo(groupId, updates) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        
        // Проверяем права
        if (!this.isUserAdmin(groupId) && group.settings.changeInfo === 'admins') {
            showNotification('Только администраторы могут изменять информацию', 'warning');
            return false;
        }
        
        Object.assign(group, updates);
        group.updatedAt = Date.now();
        this.saveGroups();
        
        showNotification('Информация о группе обновлена', 'success');
        return true;
    },
    
    // Получение непрочитанных сообщений
    getUnreadGroupMessages(userId = AppState.currentUser.id) {
        let unreadCount = 0;
        const unreadGroups = [];
        
        for (const group of this.state.groups) {
            if (this.isUserMember(group.id, userId)) {
                const messages = this.state.groupMessages[group.id] || [];
                const unread = messages.filter(m => 
                    m.senderId !== userId && 
                    (!m.views || !m.views.includes(userId))
                ).length;
                
                if (unread > 0) {
                    unreadCount += unread;
                    unreadGroups.push({
                        groupId: group.id,
                        groupName: group.name,
                        unreadCount: unread
                    });
                }
            }
        }
        
        return { total: unreadCount, groups: unreadGroups };
    },
    
    // Отметка сообщений как прочитанных
    markGroupMessagesAsRead(groupId, userId = AppState.currentUser.id) {
        const messages = this.state.groupMessages[groupId];
        if (!messages) return 0;
        
        let marked = 0;
        
        for (const message of messages) {
            if (message.senderId !== userId && 
                (!message.views || !message.views.includes(userId))) {
                
                if (!message.views) message.views = [];
                message.views.push(userId);
                marked++;
            }
        }
        
        if (marked > 0) {
            this.saveGroupMessages();
        }
        
        return marked;
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    GroupsModule.init();
});

// Экспорт
window.GroupsModule = GroupsModule;
