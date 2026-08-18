window.AutomationsModule = {
    getAutomations() {
        return window.StorageManager.get('assistia_automations', []);
    },
    toggleAutomation(id) {
        const list = this.getAutomations();
        const item = list.find(a => a.id === id);
        if (item) {
            item.active = !item.active;
            window.StorageManager.set('assistia_automations', list);
            this.renderUI('automations-container');
            if (window.Toast) window.Toast.show(`Automação ${item.active ? 'ativada' : 'desativada'}`);
        }
    },
    renderUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const list = this.getAutomations();

        container.innerHTML = list.map(a => `
            <div class="card p-3 mb-3 d-flex flex-row justify-content-between align-items-center">
                <div>
                    <h4 class="mb-1">${a.name}</h4>
                    <p class="text-sm text-muted mb-0">${a.description}</p>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" ${a.active ? 'checked' : ''} onchange="window.AutomationsModule.toggleAutomation('${a.id}')">
                </div>
            </div>
        `).join('');
    }
};
