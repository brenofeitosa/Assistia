// ==========================================
// 1. STORAGE MANAGER
// ==========================================
window.StorageManager = {
    get(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    },
    clearAll() {
        localStorage.clear();
    }
};

// ==========================================
// 2. PRODUCTS MODULE
// ==========================================
window.ProductsModule = {
    getProducts() {
        return StorageManager.get('assistia_products', []);
    },
    saveProduct(product) {
        const products = this.getProducts();
        product.id = product.id || 'prod_' + Date.now();
        products.push(product);
        StorageManager.set('assistia_products', products);
    },
    getProductById(id) {
        return this.getProducts().find(p => p.id === id);
    },
    seedInitialData() {
        if (this.getProducts().length === 0) {
            const initial = [{
                id: 'prod_1',
                name: 'Curso Vendas WhatsApp 24h',
                price: 97.00,
                description: 'Aprenda a estruturar scripts de automação e converter leads no WhatsApp.',
                checkoutUrl: 'https://checkout.exemplo.com/curso',
                targetAudience: 'Empreendedores e Vendedores',
                faqs: 'Tem garantia? Sim, 7 dias.'
            }];
            StorageManager.set('assistia_products', initial);
        }
    },
    renderProductsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const products = this.getProducts();
        container.innerHTML = products.map(p => `
            <div class="card p-3 mb-2">
                <h3>${p.name}</h3>
                <p><strong>Preço:</strong> R$ ${parseFloat(p.price).toFixed(2)}</p>
                <p class="text-sm">${p.description}</p>
            </div>
        `).join('');
    }
};

// ==========================================
// 3. LEADS MODULE
// ==========================================
window.LeadsModule = {
    getLeads() {
        return StorageManager.get('assistia_leads', []);
    },
    saveLead(lead) {
        const leads = this.getLeads();
        const index = leads.findIndex(l => l.id === lead.id);
        if (index >= 0) {
            leads[index] = lead;
        } else {
            leads.push(lead);
        }
        StorageManager.set('assistia_leads', leads);
    },
    getLeadById(id) {
        return this.getLeads().find(l => l.id === id);
    },
    renderLeadsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const leads = this.getLeads();
        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="4">Nenhum lead registrado.</td></tr>`;
            return;
        }
        container.innerHTML = leads.map(l => `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.intent || 'Interesse Geral'}</td>
                <td><span class="badge">${l.status || 'Em atendimento'}</span></td>
                <td>${new Date(l.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
            </tr>
        `).join('');
    }
};

// ==========================================
// 4. SALES MODULE
// ==========================================
window.SalesModule = {
    getSales() {
        return StorageManager.get('assistia_sales', []);
    },
    recordSale(sale) {
        const sales = this.getSales();
        sale.id = 'sale_' + Date.now();
        sale.timestamp = new Date().toISOString();
        sales.push(sale);
        StorageManager.set('assistia_sales', sales);
    },
    updateDashboardMetrics() {
        const sales = this.getSales();
        const leads = LeadsModule.getLeads();

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
                table.innerHTML = `<tr><td colspan="5">Nenhuma venda registrada ainda.</td></tr>`;
            } else {
                table.innerHTML = sales.slice(-5).reverse().map(s => `
                    <tr>
                        <td>${s.leadName || 'Cliente'}</td>
                        <td>${s.productName}</td>
                        <td>R$ ${parseFloat(s.amount).toFixed(2)}</td>
                        <td>${s.type === 'RECOVERY' ? 'Recuperada' : 'Direta'}</td>
                        <td>${new Date(s.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                    </tr>
                `).join('');
            }
        }
    }
};

// ==========================================
// 5. AI ENGINE MODULE
// ==========================================
window.AIEngine = {
    parseProductOffer(text) {
        const priceMatch = text.match(/R\$\s?(\d+[\.,]?\d*)/i);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 97.00;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        return {
            name: lines[0] || 'Oferta Importada',
            price: price,
            checkoutUrl: 'https://checkout.exemplo.com/pay',
            description: lines[1] || 'Descrição da oferta',
            targetAudience: 'Público Geral',
            faqs: 'Dúvidas frequentes'
        };
    },
    generateSalesResponse(input, product) {
        const text = input.toLowerCase();
        const pName = product ? product.name : 'nosso produto';
        const pPrice = product ? `R$ ${parseFloat(product.price).toFixed(2)}` : '';

        if (text.includes('comprar') || text.includes('link') || text.includes('preco') || text.includes('preço') || text.includes('valor')) {
            return {
                text: `Perfeito! O valor do ${pName} é ${pPrice}. Você pode finalizar sua compra com acesso imediato através do link de checkout segurado.`,
                sendCheckout: true,
                intent: 'Compra'
            };
        }
        return {
            text: `Entendi sua dúvida sobre o ${pName}. Esse treinamento foi desenhado exatamente para te ajudar a ter resultados práticos no WhatsApp. Quer garantir sua vaga agora?`,
            sendCheckout: false,
            intent: 'Dúvida'
        };
    }
};

// ==========================================
// 6. RECOVERY MODULE
// ==========================================
window.RecoveryModule = {
    renderRecoveryUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const leads = LeadsModule.getLeads().filter(l => l.checkoutSent && !l.converted);

        if (leads.length === 0) {
            container.innerHTML = `<tr><td colspan="6">Nenhum lead na fila de recuperação.</td></tr>`;
            return;
        }

        container.innerHTML = leads.map(l => `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.productName}</td>
                <td>R$ ${parseFloat(l.productPrice).toFixed(2)}</td>
                <td><span class="badge">${l.status || 'Checkout Enviado'}</span></td>
                <td>${new Date(l.createdAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="window.RecoveryModule.simulateRecovery('${l.id}')">
                        Simular Recuperação
                    </button>
                </td>
            </tr>
        `).join('');
    },
    simulateRecovery(leadId) {
        const lead = LeadsModule.getLeadById(leadId);
        if (!lead) return;
        lead.status = 'Recuperado';
        lead.converted = true;
        LeadsModule.saveLead(lead);

        SalesModule.recordSale({
            leadName: lead.name,
            productName: lead.productName,
            amount: lead.productPrice,
            type: 'RECOVERY'
        });

        this.renderRecoveryUI('recovery-list-table');
        SalesModule.updateDashboardMetrics();
    }
};

// ==========================================
// 7. INICIALIZAÇÃO DA APLICAÇÃO (APP CONTROLLER)
// ==========================================
function startApp() {
    ProductsModule.seedInitialData();
    SalesModule.updateDashboardMetrics();

    let currentSimLead = {
        id: 'lead_' + Date.now(),
        name: 'Cliente Simulado',
        productName: '',
        productPrice: 0,
        checkoutSent: false,
        converted: false,
        createdAt: new Date().toISOString()
    };

    // Navegação entre telas
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

            if (targetView === 'dashboard') SalesModule.updateDashboardMetrics();
            if (targetView === 'products') ProductsModule.renderProductsUI('products-list');
            if (targetView === 'recovery') RecoveryModule.renderRecoveryUI('recovery-list-table');
            if (targetView === 'leads') LeadsModule.renderLeadsUI('leads-list-table');
            if (targetView === 'simulator') loadSimulatorContext();

            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });

    // Mobile Toggle Menu
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }

    // Modal Importação
    const modal = document.getElementById('modal-import');
    const btnOpenImport = document.getElementById('btn-open-import-modal');
    const btnCloseImport = document.getElementById('btn-close-modal');
    const btnProcessIA = document.getElementById('btn-process-ia-import');
    const btnSaveProduct = document.getElementById('btn-save-extracted-product');

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

    if (btnProcessIA) {
        btnProcessIA.addEventListener('click', () => {
            const rawText = document.getElementById('import-raw-text').value;
            if (!rawText.trim()) return alert('Cole o texto da oferta.');

            const extracted = AIEngine.parseProductOffer(rawText);
            document.getElementById('extracted-name').value = extracted.name;
            document.getElementById('extracted-price').value = extracted.price;
            document.getElementById('extracted-checkout').value = extracted.checkoutUrl;
            document.getElementById('extracted-desc').value = extracted.description;

            document.getElementById('import-step-1').classList.add('hidden');
            document.getElementById('import-step-2').classList.remove('hidden');
        });
    }

    if (btnSaveProduct) {
        btnSaveProduct.addEventListener('click', () => {
            ProductsModule.saveProduct({
                name: document.getElementById('extracted-name').value,
                price: parseFloat(document.getElementById('extracted-price').value),
                checkoutUrl: document.getElementById('extracted-checkout').value,
                description: document.getElementById('extracted-desc').value
            });
            modal.classList.remove('active');
            ProductsModule.renderProductsUI('products-list');
            alert('Produto cadastrado!');
        });
    }

    // Simulador Chat
    const simProductSelect = document.getElementById('sim-product-select');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSendMsg = document.getElementById('btn-send-msg');

    function loadSimulatorContext() {
        const products = ProductsModule.getProducts();
        if (simProductSelect) {
            simProductSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} - R$ ${parseFloat(p.price).toFixed(2)}</option>`).join('');
        }
        if (products.length > 0) updateSimProduct(products[0]);
    }

    function updateSimProduct(product) {
        const detailsEl = document.getElementById('sim-product-details');
        if (detailsEl) {
            detailsEl.innerHTML = `<h4>${product.name}</h4><p>R$ ${parseFloat(product.price).toFixed(2)}</p>`;
        }
        currentSimLead.productName = product.name;
        currentSimLead.productPrice = product.price;
    }

    if (simProductSelect) {
        simProductSelect.addEventListener('change', (e) => {
            const p = ProductsModule.getProductById(e.target.value);
            if (p) updateSimProduct(p);
        });
    }

    if (btnSendMsg && chatInput) {
        btnSendMsg.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (!text) return;

            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerText = text;
            chatMessages.appendChild(userMsg);
            chatInput.value = '';

            const pId = simProductSelect ? simProductSelect.value : null;
            const p = ProductsModule.getProductById(pId);
            const res = AIEngine.generateSalesResponse(text, p);

            setTimeout(() => {
                const aiMsg = document.createElement('div');
                aiMsg.className = 'message ai';
                aiMsg.innerText = res.text;
                chatMessages.appendChild(aiMsg);

                if (res.sendCheckout) {
                    currentSimLead.checkoutSent = true;
                    currentSimLead.status = 'Checkout Enviado';
                    LeadsModule.saveLead({...currentSimLead});
                }
            }, 500);
        });
    }

    ProductsModule.renderProductsUI('products-list');
}

// Inicialização imediata sem depender do estado do DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startApp();
} else {
    document.addEventListener('DOMContentLoaded', startApp);
}
