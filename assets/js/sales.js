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
    },
    updateDashboardMetrics() {
        const sales = this.getSales();
        const leads = window.LeadsModule.getLeads();

        const totalSalesVal = sales.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);
        const recoveredVal = sales.filter(s => s.type === 'RECOVERY').reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);

        const elToday = document.getElementById('dash-sales-today');
        const elAi = document.getElementById('dash-sales-ai');
        const elRec = document.getElementById('dash-sales-recovered');
        const elLeads = document.getElementById('dash-leads-count');
        const elConv = document.getElementById('dash-conversion-rate');

        if (elToday) elToday.innerText = `R$ ${totalSalesVal.toFixed(2)}`;
        if (elAi) elAi.innerText = `R$ ${totalSalesVal.toFixed(2)}`;
        if (elRec) elRec.innerText = `R$ ${recoveredVal.toFixed(2)}`;
        if (elLeads) elLeads.innerText = leads.length;

        if (elConv) {
            const rate = leads.length > 0 ? ((sales.length / leads.length) * 100).toFixed(1) : '0.0';
            elConv.innerText = `${rate}%`;
        }

        const table = document.getElementById('dash-recent-sales-table');
        if (table) {
            if (sales.length === 0) {
                table.innerHTML = `<tr><td colspan="5" class="text-sm">Nenhuma venda registrada ainda.</td></tr>`;
            } else {
                table.innerHTML = sales.slice(-5).reverse().map(s => `
                    <tr>
                        <td>${s.leadName || 'Cliente'}</td>
                        <td>${s.productName}</td>
                        <td>R$ ${parseFloat(s.amount).toFixed(2)}</td>
                        <td><span class="badge ${s.type === 'RECOVERY' ? 'badge-success' : 'badge-primary'}">${s.type === 'RECOVERY' ? 'Recuperada' : 'Direta'}</span></td>
                        <td>${new Date(s.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                    </tr>
                `).join('');
            }
        }
    }
};
