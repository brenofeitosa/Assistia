/**
 * Módulo de Gestão de Leads
 */
const LeadsModule = {
    getLeads() {
        return StorageManager.get(StorageManager.KEYS.LEADS);
    },

    getLeadById(id) {
        return this.getLeads().find(l => l.id === id);
    },

    saveLead(lead) {
        const leads = this.getLeads();
        const index = leads.findIndex(l => l.id === lead.id);
        if (index !== -1) {
            leads[index] = lead;
        } else {
            leads.push(lead);
        }
        StorageManager.set(StorageManager.KEYS.LEADS, leads);
        return lead;
    },

    renderLeadsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const leads = this.getLeads();
        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="4" class="text-sm">Nenhum lead registrado no momento.</td></tr>`;
            return;
        }

        container.innerHTML = leads.map(l => `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.intent || 'Dúvida geral'}</td>
                <td><span class="badge">${l.checkoutSent ? 'Checkout Enviado' : 'Em Conversa'}</span></td>
                <td>${new Date(l.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
        `).join('');
    }
};
