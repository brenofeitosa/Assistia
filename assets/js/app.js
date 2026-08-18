// Toast Notifier
window.Toast = {
    show(message) {
        let toastEl = document.getElementById('global-toast');
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.id = 'global-toast';
            toastEl.className = 'toast-notification';
            document.body.appendChild(toastEl);
        }
        toastEl.innerText = message;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
};

// app.js
function initAssistIASales() {
    window.StorageManager.seedInitialData();

    // Navegação Principal
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = btn.getAttribute('data-view');

            navButtons.forEach(b => b.classList.remove('active'));
            viewSections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(`view-${targetView}`);
            if (targetEl) targetEl.classList.add('active');

            if (pageTitle) pageTitle.innerText = btn.querySelector('span').innerText;

            // Roteamento
            if (targetView === 'dashboard') window.SalesModule.updateDashboardMetrics();
            if (targetView === 'products') window.ProductsModule.renderProductsUI('products-list');
            if (targetView === 'chats') window.ChatsModule.renderChatList('chat-list-container');
            if (targetView === 'recovery') window.RecoveryModule.renderRecoveryUI('recovery-list-container');
            if (targetView === 'customers') window.CustomersModule.renderCustomersUI('customers-list-table');
            if (targetView === 'automations') window.AutomationsModule.renderUI('automations-container');
            if (targetView === 'brain') window.BrainModule.loadToForm();

            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });

    // Iniciar dados na tela
    window.SalesModule.updateDashboardMetrics();
    window.ProductsModule.renderProductsUI('products-list');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistIASales);
} else {
    initAssistIASales();
}
