/**
 * Aplicação Principal - Controlador de UI e Fluxos do AssistIA Sales
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Dados
    ProductsModule.seedInitialData();
    SalesModule.updateDashboardMetrics();

    // Estado da conversa do simulador
    let currentSimLead = {
        id: 'lead_' + Date.now(),
        name: 'Cliente Simulado (WhatsApp)',
        productName: '',
        productPrice: 0,
        checkoutSent: false,
        converted: false,
        createdAt: new Date().toISOString()
    };

    // 2. Navegação Single Page (SPA)
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            
            navButtons.forEach(b => b.classList.remove('active'));
            viewSections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(`view-${targetView}`);
            if (targetEl) targetEl.classList.add('active');

            pageTitle.innerText = btn.querySelector('span').innerText;

            // Handlers por tela
            if (targetView === 'dashboard') SalesModule.updateDashboardMetrics();
            if (targetView === 'products') ProductsModule.renderProductsUI('products-list');
            if (targetView === 'recovery') RecoveryModule.renderRecoveryUI('recovery-list-table');
            if (targetView === 'leads') LeadsModule.renderLeadsUI('leads-list-table');
            if (targetView === 'simulator') loadSimulatorContext();

            // Mobile Auto-Close
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Sidebar Mobile Toggle
    document.getElementById('mobile-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // 3. Modal de Importação com IA
    const modal = document.getElementById('modal-import');
    const btnOpenImport = document.getElementById('btn-open-import-modal');
    const btnCloseImport = document.getElementById('btn-close-modal');
    const btnProcessIA = document.getElementById('btn-process-ia-import');
    const btnSaveProduct = document.getElementById('btn-save-extracted-product');
    const btnBackImport = document.getElementById('btn-back-import');

    btnOpenImport.addEventListener('click', () => {
        document.getElementById('import-step-1').classList.remove('hidden');
        document.getElementById('import-step-2').classList.add('hidden');
        modal.classList.add('active');
    });

    btnCloseImport.addEventListener('click', () => modal.classList.remove('active'));

    let extractedData = null;

    btnProcessIA.addEventListener('click', () => {
        const rawText = document.getElementById('import-raw-text').value;
        if (!rawText.trim()) {
            alert('Por favor, cole o texto da oferta para a IA analisar.');
            return;
        }

        extractedData = AIEngine.parseProductOffer(rawText);

        // Preencher formulário de prévia
        document.getElementById('extracted-name').value = extractedData.name;
        document.getElementById('extracted-price').value = extractedData.price;
        document.getElementById('extracted-checkout').value = extractedData.checkoutUrl;
        document.getElementById('extracted-desc').value = extractedData.description;
        document.getElementById('extracted-audience').value = extractedData.targetAudience;
        document.getElementById('extracted-faqs').value = extractedData.faqs;

        document.getElementById('import-step-1').classList.add('hidden');
        document.getElementById('import-step-2').classList.remove('hidden');
    });

    btnBackImport.addEventListener('click', () => {
        document.getElementById('import-step-1').classList.remove('hidden');
        document.getElementById('import-step-2').classList.add('hidden');
    });

    btnSaveProduct.addEventListener('click', () => {
        const finalProduct = {
            name: document.getElementById('extracted-name').value,
            price: parseFloat(document.getElementById('extracted-price').value),
            checkoutUrl: document.getElementById('extracted-checkout').value,
            description: document.getElementById('extracted-desc').value,
            targetAudience: document.getElementById('extracted-audience').value,
            faqs: document.getElementById('extracted-faqs').value
        };

        ProductsModule.saveProduct(finalProduct);
        modal.classList.remove('active');
        ProductsModule.renderProductsUI('products-list');
        alert('Produto salvo com sucesso!');
    });

    // 4. Lógica do Simulador de Chat
    const simProductSelect = document.getElementById('sim-product-select');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSendMsg = document.getElementById('btn-send-msg');

    function loadSimulatorContext() {
        const products = ProductsModule.getProducts();
        simProductSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - R$ ${parseFloat(p.price).toFixed(2)}</option>`).join('');

        if (products.length > 0) {
            updateSimulatedProductDetails(products[0]);
        }
    }

    function updateSimulatedProductDetails(product) {
        document.getElementById('sim-product-details').innerHTML = `
            <h4>${product.name}</h4>
            <p><strong>Preço:</strong> R$ ${parseFloat(product.price).toFixed(2)}</p>
            <p class="text-sm mt-1">${product.description}</p>
        `;
        document.getElementById('chat-product-title').innerText = `Vendedor IA - ${product.name}`;
        
        currentSimLead.productName = product.name;
        currentSimLead.productPrice = product.price;
        resetChat();
    }

    simProductSelect.addEventListener('change', (e) => {
        const product = ProductsModule.getProductById(e.target.value);
        if (product) updateSimulatedProductDetails(product);
    });

    function resetChat() {
        chatMessages.innerHTML = `
            <div class="message ai">
                Olá! Sou o assistente de vendas. Como posso te ajudar hoje sobre este treinamento?
            </div>
        `;
        currentSimLead.checkoutSent = false;
    }

    document.getElementById('btn-reset-chat').addEventListener('click', resetChat);

    function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Renderiza mensagem do usuário
        appendMessage(text, 'user');
        chatInput.value = '';

        // Obter contexto do produto
        const selectedProdId = simProductSelect.value;
        const productContext = ProductsModule.getProductById(selectedProdId);

        // Processar resposta com Motor IA
        setTimeout(() => {
            const aiResult = AIEngine.generateSalesResponse(text, productContext);
            appendMessage(aiResult.text, 'ai');

            // Atualizar lead e registrar intenção
            currentSimLead.intent = aiResult.intent;
            
            if (aiResult.sendCheckout) {
                currentSimLead.checkoutSent = true;
                currentSimLead.status = 'Checkout Enviado';
                LeadsModule.saveLead({...currentSimLead});
                SalesModule.updateDashboardMetrics();
            } else {
                LeadsModule.saveLead({...currentSimLead});
            }
        }, 600);
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    btnSendMsg.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // 5. Configurações - Reset DB
    document.getElementById('btn-clear-database').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar os dados de teste?')) {
            StorageManager.clearAll();
            location.reload();
        }
    });

    // Render Inicial
    ProductsModule.renderProductsUI('products-list');
});
