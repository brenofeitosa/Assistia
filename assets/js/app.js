function initAssistIASales() {
    window.ProductsModule.seedInitialData();
    window.SalesModule.updateDashboardMetrics();

    let currentSimLead = {
        id: 'lead_simulado',
        name: 'João (Simulação)',
        productName: '',
        productPrice: 0,
        checkoutSent: false,
        converted: false,
        createdAt: new Date().toISOString()
    };

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

            if (targetView === 'dashboard') window.SalesModule.updateDashboardMetrics();
            if (targetView === 'products') window.ProductsModule.renderProductsUI('products-list');
            if (targetView === 'recovery') window.RecoveryModule.renderRecoveryUI('recovery-list-table');
            if (targetView === 'leads') window.LeadsModule.renderLeadsUI('leads-list-table');
            if (targetView === 'simulator') loadSimulatorContext();

            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });

    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }

    const modal = document.getElementById('modal-import');
    const btnOpenImport = document.getElementById('btn-open-import-modal');
    const btnCloseImport = document.getElementById('btn-close-modal');
    const btnProcessIA = document.getElementById('btn-process-ia-import');
    const btnSaveProduct = document.getElementById('btn-save-extracted-product');
    const btnBackImport = document.getElementById('btn-back-import');

    if (btnOpenImport) {
        btnOpenImport.addEventListener('click', () => {
            document.getElementById('import-step-1').classList.remove('hidden');
            document.getElementById('import-step-2').classList.add('hidden');
            modal.classList.add('active');
        });
    }

    if (btnCloseImport) {
        btnCloseImport.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (btnBackImport) {
        btnBackImport.addEventListener('click', () => {
            document.getElementById('import-step-1').classList.remove('hidden');
            document.getElementById('import-step-2').classList.add('hidden');
        });
    }

    if (btnProcessIA) {
        btnProcessIA.addEventListener('click', () => {
            const rawText = document.getElementById('import-raw-text').value;
            if (!rawText.trim()) {
                alert('Por favor, cole o texto da oferta.');
                return;
            }

            const extracted = window.AIEngine.parseProductOffer(rawText);
            document.getElementById('extracted-name').value = extracted.name;
            document.getElementById('extracted-price').value = extracted.price;
            document.getElementById('extracted-checkout').value = extracted.checkoutUrl;
            document.getElementById('extracted-desc').value = extracted.description;
            document.getElementById('extracted-audience').value = extracted.targetAudience;
            document.getElementById('extracted-faqs').value = extracted.faqs;

            document.getElementById('import-step-1').classList.add('hidden');
            document.getElementById('import-step-2').classList.remove('hidden');
        });
    }

    if (btnSaveProduct) {
        btnSaveProduct.addEventListener('click', () => {
            const newProduct = {
                name: document.getElementById('extracted-name').value,
                price: parseFloat(document.getElementById('extracted-price').value),
                checkoutUrl: document.getElementById('extracted-checkout').value,
                description: document.getElementById('extracted-desc').value,
                targetAudience: document.getElementById('extracted-audience').value,
                faqs: document.getElementById('extracted-faqs').value
            };

            window.ProductsModule.saveProduct(newProduct);
            modal.classList.remove('active');
            window.ProductsModule.renderProductsUI('products-list');
            alert('Produto salvo com sucesso!');
        });
    }

    const simProductSelect = document.getElementById('sim-product-select');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSendMsg = document.getElementById('btn-send-msg');
    const btnResetChat = document.getElementById('btn-reset-chat');

    function loadSimulatorContext() {
        const products = window.ProductsModule.getProducts();
        if (simProductSelect) {
            simProductSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - R$ ${parseFloat(p.price).toFixed(2)}</option>`).join('');
        }
        if (products.length > 0) {
            updateSimulatedProduct(products[0]);
        }
    }

    function updateSimulatedProduct(product) {
        const detailsEl = document.getElementById('sim-product-details');
        if (detailsEl) {
            detailsEl.innerHTML = `
                <h4>${product.name}</h4>
                <p><strong>Preço:</strong> R$ ${parseFloat(product.price).toFixed(2)}</p>
                <p class="text-sm mt-1">${product.description}</p>
            `;
        }
        currentSimLead.productName = product.name;
        currentSimLead.productPrice = product.price;
        resetChat();
    }

    if (simProductSelect) {
        simProductSelect.addEventListener('change', (e) => {
            const p = window.ProductsModule.getProductById(e.target.value);
            if (p) updateSimulatedProduct(p);
        });
    }

    function resetChat() {
        if (chatMessages) {
            chatMessages.innerHTML = `<div class="message ai">Olá! Como posso te ajudar hoje sobre o ${currentSimLead.productName || 'nosso produto'}?</div>`;
        }
        currentSimLead.checkoutSent = false;
        currentSimLead.converted = false;
        currentSimLead.status = 'Em Atendimento';
    }

    if (btnResetChat) btnResetChat.addEventListener('click', resetChat);

    function handleSendMessage() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        appendMsg(text, 'user');
        chatInput.value = '';

        const pId = simProductSelect ? simProductSelect.value : null;
        const product = window.ProductsModule.getProductById(pId);
        const aiResponse = window.AIEngine.generateSalesResponse(text, product);

        setTimeout(() => {
            appendMsg(aiResponse.text, 'ai');
            currentSimLead.intent = aiResponse.intent;

            if (aiResponse.sendCheckout) {
                currentSimLead.checkoutSent = true;
                currentSimLead.status = 'Checkout Enviado';
            }

            window.LeadsModule.saveLead({...currentSimLead});
            window.SalesModule.updateDashboardMetrics();
        }, 500);
    }

    function appendMsg(text, sender) {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerText = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (btnSendMsg) btnSendMsg.addEventListener('click', handleSendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }

    const btnClearDb = document.getElementById('btn-clear-database');
    if (btnClearDb) {
        btnClearDb.addEventListener('click', () => {
            if (confirm('Deseja limpar todos os dados de teste?')) {
                window.StorageManager.clearAll();
                location.reload();
            }
        });
    }

    window.ProductsModule.renderProductsUI('products-list');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistIASales);
} else {
    initAssistIASales();
}
