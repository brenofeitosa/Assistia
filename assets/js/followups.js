window.RecoveryModule = {
    renderRecoveryUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const leads = window.LeadsModule.getLeads().filter(l => l.checkoutSent && !l.converted);

        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-sm">Nenhum lead pendente de recuperação.</td></tr>`;
            return;
        }

        container.innerHTML = leads.map(l => `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.productName}</td>
                <td>R$ ${parseFloat(l.productPrice).toFixed(2)}</td>
                <td><span class="badge badge-warning">${l.status || 'Checkout Enviado'}</span></td>
                <td>${new Date(l.updatedAt || l.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="window.RecoveryModule.simulateRecovery('${l.id}')">
                        <i class="fa-solid fa-rotate-left"></i> Simular Recuperação
                    </button>
                </td>
            </tr>
        `).join('');
    },

    simulateRecovery(leadId) {
        const lead = window.LeadsModule.getLeadById(leadId);
        if (!lead) return;

        lead.status = 'Recuperado';
        lead.converted = true;
        window.LeadsModule.saveLead(lead);

        window.SalesModule.recordSale({
            leadName: lead.name,
            productName: lead.productName,
            amount: lead.productPrice,
            type: 'RECOVERY'
        });

        this.renderRecoveryUI('recovery-list-table');
        window.SalesModule.updateDashboardMetrics();
    }
};
