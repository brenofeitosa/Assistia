window.RecoveryModule = {
    getOpportunities() {
        // Pega chats que pararam no carrinho/duvida e não converteram
        const chats = window.ChatsModule.getChats();
        return chats.filter(c => c.status === 'Aguardando Resposta' || c.lastMessage.toLowerCase().includes('olhada') || c.lastMessage.toLowerCase().includes('pensar'));
    },

    renderRecoveryUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const opps = this.getOpportunities();

        if (opps.length === 0) {
            container.innerHTML = `
                <div class="empty-state p-4 text-center">
                    <i class="fa-solid fa-circle-check text-success fs-1 mb-2"></i>
                    <p>Nenhuma venda pendente para recuperação no momento!</p>
                </div>`;
            return;
        }

        container.innerHTML = opps.map(o => `
            <div class="card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="mb-1">${o.customerName}</h4>
                        <small class="text-muted">Última mensagem: "${o.lastMessage}"</small>
                    </div>
                    <button class="btn btn-success btn-sm" onclick="window.RecoveryModule.triggerRecovery('${o.id}')">
                        <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Recuperar Venda
                    </button>
                </div>
            </div>
        `).join('');
    },

    triggerRecovery(chatId) {
        const chats = window.ChatsModule.getChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const recoveryMsg = `Oi, ${chat.customerName}! Vi que você ficou com dúvida na sua compra. Consigo te liberar o envio prioritário hoje mesmo se fecharmos agora! Vamos aproveitar? 😊`;

        chat.messages.push({ sender: 'ai', text: recoveryMsg });
        chat.lastMessage = recoveryMsg;
        chat.status = 'Em andamento';
        chat.timestamp = new Date().toISOString();

        window.ChatsModule.saveChats(chats);
        this.renderRecoveryUI('recovery-list-container');
        if (window.Toast) window.Toast.show('Mensagem de recuperação enviada pela IA!');
    }
};
