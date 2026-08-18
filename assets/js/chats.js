window.ChatsModule = {
    getChats() {
        return window.StorageManager.get('assistia_chats', []);
    },
    saveChats(chats) {
        window.StorageManager.set('assistia_chats', chats);
    },
    getChatById(id) {
        return this.getChats().find(c => c.id === id);
    },

    renderChatList(containerId, activeChatId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const chats = this.getChats();
        if (chats.length === 0) {
            container.innerHTML = `<div class="p-3 text-muted text-center">Nenhuma conversa encontrada.</div>`;
            return;
        }

        container.innerHTML = chats.map(c => `
            <div class="chat-item p-3 border-bottom ${c.id === activeChatId ? 'active' : ''} ${c.unread ? 'fw-bold' : ''}" 
                 onclick="window.ChatsModule.selectChat('${c.id}')">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="chat-name">${c.customerName}</span>
                    <small class="text-muted">${new Date(c.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</small>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="chat-preview text-muted text-truncate" style="max-width: 180px;">${c.lastMessage}</span>
                    <div>
                        <span class="badge ${c.mode === 'AI' ? 'badge-primary' : 'badge-warning'} me-1">
                            ${c.mode === 'AI' ? 'IA' : 'Humano'}
                        </span>
                        ${c.unread ? '<span class="badge bg-danger rounded-pill">•</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    selectChat(chatId) {
        const chats = this.getChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        chat.unread = false;
        this.saveChats(chats);

        this.renderChatList('chat-list-container', chatId);
        this.renderActiveChatMessages(chat);
    },

    renderActiveChatMessages(chat) {
        const messagesBox = document.getElementById('chat-active-messages');
        const headerName = document.getElementById('chat-active-name');
        const headerStatus = document.getElementById('chat-active-status');
        const modeBadge = document.getElementById('chat-active-mode-badge');
        const toggleBtn = document.getElementById('btn-toggle-chat-mode');

        if (headerName) headerName.innerText = chat.customerName;
        if (headerStatus) headerStatus.innerText = chat.status;
        if (modeBadge) {
            modeBadge.innerText = chat.mode === 'AI' ? 'IA Ativa' : 'Atendimento Humano';
            modeBadge.className = `badge ${chat.mode === 'AI' ? 'badge-primary' : 'badge-warning'}`;
        }

        if (toggleBtn) {
            toggleBtn.innerText = chat.mode === 'AI' ? 'Assumir Conversa' : 'Devolver para IA';
            toggleBtn.className = `btn btn-sm ${chat.mode === 'AI' ? 'btn-outline-warning' : 'btn-outline-primary'}`;
            toggleBtn.onclick = () => this.toggleChatMode(chat.id);
        }

        if (messagesBox) {
            messagesBox.innerHTML = chat.messages.map(m => `
                <div class="chat-bubble ${m.sender}">
                    <div class="chat-bubble-content">${m.text.replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }

        window.activeChatId = chat.id;
    },

    toggleChatMode(chatId) {
        const chats = this.getChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.mode = chat.mode === 'AI' ? 'HUMAN' : 'AI';
            this.saveChats(chats);
            this.selectChat(chatId);
            if (window.Toast) window.Toast.show(`Modo alterado para ${chat.mode === 'AI' ? 'IA' : 'Humano'}`);
        }
    },

    sendMessageFromInput() {
        const input = document.getElementById('chat-input-text');
        if (!input) return;
        const text = input.value.trim();
        if (!text || !window.activeChatId) return;

        const chats = this.getChats();
        const chat = chats.find(c => c.id === window.activeChatId);
        if (!chat) return;

        // Adiciona mensagem do usuário/atendente
        const sender = chat.mode === 'HUMAN' ? 'human' : 'user';
        chat.messages.push({ sender, text });
        chat.lastMessage = text;
        chat.timestamp = new Date().toISOString();
        input.value = '';

        this.saveChats(chats);
        this.renderActiveChatMessages(chat);

        // Se for modo IA e a mensagem veio do usuário, IA responde
        if (chat.mode === 'AI' && sender === 'user') {
            setTimeout(() => {
                const aiResp = window.AIEngine.generateSalesResponse(text);
                chat.messages.push({ sender: 'ai', text: aiResp.text });
                chat.lastMessage = aiResp.text;
                chat.timestamp = new Date().toISOString();

                // Se enviou link de checkout e houve compra simulada -> Atualizar Estoque + Venda
                if (aiResp.sendCheckout && aiResp.productId) {
                    const success = window.ProductsModule.decrementStock(aiResp.productId, 1);
                    if (success) {
                        const prod = window.ProductsModule.getProductById(aiResp.productId);
                        window.SalesModule.recordSale({
                            customerName: chat.customerName,
                            productName: prod.name,
                            amount: prod.price,
                            type: 'DIRECT'
                        });
                    }
                }

                this.saveChats(chats);
                this.renderActiveChatMessages(chat);
                window.SalesModule.updateDashboardMetrics();
            }, 600);
        }
    }
};
