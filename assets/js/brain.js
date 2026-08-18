window.BrainModule = {
    getBrain() {
        return window.StorageManager.get('assistia_brain', {});
    },
    saveBrainFromForm() {
        const brain = {
            storeName: document.getElementById('brain-store-name').value,
            aiName: document.getElementById('brain-ai-name').value,
            tone: document.getElementById('brain-tone').value,
            goal: document.getElementById('brain-goal').value,
            businessInfo: document.getElementById('brain-info').value,
            rules: document.getElementById('brain-rules').value,
            hours: document.getElementById('brain-hours').value,
            welcomeMsg: document.getElementById('brain-welcome').value,
            customInstructions: document.getElementById('brain-custom').value
        };
        window.StorageManager.set('assistia_brain', brain);
        if (window.Toast) window.Toast.show('Cérebro da IA atualizado com sucesso!');
    },
    loadToForm() {
        const b = this.getBrain();
        if (document.getElementById('brain-store-name')) document.getElementById('brain-store-name').value = b.storeName || '';
        if (document.getElementById('brain-ai-name')) document.getElementById('brain-ai-name').value = b.aiName || '';
        if (document.getElementById('brain-tone')) document.getElementById('brain-tone').value = b.tone || '';
        if (document.getElementById('brain-goal')) document.getElementById('brain-goal').value = b.goal || '';
        if (document.getElementById('brain-info')) document.getElementById('brain-info').value = b.businessInfo || '';
        if (document.getElementById('brain-rules')) document.getElementById('brain-rules').value = b.rules || '';
        if (document.getElementById('brain-hours')) document.getElementById('brain-hours').value = b.hours || '';
        if (document.getElementById('brain-welcome')) document.getElementById('brain-welcome').value = b.welcomeMsg || '';
        if (document.getElementById('brain-custom')) document.getElementById('brain-custom').value = b.customInstructions || '';
    }
};
