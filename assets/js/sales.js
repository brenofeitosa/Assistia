window.SalesModule = {
    getSales() {
        return window.StorageManager.get('assistia_sales', []);
    },
    recordSale(sale) {
        const sales = this.getSales();
        sale.id = 'sale_' + Date.now();
        sale.timestamp = new Date().toISOString();
        sales.push(sale);
        window.StorageManager.set('assistia_sales', sales);
        this.updateDashboardMetrics();
    },

    updateDashboardMetrics() {
        const sales = this.getSales();
        const chats = window.ChatsModule.getChats();
        const customers = window.CustomersModule ? window.CustomersModule.getCustomers() : [];

        const totalSold = sales.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);
        const totalRecovered = sales.filter(s => s.type === 'RECOVERY').reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);

        const activeChats = chats.filter(c => c.status === 'Em andamento').length;
        const waitingChats = chats.filter(c => c.status === 'Aguardando Resposta' || c.unread).length;

        const convRate = chats.length > 0 ? ((sales.length / chats.length) * 100).toFixed(1) : '0.0';

        // Atualizar os Cards de KPI
        const elTotalSold = document.getElementById('dash-kpi-total-sold');
        const elTotalSalesCount = document.getElementById('dash-kpi-sales-count');
        const elRecovered = document.getElementById('dash-kpi-recovered');
        const elChatsCount = document.getElementById('dash-kpi-chats-count');
        const elActiveChats = document.getElementById('dash-kpi-active-chats');
        const elWaitingChats = document.getElementById('dash-kpi-waiting-chats');
        const elConvRate = document.getElementById('dash-kpi-conv-rate');

        if (elTotalSold) elTotalSold.innerText = `R$ ${totalSold.toFixed(2)}`;
        if (elTotalSalesCount) elTotalSalesCount.innerText = sales.length;
        if (elRecovered) elRecovered.innerText = `R$ ${totalRecovered.toFixed(2)}`;
        if (elChatsCount) elChatsCount.innerText = chats.length;
        if (elActiveChats) elActiveChats.innerText = activeChats;
        if (elWaitingChats) elWaitingChats.innerText = waitingChats;
        if (elConvRate) elConvRate.innerText = `${convRate}%`;

        // Atividade Recente
        const activityContainer = document.getElementById('dash-recent-activity');
        if (activityContainer) {
            const allActivities = [
                ...sales.map(s => ({ title: `Venda de ${s.productName}`, desc: `${s.customerName} - R$ ${s.amount.toFixed(2)}`, time: s.timestamp, icon: 'fa-bag-shopping', color: 'text-success' })),
                ...chats.map(c => ({ title: `Nova mensagem de ${c.customerName}`, desc: c.lastMessage, time: c.timestamp, icon: 'fa-comment', color: 'text-primary' }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            if (allActivities.length === 0) {
                activityContainer.innerHTML = `<p class="text-muted text-sm">Nenhuma atividade recente.</p>`;
            } else {
                activityContainer.innerHTML = allActivities.map(act => `
                    <div class="d-flex align-items-center mb-3">
                        <div class="activity-icon me-3 ${act.color}">
                            <i class="fa-solid ${act.icon} fs-5"></i>
                        </div>
                        <div>
                            <strong class="d-block text-sm">${act.title}</strong>
                            <small class="text-muted me-2">${act.desc}</small>
                            <small class="text-muted" style="font-size: 10px;">${new Date(act.time).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</small>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
};
