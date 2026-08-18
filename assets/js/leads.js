window.LeadsModule = {
    getLeads() {
        return window.StorageManager.get('assistia_leads', []);
    },
    saveLead(lead) {
        const leads = this.getLeads();
        const index = leads.findIndex(l => l.id === lead.id);
        lead.updatedAt = new Date().toISOString();
        if (index >= 0) {
            leads[index] = lead;
        } else {
            lead.createdAt = lead.createdAt || new Date().toISOString();
            leads.push(lead);
        }
        window.StorageManager.set('assistia_leads', leads);
    },
    getLeadById(id) {
        return this.getLeads().find(l => l.id === id);
    },
    renderLeadsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const leads = this.getLeads();
        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="4" class="text-sm">Nenhum lead registrado até o momento.</td></tr>`;
            return;
        }
        container.innerHTML = leads.map(l => `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.intent || 'Dúvida Geral'}</td>
                <td><span class="badge ${l.status === 'Recuperado' ? 'badge-success' : 'badge-warning'}">${l.status || 'Em Atendimento'}</span></td>
                <td>${new Date(l.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
            </tr>
        `).join('');
    }
};
