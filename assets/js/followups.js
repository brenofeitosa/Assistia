/**
 * Módulo de Recuperação de Vendas (Follow-up)
 */
const RecoveryModule = {
    renderRecoveryUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const leads = LeadsModule.getLeads().filter(l => l.checkoutSent && !l.converted);

        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-sm">Nenhum lead na fila de recuperação no momento.</td></tr>`;
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
                    ${l.status === 'Recuperado' ? 
                        `<span class="text-online"><i class="fa-solid fa-check"></i> Venda Concluída</span>` :
                        `<button class="btn btn-success btn-sm" onclick="RecoveryModule.simulateRecovery('${l.id}')">
                            <i class="fa-solid fa-rotate-left"></i> Simular Recuperação
                        </button>`
                    }
                </td>
            </tr>
        `).join('');
    },

    simulateRecovery(leadId) {
        const lead = LeadsModule.getLeadById(leadId);
        if (!lead) return;

        // Atualiza estado do lead
        lead.status = 'Recuperado';
        lead.converted = true;
        lead.updatedAt = new Date().toISOString();
        LeadsModule.saveLead(lead);

        // Registra venda do tipo RECOVERY no módulo financeiro
        SalesModule.recordSale({
            leadName: lead.name,
            productName: lead.productName,
            amount: lead.productPrice,
            type: 'RECOVERY'
        });

        // Atualizar telas
        this.renderRecoveryUI('recovery-list-table');
        SalesModule.updateDashboardMetrics();
    }
};
