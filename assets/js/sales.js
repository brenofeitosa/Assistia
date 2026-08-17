/**
 * Módulo de Métricas e Vendas (Foco em ROI)
 */
const SalesModule = {
    getSales() {
        return StorageManager.get(StorageManager.KEYS.SALES);
    },

    recordSale(saleData) {
        const sales = this.getSales();
        const newSale = {
            id: 'sale_' + Date.now(),
            leadName: saleData.leadName,
            productName: saleData.productName,
            amount: parseFloat(saleData.amount),
            type: saleData.type || 'AI_DIRECT', // AI_DIRECT ou RECOVERY
            timestamp: new Date().toISOString()
        };
        sales.push(newSale);
        StorageManager.set(StorageManager.KEYS.SALES, sales);
        return newSale;
    },

    updateDashboardMetrics() {
        const sales = this.getSales();
        const leads = LeadsModule.getLeads();

        const totalSalesToday = sales.reduce((acc, s) => acc + s.amount, 0);
        const aiSales = sales.filter(s => s.type === 'AI_DIRECT').reduce((acc, s) => acc + s.amount, 0);
        const recoveredSales = sales.filter(s => s.type === 'RECOVERY').reduce((acc, s) => acc + s.amount, 0);
        
        const leadsCount = leads.length;
        const conversionRate = leadsCount > 0 ? ((sales.length / leadsCount) * 100).toFixed(1) : '0.0';

        // Atualizar DOM
        const elToday = document.getElementById('dash-sales-today');
        const elAi = document.getElementById('dash-sales-ai');
        const elRec = document.getElementById('dash-sales-recovered');
        const elLeads = document.getElementById('dash-leads-count');
        const elConv = document.getElementById('dash-conversion-rate');

        if (elToday) elToday.innerText = `R$ ${totalSalesToday.toFixed(2)}`;
        if (elAi) elAi.innerText = `R$ ${aiSales.toFixed(2)}`;
        if (elRec) elRec.innerText = `R$ ${recoveredSales.toFixed(2)}`;
        if (elLeads) elLeads.innerText = leadsCount;
        if (elConv) elConv.innerText = `${conversionRate}%`;

        // Tabela recente
        const tableBody = document.getElementById('dash-recent-sales-table');
        if (tableBody) {
            if (sales.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-sm">Nenhuma venda realizada ainda.</td></tr>`;
            } else {
                tableBody.innerHTML = sales.slice(-5).reverse().map(s => `
                    <tr>
                        <td>${s.leadName}</td>
                        <td>${s.productName}</td>
                        <td><strong>R$ ${s.amount.toFixed(2)}</strong></td>
                        <td><span class="badge">${s.type === 'RECOVERY' ? 'Recuperada' : 'Direta IA'}</span></td>
                        <td>${new Date(s.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                    </tr>
                `).join('');
            }
        }
    }
};
